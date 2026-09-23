import React from 'react';
import { X, CreditCard } from 'lucide-react';
import { formatNumber } from '../utils/numberFormat';

const LoanPaymentModal = ({
    selectedMember, selectedLoan,
    formData, setFormData,
    setShowModal,
    handleLoanRepayment,
    loading,
}) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-start p-4 overflow-y-auto pt-24 pb-10">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 font-black italic uppercase text-slate-800">
                <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl leading-none italic">Bayar Angsuran</h3>
                        <p className="text-[10px] font-sans not-italic font-bold uppercase tracking-widest opacity-70 mt-1">{selectedLoan.ref_no} — {selectedMember?.full_name}</p>
                    </div>
                    <button onClick={() => setShowModal(null)} className="text-white"><X /></button>
                </div>
                <form onSubmit={handleLoanRepayment} className="p-8 space-y-6 not-italic font-sans">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Pokok (Rp)</label>
                            <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100" value={formatNumber(formData.payPrincipal)} onChange={(e) => setFormData({ ...formData, payPrincipal: e.target.value.replace(/\./g, '') })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Jasa (Rp)</label>
                            <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-indigo-900 outline-none focus:ring-4 focus:ring-indigo-100" value={formatNumber(formData.payInterest)} onChange={(e) => setFormData({ ...formData, payInterest: e.target.value.replace(/\./g, '') })} />
                        </div>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 flex justify-between items-center font-black italic uppercase">
                        <span className="text-xs text-indigo-900">Total Bayar</span>
                        <span className="text-2xl text-indigo-900 font-mono">Rp {(Number(formData.payPrincipal.replace(/\./g, '')) + Number(formData.payInterest.replace(/\./g, ''))).toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Catatan</label>
                        <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold uppercase italic text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-100" value={formData.payNote} onChange={(e) => setFormData({ ...formData, payNote: e.target.value })} placeholder="..." onKeyDown={e => { if (e.key === 'Enter') handleLoanRepayment(e); }} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">{loading ? 'Memproses...' : <CreditCard size={18} />} Konfirmasi Pembayaran</button>
                </form>
            </div>
        </div>
    );
};

export default LoanPaymentModal;