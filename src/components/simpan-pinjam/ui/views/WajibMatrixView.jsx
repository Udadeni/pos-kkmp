import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const WajibMatrixView = ({ wajibStatus }) => {
    return (
        <div className="p-8 print:p-0">
            <h5 className="text-[10px] text-slate-400 font-sans not-italic font-bold tracking-widest uppercase mb-6 print:text-black">Status Iuran Wajib Tahun {new Date().getFullYear()}</h5>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 print:grid-cols-4">
                {wajibStatus.map((m, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${m.paid ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-red-50'}`}>
                        <p className={`text-[10px] font-black mb-1 ${m.paid ? 'text-emerald-700' : 'text-red-300'}`}>{m.month}</p>
                        {m.paid ? (
                            <div className="text-center"><CheckCircle2 size={16} className="text-emerald-500 mx-auto" /><p className="text-[7px] font-mono mt-1 text-emerald-600">Rp {m.amount.toLocaleString()}</p></div>
                        ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-dashed border-red-100"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WajibMatrixView;