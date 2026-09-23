import {
  collection, query, where, getDocs, doc,
  writeBatch, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { APP_SETTINGS } from "../constants/settings";
import { jurnalService } from "./jurnalService";

export const expenseService = {
  // Simpan Pengeluaran Baru DENGAN Auto-Posting Jurnal
  addExpense: async (payload, user) => {
    try {
      const {
        account_code,
        account_name,
        description,
        amount,
        payment_source,
        bank_account_code
      } = payload;

      const inputAmount = Number(amount);
      const batch = writeBatch(db);
      const expenseRef = doc(collection(db, "expenses"));
      const journalRef = doc(collection(db, "journal_entries"));
      const n = new Date();
      const yyyy = n.getFullYear();
      const mm = String(n.getMonth() + 1).padStart(2, '0');
      const dd = String(n.getDate()).padStart(2, '0');
      const hh = String(n.getHours()).padStart(2, '0');
      const min = String(n.getMinutes()).padStart(2, '0');
      const ss = String(n.getSeconds()).padStart(2, '0');
      const refNo = `EXP-${yyyy}${mm}${dd}${hh}${min}${ss}`;

      // 1. Tentukan Akun Kredit (Sumber Dana) dari APP_SETTINGS
      let kreditAcc = APP_SETTINGS.ACCOUNTS.KAS;
      if (payment_source === "BANK") {
        kreditAcc = bank_account_code;
      }

      // 2. Susun Payload Jurnal lewat JurnalService (Penjaga Gawang)
      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(),
        description: `BIAYA: ${description} (${account_name})`,
        entries: [
          { account_code: account_code, debit: inputAmount, kredit: 0 },
          { account_code: kreditAcc, debit: 0, kredit: inputAmount }
        ],
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'EXPENSE'
      });

      // 3. Daftarkan dokumen Biaya ke dalam Batch
      batch.set(expenseRef, {
        account_code,
        account_name,
        description,
        amount: inputAmount,
        payment_source,
        bank_account_code: payment_source === "BANK" ? bank_account_code : "",
        ref_no: refNo,
        created_by: user.uid,
        created_by_name: user.name,
        created_at: serverTimestamp()
      });

      // 4. Daftarkan dokumen Jurnal ke dalam Batch
      batch.set(journalRef, {
        ...journalPayload,
        created_at: serverTimestamp()
      });

      // 5. Eksekusi mati! (Kirim keduanya sekaligus)
      await batch.commit();

    } catch (error) {
      throw error;
    }
  },

  // Ambil Data Pengeluaran Berdasarkan Range Tanggal
  getExpenses: async (startDate, endDate) => {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);

    const tsStart = Timestamp.fromDate(start);
    const tsEnd = Timestamp.fromDate(end);

    const q = query(
      collection(db, "expenses"),
      where("created_at", ">=", tsStart),
      where("created_at", "<=", tsEnd)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};