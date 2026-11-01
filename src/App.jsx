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

// Helper Rupiah Format
const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

// Helper ekstraksi string YYYY-MM-DD yang presisi dan aman dari geseran jam/UTC
const parseToStandardDateStr = (dateVal) => {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  
  if (str.includes('T') || str.includes('Z')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    }
  }
  return str.split('T')[0].split(' ')[0];
};

// Helper Format Tanggal Tampilan (Hanya TGL-BLN-THN / DD/MM/YYYY)
const formatDateOnly = (dateVal) => {
  if (!dateVal) return '-';
  
  try {
    const cleanStr = parseToStandardDateStr(dateVal);

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const parts = cleanStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanStr)) {
      const parts = cleanStr.split('/');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(cleanStr)) {
      return cleanStr.replace(/-/g, '/');
    }

    return cleanStr;
  } catch (err) {
    return String(dateVal);
  }
};

// Google Apps Script API URL Endpoint
const GOOGLE_SHEETS_API = "https://script.google.com/macros/s/AKfycbzgBpPSep42amMizH8w84U1cQ0X4XX0ANuFJko6VcMVuSm2544_VtrDaX_klQMuYgU8Fg/exec";

// Component Skeleton Loader
const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="bg-slate-200 h-28 rounded-3xl w-full"></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-200 h-20 rounded-2xl w-full"></div>
      <div className="bg-slate-200 h-20 rounded-2xl w-full"></div>
    </div>
    <div className="bg-slate-200 h-44 rounded-2xl w-full"></div>
    <div className="space-y-2">
      <div className="bg-slate-200 h-14 rounded-2xl w-full"></div>
      <div className="bg-slate-200 h-14 rounded-2xl w-full"></div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Remote Data
  const fetchData = async () => {
    setLoading(true);
    if (!GOOGLE_SHEETS_API || GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      setLoading(false);
      return;
    }
    try {
      const resVehicles = await fetch(`${GOOGLE_SHEETS_API}?action=getVehicles`);
      const dataVehicles = await resVehicles.json();
      if (Array.isArray(dataVehicles)) {
        setVehicles(dataVehicles);
      }

      const resTx = await fetch(`${GOOGLE_SHEETS_API}?action=getTransactions`);
      const dataTx = await resTx.json();
      if (Array.isArray(dataTx)) {
        const cleanedTx = dataTx.map(t => ({
          ...t,
          tanggal: parseToStandardDateStr(t.tanggal)
        }));
        cleanedTx.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
        setTransactions(cleanedTx);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari Google Sheets API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modals State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ plat: '', jenis: 'Mobil', merk: '', pengemudi: '', status: 'Aktif' });

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txForm, setTxForm] = useState({ tanggal: new Date().toISOString().split('T')[0], kendaraanId: '', tipe: 'setoran', jumlah: '', keterangan: '' });

  // Search & Filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('semua');
  const [txVehicleFilter, setTxVehicleFilter] = useState('semua');

  // Reports Filter
  const [reportStartDate, setReportStartDate] = useState('2026-10-01');
  const [reportEndDate, setReportEndDate] = useState('2026-10-31');
  const [reportVehicle, setReportVehicle] = useState('semua');

  // Confirm Delete Modal
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null });

  // CRUD Vehicle Handlers
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
      setVehicles(vehicles.map(v => v.id === vehId ? { ...v, ...vehicleForm } : v));
    } else {
      setVehicles([{ id: vehId, ...vehicleForm }, ...vehicles]);
    }
    setIsVehicleModalOpen(false);

    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: isEdit ? 'updateVehicle' : 'addVehicle', id: vehId, ...vehicleForm }),
        });
      } catch (err) {
        console.error("Gagal sync ke Google Sheets:", err);
      }
    }
  };

  const handleDeleteVehicle = async (id) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    setTransactions(transactions.filter(t => t.kendaraanId !== id));
    setDeleteConfirm({ show: false, type: '', id: null });

    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteVehicle', id }),
        });
      } catch (err) {
        console.error("Gagal hapus di Google Sheets:", err);
      }
    }
  };

  // CRUD Transaction Handlers
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
    const formattedTx = { ...txForm, jumlah: Number(txForm.jumlah) };

    if (isEdit) {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, ...formattedTx } : t));
    } else {
      setTransactions([{ id: txId, ...formattedTx }, ...transactions]);
    }
    setIsTxModalOpen(false);

    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: isEdit ? 'updateTransaction' : 'addTransaction', id: txId, ...formattedTx }),
        });
      } catch (err) {
        console.error("Gagal sync transaksi:", err);
      }
    }
  };

  const handleDeleteTx = async (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setDeleteConfirm({ show: false, type: '', id: null });

    if (GOOGLE_SHEETS_API && !GOOGLE_SHEETS_API.includes("YOUR_SCRIPT_ID_HERE")) {
      try {
        await fetch(GOOGLE_SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteTransaction', id }),
        });
      } catch (err) {
        console.error("Gagal hapus transaksi:", err);
      }
    }
  };

  // Computations
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

  const vehicleSummaryList = useMemo(() => {
    const filteredVehicles = reportVehicle === 'semua' 
      ? vehicles 
      : vehicles.filter(v => v.id === reportVehicle);

    return filteredVehicles.map(v => {
      const vTxs = reportTransactions.filter(t => t.kendaraanId === v.id);
      const totalPemasukan = vTxs.filter(t => t.tipe === 'setoran').reduce((acc, curr) => acc + Number(curr.jumlah), 0);
      const totalPengeluaran = vTxs.filter(t => t.tipe === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.jumlah), 0);
      const profit = totalPemasukan - totalPengeluaran;
      const jumlahTransaksi = vTxs.length;

      return {
        ...v,
        totalPemasukan,
        totalPengeluaran,
        profit,
        jumlahTransaksi
      };
    });
  }, [vehicles, reportTransactions, reportVehicle]);

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
          <title>Laporan Rekap Pemasukan & Pengeluaran Per Kendaraan</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 13px; color: #64748b; margin: 2px 0; }
            .box-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; display: flex; justify-content: space-between; }
            .sum-item { flex: 1; }
            .sum-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .sum-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th { background-color: #0f172a; color: #fff; font-size: 11px; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .text-emerald { color: #16a34a; font-weight: bold; }
            .text-rose { color: #dc2626; font-weight: bold; }
            .text-blue { color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Laporan Rekapitulasi Per Kendaraan</h1>
          <p>Periode: ${formatDateOnly(reportStartDate)} s/d ${formatDateOnly(reportEndDate)}</p>
          <p>Filter: ${targetVeh ? `${targetVeh.plat} (${targetVeh.merk})` : 'Semua Armada'}</p>

          <div class="box-summary">
            <div class="sum-item">
              <div class="sum-title">Total Pemasukan Armada</div>
              <div class="sum-val text-emerald">${formatRupiah(reportMasuk)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Total Pengeluaran Armada</div>
              <div class="sum-val text-rose">${formatRupiah(reportKeluar)}</div>
            </div>
            <div class="sum-item">
              <div class="sum-title">Total Profit Bersih</div>
              <div class="sum-val text-blue">${formatRupiah(reportProfit)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Plat Nomor</th>
                <th>Merk & Jenis</th>
                <th>Pengemudi</th>
                <th class="text-right">Total Setoran (Masuk)</th>
                <th class="text-right">Total Biaya (Keluar)</th>
                <th class="text-right">Profit Bersih</th>
              </tr>
            </thead>
            <tbody>
              ${vehicleSummaryList.map(v => `
                <tr>
                  <td><b>${v.plat}</b></td>
                  <td>${v.merk} (${v.jenis})</td>
                  <td>${v.pengemudi || '-'}</td>
                  <td class="text-right text-emerald">${formatRupiah(v.totalPemasukan)}</td>
                  <td class="text-right text-rose">${formatRupiah(v.totalPengeluaran)}</td>
                  <td class="text-right ${v.profit >= 0 ? 'text-emerald' : 'text-rose'}">
                    ${formatRupiah(v.profit)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          <\/script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-800 flex justify-center sm:py-6">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:h-[844px] sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-slate-900 text-white pt-10 pb-5 px-5 rounded-b-3xl shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-500/30 flex items-center justify-center">
                <Car size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">Setoran Mobil</h1>
                <p className="text-[11px] text-slate-400 mt-1">
                  {loading ? "Menyinkronkan data..." : "Manajemen Keuangan Armada"}
                </p>
              </div>
            </div>

            <button 
              onClick={() => handleOpenTxModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg shadow-blue-600/30 transition active:scale-95 flex items-center justify-center"
              title="Tambah Transaksi Baru"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 space-y-5">
          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
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
                        <div className="p-1.5 bg-emerald-100 rounded-lg flex items-center justify-center">
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
                        <div className="p-1.5 bg-rose-100 rounded-lg flex items-center justify-center">
                          <ArrowDownRight size={16} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-lg font-bold text-slate-800">{formatRupiah(totalPengeluaran)}</p>
                        <p className="text-[10px] text-rose-600 font-medium">Biaya & Perbaikan</p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trend Chart */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Tren Arus Kas Bulanan</h3>
                      <p className="text-[10px] text-slate-400">Total Pemasukan vs Pengeluaran per Bulan</p>
                    </div>
                    <div className="h-44 w-full">
                      {chartMonthlyData.length > 0 ? (
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
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data grafik</div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Comparison Chart */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Performa Per Kendaraan</h3>
                      <p className="text-[10px] text-slate-400">Pemasukan vs Pengeluaran Unit</p>
                    </div>
                    <div className="h-44 w-full">
                      {chartVehicleData.length > 0 ? (
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
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data unit</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-800">Transaksi Terbaru</h3>
                      <button onClick={() => setActiveTab('transaksi')} className="text-xs font-semibold text-blue-600 hover:underline">
                        Lihat Semua
                      </button>
                    </div>

                    <div className="space-y-2">
                      {transactions.length > 0 ? transactions.slice(0, 4).map((t) => {
                        const veh = vehicles.find(v => v.id === t.kendaraanId);
                        return (
                          <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl flex items-center justify-center ${t.tipe === 'setoran' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {t.tipe === 'setoran' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-800">{veh?.plat || 'N/A'}</p>
                                <p className="text-[11px] text-slate-400">{t.keterangan || formatDateOnly(t.tanggal)}</p>
                              </div>
                            </div>
                            <span className={`font-bold text-xs ${t.tipe === 'setoran' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.tipe === 'setoran' ? '+' : '-'}{formatRupiah(t.jumlah)}
                            </span>
                          </div>
                        );
                      }) : (
                        <div className="p-4 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
                          Belum ada transaksi recorded
                        </div>
                      )}
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
                      className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 transition"
                    >
                      <Plus size={14} /> Transaksi
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search size={16} />
                      </div>
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
                    {filteredTransactions.length > 0 ? filteredTransactions.map((t) => {
                      const veh = vehicles.find(v => v.id === t.kendaraanId);
                      return (
                        <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{veh?.plat || 'Unit Dihapus'}</span>
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
                              <span className="text-[10px] text-slate-400">{formatDateOnly(t.tanggal)}</span>
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
                    }) : (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                        Tidak ada data transaksi yang ditemukan
                      </div>
                    )}
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
                      className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 transition"
                    >
                      <Plus size={14} /> Kendaraan
                    </button>
                  </div>

                  <div className="space-y-3">
                    {vehicles.length > 0 ? vehicles.map((v) => {
                      const countTx = transactions.filter(t => t.kendaraanId === v.id).length;
                      const totalMasuk = transactions.filter(t => t.kendaraanId === v.id && t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0);
                      const totalKeluar = transactions.filter(t => t.kendaraanId === v.id && t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0);

                      return (
                        <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                                <Car size={20} />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-slate-800">{v.plat}</h3>
                                <p className="text-xs text-slate-500">{v.merk} ({v.jenis})</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Pengemudi: <span className="text-slate-700 font-medium">{v.pengemudi || '-'}</span></p>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              v.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {v.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Setoran</span>
                              <span className="font-bold text-emerald-600">{formatRupiah(totalMasuk)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Biaya</span>
                              <span className="font-bold text-rose-600">{formatRupiah(totalKeluar)}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 text-xs">
                            <span className="text-[11px] text-slate-400">{countTx} Transaksi recorded</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenVehicleModal(v)} className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 rounded-lg transition flex items-center justify-center">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => setDeleteConfirm({ show: true, type: 'vehicle', id: v.id })} className="p-2 text-slate-600 hover:text-rose-600 bg-slate-100 rounded-lg transition flex items-center justify-center">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                        Belum ada kendaraan yang terdaftar
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LAPORAN TAB */}
              {activeTab === 'laporan' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Rekap Per Kendaraan</h2>
                    <button 
                      onClick={exportPDF}
                      className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition"
                    >
                      <Download size={14} /> Cetak Rekap PDF
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Filter Periode & Armada</h3>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dari Tanggal</label>
                          <input 
                            type="date" 
                            value={reportStartDate} 
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sampai Tanggal</label>
                          <input 
                            type="date" 
                            value={reportEndDate} 
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Filter Unit Kendaraan</label>
                        <select 
                          value={reportVehicle}
                          onChange={(e) => setReportVehicle(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                        >
                          <option value="semua">Semua Kendaraan</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.plat} - {v.merk}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Keuangan Periode Ini</span>
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400">Total Masuk</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {formatRupiah(reportTransactions.filter(t => t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Total Keluar</p>
                        <p className="text-xs font-bold text-rose-400 mt-0.5">
                          {formatRupiah(reportTransactions.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Profit Bersih</p>
                        <p className="text-xs font-bold text-blue-400 mt-0.5">
                          {formatRupiah(
                            reportTransactions.filter(t => t.tipe === 'setoran').reduce((a, b) => a + Number(b.jumlah), 0) -
                            reportTransactions.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Rincian Per Kendaraan ({vehicleSummaryList.length})</h3>
                    {vehicleSummaryList.length > 0 ? vehicleSummaryList.map(v => (
                      <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                              <Car size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-800">{v.plat}</h4>
                              <p className="text-xs text-slate-500">{v.merk} • {v.pengemudi || 'Tanpa Pengemudi'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">
                            {v.jumlahTransaksi} Transaksi
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Setoran</span>
                            <span className="font-bold text-emerald-600">{formatRupiah(v.totalPemasukan)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Pengeluaran</span>
                            <span className="font-bold text-rose-600">{formatRupiah(v.totalPengeluaran)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Profit</span>
                            <span className={`font-bold ${v.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                              {formatRupiah(v.profit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                        Tidak ada data rekap kendaraan untuk periode ini
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL KENDARAAN */}
        {isVehicleModalOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full rounded-3xl p-5 space-y-4 animate-fadeIn shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-slate-900">
                  {editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}
                </h3>
                <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plat Nomor</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="cth: B 1234 ABC"
                    value={vehicleForm.plat} 
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jenis</label>
                    <select 
                      value={vehicleForm.jenis} 
                      onChange={(e) => setVehicleForm({ ...vehicleForm, jenis: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="Mobil">Mobil</option>
                      <option value="Truk">Truk</option>
                      <option value="Motor">Motor</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Merk / Model</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="cth: Avanza"
                      value={vehicleForm.merk} 
                      onChange={(e) => setVehicleForm({ ...vehicleForm, merk: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Pengemudi</label>
                  <input 
                    type="text" 
                    placeholder="cth: Budi Santoso"
                    value={vehicleForm.pengemudi} 
                    onChange={(e) => setVehicleForm({ ...vehicleForm, pengemudi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select 
                    value={vehicleForm.status} 
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsVehicleModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 font-semibold rounded-xl text-slate-600"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 font-semibold rounded-xl text-white shadow-md shadow-blue-500/30"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TRANSAKSI */}
        {isTxModalOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full rounded-3xl p-5 space-y-4 animate-fadeIn shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-slate-900">
                  {editingTx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
                </h3>
                <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTx} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, tipe: 'setoran' })}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                        txForm.tipe === 'setoran' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <TrendingUp size={14} /> Setoran (Masuk)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, tipe: 'pengeluaran' })}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                        txForm.tipe === 'pengeluaran' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <TrendingDown size={14} /> Biaya (Keluar)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal</label>
                    <input 
                      type="date" 
                      required 
                      value={txForm.tanggal} 
                      onChange={(e) => setTxForm({ ...txForm, tanggal: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pilih Kendaraan</label>
                    <select 
                      required
                      value={txForm.kendaraanId} 
                      onChange={(e) => setTxForm({ ...txForm, kendaraanId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="0"
                    value={txForm.jumlah} 
                    onChange={(e) => setTxForm({ ...txForm, jumlah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Keterangan / Catatan</label>
                  <input 
                    type="text" 
                    placeholder="cth: Setoran harian, Ganti oli"
                    value={txForm.keterangan} 
                    onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsTxModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 font-semibold rounded-xl text-slate-600"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 font-semibold rounded-xl text-white shadow-md shadow-blue-500/30"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE MODAL */}
        {deleteConfirm.show && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-3xl p-5 text-center space-y-4 animate-fadeIn shadow-2xl">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'vehicle' ? 'kendaraan ini beserta riwayatnya' : 'transaksi ini'}?
                </p>
              </div>
              <div className="flex gap-2 pt-1 text-xs">
                <button 
                  onClick={() => setDeleteConfirm({ show: false, type: '', id: null })}
                  className="flex-1 py-2 bg-slate-100 font-semibold rounded-xl text-slate-600"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'vehicle') handleDeleteVehicle(deleteConfirm.id);
                    else handleDeleteTx(deleteConfirm.id);
                  }}
                  className="flex-1 py-2 bg-rose-600 font-semibold rounded-xl text-white shadow-md shadow-rose-500/30"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-around items-center rounded-b-[32px]">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('transaksi')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${activeTab === 'transaksi' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
          >
            <Receipt size={18} />
            <span className="text-[10px]">Transaksi</span>
          </button>

          <button 
            onClick={() => setActiveTab('kendaraan')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${activeTab === 'kendaraan' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
          >
            <Car size={18} />
            <span className="text-[10px]">Armada</span>
          </button>

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center gap-1 p-1.5 transition ${activeTab === 'laporan' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
          >
            <FileText size={18} />
            <span className="text-[10px]">Laporan</span>
          </button>
        </nav>

      </div>
    </div>
  );
}