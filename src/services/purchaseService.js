import { collection, doc, runTransaction, serverTimestamp, increment, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { jurnalService } from "./jurnalService"; 

export const purchaseService = {
  // 1. PROSES PEMBELIAN / INPUT STOK AWAL
  processPurchase: async (payload) => {
    const { items, supplier_id, supplier_name, invoice_number, purchase_date, payment_method, user } = payload;
    const purchaseRef = doc(collection(db, "transactions_purchase"));
    const grand_total = items.reduce((sum, i) => sum + (Number(i.qty) * Number(i.buy_price)), 0);

    // Konversi purchase_date (string YYYY-MM-DD) ke Firebase Timestamp untuk standarisasi laporan
    const accountingTimestamp = Timestamp.fromDate(new Date(purchase_date));

    await runTransaction(db, async (transaction) => {
      const productSnapshots = [];
      for (const item of items) {
        const productRef = doc(db, "master_products", item.id);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) throw `Produk ${item.name} tidak ada!`;
        productSnapshots.push({ ref: productRef, data: productSnap.data(), item });
      }

      for (const p of productSnapshots) {
        const stokLama = Number(p.data.current_stock || 0);
        const hppLama = Number(p.data.current_avg_cost || p.data.cost_price || 0);
        const qtyBaru = Number(p.item.qty);
        const hargaBeliBaru = Number(p.item.buy_price);
        const stokBaru = stokLama + qtyBaru;
        const hppBaru = ((stokLama * hppLama) + (qtyBaru * hargaBeliBaru)) / stokBaru;

        // A. Update Master Produk
        transaction.update(p.ref, {
          current_stock: stokBaru,
          current_avg_cost: hppBaru,
          last_buy_price: hargaBeliBaru,
          updated_at: serverTimestamp()
        });

        // B. Simpan Detail dengan standar field 'date'
        const detailRef = doc(collection(db, "transactions_purchase_details"));
        transaction.set(detailRef, {
          purchase_id: purchaseRef.id,
          product_id: p.item.id,
          product_name: p.item.name,
          qty: qtyBaru,
          buy_price: hargaBeliBaru,
          old_avg_cost: hppLama,
          new_avg_cost: hppBaru,
          date: accountingTimestamp,
          created_at: serverTimestamp()
        });

        // C. Catat Mutasi Stok 
        const mutRef = doc(collection(db, "transactions_stock_mutations"));
        transaction.set(mutRef, {
          product_id: p.item.id,
          type: "IN",
          qty: qtyBaru,
          stock_before: stokLama,
          stock_after: stokBaru,
          ref_id: purchaseRef.id,
          ref_no: invoice_number,
          ref_type: "PURCHASE",
          date: accountingTimestamp,
          price: hargaBeliBaru, // <-- ini yang baru saya tambahkan
          created_at: serverTimestamp()
        });
      }

      // D. Simpan Header Pembelian
      transaction.set(purchaseRef, {
        supplier_id,
        supplier_name: (supplier_name || "UMUM").toUpperCase(),
        invoice_number: invoice_number.toUpperCase(),
        purchase_date, // format string
        date: accountingTimestamp, // <-- STANDAR LAPORAN (TIMESTAMP)
        payment_method,
        grand_total,
        total_paid: payment_method === 'CASH' ? grand_total : 0,
        remaining_balance: payment_method === 'CASH' ? 0 : grand_total,
        payment_status: payment_method === 'CASH' ? 'PAID' : 'UNPAID',
        created_at: serverTimestamp(),
        created_by: user.uid
      });

      // E. Posting Jurnal
      const creditAccount = payment_method === 'CREDIT' ? '2.1.3.01' : '1.1.1.01';
      const paymentLabel = payment_method === 'CREDIT' ? 'TEMPO/KONSINYASI' : 'TUNAI';

      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(purchase_date), 
        description: `PEMBELIAN BARANG (${paymentLabel}) - ${supplier_name || "UMUM"} (INV: ${invoice_number})`.toUpperCase(),
        entries: [
          { account_code: '1.1.4.01', debit: grand_total, kredit: 0 }, 
          { account_code: creditAccount, debit: 0, kredit: grand_total } 
        ],
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'PURCHASE'
      });

      const journalRef = doc(collection(db, "journal_entries"));
      transaction.set(journalRef, { ...journalPayload, created_at: serverTimestamp() });
    });
  },

  // 2. PROSES CICILAN / PELUNASAN HUTANG SUPPLIER
  settleDebt: async ({ purchase, amount, user }) => {
    const payAmount = Number(amount);
    if (payAmount <= 0) throw new Error("Nominal bayar tidak valid");
    
    // Toleransi 100 rupiah untuk pembulatan sisa hutang
    if (payAmount > (purchase.remaining_balance + 100)) throw new Error("Bayar melebihi sisa hutang!");

    return await runTransaction(db, async (transaction) => {
      const purchaseRef = doc(db, "transactions_purchase", purchase.id);
      
      // Ambil sisa hutang terbaru dari DB (lebih aman)
      const freshSnap = await transaction.get(purchaseRef);
      const currentRemaining = freshSnap.data().remaining_balance || 0;
      const newRemaining = currentRemaining - payAmount;
      
      // A. Update Status & Sisa di Header
      transaction.update(purchaseRef, {
        total_paid: increment(payAmount),
        remaining_balance: newRemaining,
        payment_status: newRemaining <= 100 ? 'PAID' : 'PARTIAL',
        updated_at: serverTimestamp()
      });

      // B. Catat Log Pembayaran (Opsional tapi baik untuk Audit)
      const payLogRef = doc(collection(db, 'transactions_purchase_payments'));
      transaction.set(payLogRef, {
        purchase_id: purchase.id,
        invoice_number: purchase.invoice_number,
        amount: payAmount,
        created_at: serverTimestamp(),
        created_by: user.uid
      });

      // C. Posting Jurnal Pelunasan
      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(), 
        description: `PELUNASAN HUTANG SUPPLIER - ${purchase.supplier_name} (INV: ${purchase.invoice_number})`.toUpperCase(),
        entries: [
          { account_code: '2.1.3.01', debit: payAmount, kredit: 0 }, // Hutang berkurang
          { account_code: '1.1.1.01', debit: 0, kredit: payAmount }  // Kas berkurang
        ],
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'PURCHASE_SETTLEMENT'
      });

      const journalRef = doc(collection(db, "journal_entries"));
      transaction.set(journalRef, { ...journalPayload, created_at: serverTimestamp() });
    });
  }
};