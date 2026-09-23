import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase";

export const useCashSummary = (userId) => {
  const [summary, setSummary] = useState({ totalSales: 0, totalHandover: 0 });

  useEffect(() => {
    if (!userId) return;

    // 1. Ambil Penjualan Tunai Kasir ini (Tanpa Filter Tanggal)
    // Kita hapus filter 'status' dari query agar tidak perlu indeks tambahan
    const qSales = query(
      collection(db, "transactions_sales"),
      where("created_by", "==", userId),
      where("payment_method", "==", "CASH")
    );

    const unsubSales = onSnapshot(qSales, (snap) => {
      const total = snap.docs.reduce((sum, d) => {
        const data = d.data();
        // Filter VOID di sini agar data lama yang tidak punya field status tetap terbaca
        if (data.status === 'VOID') return sum;
        return sum + (data.grand_total || data.total_amount || 0);
      }, 0);
      setSummary(prev => ({ ...prev, totalSales: total }));
    });

    // 2. Ambil SEMUA setoran/handover kasir ini
    const qHandover = query(
      collection(db, "cash_handovers"),
      where("cashier_id", "==", userId)
    );

    const unsubHandover = onSnapshot(qHandover, (snap) => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
      setSummary(prev => ({ ...prev, totalHandover: total }));
    });

    return () => { unsubSales(); unsubHandover(); };
  }, [userId]);

  return summary;
};