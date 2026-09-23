import React from 'react';
import { Banknote, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const MemberListGrid = ({ currentMembers, memberBalances, setSelectedMember, currentPage, totalPages, setCurrentPage }) => {
    return (
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentMembers.map(m => (
                    <button key={m.id} onClick={() => setSelectedMember(m)} className="relative p-6 text-left uppercase bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-[2rem] transition-all group border border-slate-100 overflow-hidden shadow-sm">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Banknote size={80} /></div>
                        <div className="relative z-10">
                            <p className="leading-tight mb-2 text-sm group-hover:scale-105 transition-transform origin-left">{m.full_name || m.name}</p>
                            <div className="flex items-center gap-1.5 opacity-50 text-[8px] font-sans not-italic font-bold tracking-widest uppercase mb-4">
                                <Users size={10} />{m.member_number}
                            </div>
                            <div className="space-y-1 font-sans not-italic font-bold text-[9px] uppercase tracking-wider">
                                <div className="flex items-center justify-between border-t border-slate-200 pt-2 group-hover:border-white/20">
                                    <span className="opacity-50">Simpanan</span>
                                    <span className={memberBalances[m.id]?.savings > 0 ? "text-emerald-600 group-hover:text-emerald-300" : "opacity-30"}>
                                        Rp {memberBalances[m.id]?.savings?.toLocaleString('id-ID') || '0'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="opacity-50">Pinjaman</span>
                                    <span className={memberBalances[m.id]?.loans > 0 ? "text-red-600 group-hover:text-red-300" : "opacity-30"}>
                                        Rp {memberBalances[m.id]?.loans?.toLocaleString('id-ID') || '0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            {totalPages > 1 && (<div className="flex justify-center gap-4 mt-10"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-50"><ChevronLeft /></button><span className="p-3 font-sans not-italic text-xs text-slate-400">{currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-50"><ChevronRight /></button></div>)}
        </div>
    );
};

export default MemberListGrid;