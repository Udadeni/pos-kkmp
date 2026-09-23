import React from "react";
import { RefreshCw, Calendar } from "lucide-react";
import { APP_SETTINGS } from "../../../constants/settings";

export default function ReportHeader({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  fetchTransactionData,
  loadingData
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
      <div>
        <h1 className="text-3xl text-indigo-900 leading-none">Management Report</h1>
        <p className="text-[10px] text-slate-400 tracking-[0.3em] mt-2 not-italic font-sans font-bold uppercase">
          {APP_SETTINGS.ORG_NAME} • Analytics
        </p>
      </div>

      {/* RENTANG TANGGAL DI KIRI & TOMBOL FETCH DI KANAN */}
      <div className="flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest not-italic">

        {/* Container Input Tanggal */}
        <div className="flex items-center gap-2 bg-white p-2.5 px-4 rounded-2xl shadow-md border border-slate-100">
          <Calendar size={14} className="text-indigo-600" />
          <input
            type="date"
            className="outline-none bg-transparent font-mono text-xs cursor-pointer"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-slate-300 font-sans">-</span>
          <input
            type="date"
            className="outline-none bg-transparent font-mono text-xs cursor-pointer"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Tombol Fetch Manual di Sebelah Kanan Tanggal */}
        <button
          onClick={fetchTransactionData}
          disabled={loadingData}
          className="flex items-center gap-2 p-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl shadow-md transition-all font-black text-[10px] tracking-wider disabled:opacity-50"
        >
          <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
          <span>{loadingData ? "Memuat..." : "Tampilkan"}</span>
        </button>

      </div>
    </div>
  );
}