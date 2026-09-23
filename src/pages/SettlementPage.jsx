import { useState, useEffect, useMemo } from "react";
import { 
  collection, onSnapshot, query, where, doc, getDoc, getDocs 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { purchaseService } from "../services/purchaseService"; 
import { salesService } from "../services/salesService"; // Service Baru
import { APP_SETTINGS } from "../constants/settings";
import { 
  History, CreditCard, CheckCircle, X, Landmark, 
  Wallet, ArrowUpRight, ArrowDownLeft, Search, Receipt, RefreshCw, HandCoins, Repeat
} from "lucide-react";

export default function SettlementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("payables");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State Data
  const [payables, setPayables] = useState([]); 
  const [receivables, setReceivables] = useState([]);

  // State Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [receivableMode, setReceivableMode] = useState("CASH"); // CASH, SAVINGS, CONVERT_TO_LOAN
  const [memberInfo, setMemberInfo] = useState(null); // Untuk cek saldo sukarela
  
  const [loanForm, setLoanForm] = useState({ tenor: 10, interest: 1.5 });

  const formatGrouping = (val) => {
    if (!val || val === 0) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseRaw = (val) => {
    if (typeof val === 'number') return val;
    return Number(val.replace(/\./g, "").replace(/[^0-9]/g, ""));
  };

  // 1. Fetch Hutang Supplier
  useEffect(() => {
    const q = query(collection(db, "transactions_purchase"), where("payment_method", "==", "CREDIT"));
    const unsub = onSnapshot(q, (snap) => {
      setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 2. Fetch Piutang BON Anggota
  useEffect(() => {
    const q = query(collection(db, "transactions_sales"), where("payment_method", "==", "DEBT"));
    const unsub = onSnapshot(q, (snap) => {
      setReceivables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 3. Fetch Detail Anggota saat Piutang dipilih
  const handleSelectReceivable = async (item) => {
    setSelectedItem(item);
    setPayAmount(item.remaining_balance.toString());
    setReceivableMode("CASH");
    
    // Ambil info saldo sukarela
    if (item.member_id) {
      const mSnap = await getDocs(query(collection(db, 'member_savings_transactions'), where('member_id', '==', item.member_id)));
      let sukarela = 0;
      mSnap.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'VOID') {
          if (d.type === 'SUKARELA') sukarela += d.amount;
          if (d.type === 'TARIK_SUKARELA') sukarela -= d.amount;
        }
      });
      setMemberInfo({ id: item.member_id, name: item.member_name, sukarela_balance: sukarela });
    }
  };

  const filteredData = useMemo(() => {
    const list = activeTab === "payables" ? payables : receivables;
    const sorted = [...list].sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
    if (!searchTerm) return sorted;
    return sorted.filter(item => 
      (item.supplier_name || item.member_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, payables, receivables, searchTerm]);

  const handleProcess = async (e) => {
    e.preventDefault();
    const amount = parseRaw(payAmount);
    if (!amount || amount <= 0) return alert("Nominal tidak valid");
    if (amount > selectedItem.remaining_balance) return alert("Nominal melebihi sisa tagihan!");

    setLoading(true);
    try {
      if (activeTab === "payables") {
        await purchaseService.settleDebt({ purchase: selectedItem, amount, user });
      } else {
        // Logika Pelunasan Piutang Anggota (3 Opsi)
        if (receivableMode === 'SAVINGS' && amount > (memberInfo?.sukarela_balance || 0)) {
           throw new Error("Saldo sukarela anggota tidak mencukupi!");
        }
        await salesService.settleSaleDebt({ 
          sale: selectedItem, 
          member: { id: selectedItem.member_id, full_name: selectedItem.member_name },
          mode: receivableMode,
          amount: amount,
          formData: loanForm,
          user 
        });
      }
      alert("Pembayaran Berhasil!");
      setSelectedItem(null);
      setPayAmount("");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 tracking-tighter uppercase italic font-black text-slate-800">
      
      {/* HEADER UTAMA */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div><h1 className="text-3xl text-indigo-900 leading-none">Manajemen Pelunasan</h1><p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] mt-3 not-italic font-sans uppercase">{APP_SETTINGS.ORG_NAME} • Settlement Center</p></div>
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100 font-sans not-italic text-[10px] font-black">
           <button onClick={() => { setActiveTab("payables"); setSearchTerm(""); }} className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-2 transition-all ${activeTab === 'payables' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><ArrowUpRight size={16}/> Hutang Supplier</button>
           <button onClick={() => { setActiveTab("receivables"); setSearchTerm(""); }} className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-2 transition-all ${activeTab === 'receivables' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><ArrowDownLeft size={16}/> Piutang Anggota</button>
        </div>
      </div>

      <div className="relative mb-8 max-w-md font-sans not-italic"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Cari..." className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-sm border-none outline-none focus:ring-4 focus:ring-indigo-50 font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] text-slate-400 border-b tracking-widest font-black uppercase"><tr><th className="p-6">Tgl</th><th>No. Invoice</th><th>{activeTab === "payables" ? "Supplier" : "Nama Anggota"}</th><th className="text-right">Total</th><th className="text-right">Sisa</th><th className="text-center">Status</th><th className="p-2 text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-slate-50 font-black italic uppercase">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition transition-colors">
                <td className="p-4 text-slate-400 font-sans not-italic font-bold text-xs">{item.purchase_date || item.created_at?.toDate().toLocaleDateString('id-ID')}</td>
                <td className="font-mono text-indigo-600 font-black">{item.invoice_number}</td>
                <td className="text-slate-700">{item.supplier_name || item.member_name || "UMUM"}</td>
                <td className="text-right font-mono font-bold">Rp {item.grand_total?.toLocaleString('id-ID')}</td>
                <td className="text-right font-mono text-red-600">Rp {(item.remaining_balance || 0).toLocaleString('id-ID')}</td>
                <td className="text-center">{item.payment_status === 'PAID' ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black">LUNAS</span> : <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[8px] font-black animate-pulse">BELUM LUNAS</span>}</td>
                <td className="p-4 text-center">{item.remaining_balance > 0 && (<button onClick={() => activeTab === 'payables' ? setSelectedItem(item) : handleSelectReceivable(item)} className={`p-2 rounded-xl text-white shadow-lg transition active:scale-95 ${activeTab === 'payables' ? 'bg-slate-900 hover:bg-indigo-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}><CreditCard size={14}/></button>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL BAYAR */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-8 text-white flex justify-between items-center ${activeTab === 'payables' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              <div><h3 className="text-2xl leading-none italic">{activeTab === 'payables' ? "Bayar Hutang" : "Penerimaan BON"}</h3><p className="text-[10px] font-sans not-italic font-bold opacity-70 mt-1 uppercase tracking-widest">{selectedItem.invoice_number} — {selectedItem.supplier_name || selectedItem.member_name}</p></div>
              <button onClick={() => setSelectedItem(null)} className="text-white hover:rotate-90 transition-all"><X/></button>
            </div>
            
            <form onSubmit={handleProcess} className="p-8 space-y-6 not-italic font-sans text-slate-800">
              {activeTab === 'receivables' && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Tunai', icon: Landmark },
                    { id: 'SAVINGS', label: 'Tabungan', icon: Wallet },
                    { id: 'CONVERT_TO_LOAN', label: 'Pinjaman', icon: Repeat }
                  ].map(m => (
                    <button key={m.id} type="button" onClick={() => setReceivableMode(m.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${receivableMode === m.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 text-slate-400'}`}>
                      <m.icon size={16}/><span className="text-[9px] font-black uppercase">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {receivableMode === 'SAVINGS' && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                  <p className="text-[10px] font-black text-indigo-600 uppercase">Saldo Sukarela</p>
                  <p className="text-lg font-black text-indigo-900 font-mono">Rp {memberInfo?.sukarela_balance?.toLocaleString() || 0}</p>
                </div>
              )}

              {receivableMode === 'CONVERT_TO_LOAN' && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2"><HandCoins size={14}/> Setting Pinjaman Baru</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Tenor (Bulan)</label><input type="number" className="w-full p-2 rounded-lg border-none bg-white font-black" value={loanForm.tenor} onChange={e => setLoanForm({...loanForm, tenor: e.target.value})}/></div>
                    <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Jasa (%)</label><input type="number" step="0.1" className="w-full p-2 rounded-lg border-none bg-white font-black" value={loanForm.interest} onChange={e => setLoanForm({...loanForm, interest: e.target.value})}/></div>
                  </div>
                </div>
              )}

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Tagihan</p><p className="text-xl font-black text-red-600 font-mono">Rp {selectedItem.remaining_balance?.toLocaleString()}</p></div>

              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase block mb-2">Nominal Pembayaran</label>
                <input type="text" inputMode="numeric" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-3xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100 font-mono" value={formatGrouping(payAmount)} onChange={(e) => setPayAmount(e.target.value.replace(/\./g, ''))} />
              </div>

              <button type="submit" disabled={loading} className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition active:scale-95 text-white ${activeTab === 'payables' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                {loading ? <RefreshCw className="animate-spin"/> : "KONFIRMASI PELUNASAN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}