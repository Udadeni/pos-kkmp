// src/components/financial-report/ui/views/ProfitLossView.jsx
import React from 'react';
import { formatCurrency, getAccountLabel } from '../../utils/formatters';
import { calculateSHU } from '../../services/financialService';

const ProfitLossView = ({ reportData }) => {
  if (!reportData) return null;

  const totalRev = Object.entries(reportData.jrMap)
    .filter(([k]) => k.startsWith('4') || k.startsWith('9.1'))
    .reduce((a, [, v]) => a + v, 0);

  const totalExp = Object.entries(reportData.jrMap)
    .filter(([k]) => k.startsWith('5') || k.startsWith('6') || k.startsWith('9.2') || k.startsWith('9.3'))
    .reduce((a, [, v]) => a + v, 0);

  const shu = calculateSHU(reportData);

  return (
    <div className="space-y-8 animate-in fade-in print:space-y-4">
      <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 shadow-sm font-black italic uppercase print:p-4 print:rounded-none print:border print:bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center print:gap-2">
          <div className="bg-white p-6 rounded-3xl border border-indigo-100 print:p-2">
            <p className="text-[10px] text-slate-400 not-italic tracking-widest mb-1 print:text-[8px]">Total Pendapatan</p>
            <p className="text-xl text-slate-800 print:text-sm">{formatCurrency(totalRev)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-red-100 print:p-2">
            <p className="text-[10px] text-slate-400 not-italic tracking-widest mb-1 print:text-[8px]">Total Beban</p>
            <p className="text-xl text-red-600 print:text-sm">{formatCurrency(totalExp)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border-b-8 border-indigo-500 print:p-2 print:border-b-2">
            <p className="text-[10px] text-slate-400 not-italic tracking-widest mb-1 print:text-[8px]">SHU Bersih</p>
            <p className={`text-xl ${shu < 0 ? 'text-red-600' : 'text-indigo-600'} print:text-sm`}>{formatCurrency(shu)}</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-t-2 border-dashed border-slate-200 print:p-0">
        {Object.entries(reportData.jrMap)
          .filter(([k, v]) => (k.startsWith('4') || k.startsWith('5') || k.startsWith('6') || k.startsWith('9')) && v !== 0)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-slate-50 text-sm print:py-1 print:text-xs">
              <span className={`${k.startsWith('4') || k.startsWith('9.1') ? 'text-indigo-900' : 'text-red-600'} font-bold`}>
                {getAccountLabel(k)}
              </span>
              <span className="font-black">{formatCurrency(v)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ProfitLossView;