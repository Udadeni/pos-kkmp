import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, onSnapshot, updateDoc, doc, setDoc, query, orderBy
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import {
  Users, UserPlus, Search, Edit3, X,
  Shield, CheckCircle2, AlertCircle, RefreshCw, Lock, ShieldCheck, Mail, KeyRound, User
} from 'lucide-react';
import { APP_SETTINGS } from '../constants/settings';

// Helper untuk menginisialisasi Secondary Firebase App agar sesi Manager tidak ter-logout saat registrasi user baru
const getSecondaryAuth = () => {
  const primaryApp = getApp();
  const secondaryAppName = 'SecondaryAuthApp';

  let secondaryApp = getApps().find(app => app.name === secondaryAppName);
  if (!secondaryApp) {
    secondaryApp = initializeApp(primaryApp.options, secondaryAppName);
  }
  return getAuth(secondaryApp);
};

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State untuk Tambah User
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'GUEST'
  });

  useEffect(() => {
    const q = query(collection(db, 'master_users'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Ubah status aktif ${user.name}?`)) return;
    try {
      await updateDoc(doc(db, 'master_users', user.id), {
        is_active: !user.is_active
      });
    } catch (e) {
      alert("Gagal update status: " + e.message);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await updateDoc(doc(db, 'master_users', user.id), {
        role: newRole
      });
      setShowModal(false);
    } catch (e) {
      alert("Gagal update role: " + e.message);
    }
  };

  // Handler Tambah User Baru (Authentication + Firestore)
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Mohon isi semua field yang diperlukan!");
      return;
    }

    setLoading(true);
    try {
      // 1. Buat user di Firebase Authentication menggunakan Secondary Auth Instance
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password
      );
      const createdUser = userCredential.user;

      // 2. Simpan detail profil ke Firestore master_users
      await setDoc(doc(db, 'master_users', createdUser.uid), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        is_active: true,
        created_at: new Date().toISOString()
      });

      alert(`User ${newUser.name} berhasil ditambahkan!`);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'GUEST' });
    } catch (error) {
      console.error("Gagal menambah user:", error);
      alert("Gagal menambah user: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 tracking-tighter uppercase italic font-black">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-slate-800 leading-none mb-1">Kelola Pengguna</h1>
          <p className="text-[9px] text-slate-400 tracking-[0.3em] not-italic font-sans font-bold uppercase">
            {APP_SETTINGS.ORG_NAME} • Keamanan & Akses
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" placeholder="CARI USER..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-2xl shadow-sm text-[10px] outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 shrink-0"
          >
            <UserPlus size={16} /> Tambah User
          </button>
        </div>
      </div>

      {/* USER CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <div key={u.id} className={`bg-white p-6 rounded-[2.5rem] shadow-xl border-t-[10px] transition-all relative overflow-hidden ${u.is_active ? 'border-indigo-600' : 'border-red-500'}`}>

            {!u.is_active && (
              <div className="absolute -top-2 -right-2 p-4 text-red-100">
                <AlertCircle size={80} />
              </div>
            )}

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${u.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
                  <ShieldCheck size={24} />
                </div>
                <div className="text-right">
                  <span className={`text-[8px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${u.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </div>
              </div>

              <h3 className="text-lg text-slate-800 leading-none mb-1 truncate">{u.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-400 lowercase italic font-sans font-bold text-[10px] mb-6">
                <Mail size={10} />
                {u.email}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingUser(u); setShowModal(true); }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 size={14} /> Hak Akses
                </button>
                <button
                  onClick={() => handleToggleStatus(u)}
                  className={`flex-1 py-3 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  {u.is_active ? <Lock size={14} /> : <CheckCircle2 size={14} />}
                  {u.is_active ? 'Matikan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDIT ROLE */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center border-b border-slate-50">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 italic uppercase leading-none">Update Hak Akses</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-2 font-sans not-italic uppercase tracking-widest">{editingUser.name}</p>
            </div>

            <div className="p-8 space-y-3">
              {['MANAGER', 'ADMIN', 'CASHIER', 'GUEST'].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(editingUser, r)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${editingUser.role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH USER BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center border-b border-slate-50 relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 italic uppercase leading-none">Tambah User Baru</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-2 font-sans not-italic uppercase tracking-widest">
                Registrasi Akun Pengguna Baru
              </p>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-sans font-bold mb-1 uppercase tracking-widest">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="NAMA PENGGUNA"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-sans font-bold"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans font-bold mb-1 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="user@koperasi.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-sans font-bold lowercase"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans font-bold mb-1 uppercase tracking-widest">Password Awal</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="MINIMAL 6 KARAKTER"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-sans font-bold"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-sans font-bold mb-1 uppercase tracking-widest">Role / Hak Akses</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-sans font-bold uppercase cursor-pointer"
                >
                  <option value="GUEST">GUEST</option>
                  <option value="CASHIER">CASHIER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 rounded-2xl bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INFO FOOTER */}
      <div className="mt-12 p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
        <AlertCircle size={20} className="text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-800 font-bold leading-relaxed not-italic font-sans uppercase">
          Perubahan Role memerlukan pengguna untuk Re-Login agar hak akses baru (Custom Claims) diperbarui pada token keamanan mereka.
        </p>
      </div>
    </div>
  );
};

export default UserPage;