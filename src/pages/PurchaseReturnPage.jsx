import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { returnService } from "../services/returnService";
import { Trash2, Save, Search, ArrowDown, RotateCcw } from "lucide-react";

export default function PurchaseReturnPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  const [header, setHeader] = useState({
    supplier_id: "",
    return_date: new Date().toISOString().split('T')[0],
    reason: ""
  });

  const [entry, setTempEntry] = useState({
    product_id: "",
    product_name: "",
    barcode: "",
    qty: 1,
    buy_price: 0
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "master_products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== "INACTIVE"));
    });
    const unsubSupp = onSnapshot(collection(db, "master_suppliers"), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProd(); unsubSupp(); };
  }, []);

  const searchResults = useMemo(() => {
    if (!entry.barcode || entry.product_id) return [];
    return products.filter(p => 
      p.barcode.includes(entry.barcode) || 
      p.name.toLowerCase().includes(entry.barcode.toLowerCase())
    ).slice(0, 5);
  }, [products, entry.barcode, entry.product_id]);

  const selectProduct = (p) => {
    setTempEntry({
      ...entry,
      product_id: p.id,
      product_name: p.name,
      barcode: p.barcode,
      buy_price: p.last_buy_price || p.current_avg_cost || 0
    });
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const pushToTable = () => {
    if (!entry.product_id || entry.qty <= 0) return;
    const existingIdx = items.findIndex(i => i.product_id === entry.product_id);
    if (existingIdx >= 0) {
      const newItems = [...items];
      newItems[existingIdx].qty += Number(entry.qty);
      newItems[existingIdx].line_total = newItems[existingIdx].qty * newItems[existingIdx].buy_price;
      setItems(newItems);
    } else {
      setItems([...items, { ...entry, line_total: entry.qty * entry.buy_price }]);
    }
    setTempEntry({ product_id: "", product_name: "", barcode: "", qty: 1, buy_price: 0 });
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSaveReturn = async () => {
    if (!header.supplier_id || !header.reason || items.length === 0) {
      return alert("Mohon lengkapi Supplier, Alasan Retur, dan minimal 1 item!");
    }
    setLoading(true);
    try {
      const targetSupplier = suppliers.find(s => s.id === header.supplier_id);
      await returnService.processPurchaseReturn({
        ...header,
        supplier_name: targetSupplier?.name,
        items,
        user
      });
      alert("Retur Pembelian Berhasil Diproses! Stok telah berkurang.");
      setItems([]);
      setHeader({ ...header, reason: "" });
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800">
      <div className="mb-6">
        <h1 className="text-2xl font-black italic text-red-700 uppercase tracking-tighter">Retur Pembelian (Ke Supplier)</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-red-500/60">Pengurangan Stok Barang Rusak / Salah</p>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-50 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="supplier" className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Supplier Tujuan</label>
          <select id="supplier" className="w-full border-2 border-slate-50 p-2 rounded-xl bg-slate-50 font-bold outline-none focus:border-red-500"
            value={header.supplier_id} onChange={e => setHeader({...header, supplier_id: e.target.value})}>
            <option value="">-- Pilih Supplier --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="return_date" className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Tgl Retur</label>
          <input id="return_date" type="date" className="w-full border-2 border-slate-50 p-2 rounded-xl outline-none focus:border-red-500 font-bold"
            value={header.return_date} onChange={e => setHeader({...header, return_date: e.target.value})} />
        </div>
        <div>
          <label htmlFor="reason" className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Alasan Retur</label>
          <input id="reason" type="text" placeholder="MISAL: BARANG RUSAK / EXPIRED" className="w-full border-2 border-slate-50 p-2 rounded-xl outline-none focus:border-red-500 font-bold uppercase"
            value={header.reason} onChange={e => setHeader({...header, reason: e.target.value})} />
        </div>
      </div>

      {/* ENTRY BAR */}
      <div className="bg-slate-800 p-4 rounded-3xl shadow-xl mb-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative">
        <div className="md:col-span-8 relative">
          <label className="text-[9px] font-black text-red-300 uppercase ml-2 mb-1 block tracking-widest">Cari Barang yang Akan Dikembalikan</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input ref={searchInputRef} type="text" placeholder="Ketik nama produk..."
              className="w-full p-2.5 pl-10 rounded-xl bg-slate-700 border-none text-white font-bold outline-none focus:ring-2 focus:ring-red-500"
              value={entry.barcode} onChange={e => setTempEntry({...entry, barcode: e.target.value, product_id: ""})}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl mt-1 z-50 overflow-hidden border border-slate-200">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-red-50 flex justify-between items-center border-b last:border-0 transition">
                  <div>
                    <p className="font-bold text-[10px] text-slate-500 uppercase leading-tight">{p.name}</p>
                    <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">{p.barcode} <span className="text-[10px] text-red-500 ml-2">STOK: {p.current_stock}</span></p>
                  </div>
                  <ArrowDown size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-red-300 uppercase ml-2 mb-1 block tracking-widest">Qty Retur</label>
          <input ref={qtyInputRef} type="number" className="w-full p-2.5 rounded-xl bg-slate-700 border-none text-white font-black outline-none focus:ring-2 focus:ring-red-500 text-center"
            value={entry.qty} onFocus={(e) => e.target.select()} onChange={e => setTempEntry({...entry, qty: Number(e.target.value)})}
            onKeyDown={e => e.key === 'Enter' && pushToTable()}
          />
        </div>
        <div className="md:col-span-2">
           <button onClick={pushToTable} className="w-full bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition active:scale-95">Tambah</button>
        </div>
      </div>

      {/* TABLE ITEMS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="p-4 text-center">#</th>
              <th className="p-4">Produk</th>
              <th className="p-4 text-center">Qty Retur</th>
              <th className="p-4 text-right">Nilai Satuan</th>
              <th className="p-4 text-right">Total Nilai</th>
              <th className="p-4 text-center">Hapus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-red-50 transition">
                <td className="p-4 font-bold text-slate-300 text-center">{idx + 1}</td>
                <td className="p-4">
                  <p className="font-black text-slate-700 uppercase text-xs">{item.product_name}</p>
                  <p className="text-[9px] font-mono text-slate-400">{item.barcode}</p>
                </td>
                <td className="p-4 text-center font-black text-red-600">-{item.qty}</td>
                <td className="p-4 text-right font-bold">Rp {item.buy_price.toLocaleString()}</td>
                <td className="p-4 text-right font-black">Rp {item.line_total.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-200 hover:text-red-500 transition"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSaveReturn} disabled={loading || items.length === 0}
        className="w-full bg-slate-900 hover:bg-red-700 text-white p-5 rounded-[2rem] font-black text-lg shadow-xl transition disabled:bg-slate-200 uppercase tracking-widest flex items-center justify-center gap-3">
        {loading ? "PROSES..." : <><RotateCcw size={24}/> Posting Retur Pembelian</>}
      </button>
    </div>
  );
}