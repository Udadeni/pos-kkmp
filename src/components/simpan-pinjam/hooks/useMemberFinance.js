import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MONTHS } from './useGlobalStats';

export function useMemberFinance({ selectedMember, setMemberBalances }) {
    const [savingsSummary, setSavingsSummary] = useState({ pokok: 0, wajib: 0, sukarela: 0 });
    const [activeLoans, setActiveLoans] = useState([]);
    const [history, setHistory] = useState([]);
    const [loadingMemberData, setLoadingMemberData] = useState(false);

    const fetchMemberData = async () => {
        setLoadingMemberData(true);
        try {
            const sSnap = await getDocs(query(collection(db, 'member_savings_transactions'), where('member_id', '==', selectedMember.id)));
            const summary = { pokok: 0, wajib: 0, sukarela: 0 };
            const hist = [];
            sSnap.forEach(doc => {
                const d = doc.data();
                if (d.status !== 'VOID') {
                    if (d.type === 'POKOK') summary.pokok += d.amount;
                    if (d.type === 'WAJIB') summary.wajib += d.amount;
                    if (d.type === 'SUKARELA') summary.sukarela += d.amount;
                    if (d.type === 'TARIK_SUKARELA') summary.sukarela -= d.amount;
                }
                hist.push({ id: doc.id, ...d, category: 'SIMPANAN' });
            });
            const lSnap = await getDocs(query(collection(db, 'member_loans'), where('member_id', '==', selectedMember.id)));
            const loans = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setActiveLoans(loans.filter(l => l.status === 'ACTIVE'));
            loans.forEach(loan => {
                if (loan.status !== 'VOID') {
                    hist.push({ id: `L-${loan.id}`, created_at: loan.disbursement_date || loan.created_at, type: 'PENCAIRAN PINJAMAN', category: 'LOAN_IN', amount: loan.principal_amount, note: `REF: ${loan.ref_no}`, status: loan.status });
                }
            });
            const pSnap = await getDocs(query(collection(db, 'member_loan_payments'), where('member_id', '==', selectedMember.id)));
            pSnap.forEach(doc => {
                const d = doc.data();
                hist.push({ id: doc.id, ...d, category: 'ANGSURAN', type: 'ANGSURAN PINJAMAN' });
            });
            setSavingsSummary(summary);
            setHistory(hist.sort((a, b) => b.created_at?.toMillis() - a.created_at?.toMillis()));
            setMemberBalances(prev => ({
                ...prev,
                [selectedMember.id]: {
                    savings: summary.pokok + summary.wajib + summary.sukarela,
                    loans: loans.filter(l => l.status === 'ACTIVE').reduce((a, b) => a + (b.remaining_balance || 0), 0)
                }
            }));
        } catch (e) { console.error(e); } finally { setLoadingMemberData(false); }
    };

    useEffect(() => { if (selectedMember) fetchMemberData(); }, [selectedMember]);

    const wajibStatus = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return MONTHS.map((m, i) => {
            const totalInMonth = history.filter(h => {
                const d = h.created_at?.toDate();
                return h.type === 'WAJIB' && h.status !== 'VOID' && d && d.getMonth() === i && d.getFullYear() === currentYear;
            }).reduce((sum, item) => sum + item.amount, 0);
            return { month: m, paid: totalInMonth > 0, amount: totalInMonth };
        });
    }, [history]);

    return {
        savingsSummary, activeLoans, history, wajibStatus,
        loadingMemberData, fetchMemberData,
    };
}