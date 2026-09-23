import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    try {
      setUser(null);
      await signOut(auth);
    } catch (error) {
      console.error("Gagal Logout:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // 1. Jika tidak ada user (logout)
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 2. Paksa refresh token untuk mendapatkan custom claims terbaru jika ada
        await fbUser.getIdToken(true);

        // 3. Ambil data profil dari Firestore (master_users)
        const userRef = doc(db, "master_users", fbUser.uid);
        
        // Pola Retry Logic untuk meredam error Permission Denied saat baru login
        let userDoc;
        await new Promise(res => setTimeout(res, 400)); // Jeda sinkronisasi auth-firestore
        
        try {
          userDoc = await getDoc(userRef);
        } catch (e) {
          console.warn("Retry fetching user profile...");
          await new Promise(res => setTimeout(res, 600));
          userDoc = await getDoc(userRef);
        }

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Gabungkan data Auth Firebase dan data Firestore
          setUser({ 
            uid: fbUser.uid, 
            email: fbUser.email, 
            ...userData // Ini berisi role dan is_active
          });

          // Cek jika akun dinonaktifkan secara mendadak
          if (userData.is_active === false) {
            console.warn("Akun ini dinonaktifkan.");
          }

        } else {
          // Jika data di Firestore tidak ada, set sebagai Guest
          setUser({ 
            uid: fbUser.uid, 
            email: fbUser.email, 
            role: "GUEST",
            is_active: true 
          });
        }
      } catch (err) {
        console.error("Auth Sinkronisasi Error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);