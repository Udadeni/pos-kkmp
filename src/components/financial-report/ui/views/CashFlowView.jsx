// src/components/financial-report/ui/views/CashFlowView.jsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const CashFlowView = ({ cashFlowData }) => {
  if (!cashFlowData) return null;

  return (
    <div className="space-y-6 animate-in zoom-in font-bold uppercase italic print:space-y-2">
      <div className="flex justify-between p-6 bg-emerald-50 rounded-2xl print:bg-white print:border print:p-2">
        <span>Masuk</span>
        <span className="text-emerald-700 font-mono print:text-black">{formatCurrency(cashFlowData.inSales)}</span>
      </div>
      <div className="flex justify-between p-6 bg-red-50 rounded-2xl print:bg-white print:border print:p-2">
        <span>Keluar</span>
        <span className="text-red-700 font-mono print:text-black">{formatCurrency(-(cashFlowData.outExp))}</span>
      </div>
      <div className="flex justify-between p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl text-2xl print:bg-white print:text-black print:border-2 print:p-4 print:text-sm">
        <span>Netto</span>
        <span className="font-mono">{formatCurrency(cashFlowData.inSales - cashFlowData.outExp)}</span>
      </div>
    </div>
  );
};

export default CashFlowView;