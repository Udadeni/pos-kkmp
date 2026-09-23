import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

export default function AnalysisView({ reportData, products }) {
  const bestSellers = reportData?.bestSellers || [];
  const lowStockProducts = products
    .filter(p => Number(p.current_stock || 0) < 5)
    .sort((a, b) => Number(a.current_stock || 0) - Number(b.current_stock || 0))
    .slice(0, 10);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in duration-500">
      <div className="bg-indigo-50 p-8 rounded-[3rem]">
        <h3 className="text-[10px] text-indigo-400 mb-6 flex items-center gap-2 tracking-widest font-sans not-italic font-bold uppercase">
          <TrendingUp size={16} /> 10 Produk Terlaris
        </h3>
        <div className="space-y-3">
          {bestSellers.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-indigo-100">
              <span className="text-xs leading-none uppercase italic font-black text-slate-700">
                {idx + 1}. {item.name}
              </span>
              <span className="text-indigo-700 text-xs font-mono font-black italic">
                {item.qty} {item.unit}
              </span>
            </div>
          ))}
          {bestSellers.length === 0 && (
            <p className="text-xs text-slate-400 italic">Tidak ada data penjualan</p>
          )}
        </div>
      </div>

      <div className="bg-red-50 p-8 rounded-[3rem]">
        <h3 className="text-[10px] text-red-400 mb-6 flex items-center gap-2 tracking-widest font-sans not-italic font-bold uppercase">
          <AlertCircle size={16} /> Hampir Habis / Restock
        </h3>
        <div className="space-y-2">
          {lowStockProducts.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3.5 bg-white rounded-2xl text-red-700 text-xs border border-red-100 uppercase italic font-black">
              <span>{p.name}</span>
              <span className="font-mono bg-red-100 px-3 py-1 rounded-full">{p.current_stock}</span>
            </div>
          ))}
          {lowStockProducts.length === 0 && (
            <p className="text-xs text-slate-400 italic">Stok produk aman</p>
          )}
        </div>
      </div>
    </div>
  );
}