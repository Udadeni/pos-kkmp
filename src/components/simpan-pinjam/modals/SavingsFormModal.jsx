import React from 'react';
import { X, Trash2, RefreshCw, Save } from 'lucide-react';
import { CATEGORIES } from '../hooks/useTransactionForm';
import { formatNumber } from '../utils/numberFormat';

const SavingsFormModal = ({
    showModal, setShowModal,
    savingsSummary,
    formData, setFormData,
    editingTransaction, setEditingTransaction,
    SYSTEM_LOCK_DATE,
    dateRef, categoryRef, amountRef, noteRef,
    handleKeyDown, handleCategoryKey,
    handleSavingsSubmit, handleVoidTransaction,
    loading,
}) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-start p-4 overflow-y-auto pt-24 pb-10">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                    <h3 className="text-2xl italic leading-none">{showModal === 'edit_transaction' ? 'Koreksi Data' : showModal === 'withdraw' ? 'Penarikan Sukarela' : 'Input Transaksi'}</h3>
                    <button onClick={() => { setShowModal(null); setEditingTransaction(null); }}><X /></button>
                </div>
                <form onSubmit={handleSavingsSubmit} className="p-8 space-y-5 not-italic font-sans text-slate-800">
                    {showModal === 'withdraw' && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Saldo Tersedia</p>
                            <p className="text-lg font-mono">Rp {savingsSummary.sukarela.toLocaleString('id-ID')}</p>
                        </div>
                    )}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">1. Tanggal (Enter)</label>
                        <input ref={dateRef} type="date" required min={SYSTEM_LOCK_DATE} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} onKeyDown={e => handleKeyDown(e, categoryRef)} />
                    </div>
                    <div tabIndex={0} ref={categoryRef} onKeyDown={handleCategoryKey} className="outline-none">
                        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">2. Kategori (Panah & Enter)</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                            {(showModal === 'withdraw' ? ['TARIK_SUKARELA'] : CATEGORIES).map((t) => (
                                <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })} className={`py-3 rounded-xl text-[10px] font-black transition-all ${formData.type === t ? 'bg-indigo-600 text-white shadow-lg scale-105 ring-4 ring-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">3. Nominal Rp (Enter)</label>
                        <input ref={amountRef} type="text" required placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-2xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100" value={formatNumber(formData.amount)} onChange={e => setFormData({ ...formData, amount: e.target.value.replace(/\./g, '') })} onKeyDown={e => handleKeyDown(e, noteRef)} />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 ml-2 uppercase tracking-widest">4. Catatan (Enter Simpan)</label>
                        <input ref={noteRef} type="text" placeholder="..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold uppercase italic text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-100" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} onKeyDown={e => handleKeyDown(e, 'submit')} />
                    </div>
                    <div className="flex gap-3">
                        {showModal === 'edit_transaction' && (
                            <button type="button" onClick={handleVoidTransaction} className="flex-1 bg-red-50 text-red-600 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest border-2 border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-all"><Trash2 size={16} /> BATALKAN</button>
                        )}
                        <button type="submit" disabled={loading} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 active:scale-95">{loading ? <RefreshCw className="animate-spin" /> : <Save size={18} />} SIMPAN PERUBAHAN</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SavingsFormModal;