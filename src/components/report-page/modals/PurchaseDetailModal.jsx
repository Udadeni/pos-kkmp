import React from "react";
import { Printer, X } from "lucide-react";
import { APP_SETTINGS } from "../../../constants/settings";

export default function PurchaseDetailModal({
  selectedPurchaseId,
  purchases,
  purchaseDetails,
  loadingPurchase,
  onClose
}) {
  if (!selectedPurchaseId) return null;

  const currentPurchase = purchases.find((p) => p.id === selectedPurchaseId);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] print:max-h-none print:shadow-none print:w-full">

        {/* Header Modal */}
        <div className="bg-indigo-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="font-black italic uppercase leading-none">
            <p className="text-[9px] text-indigo-400 mb-1 font-sans not-italic font-bold tracking-widest uppercase">
              Detail Faktur Masuk
            </p>
            <h3 className="text-xl">{currentPurchase?.invoice_number}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 bg-white/10 rounded-full hover:bg-indigo-500 transition-all"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 rounded-full hover:bg-red-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div id="printable-area" className="p-8 overflow-y-auto flex-1 bg-white font-black uppercase text-[10px] italic">
          {loadingPurchase ? (
            <div className="py-10 text-center animate-pulse">Menyiapkan Data...</div>
          ) : (
            <div className="w-full">
              <div className="text-center mb-6 border-b pb-4 border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">{APP_SETTINGS.ORG_NAME}</h2>
                <p className="text-xs text-slate-600">FAKTUR PEMBELIAN / BARANG MASUK</p>
                <p className="text-xs text-indigo-700 font-mono mt-1">
                  NO. FAKTUR: {currentPurchase?.invoice_number}
                </p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="text-[9px] text-slate-400 border-b font-sans not-italic tracking-widest uppercase">
                  <tr>
                    <th className="py-2">Produk</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Harga Beli</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-slate-800 pr-4 leading-tight">{item.product_name}</td>
                      <td className="py-2 text-center font-mono">{item.qty}</td>
                      <td className="py-2 text-right font-mono">
                        Rp {Number(item.buy_price || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 text-right text-slate-900 font-mono font-black text-xs">
                        Rp {Number(item.line_total || item.qty * (item.buy_price || 0)).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 border-t border-slate-200 pt-4 flex justify-between items-center">
                <div className="uppercase font-sans not-italic font-black text-[9px] text-slate-400 tracking-widest">
                  Total Nilai Faktur
                </div>
                <div className="text-xl text-slate-900 font-mono font-black italic">
                  Rp {purchaseDetails.reduce((sum, item) => sum + Number(item.line_total || item.qty * (item.buy_price || 0)), 0).toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}