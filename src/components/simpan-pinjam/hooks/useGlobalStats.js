import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export function useGlobalStats({ members, openModal }) {
    const [globalStats, setGlobalStats] = useState({ pokok: 0, wajib: 0, sukarela: 0, pinjaman: 0 });
    const [globalPokokData, setGlobalPokokData] = useState([]);
    const [globalWajibData, setGlobalWajibData] = useState([]);
    const [globalLoanData, setGlobalLoanData] = useState([]);
    const [globalSukarelaData, setGlobalSukarelaData] = useState([]);
    const [loadingGlobalStats, setLoadingGlobalStats] = useState(false);

    const fetchGlobalStats = async () => {
        const sSnap = await getDocs(collection(db, 'member_savings_transactions'));
        let p = 0, w = 0, s = 0;
        sSnap.forEach(doc => {
            const d = doc.data();
            if (d.status !== 'VOID') {
                if (d.type === 'POKOK') p += d.amount;
                if (d.type === 'WAJIB') w += d.amount;
                if (d.type === 'SUKARELA') s += d.amount;
                if (d.type === 'TARIK_SUKARELA') s -= d.amount;
            }
        });
        const lSnap = await getDocs(query(collection(db, 'member_loans'), where('status', '==', 'ACTIVE')));
        let l = 0;
        lSnap.forEach(doc => {
            const d = doc.data();
            if (d.status !== 'VOID') l += d.remaining_balance || 0;
        });
        setGlobalStats({ pokok: p, wajib: w, sukarela: s, pinjaman: l });
    };

    const fetchGlobalPokokDetails = async () => {
        setLoadingGlobalStats(true);
        try {
            const sSnap = await getDocs(collection(db, 'member_savings_transactions'));
            const matrix = members.map(m => {
                let total = 0;
                sSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.member_id === m.id && d.status !== 'VOID' && d.type === 'POKOK') total += d.amount;
                });
                return { name: (m.full_name || m.name).toUpperCase(), balance: total };
            });
            setGlobalPokokData(matrix.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance));
            openModal('global_pokok');
        } catch (e) { console.error(e); } finally { setLoadingGlobalStats(false); }
    };

    const fetchGlobalWajibMatrix = async () => {
        setLoadingGlobalStats(true);
        try {
            const currentYear = new Date().getFullYear();
            const sSnap = await getDocs(collection(db, 'member_savings_transactions'));
            const matrix = members.map(m => {
                const memberPayments = MONTHS.map((_, idx) => {
                    const paymentsInMonth = sSnap.docs.filter(doc => {
                        const d = doc.data();
                        const date = d.created_at?.toDate();
                        return d.member_id === m.id && d.type === 'WAJIB' && d.status !== 'VOID' && date && date.getMonth() === idx && date.getFullYear() === currentYear;
                    });
                    return paymentsInMonth.reduce((sum, doc) => sum + doc.data().amount, 0);
                });
                const totalYearly = memberPayments.reduce((a, b) => a + b, 0);
                return { name: (m.full_name || m.name).toUpperCase(), payments: memberPayments, total: totalYearly };
            });
            setGlobalWajibData(matrix.filter(row => row.total > 0).sort((a, b) => a.name.localeCompare(b.name)));
            openModal('global_wajib');
        } catch (e) { console.error(e); } finally { setLoadingGlobalStats(false); }
    };

    const fetchGlobalLoanDetails = async () => {
        setLoadingGlobalStats(true);
        try {
            const lSnap = await getDocs(query(collection(db, 'member_loans'), where('status', '==', 'ACTIVE')));
            const loanDetails = lSnap.docs.map(doc => {
                const d = doc.data();
                return { name: d.member_name.toUpperCase(), principal: d.principal_amount, remaining: d.remaining_balance, ref: d.ref_no };
            });
            setGlobalLoanData(loanDetails.sort((a, b) => b.remaining - a.remaining));
            openModal('global_loans');
        } catch (e) { console.error(e); } finally { setLoadingGlobalStats(false); }
    };

    const fetchGlobalSukarelaDetails = async () => {
        setLoadingGlobalStats(true);
        try {
            const sSnap = await getDocs(collection(db, 'member_savings_transactions'));
            const matrix = members.map(m => {
                let total = 0;
                sSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.member_id === m.id && d.status !== 'VOID') {
                        if (d.type === 'SUKARELA') total += d.amount;
                        if (d.type === 'TARIK_SUKARELA') total -= d.amount;
                    }
                });
                return { name: (m.full_name || m.name).toUpperCase(), balance: total };
            });
            setGlobalSukarelaData(matrix.filter(m => m.balance > 0).sort((a, b) => b.balance - a.balance));
            openModal('global_sukarela');
        } catch (e) { console.error(e); } finally { setLoadingGlobalStats(false); }
    };

    return {
        globalStats, globalPokokData, globalWajibData, globalLoanData, globalSukarelaData,
        loadingGlobalStats,
        fetchGlobalStats, fetchGlobalPokokDetails, fetchGlobalWajibMatrix, fetchGlobalLoanDetails, fetchGlobalSukarelaDetails,
    };
}