// src/components/financial-report/utils/formatters.js
import { COA } from '../../../constants/coa';

/**
 * Format angka menjadi mata uang IDR
 * Contoh: 1000000 -> "Rp 1.000.000" atau -50000 -> "(Rp 50.000)"
 */
export const formatCurrency = (num) => {
    const value = Math.abs(num || 0);
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);

    return num < 0 ? `(${formatted})` : formatted;
};

/**
 * Mengambil label lengkap nama akun berdasarkan kode akun COA
 * Contoh: "1.1.1.01" -> "1.1.1.01 — Kas Tunai"
 */
export const getAccountLabel = (code) => {
    const cleanCode = code?.split(' ')[0];
    const acc = COA.find(a => a.code === cleanCode);
    return acc ? `${acc.code} — ${acc.name}` : code;
};