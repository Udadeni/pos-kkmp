import React from 'react';
import { Plus, TrendingDown } from 'lucide-react';
import { getLocalYYYYMMDD } from '../../utils/dateHelpers';

const SimpananPanel = ({ savingsSummary, setFormData, setShowModal }) => {
    return (
        <>
            <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 font-sans not-italic">Saldo Simpanan</h4>
            <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b pb-3"><span>Pokok</span><span>Rp {savingsSummary.pokok.toLocaleString()}</span></div>
                <div className="flex justify-between border-b pb-3"><span>Wajib</span><span>Rp {savingsSummary.wajib.toLocaleString()}</span></div>
                <div className="flex justify-between border-b pb-3 text-indigo-600"><span>Sukarela</span><span>Rp {savingsSummary.sukarela.toLocaleString()}</span></div>
            </div>
            <div className="flex flex-col gap-3 font-sans not-italic font-black text-[10px] uppercase tracking-widest">
                <button onClick={() => { setFormData({ type: 'WAJIB', amount: '', note: '', date: getLocalYYYYMMDD() }); setShowModal('deposit'); }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"><Plus size={16} /> Input Setoran</button>
                <button onClick={() => { setFormData({ type: 'TARIK_SUKARELA', amount: '', note: '', date: getLocalYYYYMMDD() }); setShowModal('withdraw'); }} className="w-full bg-white border-2 border-slate-100 text-slate-500 py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><TrendingDown size={16} /> Penarikan Sukarela</button>
            </div>
        </>
    );
};

export default SimpananPanel;