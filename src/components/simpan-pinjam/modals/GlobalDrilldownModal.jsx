import React from 'react';
import { Printer, X } from 'lucide-react';
import { MONTHS } from '../hooks/useGlobalStats';

const GlobalDrilldownModal = ({
    showModal, setShowModal,
    globalStats,
    globalPokokData, globalWajibData, globalLoanData, globalSukarelaData,
}) => {
    return (
        <div className="fixed inset-0 bg-white md:bg-slate-900/90 md:backdrop-blur-md z-[110] flex justify-center items-start p-0 md:p-4 overflow-y-auto pt-10">
            <div id="printable-modal" className="bg-white w-full max-w-6xl h-fit md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 print:shadow-none print:max-w-none print:w-full print:h-auto print:static print:overflow-visible text-slate-800">
                <div className={`p-8 text-white flex justify-between items-center shrink-0 font-black italic uppercase print:bg-white print:text-black print:border-b-4 print:border-black print:p-4 ${showModal === 'global_wajib' ? 'bg-emerald-600' : showModal === 'global_loans' ? 'bg-red-600' : showModal === 'global_pokok' ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                    <div>
                        <h3 className="text-2xl leading-none print:text-lg">{showModal === 'global_pokok' ? 'Rincian Simpanan Pokok' : showModal === 'global_wajib' ? 'Monitor Simpanan Wajib' : showModal === 'global_loans' ? 'Rincian Piutang Aktif' : 'Tabungan Sukarela Anggota'}</h3>
                        <p className="text-[10px] font-sans not-italic font-bold tracking-widest opacity-70 mt-1 uppercase print:opacity-100">{showModal === 'global_pokok' ? 'Daftar Modal Pokok Anggota' : showModal === 'global_wajib' ? `Posisi Kas Berjalan Tahun ${new Date().getFullYear()}` : showModal === 'global_loans' ? 'Daftar Tagihan Anggota Berjalan' : 'Daftar Saldo Titipan Anggota'}</p>
                    </div>
                    <div className="flex gap-3 print:hidden">
                        <button onClick={() => window.print()} className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-all"><Printer size={20} /></button>
                        <button onClick={() => setShowModal(null)} className="bg-white/10 p-3 rounded-xl hover:bg-red-500 transition-all"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
                    {showModal === 'global_pokok' && (
                        <table className="w-full text-xs">
                            <thead><tr className="sticky top-0 bg-white z-10 border-b-4 border-slate-900 text-slate-400 uppercase"><th>Nama Anggota</th><th className="text-right">Total Simpanan Pokok</th></tr></thead>
                            <tbody>{globalPokokData.map((row, i) => (<tr key={i} className="hover:bg-slate-50 border-b"><td className="py-4 font-black italic">{row.name}</td><td className="text-right font-mono text-indigo-600 text-lg">Rp {row.balance.toLocaleString()}</td></tr>))}</tbody>
                        </table>
                    )}
                    {showModal === 'global_wajib' && (
                        <table className="w-full text-[10px] font-bold">
                            <thead><tr className="sticky top-0 bg-white z-10 border-b-4 border-slate-900 uppercase"><th>Nama Anggota</th>{MONTHS.map(m => <th key={m} className="text-right px-2">{m}</th>)}<th className="text-right px-4 bg-slate-50">Total</th></tr></thead>
                            <tbody>{globalWajibData.map((row, i) => (<tr key={i} className="hover:bg-slate-50 border-b"><td className="py-4 italic align-middle">{row.name}</td>{row.payments.map((p, idx) => (<td key={idx} className={`text-right px-2 font-mono align-middle ${p > 0 ? 'text-emerald-600 font-black' : 'text-red-100'}`}>{p > 0 ? p.toLocaleString() : '-'}</td>))}<td className="text-right px-4 bg-slate-50/50 font-black align-middle">{row.payments.reduce((a, b) => a + b, 0).toLocaleString()}</td></tr>))}</tbody>
                        </table>
                    )}
                    {showModal === 'global_loans' && (
                        <table className="w-full text-[11px]">
                            <thead><tr className="sticky top-0 bg-white z-10 border-b-4 border-slate-900 text-slate-400 uppercase"><th>Nama Anggota</th><th>No Ref</th><th className="text-right">Plafon</th><th className="text-right">Sisa Piutang</th></tr></thead>
                            <tbody>{globalLoanData.map((row, i) => (<tr key={i} className="hover:bg-slate-50 border-b"><td className="py-4 font-black">{row.name}</td><td>{row.ref}</td><td className="text-right">Rp {row.principal.toLocaleString()}</td><td className="text-right font-black text-red-600">Rp {row.remaining.toLocaleString()}</td></tr>))}</tbody>
                        </table>
                    )}
                    {showModal === 'global_sukarela' && (
                        <table className="w-full text-xs">
                            <thead><tr className="sticky top-0 bg-white z-10 border-b-4 border-slate-900 text-slate-400 uppercase"><th>Nama Anggota</th><th className="text-right">Saldo Saat Ini</th></tr></thead>
                            <tbody>{globalSukarelaData.map((row, i) => (<tr key={i} className="hover:bg-slate-50 border-b"><td className="py-4 font-black">{row.name}</td><td className="text-right font-mono text-amber-600 text-lg">Rp {row.balance.toLocaleString()}</td></tr>))}</tbody>
                        </table>
                    )}
                </div>
                <div className="bg-slate-900 p-6 text-white border-t flex justify-between items-center shrink-0 print:bg-white print:text-black print:border-t-4 print:border-black print:mt-10">
                    <div className="text-[10px] font-sans not-italic font-bold tracking-widest uppercase">Total Kolektif</div>
                    <div className={`text-2xl font-mono text-right flex-1 ${showModal === 'global_wajib' ? 'text-emerald-400' : showModal === 'global_loans' ? 'text-red-400' : showModal === 'global_pokok' ? 'text-indigo-400' : 'text-amber-400'} print:text-black`}>
                        Rp {(showModal === 'global_wajib' ? globalStats.wajib : showModal === 'global_loans' ? globalStats.pinjaman : showModal === 'global_pokok' ? globalStats.pokok : globalStats.sukarela).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalDrilldownModal;