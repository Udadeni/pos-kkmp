import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { APP_SETTINGS } from "../constants/settings";
import { Tag, Save, AlertCircle, Calendar, Power } from "lucide-react";

export default function PromoPage() {
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState({
    is_active: false,
    name: "PROMO HARI RAYA",
    percentage: 0,
  });

  useEffect(() => {
    // Kita simpan setting promo di satu dokumen tetap bernama 'current_promo'
    const unsub = onSnapshot(doc(db, "system_settings", "current_promo"), (snap) => {
      if (snap.exists()) setPromo(snap.data());
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "system_settings", "current_promo"), {
        ...promo,
        percentage: Number(promo.percentage),
        updated_at: serverTimestamp()
      });
      alert("Pengaturan Promo Berhasil Disimpan!");
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto min-h-screen bg-gray-50 tracking-tighter">
      <header className="mb-10 font-black italic uppercase">
        <h1 className="text-4xl text-slate-800 leading-none mb-2">Manajemen Promo</h1>
        <p className="text-slate-400 font-bold text-[10px] tracking-widest not-italic font-sans">
          {APP_SETTINGS.ORG_NAME} • Event & Diskon Toko
        </p>
      </header>

      <form onSubmit={handleSave} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${promo.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
              <Power size={24} />
            </div>
            <div>
              <p className="font-black italic uppercase text-lg leading-none">{promo.is_active ? 'Promo Sedang Aktif' : 'Promo Non-Aktif'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans not-italic">Status Mesin Promo</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setPromo({...promo, is_active: !promo.is_active})}
            className={`w-16 h-8 rounded-full transition-all relative ${promo.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${promo.is_active ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        <div className="space-y-6 font-black italic uppercase">
          <div>
            <label className="text-[10px] text-slate-400 ml-2 mb-2 block not-italic font-sans font-bold uppercase tracking-widest">Nama Event Promo</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-indigo-900"
              value={promo.name}
              onChange={(e) => setPromo({...promo, name: e.target.value.toUpperCase()})}
              placeholder="CONTOH: PROMO HUT KOPERASI"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 ml-2 mb-2 block not-italic font-sans font-bold uppercase tracking-widest">Besar Potongan (%)</label>
            <div className="relative">
              <input 
                type="number" 
                required
                max="100"
                min="0"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-3xl text-indigo-600"
                value={promo.percentage}
                onChange={(e) => setPromo({...promo, percentage: e.target.value})}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl text-slate-300">%</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border-2 border-dashed border-amber-200 flex gap-4">
          <AlertCircle className="text-amber-500 shrink-0" />
          <p className="text-[10px] text-amber-700 font-bold font-sans not-italic leading-relaxed uppercase">
            Hati-hati: Jika status AKTIF, maka seluruh transaksi di Kasir (POS) akan otomatis terpotong harganya sesuai persentase di atas.
          </p>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Save size={20} /> {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}