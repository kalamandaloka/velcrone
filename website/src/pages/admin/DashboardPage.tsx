import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, getStatusColor } from '@/constants/dummy';
import { Package, Layers, Receipt, Users, DollarSign, TrendingUp, AlertTriangle, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
};

type Barang = {
  kode: string;
  nama: string;
  kategori: string | null;
  ukuran: string[];
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

type Pelanggan = {
  id: string;
};

type UserRow = {
  id: number;
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

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDdMm(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function monthLabel(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d);
}

function transaksiYmd(date: string | null): string | null {
  if (!date) return null;
  if (date.length >= 10) return date.slice(0, 10);
  return null;
}

function KpiCard({ title, value, icon, className }: { title: string; value: string | number; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-lg p-5 shadow-sm animate-fade-in ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg velcrone-card-gradient flex items-center justify-center text-primary-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

  const transaksiQuery = useQuery({
    queryKey: ['dashboard', 'transaksi'],
    enabled: role !== undefined,
    queryFn: async (): Promise<Transaksi[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data transaksi'));
      return Array.isArray(payload) ? (payload as Transaksi[]) : [];
    },
  });

  const barangQuery = useQuery({
    queryKey: ['dashboard', 'barang'],
    enabled: role !== undefined,
    queryFn: async (): Promise<Barang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data barang'));
      return Array.isArray(payload) ? (payload as Barang[]) : [];
    },
  });

  const bahanQuery = useQuery({
    queryKey: ['dashboard', 'bahan'],
    enabled: role === 'superadmin' || role === 'owner' || role === 'manager',
    queryFn: async (): Promise<Bahan[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data stok bahan'));
      return Array.isArray(payload) ? (payload as Bahan[]) : [];
    },
  });

  const pelangganQuery = useQuery({
    queryKey: ['dashboard', 'pelanggan'],
    enabled: role === 'kasir',
    queryFn: async (): Promise<Pelanggan[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data pelanggan'));
      return Array.isArray(payload) ? (payload as Pelanggan[]) : [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ['dashboard', 'users'],
    enabled: role === 'superadmin',
    queryFn: async (): Promise<UserRow[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/users`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data user'));
      return Array.isArray(payload) ? (payload as UserRow[]) : [];
    },
  });

  const transactions = useMemo(() => transaksiQuery.data || [], [transaksiQuery.data]);
  const products = useMemo(() => barangQuery.data || [], [barangQuery.data]);
  const rawMaterials = useMemo(() => bahanQuery.data || [], [bahanQuery.data]);

  const todayYmd = useMemo(() => toYmd(new Date()), []);
  const completedTransactions = useMemo(() => transactions.filter((t) => t.status === 'completed'), [transactions]);
  const totalRevenue = useMemo(() => completedTransactions.reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0), [completedTransactions]);
  const pendingTotal = useMemo(() => transactions.filter((t) => t.status === 'pending').reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0), [transactions]);
  const todayTransactions = useMemo(() => transactions.filter((t) => transaksiYmd(t.date) === todayYmd), [transactions, todayYmd]);
  const todayRevenue = useMemo(() => todayTransactions.filter((t) => t.status === 'completed').reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0), [todayTransactions]);
  const todayPendingTotal = useMemo(
    () => todayTransactions.filter((t) => t.status === 'pending').reduce((s, t) => s + (Number.isFinite(t.total) ? t.total : 0), 0),
    [todayTransactions]
  );

  const criticalMaterials = useMemo(
    () => rawMaterials.filter((m) => Number.isFinite(m.stok) && Number.isFinite(m.minStok) && m.stok <= m.minStok),
    [rawMaterials]
  );

  const dailyRevenueData = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 14);

    const byYmd: Record<string, number> = {};
    for (const t of completedTransactions) {
      const d = parseTransaksiDate(t.date);
      if (!d) continue;
      const key = toYmd(d);
      byYmd[key] = (byYmd[key] || 0) + (Number.isFinite(t.total) ? t.total : 0);
    }

    const points: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toYmd(d);
      points.push({ date: toDdMm(d), revenue: byYmd[key] || 0, orders: 0 });
    }
    return points;
  }, [completedTransactions]);

  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const byYm: Record<string, number> = {};

    for (const t of completedTransactions) {
      const d = parseTransaksiDate(t.date);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byYm[key] = (byYm[key] || 0) + (Number.isFinite(t.total) ? t.total : 0);
    }

    const points: Array<{ month: string; revenue: number }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      points.push({ month: monthLabel(d), revenue: byYm[key] || 0 });
    }
    return points;
  }, [completedTransactions]);

  // Top selling
  const topSelling = useMemo(() => {
    const productSales: Record<string, number> = {};
    completedTransactions.forEach((t) =>
      (t.items || []).forEach((i) => {
        const key = typeof i.productName === 'string' ? i.productName : '';
        if (!key) return;
        productSales[key] = (productSales[key] || 0) + (Number.isFinite(i.qty) ? i.qty : 0);
      })
    );
    return Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [completedTransactions]);

  const pageError =
    (transaksiQuery.isError && (transaksiQuery.error instanceof Error ? transaksiQuery.error.message : 'Gagal memuat transaksi')) ||
    (barangQuery.isError && (barangQuery.error instanceof Error ? barangQuery.error.message : 'Gagal memuat barang')) ||
    (bahanQuery.isError && (bahanQuery.error instanceof Error ? bahanQuery.error.message : 'Gagal memuat bahan')) ||
    (pelangganQuery.isError && (pelangganQuery.error instanceof Error ? pelangganQuery.error.message : 'Gagal memuat pelanggan')) ||
    (usersQuery.isError && (usersQuery.error instanceof Error ? usersQuery.error.message : 'Gagal memuat users')) ||
    null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Selamat Datang, {user?.name}</h1>
        <p className="text-muted-foreground text-sm">
          {role === 'kasir' ? 'Berikut ringkasan data hari ini.' : 'Berikut ringkasan data usaha dan operasional.'}
        </p>
      </div>
      {pageError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {pageError}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(role === 'superadmin' || role === 'owner') && (
          <KpiCard title="Total Pendapatan" value={formatRupiah(totalRevenue)} icon={<DollarSign size={24} />} />
        )}
        {role === 'kasir' && (
          <KpiCard title="Penjualan Hari Ini" value={formatRupiah(todayRevenue)} icon={<DollarSign size={24} />} />
        )}
        <KpiCard
          title="Transaksi"
          value={role === 'kasir' ? todayTransactions.length : transactions.length}
          icon={<Receipt size={24} />}
        />
        {role !== 'kasir' && <KpiCard title="Total Produk" value={products.length} icon={<Package size={24} />} />}
        {role === 'superadmin' && <KpiCard title="Total User" value={(usersQuery.data || []).length} icon={<Users size={24} />} />}
        {role === 'owner' && <KpiCard title="Pending" value={formatRupiah(pendingTotal)} icon={<AlertTriangle size={24} />} />}
        {role === 'kasir' && <KpiCard title="Pending Hari Ini" value={formatRupiah(todayPendingTotal)} icon={<AlertTriangle size={24} />} />}
        {(role === 'superadmin' || role === 'owner' || role === 'manager') && (
          <KpiCard title="Bahan Kritis" value={criticalMaterials.length} icon={<Layers size={24} />} />
        )}
        {role === 'kasir' && <KpiCard title="Pelanggan" value={(pelangganQuery.data || []).length} icon={<Users size={24} />} />}
        {role === 'kasir' && <KpiCard title="Produk" value={products.length} icon={<ShoppingBag size={24} />} />}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        {role !== 'kasir' && (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Grafik Pendapatan Harian</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyRevenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(0, 72%, 51%)" fillOpacity={1} fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly or bar chart */}
        {(role === 'superadmin' || role === 'owner') && (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Grafik Penjualan Bulanan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(240, 3.8%, 46.1%)" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Bar dataKey="revenue" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {role === 'manager' && (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Data Produk</h3>
            <div className="space-y-3">
              {products.slice(0, 6).map((p) => (
                <div key={p.kode} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nama}</p>
                    <p className="text-xs text-muted-foreground">{p.kode} • {p.kategori || '-'}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{p.ukuran.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Low stock alerts & top selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(role === 'superadmin' || role === 'owner' || role === 'manager') && criticalMaterials.length > 0 && (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-primary" /> Stok Bahan Kritis
            </h3>
            <div className="space-y-3">
              {criticalMaterials.map((m) => (
                <div key={m.kode} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.nama}</p>
                    <p className="text-xs text-muted-foreground">{m.kode} • Min: {m.minStok} {m.satuan}</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold tabular-nums">{m.stok} {m.satuan}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(role === 'superadmin' || role === 'owner') && (
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Top Selling Products
            </h3>
            <div className="space-y-3">
              {topSelling.map(([name, qty], i) => (
                <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{qty} pcs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions for kasir */}
        {role === 'kasir' && (
          <div className="bg-card rounded-lg p-6 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Transaksi Terakhir</h3>
            <div className="space-y-3">
              {todayTransactions.slice(0, 5).length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini.</p>
              ) : (
                todayTransactions.slice(0, 5).map((t) => {
                  const sc = getStatusColor(t.status);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.invoice}</p>
                        <p className="text-xs text-muted-foreground">{t.customerName} • {t.date || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">{formatRupiah(t.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} font-medium capitalize`}>{t.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
