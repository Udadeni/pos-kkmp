import React from "react";

export default function AuditKasView({ reportData }) {
  const auditData = reportData?.auditData || [];

  return (
    <div className="p-8">
      <table className="w-full text-left text-sm uppercase italic font-black">
        <thead className="bg-slate-50 text-[9px] text-slate-400 border-b tracking-widest uppercase">
          <tr>
            <th className="p-3">Petugas</th>
            <th className="p-3 text-right">Omzet Tunai</th>
            <th className="p-3 text-right">Setoran</th>
            <th className="p-3 text-right bg-indigo-50">Sisa</th>
          </tr>
        </thead>
        <tbody>
          {auditData.map((u, i) => (
            <tr key={i} className="border-b">
              <td className="p-3">{u.name}</td>
              <td className="p-3 text-right font-mono">Rp {(u.sales || 0).toLocaleString('id-ID')}</td>
              <td className="p-3 text-right font-mono">Rp {(u.handover || 0).toLocaleString('id-ID')}</td>
              <td className="p-3 text-right font-mono bg-indigo-50/30">
                Rp {((u.sales || 0) - (u.handover || 0)).toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
          {auditData.length === 0 && (
            <tr>
              <td colSpan="4" className="p-8 text-center text-slate-300 italic font-black">
                Tidak ada data audit kas pada periode ini
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}