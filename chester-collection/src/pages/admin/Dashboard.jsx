import { useState } from "react";
import { DollarSign, ShoppingBag, Globe, Eye, ChevronDown } from "lucide-react";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Dashboard() {
  // State untuk Logika Filter Bertingkat
  const [filterType, setFilterType] = useState("7hari");
  const [selectedMonth, setSelectedMonth] = useState("5"); // Default bulan 5 (Mei)
  const [selectedYear, setSelectedYear] = useState("2026"); // Default tahun saat ini

  // Data Tahun (3 tahun ke belakang dari 2026)
  const years = ["2026", "2025", "2024"];

  // Data Bulan
  const months = [
    { val: "1", name: "Januari" },
    { val: "2", name: "Februari" },
    { val: "3", name: "Maret" },
    { val: "4", name: "April" },
    { val: "5", name: "Mei" },
    { val: "6", name: "Juni" },
    { val: "7", name: "Juli" },
    { val: "8", name: "Agustus" },
    { val: "9", name: "September" },
    { val: "10", name: "Oktober" },
    { val: "11", name: "November" },
    { val: "12", name: "Desember" },
  ];

  // Simulasi Perubahan Data Berdasarkan Filter
  const getStats = () => {
    if (filterType === "hariIni")
      return { rev: 1250000, vis: "450", views: "1.200", orders: "4" };
    if (filterType === "kemarin")
      return { rev: 2100000, vis: "620", views: "1.850", orders: "7" };
    if (filterType === "7hari")
      return { rev: 14500000, vis: "3.120", views: "12.050", orders: "32" };
    if (filterType === "bulan")
      return { rev: 45000000, vis: "12.450", views: "45.200", orders: "142" };
    if (filterType === "tahun")
      return {
        rev: 284500000,
        vis: "145.200",
        views: "520.400",
        orders: "1.842",
      };
    return { rev: 0, vis: "0", views: "0", orders: "0" };
  };

  const currentStats = getStats();

  const statsList = [
    {
      title: "Total Pendapatan",
      value: formatRupiah(currentStats.rev),
      icon: <DollarSign size={24} />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Pengunjung Web",
      value: currentStats.vis,
      icon: <Globe size={24} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Produk Dilihat",
      value: currentStats.views,
      icon: <Eye size={24} />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Pembelian",
      value: currentStats.orders,
      icon: <ShoppingBag size={24} />,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  // Simulasi Perubahan Grafik Berdasarkan Filter
  const getChartData = () => {
    if (filterType === "hariIni" || filterType === "kemarin")
      return [
        { label: "08:00", h: "20%" },
        { label: "12:00", h: "60%" },
        { label: "16:00", h: "90%" },
        { label: "20:00", h: "40%" },
      ];
    if (filterType === "7hari")
      return [
        { label: "Sen", h: "40%" },
        { label: "Sel", h: "70%" },
        { label: "Rab", h: "45%" },
        { label: "Kam", h: "90%" },
        { label: "Jum", h: "65%" },
        { label: "Sab", h: "80%" },
        { label: "Min", h: "50%" },
      ];
    if (filterType === "tahun")
      return [
        { label: "Jan", h: "30%" },
        { label: "Feb", h: "40%" },
        { label: "Mar", h: "35%" },
        { label: "Apr", h: "60%" },
        { label: "Mei", h: "85%" },
        { label: "Jun", h: "70%" },
        { label: "Jul", h: "90%" },
        { label: "Ags", h: "65%" },
        { label: "Sep", h: "75%" },
        { label: "Okt", h: "80%" },
        { label: "Nov", h: "95%" },
        { label: "Des", h: "100%" },
      ];
    // Default: Bulan
    return [
      { label: "Minggu 1", h: "50%" },
      { label: "Minggu 2", h: "75%" },
      { label: "Minggu 3", h: "60%" },
      { label: "Minggu 4", h: "90%" },
    ];
  };

  const chartData = getChartData();

  const recentOrders = [
    {
      id: "#ORD-001",
      customer: "Budi Santoso",
      date: "30 Mei 2026",
      total: 499000,
      status: "Selesai",
    },
    {
      id: "#ORD-002",
      customer: "Siti Aminah",
      date: "30 Mei 2026",
      total: 250000,
      status: "Diproses",
    },
    {
      id: "#ORD-003",
      customer: "Andi Wijaya",
      date: "29 Mei 2026",
      total: 1150000,
      status: "Dikirim",
    },
    {
      id: "#ORD-004",
      customer: "Rina Melati",
      date: "29 Mei 2026",
      total: 325000,
      status: "Menunggu Pembayaran",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "bg-green-100 text-green-700";
      case "Diproses":
        return "bg-blue-100 text-blue-700";
      case "Dikirim":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Fungsi Helper untuk render Judul Grafik
  const renderChartTitle = () => {
    if (filterType === "hariIni") return "Grafik Penjualan Hari Ini";
    if (filterType === "kemarin") return "Grafik Penjualan Kemarin";
    if (filterType === "7hari") return "Grafik Penjualan 7 Hari Terakhir";
    if (filterType === "bulan")
      return `Grafik Penjualan Bulan ${months.find((m) => m.val === selectedMonth)?.name} ${selectedYear}`;
    if (filterType === "tahun") return `Grafik Penjualan Tahun ${selectedYear}`;
  };

  return (
    <div>
      {/* Header Halaman & Filter Kelas Marketplace */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-chester-text">
          Dashboard Overview
        </h1>

        {/* Kontrol Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Dropdown 1: Tipe Waktu */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-chester-text px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:border-chester-pink cursor-pointer shadow-sm"
            >
              <option value="hariIni">Hari Ini</option>
              <option value="kemarin">Kemarin</option>
              <option value="7hari">7 Hari Terakhir</option>
              <option value="bulan">Bulanan</option>
              <option value="tahun">Tahunan</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Dropdown 2: Pilih Bulan (Hanya muncul jika filterType === 'bulan') */}
          {filterType === "bulan" && (
            <div className="relative animate-fade-in">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-chester-text px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:border-chester-pink cursor-pointer shadow-sm"
              >
                {months.map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          )}

          {/* Dropdown 3: Pilih Tahun (Muncul jika filterType === 'bulan' ATAU 'tahun') */}
          {(filterType === "bulan" || filterType === "tahun") && (
            <div className="relative animate-fade-in">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-chester-text px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:border-chester-pink cursor-pointer shadow-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Kartu Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsList.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300"
          >
            <div className={`p-4 rounded-full ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                {stat.title}
              </p>
              <p className="text-xl font-bold text-chester-text transition-all">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* GRAFIK PENJUALAN */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-chester-text mb-6">
            {renderChartTitle()}
          </h2>

          <div className="h-64 flex items-end justify-between gap-2 border-b border-gray-100 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
              <div className="border-t border-gray-100 w-full opacity-50"></div>
              <div className="border-t border-gray-100 w-full opacity-50"></div>
              <div className="border-t border-gray-100 w-full opacity-50"></div>
              <div className="border-t border-gray-100 w-full opacity-50"></div>
            </div>

            {chartData.map((data, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-1 z-10 group"
              >
                <div
                  className="w-full max-w-[40px] bg-chester-pink/80 hover:bg-chester-pink transition-all duration-500 rounded-t-sm cursor-pointer relative"
                  style={{ height: data.h }}
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.h}
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-3 font-medium">
                  {data.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Pesanan Terbaru */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-chester-text">
              Pesanan Terbaru
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {recentOrders.map((order, index) => (
              <div
                key={index}
                className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition flex justify-between items-center gap-2"
              >
                <div>
                  <p className="font-bold text-sm text-chester-text">
                    {order.id}
                  </p>
                  <p className="text-xs text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-chester-text">
                    {formatRupiah(order.total)}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
