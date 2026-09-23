import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getAccountsByType, COA } from "../constants/coa";
import { APP_SETTINGS } from "../constants/settings";
import { 
  collection, query, where, onSnapshot, getDocs, 
  writeBatch, doc, serverTimestamp, Timestamp, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { jurnalService } from "../services/jurnalService";
import { 
  Save, FileText, Wallet, Calendar, Search, 
  Landmark, Banknote, X, AlertTriangle, RefreshCw
} from "lucide-react";

export default function ExpensePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [todaySales, setTodaySales] = useState(0);
  const [todayHandovers, setTodayHandovers] = useState(0);
  const [todayDrawerExpenses, setTodayDrawerExpenses] = useState(0);

  // State Pencarian Akun Cerdas
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountList, setShowAccountList] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    date: today,
    account_code: "", 
    account_name: "", 
    description: "", 
    amount: "", 
    payment_source: "KAS_KOPERASI", 
    bank_account_code: ""
  });

  // Listener Klik Luar Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Jaring Pengaman Tanggal (Anti Blank Putih)
  const getSafeDate = (ex) => {
    const d = ex.date || ex.created_at;
    if (!d) return new Date();
    return d.toDate();
  };

  useEffect(() => {
    if (!user) return;
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const tsToday = Timestamp.fromDate(startOfToday);

    const unsubSales = onSnapshot(query(collection(db, "transactions_sales"), where("created_at", ">=", tsToday)), (snap) => {
      let total = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.created_by === user.uid && data.payment_method === "CASH") total += Number(data.grand_total || 0);
      });
      setTodaySales(total);
    });

    const unsubCash = onSnapshot(query(collection(db, "cash_handovers"), where("timestamp", ">=", tsToday)), (snap) => {
      let total = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.cashier_id === user.uid) total += Number(data.amount || 0);
      });
      setTodayHandovers(total);
    });

    const unsubExp = onSnapshot(query(collection(db, "expenses"), where("created_at", ">=", tsToday)), (snap) => {
      let total = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.created_by === user.uid && data.payment_source === "KAS_TOKO") total += Number(data.amount || 0);
      });
      setTodayDrawerExpenses(total);
    });

    return () => { unsubSales(); unsubCash(); unsubExp(); };
  }, [user]);

  const currentDrawerBalance = useMemo(() => todaySales - todayHandovers - todayDrawerExpenses, [todaySales, todayHandovers, todayDrawerExpenses]);

  const expenseAccounts = getAccountsByType("EXPENSE", "OTHER_EXPENSE");
  const bankAccounts = getAccountsByType("ASSET").filter(a => a.name.toLowerCase().includes("bank"));

  const filteredCOA = useMemo(() => {
    const term = accountSearch.toLowerCase();
    return expenseAccounts.filter(a => 
      a.name.toLowerCase().includes(term) || a.code.includes(term)
    ).slice(0, 15);
  }, [accountSearch, expenseAccounts]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      const q = query(collection(db, "expenses"), where("created_at", ">=", Timestamp.fromDate(start)), where("created_at", "<=", Timestamp.fromDate(end)), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoadingData(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const inputAmount = Number(form.amount);
    if (!form.account_code || !inputAmount || !form.description) return alert("Lengkapi data!");
    if (form.payment_source === "KAS_TOKO" && inputAmount > currentDrawerBalance) return alert(`Saldo laci tidak cukup!`);
    if (form.payment_source === "BANK" && !form.bank_account_code) return alert("Pilih Rekening Bank!");

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Mapping Sumber Dana ke Kode Akun Real
      let sourceCode = "1.1.1.01"; // Default Kas Toko
      if (form.payment_source === "KAS_KOPERASI") sourceCode = "1.1.1.01"; // Sesuaikan jika ada kode khusus Kas Koperasi
      if (form.payment_source === "BANK") sourceCode = form.bank_account_code;

      // 1. Dokumen Expenses
      const expRef = doc(collection(db, "expenses"));
      const expenseData = {
        date: Timestamp.fromDate(new Date(form.date)),
        account_code: form.account_code,
        account_name: form.account_name,
        description: form.description.toUpperCase(),
        amount: inputAmount,
        payment_source: form.payment_source,
        payment_source_code: sourceCode,
        created_by: user.uid,
        created_name: user.name,
        created_at: serverTimestamp()
      };
      batch.set(expRef, expenseData);

      // 2. Dokumen Jurnal Otomatis
      const journalEntries = [
        { account_code: form.account_code, debit: inputAmount, kredit: 0 },
        { account_code: sourceCode, debit: 0, kredit: inputAmount }
      ];

      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(form.date),
        description: `EXP: ${form.account_name} (${form.description.toUpperCase()})`,
        entries: journalEntries,
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'EXPENSE'
      });

      const jrRef = doc(collection(db, "journal_entries"));
      batch.set(jrRef, { ...journalPayload, created_at: serverTimestamp(), reference_id: expRef.id });

      await batch.commit();
      
      alert("Berhasil! Biaya dicatat & Jurnal diterbitkan.");
      setForm({ date: today, account_code: "", account_name: "", description: "", amount: "", bank_account_code: "", payment_source: "KAS_KOPERASI" });
      setAccountSearch("");
      loadData();
    } catch (e) { 
      alert("Gagal: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 tracking-tighter">
      <div className="mb-10 font-black italic uppercase">
        <h1 className="text-3xl text-indigo-900 leading-none">Biaya & Operasional</h1>
        <p className="text-[10px] text-slate-400 tracking-[0.3em] mt-2 not-italic font-sans font-bold uppercase">
           {APP_SETTINGS.ORG_NAME} • Pengeluaran Kas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-5 font-black italic uppercase sticky top-24">
            
            {form.payment_source === "KAS_TOKO" && (
                <div className={`p-5 rounded-3xl border-4 border-dashed flex justify-between items-center animate-in zoom-in ${currentDrawerBalance <= 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    <div><p className="text-[8px] uppercase opacity-60 not-italic font-sans font-bold">Uang Laci Saat Ini</p><p className="text-xl font-mono not-italic font-black">Rp {currentDrawerBalance.toLocaleString('id-ID')}</p></div>
                    <Banknote size={28}/>
                </div>
            )}

            <div className="font-sans not-italic">
              <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">Tanggal Biaya</label>
              <input type="date" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>

            <div className="relative font-sans not-italic" ref={dropdownRef}>
              <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">Akun Biaya (Cari/Pilih)</label>
              <div className="relative mt-1">
                <input type="text" placeholder="KETIK NAMA ATAU KODE AKUN..." className="w-full p-4 bg-slate-50 border-none focus:ring-4 focus:ring-indigo-100 rounded-2xl text-xs font-bold transition-all outline-none uppercase"
                  value={accountSearch} onFocus={() => setShowAccountList(true)} onChange={e => { setAccountSearch(e.target.value); setShowAccountList(true); if(!e.target.value) setForm({...form, account_code: "", account_name: ""}); }} />
                {form.account_code && <button type="button" onClick={() => {setForm({...form, account_code: "", account_name: ""}); setAccountSearch("");}} className="absolute right-4 top-3.5 text-red-500 hover:scale-125 transition-transform"><X size={18}/></button>}
              </div>
              {showAccountList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto font-black italic uppercase">
                  {filteredCOA.length > 0 ? filteredCOA.map(a => (
                    <div key={a.code} onMouseDown={() => { setForm({...form, account_code: a.code, account_name: a.name}); setAccountSearch(`[${a.code}] ${a.name}`); setShowAccountList(false); }} className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer border-b last:border-0 text-[10px] flex justify-between">
                      <span>{a.name}</span><span className="opacity-50 font-mono">[{a.code}]</span>
                    </div>
                  )) : <div className="p-4 text-center text-slate-300 text-[10px]">Akun tidak ditemukan</div>}
                </div>
              )}
            </div>

            <div className="font-sans not-italic">
              <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">Keterangan / Memo</label>
              <textarea required rows="2" className="w-full mt-1 p-4 bg-slate-50 rounded-2xl text-xs font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-100" 
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4 font-sans not-italic">
              <div>
                <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">Nominal (Rp)</label>
                <input required type="text" className="w-full mt-1 p-4 bg-slate-50 rounded-2xl font-black text-red-600 text-lg" 
                  value={form.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} onChange={(e) => { const raw = e.target.value.replace(/\./g, ""); if(!isNaN(raw)) setForm({...form, amount: raw})}} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">Sumber Dana</label>
                <select className="w-full mt-1 p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] outline-none"
                  value={form.payment_source} onChange={e => setForm({...form, payment_source: e.target.value, bank_account_code: ""})}>
                  <option value="KAS_KOPERASI">KAS KOPERASI</option>
                  <option value="KAS_TOKO">KAS TOKO (LACI)</option>
                  <option value="BANK">TRANSFER BANK</option>
                </select>
              </div>
            </div>

            {form.payment_source === "BANK" && (
                <div className="animate-in slide-in-from-top duration-300 font-sans not-italic">
                    <label className="text-[9px] font-black text-purple-600 ml-2 uppercase tracking-widest">Pilih Rekening Bank</label>
                    <select required className="w-full mt-1 p-4 bg-purple-50 text-purple-700 rounded-2xl font-black text-[10px] outline-none"
                        value={form.bank_account_code} onChange={e => setForm({...form, bank_account_code: e.target.value})}>
                        <option value="">-- PILIH AKUN BANK --</option>
                        {bankAccounts.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-3">
              {loading ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>} 
              {loading ? "MEMPROSES JURNAL..." : "SIMPAN & POSTING"}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: RIWAYAT DATA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-wrap items-center gap-4 font-sans font-bold">
            <Calendar size={16} className="text-indigo-500" />
            <input type="date" className="outline-none bg-transparent" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="mx-2 text-slate-300">-</span>
            <input type="date" className="outline-none bg-transparent" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <button onClick={loadData} className="bg-indigo-600 text-white p-3 px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-700 ml-auto flex items-center gap-2 transition-all shadow-lg">
              <Search size={14}/> Muat Data
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden font-black uppercase italic mb-20">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-white text-[9px] tracking-widest uppercase">
                <tr><th className="p-6">Waktu</th><th className="p-6">Jenis Biaya & Memo</th><th className="p-6">Sumber</th><th className="p-6 text-right">Nominal</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 uppercase">
                {expenses.length > 0 ? expenses.map(ex => (
                    <tr key={ex.id} className="hover:bg-slate-50 transition leading-tight group">
                        <td className="p-6 text-slate-400 font-sans not-italic font-bold text-xs tracking-tighter">
                          {getSafeDate(ex).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'})}
                        </td>
                        <td className="p-6 leading-tight">
                          <div>
                            <p className="text-indigo-700 leading-tight font-black">{ex.account_name}</p>
                            <p className="text-[10px] text-slate-400 not-italic font-sans font-bold lowercase opacity-70 group-hover:opacity-100 transition-opacity">
                              {ex.description || ex.note}
                            </p>
                          </div>
                        </td>
                        <td className="p-6">
                            <div className="flex items-center gap-2">
                              {ex.payment_source === 'BANK' ? <Landmark size={14} className="text-purple-500"/> : <Banknote size={14} className="text-amber-500"/>}
                              <span className="font-black tracking-tighter text-[9px]">{ex.payment_source.replace(/_/g,' ')}</span>
                            </div>
                        </td>
                        <td className="p-6 text-right text-red-600 font-mono tracking-tighter text-base font-black">
                          Rp {ex.amount.toLocaleString('id-ID')}
                        </td>
                    </tr>
                )) : (
                  <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic tracking-widest">Belum ada data biaya</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}