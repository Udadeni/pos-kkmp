// src/pages/FinancialReportPage.jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { APP_SETTINGS } from '../constants/settings';
import { useFinancialReport } from '../components/financial-report/hooks/useFinancialReport';

// Import UI Components
import ReportHeader from '../components/financial-report/ui/ReportHeader';
import ReportTabsNav from '../components/financial-report/ui/ReportTabsNav';

// Import View Components
import ProfitLossView from '../components/financial-report/ui/views/ProfitLossView';
import BalanceSheetView from '../components/financial-report/ui/views/BalanceSheetView';
import EquityChangesView from '../components/financial-report/ui/views/EquityChangesView';
import MemberRecapView from '../components/financial-report/ui/views/MemberRecapView';
import CashFlowView from '../components/financial-report/ui/views/CashFlowView';
import NeracaSaldoView from '../components/financial-report/ui/views/NeracaSaldoView';
import GeneralLedgerView from '../components/financial-report/ui/views/GeneralLedgerView';
import ExecutiveSummaryView from '../components/financial-report/ui/views/ExecutiveSummaryView';

const FinancialReportPage = () => {
  const {
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
  } = useFinancialReport();

  return (
    <div className="outer-container p-4 md:p-8 max-w-7xl mx-auto min-h-screen pb-20 bg-slate-50/20 tracking-tighter font-sans print:bg-white print:min-h-0 print:p-0 print:m-0">
      <div className="print:hidden">
        <ReportHeader
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isYtd={isYtd}
          setIsYtd={setIsYtd}
          years={years}
          months={months}
          generateAllReports={generateAllReports}
          loading={loading}
        />
        <ReportTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {(reportData || neracaData) ? (
        <div className="main-report-card bg-white rounded-[4rem] shadow-2xl p-6 md:p-10 border border-slate-50 animate-in fade-in duration-500 font-black uppercase italic print:shadow-none print:border-none print:p-0 print:m-0">
          <div className="print-header hidden print:block text-center mb-4 border-b border-black pb-2">
            <h2 className="text-2xl font-serif font-bold uppercase text-slate-900 leading-tight">
              {activeTab.toUpperCase().replace('_', ' ')}
            </h2>
            <h3 className="text-sm font-serif italic text-slate-500 leading-tight">{APP_SETTINGS.ORG_NAME}</h3>
            <p className="mt-1 font-black uppercase text-[8px] tracking-[0.3em] inline-block">
              {isYtd
                ? `Periode: s/d ${months[selectedMonth - 1]} ${selectedYear}`
                : `Periode: ${months[selectedMonth - 1]} ${selectedYear}`
              }
            </p>
          </div>

          <div className="report-content-area">
            {activeTab === 'laba_rugi' && <ProfitLossView reportData={reportData} />}
            {activeTab === 'neraca' && <BalanceSheetView neracaData={neracaData} />}
            {activeTab === 'ekuitas' && <EquityChangesView equityData={equityData} neracaData={neracaData} />}
            {activeTab === 'member_recap' && <MemberRecapView memberRecap={memberRecap} memberRecapError={memberRecapError} />}
            {activeTab === 'arus_kas' && <CashFlowView cashFlowData={cashFlowData} />}
            {activeTab === 'neraca_saldo' && <NeracaSaldoView neracaData={neracaData} />}
            {activeTab === 'buku_besar' && (
              <GeneralLedgerView
                dropdownRef={dropdownRef}
                glSearchTerm={glSearchTerm}
                setGlSearchTerm={setGlSearchTerm}
                setSelectedGlAccount={setSelectedGlAccount}
                showGlDropdown={showGlDropdown}
                setShowGlDropdown={setShowGlDropdown}
                filteredCOA={filteredCOA}
                generateAllReports={generateAllReports}
                selectedGlAccount={selectedGlAccount}
                loading={loading}
                months={months}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                glOpeningBalance={glOpeningBalance}
                glData={glData}
              />
            )}
            {activeTab === 'summary' && <ExecutiveSummaryView neracaData={neracaData} reportData={reportData} />}
          </div>

          <div className="report-footer mt-8 pt-4 border-t border-slate-100 text-center print:text-center print:mt-4 print:border-black font-black italic uppercase">
            <p className="text-[9px] text-slate-300 print:text-black font-sans not-italic">
              {APP_SETTINGS.ORG_NAME} • Reporting System
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-48 bg-white rounded-[4rem] border-2 border-dashed border-indigo-100 shadow-inner font-black italic uppercase">
          <TrendingUp size={120} className="text-indigo-50 mb-8 animate-pulse" />
          <p className="text-indigo-200 text-[11px] tracking-[0.5em]">Tentukan Periode & Klik Generate Laporan</p>
        </div>
      )}

      <style>{`
      .no-scrollbar::-webkit-scrollbar { display: none; } 
      @media print { 
        @page { size: A4; margin: 8mm; } 
        html, body { height: auto !important; background: white !important; font-family: serif !important; margin: 0 !important; padding: 0 !important; }
        .print\\:hidden { display: none !important; } 
        .outer-container { background: white !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
        .main-report-card { border-radius: 0 !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; } 
        .report-footer { margin-top: 1rem !important; padding-top: 0.5rem !important; }
        .bg-white, .bg-indigo-50, .bg-slate-50, .bg-slate-100, .bg-indigo-900, .bg-slate-900, .bg-emerald-800 { background-color: transparent !important; color: black !important; }
        .rounded-[3rem], .rounded-3xl, .rounded-[2rem], .rounded-full { border-radius: 0 !important; border: none !important; }
        .shadow-sm, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
        table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
        th, td { border-bottom: 1px solid #ccc !important; padding: 3px 2px !important; line-height: 1.1 !important; }
        .text-indigo-600, .text-emerald-600, .text-red-600, .text-indigo-300, .text-slate-400 { color: black !important; }
      }
    `}</style>
    </div>
  );
};

export default FinancialReportPage;