import { useState, useEffect } from "react";
import { 
  collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Plus, Edit2, Trash2, Truck, Phone, MapPin, User, FileText, CheckCircle, XCircle 
} from "lucide-react";

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State sesuai "Target Produksi"
  const [formData, setFormData] = useState({
    supplier_code: "",
    name: "",
    contact_person: "",
    phone: "",
    address: "",
    status: "ACTIVE",
    notes: ""
  });

  useEffect(() => {
    const q = query(collection(db, "master_suppliers"), orderBy("name", "asc"));
    return onSnapshot(q, (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setFormData({
        supplier_code: supplier.supplier_code || "",
        name: supplier.name || "",
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        status: supplier.status || "ACTIVE",
        notes: supplier.notes || ""
      });
      setEditingId(supplier.id);
    } else {
      // Generate kode otomatis jika baru (Contoh: SUPP-20230623-01)
      const newCode = `SUP-${Date.now().toString().slice(-6)}`;
      setFormData({
        supplier_code: newCode,
        name: "",
        contact_person: "",
        phone: "",
        address: "",
        status: "ACTIVE",
        notes: ""
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        // UPDATE
        const ref = doc(db, "master_suppliers", editingId);
        await updateDoc(ref, {
          ...formData,
          updated_at: serverTimestamp()
        });
      } else {
        // CREATE NEW
        await addDoc(collection(db, "master_suppliers"), {
          ...formData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic text-indigo-900 uppercase tracking-tighter leading-none">Master Supplier</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manajemen Rantai Pasok Koperasi</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Tambah Supplier
        </button>
      </div>

      {/* TABLE SUPPLIER */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-5">Kode & Nama</th>
              <th className="p-5 text-center">Kontak Person</th>
              <th className="p-5 text-center">Status</th>
              <th className="p-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold uppercase text-[11px]">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Truck size={20}/></div>
                    <div>
                      <p className="text-slate-900 leading-tight">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono tracking-tighter">{s.supplier_code}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-center">
                   <p className="text-slate-700">{s.contact_person || "-"}</p>
                   <p className="text-[9px] text-indigo-500 lowercase font-mono">{s.phone}</p>
                </td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"><Edit2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL INPUT SUPPLIER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
               <h3 className="font-black uppercase italic tracking-tighter">Detail Supplier</h3>
               <button onClick={() => setIsModalOpen(false)}><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Kode Supplier (Otomatis)</label>
                    <input type="text" readOnly className="w-full p-3 bg-slate-50 border-none rounded-2xl font-mono text-xs text-slate-400" value={formData.supplier_code} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nama Perusahaan / Toko</label>
                    <input required type="text" className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nama Sales / CP</label>
                    <input type="text" className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">No. Telepon / WA</label>
                    <input type="text" className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Alamat Kantor/Gudang</label>
                    <textarea rows="3" className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Status Kerjasama</label>
                    <select className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ACTIVE">AKTIF / BEKERJASAMA</option>
                      <option value="INACTIVE">NON-AKTIF</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Catatan Internal</label>
                    <input type="text" className="w-full p-3 bg-slate-100 border-none rounded-2xl font-black text-xs uppercase" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
               </div>

               <div className="md:col-span-2 pt-4">
                  <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                    {loading ? "Menyimpan..." : "Simpan Data Supplier"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}