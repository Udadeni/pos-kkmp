import React from 'react';
import { Wallet, HandCoins } from 'lucide-react';

const MemberTabsNav = ({ activeTab, setActiveTab }) => {
    return (
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-[2.5rem] shadow-xl w-fit border border-slate-50 overflow-x-auto no-scrollbar print:hidden">
            <button onClick={() => setActiveTab('simpanan')} className={`px-8 py-4 rounded-[2rem] text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'simpanan' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-indigo-600'}`}><Wallet size={16} /> Simpanan</button>
            <button onClick={() => setActiveTab('pinjaman')} className={`px-8 py-4 rounded-[2rem] text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pinjaman' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-indigo-600'}`}><HandCoins size={16} /> Pinjaman</button>
        </div>
    );
};

export default MemberTabsNav;