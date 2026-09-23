import React from 'react';
import { Wallet } from 'lucide-react';

const MemberDetailHeader = ({ selectedMember, setSelectedMember, setSearchTerm, setCurrentPage, savingsSummary, activeLoans }) => {
    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-5 md:p-6 text-white shadow-2xl mb-6 relative overflow-hidden transition-all print:hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={150} /></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-indigo-400 text-[10px] tracking-[0.3em] mb-1 not-italic font-sans font-bold">Anggota Terpilih</p>
                    <h2 className="text-2xl leading-none">{selectedMember.full_name || selectedMember.name}</h2>
                    <button onClick={() => { setSelectedMember(null); setSearchTerm(''); setCurrentPage(1); }} className="mt-4 text-[9px] text-indigo-300 underline tracking-widest not-italic font-sans font-black uppercase">Ganti Anggota / Kembali</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-indigo-300 uppercase mb-1 not-italic font-sans font-bold">Total Simpanan</p>
                        <p className="text-xl">Rp {(savingsSummary.pokok + savingsSummary.wajib + savingsSummary.sukarela).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-red-400 uppercase mb-1 not-italic font-sans font-bold">Sisa Pinjaman</p>
                        <p className="text-xl text-red-400">Rp {activeLoans.reduce((a, b) => a + (b.remaining_balance || 0), 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailHeader;