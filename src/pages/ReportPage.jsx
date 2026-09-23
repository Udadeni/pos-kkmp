import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Hooks
import { useReportData } from "../components/report-page/hooks/useReportData";

// UI Components
import ReportHeader from "../components/report-page/ui/ReportHeader";
import ReportTabsNav from "../components/report-page/ui/ReportTabsNav";
import KpiDashboard from "../components/report-page/ui/KpiDashboard";

// Views
import SalesView from "../components/report-page/ui/views/SalesView";
import StockCardView from "../components/report-page/ui/views/StockCardView";
import AuditKasView from "../components/report-page/ui/views/AuditKasView";
import AnalysisView from "../components/report-page/ui/views/AnalysisView";
import PurchaseView from "../components/report-page/ui/views/PurchaseView";

// Modals
import SalesReceiptModal from "../components/report-page/modals/SalesReceiptModal";
import PurchaseDetailModal from "../components/report-page/modals/PurchaseDetailModal";

export default function ReportPage() {
  const { user } = useAuth();
  const isCashier = user?.role === "CASHIER";

  const [activeTab, setActiveTab] = useState("sales");

  // Custom Hook
  const report = useReportData();

  // Local Modal States
  const [selectedSaleHeader, setSelectedSaleHeader] = useState(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState([]);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  // Modal Handlers
  const handleViewReceipt = async (saleHeader) => {
    setSelectedSaleHeader(saleHeader);
    setLoadingItems(true);
    try {
      const q = query(collection(db, "transactions_sales_items"), where("sales_id", "==", saleHeader.id));
      const snap = await getDocs(q);
      setSelectedSaleItems(snap.docs.map(d => d.data()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewPurchaseDetail = async (purchase) => {
    setSelectedPurchaseId(purchase.id);
    setLoadingPurchase(true);
    try {
      const q = query(collection(db, "transactions_purchase_details"), where("purchase_id", "==", purchase.id));
      const snap = await getDocs(q);
      setPurchaseDetails(snap.docs.map(d => d.data()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPurchase(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen text-slate-800 tracking-tighter uppercase italic font-black">

      {/* HEADER FILTER TANGGAL */}
      <ReportHeader
        startDate={report.startDate}
        setStartDate={report.setStartDate}
        endDate={report.endDate}
        setEndDate={report.setEndDate}
        fetchTransactionData={report.fetchTransactionData}
        loadingData={report.loadingData}
      />

      {/* DASHBOARD MANAGEMENT (KPI) */}
      <KpiDashboard reportData={report.reportData} isCashier={isCashier} />

      {/* NAVIGASI TAB */}
      <ReportTabsNav activeTab={activeTab} setActiveTab={setActiveTab} isCashier={isCashier} />

      {/* TAB CONTENT VIEWS */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[400px]">
        {activeTab === "sales" && (
          <SalesView
            filteredSales={report.filteredSales}
            paymentFilter={report.paymentFilter}
            setPaymentFilter={report.setPaymentFilter}
            salesSearchTerm={report.salesSearchTerm}
            setSalesSearchTerm={report.setSalesSearchTerm}
            reportData={report.reportData}
            getTrxDate={report.getTrxDate}
            handleViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === "stock_card" && (
          <StockCardView
            products={report.products}
            dynamicCategories={report.dynamicCategories}
            groupedMutations={report.groupedMutations}
            productDetailHistory={report.productDetailHistory}
            selectedCategory={report.selectedCategory}
            setSelectedCategory={report.setSelectedCategory}
            selectedProductStock={report.selectedProductStock}
            setSelectedProductStock={report.setSelectedProductStock}
            stockSearchText={report.stockSearchText}
            setStockSearchText={report.setStockSearchText}
            showStockList={report.showStockList}
            setShowStockList={report.setShowStockList}
          />
        )}

        {activeTab === "analysis" && (
          <AnalysisView reportData={report.reportData} products={report.products} />
        )}

        {activeTab === "purchase" && (
          <PurchaseView
            purchases={report.purchases}
            getTrxDate={report.getTrxDate}
            handleViewPurchaseDetail={handleViewPurchaseDetail}
          />
        )}

        {activeTab === "audit" && (
          <AuditKasView reportData={report.reportData} />
        )}
      </div>

      {/* MODALS */}
      <SalesReceiptModal
        selectedSaleHeader={selectedSaleHeader}
        selectedSaleItems={selectedSaleItems}
        loadingItems={loadingItems}
        onClose={() => setSelectedSaleHeader(null)}
        getTrxDate={report.getTrxDate}
      />

      <PurchaseDetailModal
        selectedPurchaseId={selectedPurchaseId}
        purchases={report.purchases}
        purchaseDetails={purchaseDetails}
        loadingPurchase={loadingPurchase}
        onClose={() => setSelectedPurchaseId(null)}
      />

      {/* CSS CETAK PRINTER THERMAL */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
          #receipt-container, #receipt-container * { visibility: visible !important; color: #000000 !important; }
          #receipt-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; display: block !important; }
          #printable-area, #printable-area * { visibility: visible !important; color: #000000 !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          div[class*="fixed"] { position: static !important; height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </div>
  );
}