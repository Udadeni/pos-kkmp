import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../../firebase";

export function useReportData() {
    const today = new Date().toISOString().split("T")[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [loadingData, setLoadingData] = useState(false);

    // Raw Data States
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [sales, setSales] = useState([]);
    const [salesItems, setSalesItems] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [handovers, setHandovers] = useState([]);
    const [mutations, setMutations] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // Filter States (Sales)
    const [paymentFilter, setPaymentFilter] = useState("ALL");
    const [salesSearchTerm, setSalesSearchTerm] = useState("");

    // Filter States (Stock Card)
    const [selectedProductStock, setSelectedProductStock] = useState("");
    const [stockSearchText, setStockSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showStockList, setShowStockList] = useState(false);

    // 1. Fetch Master Data (Realtime)
    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, "master_users"), (snap) =>
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubProd = onSnapshot(collection(db, "master_products"), (snap) =>
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return () => { unsubUsers(); unsubProd(); };
    }, []);

    // Helper tanggal Firestore
    const getTrxDate = (doc) => {
        const fireDate = doc?.date || doc?.created_at || doc?.timestamp;
        return fireDate ? fireDate.toDate() : new Date(0);
    };

    // 2. Fetch Transaction Data
    const fetchTransactionData = async () => {
        setLoadingData(true);
        try {
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);
            const tsStart = Timestamp.fromDate(start);
            const tsEnd = Timestamp.fromDate(end);

            const [sSnap, iSnap, pSnap, cSnap, mSnap, eSnap] = await Promise.all([
                getDocs(query(collection(db, "transactions_sales"), where("date", ">=", tsStart), where("date", "<=", tsEnd))),
                getDocs(query(collection(db, "transactions_sales_items"), where("date", ">=", tsStart), where("date", "<=", tsEnd))),
                getDocs(query(collection(db, "transactions_purchase"), where("date", ">=", tsStart), where("date", "<=", tsEnd))),
                getDocs(query(collection(db, "cash_handovers"), where("timestamp", ">=", tsStart), where("timestamp", "<=", tsEnd))),
                getDocs(query(collection(db, "transactions_stock_mutations"), where("date", ">=", tsStart), where("date", "<=", tsEnd))),
                getDocs(query(collection(db, "expenses"), where("created_at", ">=", tsStart), where("created_at", "<=", tsEnd)))
            ]);

            setSales(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setSalesItems(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setPurchases(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setHandovers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setMutations(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setExpenses(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => { fetchTransactionData(); }, []);

    // 3. Rekapitulasi Data (KPI Dashboard & Audit Kas)
    const reportData = useMemo(() => {
        const stats = {
            omset: 0, totalHpp: 0, labaKotor: 0, totalBiaya: 0, labaBersih: 0,
            trxCount: sales.length, paymentMethod: { CASH: 0, QRIS: 0, TRANSFER: 0, DEBT: 0 }
        };

        sales.forEach(s => {
            stats.omset += Number(s.grand_total || 0);
            if (stats.paymentMethod[s.payment_method] !== undefined) {
                stats.paymentMethod[s.payment_method] += Number(s.grand_total || 0);
            }
        });

        salesItems.forEach(si => {
            if (sales.find(s => s.id === si.sales_id)) {
                stats.totalHpp += Number(si.total_hpp || (Number(si.avg_cost_at_sale || si.cost_price || 0) * Number(si.qty || 0)));
            }
        });

        stats.totalBiaya = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        stats.labaKotor = Math.round(stats.omset - stats.totalHpp);
        stats.labaBersih = Math.round(stats.labaKotor - stats.totalBiaya);

        // Summary Audit Kas per Kasir/User
        const auditSummary = {};
        users.forEach(u => { auditSummary[u.id] = { name: u.name, role: u.role, sales: 0, handover: 0 }; });
        sales.forEach(s => { if (s.payment_method === "CASH" && auditSummary[s.created_by]) auditSummary[s.created_by].sales += Number(s.grand_total || 0); });
        handovers.forEach(h => { const uid = h.cashier_id || h.created_by; if (auditSummary[uid]) auditSummary[uid].handover += Number(h.amount || 0); });

        // Top Selling Items
        const pRank = {};
        salesItems.forEach(si => { if (sales.find(s => s.id === si.sales_id)) pRank[si.product_id] = (pRank[si.product_id] || 0) + Number(si.qty || 0); });

        return {
            ...stats,
            auditData: Object.values(auditSummary).filter(a => a.sales > 0 || a.handover > 0),
            bestSellers: Object.keys(pRank).map(id => {
                const p = products.find(prod => prod.id === id);
                return { name: p?.name || "Unknown", qty: pRank[id], unit: p?.unit || "PCS" };
            }).sort((a, b) => b.qty - a.qty).slice(0, 10),
            totalAssetValue: Math.round(products.reduce((sum, p) => sum + (Number(p.current_stock || 0) * Number(p.current_avg_cost || p.cost_price || 0)), 0)),
            margin: stats.omset > 0 ? (stats.labaKotor / stats.omset) * 100 : 0
        };
    }, [sales, salesItems, handovers, expenses, users, products]);

    // Filtered Sales
    const filteredSales = useMemo(() => {
        return sales
            .filter(s => {
                const matchesPayment = paymentFilter === "ALL" || s.payment_method === paymentFilter;
                const matchesSearch = !salesSearchTerm || (s.invoice_number?.toLowerCase().includes(salesSearchTerm.toLowerCase()));
                return matchesPayment && matchesSearch;
            })
            .sort((a, b) => getTrxDate(b) - getTrxDate(a));
    }, [sales, paymentFilter, salesSearchTerm]);

    // List Kategori Dinamis
    const dynamicCategories = useMemo(() =>
        [...new Set(products.map(p => p.category).filter(Boolean))].sort(),
        [products]
    );

    // Grouped Mutasi Stok
    const groupedMutations = useMemo(() => {
        const mutationMap = {};
        if (Array.isArray(mutations)) {
            mutations.forEach(m => {
                if (!m.product_id) return;
                if (!mutationMap[m.product_id]) {
                    mutationMap[m.product_id] = { total_in: 0, total_out: 0 };
                }
                if (m.type === 'IN') {
                    mutationMap[m.product_id].total_in += Number(m.qty || 0);
                } else if (m.type === 'OUT') {
                    mutationMap[m.product_id].total_out += Number(m.qty || 0);
                }
            });
        }

        if (!Array.isArray(products) || products.length === 0) return [];

        const results = products
            .filter(p => {
                if (selectedCategory && selectedCategory !== "ALL" && selectedCategory !== "") {
                    if (p.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
                }
                if (selectedProductStock && p.id !== selectedProductStock) return false;
                if (stockSearchText && !selectedProductStock) {
                    const s = stockSearchText.toLowerCase();
                    const matchName = p.name?.toLowerCase().includes(s);
                    const matchBarcode = p.barcode?.includes(s);
                    if (!matchName && !matchBarcode) return false;
                }
                const currentStock = Number(p.current_stock ?? p.stock ?? 0);
                if (currentStock <= 0) return false;
                return true;
            })
            .map(p => {
                const mut = mutationMap[p.id] || { total_in: 0, total_out: 0 };
                return {
                    id: p.id,
                    name: p.name || "Tanpa Nama",
                    barcode: p.barcode || "---",
                    total_in: mut.total_in,
                    total_out: mut.total_out,
                    hasTrx: mut.total_in > 0 || mut.total_out > 0,
                    last_stock: Number(p.current_stock ?? p.stock ?? 0)
                };
            });

        return results.sort((a, b) => {
            if (a.hasTrx && !b.hasTrx) return -1;
            if (!a.hasTrx && b.hasTrx) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [mutations, products, selectedCategory, selectedProductStock, stockSearchText]);

    // History Mutasi Produk Tunggal
    const productDetailHistory = useMemo(() => {
        if (!selectedProductStock) return [];

        const productInfo = products.find(p => p.id === selectedProductStock);
        if (!productInfo) return [];

        const productMutations = mutations
            .filter(m => m.product_id === selectedProductStock)
            .sort((a, b) => {
                const timeA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
                const timeB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
                return timeA - timeB;
            });

        let runningBalance = 0;

        return productMutations.map(m => {
            const qty = Number(m.qty || 0);
            const isIn = m.type === 'IN';
            const currentPrice = m.price || m.sell_price || m.buy_price || 0;
            if (isIn) runningBalance += qty;
            else runningBalance -= qty;

            const dateObj = m.date?.toDate ? m.date.toDate() : new Date(m.date || 0);
            const formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            return {
                id: m.id,
                dateStr: formattedDate,
                type: m.type,
                notes: m.notes || m.reference_number || (isIn ? 'Pembelian / Penyesuaian' : 'Penjualan'),
                inQty: isIn ? qty : 0,
                outQty: !isIn ? qty : 0,
                price: currentPrice,
                balance: runningBalance
            };
        });
    }, [selectedProductStock, mutations, products]);

    return {
        // States & Handlers
        startDate, setStartDate,
        endDate, setEndDate,
        loadingData,
        fetchTransactionData,
        getTrxDate,

        // Data
        products,
        purchases,
        reportData,
        filteredSales,
        dynamicCategories,
        groupedMutations,
        productDetailHistory,

        // Sales Filters
        paymentFilter, setPaymentFilter,
        salesSearchTerm, setSalesSearchTerm,

        // Stock Card Filters
        selectedProductStock, setSelectedProductStock,
        stockSearchText, setStockSearchText,
        selectedCategory, setSelectedCategory,
        showStockList, setShowStockList
    };
}