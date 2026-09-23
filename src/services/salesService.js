import {
  collection, doc, writeBatch, serverTimestamp,
  increment, getDoc, runTransaction, query, where, getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { jurnalService } from "./jurnalService";

export const salesService = {
  // 1. PROSES CHECKOUT KASIR (POS)
  processCheckout: async (payload) => {
    const {
      cart, cartStats, discountAmount, paidAmount,
      paymentMethod, selectedMemberId, members, user
    } = payload;

    const batch = writeBatch(db);
    const salesRef = doc(collection(db, "transactions_sales"));
    const salesId = salesRef.id;
    const invoiceNumber = `SLS-${Date.now()}`;
    const memberData = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;

    // JARING PENGAMAN: Inisialisasi field hutang untuk Settlement
    const isDebt = paymentMethod === 'DEBT';

    const memberName = memberData ? (memberData.full_name || memberData.name).toUpperCase() : "NON-MEMBER";
    const cashierName = user.displayName || user.name || "Kasir";
    const finalPaid = Number(paidAmount || 0);
    const finalGrandTotal = Number(cartStats.grand_total || 0);
    const finalTotalAmount = Number(cartStats.total_amount || 0);
    const finalDiscount = Number(discountAmount || 0);
    const finalChange = finalPaid - finalGrandTotal;

    // 1. SIMPAN HEADER PENJUALAN
    batch.set(salesRef, {
      invoice_number: invoiceNumber,
      member_id: selectedMemberId || null,
      member_name: memberName,
      total_amount: finalTotalAmount,
      discount_amount: finalDiscount,
      grand_total: finalGrandTotal,
      payment_method: paymentMethod,
      paid_amount: finalPaid,
      change_amount: finalChange,
      remaining_balance: isDebt ? finalGrandTotal : 0,
      payment_status: isDebt ? 'UNPAID' : 'PAID',

      total_items: cart.length,
      created_by: user.uid,
      cashier_name: cashierName,
      is_posted: false,
      date: serverTimestamp(),
      created_at: serverTimestamp()
    });

    // 2. SIMPAN DETAIL ITEM & UPDATE STOK
    cart.forEach((item) => {
      const itemRef = doc(collection(db, "transactions_sales_items"));
      const sellPrice = Number(item.current_sell_price || item.price || 0);
      const costPrice = Number(item.current_avg_cost || item.cost_price || 0);
      const qty = Number(item.qty || 0);

      batch.set(itemRef, {
        sales_id: salesId,
        product_id: item.id,
        product_name: item.name,
        qty: qty,
        sell_price: sellPrice,
        cost_price: costPrice,
        total_hpp: costPrice * qty,
        avg_cost_at_sale: costPrice,
        date: serverTimestamp(),
        created_at: serverTimestamp()
      });

      const productRef = doc(db, "master_products", item.id);
      batch.update(productRef, {
        current_stock: increment(-qty),
        updated_at: serverTimestamp()
      });

      const mutationRef = doc(collection(db, "transactions_stock_mutations"));
      batch.set(mutationRef, {
        product_id: item.id,
        type: "OUT",
        qty: qty,
        stock_before: Number(item.current_stock || 0),
        stock_after: Number(item.current_stock || 0) - qty,
        ref_id: salesId,
        ref_no: invoiceNumber,
        ref_type: "SALES",
        date: serverTimestamp(),
        price: Number(sellPrice),
        created_at: serverTimestamp()
      });
    });

    await batch.commit();

    // Bentuk objek struk secara EKSPLISIT — jangan spread payload mentah,
    // karena nama field payload (cart, cartStats, paidAmount, dst) beda
    // dengan nama field yang dibutuhkan struk (items, paid_amount, dst).
    // Ini akar masalah kenapa dulu struk selalu kosong: PosPage.jsx baca
    // `receipt.items`, tapi yang dikirim balik cuma `receipt.cart`.
    return {
      invoice_number: invoiceNumber,
      items: cart,
      member_name: memberName,
      cashier_name: cashierName,
      total_amount: finalTotalAmount,
      discount_amount: finalDiscount,
      grand_total: finalGrandTotal,
      paid_amount: finalPaid,
      change_amount: finalChange,
      payment_method: paymentMethod,
      date: new Date()
    };
  },

  // 2. PROSES PELUNASAN BON ANGGOTA (SETTLEMENT)
  async settleSaleDebt({ sale, member, mode, amount, formData, user }) {
    return await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'transactions_sales', sale.id);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists()) throw new Error("Data transaksi tidak ditemukan");

      const currentRemaining = saleSnap.data().remaining_balance || 0;
      const newBalance = currentRemaining - amount;

      // A. Update Status BON di Toko
      transaction.update(saleRef, {
        remaining_balance: newBalance,
        payment_status: newBalance <= 100 ? 'PAID' : 'PARTIAL',
        updated_at: serverTimestamp()
      });

      // B. Logika Berdasarkan Mode Pembayaran
      let journalDescription = "";
      const accountPiutangToko = '1.1.2.01';

      if (mode === 'CASH') {
        journalDescription = `PELUNASAN BON TOKO (TUNAI) - ${member.full_name || member.name}`;
        const jrPayload = jurnalService.buildJournalPayload({
          date: new Date(), description: journalDescription.toUpperCase(),
          entries: [
            { account_code: '1.1.1.01', debit: amount, kredit: 0 },
            { account_code: accountPiutangToko, debit: 0, kredit: amount }
          ],
          createdBy: { uid: user.uid, name: user.name }, sourceModule: 'SETTLEMENT'
        });
        transaction.set(doc(collection(db, 'journal_entries')), { ...jrPayload, created_at: serverTimestamp() });

      } else if (mode === 'SAVINGS') {
        journalDescription = `PELUNASAN BON TOKO (POTONG SUKARELA) - ${member.full_name || member.name}`;
        const jrPayload = jurnalService.buildJournalPayload({
          date: new Date(), description: journalDescription.toUpperCase(),
          entries: [
            { account_code: '2.1.1.03', debit: amount, kredit: 0 },
            { account_code: accountPiutangToko, debit: 0, kredit: amount }
          ],
          createdBy: { uid: user.uid, name: user.name }, sourceModule: 'SETTLEMENT'
        });
        transaction.set(doc(collection(db, 'journal_entries')), { ...jrPayload, created_at: serverTimestamp() });

        const savingRef = doc(collection(db, 'member_savings_transactions'));
        transaction.set(savingRef, {
          member_id: member.id, member_name: (member.full_name || member.name).toUpperCase(),
          type: 'TARIK_SUKARELA', amount: amount, note: `BAYAR BON TOKO: ${sale.invoice_number}`,
          status: 'ACTIVE', created_at: serverTimestamp(), created_by: user.uid
        });

      } else if (mode === 'CONVERT_TO_LOAN') {
        journalDescription = `KONVERSI BON TOKO KE PINJAMAN - ${member.full_name || member.name}`;
        const jrPayload = jurnalService.buildJournalPayload({
          date: new Date(), description: journalDescription.toUpperCase(),
          entries: [
            { account_code: '1.1.2.01', debit: amount, kredit: 0 },
            { account_code: accountPiutangToko, debit: 0, kredit: amount }
          ],
          createdBy: { uid: user.uid, name: user.name }, sourceModule: 'SETTLEMENT'
        });
        transaction.set(doc(collection(db, 'journal_entries')), { ...jrPayload, created_at: serverTimestamp() });

        const loanRef = doc(collection(db, 'member_loans'));
        transaction.set(loanRef, {
          member_id: member.id, member_name: (member.full_name || member.name).toUpperCase(),
          principal_amount: amount, tenor: Number(formData.tenor), interest_rate: Number(formData.interest),
          monthly_principal: Math.round(amount / Number(formData.tenor)),
          monthly_interest: Math.round((amount * Number(formData.interest)) / 100),
          remaining_balance: amount, status: 'ACTIVE', ref_no: `LOAN-CONV-${Date.now()}`,
          note: `KONVERSI DARI BON: ${sale.invoice_number}`,
          disbursement_date: serverTimestamp(), created_at: serverTimestamp(), created_by: user.uid
        });
      }

      // C. Catat Log Pembayaran
      const payLogRef = doc(collection(db, 'transactions_sales_payments'));
      transaction.set(payLogRef, {
        sale_id: sale.id, invoice_number: sale.invoice_number,
        member_id: member.id, member_name: member.full_name || member.name,
        amount: amount, mode: mode, created_at: serverTimestamp(), created_by: user.uid
      });
    });
  }
};