import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { APP_SETTINGS } from "./constants/settings";

// Import Halaman
import Login from "./pages/Login";
import ProductPage from "./pages/ProductPage";
import SupplierPage from "./pages/SupplierPage";
import MemberPage from "./pages/MemberPage";
import PurchasePage from "./pages/PurchasePage";
import PurchaseReturnPage from "./pages/PurchaseReturnPage";
import StockOpnamePage from "./pages/StockOpnamePage";
import ExpensePage from "./pages/ExpensePage";
import PosPage from "./pages/PosPage";
import ReportPage from "./pages/ReportPage";
import UserPage from "./pages/UserPage";
import JurnalUmumPage from "./pages/JurnalUmumPage";
import FinancialReportPage from "./pages/FinancialReportPage";
import SimpanPinjamPage from "./pages/SimpanPinjamPage";
import EodPostingPage from "./pages/EodPostingPage";
import PromoPage from "./pages/PromoPage";
import SettlementPage from "./pages/SettlementPage"; // <-- 1. Import Page Baru

// 1. Komponen Pelindung Rute
const PrivateRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="p-10 text-center font-black uppercase italic text-indigo-900">Memverifikasi Sesi...</div>;

  if (user && user.is_active === false) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm border-t-8 border-red-600">
          <h1 className="text-xl font-black text-red-600 mb-4 uppercase italic">Akses Terkunci</h1>
          <p className="text-slate-500 font-bold uppercase text-xs leading-relaxed">Akun Anda Non Aktif.</p>
          <button onClick={logout} className="mt-6 text-indigo-600 font-black uppercase text-[10px] underline">Coba Login Lagi</button>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

// 2. Komponen Pembatas Role
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  return children;
};

// 3. Layout Utama (NAVBAR & WATERMARK)
const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <nav className="bg-indigo-800 text-white p-4 flex justify-between items-center shadow-2xl sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-black italic tracking-tighter text-xl uppercase hover:text-yellow-400 transition">
            {APP_SETTINGS.ORG_NAME}
          </Link>
          <div className="hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest ml-4">
            <Link to="/pos" className="hover:text-yellow-400 transition">Kasir</Link>
            {isAdmin && <Link to="/simpan-pinjam" className="hover:text-yellow-400 transition">Simpan Pinjam</Link>}
            {isAdmin && <Link to="/laporan-keuangan" className="hover:text-yellow-400 transition">Laporan</Link>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block leading-none">
            <p className="text-[10px] font-black uppercase text-indigo-300">{user?.name}</p>
            <p className="text-[8px] font-bold text-yellow-500 uppercase italic">{user?.role}</p>
          </div>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all active:scale-90">Logout</button>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <div className="fixed bottom-10 right-10 text-right opacity-30 select-none pointer-events-none z-0 print:hidden">
        <div className="inline-block border-r-4 border-indigo-600 pr-4">
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-500">
            Hak Cipta : <span className="text-indigo-600">{APP_SETTINGS.DEV_EMAIL}</span>
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1 font-sans">
            {APP_SETTINGS.DEV_LOCATION}
          </p>
        </div>
      </div>
    </div>
  );
};

// 4. Halaman Dashboard
const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMenu = searchParams.get("menu") || "main";

  const isManager = user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN" || isManager;
  const isCashier = user?.role === "CASHIER" || isAdmin;
  const isGuest = user?.role === "GUEST";

  const cardClass = "p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl hover:scale-105 transition-all duration-300 h-28 md:h-36 lg:h-40 flex flex-col justify-between border-b-4 md:border-b-8";
  const gridClass = "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 font-black italic animate-in fade-in slide-in-from-bottom-4 duration-500";
  const titleClass = "text-[13px] md:text-xl lg:text-2xl leading-none font-black italic";
  const descClass = "hidden md:block text-[10px] not-italic font-bold font-sans opacity-70";

  const renderTokoMenu = () => (
    <div className={gridClass}>
      {isCashier && !isGuest && (
        <Link to="/pos" className={`${cardClass} bg-indigo-500 text-white border-indigo-900`}>
          <h3 className={titleClass}>🚀 Modul<br />Kasir (POS)</h3>
          <p className={descClass}>Transaksi Penjualan</p>
        </Link>
      )}
      {isAdmin && (
        <>
          <Link to="/eod-toko" className={`${cardClass} bg-indigo-600 text-white border-indigo-900`}>
            <h3 className={titleClass}>🌗 Tutup Buku<br />Harian (EOD)</h3>
            <p className={descClass}>Posting Jurnal Toko</p>
          </Link>
          <Link to="/promo" className={`${cardClass} bg-amber-500 text-white border-amber-700`}>
            <h3 className={titleClass}>🏷️ Event<br />Promo</h3>
            <p className={descClass}>Kelola Diskon Toko</p>
          </Link>
          <Link to="/purchase" className={`${cardClass} bg-white text-slate-800 border-slate-200`}>
            <h3 className={titleClass}>🛒 Barang<br />Masuk</h3>
            <p className={descClass}>Input Nota Beli</p>
          </Link>
          <Link to="/purchase-return" className={`${cardClass} bg-white text-slate-800 border-slate-200`}>
            <h3 className={titleClass}>🔄 Retur<br />Beli</h3>
            <p className={descClass}>Pengembalian Barang</p>
          </Link>
          <Link to="/stock-opname" className={`${cardClass} bg-white text-slate-800 border-slate-200`}>
            <h3 className={titleClass}>⚖️ Stock<br />Opname</h3>
            <p className={descClass}>Cek Fisik Barang</p>
          </Link>
        </>
      )}
      {(isCashier || isGuest) && (
        <Link to="/reports" className={`${cardClass} bg-white text-emerald-600 border-slate-200`}>
          <h3 className={titleClass}>📊 Analisa<br />Toko</h3>
          <p className={descClass}>Laporan Harian Toko</p>
        </Link>
      )}
    </div>
  );

  const renderKeuanganMenu = () => (
    <div className={gridClass}>
      <Link to="/laporan-keuangan" className={`${cardClass} bg-indigo-600 text-white border-indigo-900`}>
        <h3 className={titleClass}>📋 Laporan<br />Finansial</h3>
        <p className={descClass}>Laba Rugi, Neraca, SHU, Equity dll</p>
      </Link>
      {isAdmin && (
        <Link to="/settlements" className={`${cardClass} bg-emerald-600 text-white border-emerald-900`}>
          <h3 className={titleClass}>💳 Kelola<br />Pelunasan</h3>
          <p className={descClass}>Hutang & Piutang Toko</p>
        </Link>
      )}
      {isAdmin && (
        <>
          <Link to="/expenses" className={`${cardClass} bg-white text-purple-600 border-slate-200`}>
            <h3 className={titleClass}>💸 Biaya<br />Operasional</h3>
            <p className={descClass}>Input Pengeluaran Kas</p>
          </Link>
          <Link to="/jurnal" className={`${cardClass} bg-white text-indigo-900 border-slate-200`}>
            <h3 className={titleClass}>📓 Jurnal<br />Umum</h3>
            <p className={descClass}>Pencatatan Jurnal Akuntansi Manual</p>
          </Link>
        </>
      )}
    </div>
  );

  const renderAdminMenu = () => (
    <div className={gridClass}>
      {isAdmin && (
        <>
          <Link to="/products" className={`${cardClass} bg-indigo-50 text-indigo-900 border-indigo-200`}>
            <h3 className={titleClass}>📦 Master<br />Produk</h3>
            <p className={descClass}>Database Barang & Harga</p>
          </Link>
          <Link to="/members" className={`${cardClass} bg-white text-slate-700 border-slate-200`}>
            <h3 className={titleClass}>👥 Master<br />Anggota</h3>
            <p className={descClass}>Database Member</p>
          </Link>
          <Link to="/suppliers" className={`${cardClass} bg-white text-slate-700 border-slate-200`}>
            <h3 className={titleClass}>🚚 Master<br />Supplier</h3>
            <p className={descClass}>Database Pemasok</p>
          </Link>
        </>
      )}
      {isManager && (
        <Link to="/users" className={`${cardClass} bg-yellow-400 text-yellow-900 border-yellow-600`}>
          <h3 className={titleClass}>⚙️ Kelola<br />User</h3>
          <p className={descClass}>Hak Akses Sistem</p>
        </Link>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] bg-gray-50 tracking-tighter">

      <header className="mb-6 md:mb-12 font-black italic uppercase">
        <h1 className="text-xl md:text-3xl text-slate-800 leading-none mb-1 tracking-tighter">
          {activeMenu === "main" ? "Panel Kendali" : `Menu ${activeMenu.toUpperCase()}`}
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[11px] tracking-[0.3em] not-italic font-sans">
          {activeMenu === "main" ? `Selamat Bekerja, ${user?.name}` : `${APP_SETTINGS.ORG_NAME}`}
        </p>
      </header>

      {activeMenu === "main" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 font-black italic">
          {/* 1. UNIT TOKO */}
          <button onClick={() => setSearchParams({ menu: "toko" })} className="p-4 md:p-8 bg-indigo-500 text-white rounded-[2rem] md:rounded-[2rem] shadow-2xl hover:scale-105 transition text-left h-32 md:h-40 flex flex-col justify-between border-b-[6px] md:border-b-[10px] border-indigo-900 group">
            <h3 className="text-lg md:text-2xl leading-none italic">🛒 Unit Usaha <br />Toko</h3>
            <p className="text-indigo-200 text-[10px] font-bold font-sans not-italic hidden md:block">Transaksi & Inventori</p>
          </button>

          {/* 2. UNIT SIMPAN PINJAM */}
          {isAdmin && (
            <Link to="/simpan-pinjam" className="p-4 md:p-8 bg-emerald-600 text-white rounded-[2rem] md:rounded-[2rem] shadow-2xl hover:scale-105 transition text-left h-32 md:h-40 flex flex-col justify-between border-b-[6px] md:border-b-[10px] border-emerald-900 group">
              <h3 className="text-lg md:text-2xl leading-none italic">💰 Unit Usaha <br />Simpan Pinjam</h3>
              <p className="text-emerald-100 text-[10px] font-bold font-sans not-italic hidden md:block">Simpanan & Kredit</p>
            </Link>
          )}

          {/* 3. UNIT KEUANGAN */}
          {(isAdmin || isGuest) && (
            <button onClick={() => setSearchParams({ menu: "keuangan" })} className="p-4 md:p-8 bg-slate-800 text-white rounded-[2rem] md:rounded-[2rem] shadow-2xl hover:scale-105 transition text-left h-32 md:h-40 flex flex-col justify-between border-b-[6px] md:border-b-[10px] border-slate-950 group">
              <h3 className="text-lg md:text-2xl leading-none italic">📋 Trx Keuangan<br />& Laporan</h3>
              <p className="text-slate-400 text-[10px] font-bold font-sans not-italic hidden md:block">Laporan, Biaya & Jurnal Umum</p>
            </button>
          )}

          {/* 4. UNIT ADMIN */}
          {isAdmin && (
            <button onClick={() => setSearchParams({ menu: "admin" })} className="p-4 md:p-8 bg-amber-400 text-amber-900 rounded-[2rem] md:rounded-[2rem] shadow-2xl hover:scale-105 transition text-left h-32 md:h-40 flex flex-col justify-between border-b-[6px] md:border-b-[10px] border-amber-600 group">
              <h3 className="text-xl md:text-2xl leading-none italic">⚙️ Admin<br />& Sistem</h3>
              <p className="text-amber-800 text-[10px] font-bold font-sans not-italic hidden md:block">Database Master & User</p>
            </button>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeMenu === "toko" && renderTokoMenu()}
          {activeMenu === "keuangan" && renderKeuanganMenu()}
          {activeMenu === "admin" && renderAdminMenu()}
        </div>
      )}
    </div>
  );
};

// 5. Konfigurasi Utama App
function App() {
  useEffect(() => {
    document.title = APP_SETTINGS.ORG_NAME;
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute><RoleRoute allowedRoles={["CASHIER", "ADMIN", "MANAGER"]}><PosPage /></RoleRoute></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><ProductPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><SupplierPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/members" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><MemberPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/purchase" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><PurchasePage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/purchase-return" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><PurchaseReturnPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/stock-opname" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><StockOpnamePage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><ExpensePage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><RoleRoute allowedRoles={["MANAGER", "ADMIN", "GUEST", "CASHIER"]}><Layout><ReportPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/laporan-keuangan" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER", "GUEST"]}><Layout><FinancialReportPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/simpan-pinjam" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><SimpanPinjamPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/eod-toko" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><EodPostingPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><RoleRoute allowedRoles={["MANAGER"]}><Layout><UserPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/jurnal" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><JurnalUmumPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/promo" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><PromoPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="/settlements" element={<PrivateRoute><RoleRoute allowedRoles={["ADMIN", "MANAGER"]}><Layout><SettlementPage /></Layout></RoleRoute></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;