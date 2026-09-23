// src/components/financial-report/ui/views/EquityChangesView.jsx
import React from 'react';
import { formatCurrency, getAccountLabel } from '../../utils/formatters';

const EquityChangesView = ({ equityData, neracaData }) => {
  if (!equityData || !neracaData) return null;
  const codes = Object.keys(equityData.accounts);
  let gAwal = 0, gTambah = 0, gKurang = 0, gAkhir = 0;

  return (
    <div className="animate-in slide-in-from-right duration-700 font-bold uppercase italic">
      <div className="overflow-x-auto bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm print:p-0 print:border-none">
        <table className="w-full text-sm print:text-[9px]">
          <thead>
            <tr className="border-b-4 border-slate-900 text-[10px] text-slate-400 font-black tracking-widest print:border-b-2">
              <th>Komponen</th>
              <th className="text-right">Awal</th>
              <th className="text-right">Tambah</th>
              <th className="text-right">Kurang</th>
              <th className="text-right">Akhir</th>
            </tr>
          </thead>
          <tbody>
            {codes.map(code => {
              const data = equityData.accounts[code]; 
              const akhir = data.awal + data.tambah - data.kurang;
              gAwal += data.awal; gTambah += data.tambah; gKurang += data.kurang; gAkhir += akhir;
              return (
                <tr key={code} className="border-b border-slate-50">
                  <td className="py-4 print:py-1">{getAccountLabel(code).split(' — ')[1]}</td>
                  <td className="text-right font-mono">{formatCurrency(data.awal)}</td>
                  <td className="text-right text-indigo-600 font-mono print:text-black">{formatCurrency(data.tambah)}</td>
                  <td className="text-right text-red-500 font-mono print:text-black">{formatCurrency(data.kurang)}</td>
                  <td className="text-right font-black font-mono">{formatCurrency(akhir)}</td>
                </tr>
              );
            })}
            <tr className="italic border-b border-slate-100">
              <td className="py-4 print:py-1">SHU Berjalan</td>
              <td className="text-right font-mono">{formatCurrency(0)}</td>
              <td className="text-right text-emerald-600 font-mono print:text-black">{formatCurrency(equityData.shuYTD)}</td>
              <td className="text-right font-mono">{formatCurrency(0)}</td>
              <td className="text-right font-black font-mono">{formatCurrency(equityData.shuYTD)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-black print:bg-white print:text-black print:border-t-2 print:border-black">
              <td className="py-6 px-4 rounded-l-3xl print:py-1">TOTAL EKUITAS</td>
              <td className="text-right font-mono">{formatCurrency(gAwal)}</td>
              <td className="text-right font-mono">{formatCurrency(gTambah + equityData.shuYTD)}</td>
              <td className="text-right font-mono">{formatCurrency(gKurang)}</td>
              <td className="text-right rounded-r-3xl text-l font-mono print:text-[10px]">{formatCurrency(gAkhir + equityData.shuYTD)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default EquityChangesView;