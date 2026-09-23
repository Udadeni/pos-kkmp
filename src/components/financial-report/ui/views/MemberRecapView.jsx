// src/components/financial-report/ui/views/MemberRecapView.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const MemberRecapView = ({ memberRecap, memberRecapError }) => {
  if (memberRecapError) {
    return (
      <div className="p-16 bg-red-50 rounded-[3rem] border-4 border-dashed border-red-200 text-center animate-in zoom-in">
        <AlertCircle size={64} className="text-red-400 mx-auto mb-4" />
        <p className="text-red-800 font-black uppercase italic tracking-tighter text-xl">{memberRecapError}</p>
      </div>
    );
  }

  // Helper untuk format nilai Rp 0 menjadi '-' center
  const renderValue = (val, customColor = "") => {
    if (!val || val === 0) {
      return <div className="text-right text-slate-300 font-bold">-</div>;
    }
    return <div className={`text-right ${customColor}`}>{formatCurrency(val)}</div>;
  };

  let tPokok = 0, tWajib = 0, tSukarela = 0, tBelanja = 0, tJasa = 0;

  return (
    <div className="animate-in slide-in-from-bottom duration-500 print:m-0">
      <div className="overflow-x-auto bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm print:p-0 print:border-none print:rounded-none print:shadow-none">
        <table className="w-full text-xs uppercase italic font-bold print:text-[9px]">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 print:border-b-2">
              <th className="py-2 text-left print:py-1">ID Anggota</th>
              <th className="py-2 text-left print:py-1">Nama Anggota</th>
              <th className="py-2 text-right print:py-1">Pokok+Wajib</th>
              <th className="py-2 text-right print:py-1">Sukarela</th>
              <th className="py-2 text-right text-indigo-600 print:py-1 print:text-black">Toko</th>
              <th className="py-2 text-right text-emerald-600 print:py-1 print:text-black">Jasa</th>
              <th className="py-2 text-right print:py-1">Total SHU</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {memberRecap.map((m, i) => {
              tPokok += m.pokok; tWajib += m.wajib; tSukarela += m.sukarela;
              tBelanja += m.belanja; tJasa += m.jasa_pinjaman;
              const totalPartisipasi = m.sukarela + m.belanja + m.jasa_pinjaman;

              return (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-2 font-mono text-indigo-600 text-[10px] print:py-1 print:text-[8px]">{m.no_anggota}</td>
                  <td className="py-2 text-slate-800 font-black not-italic print:py-1 print:text-[8px]">{m.nama}</td>
                  <td className="py-2 font-mono print:py-1">{renderValue(m.pokok + m.wajib)}</td>
                  <td className="py-2 font-mono print:py-1">{renderValue(m.sukarela, "text-slate-400")}</td>
                  <td className="py-2 font-black font-mono print:py-1 print:text-black">{renderValue(m.belanja, "text-indigo-600")}</td>
                  <td className="py-2 font-black font-mono print:py-1 print:text-black">{renderValue(m.jasa_pinjaman, "text-emerald-600")}</td>
                  <td className="py-2 font-black text-slate-900 text-sm bg-slate-50/50 font-mono print:py-1 print:bg-white print:text-[8px]">
                    {renderValue(totalPartisipasi, "text-slate-900")}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-indigo-900 text-white font-black italic uppercase print:bg-white print:text-black print:border-t-2 print:border-black print:table-row-group">
            <tr className="print:break-inside-avoid">
              <td colSpan={2} className="py-6 px-4 rounded-l-3xl print:rounded-none print:py-1">TOTAL</td>
              <td className="py-6 px-4 text-right print:py-1">{formatCurrency(tPokok + tWajib)}</td>
              <td className="py-6 px-4 text-right print:py-1">{formatCurrency(tSukarela)}</td>
              <td className="py-6 px-4 text-right print:py-1">{formatCurrency(tBelanja)}</td>
              <td className="py-6 px-4 text-right print:py-1">{formatCurrency(tJasa)}</td>
              <td className="py-6 px-4 text-right rounded-r-3xl text-lg print:rounded-none print:py-1 print:text-[10px]">{formatCurrency(tSukarela + tBelanja + tJasa)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MemberRecapView;