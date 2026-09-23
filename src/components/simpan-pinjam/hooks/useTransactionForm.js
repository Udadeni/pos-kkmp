import { useState, useRef } from 'react';
import { APP_SETTINGS } from '../../../constants/settings';
import { getLocalYYYYMMDD } from '../utils/dateHelpers';
import { savingsService } from '../../../services/savingsService';
import { loanService } from '../../../services/loanService';

export const CATEGORIES = ['POKOK', 'WAJIB', 'SUKARELA'];

export function useTransactionForm({ selectedMember, user, savingsSummary, setShowModal, fetchMemberData, fetchGlobalStats }) {
    const dateRef = useRef(null);
    const amountRef = useRef(null);
    const noteRef = useRef(null);
    const categoryRef = useRef(null);

    const SYSTEM_LOCK_DATE = getLocalYYYYMMDD(APP_SETTINGS.SYSTEM_START_DATE);

    const [formData, setFormData] = useState({
        type: 'WAJIB', amount: '', note: '', tenor: 10, interest: 1.5,
        payPrincipal: '', payInterest: '', payNote: '', date: getLocalYYYYMMDD(),
    });
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleKeyDown = (e, target) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (target === 'submit') handleSavingsSubmit();
            else target?.current?.focus();
        }
    };

    const handleCategoryKey = (e) => {
        if (formData.type === 'TARIK_SUKARELA') {
            if (e.key === 'Enter') { e.preventDefault(); amountRef.current?.focus(); }
            return;
        }
        const currentIndex = CATEGORIES.indexOf(formData.type);
        if (e.key === 'ArrowRight') setFormData({ ...formData, type: CATEGORIES[(currentIndex + 1) % 3] });
        else if (e.key === 'ArrowLeft') setFormData({ ...formData, type: CATEGORIES[(currentIndex - 1 + 3) % 3] });
        else if (e.key === 'Enter') { e.preventDefault(); amountRef.current?.focus(); }
    };

    const handleSavingsSubmit = async (e) => {
        if (e) e.preventDefault();
        if (formData.date < SYSTEM_LOCK_DATE) {
            return alert(`Transaksi ditolak! Tanggal tidak boleh sebelum mulai sistem (${SYSTEM_LOCK_DATE}).`);
        }
        const cleanAmount = Number(formData.amount.replace(/\./g, ''));
        if (!cleanAmount || cleanAmount <= 0) return alert("Nominal tidak valid");
        setLoading(true);
        try {
            if (editingTransaction) {
                await savingsService.updateTransaction({ editingTransaction, formData: { ...formData, amount: cleanAmount }, user });
            } else {
                await savingsService.processTransaction({ member: selectedMember, formData: { ...formData, amount: cleanAmount }, user, currentSukarela: savingsSummary.sukarela });
            }
            setShowModal(null); setEditingTransaction(null); fetchMemberData(); fetchGlobalStats();
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const handleVoidTransaction = async () => {
        if (!window.confirm("Batal transaksi? Audit Trail akan mencatat status VOID.")) return;
        setLoading(true);
        try {
            await savingsService.updateTransaction({ editingTransaction, formData: {}, user, isVoid: true });
            setShowModal(null); setEditingTransaction(null); fetchMemberData(); fetchGlobalStats();
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const handleLoanDisbursement = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const cleanAmount = Number(formData.amount.replace(/\./g, ''));
            await loanService.disburseLoan({ member: selectedMember, formData: { ...formData, amount: cleanAmount, tenor: formData.tenor, interest: formData.interest }, user });
            setShowModal(null); fetchMemberData(); fetchGlobalStats();
            alert("Pencairan Pinjaman Berhasil!");
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    const handleLoanRepayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const p = Number(formData.payPrincipal.replace(/\./g, ''));
            const i = Number(formData.payInterest.replace(/\./g, ''));
            await loanService.repayLoan({ member: selectedMember, loan: selectedLoan, formData: { payPrincipal: p, payInterest: i, payNote: formData.payNote }, user });
            setShowModal(null); fetchMemberData(); fetchGlobalStats();
            alert("Pembayaran Berhasil!");
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    return {
        formData, setFormData, editingTransaction, setEditingTransaction, selectedLoan, setSelectedLoan,
        loading, SYSTEM_LOCK_DATE,
        dateRef, amountRef, noteRef, categoryRef,
        handleKeyDown, handleCategoryKey,
        handleSavingsSubmit, handleVoidTransaction, handleLoanDisbursement, handleLoanRepayment,
    };
}