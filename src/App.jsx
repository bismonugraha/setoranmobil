import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Import Icon Lucide
import { 
  Car, 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Trash2, 
  Search, 
  Download, 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  X, 
  AlertTriangle 
} from 'lucide-react';

// --- DATA INITIAL (Bahan bawaan pertama kali aplikasi dibuka) ---
const INITIAL_VEHICLES = [
  { id: 'v1', plat: 'B 1234 CD', jenis: 'Mobil', merk: 'Toyota Avanza', pengemudi: 'Budi Santoso', status: 'Aktif' },
  { id: 'v2', plat: 'B 5678 EF', jenis: 'Mobil', merk: 'Daihatsu Xenia', pengemudi: 'Ahmad Supri', status: 'Aktif' },
  { id: 'v3', plat: 'B 9101 GH', jenis: 'Truk', merk: 'Isuzu Elf', pengemudi: 'Joko Susilo', status: 'Perbaikan' },
];

const INITIAL_TRANSACTIONS = [
  { id: 't1', kendaraanId: 'v1', tipe: 'setoran', jumlah: 4500000, tanggal: '2026-08-15', keterangan: 'Setoran Bulanan Agustus' },
  { id: 't2', kendaraanId: 'v2', tipe: 'setoran', jumlah: 5000000, tanggal: '2026-08-20', keterangan: 'Setoran Bulanan Agustus' },
  { id: 't3', kendaraanId: 'v1', tipe: 'pengeluaran', jumlah: 1200000, tanggal: '2026-08-25', keterangan: 'Servis Rutin & Ganti Oli' },
  { id: 't4', kendaraanId: 'v3', tipe: 'pengeluaran', jumlah: 2500000, tanggal: '2026-09-05', keterangan: 'Perbaikan Mesin' },
  { id: 't5', kendaraanId: 'v2', tipe: 'setoran', jumlah: 5200000, tanggal: '2026-09-18', keterangan: 'Setoran Bulanan September' },
  { id: 't6', kendaraanId: 'v1', tipe: 'setoran', jumlah: 4800000, tanggal: '2026-09-22', keterangan: 'Setoran Bulanan September' },
  { id: 't7', kendaraanId: 'v1', tipe: 'setoran', jumlah: 5000000, tanggal: '2026-10-10', keterangan: 'Setoran Bulanan Oktober' },
  { id: 't8', kendaraanId: 'v2', tipe: 'setoran', jumlah: 5500000, tanggal: '2026-10-15', keterangan: 'Setoran Bulanan Oktober' },
  { id: 't9', kendaraanId: 'v3', tipe: 'pengeluaran', jumlah: 850000, tanggal: '2026-10-20', keterangan: 'Ganti Ban Belakang' },
];

// Helper Format Rupiah
const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

// ====================================================
// MASUKKAN WEB APP URL GOOGLE APPS SCRIPT ANDA DI SINI
// ====================================================
const GOOGLE_SHEETS_API = "https://script.google.com/macros/s/AKfycbzDt5SRzrDk-3C5yOMGlkSaRHrzoBJoRy_TtYOORdhvisIzYiozKKuZ2u5UnXFBqBKbsQ/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ----------------------------------------------------
  // STATES DATA & LOADING
  // ----------------------------------------------------
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // BACA DATA (FETCH FROM GOOGLE SHEETS)
  // ----------------------------------------------------
  const fetchData = async () => {
    if (!GOOGLE_SHEETS_API || GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      console.warn("URL Google Sheets API belum diatur. Menggunakan data lokal/initial.");
      return;
    }
    setLoading(true);
    try {
      // Fetch Kendaraan
      const resVehicles = await fetch(`${GOOGLE_SHEETS_API}?action=getVehicles`);
      const dataVehicles = await resVehicles.json();
      if (Array.isArray(dataVehicles) && dataVehicles.length > 0) {
        setVehicles(dataVehicles);
      }

      // Fetch Transaksi
      const resTx = await fetch(`${GOOGLE_SHEETS_API}?action=getTransactions`);
      const dataTx = await resTx.json();
      if (Array.isArray(dataTx) && dataTx.length > 0) {
        dataTx.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setTransactions(dataTx);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari Google Sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // States Modal Kendaraan
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ plat: '', jenis: 'Mobil', merk: '', pengemudi: '', status: 'Aktif' });

  // States Modal Transaksi
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txForm, setTxForm] = useState({ tanggal: new Date().toISOString().split('T')[0], kendaraanId: '', tipe: 'setoran', jumlah: '', keterangan: '' });

  // Filter & Search
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('semua');
  const [txVehicleFilter, setTxVehicleFilter] = useState('semua');

  // Filter Laporan
  const [reportStartDate, setReportStartDate] = useState('2026-10-01');
  const [reportEndDate, setReportEndDate] = useState('2026-10-31');
  const [reportVehicle, setReportVehicle] = useState('semua');

  // Modal Confirm Hapus
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null });

  // ----------------------------------------------------
  // HANDLERS CRUD KENDARAAN (DENGAN RECOVERY LOCAL STATE)
  // ----------------------------------------------------
  const handleOpenVehicleModal = (veh = null) => {
    if (veh) {
      setEditingVehicle(veh);
      setVehicleForm({ plat: veh.plat, jenis: veh.jenis, merk: veh.merk, pengemudi: veh.pengemudi, status: veh.status });
    } else {
      setEditingVehicle(null);
      setVehicleForm({ plat: '', jenis: 'Mobil', merk: '', pengemudi: '', status: 'Aktif' });
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();

    const vehId = editingVehicle ? editingVehicle.id : 'v_' + Date.now();
    const isEdit = !!editingVehicle;

    if (isEdit) {
      // Update di state lokal langsung
      setVehicles(vehicles.map(v => v.id === vehId ? { ...v, ...vehicleForm } : v));
    } else {
      // Tambah baru di state lokal langsung
      const newVeh = {
        id: vehId,
        ...vehicleForm
      };
      setVehicles([newVeh, ...vehicles]);
    }

    setIsVehicleModalOpen(false);

    // Kirim ke Google Sheets jika API URL sudah diisi
    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      const payload = {
        action: isEdit ? 'updateVehicle' : 'addVehicle',
        id: vehId,
        ...vehicleForm
      };

      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Gagal mengirim kendaraan ke Google Sheets API:", err);
      }
    }
  };

  const handleDeleteVehicle = async (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    setTransactions(transactions.filter(t => t.kendaraanId !== id));
    setDeleteConfirm({ show: false, type: '', id: null });

    // Kirim hapus ke Google Sheets API
    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteVehicle', id: id }),
        });
      } catch (err) {
        console.error("Gagal menghapus kendaraan di Google Sheets:", err);
      }
    }
  };

  // ----------------------------------------------------
  // HANDLERS CRUD TRANSAKSI (DENGAN RECOVERY LOCAL STATE)
  // ----------------------------------------------------
  const handleOpenTxModal = (tx = null) => {
    if (tx) {
      setEditingTx(tx);
      setTxForm({ 
        tanggal: tx.tanggal, 
        kendaraanId: tx.kendaraanId, 
        tipe: tx.tipe, 
        jumlah: tx.jumlah, 
        keterangan: tx.keterangan 
      });
    } else {
      setEditingTx(null);
      setTxForm({ 
        tanggal: new Date().toISOString().split('T')[0], 
        kendaraanId: vehicles[0]?.id || '', 
        tipe: 'setoran', 
        jumlah: '', 
        keterangan: '' 
      });
    }
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (e) => {
    e.preventDefault();

    const txId = editingTx ? editingTx.id : 't_' + Date.now();
    const isEdit = !!editingTx;

    const formattedTx = {
      ...txForm,
      jumlah: Number(txForm.jumlah)
    };

    if (isEdit) {
      // Update di state lokal langsung
      setTransactions(transactions.map(t => t.id === txId ? { ...t, ...formattedTx } : t));
    } else {
      // Tambah baru di state lokal langsung
      const newTx = {
        id: txId,
        ...formattedTx
      };
      setTransactions([newTx, ...transactions]);
    }

    setIsTxModalOpen(false);

    // Kirim ke Google Sheets jika API URL sudah diisi
    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      const payload = {
        action: isEdit ? 'updateTransaction' : 'addTransaction',
        id: txId,
        ...formattedTx
      };

      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Gagal mengirim transaksi ke Google Sheets API:", err);
      }
    }
  };

  const handleDeleteTx = async (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setDeleteConfirm({ show: false, type: '', id: null });

    // Kirim hapus ke Google Sheets API
    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteTransaction', id: id }),
        });
      } catch (err) {
        console.error("Gagal menghapus transaksi di Google Sheets:", err);
      }
    }
  };

  // ----------------------------------------------------
  // KALKULASI & GRAFIK
  // ----------------------------------------------------
  const totalPemasukan = useMemo(() => {
    return transactions.filter(t => t.tipe === 'setoran').reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  }, [transactions]);

  const totalPengeluaran = useMemo(() => {
    return transactions.filter(t => t.tipe === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  }, [transactions]);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const veh = vehicles.find(v => v.id === t.kendaraanId);
      const searchMatch = (veh?.plat || '').toLowerCase().includes(txSearch.toLowerCase()) || 
                          (t.keterangan || '').toLowerCase().includes(txSearch.toLowerCase());
      const typeMatch = txTypeFilter === 'semua' || t.tipe === txTypeFilter;
      const vehicleMatch = txVehicleFilter === 'semua' || t.kendaraanId === txVehicleFilter;
      return searchMatch && typeMatch && vehicleMatch;
    });
  }, [transactions, vehicles, txSearch, txTypeFilter, txVehicleFilter]);

  const reportTransactions = useMemo(() => {
    return transactions.filter(t => {
      const dateMatch = t.tanggal >= reportStartDate && t.tanggal <= reportEndDate;
      const vehMatch = reportVehicle === 'semua' || t.kendaraanId === reportVehicle;
      return dateMatch && vehMatch;
    });
  }, [transactions, reportStartDate, reportEndDate, reportVehicle]);

  const chartMonthlyData = useMemo(() => {
    const map = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    transactions.forEach(t => {
      if (!t.tanggal) return;
      const [year, month] = t.tanggal.split('-');
      const key = `${year}-${month}`;
      const label = `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`;

      if (!map[key]) {
        map[key] = { key, bulan: label, Pemasukan: 0, Pengeluaran: 0 };
      }
      if (t.tipe === 'setoran') map[key].Pemasukan += Number(t.jumlah);
      if (t.tipe === 'pengeluaran') map[key].Pengeluaran += Number(t.jumlah);
    });

    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  const chartVehicleData = useMemo(() => {
    return vehicles.map(v => {
      const vehTxs = transactions.filter(t => t.kendaraanId === v.id);
      const masuk = vehTxs.filter(t => t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0);
      const keluar = vehTxs.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0);
      return {
        plat: v.plat.split(' ')[1] || v.plat,
        Pemasukan: masuk,
        Pengeluaran: keluar,
        Net: masuk - keluar
      };
    });
  }, [vehicles, transactions]);

  // Cetak Laporan PDF
  const exportPDF = () => {
    const reportMasuk = reportTransactions.filter(t => t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0);
    const reportKeluar = reportTransactions.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0);
    const reportProfit = reportMasuk - reportKeluar;
    const targetVeh = vehicles.find(v => v.id === reportVehicle);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Rekap Setoran Kendaraan</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 13px; color: #64748b; margin: 2px 0; }
            .box-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; display: flex; justify-content: space-between; }
            .sum-item { flex: 1; }
            .sum-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .sum-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #2563eb; color: #fff; font-size: 11px; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .text-emerald { color: #16a34a; font-weight: bold; }
            .text-rose { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Laporan Rekap Setoran & Pengeluaran</h1>
          <p>Periode: ${reportStartDate} s/d ${reportEndDate}</p>
          <p>Kendaraan: ${targetVeh ? `${targetVeh.plat} (${targetVeh.merk})` : 'Semua Kendaraan'}</p>

          <div class="box-summary">
            <div class="sum-item">
              <div class="sum-title">Total Pemasukan</div>
              <div class="sum-val text-emerald">${formatRupiah(reportMasuk)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Total Pengeluaran</div>
              <div class="sum-val text-rose">${formatRupiah(reportKeluar)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Profit Bersih</div>
              <div class="sum-val">${formatRupiah(reportProfit)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kendaraan</th>
                <th>Tipe</th>
                <th>Keterangan</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${reportTransactions.map(t => {
                const veh = vehicles.find(v => v.id === t.kendaraanId);
                return `
                  <tr>
                    <td>${t.tanggal}</td>
                    <td>${veh ? `${veh.plat}` : '-'}</td>
                    <td>${t.tipe === 'setoran' ? 'Setoran' : 'Pengeluaran'}</td>
                    <td>${t.keterangan || '-'}</td>
                    <td class="text-right ${t.tipe === 'setoran' ? 'text-emerald' : 'text-rose'}">
                      ${t.tipe === 'setoran' ? '+' : '-'}${formatRupiah(t.jumlah)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex justify-center sm:py-6">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:h-[844px] sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-slate-900 text-white pt-10 pb-5 px-5 rounded-b-3xl shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30">
                <Car size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">Setoran Mobil</h1>
                <p className="text-[11px] text-slate-400 mt-1">Data Tersimpan Secara Lokal</p>
              </div>
            </div>

            <button 
              onClick={() => handleOpenTxModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 space-y-5">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-5 rounded-3xl shadow-xl shadow-blue-500/20 space-y-3">
                <div className="flex justify-between items-center text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <span>Saldo Bersih / Profit</span>
                  <Wallet size={18} />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {formatRupiah(saldoBersih)}
                  </h2>
                  <p className="text-xs text-blue-200 mt-1">
                    Total Selisih Pemasukan & Pengeluaran
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-xs font-bold uppercase tracking-wider">Pemasukan</span>
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-slate-800">{formatRupiah(totalPemasukan)}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Setoran Armada</p>
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-rose-100 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran</span>
                    <div className="p-1.5 bg-rose-100 rounded-lg">
                      <ArrowDownRight size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-slate-800">{formatRupiah(totalPengeluaran)}</p>
                    <p className="text-[10px] text-rose-600 font-medium">Biaya & Perbaikan</p>
                  </div>
                </div>
              </div>

              {/* Grafik Tren */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Tren Arus Kas Bulanan</h3>
                  <p className="text-[10px] text-slate-400">Total Pemasukan vs Pengeluaran per Bulan</p>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="bulan" tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip formatter={(value) => formatRupiah(value)} />
                      <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fillOpacity={1} fill="url(#colorMasuk)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" fillOpacity={1} fill="url(#colorKeluar)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grafik Per Kendaraan */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Performa Per Kendaraan</h3>
                  <p className="text-[10px] text-slate-400">Pemasukan vs Pengeluaran Unit</p>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartVehicleData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="plat" tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip formatter={(value) => formatRupiah(value)} />
                      <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transaksi Terbaru */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">Transaksi Terbaru</h3>
                  <button onClick={() => setActiveTab('transaksi')} className="text-xs font-semibold text-blue-600">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 4).map((t) => {
                    const veh = vehicles.find(v => v.id === t.kendaraanId);
                    return (
                      <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${t.tipe === 'setoran' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {t.tipe === 'setoran' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{veh?.plat || 'N/A'}</p>
                            <p className="text-[11px] text-slate-400">{t.keterangan || t.tanggal}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-xs ${t.tipe === 'setoran' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipe === 'setoran' ? '+' : '-'}{formatRupiah(t.jumlah)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TRANSAKSI TAB */}
          {activeTab === 'transaksi' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Riwayat Transaksi</h2>
                <button 
                  onClick={() => handleOpenTxModal()}
                  className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20"
                >
                  <Plus size={14} /> Transaksi
                </button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari plat nomor atau keterangan..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700"
                  >
                    <option value="semua">Semua Tipe</option>
                    <option value="setoran">Setoran (Masuk)</option>
                    <option value="pengeluaran">Pengeluaran (Keluar)</option>
                  </select>

                  <select 
                    value={txVehicleFilter}
                    onChange={(e) => setTxVehicleFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700"
                  >
                    <option value="semua">Semua Armada</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredTransactions.map((t) => {
                  const veh = vehicles.find(v => v.id === t.kendaraanId);
                  return (
                    <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{veh?.plat}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              t.tipe === 'setoran' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {t.tipe}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{t.keterangan || '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-xs block ${t.tipe === 'setoran' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.tipe === 'setoran' ? '+' : '-'}{formatRupiah(t.jumlah)}
                          </span>
                          <span className="text-[10px] text-slate-400">{t.tanggal}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 text-xs">
                        <button onClick={() => handleOpenTxModal(t)} className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium text-[11px]">
                          <Edit3 size={12} /> Edit
                        </button>
                        <button onClick={() => setDeleteConfirm({ show: true, type: 'tx', id: t.id })} className="text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium text-[11px]">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KENDARAAN TAB */}
          {activeTab === 'kendaraan' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Daftar Kendaraan</h2>
                <button 
                  onClick={() => handleOpenVehicleModal()}
                  className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20"
                >
                  <Plus size={14} /> Kendaraan
                </button>
              </div>

              <div className="space-y-3">
                {vehicles.map((v) => {
                  const countTx = transactions.filter(t => t.kendaraanId === v.id).length;
                  const totalMasuk = transactions.filter(t => t.kendaraanId === v.id && t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0);

                  return (
                    <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Car size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">{v.plat}</h3>
                            <p className="text-[11px] text-slate-400">{v.jenis} • {v.merk}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {v.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Pengemudi:</span>
                          <span className="font-medium text-slate-700">{v.pengemudi || '-'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Total Transaksi:</span>
                          <span className="font-medium text-slate-700">{countTx} transaksi</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Total Pemasukan:</span>
                          <span className="font-bold text-emerald-600">{formatRupiah(totalMasuk)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleOpenVehicleModal(v)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-medium text-xs flex items-center justify-center gap-1">
                          <Edit3 size={13} /> Edit
                        </button>
                        <button onClick={() => setDeleteConfirm({ show: true, type: 'vehicle', id: v.id })} className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-medium text-xs flex items-center justify-center gap-1">
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LAPORAN TAB */}
          {activeTab === 'laporan' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Rekap & Laporan</h2>
                <button onClick={exportPDF} className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md">
                  <Download size={14} /> Cetak PDF
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Filter Periode</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Dari Tanggal</label>
                      <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Sampai Tanggal</label>
                      <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Pilih Kendaraan</label>
                    <select value={reportVehicle} onChange={(e) => setReportVehicle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                      <option value="semua">Semua Kendaraan</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plat} - {v.merk}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-xs text-slate-800">Preview Data</h3>
                  <span className="text-[10px] text-slate-400">{reportTransactions.length} item</span>
                </div>

                <div className="space-y-2">
                  {reportTransactions.map((t) => {
                    const veh = vehicles.find(v => v.id === t.kendaraanId);
                    return (
                      <div key={t.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-800 block">{veh?.plat}</span>
                          <span className="text-[10px] text-slate-400">{t.tanggal} • {t.keterangan || '-'}</span>
                        </div>
                        <span className={`font-bold ${t.tipe === 'setoran' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipe === 'setoran' ? '+' : '-'}{formatRupiah(t.jumlah)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-around items-center z-40 rounded-b-[32px]">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px]">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('transaksi')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${activeTab === 'transaksi' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <Receipt size={20} />
            <span className="text-[10px]">Transaksi</span>
          </button>
          <button onClick={() => setActiveTab('kendaraan')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${activeTab === 'kendaraan' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <Car size={20} />
            <span className="text-[10px]">Armada</span>
          </button>
          <button onClick={() => setActiveTab('laporan')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${activeTab === 'laporan' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <FileText size={20} />
            <span className="text-[10px]">Laporan</span>
          </button>
        </nav>

        {/* MODAL KENDARAAN */}
        {isVehicleModalOpen && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">{editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</h3>
                <button onClick={() => setIsVehicleModalOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveVehicle} className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plat Nomor</label>
                  <input type="text" placeholder="B 1234 CD" required value={vehicleForm.plat} onChange={(e) => setVehicleForm({ ...vehicleForm, plat: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis</label>
                    <select value={vehicleForm.jenis} onChange={(e) => setVehicleForm({ ...vehicleForm, jenis: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                      <option value="Engkel">Engkel</option>
                      <option value="Travel">Travel</option>
                      <option value="Truk">Truk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                    <select value={vehicleForm.status} onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                      <option value="Aktif">Aktif</option>
                      <option value="Perbaikan">Perbaikan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Merk / Tipe</label>
                  <input type="text" placeholder="Toyota Avanza" required value={vehicleForm.merk} onChange={(e) => setVehicleForm({ ...vehicleForm, merk: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pengemudi</label>
                  <input type="text" placeholder="Nama Driver" value={vehicleForm.pengemudi} onChange={(e) => setVehicleForm({ ...vehicleForm, pengemudi: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="pt-2 flex gap-2">
                  <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TRANSAKSI */}
        {isTxModalOpen && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">{editingTx ? 'Edit Transaksi' : 'Input Transaksi Baru'}</h3>
                <button onClick={() => setIsTxModalOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveTx} className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setTxForm({ ...txForm, tipe: 'setoran' })} className={`py-1.5 rounded-xl border text-xs font-semibold ${txForm.tipe === 'setoran' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-500'}`}>Setoran (Masuk)</button>
                    <button type="button" onClick={() => setTxForm({ ...txForm, tipe: 'pengeluaran' })} className={`py-1.5 rounded-xl border text-xs font-semibold ${txForm.tipe === 'pengeluaran' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'border-slate-200 text-slate-500'}`}>Pengeluaran</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Kendaraan</label>
                  <select value={txForm.kendaraanId} onChange={(e) => setTxForm({ ...txForm, kendaraanId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" required>
                    <option value="">-- Pilih Armada --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plat} - {v.merk}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal</label>
                    <input type="date" required value={txForm.tanggal} onChange={(e) => setTxForm({ ...txForm, tanggal: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jumlah (Rp)</label>
                    <input type="number" placeholder="0" required value={txForm.jumlah} onChange={(e) => setTxForm({ ...txForm, jumlah: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Keterangan</label>
                  <input type="text" placeholder="Contoh: Setoran harian / Servis" value={txForm.keterangan} onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div className="pt-2 flex gap-2">
                  <button type="button" onClick={() => setIsTxModalOpen(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS */}
        {deleteConfirm.show && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl p-5 text-center space-y-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Hapus</h3>
                <p className="text-[11px] text-slate-400 mt-1">Yakin ingin menghapus data ini?</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setDeleteConfirm({ show: false, type: '', id: null })} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Batal</button>
                <button onClick={() => deleteConfirm.type === 'vehicle' ? handleDeleteVehicle(deleteConfirm.id) : handleDeleteTx(deleteConfirm.id)} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-md">Hapus</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}