// src/components/financial-report/ui/ReportTabsNav.jsx
import React from 'react';
import {
  PieChart, Scale, Layers, Users, Wallet, ListChecks, BookOpen, BarChart3
} from 'lucide-react';

const ReportTabsNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'laba_rugi', label: 'Laba Rugi', icon: PieChart },
    { id: 'neraca', label: 'Neraca', icon: Scale },
    { id: 'ekuitas', label: 'Ekuitas', icon: Layers },
    { id: 'member_recap', label: 'Rekap Anggota', icon: Users },
    { id: 'arus_kas', label: 'Arus Kas', icon: Wallet },
    { id: 'neraca_saldo', label: 'Neraca Saldo', icon: ListChecks },
    { id: 'buku_besar', label: 'Buku Besar', icon: BookOpen },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <div className="flex gap-2 mb-2 bg-white p-2 rounded-[2.5rem] shadow-xl w-full overflow-x-auto no-scrollbar border border-slate-50 font-black uppercase italic text-[9px] tracking-widest">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`px-6 py-4 rounded-[2rem] transition-all flex items-center gap-2 shrink-0 ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <t.icon size={16} /> {t.label}
        </button>
      ))}
    </div>
  );
};

export default ReportTabsNav;