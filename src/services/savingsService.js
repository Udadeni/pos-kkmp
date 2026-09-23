import {
  collection, doc, runTransaction,
  serverTimestamp, Timestamp, query, where, getDocs, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { jurnalService } from './jurnalService';

export const savingsService = {
  // 1. PROSES TRANSAKSI BARU (DENGAN GEMBOK POKOK)
  processTransaction: async ({ member, formData, user, currentSukarela }) => {
    const transRef = doc(collection(db, 'member_savings_transactions'));
    const memberRef = doc(db, 'master_members', member.id);
    const journalRef = doc(collection(db, 'journal_entries'));

    const n = new Date();
    const yyyy = n.getFullYear();
    const mm = String(n.getMonth() + 1).padStart(2, '0');
    const dd = String(n.getDate()).padStart(2, '0');
    const hh = String(n.getHours()).padStart(2, '0');
    const min = String(n.getMinutes()).padStart(2, '0');
    const ss = String(n.getSeconds()).padStart(2, '0');
    const refNo = `SAV-${yyyy}${mm}${dd}${hh}${min}${ss}`;

    // Ambil mapping akun
    const getAccount = (type) => {
      if (type === 'POKOK') return { code: '3.1.1.01', name: 'Simpanan Pokok' };
      if (type === 'WAJIB') return { code: '3.1.2.01', name: 'Simpanan Wajib' };
      return { code: '2.1.1.03', name: 'Utang Simpanan Sukarela' };
    };

    await runTransaction(db, async (transaction) => {
      // --- READS ---
      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists()) throw new Error("Data anggota tidak ditemukan");

      // GEMBOK POKOK: Cek apakah sudah pernah bayar Pokok
      if (formData.type === 'POKOK') {
        const qPokok = query(
          collection(db, 'member_savings_transactions'),
          where('member_id', '==', member.id),
          where('type', '==', 'POKOK')
        );
        const snapPokok = await getDocs(qPokok);
        // Cek di memori: apakah ada yang statusnya ACTIVE?
        const alreadyPaid = snapPokok.docs.some(doc => doc.data().status === 'ACTIVE');
        if (alreadyPaid) throw new Error("Anggota ini sudah pernah melunasi Simpanan Pokok!");
      }

      if (formData.type === 'TARIK_SUKARELA' && currentSukarela < formData.amount) {
        throw new Error("Saldo sukarela tidak mencukupi");
      }

      // --- LOGIKA JURNAL ---
      const acc = getAccount(formData.type);
      const isWithdraw = formData.type === 'TARIK_SUKARELA';
      const journalEntries = isWithdraw ? [
        { account_code: acc.code, account_name: acc.name, debit: formData.amount, kredit: 0 },
        { account_code: '1.1.1.01', account_name: "Kas Tunai", debit: 0, kredit: formData.amount }
      ] : [
        { account_code: '1.1.1.01', account_name: "Kas Tunai", debit: formData.amount, kredit: 0 },
        { account_code: acc.code, account_name: acc.name, debit: 0, kredit: formData.amount }
      ];

      const journalPayload = jurnalService.buildJournalPayload({
        date: new Date(formData.date),
        description: `SIMPANAN ${formData.type} - ${member.full_name || member.name} (${formData.note || '-'})`,
        entries: journalEntries,
        createdBy: { uid: user.uid, name: user.name },
        sourceModule: 'SIMPANAN',
        ref_no: refNo
      });

      // --- WRITES ---
      transaction.set(transRef, {
        member_id: member.id,
        member_name: member.full_name || member.name,
        type: formData.type,
        amount: formData.amount,
        note: formData.note.toUpperCase(),
        status: 'ACTIVE',
        ref_no: refNo,
        created_at: Timestamp.fromDate(new Date(formData.date)),
        created_by: user.uid,
        system_at: serverTimestamp()
      });

      transaction.set(journalRef, {
        ...journalPayload,
        reference_id: transRef.id,
        status: 'ACTIVE',
        created_at: serverTimestamp()
      });
    });
  },

  // 2. PROSES UPDATE / VOID (DEEP UPDATE)
  updateTransaction: async ({ editingTransaction, formData, user, isVoid = false }) => {
    const transRef = doc(db, 'member_savings_transactions', editingTransaction.id);
    const qJournal = query(collection(db, 'journal_entries'), where('reference_id', '==', editingTransaction.id));
    const journalSnap = await getDocs(qJournal);
    const journalDocRef = journalSnap.docs.length > 0 ? doc(db, 'journal_entries', journalSnap.docs[0].id) : null;

    const getAccount = (type) => {
      if (type === 'POKOK') return { code: '3.1.1.01', name: 'Simpanan Pokok' };
      if (type === 'WAJIB') return { code: '3.1.2.01', name: 'Simpanan Wajib' };
      return { code: '2.1.1.03', name: 'Utang Simpanan Sukarela' };
    };

    await runTransaction(db, async (transaction) => {
      // --- READS ---
      const transDoc = await transaction.get(transRef);
      if (!transDoc.exists()) throw new Error("Data transaksi tidak ditemukan");

      let journalDoc = null;
      if (journalDocRef) journalDoc = await transaction.get(journalDocRef);

      // --- WRITES ---
      if (isVoid) {
        // Logika Pembatalan (VOID)
        transaction.update(transRef, { status: 'VOID', updated_at: serverTimestamp(), updated_by: user.uid });
        if (journalDocRef) transaction.update(journalDocRef, { status: 'VOID', updated_at: serverTimestamp() });
      } else {
        // Logika Deep Update (Bisa ganti nominal & kategori)
        const acc = getAccount(formData.type);
        const isWithdraw = formData.type === 'TARIK_SUKARELA';

        // Bentuk ulang baris jurnal agar kode akun sinkron dengan kategori baru
        const newEntries = isWithdraw ? [
          { account_code: acc.code, account_name: acc.name, debit: formData.amount, kredit: 0 },
          { account_code: '1.1.1.01', account_name: "Kas Tunai", debit: 0, kredit: formData.amount }
        ] : [
          { account_code: '1.1.1.01', account_name: "Kas Tunai", debit: formData.amount, kredit: 0 },
          { account_code: acc.code, account_name: acc.name, debit: 0, kredit: formData.amount }
        ];

        transaction.update(transRef, {
          type: formData.type,
          amount: formData.amount,
          note: formData.note.toUpperCase(),
          created_at: Timestamp.fromDate(new Date(formData.date)),
          updated_at: serverTimestamp(),
          updated_by: user.uid
        });

        if (journalDocRef && journalDoc?.exists()) {
          transaction.update(journalDocRef, {
            date: Timestamp.fromDate(new Date(formData.date)),
            description: `SIMPANAN ${formData.type}: ${editingTransaction.member_name} (${formData.note.toUpperCase()})`,
            entries: newEntries,
            updated_at: serverTimestamp()
          });
        }
      }
    });
  }
};