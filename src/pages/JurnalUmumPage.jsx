import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { jurnalService } from "../services/jurnalService";
import { COA } from "../constants/coa"; 
import { Timestamp } from "firebase/firestore";
import { APP_SETTINGS } from "../constants/settings";
import { 
  Plus, Trash2, ChevronDown, ChevronUp, 
  Edit, AlertCircle, Calendar, Search, 
  History as HistoryIcon, Clock
} from "lucide-react";

export default function JurnalUmumPage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN" || isManager;

  // Konversi Date Object dari settings menjadi String YYYY-MM-DD untuk "Gembok"
  const SYSTEM_LOCK_DATE = APP_SETTINGS.SYSTEM_START_DATE.toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [jurnals, setJurnals] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const [filter, setFilter] = useState({ start: today, end: today });

  const [form, setForm] = useState({
    date: today,
    description: "",
    entries: [
      { account_code: "", account_name: "", debit: 0, kredit: 0 },
      { account_code: "", account_name: "", debit: 0, kredit: 0 }
    ]
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  const formatGrouping = (val) => {
    if (val === 0 || val === "0" || !val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseRawValue = (val) => {
    return val.replace(/\./g, "").replace(/[^0-9]/g, "");
  };

  // LOGIC FILTER: Muncul semua jika kosong, terfilter jika diketik
  const filteredCOA = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COA;
    return COA.filter(acc => 
      acc.code.includes(q) || 
      acc.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totals = useMemo(() => {
    return form.entries.reduce((acc, curr) => ({
      debit: acc.debit + Number(curr.debit || 0),
      kredit: acc.kredit + Number(curr.kredit || 0)
    }), { debit: 0, kredit: 0 });
  }, [form.entries]);

  const isBalanced = totals.debit > 0 && Math.abs(totals.debit - totals.kredit) < 0.01;
  const allRowsValid = form.entries.every(e => e.account_code !== "" && (Number(e.debit) > 0 || Number(e.kredit) > 0));
  const canSave = isBalanced && form.description.trim() !== "" && allRowsValid && !loading;

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await jurnalService.getJurnals({ startDate: filter.start, endDate: filter.end });
      const activeJurnals = data.filter(j => j.status !== 'VOID');
      setJurnals(activeJurnals);
    } catch (e) { alert("Gagal muat histori: " + e.message); }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { if(isAdmin) loadHistory(); }, []);

  const addRow = () => {
    setForm({ ...form, entries: [...form.entries, { account_code: "", account_name: "", debit: 0, kredit: 0 }] });
  };

  const removeRow = (index) => {
    if (form.entries.length <= 2) return;
    const newEntries = form.entries.filter((_, i) => i !== index);
    setForm({ ...form, entries: newEntries });
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...form.entries];
    newEntries[index][field] = value;
    setForm({ ...form, entries: newEntries });
  };

  const handleSelectAccount = (idx, acc) => {
    const newEntries = [...form.entries];
    newEntries[idx].account_code = acc.code;
    newEntries[idx].account_name = acc.name;
    setForm({ ...form, entries: newEntries });
    setActiveRowIndex(null);
    setSearchQuery("");
    setTimeout(() => document.getElementById(`debit-${idx}`)?.focus(), 50);
  };

  const handleDebitEnter = (e, idx) => {
    if (e.key === "Enter") {
      if (idx === form.entries.length - 1) addRow();
      setTimeout(() => document.getElementById(`acc-search-${idx + 1}`)?.focus(), 100);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    // VALIDASI GEMBOK TANGGAL
    if (form.date < SYSTEM_LOCK_DATE) {
      return alert(`Gagal Simpan! Tanggal jurnal tidak boleh sebelum tanggal mulai sistem (${SYSTEM_LOCK_DATE})`);
    }

    setLoading(true);
    try {
      const [y, m, d] = form.date.split('-').map(Number);
      const dateTimestamp = Timestamp.fromDate(new Date(y, m - 1, d, 0, 0, 0));
      const payload = {
        date: dateTimestamp,
        description: form.description.toUpperCase(),
        entries: form.entries.map(e => ({ ...e, debit: Number(e.debit), kredit: Number(e.kredit) })),
        total_debit: totals.debit,
        total_kredit: totals.kredit,
        created_by_uid: user.uid,
        created_by_name: user.name,
        source_module: 'JURNAL_UMUM',
        status: 'ACTIVE'
      };
      if (editingId) {
        await jurnalService.updateJurnal(editingId, payload);
        alert("Jurnal diperbarui!");
      } else {
        await jurnalService.addJurnal(payload);
        alert("Jurnal disimpan!");
      }
      setForm({ date: today, description: "", entries: [{ account_code: "", account_name: "", debit: 0, kredit: 0 }, { account_code: "", account_name: "", debit: 0, kredit: 0 }] });
      setEditingId(null);
      loadHistory();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const handleEdit = (j) => {
    setEditingId(j.id);
    const tgl = j.date.toDate();
    setForm({
      date: `${tgl.getFullYear()}-${String(tgl.getMonth()+1).padStart(2,'0')}-${String(tgl.getDate()).padStart(2,'0')}`,
      description: j.description,
      entries: j.entries
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVoid = async (id) => {
    if (!window.confirm("Batalkan (VOID) jurnal ini? Data tidak akan dihapus tapi tidak akan masuk ke laporan keuangan.")) return;
    try {
      setLoadingHistory(true);
      // Memanggil fungsi void, bukan delete
      await jurnalService.voidJurnal(id, user.name); 
      alert("Jurnal telah dibatalkan (VOID).");
      loadHistory(); // loadHistory sudah benar (memfilter status !== 'VOID')
    } catch (e) { 
      alert("Gagal VOID: " + e.message); 
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isAdmin) return <div className="p-10 text-center font-black text-red-500 uppercase">Akses Ditolak.</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800 tracking-tighter">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="mb-8 font-black">
        <h1 className="text-2xl font-black italic text-indigo-900 uppercase leading-none">Jurnal Umum</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {APP_SETTINGS.ORG_NAME} • SISTEM AKUNTANSI KOPERASI
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-8 mb-8 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Tanggal</label>
            <input 
              type="date" 
              className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
              value={form.date} 
              min={SYSTEM_LOCK_DATE}
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 block mb-1">Keterangan / Narasi</label>
            <input type="text" placeholder="MISAL: SETORAN MODAL AWAL, BAYAR SEWA..." className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>

        <div className="mb-4 font-bold overflow-visible">
          <table className="w-full text-left table-fixed border-separate border-spacing-y-1">
            <thead className="text-[9px] font-black uppercase text-slate-400">
              <tr>
                <th className="p-2 w-10">No</th>
                <th className="p-2 w-auto">Akun (Excel Style Dropdown)</th>
                <th className="p-2 w-32 text-right">Debit</th>
                <th className="p-2 w-32 text-right">Kredit</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="overflow-visible">
              {form.entries.map((entry, idx) => (
                <tr key={idx} className="font-bold">
                  <td className="p-2 text-xs font-bold text-slate-300">{idx + 1}</td>
                  
                  <td className="p-2 relative">
                    <input 
                      id={`acc-search-${idx}`}
                      type="text" 
                      placeholder="PILIH AKUN..."
                      autoComplete="off"
                      className="w-full p-2 bg-transparent border-b border-slate-100 focus:border-indigo-500 font-bold text-xs outline-none uppercase"
                      value={activeRowIndex === idx ? searchQuery : (entry.account_code ? `[${entry.account_code}] ${entry.account_name}` : "")}
                      onFocus={() => { setActiveRowIndex(idx); setSearchQuery(""); }}
                      onBlur={() => setActiveRowIndex(null)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {/* DROPDOWN BOX */}
                    {activeRowIndex === idx && (
                      <div 
                        className="absolute left-0 top-full mt-1 w-full min-w-[300px] md:min-w-[450px] bg-white shadow-2xl border border-slate-200 rounded-xl z-[999] flex flex-col overflow-hidden"
                        onMouseDown={(e) => e.preventDefault()} // PENTING: Mencegah dropdown tertutup saat scroll
                      >
                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar bg-white">
                          {filteredCOA.length > 0 ? (
                            filteredCOA.map(acc => (
                              <div 
                                key={acc.code} 
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectAccount(idx, acc);
                                }} 
                                className="p-3 hover:bg-indigo-600 hover:text-white cursor-pointer text-[10px] font-bold border-b border-slate-50 last:border-0 transition-colors uppercase flex justify-between items-center"
                              >
                                <span className="flex-1">{acc.name}</span>
                                <span className="font-mono opacity-50 text-[9px] ml-4 bg-slate-50 px-2 py-0.5 rounded group-hover:text-white">[{acc.code}]</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-[10px] text-slate-400 italic">Tidak ditemukan...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="p-2">
                    <input 
                      id={`debit-${idx}`}
                      type="text" 
                      className="w-full p-2 bg-slate-50 rounded-lg font-mono text-xs font-black text-right outline-none focus:bg-white" 
                      value={formatGrouping(entry.debit)} 
                      onFocus={e => e.target.select()} 
                      onChange={e => updateEntry(idx, "debit", parseRawValue(e.target.value))}
                      onKeyDown={e => handleDebitEnter(e, idx)}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      id={`kredit-${idx}`}
                      type="text" 
                      className="w-full p-2 bg-slate-50 rounded-lg font-mono text-xs font-black text-right outline-none focus:bg-white" 
                      value={formatGrouping(entry.kredit)} 
                      onFocus={e => e.target.select()} 
                      onChange={e => updateEntry(idx, "kredit", parseRawValue(e.target.value))}
                      onKeyDown={e => e.key === "Enter" && handleDebitEnter(e, idx)} 
                    />
                  </td>
                  <td className="p-2 text-center">
                    {form.entries.length > 2 && (
                      <button onClick={() => removeRow(idx)} className="text-red-300 hover:text-red-500">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
          <button onClick={addRow} className="text-indigo-600 flex items-center gap-2 text-[10px] font-black uppercase hover:bg-indigo-50 p-2 px-4 rounded-xl transition">
            <Plus size={14}/> Tambah Baris
          </button>
          <div className="flex gap-8 bg-slate-900 p-4 px-8 rounded-2xl text-white font-mono text-sm shadow-xl">
            <div className="text-center font-bold">
              <p className="text-[8px] uppercase text-slate-500 font-black">Total Debit</p>
              <p className="font-black text-emerald-400">Rp {totals.debit.toLocaleString('id-ID')}</p>
            </div>
            <div className="border-r border-slate-700"></div>
            <div className="text-center font-bold">
              <p className="text-[8px] uppercase text-slate-500 font-black">Total Kredit</p>
              <p className="font-black text-yellow-400">Rp {totals.kredit.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {!isBalanced && totals.debit > 0 && (
          <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl animate-pulse font-black uppercase text-[9px]">
            <AlertCircle size={14}/> Selisih: Rp {Math.abs(totals.debit - totals.kredit).toLocaleString('id-ID')}
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={!canSave}
          className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition disabled:bg-slate-200"
        >
          {loading ? "PROSES..." : (editingId ? "UPDATE JURNAL" : "SIMPAN JURNAL")}
        </button>
      </div>

      {/* HISTORI */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
          <h3 className="font-black uppercase text-xs text-slate-400 mr-auto ml-2 flex items-center gap-2">
            <HistoryIcon size={16}/> Histori Jurnal
          </h3>
          <div className="flex items-center gap-2 font-black uppercase text-[10px]">
            <input type="date" className="outline-none bg-transparent" value={filter.start} onChange={e => setFilter({...filter, start: e.target.value})} />
            <span className="text-slate-300">-</span>
            <input type="date" className="outline-none bg-transparent" value={filter.end} onChange={e => setFilter({...filter, end: e.target.value})} />
          </div>
          <button onClick={loadHistory} className="bg-slate-100 p-2 px-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition">
            {loadingHistory ? "..." : "Muat Data"}
          </button>
        </div>

        <div className="space-y-2">
          {jurnals.map(j => (
            <div key={j.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden font-bold">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition" onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}>
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 font-mono text-xs font-black">
                    {j.date.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">{j.description}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Oleh: {j.created_by_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-mono text-sm font-black italic">Rp {Math.round(j.total_debit).toLocaleString('id-ID')}</p>
                  {expandedId === j.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedId === j.id && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <table className="w-full text-left text-xs uppercase font-bold">
                    <thead><tr className="text-[9px] text-slate-400 font-black"><th className="pb-2">Akun</th><th className="pb-2 text-right">Debit</th><th className="pb-2 text-right">Kredit</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {j.entries.map((e, i) => (
                        <tr key={i}>
                          <td className={`py-2 ${e.kredit > 0 ? "pl-8 text-slate-500 italic" : "text-indigo-700"}`}>[{e.account_code}] {e.account_name}</td>
                          <td className="py-2 text-right font-mono">{e.debit > 0 ? Math.round(e.debit).toLocaleString('id-ID') : "-"}</td>
                          <td className="py-2 text-right font-mono">{e.kredit > 0 ? Math.round(e.kredit).toLocaleString('id-ID') : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isManager && (
                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-4">
                      <button onClick={() => handleEdit(j)} className="p-2 px-4 bg-white border rounded-xl text-[9px] font-black uppercase">Edit</button>
                      <button onClick={() => handleVoid(j.id)} className="p-2 px-4 bg-white border border-red-100 text-red-500 rounded-xl text-[9px] font-black uppercase">BATALKAN JURNAL</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}