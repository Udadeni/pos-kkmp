import React, { useState, useMemo } from "react";
import { Receipt, User, CreditCard, Users, Search, X, FileText } from "lucide-react";

export default function PaymentPanel({ state, members, onCheckout, loading }) {
  const { 
    cart, cartStats, paidAmount, setPaidAmount, 
    paymentMethod, setPaymentMethod, 
    customerType, setCustomerType,
    selectedMemberId, setSelectedMemberId 
  } = state;

  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const formatDisplay = (val) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/\./g, "");
    if (!isNaN(rawValue)) setPaidAmount(rawValue);
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm || selectedMemberId) return [];
    return members.filter(m => 
      (m.full_name || m.name || "").toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      (m.member_number || m.number || "").includes(memberSearchTerm)
    ).slice(0, 5);
  }, [members, memberSearchTerm, selectedMemberId]);

  const selectedMemberData = useMemo(() => members.find(m => m.id === selectedMemberId), [members, selectedMemberId]);

  const triggerCheckout = () => {
    if (loading || cart.length === 0) return;
    if (customerType === 'ANGGOTA' && !selectedMemberId) {
      alert("Pilih Anggota Terlebih Dahulu!"); return;
    }
    
    // Jika BON/PIUTANG, pastikan pelanggan adalah ANGGOTA
    if (paymentMethod === 'DEBT' && customerType !== 'ANGGOTA') {
      alert("Metode BON/PIUTANG hanya berlaku untuk Anggota Koperasi!");
      return;
    }

    onCheckout({
      // Jika bukan tunai (QRIS/Transfer/Bon), anggap uang pas senilai grand_total
      paidAmount: paymentMethod === "CASH" ? (Number(paidAmount) || 0) : cartStats.grand_total,
      paymentMethod: paymentMethod,
    });
  };

  return (
    <div className="bg-white p-3 border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0">
      
      {/* 1. PELANGGAN & METODE (DIMUNCULKAN LAGI BON/PIUTANG) */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="relative">
          <select 
            className={`w-full p-2 pl-3 rounded-xl border text-[10px] font-black outline-none appearance-none cursor-pointer ${customerType === 'ANGGOTA' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
            value={customerType} 
            onChange={e => { 
                setCustomerType(e.target.value); 
                setSelectedMemberId(""); 
                setMemberSearchTerm(""); 
            }}
          >
            <option value="UMUM">👤 UMUM</option>
            <option value="ANGGOTA">👥 ANGGOTA</option>
          </select>
        </div>

        <div className="relative">
          <select 
            className={`w-full p-2 pl-3 rounded-xl border text-[10px] font-black outline-none uppercase appearance-none cursor-pointer ${paymentMethod === 'DEBT' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
            value={paymentMethod} 
            onChange={e => setPaymentMethod(e.target.value)}
          >
            <option value="CASH">💵 TUNAI</option>
            <option value="TRANSFER">🏦 BANK</option>
            <option value="QRIS">📱 QRIS</option>
            <option value="DEBT">📝 BON / PIUTANG</option>
          </select>
        </div>
      </div>

      {/* 2. SEARCH ANGGOTA (SLIM) */}
      {customerType === "ANGGOTA" && (
        <div className="mb-2 relative animate-in slide-in-from-top-1">
          {selectedMemberId ? (
            <div className="flex items-center justify-between bg-indigo-600 text-white px-3 py-1.5 rounded-xl border border-indigo-700 shadow-sm">
              <p className="text-[9px] font-black uppercase truncate pr-2">
                {selectedMemberData?.full_name || selectedMemberData?.name}
              </p>
              <button onClick={() => { setSelectedMemberId(""); setMemberSearchTerm(""); }} className="hover:bg-red-500 p-0.5 rounded-full transition"><X size={12} /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-300" size={12} />
              <input 
                type="text" placeholder="Cari Nama / No Anggota..."
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-indigo-100 text-[10px] font-bold bg-indigo-50/30 outline-none focus:border-indigo-500"
                value={memberSearchTerm} onChange={e => setMemberSearchTerm(e.target.value)}
              />
              {filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 bg-white border border-indigo-200 rounded-xl shadow-2xl mb-1 z-[100] overflow-hidden">
                  {filteredMembers.map(m => (
                    <button key={m.id} onMouseDown={() => { setSelectedMemberId(m.id); setMemberSearchTerm(""); }} className="w-full text-left p-2 hover:bg-indigo-600 hover:text-white border-b last:border-0 border-slate-50 transition text-[9px] font-black uppercase">{m.full_name || m.name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. RINGKASAN PEMBAYARAN */}
      <div className="bg-slate-900 rounded-[1.5rem] p-3 space-y-2 mb-2 text-white">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase text-slate-400 italic">Grand Total</span>
          <span className="text-2xl font-black tracking-tighter font-mono text-yellow-400">
            Rp {cartStats.grand_total.toLocaleString('id-ID')}
          </span>
        </div>

        {paymentMethod === "CASH" ? (
          <>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-[9px] font-black uppercase text-slate-400 italic">Bayar (Rp)</span>
              <input 
                type="text" inputMode="numeric"
                className="w-32 text-right bg-white/10 border-none rounded-lg px-2 py-1 font-black text-white text-lg outline-none focus:ring-1 focus:ring-yellow-400 font-mono" 
                value={formatDisplay(paidAmount)} 
                onFocus={e => e.target.select()}
                onChange={handleInputChange} 
                onKeyDown={(e) => e.key === 'Enter' && triggerCheckout()}
                placeholder="0" 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-emerald-400 italic">Kembali</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                Rp {((Number(paidAmount) || 0) - cartStats.grand_total).toLocaleString('id-ID')}
              </span>
            </div>
          </>
        ) : (
          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2">
             <FileText size={12} className={paymentMethod === 'DEBT' ? 'text-red-400' : 'text-indigo-400'} />
             <span className={`text-[10px] font-black uppercase ${paymentMethod === 'DEBT' ? 'text-red-400' : 'text-indigo-400'}`}>
               {paymentMethod === 'DEBT' ? 'Sistem Catat Sebagai Piutang' : 'Bayar Non-Tunai (Uang Pas)'}
             </span>
          </div>
        )}
      </div>

      <button 
        disabled={loading || cart.length === 0 || (customerType === 'ANGGOTA' && !selectedMemberId)}
        onClick={triggerCheckout}
        className={`w-full py-3.5 rounded-[1.5rem] font-black text-base transition disabled:bg-slate-200 flex items-center justify-center gap-2 active:scale-95 uppercase shadow-lg ${paymentMethod === 'DEBT' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
      >
        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <><Receipt size={18}/> {paymentMethod === 'DEBT' ? 'CATAT BON / PIUTANG' : 'SIMPAN & CETAK'}</>}
      </button>
    </div>
  );
}