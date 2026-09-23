import { useState, useMemo } from "react";

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [activePromo, setActivePromo] = useState({ is_active: false, percentage: 0 });
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [customerType, setCustomerType] = useState("UMUM");

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Jika barang sudah ada: Hapus dari posisi lama, taruh di PALING ATAS dengan Qty + 1
        const otherItems = prev.filter((item) => item.id !== product.id);
        return [{ ...existing, qty: existing.qty + 1 }, ...otherItems];
      }
      // Jika barang baru: Taruh langsung di PALING ATAS
      return [{ ...product, qty: 1 }, ...prev];
    });
  };

  const updateQty = (id, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
      );
    }
  };

  const resetCart = () => {
    setCart([]);
    setSelectedMemberId(null);
    setPaidAmount("");
    setPaymentMethod("CASH");
    setCustomerType("UMUM");
  };

  const cartStats = useMemo(() => {
    const total_amount = cart.reduce((sum, item) => sum + (item.current_sell_price || item.price || 0) * item.qty, 0);
    const discount_amount = activePromo.is_active 
      ? Math.round((total_amount * activePromo.percentage) / 100)
      : 0;
    const grand_total = total_amount - discount_amount;
    return {
      total_amount,
      discount_amount,
      grand_total,
      total_items: cart.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [cart, activePromo]);

  return {
    cart,
    addToCart,
    updateQty,
    resetCart,
    cartStats,
    selectedMemberId,
    setSelectedMemberId,
    activePromo,
    setActivePromo,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    customerType,
    setCustomerType
  };
};