import React, { useState } from "react";
import { X, Send, AlertTriangle, Wallet } from "lucide-react";

export default function HandoverModal({ summary, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Hitung saldo riil di laci saat ini
  const drawerBalance = summary.totalSales - summary.totalHandover;

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputAmount = Number(amount);

    // --- LOGIKA VALIDASI (PAGAR PEMBATAS) ---
    if (inputAmount <= 0) {
      setError("Jumlah setoran harus lebih dari 0!");
      return;
    }

    if (inputAmount > drawerBalance) {
      setError(`Gagal! Saldo laci hanya Rp ${drawerBalance.toLocaleString()}. Tidak bisa setor lebih.`);
      return;
    }

    // Jika lolos validasi
    onSave(inputAmount);
  };

  // Fungsi untuk mengubah angka jadi format titik (1.000.000)
  const formatDisplay = (val) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Fungsi untuk menghapus titik agar sistem bisa menghitung angkanya
  const parseNumber = (val) => {
    return val.replace(/\./g, "");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="bg-indigo-800 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-700 p-2 rounded-xl">
              <Send size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter italic">Setoran Kas Laci</h3>
              <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Handover Cashier</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-700 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {/* INFO SALDO LACI */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-6 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Uang di Laci Saat Ini</p>
              <p className="text-xl font-black text-slate-700 font-mono">Rp {drawerBalance.toLocaleString()}</p>
            </div>
            <Wallet className="text-slate-300" size={32} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-indigo-600 uppercase ml-2 mb-1 block">Jumlah yang Akan Disetor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-600">Rp</span>
                <input 
                  type="text"
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-xl font-black text-slate-600 font-mono outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  placeholder="0"
                  value={amount ? Number(amount).toLocaleString() : ""}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/\D/g, "");
                    setAmount(cleanValue);
                    if (typeof setError === "function") setError(""); 
                  }}
                />
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 animate-bounce">
                <AlertTriangle size={16} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase leading-tight">{error}</p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setAmount(drawerBalance);
                  setError("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase transition active:scale-95"
              >
                Setor Semua
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 transition active:scale-95 flex items-center justify-center gap-2"
              >
                Konfirmasi
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 p-4 text-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed italic">
            "Pastikan uang fisik yang disetorkan sesuai dengan jumlah yang diinput."
          </p>
        </div>
      </div>
    </div>
  );
}