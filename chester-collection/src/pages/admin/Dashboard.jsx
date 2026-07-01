import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Globe, Eye, ChevronDown } from "lucide-react";
import axios from "axios";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function Dashboard() {
  const [filterType, setFilterType] = useState("7hari");
  const [selectedMonth, setSelectedMonth] = useState("5");
  const [selectedYear, setSelectedYear] = useState("2026");

  const [liveOrders, setLiveOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [views, setViews] = useState(0);

  const [chartData, setChartData] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Membuat array tahun secara dinamis mulai dari tahun saat ini mundur 3 tahun
  const currentYear = new Date().getFullYear();
  const years = [
    String(currentYear),
    String(currentYear - 1),
    String(currentYear - 2),
  ];

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

  useEffect(() => {
    fetchDashboardStats();
  }, [filterType, selectedMonth, selectedYear]);

  const fetchDashboardStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/dashboard/stats`,
        {
          params: {
            filter: filterType,
            month: selectedMonth,
            year: selectedYear,
          },
        },
      );
      if (response.data.success) {
        const resData = response.data.data;
        setLiveOrders(resData.recentOrders);
        setRevenue(resData.revenue);
        setPurchases(resData.ordersCount);
        setVisitors(resData.webVisitors);
        setViews(resData.productViews);

        processChartData(resData.rawChartData, filterType);
      }
    } catch (error) {
      console.error("Gagal memuat data statistik dashboard:", error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const processChartData = (rawData, currentFilter) => {
    if (!rawData || rawData.length === 0) {
      setChartData([]);
      return;
    }

    const maxVal = Math.max(
      ...rawData.map((item) => Number(item.total_val)),
      1,
    );
    let formattedChart = [];

    if (currentFilter === "tahun") {
      const monthsName = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Ags",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      formattedChart = monthsName.map((m, index) => {
        const found = rawData.find(
          (item) => Number(item.label_key) === index + 1,
        );
        const val = found ? Number(found.total_val) : 0;
        return { label: m, h: `${(val / maxVal) * 100}%`, rawValue: val };
      });
    } else {
      formattedChart = rawData.map((item) => {
        let labelStr = item.label_key;

        if (currentFilter === "hariIni" || currentFilter === "kemarin") {
          labelStr = `${String(item.label_key).padStart(2, "0")}:00`;
        } else if (currentFilter === "bulan") {
          labelStr = `Tgl ${item.label_key}`;
        } else if (currentFilter === "7hari") {
          const d = new Date(item.label_key);
          labelStr = d.toLocaleDateString("id-ID", { weekday: "short" });
        }

        const val = Number(item.total_val);
        return {
          label: labelStr,
          h: `${(val / maxVal) * 100}%`,
          rawValue: val,
        };
      });
    }

    setChartData(formattedChart);
  };

  const statsList = [
    {
      title: "Total Pendapatan",
      value: formatRupiah(revenue),
      icon: <DollarSign size={24} />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Pengunjung Web",
      value: new Intl.NumberFormat("id-ID").format(visitors),
      icon: <Globe size={24} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Produk Dilihat",
      value: new Intl.NumberFormat("id-ID").format(views),
      icon: <Eye size={24} />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Pembelian",
      value: new Intl.NumberFormat("id-ID").format(purchases),
      icon: <ShoppingBag size={24} />,
      color: "bg-orange-100 text-orange-600",
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-chester-text">
          Dashboard Overview
        </h1>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
              <p
                className={`text-xl font-bold text-chester-text transition-all ${isStatsLoading ? "opacity-30" : "opacity-100"}`}
              >
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

            {chartData.length === 0 && !isStatsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 font-medium pb-8">
                Belum ada data penjualan pada periode ini.
              </div>
            ) : (
              chartData.map((data, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 z-10 group h-full"
                >
                  {/* PERBAIKAN: Pembungkus flex khusus untuk membatasi ruang balok (bounding box) */}
                  <div className="w-full flex-1 flex items-end justify-center relative">
                    <div
                      className="w-full max-w-[40px] bg-chester-pink opacity-80 hover:opacity-100 transition-all duration-1000 rounded-t-sm cursor-pointer"
                      style={{ height: data.h }}
                    >
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {formatRupiah(data.rawValue)}
                      </span>
                    </div>
                  </div>
                  {/* PERBAIKAN: Teks dipisahkan di bawah balok agar tidak tumpang tindih */}
                  <span className="text-xs text-gray-500 mt-2 font-medium text-center">
                    {data.label}
                  </span>
                </div>
              ))
            )}
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
            {liveOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Belum ada antrean invoice masuk di database.
              </div>
            ) : (
              liveOrders.map((order, index) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
