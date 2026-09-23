import { useState, useEffect, useMemo, useRef } from "react";
import { 
  collection, onSnapshot, query, where, getDocs, orderBy, limit 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { purchaseService } from "../services/purchaseService"; 
import { Trash2, Save, Search, ArrowDown, PackageSearch } from "lucide-react";

export default function PurchasePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const priceInputRef = useRef(null);

  const [header, setHeader] = useState({
    supplier_id: "", invoice_number: "",
    purchase_date: new Date().toISOString().split('T')[0],
    payment_method: "CASH"
  });

  const [entry, setTempEntry] = useState({
    product_id: "", product_name: "", barcode: "", qty: 1, cost_price: 0
  });

  const [items, setItems] = useState([]);

  // --- HELPER FORMATTING (TETAP SAKRAL) ---
  const formatGrouping = (val) => {
    if (!val || val === 0) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseRaw = (val) => {
    if (typeof val === 'number') return val;
    return Number(val.replace(/\./g, "").replace(/[^0-9]/g, ""));
  };

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
    return products.filter(p => p.barcode.includes(entry.barcode) || p.name.toLowerCase().includes(entry.barcode.toLowerCase())).slice(0, 5);
  }, [products, entry.barcode, entry.product_id]);

  const selectProduct = (p) => {
    setTempEntry({ ...entry, product_id: p.id, product_name: p.name, barcode: p.barcode, cost_price: p.current_avg_cost || p.cost_price || 0 });
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  // --- LOGIKA PUSH TABLE DENGAN REVERSE (TETAP SAKRAL) ---
  const pushToTable = () => {
    if (!entry.product_id || entry.qty <= 0) return;
    
    const existingIdx = items.findIndex(i => i.product_id === entry.product_id);
    let newItems = [...items];

    if (existingIdx >= 0) {
      newItems[existingIdx].qty += Number(entry.qty);
      newItems[existingIdx].cost_price = Number(entry.cost_price);
      newItems[existingIdx].line_total = newItems[existingIdx].qty * newItems[existingIdx].cost_price;
    } else {
      newItems.unshift({ ...entry, line_total: entry.qty * entry.cost_price });
    }

    setItems(newItems);
    setTempEntry({ product_id: "", product_name: "", barcode: "", qty: 1, cost_price: 0 });
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const totals = useMemo(() => {
    const amount = items.reduce((sum, i) => sum + i.line_total, 0);
    return { amount, count: items.length };
  }, [items]);

  const handleSavePurchase = async () => {
    if (!header.supplier_id || !header.invoice_number || items.length === 0) return alert("Lengkapi data!");
    setLoading(true);
    try {
      const targetSupplier = suppliers.find(s => s.id === header.supplier_id);
      await purchaseService.processPurchase({
        items: items.map(i => ({ id: i.product_id, name: i.product_name, qty: i.qty, buy_price: i.cost_price })),
        supplier_id: header.supplier_id,
        supplier_name: targetSupplier?.name || "UMUM",
        invoice_number: header.invoice_number.trim(),
        purchase_date: header.purchase_date,
        payment_method: header.payment_method,
        user
      });
      alert("Pembelian Berhasil Diposting!");
      setItems([]);
      setHeader({ ...header, invoice_number: "" });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-4 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800 tracking-tighter uppercase italic font-black">
      <div className="mb-8">
        <h1 className="text-3xl text-indigo-900 leading-none">Input Barang Masuk</h1>
        <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 not-italic font-sans uppercase">Manajemen Stok & Inventori Toko</p>
      </div>

      <div className="animate-in fade-in duration-300">
        {/* SECTION 1: HEADER NOTA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1"><label className="text-[9px] text-slate-400 mb-1 block">Supplier</label><select className="w-full border-2 border-slate-50 p-2 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 font-black" value={header.supplier_id} onChange={e => setHeader({...header, supplier_id: e.target.value})}><option value="">-- PILIH --</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="md:col-span-1"><label className="text-[9px] text-slate-400 mb-1 block">No. Faktur</label><input type="text" className="w-full border-2 border-slate-50 p-2 rounded-xl outline-none focus:border-indigo-500 font-black" value={header.invoice_number} onChange={e => setHeader({...header, invoice_number: e.target.value})} placeholder="INV/..." /></div>
          <div className="md:col-span-1"><label className="text-[9px] text-slate-400 mb-1 block">Tgl Nota</label><input type="date" className="w-full border-2 border-slate-50 p-2 rounded-xl outline-none focus:border-indigo-500 font-black" value={header.purchase_date} onChange={e => setHeader({...header, purchase_date: e.target.value})} /></div>
          <div className="md:col-span-1"><label className="text-[9px] text-slate-400 mb-1 block">Cara Bayar</label><select className={`w-full border-2 p-2 rounded-xl transition font-black ${header.payment_method === 'CASH' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`} value={header.payment_method} onChange={e => setHeader({...header, payment_method: e.target.value})}><option value="CASH">💵 TUNAI</option><option value="CREDIT">⏳ KONSINYASI</option></select></div>
          <div className="bg-indigo-50 p-2 rounded-xl text-center border border-indigo-100"><p className="text-[8px] text-indigo-400 font-sans not-italic">Total Faktur</p><p className="text-lg text-indigo-700 font-mono">Rp {totals.amount.toLocaleString()}</p></div>
        </div>

        {/* SECTION 2: ENTRY BAR */}
        <div className="bg-slate-800 p-4 rounded-3xl shadow-xl mb-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative">
          <div className="md:col-span-5 relative">
            <label className="text-[9px] text-indigo-300 ml-2 mb-1 block tracking-widest uppercase">1. Cari Nama / Scan Barcode</label>
            <div className="relative"><Search className="absolute left-3 top-3 text-slate-500" size={16} /><input ref={searchInputRef} type="text" placeholder="Ketik nama produk..." className="w-full p-2.5 pl-10 rounded-xl bg-slate-700 border-none text-white outline-none focus:ring-2 focus:ring-indigo-500 font-black uppercase" value={entry.barcode} onChange={e => setTempEntry({...entry, barcode: e.target.value, product_id: ""})} /></div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl mt-1 z-50 overflow-hidden border border-slate-200">
                {searchResults.map(p => (<button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-indigo-50 flex justify-between items-center border-b last:border-0 transition text-slate-800 not-italic"><div><p className="font-black text-xs uppercase">{p.name}</p><p className="text-[10px] text-slate-400 font-mono tracking-tighter">[{p.barcode}] Stok: {p.current_stock}</p></div><ArrowDown size={14} className="text-slate-300" /></button>))}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
             <label className="text-[9px] text-indigo-300 ml-2 mb-1 block uppercase">2. Qty</label>
             <input 
                ref={qtyInputRef} 
                type="text" 
                inputMode="numeric"
                className="w-full p-2.5 rounded-xl bg-slate-700 border-none text-white text-center outline-none focus:ring-2 focus:ring-indigo-500 font-black" 
                value={entry.qty} 
                onFocus={(e) => e.target.select()} 
                onChange={e => setTempEntry({...entry, qty: parseRaw(e.target.value)})} 
                onKeyDown={e => e.key === 'Enter' && priceInputRef.current?.focus()} 
             />
          </div>
          <div className="md:col-span-3">
             <label className="text-[9px] text-indigo-300 ml-2 mb-1 block uppercase">3. Harga Beli</label>
             <input 
                ref={priceInputRef} 
                type="text" 
                inputMode="numeric"
                className="w-full p-2.5 rounded-xl bg-slate-700 border-none text-white outline-none focus:ring-2 focus:ring-indigo-500 font-black" 
                value={formatGrouping(entry.cost_price)} 
                onFocus={(e) => e.target.select()}
                onChange={e => setTempEntry({...entry, cost_price: parseRaw(e.target.value)})} 
                onKeyDown={e => e.key === 'Enter' && pushToTable()} 
             />
          </div>
          <div className="md:col-span-2"><button onClick={pushToTable} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl text-[10px] shadow-lg transition active:scale-95">TAMBAH ITEM</button></div>
        </div>

        {/* SECTION 3: TABLE ITEMS (BARU DI ATAS) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[12px] text-slate-400 border-b tracking-widest uppercase font-black"><tr><th className="p-4 text-center w-10">#</th><th>Produk</th><th className="text-center">Qty</th><th className="text-right">Harga Beli</th><th className="text-right pr-6">Subtotal</th><th className="text-center">Hapus</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                <td className="p-2 text-slate-300 text-center font-black">{idx + 1}</td>
                <td className="p-2"><div><p className="text-[12px] font-black text-slate-700">{item.product_name}</p><p className="text-[12px] font-mono text-slate-400 not-italic font-bold tracking-widest uppercase">{item.barcode}</p></div></td>
                <td className="p-2 text-center font-black">{item.qty}</td>
                <td className="p-2 text-right text-indigo-600 font-mono font-black">Rp {item.cost_price.toLocaleString()}</td>
                <td className="p-2 text-right pr-6 bg-slate-50/50 font-mono font-black text-slate-900 text-base">Rp {item.line_total.toLocaleString()}</td>
                <td className="p-2 text-center"><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-200 hover:text-red-500 transition active:scale-75"><Trash2 size={20}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <button onClick={handleSavePurchase} disabled={loading || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-[2rem] text-lg shadow-xl transition disabled:bg-slate-200 flex items-center justify-center gap-3">
          {loading ? <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div> : <><Save size={24}/> POSTING FAKTUR KE GUDANG</>}
        </button>
      </div>
    </div>
  );
}