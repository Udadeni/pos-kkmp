import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { APP_SETTINGS } from "../constants/settings"; // Import Pusat Komando

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/"); 
    } catch (err) {
      alert("Login Gagal: " + err.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4 relative overflow-hidden font-sans">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-[3rem] bg-white p-12 shadow-2xl border border-slate-100 z-10">
        {/* IDENTITAS KOPERASI (DINAMIS) */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-indigo-700 italic uppercase tracking-tighter leading-none">
            {APP_SETTINGS.ORG_NAME}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">
            {APP_SETTINGS.ORG_SUBTEXT || "Official System"}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Email Akun</label>
            <input 
              type="email" 
              placeholder="nama@email.com"
              className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <button className="w-full rounded-[2rem] bg-indigo-600 p-5 font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 mt-4">
            Masuk Ke Sistem
          </button>
        </div>
      </form>

      {/* WATERMARK IDENTITAS BAPAK DENI (FIXED) */}
      <div className="fixed bottom-10 right-10 text-right opacity-30 select-none pointer-events-none z-0">
        <div className="inline-block border-r-4 border-indigo-600 pr-4">
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-500">
            Hak Cipta : <span className="text-indigo-600">{APP_SETTINGS.DEV_EMAIL}</span>
          </p>
          <p className="text-[12px] font-bold tracking-widest text-slate-400 mt-1 font-sans">
            {APP_SETTINGS.DEV_LOCATION}
          </p>
        </div>
      </div>

      {/* HIASAN BACKGROUND (SUBTIL) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[80px] -z-10"></div>
    </div>
  );
}