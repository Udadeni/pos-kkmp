import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { jurnalService } from "./jurnalService"; // Import Jurnal Service

export const returnService = {
  processPurchaseReturn: async (payload) => {
    const { items, supplier_id, supplier_name, return_date, reason, user } = payload;
    const returnRef = doc(collection(db, "transactions_purchase_returns"));
    const n = new Date();
    const yyyy = n.getFullYear();
    const mm = String(n.getMonth() + 1).padStart(2, '0');
    const dd = String(n.getDate()).padStart(2, '0');
    const hh = String(n.getHours()).padStart(2, '0');
    const min = String(n.getMinutes()).padStart(2, '0');
    const ss = String(n.getSeconds()).padStart(2, '0');
    const returnNumber = `RPR-${yyyy}${mm}${dd}${hh}${min}${ss}`;

    // Hitung total nilai yang diretur
    const total_amount = items.reduce((sum, i) => sum + Number(i.line_total), 0);

    await runTransaction(db, async (transaction) => {
      // 1. Validasi & Ambil Data Produk (PHASE 1: READS)
      const productSnapshots = [];
      for (const item of items) {
        const pRef = doc(db, "master_products", item.product_id);
        const pSnap = await transaction.get(pRef);

        if (!pSnap.exists()) throw `Produk ${item.product_name} tidak ditemukan!`;

        const pData = pSnap.data();
        if (Number(pData.current_stock) < Number(item.qty)) {
          throw `Stok ${item.product_name} tidak cukup untuk diretur! (Sisa: ${pData.current_stock})`;
        }

        productSnapshots.push({ ref: pRef, data: pData, item });
      }

      // 2. Simpan Header Retur (PHASE 2: WRITES)
      transaction.set(returnRef, {
        return_number: returnNumber,
        supplier_id,
        supplier_name,
        return_date,
        reason,
        total_items: items.length,
        total_amount: total_amount,
        created_at: serverTimestamp(),
        created_by: user.uid,
        cashier_name: user.displayName || user.name
      });

      // 3. Update Stok & Catat Mutasi per Item
      for (const p of productSnapshots) {
        const oldStock = Number(p.data.current_stock || 0);
        const returnQty = Number(p.item.qty);
        const newStock = oldStock - returnQty;

        // A. Simpan Detail Retur
        const detailRef = doc(collection(db, "transactions_purchase_return_items"));
        transaction.set(detailRef, {
          return_id: returnRef.id,
          product_id: p.item.product_id,
          product_name: p.item.product_name,
          qty: returnQty,
          buy_price: p.item.buy_price,
          line_total: p.item.line_total,
          created_at: serverTimestamp()
        });

        // B. Update Master Produk (Hanya Stok, HPP Rata-rata tetap)
        transaction.update(p.ref, {
          current_stock: newStock,
          updated_at: serverTimestamp()
        });

        // C. Catat Kartu Stok (OUT)
        const mutRef = doc(collection(db, "transactions_stock_mutations"));
        transaction.set(mutRef, {
          product_id: p.item.product_id,
          type: "OUT",
          qty: returnQty,
          stock_before: oldStock,
          stock_after: newStock,
          ref_id: returnRef.id,
          ref_no: returnNumber,
          ref_type: "PURCHASE_RETURN",
          created_at: serverTimestamp()
        });
      }

      // 4. AUTO-POSTING JURNAL UMUM (NEW!)
      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(return_date),
        description: `Retur Pembelian - ${supplier_name} (No: ${returnNumber})`,
        entries: [
          { account_code: '1.1.1.01', debit: total_amount, kredit: 0 }, // Kas Tunai Bertambah (Uang Kembali)
          { account_code: '1.1.4.01', debit: 0, kredit: total_amount }  // Persediaan Berkurang
        ],
        createdBy: { uid: user.uid, name: user.name },
        ref_no: returnNumber,
        sourceModule: 'PURCHASE_RETURN'
      });

      const journalRef = doc(collection(db, "journal_entries"));
      transaction.set(journalRef, {
        ...journalPayload,
        created_at: serverTimestamp()
      });
    });

    return returnNumber;
  }
};