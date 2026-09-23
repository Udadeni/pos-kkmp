import React from "react";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";

const CartPanel = ({ cart, onUpdateQty, stats }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header Mungil */}
      <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={14} className="text-indigo-600" />
          <h2 className="font-black uppercase italic text-slate-800 text-[14px] tracking-tighter">Daftar Belanja</h2>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[12px] font-black">
          {stats.total_items} ITEM
        </span>
      </div>

      {/* List Barang Super Padat */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar bg-slate-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
            <ShoppingCart size={24} className="mb-1" />
            <p className="text-[14px] font-black uppercase">Kosong</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all">
              
              {/* BARIS UTAMA: Nama, Qty Control, dan Hapus */}
              <div className="flex items-center justify-between gap-2">
                <p className="font-black uppercase text-[14px] text-slate-700 truncate flex-1 leading-none">
                  {item.name}
                </p>

                {/* Tombol Qty - Digeser ke atas samping tempat sampah */}
                <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                  <button 
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center font-black text-[12px] text-indigo-700">{item.qty}</span>
                  <button 
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-5 h-5 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-indigo-600 transition-all"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <button 
                  onClick={() => onUpdateQty(item.id, 0)}
                  className="text-slate-200 hover:text-red-500 transition-colors ml-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* BARIS KEDUA: Harga Satuan & Subtotal */}
              <div className="flex justify-between items-end mt-0 opacity-80">
                <p className="text-[13px] font-bold text-slate-600 font-mono">
                  @ {((item.current_sell_price || item.price || 0)).toLocaleString('id-ID')}
                </p>
                <p className="font-black text-[13px] text-slate-600 font-mono">
                  Rp {(item.qty * (item.current_sell_price || item.price || 0)).toLocaleString('id-ID')}
                </p>
              </div>

            </div>
          ))
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CartPanel;