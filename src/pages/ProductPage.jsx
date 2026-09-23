import { useState, useEffect, useMemo } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, writeBatch,
  query, where, orderBy, limit, getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { APP_SETTINGS } from "../constants/settings"; // Import Pusat Komando
import * as XLSX from "xlsx";
import { Search, ChevronLeft, ChevronRight, Package, Edit, Upload, Download } from "lucide-react";

export default function ProductPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyModal, setHistoryModal] = useState({ isOpen: false, product: null, data: [] });
  const openHistory = async (product) => {
    setHistoryModal({ isOpen: true, product, data: [], loading: true });
    try {
      const q = query(
        collection(db, "transactions_purchase_details"),
        where("product_id", "==", product.id), // Ganti dari barcode ke product_id
        orderBy("created_at", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistoryModal(prev => ({ ...prev, data, loading: false }));
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistoryModal(prev => ({ ...prev, loading: false }));
    }
  };
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // State Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "", barcode: "", name: "", category: "", unit: "Pcs", current_sell_price: 0, status: "ACTIVE"
  });

  // State Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importStats, setImportSummary] = useState({ new: 0, update: 0, total: 0 });
  const [importErrors, setImportErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const CATEGORIES = ["Makanan", "Minuman", "Sembako", "Rokok", "Stationery", "Kebersihan", "Produk Bayi", "Obat", "Lainnya"];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "master_products"),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => { if (err.code !== "permission-denied") console.error(err); }
    );
    return () => unsubscribe();
  }, []);

  const standardizeCategory = (input) => {
    if (!input) return "Lainnya";
    const cleanInput = String(input).trim().toLowerCase();
    const match = CATEGORIES.find(c => c.toLowerCase() === cleanInput);
    return match || "Lainnya";
  };

  const downloadTemplate = () => {
    const header = [["barcode", "name", "category", "unit", "current_sell_price"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, "Template_Produk");
    XLSX.writeFile(wb, `Template_Produk_${APP_SETTINGS.ORG_NAME}.xlsx`);
  };

  const handleFileAsync = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(ws);

      const barcodesInFile = new Set();
      const errorsFound = [];
      const analyzedData = [];
      let newCount = 0; let updateCount = 0;
      const existingMap = new Map(products.map(p => [p.barcode, p]));

      rawData.forEach((row, index) => {
        const rowNum = index + 2;
        const bc = String(row.barcode || "").trim();
        const nm = String(row.name || "").trim();

        if (!bc) errorsFound.push(`Baris ${rowNum}: Barcode kosong.`);
        if (!nm) errorsFound.push(`Baris ${rowNum}: Nama produk kosong.`);
        if (bc && barcodesInFile.has(bc)) errorsFound.push(`Baris ${rowNum}: Barcode duplikat "${bc}" di file.`);

        barcodesInFile.add(bc);
        const exists = existingMap.get(bc);
        const action = exists ? "UPDATE" : "BARU";
        if (action === "BARU") newCount++; else updateCount++;

        analyzedData.push({ ...row, barcode: bc, name: nm, action, category: standardizeCategory(row.category) });
      });

      setImportErrors(errorsFound);
      setImportPreview(analyzedData);
      setImportSummary({ new: newCount, update: updateCount, total: rawData.length });
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (importErrors.length > 0) return alert("Perbaiki file dahulu.");
    setIsImporting(true);
    const existingMap = new Map(products.map(p => [p.barcode, p.id]));
    const totalData = importPreview.length;
    const CHUNK_SIZE = 500;

    try {
      for (let i = 0; i < totalData; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        const chunk = importPreview.slice(i, i + CHUNK_SIZE);
        chunk.forEach((row) => {
          const productData = {
            barcode: row.barcode,
            name: row.name,
            category: row.category,
            unit: row.unit || "Pcs",
            current_sell_price: Number(row.current_sell_price || 0),
            status: "ACTIVE",
            updated_at: serverTimestamp(),
            updated_by: user.uid
          };
          if (existingMap.has(row.barcode)) {
            batch.update(doc(db, "master_products", existingMap.get(row.barcode)), productData);
          } else {
            batch.set(doc(collection(db, "master_products")), { ...productData, current_stock: 0, current_avg_cost: 0, created_at: serverTimestamp(), created_by: user.uid });
          }
        });
        await batch.commit();
        setImportProgress(Math.min(Math.round(((i + CHUNK_SIZE) / totalData) * 100), 100));
      }
      alert("Import Berhasil!");
      setIsImportModalOpen(false);
      setImportPreview([]);
    } catch (err) { alert(err.message); } finally { setIsImporting(false); }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm));
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const duplicate = products.find(p => p.barcode === formData.barcode && p.id !== formData.id);
    if (duplicate) return alert("Barcode sudah digunakan.");
    try {
      const data = {
        barcode: formData.barcode.trim(),
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        current_sell_price: Number(formData.current_sell_price),
        status: formData.status,
        updated_at: serverTimestamp(),
        updated_by: user.uid
      };
      if (formData.id) { await updateDoc(doc(db, "master_products", formData.id), data); }
      else { await addDoc(collection(db, "master_products"), { ...data, current_stock: 0, current_avg_cost: 0, created_at: serverTimestamp(), created_by: user.uid }); }
      setIsModalOpen(false);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-10 text-center uppercase font-black text-slate-300">Loading Data...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen tracking-tighter">
      {/* HEADER - REVISED TO BE DYNAMIC */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div className="font-black italic uppercase">
          <h1 className="text-3xl text-indigo-900 leading-none">Master Produk</h1>
          <p className="text-[10px] text-gray-400 tracking-[0.3em] mt-2 not-italic font-sans font-bold">
            {APP_SETTINGS.ORG_NAME} • {APP_SETTINGS.ORG_REGION}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-200 transition">Template</button>
          <button onClick={() => setIsImportModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-700 transition">Import Excel</button>
          <button onClick={() => { setFormData({ id: "", barcode: "", name: "", category: "", unit: "Pcs", current_sell_price: 0, status: "ACTIVE" }); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-indigo-700 transition">+ Produk Baru</button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input type="text" placeholder="Cari Produk (Nama / Barcode)..." className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition font-bold" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-slate-400">Tampilkan:</span>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border-none p-3 rounded-xl font-black text-xs text-indigo-900 focus:ring-4 focus:ring-indigo-100">
            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[3rem] shadow-xl border overflow-hidden border-slate-100 mb-20">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest">
            <tr>
              <th className="p-3">Barcode</th>
              <th className="p-3">Nama Produk</th>
              <th className="p-3 text-center">Kategori</th>
              <th className="p-3 text-right">Stok</th>
              <th className="p-3 text-right">Harga Jual</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3">Quick Info</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedProducts.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50/50 transition ${p.status === 'INACTIVE' ? 'opacity-40 grayscale' : ''}`}>
                <td className="p-3 font-mono font-bold text-xs text-slate-400">{p.barcode}</td>
                <td className="p-1.5 font-black text-slate-700 uppercase text-xs">{p.name}</td>
                <td className="p-1.5 text-center"><span className="bg-slate-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-slate-500">{p.category}</span></td>
                <td className={`p-1.5 text-right font-black ${p.current_stock < 5 ? 'text-red-500' : 'text-slate-400'}`}>{p.current_stock} {p.unit}</td>
                <td className="p-1.5 text-right font-black text-indigo-600">Rp {p.current_sell_price?.toLocaleString('id-ID')}</td>
                <td className="p-1.5 text-center"><span className={`px-3 py-1.5 rounded-full text-[9px] font-black ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{p.status}</span></td>
                <td className="p-1.5 text-xs">
                  <div className="font-bold text-slate-700">Rp {p.last_buy_price?.toLocaleString() || '-'}</div>
                  <div className="text-[9px] text-slate-400">{p.last_supplier || 'N/A'}</div>
                </td>
                <td className="p-1 pr-1 text-center">
                  <div className="flex flex-col gap-1 w-16 mx-auto">
                    <button onClick={() => { setFormData({ ...p }); setIsModalOpen(true); }} className="bg-slate-100 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-lg text-indigo-600 font-black uppercase text-[9px] transition-all">Edit</button>
                    <button onClick={() => openHistory(p)} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded-lg text-indigo-600 font-black uppercase text-[9px] transition-all">History</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
          <span>Halaman {currentPage} dari {totalPages || 1}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-white border rounded-xl shadow-sm disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-all"><ChevronLeft size={16} /></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-white border rounded-xl shadow-sm disabled:opacity-30 hover:bg-indigo-600 hover:text-white transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* MODAL IMPORT (DENGAN TEMA BAPAK) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-black italic uppercase">
            <div className="p-8 border-b flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-2xl leading-none">🚀 Import Data Produk</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white font-bold text-xl hover:rotate-90 transition-all">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 not-italic font-sans">
              <div className="border-4 border-dashed border-indigo-100 rounded-[2rem] p-10 text-center mb-6 bg-slate-50">
                <input type="file" accept=".xlsx, .csv" onChange={handleFileAsync} className="hidden" id="excelInput" />
                <label htmlFor="excelInput" className="cursor-pointer text-indigo-600 font-black text-xl underline tracking-tight">Pilih File Excel</label>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Gunakan format kolom: barcode, name, category, unit, current_sell_price</p>
              </div>
              {importErrors.length > 0 && <div className="bg-red-50 p-6 rounded-2xl mb-4 text-[10px] text-red-500 font-bold border border-red-100">{importErrors.map((e, i) => <p key={i}>• {e}</p>)}</div>}
              {importPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mb-6 text-center font-black uppercase italic">
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-green-600">Produk Baru: {importStats.new}</div>
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-orange-600">Update Harga: {importStats.update}</div>
                  <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 text-slate-500">Total Baris: {importStats.total}</div>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t">
              {isImporting && <div className="w-full bg-slate-200 h-3 rounded-full mb-6 overflow-hidden shadow-inner"><div className="bg-indigo-600 h-full transition-all" style={{ width: `${importProgress}%` }}></div></div>}
              <button disabled={isImporting || importPreview.length === 0 || importErrors.length > 0} onClick={processImport} className="w-full bg-indigo-600 text-white p-5 rounded-[2rem] font-black uppercase shadow-xl disabled:bg-slate-200 hover:bg-indigo-700 transition-all text-sm tracking-widest">{isImporting ? `Memproses ${importProgress}%...` : "Konfirmasi & Mulai Import"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM (DENGAN TEMA BAPAK) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl overflow-hidden font-black italic uppercase">
            <h2 className="text-3xl text-indigo-900 mb-8 leading-none">{formData.id ? "✍️ Edit Produk" : "📦 Produk Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6 not-italic font-sans">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Barcode / Kode Item</label>
                <input type="text" disabled={!!formData.id} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-mono font-bold disabled:bg-slate-100 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" required value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap Produk</label>
                <input type="text" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-black uppercase focus:ring-4 focus:ring-indigo-100 outline-none transition-all" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                  <select className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Pilih...</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Satuan</label>
                  <select className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                    <option value="Pcs">Pcs</option><option value="Box">Box</option><option value="Kg">Kg</option><option value="Liter">Liter</option><option value="Sachet">Sachet</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Harga Jual (Rp)</label>
                  <input type="number" className="w-full bg-indigo-50 border-none p-4 rounded-2xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" required value={formData.current_sell_price} onChange={e => setFormData({ ...formData, current_sell_price: e.target.value })} /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status Stok</label>
                  <select className="w-full bg-slate-50 border-none p-4 rounded-2xl font-black focus:ring-4 focus:ring-indigo-100 outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="ACTIVE">AKTIF</option><option value="INACTIVE">NON-AKTIF</option>
                  </select></div>
              </div>
              <div className="flex gap-4 pt-6 font-black uppercase italic">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 text-xs text-slate-400">Batal</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white p-5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all text-xs tracking-widest">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-black italic uppercase mb-4 text-indigo-900">History Harga: {historyModal.product.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-400 border-b">
                  <tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Supplier</th><th className="p-2 text-right">Harga Beli</th><th className="p-2 text-right">Avg Cost</th></tr>
                </thead>
                <tbody>
                  {historyModal.loading ? <tr><td colSpan="4" className="text-center p-4 text-slate-400 italic">Memuat...</td></tr> :
                    historyModal.data.map(h => (
                      <tr key={h.id} className="border-b font-mono">
                        <td className="p-2 text-slate-600">{h.created_at?.toDate().toLocaleDateString('id-ID')}</td>
                        <td className="p-2 text-slate-600">{h.supplier_name || '-'}</td>
                        <td className="p-2 text-right text-slate-900 font-bold">Rp {h.buy_price?.toLocaleString()}</td>
                        <td className="p-2 text-right text-indigo-600 font-bold">Rp {h.new_avg_cost?.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setHistoryModal({ isOpen: false, product: null, data: [] })} className="mt-8 w-full p-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-700 transition">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}