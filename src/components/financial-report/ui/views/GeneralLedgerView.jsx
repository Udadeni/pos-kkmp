// src/components/financial-report/ui/views/GeneralLedgerView.jsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const GeneralLedgerView = ({
  dropdownRef,
  glSearchTerm,
  setGlSearchTerm,
  setSelectedGlAccount,
  showGlDropdown,
  setShowGlDropdown,
  filteredCOA,
  generateAllReports,
  selectedGlAccount,
  loading,
  months,
  selectedMonth,
  selectedYear,
  glOpeningBalance,
  glData
}) => {
  return (
    <div className="space-y-6 animate-in fade-in italic font-bold print:space-y-2">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100 print:hidden uppercase">
        <div className="flex-1 relative" ref={dropdownRef}>
          <label className="block text-[10px] font-black uppercase mb-2 ml-2 tracking-widest text-slate-400 font-sans not-italic">Pencarian Akun</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
            <input 
              type="text" 
              className="w-full pl-12 pr-10 py-4 bg-white border-none rounded-2xl font-bold text-indigo-900 shadow-sm outline-none transition-all" 
              placeholder="Ketik Kode atau Nama..." 
              value={glSearchTerm} 
              onFocus={() => setShowGlDropdown(true)} 
              onChange={(e) => { setGlSearchTerm(e.target.value); setShowGlDropdown(true); }} 
            />
            {glSearchTerm && (
              <button onClick={() => { setGlSearchTerm(""); setSelectedGlAccount(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
          {showGlDropdown && filteredCOA.length > 0 && (
            <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-indigo-50 overflow-hidden">
              {filteredCOA.map(acc => (
                <button key={acc.code} onClick={() => { setSelectedGlAccount(acc.code); setGlSearchTerm(`${acc.code} - ${acc.name}`); setShowGlDropdown(false); }} className="w-full text-left p-4 hover:bg-indigo-600 hover:text-white flex justify-between items-center border-b border-slate-50 last:border-none transition-colors">
                  <span className="text-xs font-black uppercase tracking-tight">{acc.name}</span>
                  <span className="font-mono text-[10px] opacity-60">[{acc.code}]</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={generateAllReports} disabled={!selectedGlAccount || loading} className="bg-indigo-600 hover:bg-indigo-700 text-white h-[58px] px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30 w-full md:w-auto">
          {loading ? "..." : "Mutasi"}
        </button>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden text-xs uppercase shadow-sm print:rounded-none print:border-none">
        <table className="w-full text-left print:text-[9px]">
          <thead className="bg-slate-50 border-b-2 border-slate-800 text-[10px] font-black text-slate-400 tracking-widest print:bg-white print:text-black">
            <tr>
              <th className="p-5 print:p-1">Tanggal</th>
              <th>Keterangan</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Kredit</th>
              <th className="text-right pr-6">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50/50 font-black italic print:bg-white">
              <td className="p-4 print:p-1" colSpan={4}>SALDO AWAL PER {months[selectedMonth - 1].toUpperCase()} {selectedYear}</td>
              <td className="text-right pr-6">{formatCurrency(glOpeningBalance)}</td>
            </tr>
            {glData.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 font-bold hover:bg-slate-50 transition">
                <td className="p-2 text-slate-400 font-sans not-italic text-xs tracking-tighter print:p-1 print:text-[8px]">{r.date.toLocaleDateString('id-ID')}</td>
                <td className="text-slate-700 print:p-1">{r.desc}</td>
                <td className="text-right text-emerald-600 print:p-1">{r.debit > 0 ? formatCurrency(r.debit) : '-'}</td>
                <td className="text-right text-red-600 print:p-1">{r.kredit > 0 ? formatCurrency(r.kredit) : '-'}</td>
                <td className="text-right pr-6 font-black text-slate-900 print:p-1">{formatCurrency(r.saldo)}</td>
              </tr>
            ))}
            {glData.length > 0 && (
              <tr className="bg-indigo-900 text-white font-black italic print:bg-white print:text-black print:border-t-2 print:border-black">
                <td className="p-3 print:p-1" colSpan={4}>SALDO AKHIR</td>
                <td className="text-right pr-6 text-lg print:text-[10px]">{formatCurrency(glData[glData.length - 1].saldo)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedgerView;