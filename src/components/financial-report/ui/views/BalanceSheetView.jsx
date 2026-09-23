// src/components/financial-report/ui/views/BalanceSheetView.jsx
import React from 'react';
import { Scale } from 'lucide-react';
import { COA } from '../../../../constants/coa';
import { formatCurrency, getAccountLabel } from '../../utils/formatters';

const BalanceSheetView = ({ neracaData }) => {
  if (!neracaData) return null;

  const finalBalances = {};
  COA.forEach(acc => {
    const b = neracaData.rawBalances[acc.code] || { d: 0, k: 0 };
    let val = acc.normal_balance === 'Debit' ? b.d - b.k : b.k - b.d;
    if (acc.code === '1.1.1.01') val += neracaData.posCash; 
    if (Math.abs(val) > 0.1) finalBalances[acc.code] = val;
  });

  const asetList = COA.filter(a => a.type === 'ASSET' && finalBalances[a.code]);
  const pasivaList = COA.filter(a => (a.type === 'LIABILITY' || a.type === 'EQUITY') && finalBalances[a.code]);
  const totalAset = asetList.reduce((sum, a) => sum + finalBalances[a.code], 0);
  const totalPasiva = pasivaList.reduce((sum, a) => sum + finalBalances[a.code], 0) + neracaData.shu;
  const isBalanced = Math.abs(totalAset - totalPasiva) < 100;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom uppercase italic font-bold print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm font-bold print:gap-4 print:text-[10px]">
        <div className="space-y-6 print:space-y-2">
          <h4 className="font-black italic bg-indigo-900 text-white px-4 py-1 rounded-full inline-block print:bg-white print:text-black print:border print:px-2">Aset</h4>
          <div className="space-y-2">
            {asetList.map(a => (
              <div key={a.code} className="flex justify-between border-b border-slate-50 pb-1">
                <span>{getAccountLabel(a.code)}</span>
                <span>{formatCurrency(finalBalances[a.code])}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t-4 border-double border-slate-900 pt-3 font-black text-xl print:text-sm print:border-t-2">
            <span>TOTAL ASET</span>
            <span>{formatCurrency(totalAset)}</span>
          </div>
        </div>
        <div className="space-y-6 print:space-y-2">
          <h4 className="font-black italic bg-emerald-800 text-white px-4 py-1 rounded-full inline-block print:bg-white print:text-black print:border print:px-2">Pasiva</h4>
          <div className="space-y-2">
            {pasivaList.map(a => (
              <div key={a.code} className="flex justify-between border-b border-slate-50 pb-1">
                <span>{getAccountLabel(a.code)}</span>
                <span>{formatCurrency(finalBalances[a.code])}</span>
              </div>
            ))}
            <div className="flex justify-between italic text-indigo-600 print:text-black">
              <span>SHU BERJALAN</span>
              <span>{formatCurrency(neracaData.shu)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t-4 border-double border-slate-900 pt-3 font-black text-xl print:text-sm print:border-t-2">
            <span>TOTAL PASIVA</span>
            <span>{formatCurrency(totalPasiva)}</span>
          </div>
        </div>
      </div>
      <div className={`mt-4 p-4 rounded-[2rem] border-2 flex flex-col items-center justify-center print:mt-2 print:p-2 print:border ${isBalanced ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
        <Scale size={30} className={`${isBalanced ? 'text-emerald-500' : 'text-red-500'} print:hidden`} />
        <h5 className="text-xl font-black print:text-sm">
          {isBalanced ? 'Status: BALANCE ✓' : `⚠️ STATUS: TIDAK BALANCE (SELISIH ${formatCurrency(totalAset - totalPasiva)})`}
        </h5>
      </div>
    </div>
  );
};

export default BalanceSheetView;