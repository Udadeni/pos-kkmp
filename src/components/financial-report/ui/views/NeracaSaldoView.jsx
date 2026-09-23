// src/components/financial-report/ui/views/NeracaSaldoView.jsx
import React from 'react';
import { COA } from '../../../../constants/coa';
import { formatCurrency, getAccountLabel } from '../../utils/formatters';

const NeracaSaldoView = ({ neracaData }) => {
  if (!neracaData) return null;
  let totalD = 0; 
  let totalK = 0;

  return (
    <div className="animate-in fade-in">
      <table className="w-full text-left text-sm uppercase italic font-bold print:text-[10px]">
        <thead className="border-b-4 border-slate-800 text-[10px] text-slate-400 font-black tracking-widest print:border-b-2">
          <tr>
            <th className="py-4 print:py-2">Akun</th>
            <th className="py-4 text-right print:py-2">Debit</th>
            <th className="py-4 text-right print:py-2">Kredit</th>
          </tr>
        </thead>
        <tbody>
          {COA.map(acc => { 
            const b = neracaData.rawBalances[acc.code] || { d: 0, k: 0 }; 
            const netBalance = b.d - b.k;
            if (netBalance === 0) return null;
            const displayDebit = netBalance > 0 ? netBalance : 0;
            const displayKredit = netBalance < 0 ? Math.abs(netBalance) : 0;
            totalD += displayDebit; 
            totalK += displayKredit;
            return (
              <tr key={acc.code} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="py-3 print:py-1">{getAccountLabel(acc.code)}</td>
                <td className="py-3 text-right font-mono text-emerald-600 print:py-1">{displayDebit > 0 ? formatCurrency(displayDebit) : '-'}</td>
                <td className="py-3 text-right font-mono text-red-600 print:py-1">{displayKredit > 0 ? formatCurrency(displayKredit) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-slate-900 text-white font-black italic print:bg-white print:text-black print:border-t-2 print:border-black">
          <tr>
            <td className="py-6 px-4 rounded-l-3xl print:py-2">TOTAL</td>
            <td className="py-6 px-4 text-right print:py-2">{formatCurrency(totalD)}</td>
            <td className="py-6 px-4 text-right rounded-r-3xl print:py-2">{formatCurrency(totalK)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default NeracaSaldoView;