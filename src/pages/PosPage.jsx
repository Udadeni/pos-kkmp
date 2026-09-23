import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../components/pos/hooks/useProducts";
import { useMembers } from "../components/pos/hooks/useMembers";
import { useCashSummary } from "../components/pos/hooks/useCashSummary";
import { useCart } from "../components/pos/hooks/useCart";
import { salesService } from "../services/salesService";
import { cashService } from "../services/cashService";
import { APP_SETTINGS } from "../constants/settings";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Send, PlusCircle, ShoppingBag, Printer, Monitor, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProductGrid from "../components/pos/ProductGrid";
import CartPanel from "../components/pos/CartPanel";
import PaymentPanel from "../components/pos/PaymentPanel";
import HandoverModal from "../components/pos/HandoverModal";

// ... (Helper functions: labelValue, wrapWords, centerText, centerBlock, money tetap sama)
const RECEIPT_WIDTH = 32;
function labelValue(label, value, labelWidth = 9) { return String(label).padEnd(labelWidth, " ") + ": " + String(value ?? ""); }
function wrapWords(text, width = RECEIPT_WIDTH) { const words = String(text ?? "").split(" ").filter(Boolean); const lines = []; let cur = ""; words.forEach((w) => { const test = cur ? cur + " " + w : w; if (test.length > width) { if (cur) lines.push(cur); cur = w.length > width ? w.slice(0, width) : w; } else { cur = test; } }); if (cur) lines.push(cur); return lines.length ? lines : [""]; }
function centerText(text, width = RECEIPT_WIDTH) { const t = String(text ?? ""); if (t.length >= width) return t; const totalPad = width - t.length; const left = Math.floor(totalPad / 2); return " ".repeat(left) + t; }
function centerBlock(text, width = RECEIPT_WIDTH) { return wrapWords(text, width).map((line) => centerText(line, width)).join("\n"); }
function money(n) { return Math.round(Number(n) || 0).toLocaleString("id-ID"); }

function buildReceiptBlocks(receipt, fallbackCashierName) {
  if (!receipt) return null;
  const header = [centerBlock(String(APP_SETTINGS.ORG_NAME || "").toUpperCase()), APP_SETTINGS.ORG_SUBTEXT ? centerBlock(APP_SETTINGS.ORG_SUBTEXT) : null, APP_SETTINGS.ORG_REGION ? centerBlock(APP_SETTINGS.ORG_REGION) : null, "=".repeat(RECEIPT_WIDTH)].filter(Boolean).join("\n");
  const info = [labelValue("NOTA", receipt.invoice_number || "-"), labelValue("TGL", receipt.date ? receipt.date.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"), labelValue("PLG", receipt.member_name || "NON-MEMBER"), labelValue("KASIR", receipt.cashier_name || fallbackCashierName || "KASIR"), "-".repeat(RECEIPT_WIDTH)].join("\n");
  const itemLines = (receipt.items || []).flatMap((item, idx) => { const name = String(item.product_name || item.name || "-").toUpperCase(); const qty = Number(item.qty || 0); const price = Math.round(item.current_sell_price || item.price || 0); const lineTotal = qty * price; const nameLines = wrapWords(`${idx + 1}. ${name}`, RECEIPT_WIDTH); const qtyLine = `   ${qty} x ${money(price)} = ${money(lineTotal)}`; return [...nameLines, qtyLine]; });
  const items = (itemLines.length ? itemLines : ["(tidak ada item)"]).concat("-".repeat(RECEIPT_WIDTH)).join("\n");
  const totalsLines = [labelValue("SUBTOTAL", "Rp " + money(receipt.total_amount))];
  if (Number(receipt.discount_amount) > 0) totalsLines.push(labelValue("DISKON", "-Rp " + money(receipt.discount_amount)));
  totalsLines.push("-".repeat(RECEIPT_WIDTH), labelValue("TOTAL", "Rp " + money(receipt.grand_total)), "-".repeat(RECEIPT_WIDTH), labelValue("BAYAR", "Rp " + money(receipt.paid_amount)), labelValue("KEMBALI", "Rp " + money(receipt.change_amount)));
  const totals = totalsLines.join("\n");
  const footer = ["=".repeat(RECEIPT_WIDTH), centerText("TERIMA KASIH"), centerBlock(String(APP_SETTINGS.ORG_NAME || "").toUpperCase())].join("\n");
  return { header, info, items, totals, footer };
}

const preBase = { margin: 0, fontFamily: "'Courier New', Courier, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" };

export default function PosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Fitur Deteksi Ukuran Layar
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const products = useProducts();
  const members = useMembers();
  const cashSummary = useCashSummary(user.uid);
  const cartState = useCart();

  // Listener untuk resize layar
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubPromo = onSnapshot(doc(db, "system_settings", "current_promo"), (snap) => {
      if (snap.exists()) {
        const promoData = snap.data();
        if (typeof cartState.setActivePromo === "function") {
          cartState.setActivePromo({
            is_active: promoData.is_active,
            percentage: Number(promoData.percentage),
            name: promoData.name
          });
        }
      }
    });
    return () => unsubPromo();
  }, [cartState.setActivePromo]);

  const handleNextTransaction = () => {
    cartState.resetCart();
    setLastReceipt(null);
    cartState.setCustomerType("UMUM");
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Scan"], input[placeholder*="Cari"]');
      if (searchInput) { searchInput.value = ""; searchInput.focus(); }
    }, 100);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && lastReceipt) {
        e.preventDefault();
        handleNextTransaction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastReceipt]);

  const handleCheckout = async (paymentData) => {
    if (cartState.cart.length === 0) return;
    setLoading(true);
    try {
      const receiptData = await salesService.processCheckout({
        cart: cartState.cart,
        cartStats: cartState.cartStats,
        discountAmount: cartState.cartStats.discount_amount,
        paidAmount: paymentData.paidAmount,
        paymentMethod: paymentData.paymentMethod,
        selectedMemberId: cartState.selectedMemberId,
        members,
        user
      });
      setLastReceipt(receiptData);
      setTimeout(() => { window.print(); }, 500);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan transaksi: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleHandoverSave = async (amount) => {
    try {
      await cashService.processHandover(user.uid, user.name, amount);
      alert("Setoran Berhasil!");
      setIsHandoverOpen(false);
    } catch (e) { alert(e.message); }
  };

  const receiptBlocks = buildReceiptBlocks(lastReceipt, user?.displayName || user?.name);

  // LOGIKA SCREEN GUARD
  if (windowWidth < 768) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-6 text-center overflow-hidden">
        <div className="max-w-xs animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-indigo-400 shadow-2xl shadow-indigo-500/20">
            <Monitor size={48} strokeWidth={1.5} className="animate-pulse" />
          </div>
          <h2 className="text-white text-2xl font-black uppercase tracking-tighter italic mb-4 leading-none">
            Layar Terlalu Kecil
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
            Modul Kasir harus diakses via <span className="text-indigo-400 font-bold">Tablet atau Laptop/PC</span> untuk akurasi transaksi dan kenyamanan operasional.
          </p>
          <button
            onClick={() => navigate("/")}
            className="relative z-50 flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 shadow-indigo-600/30 cursor-pointer"
          >
            <LayoutDashboard size={18} />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
      </div>
    );
  }

  // JIKA LAYAR LEBAR (KASIR UTAMA)
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans relative">

      {/* NAVBAR */}
      <nav className="bg-indigo-900 text-white p-3 flex justify-between items-center shadow-xl z-20 shrink-0 print:hidden border-b border-indigo-700">
        <div className="flex items-center gap-4 min-w-[200px]">
          <button onClick={() => navigate("/")} className="hover:bg-indigo-700 p-2 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <div className="font-black italic uppercase leading-none">
            <h1 className="text-lg tracking-tighter">Kasir {APP_SETTINGS.ORG_NAME}</h1>
          </div>
        </div>

        {/* RUNNING TEXT PROMO */}
        <div className="flex-1 mx-8 overflow-hidden relative">
          {cartState.activePromo?.is_active ? (
            <div className="whitespace-nowrap animate-marquee">
              <span className="text-sm font-bold text-yellow-400 uppercase tracking-[0.2em]">
                🔥 PROMO SEDANG AKTIF: <span className="text-white underline">{cartState.activePromo.name}</span>
                &nbsp; POTONGAN HARGA <span className="text-white">{cartState.activePromo.percentage}%</span>
                &nbsp; --- PASTIKAN INPUT MEMBER UNTUK MENDAPATKAN DISKON --- 🔥
              </span>
            </div>
          ) : (
            <div className="text-center text-[14px] text-indigo-300 font-medium tracking-widest uppercase">
              Sistem Kasir v2.0 • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 min-w-[200px] justify-end">
          <div className="bg-indigo-950 px-4 py-1.5 rounded-xl border border-indigo-700 text-right">
            <p className="text-[8px] font-bold text-indigo-400 uppercase leading-none text-left">Laci Tunai</p>
            <p className="text-sm font-black text-emerald-400 font-mono">
              Rp {(cashSummary.totalSales - cashSummary.totalHandover).toLocaleString('id-ID')}
            </p>
          </div>
          <button onClick={() => setIsHandoverOpen(true)} className="bg-indigo-500 hover:bg-indigo-400 p-2.5 rounded-xl shadow-lg transition-all active:scale-90">
            <Send size={18} />
          </button>
        </div>
      </nav>

      {/* BODY KASIR */}
      <div className="flex flex-1 w-full overflow-hidden">
        <div className="flex-1 print:hidden flex flex-col min-w-0 bg-white">
          <ProductGrid products={products} onAddToCart={cartState.addToCart} />
        </div>
        <div className="w-[450px] bg-white flex flex-col shadow-2xl z-10 border-l border-slate-200 print:hidden overflow-hidden">
          <CartPanel cart={cartState.cart} onUpdateQty={cartState.updateQty} stats={cartState.cartStats} />
          <PaymentPanel state={cartState} members={members} onCheckout={handleCheckout} loading={loading} />
        </div>
      </div>

      {/* OVERLAY SUKSES */}
      {lastReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBag size={40} /></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Berhasil</h2>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => window.print()} className="flex items-center justify-center gap-2 w-full bg-slate-100 p-4 rounded-2xl font-black text-xs uppercase transition active:scale-95">
                <Printer size={16} /> Cetak Struk
              </button>
              <button autoFocus onClick={handleNextTransaction} className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-xs uppercase shadow-xl transition active:scale-95 outline-none">
                <PlusCircle size={16} /> Transaksi Baru (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA STRUK FISIK */}
      {receiptBlocks && (
        <div id="receipt-container" className="hidden print:block text-black">
          <pre style={{ ...preBase, fontSize: "6.5pt", fontWeight: "bold", lineHeight: 1.35 }}>{receiptBlocks.header}</pre>
          <pre style={{ ...preBase, fontSize: "7pt", lineHeight: 1.4, marginTop: "4px" }}>{receiptBlocks.info}</pre>
          <pre style={{ ...preBase, fontSize: "7pt", lineHeight: 1.4 }}>{receiptBlocks.items}</pre>
          <pre style={{ ...preBase, fontSize: "7.5pt", fontWeight: "bold", lineHeight: 1.5 }}>{receiptBlocks.totals}</pre>
          <pre style={{ ...preBase, fontSize: "7pt", lineHeight: 1.4, marginTop: "6px" }}>{receiptBlocks.footer}</pre>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
        @media print {
          body * { visibility: hidden !important; }
          #receipt-container, #receipt-container * { visibility: visible !important; color: black !important; }
          #receipt-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; margin: 0 !important; display: block !important; }
          @page { size: 58mm auto; margin: 0; }
        }
      `}</style>

      {isHandoverOpen && (
        <HandoverModal summary={cashSummary} onClose={() => setIsHandoverOpen(false)} onSave={handleHandoverSave} />
      )}
    </div>
  );
}