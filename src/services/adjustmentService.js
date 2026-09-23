import { collection, doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { jurnalService } from "./jurnalService";

export const adjustmentService = {
  processAdjustment: async (payload) => {
    const { product_id, physical_stock, reason, user } = payload;

    // Referensi Dokumen
    const adjRef = doc(collection(db, "transactions_adjustments")); // Dokumen Berita Acara
    const productRef = doc(db, "master_products", product_id);
    const journalRef = doc(collection(db, "journal_entries"));
    const mutationRef = doc(collection(db, "transactions_stock_mutations"));

    return await runTransaction(db, async (transaction) => {
      // 1. PHASE 1: READS (Membaca data terbaru)
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) throw new Error("Produk tidak ditemukan!");

      const productData = productSnap.data();
      const currentStockFromDb = Number(productData.current_stock || 0);
      const freshDifference = Number(physical_stock) - currentStockFromDb;

      if (freshDifference === 0) throw new Error("Stok sudah sinkron di server.");

      const avgCost = Number(productData.current_avg_cost || productData.cost_price || 0);
      const adjustmentValue = Math.abs(freshDifference * avgCost);

      const n = new Date();
      const yyyy = n.getFullYear();
      const mm = String(n.getMonth() + 1).padStart(2, '0');
      const dd = String(n.getDate()).padStart(2, '0');
      const hh = String(n.getHours()).padStart(2, '0');
      const min = String(n.getMinutes()).padStart(2, '0');
      const ss = String(n.getSeconds()).padStart(2, '0');
      const refNo = `ADJ-${yyyy}${mm}${dd}${hh}${min}${ss}`;
      // 2. PHASE 2: WRITES (Menulis secara atomik)

      // A. Buat Berita Acara (Header Opname)
      transaction.set(adjRef, {
        product_id,
        product_name: productData.name,
        system_stock: currentStockFromDb,
        physical_stock: Number(physical_stock),
        difference: freshDifference,
        reason: reason.toUpperCase(),
        date: serverTimestamp(), // <-- STANDARISASI UNTUK REPORT HEADER
        created_at: serverTimestamp(),
        created_by: user.uid,
        cashier_name: user.name || "SYSTEM"
      });

      // B. Update Master Produk
      transaction.update(productRef, {
        current_stock: Number(physical_stock),
        updated_at: serverTimestamp()
      });

      // C. Catat di Kartu Stok (Mutasi)
      transaction.set(mutationRef, {
        product_id,
        product_name: productData.name,
        type: freshDifference > 0 ? "IN" : "OUT",
        qty: Math.abs(freshDifference),
        stock_before: currentStockFromDb,
        stock_after: Number(physical_stock),
        ref_id: adjRef.id,
        ref_no: refNo,
        ref_type: "STOCK_OPNAME",
        date: serverTimestamp(), // <-- STANDARISASI UNTUK KARTU STOK
        note: `OPNAME: ${reason.toUpperCase()}`,
        created_at: serverTimestamp(),
        created_by: user.uid
      });

      // D. Generate Jurnal Otomatis
      let journalEntries = [];
      if (freshDifference < 0) {
        journalEntries = [
          { account_code: '6.9.9.99', debit: adjustmentValue, kredit: 0 },
          { account_code: '1.1.4.01', debit: 0, kredit: adjustmentValue }
        ];
      } else {
        journalEntries = [
          { account_code: '1.1.4.01', debit: adjustmentValue, kredit: 0 },
          { account_code: '9.1.9.99', debit: 0, kredit: adjustmentValue }
        ];
      }

      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(),
        description: `ADJUSTMENT STOK: ${productData.name} (${reason.toUpperCase()})`,
        entries: journalEntries,
        createdBy: { uid: user.uid, name: user.name || "SYSTEM" },
        sourceModule: 'STOCK_OPNAME'
      });

      transaction.set(journalRef, { ...journalPayload, created_at: serverTimestamp() });

      return { success: true };
    });
  }
};