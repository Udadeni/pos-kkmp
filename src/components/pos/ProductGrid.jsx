import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function ProductGrid({ products, onAddToCart }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return products.filter(p => 
      p.status === "ACTIVE" && // WAJIB AKTIF
      p.current_stock > 0 &&   // WAJIB ADA STOK
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  const handleAdd = (product) => {
    const error = onAddToCart(product);
    if (error) alert(error);
  };

  // REVISI: Fungsi untuk menangani otomatis masuk cart saat Scan Barcode
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Mencegah form reload/submit tidak sengaja
      
      if (filtered.length > 0) {
        // Ambil barang pertama dari hasil filter (hasil scan barcode)
        handleAdd(filtered[0]);
        setSearchTerm(""); // Kosongkan input agar siap scan barang berikutnya
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-200 overflow-hidden border-r border-gray-300">
      {/* Search Box */}
      <div className="p-2 bg-white border-b border-gray-300 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Scan Barcode atau ketik..."
            className="w-full p-2 pl-10 rounded border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-sm"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            // TAMBAHAN: Listener untuk tombol Enter dari Scanner
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
      </div>

      {/* Dense Grid */}
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 shadow-inner">
        {filtered.map(p => (
          <button 
            key={p.id} 
            onClick={() => handleAdd(p)} 
            className="bg-white p-2 border border-gray-300 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left flex flex-col justify-between h-28 active:bg-indigo-100 relative group"
          >
            <div>
              <p className="text-[12px] font-mono text-gray-500 leading-none mb-1">{p.barcode}</p>
              <p className="font-bold text-gray-800 leading-tight text-[13px] uppercase line-clamp-3">
                {p.name}
              </p>
            </div>
            <div className="flex justify-between items-end mt-1 border-t border-gray-100 pt-1">
              <p className="text-indigo-700 font-black text-xs">
                {p.current_sell_price.toLocaleString()}
              </p>
              <p className={`text-[10px] font-bold ${p.current_stock < 5 ? 'text-red-600' : 'text-gray-400'}`}>
                {p.current_stock}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}