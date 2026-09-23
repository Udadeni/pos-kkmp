import React from "react";
import { Search, Wallet, Landmark, CreditCard, Receipt, Eye } from "lucide-react";

export default function SalesView({
  filteredSales,
  paymentFilter,
  setPaymentFilter,
  salesSearchTerm,
  setSalesSearchTerm,
  reportData,
  getTrxDate,
  handleViewReceipt
}) {
  return (
    <div className="animate-in slide-in-from-right duration-500">
      {/* BARIS KONTROL & AGREGAT */}
      <div className="p-3 px-6 border-b border-slate-50 flex flex-nowrap items-center justify-between gap-4 bg-slate-50/30 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-11 bg-white border border-slate-200 px-3 rounded-xl text-[11px] outline-none shadow-sm font-black italic uppercase text-indigo-600 w-44 flex items-center"
          >
            <option value="ALL">SEMUA METODE BAYAR</option>
            <option value="CASH">CASH</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="QRIS">QRIS</option>
            <option value="DEBT">PIUTANG</option>
          </select>

          <div className="relative w-44 h-11 flex items-center">
            <Search className="absolute left-3 text-slate-300 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="CARI NOTA..."
              value={salesSearchTerm}
              onChange={(e) => setSalesSearchTerm(e.target.value)}
              className="w-full h-full bg-white border border-slate-200 pl-9 pr-3 rounded-xl text-[11px] outline-none shadow-sm font-black italic uppercase"
            />
          </div>
        </div>

        {/* AGREGAT */}
        <div className="h-11 bg-slate-900 px-6 rounded-xl text-white flex items-center gap-8 border-b-2 border-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-emerald-500 opacity-50" />
            <span className="text-[11px] text-slate-500 font-bold tracking-tighter uppercase">CASH</span>
            <span className="text-[20px] font-mono text-emerald-400 font-black italic ml-0.5">
              {(reportData?.paymentMethod?.CASH || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-indigo-500 opacity-50" />
            <span className="text-[11px] text-slate-500 font-bold tracking-tighter uppercase">BANK</span>
            <span className="text-[20px] font-mono text-indigo-400 font-black italic ml-0.5">
              {(reportData?.paymentMethod?.TRANSFER || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-yellow-500 opacity-50" />
            <span className="text-[11px] text-slate-500 font-bold tracking-tighter uppercase">QRIS</span>
            <span className="text-[20px] font-mono text-yellow-400 font-black italic ml-0.5">
              {(reportData?.paymentMethod?.QRIS || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-red-500 opacity-50" />
            <span className="text-[11px] text-slate-500 font-bold tracking-tighter uppercase">DEBT</span>
            <span className="text-[20px] font-mono text-red-400 font-black italic ml-0.5">
              {(reportData?.paymentMethod?.DEBT || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm uppercase italic">
          <thead className="bg-slate-50 text-[9px] text-slate-400 border-b tracking-widest uppercase">
            <tr>
              <th className="py-3 px-6">Nota</th>
              <th className="py-3 px-6">Waktu</th>
              <th className="py-3 px-6">Pelanggan</th>
              <th className="py-3 px-6">Alat Bayar</th>
              <th className="py-3 px-6 text-right">Total</th>
              <th className="py-3 px-6 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-black">
            {filteredSales.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition">
                <td className="py-2 px-6 font-mono text-indigo-600 text-xs">{s.invoice_number}</td>
                <td className="py-2 px-6 text-slate-400 font-sans not-italic text-xs">{getTrxDate(s).toLocaleString('id-ID')}</td>
                <td className="py-2 px-6">
                  {s.member_name ? (
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-xs">{s.member_name}</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-400 px-3 py-0.5 rounded-full text-xs">UMUM</span>
                  )}
                </td>
                <td className="py-2 px-6">
                  <span className={`text-xs px-2 py-0.5 rounded border ${s.payment_method === 'DEBT' ? 'border-red-200 text-red-600 bg-red-50' :
                    s.payment_method === 'CASH' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                      'border-indigo-200 text-indigo-600 bg-indigo-50'
                    }`}>
                    {s.payment_method || 'CASH'}
                  </span>
                </td>
                <td className="py-2 px-6 text-right font-mono text-l">RP {Number(s.grand_total || 0).toLocaleString('id-ID')}</td>
                <td className="py-2 px-6 text-center">
                  <button onClick={() => handleViewReceipt(s)} className="text-indigo-600 hover:scale-125 transition-transform">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-300 italic tracking-[0.2em] font-black uppercase text-xs">Data penjualan tidak ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}