import React from "react";

export default function KpiDashboard({ reportData, isCashier }) {
    if (isCashier || !reportData) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* TOTAL OMZET */}
            <div className="bg-indigo-800 p-6 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-indigo-950">
                <p className="text-[9px] opacity-60 not-italic font-sans mb-1 uppercase">Total Omzet</p>
                <p className="text-xl font-mono">Rp {(reportData.omset || 0).toLocaleString('id-ID')}</p>
            </div>

            {/* TOTAL INVENTORY */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl border-b-8 border-slate-200">
                <p className="text-[9px] text-slate-400 not-italic font-sans mb-1 uppercase">Total Inventory (Aset)</p>
                <p className="text-xl font-mono text-slate-800">Rp {(reportData.totalAssetValue || 0).toLocaleString('id-ID')}</p>
                <p className="text-[9px] mt-2 text-indigo-400">Nilai Stok Gudang</p>
            </div>

            {/* LABA KOTOR */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl border-b-8 border-slate-200">
                <p className="text-[9px] text-slate-400 not-italic font-sans mb-1 uppercase">Laba Kotor</p>
                <p className="text-xl font-mono text-slate-800">Rp {(reportData.labaKotor || 0).toLocaleString('id-ID')}</p>
                <p className="text-[9px] mt-2 text-indigo-600">Margin {(reportData.margin || 0).toFixed(1)}%</p>
            </div>

            {/* BIAYA OPERASIONAL */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl border-b-8 border-slate-200">
                <p className="text-[9px] text-red-400 not-italic font-sans mb-1 uppercase font-bold">Biaya Operasional</p>
                <p className="text-xl font-mono text-red-600">Rp {(reportData.totalBiaya || 0).toLocaleString('id-ID')}</p>
            </div>

            {/* PROFIT NETTO */}
            <div className={`p-6 rounded-[2.5rem] shadow-2xl border-b-8 ${(reportData.labaBersih || 0) >= 0 ? 'bg-emerald-600 border-emerald-900' : 'bg-red-600 border-red-900'} text-white`}>
                <p className="text-[9px] opacity-60 not-italic font-sans mb-1 uppercase">Profit Netto (SHU)</p>
                <p className="text-xl font-mono">Rp {(reportData.labaBersih || 0).toLocaleString('id-ID')}</p>
            </div>
        </div>
    );
}