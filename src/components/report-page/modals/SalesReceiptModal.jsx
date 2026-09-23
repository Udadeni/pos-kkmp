import React from "react";
import { RefreshCw, Printer, X } from "lucide-react";
import { APP_SETTINGS } from "../../../constants/settings";
import { buildReprintReceiptBlocks, preBase } from "../utils/receiptPrinter";

export default function SalesReceiptModal({
  selectedSaleHeader,
  selectedSaleItems,
  loadingItems,
  onClose,
  getTrxDate
}) {
  if (!selectedSaleHeader) return null;

  const receiptBlocks = buildReprintReceiptBlocks({
    ...selectedSaleHeader,
    items: selectedSaleItems
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 print:p-0 print:bg-white print:static">
      {/* TAMPILAN MONITOR */}
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:hidden">
        <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
          <div className="font-black italic uppercase">
            <p className="text-[10px] text-indigo-400 tracking-widest mb-1 font-sans not-italic font-bold">
              Nota Penjualan
            </p>
            <h3 className="text-xl leading-none">{selectedSaleHeader.invoice_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 rounded-full hover:bg-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 font-mono text-[10px] flex flex-col items-center">
          {loadingItems ? (
            <RefreshCw className="animate-spin text-indigo-600 py-10" />
          ) : (
            <div className="w-full max-w-[58mm] text-black">
              <div className="text-center mb-4">
                <h2 className="font-bold text-sm uppercase">{APP_SETTINGS.ORG_NAME}</h2>
                <p className="font-black italic uppercase bg-black text-white py-1 rounded mt-2">
                  ** SALINAN **
                </p>
              </div>
              <div className="mb-4 space-y-1 uppercase font-black italic">
                <p className="flex justify-between">
                  <span>No</span>
                  <span>{selectedSaleHeader.invoice_number}</span>
                </p>
                <p className="flex justify-between">
                  <span>Tgl</span>
                  <span>{getTrxDate(selectedSaleHeader).toLocaleString("id-ID")}</span>
                </p>
              </div>
              <div className="mb-4 space-y-2 uppercase italic font-bold border-y border-dashed border-black/20 py-4">
                {selectedSaleItems.map((item, i) => (
                  <div key={i}>
                    <p>{item.product_name || item.name}</p>
                    <div className="flex justify-between pl-2">
                      <span>
                        {item.qty} x {(item.sell_price || item.price || 0).toLocaleString()}
                      </span>
                      <span>
                        {(item.qty * (item.sell_price || item.price || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1 uppercase font-black italic text-right text-xs">
                <div className="flex justify-between font-black text-sm pt-2">
                  <span>TOTAL</span>
                  <span>Rp {(selectedSaleHeader.grand_total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!loadingItems && (
          <div className="p-6 bg-slate-50 border-t">
            <button
              onClick={() => window.print()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
            >
              <Printer size={18} /> Cetak Struk
            </button>
          </div>
        )}
      </div>

      {/* STRUK PHYSICAL PRINTER (PRINT ONLY) */}
      {receiptBlocks && (
        <div id="receipt-container" className="hidden print:block text-black">
          <pre style={{ ...preBase, fontSize: "6pt", fontWeight: "bold", lineHeight: 1.35 }}>
            {receiptBlocks.header}
          </pre>
          <pre style={{ ...preBase, fontSize: "6.5pt", lineHeight: 1.4, marginTop: "4px" }}>
            {receiptBlocks.info}
          </pre>
          <pre style={{ ...preBase, fontSize: "6.5pt", lineHeight: 1.4 }}>
            {receiptBlocks.items}
          </pre>
          <pre style={{ ...preBase, fontSize: "7pt", fontWeight: "bold", lineHeight: 1.5 }}>
            {receiptBlocks.totals}
          </pre>
          <pre style={{ ...preBase, fontSize: "7pt", lineHeight: 1.4, marginTop: "6px" }}>
            {receiptBlocks.footer}
          </pre>
        </div>
      )}
    </div>
  );
}