import React from 'react';
import { HandCoins } from 'lucide-react';

const PinjamanPanel = ({ activeLoans, setSelectedLoan, formData, setFormData, setShowModal }) => {
    return (
        <div className="space-y-6">
            {activeLoans.length > 0 ? activeLoans.map(loan => (
                <div key={loan.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-indigo-600 text-[10px] mb-2 tracking-widest font-sans not-italic font-bold uppercase">Pinjaman Berjalan</p>
                    <h3 className="text-2xl leading-none text-slate-800 mb-4">Rp {loan.principal_amount.toLocaleString('id-ID')}</h3>
                    <div className="space-y-2 mb-6 not-italic font-sans font-bold text-[10px] uppercase tracking-wider text-slate-500">
                        <div className="flex justify-between"><span>Tenor</span><span className="text-slate-800">{loan.tenor} Bln</span></div>
                        <div className="flex justify-between"><span>Sisa Hutang</span><span className="text-red-600 font-black">Rp {(loan.remaining_balance || 0).toLocaleString('id-ID')}</span></div>
                    </div>
                    <button onClick={() => { setSelectedLoan(loan); setFormData({ ...formData, payPrincipal: Math.round(loan.monthly_principal).toString(), payInterest: Math.round(loan.monthly_interest).toString(), payNote: '' }); setShowModal('payment'); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all font-black uppercase">Bayar Angsuran</button>
                </div>
            )) : (
                <div className="text-center py-10">
                    <HandCoins size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] text-slate-400 mb-6">TIDAK ADA PINJAMAN AKTIF</p>
                    <button onClick={() => { setFormData({ ...formData, amount: '', note: '' }); setShowModal('new_loan'); }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all font-black uppercase">Cairkan Pinjaman Baru</button>
                </div>
            )}
        </div>
    );
};

export default PinjamanPanel;