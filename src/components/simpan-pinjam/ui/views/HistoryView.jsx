import React from 'react';
import { Edit3 } from 'lucide-react';
import { getLocalYYYYMMDD } from '../../utils/dateHelpers';

const HistoryView = ({ history, savingsSummary, setEditingTransaction, setFormData, setShowModal }) => {
    return (
        <>
            <table className="w-full text-left text-[11px] print:text-[10px]">
                <thead>
                    <tr className="bg-slate-50 text-[9px] text-slate-400 tracking-widest font-sans not-italic uppercase print:bg-white print:text-black print:border-b-2 print:border-black">
                        <th className="px-6 py-4">Tanggal</th><th>Tipe</th><th>Catatan</th><th className="text-right">Jumlah</th><th className="px-4 text-center print:hidden">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(item => (
                        <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${item.status === 'VOID' ? 'opacity-30' : ''}`}>
                            <td className="px-6 py-2 font-sans not-italic text-slate-400 print:text-black">{item.created_at?.toDate().toLocaleDateString('id-ID')}</td>
                            <td><span className={`px-2 py-0.5 rounded text-[8px] font-black ${item.status === 'VOID' ? 'bg-slate-200 text-slate-600 line-through' : item.type.includes('TARIK') || item.type.includes('PENCAIRAN') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{item.type} {item.status === 'VOID' && '(BATAL)'}</span></td>
                            <td className="normal-case italic text-slate-400 print:text-black">{item.note || '-'}</td>
                            <td className={`text-right font-mono font-black ${item.status === 'VOID' ? 'line-through' : ''}`}>Rp {item.amount.toLocaleString()}</td>
                            <td className="text-center print:hidden">
                                {item.category === 'SIMPANAN' && item.status !== 'VOID' && (
                                    <button onClick={() => { setEditingTransaction(item); setFormData({ type: item.type, amount: item.amount.toString(), note: item.note, date: item.created_at?.toDate() ? getLocalYYYYMMDD(item.created_at.toDate()) : '' }); setShowModal('edit_transaction'); }} className="text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14} /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="hidden print:block mt-8 pt-6 border-t-2 border-dashed border-slate-300">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-sans font-bold tracking-widest uppercase">Ringkasan Saldo Simpanan</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[7px] font-sans font-bold uppercase tracking-tighter text-slate-500 mb-1">Simpanan Pokok</p>
                        <p className="text-xs font-black">Rp {savingsSummary.pokok.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[7px] font-sans font-bold uppercase tracking-tighter text-slate-500 mb-1">Simpanan Wajib</p>
                        <p className="text-xs font-black">Rp {savingsSummary.wajib.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[7px] font-sans font-bold uppercase tracking-tighter text-slate-500 mb-1">Simpanan Sukarela</p>
                        <p className="text-xs font-black">Rp {savingsSummary.sukarela.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-end px-4">
                    <div className="text-right">
                        <p className="text-[8px] font-sans font-bold uppercase tracking-widest text-slate-400">Total Saldo Keseluruhan</p>
                        <p className="text-lg font-black italic text-indigo-600 print:text-black">
                            Rp {(savingsSummary.pokok + savingsSummary.wajib + savingsSummary.sukarela).toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HistoryView;