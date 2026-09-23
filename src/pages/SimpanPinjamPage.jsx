import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalStats } from '../components/simpan-pinjam/hooks/useGlobalStats';
import { useMemberDirectory } from '../components/simpan-pinjam/hooks/useMemberDirectory';
import { useMemberFinance } from '../components/simpan-pinjam/hooks/useMemberFinance';
import { useTransactionForm } from '../components/simpan-pinjam/hooks/useTransactionForm';
import PageHeader from '../components/simpan-pinjam/ui/PageHeader';
import GlobalStatsCards from '../components/simpan-pinjam/ui/GlobalStatsCards';
import MemberListGrid from '../components/simpan-pinjam/ui/MemberListGrid';
import MemberDetailHeader from '../components/simpan-pinjam/ui/MemberDetailHeader';
import MemberTabsNav from '../components/simpan-pinjam/ui/MemberTabsNav';
import SimpananPanel from '../components/simpan-pinjam/ui/views/SimpananPanel';
import PinjamanPanel from '../components/simpan-pinjam/ui/views/PinjamanPanel';
import RightPanelPrintHeader from '../components/simpan-pinjam/ui/RightPanelPrintHeader';
import RightPanelTabsNav from '../components/simpan-pinjam/ui/RightPanelTabsNav';
import HistoryView from '../components/simpan-pinjam/ui/views/HistoryView';
import WajibMatrixView from '../components/simpan-pinjam/ui/views/WajibMatrixView';
import LoanCardView from '../components/simpan-pinjam/ui/views/LoanCardView';
import SavingsFormModal from '../components/simpan-pinjam/modals/SavingsFormModal';
import LoanPaymentModal from '../components/simpan-pinjam/modals/LoanPaymentModal';
import LoanDisbursementModal from '../components/simpan-pinjam/modals/LoanDisbursementModal';
import GlobalDrilldownModal from '../components/simpan-pinjam/modals/GlobalDrilldownModal';

const SimpanPinjamPage = () => {
  const { user } = useAuth();

  const searchInputRef = useRef(null);

  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState('simpanan');
  const [rightPanelTab, setRightPanelTab] = useState('history');

  const [showModal, setShowModal] = useState(null);
  const {
    members, searchTerm, setSearchTerm, currentPage, setCurrentPage,
    itemsPerPage, memberBalances, setMemberBalances,
    filteredMembers, totalPages, currentMembers,
  } = useMemberDirectory();

  const {
    globalStats, globalPokokData, globalWajibData, globalLoanData, globalSukarelaData,
    fetchGlobalStats, fetchGlobalPokokDetails, fetchGlobalWajibMatrix, fetchGlobalLoanDetails, fetchGlobalSukarelaDetails,
  } = useGlobalStats({ members, openModal: setShowModal });

  const {
    savingsSummary, activeLoans, history, wajibStatus, fetchMemberData,
  } = useMemberFinance({ selectedMember, setMemberBalances });

  useEffect(() => { fetchGlobalStats(); }, []);

  const {
    formData, setFormData, editingTransaction, setEditingTransaction, selectedLoan, setSelectedLoan,
    loading, SYSTEM_LOCK_DATE,
    dateRef, amountRef, noteRef, categoryRef,
    handleKeyDown, handleCategoryKey,
    handleSavingsSubmit, handleVoidTransaction, handleLoanDisbursement, handleLoanRepayment,
  } = useTransactionForm({ selectedMember, user, savingsSummary, setShowModal, fetchMemberData, fetchGlobalStats });

  useEffect(() => {
    if (showModal === 'deposit' || showModal === 'withdraw' || showModal === 'edit_transaction') {
      const timer = setTimeout(() => {
        if (dateRef.current) {
          dateRef.current.focus();
          dateRef.current.click();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!showModal && !selectedMember) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [showModal, selectedMember]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 tracking-tighter font-sans font-black italic uppercase text-slate-800">

      {/* HEADER UTAMA */}
      <PageHeader selectedMember={selectedMember} searchInputRef={searchInputRef} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setCurrentPage={setCurrentPage} />

      {!selectedMember ? (
        <div id="dashboard-content">
          <GlobalStatsCards
            globalStats={globalStats}
            fetchGlobalPokokDetails={fetchGlobalPokokDetails}
            fetchGlobalWajibMatrix={fetchGlobalWajibMatrix}
            fetchGlobalSukarelaDetails={fetchGlobalSukarelaDetails}
            fetchGlobalLoanDetails={fetchGlobalLoanDetails}
          />

          <MemberListGrid
            currentMembers={currentMembers}
            memberBalances={memberBalances}
            setSelectedMember={setSelectedMember}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />

        </div>
      ) : (
        <div id="member-detail-content" className="animate-in fade-in duration-500">
          <MemberDetailHeader
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
            setSearchTerm={setSearchTerm}
            setCurrentPage={setCurrentPage}
            savingsSummary={savingsSummary}
            activeLoans={activeLoans}
          />

          <MemberTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-fit print:hidden">
              {activeTab === 'simpanan' ? (
                <SimpananPanel savingsSummary={savingsSummary} setFormData={setFormData} setShowModal={setShowModal} />
              ) : (
                <PinjamanPanel activeLoans={activeLoans} setSelectedLoan={setSelectedLoan} formData={formData} setFormData={setFormData} setShowModal={setShowModal} />
              )}
            </div>

            <div id="printable-member-tab" className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px] print:shadow-none print:border-none">
              {/* HEADER KHUSUS PRINT - Tampil hanya saat print */}
              <RightPanelPrintHeader selectedMember={selectedMember} rightPanelTab={rightPanelTab} />

              <RightPanelTabsNav rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />

              <div className="flex-1 overflow-x-auto print:overflow-visible">
                {rightPanelTab === 'history' && (
                  <HistoryView history={history} savingsSummary={savingsSummary} setEditingTransaction={setEditingTransaction} setFormData={setFormData} setShowModal={setShowModal} />
                )}
                {rightPanelTab === 'wajib_matrix' && (
                  <WajibMatrixView wajibStatus={wajibStatus} />
                )}
                {rightPanelTab === 'loan_card' && (
                  <LoanCardView history={history} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECTION */}
      {(showModal === 'deposit' || showModal === 'withdraw' || showModal === 'edit_transaction') && (
        <SavingsFormModal
          showModal={showModal} setShowModal={setShowModal}
          savingsSummary={savingsSummary}
          formData={formData} setFormData={setFormData}
          editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
          SYSTEM_LOCK_DATE={SYSTEM_LOCK_DATE}
          dateRef={dateRef} categoryRef={categoryRef} amountRef={amountRef} noteRef={noteRef}
          handleKeyDown={handleKeyDown} handleCategoryKey={handleCategoryKey}
          handleSavingsSubmit={handleSavingsSubmit} handleVoidTransaction={handleVoidTransaction}
          loading={loading}
        />
      )}

      {/* MODAL ANGSURAN & PENCAIRAN */}
      {showModal === 'payment' && selectedLoan && (
        <LoanPaymentModal
          selectedMember={selectedMember} selectedLoan={selectedLoan}
          formData={formData} setFormData={setFormData}
          setShowModal={setShowModal}
          handleLoanRepayment={handleLoanRepayment}
          loading={loading}
        />
      )}

      {showModal === 'new_loan' && (
        <LoanDisbursementModal
          selectedMember={selectedMember}
          formData={formData} setFormData={setFormData}
          setShowModal={setShowModal}
          handleLoanDisbursement={handleLoanDisbursement}
          loading={loading}
        />
      )}

      {/* GLOBAL DRILL DOWN MODALS */}
      {(showModal === 'global_pokok' || showModal === 'global_wajib' || showModal === 'global_loans' || showModal === 'global_sukarela') && (
        <GlobalDrilldownModal
          showModal={showModal} setShowModal={setShowModal}
          globalStats={globalStats}
          globalPokokData={globalPokokData} globalWajibData={globalWajibData}
          globalLoanData={globalLoanData} globalSukarelaData={globalSukarelaData}
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media print {
          @page { size: auto; margin: 10mm; }
          body { background: white !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
          
          /* Sembunyikan elemen non-cetak */
          .print\\:hidden, 
          .mb-10, 
          .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4,
          .bg-white.rounded-\\[3rem\\].p-10.shadow-xl,
          .flex.gap-4.mb-8.bg-white,
          .lg\\:col-span-1.bg-white.p-8,
          .bg-slate-50.p-2.flex.gap-1.border-b { display: none !important; }

          /* Tampilkan elemen cetak */
          .fixed.inset-0 { position: absolute !important; display: block !important; background: white !important; height: auto !important; overflow: visible !important; }
          #printable-modal, #member-detail-content, #printable-member-tab { 
            position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; 
            min-height: 0 !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: none !important; 
          }
          
          .lg\\:col-span-2 { width: 100% !important; display: block !important; }
          .flex-1.overflow-auto, .flex-1.overflow-x-auto { display: block !important; height: auto !important; overflow: visible !important; }
          
          /* Styling Tabel untuk Print */
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1pt solid #eee !important; color: black !important; padding-top: 1mm important; padding-bottom: 1mm !important; line-height: 1 !important; }
          .bg-slate-900, .bg-indigo-600, .bg-emerald-600, .bg-red-600, .bg-amber-500 { background: white !important; color: black !important; }
          
          /* Warna teks spesifik saat print */
          .text-emerald-600, .text-red-600, .text-indigo-600, .text-amber-600 { color: black !important; font-weight: bold !important; }
        }
      `}</style>

    </div>
  );
};

export default SimpanPinjamPage;