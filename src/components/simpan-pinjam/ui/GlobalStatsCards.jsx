import React from 'react';
import { PieChart, TrendingUp, Wallet, HandCoins } from 'lucide-react';

const GlobalStatsCards = ({ globalStats, fetchGlobalPokokDetails, fetchGlobalWajibMatrix, fetchGlobalSukarelaDetails, fetchGlobalLoanDetails }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 print:hidden">
            <button onClick={fetchGlobalPokokDetails} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-indigo-50 transition-all text-left group"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><PieChart size={24} /></div><div><p className="text-[10px] text-slate-400 not-italic font-sans font-bold uppercase tracking-widest">Simpanan Pokok</p><p className="text-lg">Rp {globalStats.pokok.toLocaleString('id-ID')}</p></div></button>
            <button onClick={fetchGlobalWajibMatrix} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-emerald-50 transition-all text-left group"><div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div><div><p className="text-[10px] text-slate-400 not-italic font-sans font-bold uppercase tracking-widest">Simpanan Wajib</p><p className="text-lg text-emerald-600">Rp {globalStats.wajib.toLocaleString('id-ID')}</p></div></button>
            <button onClick={fetchGlobalSukarelaDetails} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-amber-50 transition-all text-left group"><div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div><div><p className="text-[10px] text-slate-400 not-italic font-sans font-bold uppercase tracking-widest">Simpanan Sukarela</p><p className="text-lg text-amber-600">Rp {globalStats.sukarela.toLocaleString('id-ID')}</p></div></button>
            <button onClick={fetchGlobalLoanDetails} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-red-50 transition-all text-left group"><div className="p-4 bg-red-100 text-red-600 rounded-2xl group-hover:scale-110 transition-transform"><HandCoins size={24} /></div><div><p className="text-[10px] text-slate-400 not-italic font-sans font-bold uppercase tracking-widest">Total Piutang</p><p className="text-lg text-red-600">Rp {globalStats.pinjaman.toLocaleString('id-ID')}</p></div></button>
        </div>
    );
};

export default GlobalStatsCards;