import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, query, where, orderBy, Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { COA } from "../constants/coa";

export const jurnalService = {
  // ... (buildJournalPayload tetap sama)
  buildJournalPayload: ({ date, description, entries, createdBy, sourceModule, ref_no }) => {
    let total_debit = 0;
    let total_kredit = 0;

    const enrichedEntries = entries.map(entry => {
      const roundedDebit = Math.round(Number(entry.debit || 0));
      const roundedKredit = Math.round(Number(entry.kredit || 0));

      if (roundedDebit > 0 && roundedKredit > 0) {
        throw new Error(`Akun ${entry.account_code} tidak boleh memiliki nilai Debit dan Kredit sekaligus.`);
      }
      if (roundedDebit === 0 && roundedKredit === 0) {
        throw new Error(`Baris akun ${entry.account_code} harus punya nilai debit atau kredit.`);
      }

      total_debit += roundedDebit;
      total_kredit += roundedKredit;

      const accountInfo = COA.find(a => a.code === entry.account_code);
      
      return {
        account_code: entry.account_code,
        account_name: entry.account_name || accountInfo?.name || 'Akun Tidak Dikenal',
        debit: roundedDebit,
        kredit: roundedKredit
      };
    });

    if (Math.abs(total_debit - total_kredit) > 0.1) {
      throw new Error(`Jurnal tidak seimbang! Total Debit: ${total_debit}, Total Kredit: ${total_kredit}.`);
    }

    return {
      date: date instanceof Date ? Timestamp.fromDate(date) : date,
      description: description.toUpperCase(),
      ref_no: ref_no || "",
      source_module: sourceModule || "MANUAL",
      entries: enrichedEntries,
      total_debit,
      total_kredit,
      created_by_uid: createdBy?.uid || "",
      created_by_name: createdBy?.name || "SYSTEM",
      is_system_generated: sourceModule !== "MANUAL",
      status: 'ACTIVE' // Tambahkan default status saat simpan baru
    };
  },

  addJurnal: async (payload) => {
    try {
      const docRef = await addDoc(collection(db, "journal_entries"), {
        ...payload,
        created_at: serverTimestamp() 
      });
      return docRef.id;
    } catch (e) {
      throw new Error("Gagal simpan jurnal: " + e.message);
    }
  },

  updateJurnal: async (id, payload) => {
    try {
      const docRef = doc(db, "journal_entries", id);
      await updateDoc(docRef, {
        ...payload,
        updated_at: serverTimestamp() 
      });
    } catch (e) {
      throw new Error("Gagal update jurnal: " + e.message);
    }
  },

  // REVISI FUNGSI VOID
  voidJurnal: async (id, userName) => {
    try {
      // PERBAIKAN: Nama koleksi harus "journal_entries"
      const docRef = doc(db, "journal_entries", id); 
      await updateDoc(docRef, {
        status: 'VOID',
        voided_at: serverTimestamp(),
        voided_by_name: userName,
        updated_at: serverTimestamp()
      });
    } catch (e) {
      // Error permission akan tertangkap di sini jika ada masalah aturan Firebase
      throw new Error("Gagal VOID Jurnal: " + e.message);
    }
  },

  // Fungsi Hapus (Hanya jika benar-benar butuh menghapus permanen, tapi tombol di UI sudah kita arahkan ke voidJurnal)
  deleteJurnal: async (id) => {
    try {
      await deleteDoc(doc(db, "journal_entries", id));
    } catch (e) {
      throw new Error("Gagal hapus jurnal: " + e.message);
    }
  },

  getJurnals: async ({ startDate, endDate }) => {
    try {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "journal_entries"),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (e) {
      throw new Error("Gagal ambil data jurnal: " + e.message);
    }
  }
};