import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { adjustmentService } from "../services/adjustmentService";
import { APP_SETTINGS } from "../constants/settings";
import { 
  Search, CheckCircle2, AlertCircle, RefreshCw, Package, Scale, FileText, X 
} from "lucide-react";

export default function StockOpnamePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalQty, setPhysicalQty] = useState("");
  const [reason, setReason] = useState("");
  const dropdownRef = useRef(null);

  // 1. LOAD DATA MASTER
  useEffect(() => {
    return onSnapshot(collection(db, "master_products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== "INACTIVE"));
    });
  }, []);

  // 2. CLOSE DROPDOWN ON CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. LOGIKA FILTER (PADAT)
  const suggestions = useMemo(() => {
    if (!search || selectedProduct) return [];
    const term = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.includes(term))
    ).slice(0, 8); // Tampilkan max 8 biar padat
  }, [products, search, selectedProduct]);

  const handleSelect = (p) => {
    setSelectedProduct(p);
    setSearch(p.name.toUpperCase());
    setShowList(false);
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setSearch("");
    setPhysicalQty("");
    setReason("");
  };

  const handleSave = async () => {
    if (!selectedProduct || physicalQty === "" || !reason) {
      return alert("Mohon isi Jumlah Fisik dan Alasan!");
    }
    if (!window.confirm(`Konfirmasi penyesuaian stok ${selectedProduct.name}?`)) return;

    setLoading(true);
    try {
      await adjustmentService.processAdjustment({
        product_id: selectedProduct.id,
        physical_stock: physicalQty,
        reason: reason,
        user: user
      });
      alert("Opname Berhasil! Data Sinkron.");
      handleReset();
    } catch (e) {
      alert("Gagal: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800 tracking-tighter uppercase italic font-black">
      {/* HEADER COMPACT */}
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl text-indigo-900 leading-none">Stock Opname</h1>
          <p className="text-[9px] text-slate-400 tracking-[0.2em] not-italic font-sans font-bold uppercase mt-1">
             {APP_SETTINGS.ORG_NAME} • Audit Inventaris
          </p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-visible relative">
        {/* STEP 1: PENCARIAN (ON TOP LOGIC) */}
        <div className="p-8 border-b border-slate-50 relative" ref={dropdownRef}>
          <label className="text-[9px] font-black uppercase text-indigo-500 mb-2 ml-2 block tracking-widest font-sans not-italic">
            1. Cari Produk (Barcode / Nama)
          </label>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="KETIK DI SINI..." 
              className="w-full pl-14 pr-12 py-4 bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 rounded-2xl font-black text-base outline-none transition-all uppercase italic" 
              value={search} 
              onFocus={() => setShowList(true)}
              onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); setShowList(true); }} 
            />
            {search && (
              <button onClick={handleReset} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            )}

            {/* DROPDOWN HASIL FILTER (ON TOP & COMPACT) */}
            {showList && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl mt-2 z-[100] border border-indigo-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                {suggestions.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => handleSelect(p)} 
                    className="w-full text-left px-5 py-3 hover:bg-indigo-600 hover:text-white flex justify-between items-center border-b border-slate-50 last:border-0 transition-all group"
                  >
                    <div className="leading-tight">
                      <p className="font-black text-xs uppercase italic">{p.name}</p>
                      <p className="text-[9px] opacity-60 font-mono not-italic tracking-tighter">{p.barcode || 'TANPA BARCODE'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase opacity-40 group-hover:text-white block">Stok Sistem</span>
                      <span className="text-sm font-black font-mono tracking-tighter">{p.current_stock}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: FORM (PADAT) */}
        {selectedProduct && (
          <div className="p-8 animate-in slide-in-from-bottom duration-500 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SISI KIRI: INFO STOK */}
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white relative overflow-hidden shadow-xl border-b-8 border-slate-950">
                  <div className="relative z-10">
                    <p className="text-[9px] font-bold uppercase text-slate-500 mb-1 tracking-widest font-sans not-italic">Stok Sistem Saat Ini</p>
                    <p className="text-5xl font-black font-mono tracking-tighter">{selectedProduct.current_stock}</p>
                  </div>
                  <Package className="absolute -right-6 -bottom-6 text-white/5" size={140} />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 block tracking-widest font-sans not-italic">2. Hitungan Fisik Riil</label>
                  <input 
                    type="number" 
                    className="w-full p-5 bg-amber-50 border-none rounded-2xl text-4xl font-black text-amber-700 outline-none focus:ring-8 focus:ring-amber-100 transition-all font-mono" 
                    placeholder="0" 
                    value={physicalQty} 
                    onChange={(e) => setPhysicalQty(e.target.value)} 
                    autoFocus 
                  />
                </div>
              </div>

              {/* SISI KANAN: ANALISA & ALASAN */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border-4 border-dashed border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${Number(physicalQty) - selectedProduct.current_stock < 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {Number(physicalQty) - selectedProduct.current_stock < 0 ? <AlertCircle size={28}/> : <CheckCircle2 size={28}/>}
                      </div>
                      <div>
                        <p className="text-3xl font-black font-mono leading-none">
                          {physicalQty !== "" ? (Number(physicalQty) - selectedProduct.current_stock) : "---"}
                        </p>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest font-sans not-italic mt-1">Selisih Unit</p>
                      </div>
                   </div>
                   <Scale className="text-slate-100" size={40} />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 block tracking-widest font-sans not-italic">3. Alasan Penyesuaian</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-indigo-100 cursor-pointer" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="">-- PILIH ALASAN --</option>
                    <option value="BARANG RUSAK / EXPIRED">BARANG RUSAK / EXPIRED</option>
                    <option value="BARANG HILANG / DICURI">BARANG HILANG / DICURI</option>
                    <option value="KESALAHAN INPUT KASIR">SALAH INPUT KASIR</option>
                    <option value="BONUS / SAMPLE SUPPLIER">BONUS DARI SUPPLIER</option>
                    <option value="LAINNYA">LAIN-LAIN</option>
                  </select>
                </div>
              </div>
            </div>

            {/* INFO FOOTER COMPACT */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <FileText className="text-indigo-600 shrink-0" size={16}/><p className="text-[8px] text-indigo-900 font-bold uppercase leading-tight not-italic font-sans">Sistem menggunakan protokol **Transaction Atomic** (Rekomendasi Gemini Audit) untuk menjamin sinkronisasi mutlak antara stok fisik dan laporan akuntansi.</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-8 flex gap-3">
              <button onClick={handleReset} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batalkan</button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="flex-[2.5] py-4 rounded-2xl font-black text-[10px] uppercase bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} 
                {loading ? "PROSES SINKRON..." : "VALIDASI & UPDATE STOK"}
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE COMPACT */}
        {!selectedProduct && (
          <div className="py-24 text-center text-slate-200">
            <Package size={60} className="mx-auto mb-4 opacity-5 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Siapkan Fisik Barang & Mulai Audit</p>
          </div>
        )}
      </div>
    </div>
  );
}