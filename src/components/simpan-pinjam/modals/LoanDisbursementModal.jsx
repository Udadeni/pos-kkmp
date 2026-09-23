import React from 'react';
import { X, RefreshCw, Save } from 'lucide-react';
import { formatNumber } from '../utils/numberFormat';

const LoanDisbursementModal = ({
    selectedMember,
    formData, setFormData,
    setShowModal,
    handleLoanDisbursement,
    loading,
}) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-start p-4 overflow-y-auto pt-24 pb-10">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 font-black italic uppercase text-slate-800">
                <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl leading-none italic">Pencairan Dana</h3>
                        <p className="text-[10px] font-sans not-italic font-bold opacity-70 mt-1 uppercase tracking-widest">{selectedMember?.full_name}</p>
                    </div>
                    <button onClick={() => setShowModal(null)} className="text-white"><X /></button>
                </div>
                <form onSubmit={handleLoanDisbursement} className="p-8 space-y-6 not-italic font-sans">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Nominal Pinjam</label>
                            <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100" value={formatNumber(formData.amount)} onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/\./g, '') })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Jasa (%)</label>
                            <input type="number" step="0.1" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black outline-none focus:ring-4 focus:ring-indigo-100" value={formData.interest} onChange={(e) => setFormData({ ...formData, interest: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Tenor (Bulan)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[5, 10, 12, 20, 24].map(t => (
                                <button key={t} type="button" onClick={() => setFormData({ ...formData, tenor: Number(t) })} className={`py-3 rounded-xl text-xs font-black transition-all ${formData.tenor === Number(t) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 font-black italic uppercase text-[10px] text-slate-800">
                        <div className="flex justify-between mb-2"><span>Pokok/Bulan</span><span className="font-sans not-italic font-bold text-slate-700 font-mono text-sm">Rp {Math.round((Number(formData.amount.replace(/\./g, '')) || 0) / formData.tenor).toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between mb-2"><span>Jasa/Bulan</span><span className="font-sans not-italic font-bold text-slate-700 font-mono text-sm">Rp {Math.round(((Number(formData.amount.replace(/\./g, '')) || 0) * formData.interest) / 100).toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between pt-3 border-t-2 border-dashed border-slate-200 text-indigo-600"><span className="text-xs uppercase tracking-widest">Estimasi Angsuran</span><span className="text-xl font-mono">Rp {(Math.round((Number(formData.amount.replace(/\./g, '')) || 0) / formData.tenor) + Math.round(((Number(formData.amount.replace(/\./g, '')) || 0) * formData.interest) / 100)).toLocaleString('id-ID')}</span></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">{loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Konfirmasi Pencairan</button>
                </form>
            </div>
        </div>
    );
};

export default LoanDisbursementModal;