import React from 'react';
import { History, ListChecks, LayoutList, Printer } from 'lucide-react';

const RightPanelTabsNav = ({ rightPanelTab, setRightPanelTab }) => {
    return (
        <div className="bg-slate-50 p-2 flex gap-1 border-b print:hidden">
            <button onClick={() => setRightPanelTab('history')} className={`flex-1 py-3 rounded-2xl text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all ${rightPanelTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><History size={14} /> Rekening Koran</button>
            <button onClick={() => setRightPanelTab('wajib_matrix')} className={`flex-1 py-3 rounded-2xl text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all ${rightPanelTab === 'wajib_matrix' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><ListChecks size={14} /> Monitor Wajib</button>
            <button onClick={() => setRightPanelTab('loan_card')} className={`flex-1 py-3 rounded-2xl text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all ${rightPanelTab === 'loan_card' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}><LayoutList size={14} /> Kartu Pinjaman</button>
            <button onClick={() => window.print()} className="p-3 rounded-2xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"><Printer size={14} /></button>
        </div>
    );
};

export default RightPanelTabsNav;