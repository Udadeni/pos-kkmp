import React from 'react';
import { APP_SETTINGS } from '../../../constants/settings';
import { getLocalYYYYMMDD } from '../utils/dateHelpers';

const RightPanelPrintHeader = ({ selectedMember, rightPanelTab }) => {
    return (
        <div className="hidden print:block mb-8 border-b-4 border-slate-900 pb-6 text-slate-800">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl italic font-black leading-none">{APP_SETTINGS.ORG_NAME}</h1>
                    <p className="text-[10px] font-sans not-italic font-bold tracking-widest uppercase mt-1">Laporan Aktivitas Anggota</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-sans not-italic font-bold tracking-widest uppercase">Tanggal Cetak</p>
                    <p className="font-mono text-xs">{getLocalYYYYMMDD()}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                    <p className="text-[8px] font-sans not-italic font-bold tracking-[0.2em] uppercase text-slate-400">Nama Anggota</p>
                    <p className="text-lg font-black italic">{selectedMember.full_name || selectedMember.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-sans not-italic font-bold tracking-[0.2em] uppercase text-slate-400">Jenis Laporan</p>
                    <p className="text-lg font-black italic">{rightPanelTab === 'history' ? 'REKENING KORAN' : rightPanelTab === 'wajib_matrix' ? 'MONITOR SIMPANAN WAJIB' : 'KARTU PINJAMAN'}</p>
                </div>
            </div>
        </div>
    );
};

export default RightPanelPrintHeader;