import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    return onSnapshot(collection(db, "master_products"), (snap) => {
      // Hapus filter .filter(p => p.status === "ACTIVE")
      // Agar ProductPage bisa menampilkan yang INACTIVE untuk diaktifkan
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => { if (err.code !== "permission-denied") console.error(err); });
  }, []);
  return products;
};