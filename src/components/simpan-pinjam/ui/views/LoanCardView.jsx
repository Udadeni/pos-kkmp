import React from 'react';
import { LayoutList } from 'lucide-react';

const LoanCardView = ({ history }) => {
    const loanHistory = history.filter(h => h.category === 'LOAN_IN' || h.category === 'ANGSURAN');
    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 print:p-0">
            {loanHistory.length > 0 ? (
                <table className="w-full text-left text-[11px] print:text-[10px]">
                    <thead>
                        <tr className="bg-slate-50 text-[9px] text-slate-400 tracking-widest font-sans not-italic uppercase print:bg-white print:text-black print:border-b-2 print:border-black">
                            <th className="px-4 py-4">Tanggal</th><th>Keterangan</th><th className="text-right">Pokok</th><th className="text-right">Jasa</th><th className="text-right px-4">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loanHistory.map(item => (
                            <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 ${item.status === 'VOID' ? 'opacity-30' : ''}`}>
                                <td className="px-4 py-4 font-sans not-italic text-slate-400 print:text-black">{item.created_at?.toDate().toLocaleDateString('id-ID')}</td>
                                <td><div className="flex flex-col"><span className={`text-[8px] font-black ${item.category === 'LOAN_IN' ? 'text-red-600' : 'text-emerald-600'}`}>{item.type}</span><span className="text-[7px] italic normal-case text-slate-400 print:text-black">{item.note}</span></div></td>
                                <td className="text-right font-mono font-black">{item.category === 'LOAN_IN' ? `(${item.amount.toLocaleString()})` : item.principal_portion?.toLocaleString() || '-'}</td>
                                <td className="text-right font-mono text-slate-400 print:text-black">{item.interest_portion?.toLocaleString() || '-'}</td>
                                <td className="text-right font-mono font-black px-4">Rp {item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-20 print:hidden"><LayoutList size={40} className="text-slate-100 mx-auto mb-4" /><p className="text-[10px] text-slate-300 tracking-widest">TIDAK ADA RIWAYAT PINJAMAN</p></div>
            )}
        </div>
    );
};

export default LoanCardView;