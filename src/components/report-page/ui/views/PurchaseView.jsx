import React from "react";
import { Eye } from "lucide-react";

export default function PurchaseView({ purchases, getTrxDate, handleViewPurchaseDetail }) {
  const sortedPurchases = [...purchases].sort((a, b) => getTrxDate(b) - getTrxDate(a));

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <table className="w-full text-left text-[11px] uppercase italic font-black">
        <thead className="bg-slate-50 text-[9px] text-slate-400 border-b tracking-widest uppercase">
          <tr>
            <th className="py-4 px-6 text-left">Tgl</th>
            <th className="py-4 px-6 text-left">Nota Faktur</th>
            <th className="py-4 px-6 text-left">Supplier</th>
            <th className="py-4 px-6 text-right">Nilai Pembelian</th>
            <th className="py-4 px-6 text-center">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-black">
          {sortedPurchases.map(p => (
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2 px-6 text-slate-400 font-sans not-italic text-sm">
                {p.purchase_date || getTrxDate(p).toLocaleDateString('id-ID')}
              </td>
              <td className="py-2 px-6 font-mono text-indigo-600 text-sm">
                {p.invoice_number}
              </td>
              <td className="py-2 px-6 text-slate-700 text-sm">
                {p.supplier_name}
              </td>
              <td className="py-2 px-6 text-right font-mono text-sm">
                Rp {Number(p.grand_total || p.total_amount || 0).toLocaleString('id-ID')}
              </td>
              <td className="py-2 px-6 text-center text-sm">
                <button onClick={() => handleViewPurchaseDetail(p)} className="text-indigo-600 hover:scale-125 transition-transform">
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
          {sortedPurchases.length === 0 && (
            <tr>
              <td colSpan="5" className="py-10 text-center text-slate-300 italic tracking-[0.2em] font-black uppercase text-xs">
                Data pembelian tidak ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}