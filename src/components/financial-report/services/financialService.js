// src/components/financial-report/services/financialService.js
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { COA } from '../../../constants/coa';

// --- HELPER INTERNAL ---
export const calculateSHU = (data) => {
    if (!data) return 0;
    const income = Object.entries(data.jrMap)
        .filter(([k]) => k.startsWith('4') || k.startsWith('9.1'))
        .reduce((a, [, v]) => a + v, 0);

    const expenses = Object.entries(data.jrMap)
        .filter(([k]) => k.startsWith('5') || k.startsWith('6') || k.startsWith('9.2') || k.startsWith('9.3'))
        .reduce((a, [, v]) => a + v, 0);

    return income - expenses;
};

// --- SERVICE FETCHERS ---

export const fetchProfitLoss = async (start, end) => {
    const s = Timestamp.fromDate(start);
    const e = Timestamp.fromDate(end);

    // Penjualan Hybrid
    const [salesSnap, salesOldSnap] = await Promise.all([
        getDocs(query(collection(db, 'transactions_sales'), where('date', '>=', s), where('date', '<=', e))),
        getDocs(query(collection(db, 'transactions_sales'), where('created_at', '>=', s), where('created_at', '<=', e)))
    ]);

    const allSalesDocs = [...salesSnap.docs];
    salesOldSnap.docs.forEach(doc => {
        if (!allSalesDocs.find(d => d.id === doc.id)) allSalesDocs.push(doc);
    });

    let totalSales = 0;
    allSalesDocs.forEach(d => {
        totalSales += d.data().grand_total || d.data().total_amount || 0;
    });

    let totalCOGS = 0;
    const sIds = allSalesDocs.map(d => d.id);
    if (sIds.length > 0) {
        for (let i = 0; i < sIds.length; i += 30) {
            const snap = await getDocs(query(collection(db, 'transactions_sales_items'), where('sales_id', 'in', sIds.slice(i, i + 30))));
            snap.forEach(d => totalCOGS += d.data().total_hpp || (d.data().cost_price * (d.data().qty || 0)));
        }
    }

    const jurs = await getDocs(query(collection(db, 'journal_entries'), where('date', '>=', s), where('date', '<=', e)));
    const jrMap = {};
    jurs.forEach(d => {
        const data = d.data();
        if (data.status !== 'VOID') {
            data.entries?.forEach(ent => {
                const c = ent.account_code;
                const val = (c.startsWith('4') || c.startsWith('9.1')) ? (ent.kredit - ent.debit) : (ent.debit - ent.kredit);
                jrMap[c] = (jrMap[c] || 0) + val;
            });
        }
    });

    return { totalSales, totalCOGS, jrMap };
};

export const fetchBalanceSheet = async (sysStart, end, shuYTD) => {
    const s = Timestamp.fromDate(sysStart);
    const e = Timestamp.fromDate(end);
    const jurs = await getDocs(query(collection(db, 'journal_entries'), where('date', '>=', s), where('date', '<=', e)));

    const jBal = {};
    jurs.forEach(d => {
        const data = d.data();
        if (data.status !== 'VOID') {
            data.entries?.forEach(ent => {
                if (!jBal[ent.account_code]) jBal[ent.account_code] = { d: 0, k: 0 };
                jBal[ent.account_code].d += ent.debit || 0;
                jBal[ent.account_code].k += ent.kredit || 0;
            });
        }
    });

    const sales = await getDocs(query(collection(db, 'transactions_sales'), where('date', '>=', s), where('date', '<=', e)));
    let posCash = 0;
    sales.forEach(d => {
        const data = d.data();
        if (data.status !== 'VOID' && data.payment_method === 'CASH' && data.is_posted !== true) {
            posCash += data.grand_total || data.total_amount || 0;
        }
    });

    return { rawBalances: jBal, posCash: posCash, shu: shuYTD };
};

export const fetchEquityChanges = async (sysStart, end, selectedYear, shuYTD) => {
    const targetYearStart = new Date(selectedYear, 0, 1, 0, 0, 0);
    const snap = await getDocs(query(collection(db, 'journal_entries'), where('date', '>=', Timestamp.fromDate(sysStart)), where('date', '<=', Timestamp.fromDate(end))));

    const results = {};
    snap.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'VOID') {
            const entryDate = d.date.toDate();
            d.entries?.forEach(ent => {
                const acc = COA.find(a => a.code === ent.account_code);
                if (acc?.type === 'EQUITY') {
                    if (!results[ent.account_code]) results[ent.account_code] = { awal: 0, tambah: 0, kurang: 0 };
                    if (entryDate < targetYearStart) {
                        results[ent.account_code].awal += (ent.kredit - ent.debit);
                    } else {
                        results[ent.account_code].tambah += ent.kredit || 0;
                        results[ent.account_code].kurang += ent.debit || 0;
                    }
                }
            });
        }
    });

    return { accounts: results, shuYTD };
};

export const fetchCashFlow = async (start, end) => {
    const s = Timestamp.fromDate(start);
    const e = Timestamp.fromDate(end);

    const sales = await getDocs(query(collection(db, 'transactions_sales'), where('date', '>=', s), where('date', '<=', e), where('payment_method', '==', 'CASH')));
    let inSales = 0;
    sales.forEach(d => {
        if (d.data().status !== 'VOID') inSales += d.data().grand_total || d.data().total_amount || 0;
    });

    const exps = await getDocs(query(collection(db, 'expenses'), where('created_at', '>=', s), where('created_at', '<=', e)));
    let outExp = 0;
    exps.forEach(d => {
        if (d.data().status !== 'VOID' && d.data().payment_source?.startsWith('KAS')) outExp += d.data().amount;
    });

    return { inSales, outExp };
};

export const fetchGeneralLedger = async (accountCode, start, end, sysStart) => {
    const acc = COA.find(a => a.code === accountCode);
    const isDebitNormal = acc?.normal_balance === 'Debit';

    const qAwal = query(collection(db, 'journal_entries'), where('date', '>=', Timestamp.fromDate(sysStart)), where('date', '<', Timestamp.fromDate(start)));
    const snapAwal = await getDocs(qAwal);

    let openBal = 0;
    snapAwal.forEach(doc => {
        const d = doc.data();
        if (d.status !== 'VOID') {
            d.entries?.forEach(ent => {
                if (ent.account_code === accountCode) {
                    openBal += isDebitNormal ? ((ent.debit || 0) - (ent.kredit || 0)) : ((ent.kredit || 0) - (ent.debit || 0));
                }
            });
        }
    });

    const qTrx = query(collection(db, 'journal_entries'), where('date', '>=', Timestamp.fromDate(start)), where('date', '<=', Timestamp.fromDate(end)), orderBy('date', 'asc'));
    const snapTrx = await getDocs(qTrx);

    const rows = [];
    let runningBal = openBal;
    snapTrx.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'VOID') {
            data.entries?.forEach(ent => {
                if (ent.account_code === accountCode) {
                    const deb = ent.debit || 0;
                    const kre = ent.kredit || 0;
                    runningBal += isDebitNormal ? (deb - kre) : (kre - deb);
                    rows.push({ date: data.date.toDate(), desc: data.description, debit: deb, kredit: kre, saldo: runningBal });
                }
            });
        }
    });

    return { openBal, rows };
};

export const fetchMemberRecap = async (startDate, endDate) => {
    const s = Timestamp.fromDate(startDate);
    const e = Timestamp.fromDate(endDate);
    const membersSnap = await getDocs(collection(db, 'master_members'));

    // Hybrid Fetch Simpanan
    const [savNewSnap, savOldSnap] = await Promise.all([
        getDocs(query(collection(db, 'member_savings_transactions'), where('date', '<=', e))),
        getDocs(query(collection(db, 'member_savings_transactions'), where('created_at', '<=', e)))
    ]);
    const allSavingsDocs = [...savNewSnap.docs];
    savOldSnap.docs.forEach(doc => { if (!allSavingsDocs.find(d => d.id === doc.id)) allSavingsDocs.push(doc); });

    // Hybrid Fetch Penjualan Toko
    const [salNewSnap, salOldSnap] = await Promise.all([
        getDocs(query(collection(db, 'transactions_sales'), where('date', '>=', s), where('date', '<=', e))),
        getDocs(query(collection(db, 'transactions_sales'), where('created_at', '>=', s), where('created_at', '<=', e)))
    ]);
    const allSalesDocs = [...salNewSnap.docs];
    salOldSnap.docs.forEach(doc => { if (!allSalesDocs.find(d => d.id === doc.id)) allSalesDocs.push(doc); });

    // Hybrid Fetch Angsuran Pinjaman
    const [loanNewSnap, loanOldSnap] = await Promise.all([
        getDocs(query(collection(db, 'member_loan_payments'), where('date', '>=', s), where('date', '<=', e))),
        getDocs(query(collection(db, 'member_loan_payments'), where('created_at', '>=', s), where('created_at', '<=', e)))
    ]);
    const allLoanDocs = [...loanNewSnap.docs];
    loanOldSnap.docs.forEach(doc => { if (!allLoanDocs.find(d => d.id === doc.id)) allLoanDocs.push(doc); });

    const memberMap = {};
    membersSnap.forEach(doc => {
        const d = doc.data();
        memberMap[doc.id] = {
            no_anggota: d.member_number || '---',
            nama: d.full_name || d.name,
            pokok: 0,
            wajib: 0,
            sukarela: 0,
            belanja: 0,
            jasa_pinjaman: 0
        };
    });

    allSavingsDocs.forEach(doc => {
        const d = doc.data();
        if (memberMap[d.member_id] && d.status !== 'VOID') {
            if (d.type === 'POKOK') memberMap[d.member_id].pokok += d.amount;
            if (d.type === 'WAJIB') memberMap[d.member_id].wajib += d.amount;
            if (d.type === 'SUKARELA') memberMap[d.member_id].sukarela += d.amount;
            if (d.type === 'TARIK_SUKARELA') memberMap[d.member_id].sukarela -= d.amount;
        }
    });

    allSalesDocs.forEach(doc => {
        const d = doc.data();
        if (d.member_id && memberMap[d.member_id] && d.status !== 'VOID') {
            memberMap[d.member_id].belanja += d.grand_total || d.total_amount || 0;
        }
    });

    allLoanDocs.forEach(doc => {
        const d = doc.data();
        if (d.member_id && memberMap[d.member_id] && d.status !== 'VOID') {
            memberMap[d.member_id].jasa_pinjaman += d.interest_portion || 0;
        }
    });

    return Object.values(memberMap).sort((a, b) => a.nama.localeCompare(b.nama));
};