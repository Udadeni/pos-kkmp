// src/components/financial-report/ui/views/ExecutiveSummaryView.jsx
import React from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const ExecutiveSummaryView = ({ neracaData, reportData }) => {
  if (!neracaData || !reportData) return null;
  const shu = neracaData.shu;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-black italic uppercase tracking-tighter print:grid-cols-3 print:gap-2">
      <div className="p-10 bg-indigo-600 text-white rounded-[3rem] shadow-xl flex flex-col justify-between h-64 border-b-8 border-indigo-900 print:h-32 print:p-4 print:border-2 print:bg-white print:text-black">
        <BarChart3 size={32} className="print:hidden" />
        <div>
          <p className="text-[10px] not-italic opacity-70 print:text-[8px]">SHU Berjalan</p>
          <h4 className="text-4xl print:text-xl">{formatCurrency(shu)}</h4>
        </div>
      </div>
      <div className="p-10 bg-emerald-600 text-white rounded-[3rem] shadow-xl flex flex-col justify-between h-64 border-b-8 border-emerald-900 print:h-32 print:p-4 print:border-2 print:bg-white print:text-black">
        <TrendingUp size={32} className="print:hidden" />
        <div>
          <p className="text-[10px] not-italic opacity-70 print:text-[8px]">Penjualan Toko</p>
          <h4 className="text-4xl print:text-xl">{formatCurrency(reportData.totalSales)}</h4>
        </div>
      </div>
      <div className="p-10 bg-amber-500 text-white rounded-[3rem] shadow-xl flex flex-col justify-between h-64 border-b-8 border-amber-700 print:h-32 print:p-4 print:border-2 print:bg-white print:text-black">
        <PieChart size={32} className="print:hidden" />
        <div>
          <p className="text-[10px] not-italic opacity-70 print:text-[8px]">Tingkat Partisipasi</p>
          <h4 className="text-4xl print:text-xl">Aktif</h4>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryView;