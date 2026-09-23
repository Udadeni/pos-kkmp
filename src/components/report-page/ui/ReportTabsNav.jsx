import React from "react";
import { ShoppingCart, Box, ShieldCheck, BarChart3, Package } from "lucide-react";

export default function ReportTabsNav({ activeTab, setActiveTab, isCashier }) {
  const tabs = [
    { id: "sales", label: "Penjualan", icon: <ShoppingCart size={14} /> },
    { id: "stock_card", label: "Kartu Stok", icon: <Box size={14} /> },
    { id: "audit", label: "Audit Kas", icon: <ShieldCheck size={14} />, adminOnly: true },
    { id: "analysis", label: "Terlaris", icon: <BarChart3 size={14} /> },
    { id: "purchase", label: "Pembelian", icon: <Package size={14} />, adminOnly: true },
  ];

  return (
    <div className="flex gap-2 mb-8 bg-white p-2 rounded-[2rem] shadow-xl w-fit border border-slate-50 overflow-x-auto no-scrollbar font-black uppercase italic text-[9px] tracking-widest">
      {tabs
        .filter((t) => !isCashier || !t.adminOnly)
        .map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] transition-all duration-200 ${activeTab === t.id
              ? "bg-indigo-600 text-white shadow-xl scale-[1.02]"
              : "text-slate-500 hover:bg-slate-100/80 hover:shadow-md hover:text-slate-800 hover:-translate-y-0.5 active:translate-y-0"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
    </div>
  );
}