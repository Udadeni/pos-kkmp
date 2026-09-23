import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    return onSnapshot(collection(db, "master_members"), (snap) => {
      setMembers(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          // Ambil full_name atau name (kompatibilitas data lama)
          name: data.full_name || data.name || "Tanpa Nama",
          number: data.member_number || "No-ID",
          status: data.status || "ACTIVE"
        };
      }).filter(m => m.status !== "INACTIVE")); // Tampilkan yang aktif atau yang belum ada statusnya
    }, (err) => { if (err.code !== "permission-denied") console.error(err); });
  }, []);
  return members;
};