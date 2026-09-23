// src/components/financial-report/ui/ReportHeader.jsx
import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { APP_SETTINGS } from '../../../constants/settings';

const ReportHeader = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  isYtd,
  setIsYtd,
  years,
  months,
  generateAllReports,
  loading,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 md:mb-10 gap-4">
      {/* 1. HEADER JUDUL - Posisikan rata atas (items-start) */}
      <header className="font-black italic uppercase pt-2">
        <h1 className="text-xl md:text-3xl text-slate-800 leading-none mb-1 tracking-tighter">
          INTELLIGENCE
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[11px] tracking-[0.3em] not-italic font-sans">
          {APP_SETTINGS.ORG_NAME} • REPORTING SYSTEM
        </p>
      </header>

      {/* 2. FILTER CONTAINER */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap items-end gap-3">
        {/* Dropdown Tahun */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-1 font-sans not-italic">
            TAHUN
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Dropdown Bulan */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-1 font-sans not-italic">
            BULAN
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Toggle Bulan Ini / YTD */}
        <div className="flex flex-col gap-1">
          {/* Label transparan penyeimbang agar sejajar dengan dropdown */}
          <span className="text-[9px] font-black uppercase text-transparent select-none px-1 font-sans">
            PERIODE
          </span>
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center h-[38px]">
            <button
              onClick={() => setIsYtd(false)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${!isYtd ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setIsYtd(true)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${isYtd ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              YTD
            </button>
          </div>
        </div>

        {/* Tombol Generate Laporan */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase text-transparent select-none px-1 font-sans">
            ACTION
          </span>
          <button
            onClick={generateAllReports}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-[38px] rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-50"
          >
            <FileText size={16} />
            <span>{loading ? 'Proses...' : 'Generate Laporan'}</span>
          </button>
        </div>

        {/* Tombol Cetak */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase text-transparent select-none px-1 font-sans">
            PRINT
          </span>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 h-[38px] rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-md transition active:scale-95"
          >
            <Printer size={16} />
            <span>Cetak</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;