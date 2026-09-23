import React from 'react';
import { Search } from 'lucide-react';
import { APP_SETTINGS } from '../../../constants/settings';

const PageHeader = ({ selectedMember, searchInputRef, searchTerm, setSearchTerm, setCurrentPage }) => {
    return (
        <div className="mb-6 md:mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
            <div><h1 className="text-3xl leading-none mb-2">Simpan Pinjam</h1><p className="text-slate-400 font-bold text-[10px] tracking-widest not-italic font-sans">{APP_SETTINGS.ORG_NAME} • Operasional Anggota</p></div>
            {!selectedMember && (
                <div className="relative w-full lg:w-96 font-sans not-italic">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input ref={searchInputRef} type="text" placeholder="Cari Nama Anggota..." className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-lg border-none outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
            )}
        </div>
    );
};

export default PageHeader;