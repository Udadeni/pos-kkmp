import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { jurnalService } from './jurnalService';

export const loanService = {
  async disburseLoan({ member, formData, user }) {
    const rawAmount = Number(formData.amount);

    // 1. Validasi Pinjaman Aktif Ganda
    const qActiveLoan = query(
      collection(db, 'member_loans'), 
      where('member_id', '==', member.id), 
      where('status', '==', 'ACTIVE')
    );
    const activeLoanSnap = await getDocs(qActiveLoan);
    if (!activeLoanSnap.empty) {
      throw new Error("Anggota masih memiliki pinjaman aktif! Tidak bisa mencairkan pinjaman baru.");
    }

    // 2. Validasi Setoran Simpanan Pokok (Dibuat lebih fleksibel)
    const qPokok = query(
      collection(db, 'member_savings_transactions'), 
      where('member_id', '==', member.id), 
      where('type', '==', 'POKOK')
    );
    const pokokSnap = await getDocs(qPokok);
    
    // Cek apakah ada setoran POKOK yang statusnya bukan VOID
    const hasValidPokok = pokokSnap.docs.some(doc => doc.data().status !== 'VOID');
    
    if (!hasValidPokok) {
      throw new Error("Anggota belum membayar Simpanan Pokok. Pinjaman tidak dapat dicairkan.");
    }

    return await runTransaction(db, async (transaction) => {
      const loanRef = doc(collection(db, 'member_loans'));
      const n = new Date();
      const yyyy = n.getFullYear();
      const mm = String(n.getMonth() + 1).padStart(2, '0');
      const dd = String(n.getDate()).padStart(2, '0');
      const hh = String(n.getHours()).padStart(2, '0');
      const min = String(n.getMinutes()).padStart(2, '0');
      const ss = String(n.getSeconds()).padStart(2, '0');
      const refNo = `LOAN-${yyyy}${mm}${dd}${hh}${min}${ss}`;
      
      transaction.set(loanRef, {
        member_id: member.id, 
        member_name: (member.full_name || member.name).toUpperCase(),
        principal_amount: rawAmount, 
        tenor: Number(formData.tenor), 
        interest_rate: Number(formData.interest),
        monthly_principal: Math.round(rawAmount / Number(formData.tenor)),
        monthly_interest: Math.round((rawAmount * Number(formData.interest)) / 100),
        remaining_balance: rawAmount, 
        status: 'ACTIVE', 
        ref_no: refNo,
        disbursement_date: serverTimestamp(), 
        created_at: serverTimestamp(), 
        created_by: user.uid
      });

      const jrPayload = jurnalService.buildJournalPayload({
        date: new Date(), 
        description: `Pencairan Pinjaman - ${member.full_name || member.name}`.toUpperCase(),
        entries: [
          { account_code: '1.1.2.01', debit: rawAmount, kredit: 0 }, 
          { account_code: '1.1.1.02', debit: 0, kredit: rawAmount }
        ],
        createdBy: { uid: user.uid, name: user.name }, 
        sourceModule: 'PINJAMAN',
        ref_no: refNo
      });
      transaction.set(doc(collection(db, 'journal_entries')), { ...jrPayload, created_at: serverTimestamp() });
    });
  },

  async repayLoan({ member, loan, formData, user }) {
    const principal = Number(formData.payPrincipal);
    const interest = Number(formData.payInterest);
    const total = principal + interest;

    return await runTransaction(db, async (transaction) => {
      const loanRef = doc(db, 'member_loans', loan.id);
      const loanSnap = await transaction.get(loanRef);
      
      const freshBalance = loanSnap.data().remaining_balance || 0;
      if (principal > freshBalance) {
        throw new Error("Porsi pokok melebihi sisa hutang! Sisa hutang saat ini: Rp " + freshBalance.toLocaleString('id-ID'));
      }

      const newBalance = freshBalance - principal;

      transaction.update(loanRef, {
        remaining_balance: newBalance,
        status: newBalance <= 100 ? 'PAID' : 'ACTIVE',
        updated_at: serverTimestamp()
      });

      transaction.set(doc(collection(db, 'member_loan_payments')), {
        member_id: member.id, 
        loan_id: loan.id, 
        principal_portion: principal,
        interest_portion: interest, 
        amount: total, 
        note: formData.payNote.toUpperCase(),
        created_at: serverTimestamp(), 
        created_by: user.uid
      });

      const jrPayload = jurnalService.buildJournalPayload({
        date: new Date(), 
        description: `Angsuran Pinjaman - ${member.full_name || member.name}`.toUpperCase(),
        entries: [
          { account_code: '1.1.1.01', debit: total, kredit: 0 },
          { account_code: '1.1.2.01', debit: 0, kredit: principal },
          { account_code: '4.1.2.01', debit: 0, kredit: interest }
        ],
        createdBy: { uid: user.uid, name: user.name }, 
        sourceModule: 'PINJAMAN'
      });
      transaction.set(doc(collection(db, 'journal_entries')), { ...jrPayload, created_at: serverTimestamp() });
    });
  }
};