import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, getDocs, doc, 
  writeBatch, serverTimestamp, Timestamp, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { jurnalService } from '../services/jurnalService';
import { APP_SETTINGS } from '../constants/settings';
import { 
  Calendar, CheckCircle2, AlertTriangle, RefreshCcw, 
  Lock, Search, Wallet, FileText 
} from 'lucide-react';

const EodPostingPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const fetchUnpostedSales = async () => {
    setLoading(true);
    try {
      const start = new Date(selectedDate); start.setHours(0,0,0,0);
      const end = new Date(selectedDate); end.setHours(23,59,59,999);

      const q = query(
        collection(db, 'transactions_sales'),
        where('created_at', '>=', Timestamp.fromDate(start)),
        where('created_at', '<=', Timestamp.fromDate(end))
      );

      const salesSnap = await getDocs(q);
      const unpostedDocs = salesSnap.docs.filter(doc => doc.data().is_posted !== true);

      if (unpostedDocs.length === 0) {
        setPreviewData({ count: 0, totalSales: 0, totalCashNet: 0, totalDebtNet: 0, totalHpp: 0, totalDiscount: 0 });
        return;
      }

      let totalSales = 0;      // Ini Gross (total_amount)
      let totalCashNet = 0;    // Ini Uang riil (CASH, QRIS, TRANSFER)
      let totalDebtNet = 0;    // Ini Uang Bon (DEBT)
      let totalDiscount = 0;
      const salesIds = [];

      unpostedDocs.forEach(doc => {
        const d = doc.data();
        totalSales += d.total_amount || 0;
        totalDiscount += d.discount_amount || 0;
        
        // Pisahkan penampungan nominal berdasarkan metode bayar
        if (d.payment_method === 'DEBT') {
          totalDebtNet += d.grand_total || 0;
        } else {
          totalCashNet += d.grand_total || 0;
        }
        
        salesIds.push(doc.id);
      });

      let totalHpp = 0;
      const chunkSize = 30;
      for (let i = 0; i < salesIds.length; i += chunkSize) {
        const chunk = salesIds.slice(i, i + chunkSize);
        const itemQ = query(collection(db, 'transactions_sales_items'), where('sales_id', 'in', chunk));
        const itemSnap = await getDocs(itemQ);
        itemSnap.forEach(d => {
          const data = d.data();
          totalHpp += data.total_hpp || ((data.cost_price || 0) * (data.qty || 0));
        });
      }

      setPreviewData({
        count: unpostedDocs.length,
        totalSales,
        totalCashNet,
        totalDebtNet,
        totalDiscount,
        totalHpp,
        docs: unpostedDocs
      });

    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteEod = async () => {
    if (!previewData || previewData.count === 0) return;
    if (!window.confirm(`Konfirmasi: Posting rekapitulasi ${previewData.count} transaksi?`)) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const grossSales = previewData.totalSales;

      // PEMBENTUKAN JURNAL OTOMATIS
      const journalEntries = [];

      // 1. Debit Kas (Hanya jualan tunai/qris/bank)
      if (previewData.totalCashNet > 0) {
        journalEntries.push({ account_code: '1.1.1.01', debit: previewData.totalCashNet, kredit: 0 });
      }

      // 2. Debit Piutang (Khusus jualan BON)
      if (previewData.totalDebtNet > 0) {
        journalEntries.push({ account_code: '1.1.2.01', debit: previewData.totalDebtNet, kredit: 0 });
      }

      // 3. Debit Diskon (Jika ada potongan)
      if (previewData.totalDiscount > 0) {
        journalEntries.push({ account_code: '4.1.1.99', debit: previewData.totalDiscount, kredit: 0 });
      }

      // 4. Kredit Pendapatan (Total Gross)
      journalEntries.push({ account_code: '4.1.1.01', debit: 0, kredit: grossSales });

      // 5. Pencatatan HPP
      if (previewData.totalHpp > 0) {
        journalEntries.push({ account_code: '5.1.1.01', debit: previewData.totalHpp, kredit: 0 });
        journalEntries.push({ account_code: '1.1.4.01', debit: 0, kredit: previewData.totalHpp });
      }

      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(selectedDate),
        description: `Rekapitulasi Toko ${selectedDate} (${previewData.count} Trx)`,
        entries: journalEntries,
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'EOD_TOKO'
      });

      const journalRef = doc(collection(db, "journal_entries"));
      batch.set(journalRef, { ...journalPayload, created_at: serverTimestamp() });

      previewData.docs.forEach(salesDoc => {
        batch.update(doc(db, 'transactions_sales', salesDoc.id), {
          is_posted: true,
          posted_at: serverTimestamp(),
          posting_ref: journalRef.id
        });
      });

      await batch.commit();
      alert("EOD Berhasil! Jurnal telah dipisahkan antara Kas dan Piutang.");
      setPreviewData(null);
    } catch (e) {
      alert("Gagal EOD: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen bg-gray-50 tracking-tighter font-black italic uppercase">
      <header className="mb-10">
        <h1 className="text-3xl text-slate-800 leading-none mb-2">Tutup Buku Toko (EOD)</h1>
        <p className="text-slate-400 font-bold text-[10px] tracking-widest not-italic font-sans uppercase">
          {APP_SETTINGS.ORG_NAME} • Konsolidasi Jurnal Harian
        </p>
      </header>

      {/* FILTER TANGGAL */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-8 not-italic">
        <div className="flex flex-col md:flex-row gap-6 items-end font-sans font-bold">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 tracking-widest">Pilih Tanggal Transaksi</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-900 focus:ring-4 focus:ring-indigo-100 transition-all"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPreviewData(null); }}
              />
            </div>
          </div>
          <button 
            onClick={fetchUnpostedSales}
            disabled={loading}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 h-[56px]"
          >
            {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Search size={16} />} 
            Cek Transaksi
          </button>
        </div>
      </div>

      {previewData && previewData.count > 0 && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="space-y-6">
              {/* KARTU KPI - SEKARANG ADA KARTU BON */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[12px] border-emerald-500">
                  <p className="text-[9px] text-slate-400 mb-1 not-italic font-sans font-bold uppercase">Kas Riil</p>
                  <h3 className="text-lg text-slate-800">Rp {previewData.totalCashNet.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[12px] border-red-500">
                  <p className="text-[9px] text-slate-400 mb-1 not-italic font-sans font-bold uppercase">Bon Anggota</p>
                  <h3 className="text-lg text-red-600">Rp {previewData.totalDebtNet.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[12px] border-orange-500">
                  <p className="text-[9px] text-slate-400 mb-1 not-italic font-sans font-bold uppercase">Total Promo</p>
                  <h3 className="text-lg text-orange-600">Rp {previewData.totalDiscount.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-l-[12px] border-indigo-500">
                  <p className="text-[9px] text-slate-400 mb-1 not-italic font-sans font-bold uppercase">Total HPP</p>
                  <h3 className="text-lg text-slate-800">Rp {previewData.totalHpp.toLocaleString('id-ID')}</h3>
                </div>
              </div>

              {/* PRATINJAU JURNAL */}
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Lock size={120} /></div>
                <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 text-center border-b border-white/10 pb-4">Struktur Jurnal Otomatis</h4>
                  <div className="space-y-4 font-mono text-xs pt-2">
                    
                    {previewData.totalCashNet > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><Wallet size={12}/> <span>[1.1.1.01] Kas Tunai (Net)</span></div>
                        <span className="text-emerald-400 font-bold">D — Rp {previewData.totalCashNet.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {previewData.totalDebtNet > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><FileText size={12}/> <span>[1.1.2.01] Piutang Anggota (Bon)</span></div>
                        <span className="text-emerald-400 font-bold">D — Rp {previewData.totalDebtNet.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {previewData.totalDiscount > 0 && (
                      <div className="flex justify-between items-center">
                        <span>[4.1.1.99] Potongan Penjualan</span>
                        <span className="text-emerald-400 font-bold">D — Rp {previewData.totalDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pl-8 text-white/70">
                      <span>[4.1.1.01] Pendapatan Toko (Gross)</span>
                      <span className="text-red-400 font-bold">K — Rp {previewData.totalSales.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="border-t border-white/5 my-4 pt-4 opacity-50 italic text-[10px]">Pencatatan Persediaan & HPP...</div>
                    
                    <div className="flex justify-between items-center">
                      <span>[5.1.1.01] HPP Toko</span>
                      <span className="text-emerald-400 font-bold">D — Rp {previewData.totalHpp.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pl-8 text-white/70">
                      <span>[1.1.4.01] Persediaan Barang</span>
                      <span className="text-red-400 font-bold">K — Rp {previewData.totalHpp.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleExecuteEod}
                    disabled={loading}
                    className="mt-10 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                  >
                    <CheckCircle2 size={20} /> Konfirmasi Tutup Buku
                  </button>
                </div>
              </div>
            </div>
        </div>
      )}

      {previewData && previewData.count === 0 && (
        <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-20 rounded-[3rem] text-center">
          <AlertTriangle size={64} className="mx-auto text-amber-400 mb-4" />
          <h3 className="text-xl text-amber-800 leading-none">Tidak Ada Antrean Transaksi</h3>
          <p className="text-amber-600 font-bold text-[10px] uppercase mt-2 tracking-widest not-italic font-sans">Semua jualan pada tanggal ini sudah diposting atau belum ada transaksi.</p>
        </div>
      )}
    </div>
  );
};

export default EodPostingPage;