import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  doc, serverTimestamp, query, orderBy, getDocs, where, limit, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, UserPlus, Search, Edit3, X, 
  Phone, MapPin, Fingerprint, ChevronLeft, ChevronRight, StickyNote, RefreshCw,
  FileSpreadsheet, Upload, Download
} from 'lucide-react';
import { APP_SETTINGS } from '../constants/settings';
import * as XLSX from 'xlsx';

const MemberPage = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  const [formData, setFormData] = useState({
    member_number: '',
    nik: '',
    full_name: '',
    phone: '',
    address: '',
    note: '',
    status: 'ACTIVE'
  });

  // REVISI: Mengubah sistem sortir ke Nama (A-Z)
  useEffect(() => {
    // Kita ambil data mentah, sortir dilakukan di sisi client agar lebih fleksibel
    const q = query(collection(db, 'master_members'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const item = d.data();
        return { 
          id: d.id, 
          ...item,
          status: item.status || (item.is_active === false ? 'INACTIVE' : 'ACTIVE') 
        };
      });

      // Logika Sortir Nama A-Z (Case Insensitive)
      const sortedData = data.sort((a, b) => {
        const nameA = (a.full_name || a.name || "").toUpperCase();
        const nameB = (b.full_name || b.name || "").toUpperCase();
        return nameA.localeCompare(nameB);
      });

      setMembers(sortedData);
    });
    return () => unsub();
  }, []);

  const generateMemberNumber = async () => {
    setGeneratingId(true);
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = year + month;

      const q = query(
        collection(db, 'master_members'),
        where('member_number', '>=', prefix),
        where('member_number', '<=', prefix + '\uf8ff'),
        orderBy('member_number', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let nextNumber = 1;

      if (!querySnapshot.empty) {
        const lastNumber = querySnapshot.docs[0].data().member_number;
        const lastSequence = parseInt(lastNumber.slice(4));
        nextNumber = lastSequence + 1;
      }

      return prefix + nextNumber.toString().padStart(5, '0');
    } catch (e) {
      console.error(e);
      return `ERR-${Date.now()}`;
    } finally {
      setGeneratingId(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [["member_number", "full_name", "phone", "address", "join_date", "status", "notes"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template_Anggota");
    XLSX.writeFile(wb, "Template_Impor_Anggota.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const batch = writeBatch(db);

        rows.forEach((row) => {
          const docRef = doc(collection(db, 'master_members'));
          batch.set(docRef, {
            member_number: String(row.member_number || ''),
            full_name: (row.full_name || '').toUpperCase(),
            phone: String(row.phone || ''),
            address: (row.address || '').toUpperCase(),
            join_date: row.join_date || '', 
            status: (row.status || 'ACTIVE').toUpperCase(),
            note: (row.notes || '').toUpperCase(),
            nik: '', 
            created_at: serverTimestamp()
          });
        });

        await batch.commit();
        alert(`Sukses mengimpor ${rows.length} anggota!`);
      } catch (err) {
        console.error(err);
        alert("Gagal impor: " + err.message);
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      (m.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.member_number || "").includes(searchTerm) ||
      (m.nik && m.nik.includes(searchTerm))
    );
  }, [members, searchTerm]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    return filteredMembers.slice(firstIndex, lastIndex);
  }, [filteredMembers, currentPage]);

  const handleOpenModal = async (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        member_number: member.member_number || '',
        nik: member.nik || '',
        full_name: member.full_name || '',
        phone: member.phone || '',
        address: member.address || '',
        note: member.note || '',
        status: member.status || 'ACTIVE'
      });
    } else {
      setEditingMember(null);
      const newId = await generateMemberNumber();
      setFormData({
        member_number: newId,
        nik: '',
        full_name: '',
        phone: '',
        address: '',
        note: '',
        status: 'ACTIVE'
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingMember) {
        await updateDoc(doc(db, 'master_members', editingMember.id), {
          ...formData,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'master_members'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      setShowModal(false);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 tracking-tighter uppercase italic font-black">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl text-slate-800 leading-none mb-1 tracking-tighter">Anggota</h1>
          <p className="text-[9px] text-slate-400 tracking-[0.3em] not-italic font-sans font-bold uppercase">
            {APP_SETTINGS.ORG_NAME} • {filteredMembers.length} Personel
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-sans not-italic">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="CARI..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-2xl shadow-sm text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={downloadTemplate} title="Unduh Template Excel" className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                <Download size={18}/>
            </button>
            <label className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl transition-all cursor-pointer">
                <Upload size={18}/>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
            <button 
              onClick={() => handleOpenModal()}
              disabled={generatingId || loading}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all shrink-0 disabled:opacity-50"
            >
              {generatingId || loading ? <RefreshCw className="animate-spin" size={14} /> : <UserPlus size={14} />} 
              Registrasi
            </button>
          </div>
        </div>
      </div>

      {/* GRID KARTU ANGGOTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentItems.map((m) => (
          <div key={m.id} className={`bg-white p-5 rounded-[2rem] shadow-md border-2 relative overflow-hidden group transition-all ${m.status === 'INACTIVE' ? 'border-red-100 opacity-60' : 'border-slate-50 hover:border-indigo-200'}`}>
            <div className="absolute -top-2 -right-2 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Users size={60} />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest font-mono">
                  {m.member_number}
                </span>
                <div className="flex gap-2">
                   {m.status === 'INACTIVE' && <span className="text-[7px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">Non-Aktif</span>}
                   <button onClick={() => handleOpenModal(m)} className="text-slate-200 hover:text-indigo-600 transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-sm text-slate-800 leading-tight mb-3 truncate" title={m.full_name}>
                {m.full_name}
              </h3>
              
              <div className="space-y-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tight not-italic font-sans border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2">
                  <Fingerprint size={12} className="text-indigo-300" />
                  <span className={!m.nik ? "text-red-200 italic" : "text-slate-500"}>
                    {m.nik || "NIK KOSONG"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-indigo-300" />
                  <span className="text-slate-500">{m.phone || '---'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-indigo-300" />
                  <span className="text-slate-500 truncate">{m.address || '---'}</span>
                </div>
                {m.note && (
                  <div className="flex items-start gap-2 pt-1 mt-1 border-t border-dashed border-slate-100">
                    <StickyNote size={10} className="text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-[8px] text-slate-400 leading-tight line-clamp-1 italic">{m.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center items-center gap-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-white rounded-xl shadow-sm text-indigo-600 disabled:opacity-20 hover:bg-indigo-50 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2) return null;
              return (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-white rounded-xl shadow-sm text-indigo-600 disabled:opacity-20 hover:bg-indigo-50 transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* MODAL REGISTRASI/EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-t-8 border-indigo-600">
            <div className="p-6 flex justify-between items-center border-b border-slate-50">
              <h2 className="text-lg font-black text-slate-800 italic uppercase">
                {editingMember ? 'Edit Anggota' : 'Registrasi'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3 font-sans not-italic font-bold">
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Nomor Anggota</label>
                  <input type="text" readOnly className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-black text-indigo-600 text-xs outline-none font-mono" value={formData.member_number} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Nomor NIK (16 Digit)</label>
                  <input type="text" maxLength="16" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100" value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Nama Lengkap</label>
                  <input type="text" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 uppercase" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Nomor WhatsApp</label>
                  <input type="text" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Alamat</label>
                  <textarea rows="1" required className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 uppercase" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})} />
                </div>
                <div>
                   <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Status Keanggotaan</label>
                   <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs outline-none" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="ACTIVE">AKTIF</option>
                      <option value="INACTIVE">NON-AKTIF</option>
                   </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 tracking-widest">Catatan</label>
                  <textarea rows="1" className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 uppercase" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-2">
                {loading ? 'MENYIMPAN...' : 'SIMPAN DATA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberPage;