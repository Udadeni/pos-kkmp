// src/components/financial-report/hooks/useFinancialReport.js
import { useState, useMemo, useRef, useEffect } from 'react';
import { COA } from '../../../constants/coa';
import { APP_SETTINGS } from '../../../constants/settings';
import {
    fetchProfitLoss,
    fetchBalanceSheet,
    fetchEquityChanges,
    fetchCashFlow,
    fetchGeneralLedger,
    fetchMemberRecap,
    calculateSHU
} from '../services/financialService';

export const useFinancialReport = () => {
    const [activeTab, setActiveTab] = useState('laba_rugi');
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [isYtd, setIsYtd] = useState(false);

    const [selectedGlAccount, setSelectedGlAccount] = useState('1.1.1.01');
    const [glSearchTerm, setGlSearchTerm] = useState('1.1.1.01 - Kas Tunai');
    const [showGlDropdown, setShowGlDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [reportData, setReportData] = useState(null);
    const [neracaData, setNeracaData] = useState(null);
    const [equityData, setEquityData] = useState(null);
    const [cashFlowData, setCashFlowData] = useState(null);
    const [glData, setGlData] = useState([]);
    const [glOpeningBalance, setGlOpeningBalance] = useState(0);

    const [memberRecap, setMemberRecap] = useState([]);
    const [memberRecapError, setMemberRecapError] = useState(null);

    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    // Close GL Dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowGlDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtered COA List for Gl Dropdown
    const filteredCOA = useMemo(() => {
        return COA.filter(acc =>
            acc.code.includes(glSearchTerm.split(' - ')[0]) ||
            acc.name.toLowerCase().includes(glSearchTerm.toLowerCase())
        ).slice(0, 10);
    }, [glSearchTerm]);

    // Handler utama eksekusi laporan
    const generateAllReports = async () => {
        setLoading(true);
        setMemberRecapError(null);
        try {
            const start = new Date(selectedYear, isYtd ? 0 : selectedMonth - 1, 1, 0, 0, 0);
            const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
            const sysStart = APP_SETTINGS.SYSTEM_START_DATE;

            const lr = await fetchProfitLoss(start, end);
            setReportData(lr);

            const ytdLR = await fetchProfitLoss(new Date(selectedYear, 0, 1, 0, 0, 0), end);
            const shuYTD = calculateSHU(ytdLR);

            const nr = await fetchBalanceSheet(sysStart, end, shuYTD);
            setNeracaData(nr);

            const eq = await fetchEquityChanges(sysStart, end, selectedYear, shuYTD);
            setEquityData(eq);

            const cf = await fetchCashFlow(start, end);
            setCashFlowData(cf);

            const gl = await fetchGeneralLedger(selectedGlAccount, start, end, sysStart);
            setGlOpeningBalance(gl.openBal);
            setGlData(gl.rows);

            try {
                const recap = await fetchMemberRecap(start, end);
                setMemberRecap(recap);
            } catch (err) {
                console.error(err);
                setMemberRecapError("Gagal mengolah data partisipasi anggota.");
            }

        } catch (e) {
            console.error(e);
            alert("Gagal: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        activeTab, setActiveTab,
        loading,
        selectedYear, setSelectedYear,
        selectedMonth, setSelectedMonth,
        isYtd, setIsYtd,
        selectedGlAccount, setSelectedGlAccount,
        glSearchTerm, setGlSearchTerm,
        showGlDropdown, setShowGlDropdown,
        dropdownRef,
        filteredCOA,
        reportData,
        neracaData,
        equityData,
        cashFlowData,
        glData,
        glOpeningBalance,
        memberRecap,
        memberRecapError,
        months,
        years,
        generateAllReports
    };
};