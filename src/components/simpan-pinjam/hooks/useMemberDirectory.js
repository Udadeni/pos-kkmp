import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

const ITEMS_PER_PAGE = 12;

export function useMemberDirectory() {
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [memberBalances, setMemberBalances] = useState({});

    const fetchMembers = async () => {
        const snap = await getDocs(collection(db, 'master_members'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedData = data.sort((a, b) => {
            const nameA = (a.full_name || a.name || "").toUpperCase();
            const nameB = (b.full_name || b.name || "").toUpperCase();
            return nameA.localeCompare(nameB);
        });
        setMembers(sortedData);
    };

    const filteredMembers = useMemo(
        () => members.filter(m => (m.full_name || m.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
        [members, searchTerm]
    );
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    const currentMembers = useMemo(
        () => filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [filteredMembers, currentPage]
    );

    const calculateBalancesForCurrentPage = async () => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageMembers = filteredMembers.slice(start, end);
        if (pageMembers.length === 0) return;
        const membersToFetch = pageMembers.filter(m => !memberBalances[m.id]);
        if (membersToFetch.length === 0) return;
        const balances = { ...memberBalances };
        const memberIds = membersToFetch.map(m => m.id);
        const chunkArray = (arr, size) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) { chunks.push(arr.slice(i, i + size)); }
            return chunks;
        };
        const idChunks = chunkArray(memberIds, 30);
        try {
            for (const chunkIds of idChunks) {
                chunkIds.forEach(id => { balances[id] = { savings: 0, loans: 0 }; });
                const sSnap = await getDocs(query(collection(db, 'member_savings_transactions'), where('member_id', 'in', chunkIds)));
                sSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.status !== 'VOID') {
                        const mId = d.member_id;
                        if (['POKOK', 'WAJIB', 'SUKARELA'].includes(d.type)) balances[mId].savings += d.amount;
                        if (d.type === 'TARIK_SUKARELA') balances[mId].savings -= d.amount;
                    }
                });
                const lSnap = await getDocs(query(collection(db, 'member_loans'), where('member_id', 'in', chunkIds), where('status', '==', 'ACTIVE')));
                lSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.status !== 'VOID') balances[doc.data().member_id].loans += (d.remaining_balance || 0);
                });
            }
            setMemberBalances(balances);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchMembers(); }, []);
    useEffect(() => { if (members.length > 0) calculateBalancesForCurrentPage(); }, [currentPage, searchTerm, members]);

    return {
        members, searchTerm, setSearchTerm, currentPage, setCurrentPage,
        itemsPerPage: ITEMS_PER_PAGE, memberBalances, setMemberBalances,
        filteredMembers, totalPages, currentMembers, fetchMembers,
    };
}