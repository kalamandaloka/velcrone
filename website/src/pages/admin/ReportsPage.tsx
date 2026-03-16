import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { formatRupiah, getStatusColor } from '@/constants/dummy';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Receipt, DollarSign, Clock, Package, Download } from 'lucide-react';

type TransaksiStatus = 'pending' | 'completed' | 'cancelled';

type TransaksiItem = {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
};

type Transaksi = {
  id: string;
  invoice: string;
  date: string | null;
  customerId: string;
  customerName: string;
  items: TransaksiItem[];
  total: number;
  status: TransaksiStatus;
  paymentMethod?: string;
  productionStatus?: string;
  paymentStatus?: string;
  paymentPaid?: number;
  paymentRemaining?: number;
};

type Barang = {
  kode: string;
  nama: string;
  kategori: string | null;
  stok: number;
  satuan: string;
};

type Bahan = {
  kode: string;
  nama: string;
  kategori: string | null;
  jenisProduk: string | null;
  stok: number;
  satuan: string;
  minStok: number;
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  const obj: Record<string, unknown> | null =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

  const message = obj?.message;
  if (typeof message === 'string' && message.trim()) return message;

  const errors = obj?.errors;
  if (errors && typeof errors === 'object') {
    const errorObj = errors as Record<string, unknown>;
    const firstKey = Object.keys(errorObj)[0];
    const firstVal = firstKey ? errorObj[firstKey] : null;
    const firstMsg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
    if (typeof firstMsg === 'string' && firstMsg.trim()) return firstMsg;
  }

  return fallback;
}

function parseTransaksiDate(input: string | null): Date | null {
  if (!input) return null;
  const normalized = input.includes('T') ? input : input.replace(' ', 'T') + ':00';
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function isoWeekStart(isoWeek: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;

  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - jan4Day);

  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return monday;
}

function toDdMm(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function monthLabel(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
}

function formatRangeLabel(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function buildPdfFromNode(node: HTMLElement): Promise<Blob> {
  return (async () => {
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  })();
}

async function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const reportRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const now = useMemo(() => new Date(), []);
  const [dayValue, setDayValue] = useState(() => now.toISOString().slice(0, 10));
  const [weekValue, setWeekValue] = useState(() => {
    const y = now.getFullYear();
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const dayNum = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayNum + 3);
    const firstThursday = new Date(d.getFullYear(), 0, 4);
    const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
    const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const ww = String(week).padStart(2, '0');
    return `${y}-W${ww}`;
  });
  const [monthValue, setMonthValue] = useState(() => now.toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState(() => String(now.getFullYear()));

  const dateRange = useMemo(() => {
    if (mode === 'day') {
      const d = new Date(`${dayValue}T00:00:00`);
      return { start: startOfDay(d), end: endOfDay(d), label: `Harian (${dayValue})` };
    }
    if (mode === 'week') {
      const monday = isoWeekStart(weekValue) || startOfDay(now);
      const start = startOfDay(monday);
      const end = endOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
      return { start, end, label: `Mingguan (${formatRangeLabel(start, end)})` };
    }
    if (mode === 'month') {
      const [y, m] = monthValue.split('-').map((v) => Number(v));
      const start = startOfDay(new Date(y, (m || 1) - 1, 1));
      const end = endOfDay(new Date(y, (m || 1), 0));
      return { start, end, label: `Bulanan (${monthValue})` };
    }
    const y = Number(yearValue);
    const start = startOfDay(new Date(y, 0, 1));
    const end = endOfDay(new Date(y, 11, 31));
    return { start, end, label: `Tahunan (${yearValue})` };
  }, [dayValue, mode, monthValue, now, weekValue, yearValue]);

  const transaksiQuery = useQuery({
    queryKey: ['reports', 'transaksi'],
    queryFn: async (): Promise<Transaksi[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data transaksi'));
      return Array.isArray(payload) ? (payload as Transaksi[]) : [];
    },
  });

  const barangQuery = useQuery({
    queryKey: ['reports', 'barang'],
    queryFn: async (): Promise<Barang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data barang'));
      return Array.isArray(payload) ? (payload as Barang[]) : [];
    },
  });

  const bahanQuery = useQuery({
    queryKey: ['reports', 'bahan'],
    queryFn: async (): Promise<Bahan[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data stok bahan'));
      return Array.isArray(payload) ? (payload as Bahan[]) : [];
    },
  });

  const transactions = useMemo(() => transaksiQuery.data || [], [transaksiQuery.data]);
  const products = useMemo(() => barangQuery.data || [], [barangQuery.data]);
  const rawMaterials = useMemo(() => bahanQuery.data || [], [bahanQuery.data]);

  const filteredTx = useMemo(() => {
    const startMs = dateRange.start.getTime();
    const endMs = dateRange.end.getTime();
    return transactions.filter((t) => {
      const d = parseTransaksiDate(t.date);
      if (!d) return false;
      const ms = d.getTime();
      return ms >= startMs && ms <= endMs;
    });
  }, [dateRange.end, dateRange.start, transactions]);

  const completedTx = useMemo(() => filteredTx.filter((t) => t.status === 'completed'), [filteredTx]);
  const totalRevenue = useMemo(() => completedTx.reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0), [completedTx]);
  const pendingTotal = useMemo(() => filteredTx.filter((t) => t.status === 'pending').reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0), [filteredTx]);
  const totalItemsSold = useMemo(() => completedTx.reduce((s, t) => s + (t.items || []).reduce((ss, i) => ss + (Number.isFinite(i.qty) ? i.qty : 0), 0), 0), [completedTx]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { qty: number; revenue: number }> = {};
    completedTx.forEach((t) =>
      (t.items || []).forEach((i) => {
        const key = typeof i.productName === 'string' ? i.productName : '';
        if (!key) return;
        if (!productSales[key]) productSales[key] = { qty: 0, revenue: 0 };
        productSales[key].qty += Number.isFinite(i.qty) ? i.qty : 0;
        productSales[key].revenue += Number.isFinite(i.subtotal) ? i.subtotal : 0;
      })
    );
    return Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [completedTx]);

  const bahanRows = useMemo(() => {
    return rawMaterials.map((m) => {
      const status = m.stok <= m.minStok ? 'critical' : m.stok <= m.minStok * 1.3 ? 'low' : 'normal';
      return { ...m, status };
    });
  }, [rawMaterials]);

  const dailyRevenueData = useMemo(() => {
    const byDay: Record<string, number> = {};
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    for (const t of completedTx) {
      const d = parseTransaksiDate(t.date);
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + (Number.isFinite(t.total) ? t.total : 0);
    }

    const out: Array<{ date: string; revenue: number }> = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= end.getTime()) {
      const key = cursor.toISOString().slice(0, 10);
      out.push({ date: toDdMm(cursor), revenue: byDay[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [completedTx, dateRange.end, dateRange.start]);

  const monthlyRevenueData = useMemo(() => {
    const end = new Date(dateRange.end);
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    const byYm: Record<string, number> = {};

    for (const t of completedTx) {
      const d = parseTransaksiDate(t.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byYm[key] = (byYm[key] || 0) + (Number.isFinite(t.total) ? t.total : 0);
    }

    const out: Array<{ month: string; revenue: number }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ month: monthLabel(d), revenue: byYm[key] || 0 });
    }
    return out;
  }, [completedTx, dateRange.end]);

  const pageError =
    (transaksiQuery.isError && (transaksiQuery.error instanceof Error ? transaksiQuery.error.message : 'Gagal memuat transaksi')) ||
    (barangQuery.isError && (barangQuery.error instanceof Error ? barangQuery.error.message : 'Gagal memuat barang')) ||
    (bahanQuery.isError && (bahanQuery.error instanceof Error ? bahanQuery.error.message : 'Gagal memuat bahan')) ||
    null;

  const handleExportPdf = async () => {
    const node = reportRef.current;
    if (!node) return;
    try {
      const blob = await buildPdfFromNode(node);
      await downloadBlob(`laporan-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`, blob);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();

      const summary = [
        ['Periode', dateRange.label],
        ['Rentang', formatRangeLabel(dateRange.start, dateRange.end)],
        ['Jumlah Transaksi', filteredTx.length],
        ['Total Pendapatan (Completed)', totalRevenue],
        ['Total Pending', pendingTotal],
        ['Jumlah Produk', products.length],
        ['Total Item Terjual', totalItemsSold],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Ringkasan');

      const productSheetRows = [['Produk', 'Qty', 'Omset'], ...topProducts.map(([name, d]) => [name, d.qty, d.revenue])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(productSheetRows), 'Penjualan Produk');

      const bahanSheetRows = [
        ['Kode', 'Bahan', 'Kategori', 'Stok', 'Satuan', 'Min Stok', 'Status'],
        ...bahanRows.map((m) => [m.kode, m.nama, m.kategori || '', m.stok, m.satuan, m.minStok, m.status]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bahanSheetRows), 'Stok Bahan');

      const txSheetRows = [
        ['Invoice', 'Tanggal', 'Pelanggan', 'Status', 'Total', 'Metode', 'Status Produksi', 'Status Pembayaran', 'Dibayar', 'Sisa'],
        ...filteredTx.map((t) => [
          t.invoice,
          t.date || '',
          t.customerName,
          t.status,
          Number.isFinite(t.total) ? t.total : 0,
          t.paymentMethod || '',
          t.productionStatus || '',
          t.paymentStatus || '',
          Number.isFinite(t.paymentPaid) ? t.paymentPaid : 0,
          Number.isFinite(t.paymentRemaining) ? t.paymentRemaining : 0,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txSheetRows), 'Transaksi');

      XLSX.writeFile(wb, `laporan-${mode}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal export Excel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Laporan</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Periode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Harian</SelectItem>
              <SelectItem value="week">Mingguan</SelectItem>
              <SelectItem value="month">Bulanan</SelectItem>
              <SelectItem value="year">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          {mode === 'day' && (
            <Input type="date" value={dayValue} onChange={(e) => setDayValue(e.target.value)} className="w-[170px]" />
          )}
          {mode === 'week' && (
            <Input type="week" value={weekValue} onChange={(e) => setWeekValue(e.target.value)} className="w-[170px]" />
          )}
          {mode === 'month' && (
            <Input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} className="w-[170px]" />
          )}
          {mode === 'year' && (
            <Input type="number" value={yearValue} onChange={(e) => setYearValue(e.target.value)} className="w-[120px]" min={2000} max={2100} />
          )}
          <Button variant="outline" onClick={handleExportPdf} className="gap-2">
            <Download size={16} /> Export PDF
          </Button>
          <Button onClick={handleExportExcel} className="velcrone-gradient text-primary-foreground hover:opacity-90 gap-2">
            <Download size={16} /> Export Excel
          </Button>
        </div>
      </div>

      {pageError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {pageError}
        </div>
      )}

      <div ref={reportRef} className="space-y-6">
        <div className="bg-card rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Periode</p>
            <p className="font-semibold text-foreground">{dateRange.label}</p>
            <p className="text-xs text-muted-foreground">{formatRangeLabel(dateRange.start, dateRange.end)}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Transaksi', value: filteredTx.length, icon: <Receipt size={24} /> },
            { title: 'Penghasilan', value: formatRupiah(totalRevenue), icon: <DollarSign size={24} /> },
            { title: 'Pending', value: formatRupiah(pendingTotal), icon: <Clock size={24} /> },
            { title: 'Jumlah Produk', value: products.length, icon: <Package size={24} /> },
          ].map((kpi, i) => (
            <div key={i} className="bg-card rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">{kpi.value}</p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-velcrone-red-light flex items-center justify-center text-primary">{kpi.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Grafik Penghasilan (Per Hari)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyRevenueData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Bar dataKey="revenue" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Grafik Penghasilan (12 Bulan)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(0, 72%, 51%)" fillOpacity={1} fill="url(#revGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product sales table */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b"><h3 className="font-semibold text-foreground">Laporan Penjualan Produk</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Produk</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Omset</th>
              </tr></thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  topProducts.map(([name, data]) => (
                    <tr key={name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{name}</td>
                      <td className="p-3 text-right tabular-nums">{data.qty}</td>
                      <td className="p-3 text-right tabular-nums">{formatRupiah(data.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock report */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b"><h3 className="font-semibold text-foreground">Laporan Stok Bahan</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Kode</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Bahan</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Stok</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Min. Stok</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {bahanRows.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  bahanRows.map((m) => (
                    <tr key={m.kode} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{m.kode}</td>
                      <td className="p-3 font-medium text-foreground">{m.nama}</td>
                      <td className="p-3 text-right tabular-nums">{m.stok} {m.satuan}</td>
                      <td className="p-3 text-right tabular-nums">{m.minStok} {m.satuan}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${m.status === 'critical' ? 'bg-destructive/10 text-destructive' : m.status === 'low' ? 'bg-velcrone-warning-light text-velcrone-warning' : 'bg-velcrone-success-light text-velcrone-success'}`}>{m.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b"><h3 className="font-semibold text-foreground">Data Transaksi</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Pelanggan</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transaksiQuery.isLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
                ) : filteredTx.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  filteredTx.map((t) => {
                    const sc = getStatusColor(t.status);
                    return (
                      <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-foreground">{t.invoice}</td>
                        <td className="p-3 text-muted-foreground">{t.date || '-'}</td>
                        <td className="p-3 text-muted-foreground">{t.customerName}</td>
                        <td className="p-3 text-right tabular-nums">{formatRupiah(t.total)}</td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} font-medium capitalize`}>{t.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
