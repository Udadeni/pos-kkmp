import React from "react";
import { Search } from "lucide-react";

export default function StockCardView({
  products,
  dynamicCategories,
  groupedMutations,
  productDetailHistory,
  selectedCategory,
  setSelectedCategory,
  selectedProductStock,
  setSelectedProductStock,
  stockSearchText,
  setStockSearchText,
  showStockList,
  setShowStockList
}) {
  return (
    <div className="p-8 space-y-6">
      <div className="bg-slate-50 p-6 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div>
          <label className="text-[9px] text-slate-400 mb-2 block tracking-widest font-sans not-italic font-bold">
            Rekap per Kategori
          </label>
          <select
            className="w-full bg-white border-none p-4 rounded-2xl text-xs outline-none shadow-sm font-black italic uppercase"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedProductStock("");
              setStockSearchText("");
            }}
          >
            <option value="">-- PILIH KATEGORI --</option>
            <option value="ALL">SEMUA KATEGORI</option>
            {dynamicCategories.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="text-[9px] text-slate-400 mb-2 block tracking-widest font-sans not-italic font-bold italic">
            Detail per Produk
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="KETIK NAMA ATAU SCAN BARCODE..."
              className="w-full pl-12 pr-10 py-4 bg-white border-none rounded-2xl text-xs outline-none shadow-sm font-black italic"
              value={stockSearchText}
              onFocus={() => setShowStockList(true)}
              onChange={(e) => {
                const val = e.target.value;
                setStockSearchText(val);
                setShowStockList(true);

                const exactMatch = products.find(p => p.barcode === val);
                if (exactMatch) {
                  setSelectedProductStock(exactMatch.id);
                  setStockSearchText(exactMatch.name.toUpperCase());
                  setShowStockList(false);
                }
              }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          </div>

          {showStockList && stockSearchText && (
            <div className="absolute z-50 w-full mt-2 bg-white border rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 border-slate-100 no-scrollbar">
              {products
                .filter(p => p.name.toLowerCase().includes(stockSearchText.toLowerCase()) || p.barcode?.includes(stockSearchText))
                .slice(0, 15)
                .map(p => (
                  <div
                    key={p.id}
                    onMouseDown={() => {
                      setSelectedProductStock(p.id);
                      setStockSearchText(p.name.toUpperCase());
                      setShowStockList(false);
                    }}
                    className="p-3 hover:bg-indigo-600 hover:text-white cursor-pointer rounded-xl flex flex-col gap-0.5 transition group"
                  >
                    <span className="font-black text-[10px] uppercase italic">{p.name}</span>
                    <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">{p.barcode || '---'}</span>
                  </div>
                ))}
              {products.filter(p => p.name.toLowerCase().includes(stockSearchText.toLowerCase()) || p.barcode?.includes(stockSearchText)).length === 0 && (
                <div className="p-4 text-center text-[10px] text-slate-300 uppercase italic font-bold">Produk tidak ditemukan</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. DETAIL PRODUK SPESIFIK */}
      {selectedProductStock ? (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-2xl flex justify-between items-center text-xs font-black italic uppercase">
            <div>
              <p className="text-indigo-900 text-sm">
                {products.find(p => p.id === selectedProductStock)?.name}
              </p>
              <p className="text-[13px] text-slate-400 font-mono mt-0.5">
                BARCODE: {products.find(p => p.id === selectedProductStock)?.barcode || '---'}
              </p>
            </div>
            <button
              onClick={() => { setSelectedProductStock(""); setStockSearchText(""); }}
              className="text-[9px] bg-white px-3 py-1.5 rounded-xl border text-slate-600 hover:bg-slate-100"
            >
              Kembali ke Rekap
            </button>
          </div>

          {productDetailHistory.length > 0 ? (
            <table className="w-full text-left text-sm uppercase italic font-black">
              <thead className="bg-slate-50 text-[9px] text-slate-400 border-b tracking-widest uppercase">
                <tr>
                  <th className="py-2 px-4">Waktu</th>
                  <th className="py-2 px-4 text-center">Jenis</th>
                  <th className="py-2 px-4">Catatan / Ref</th>
                  <th className="py-2 px-4 text-center text-emerald-600">Masuk (+)</th>
                  <th className="py-2 px-4 text-right text-emerald-700">@ Harga Beli</th>
                  <th className="py-2 px-4 text-center text-red-600">Keluar (-)</th>
                  <th className="py-2 px-4 text-right text-red-700">@ Harga Jual</th>
                  <th className="py-2 px-4 text-right text-indigo-600">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-xs">
                {productDetailHistory.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-4 font-sans text-[10px] text-slate-500">{row.dateStr}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] ${row.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-sans text-xs text-slate-700">{row.notes}</td>
                    <td className="py-2 px-4 text-center text-emerald-600 bg-emerald-50/20">
                      {row.inQty > 0 ? `+${row.inQty}` : '-'}
                    </td>
                    <td className="py-2 px-4 text-right text-emerald-700 font-bold bg-emerald-50/20">
                      {row.inQty > 0 ? row.price.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-2 px-4 text-center text-red-600 bg-red-50/20">
                      {row.outQty > 0 ? `-${row.outQty}` : '-'}
                    </td>
                    <td className="py-2 px-4 text-right text-red-700 font-bold bg-red-50/20">
                      {row.outQty > 0 ? row.price.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {row.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-300 italic tracking-[0.2em] font-black uppercase">
              Tidak ada riwayat transaksi mutasi untuk produk ini pada periode terpilih
            </div>
          )}
        </div>
      ) : selectedCategory ? (
        /* 2. REKAPITULASI KATEGORI */
        groupedMutations.length > 0 ? (
          <table className="w-full text-left text-sm uppercase italic font-black">
            <thead className="bg-slate-50 text-[9px] text-slate-400 border-b tracking-widest uppercase">
              <tr>
                <th className="py-2 px-6">Produk / Barcode</th>
                <th className="py-2 px-6 text-center text-emerald-600">Masuk (+)</th>
                <th className="py-2 px-6 text-center text-red-600">Keluar (-)</th>
                <th className="py-2 px-6 text-right text-indigo-600">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedMutations.map((m, i) => (
                <tr key={m.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-1.5 px-6 leading-tight">
                    <p className="text-slate-800 text-xs">{m.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1 not-italic font-semibold tracking-wide">{m.barcode}</p>
                  </td>
                  <td className="py-1.5 px-6 text-center font-mono text-xs">
                    {m.total_in > 0 ? <span className="text-emerald-600">+{m.total_in}</span> : <span className="text-slate-800 font-black">-</span>}
                  </td>
                  <td className="py-1.5 px-6 text-center font-mono text-xs">
                    {m.total_out > 0 ? <span className="text-red-600">-{m.total_out}</span> : <span className="text-slate-800 font-black">-</span>}
                  </td>
                  <td className="py-1.5 px-6 text-right text-indigo-700 font-mono text-sm bg-indigo-50/10">
                    {m.last_stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center text-slate-300 italic tracking-[0.2em] font-black uppercase flex flex-col items-center gap-4">
            <Search size={40} className="opacity-10" />
            <p>Tidak ada data produk pada kategori ini</p>
          </div>
        )
      ) : (
        /* 3. BELUM PILIH KATEGORI */
        <div className="p-20 text-center text-slate-300 italic tracking-[0.2em] font-black uppercase flex flex-col items-center gap-4">
          <Search size={40} className="opacity-10" />
          <p>Silakan pilih kategori atau scan produk untuk melihat detail mutasi</p>
        </div>
      )}
    </div>
  );
}