import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const cashService = {
  processHandover: async (cashierId, cashierName, amount) => {
    await addDoc(collection(db, "cash_handovers"), {
      cashier_id: cashierId,
      cashier_name: cashierName,
      amount: Number(amount),
      timestamp: serverTimestamp(),
      notes: "Setoran Kasir"
    });
  }
};