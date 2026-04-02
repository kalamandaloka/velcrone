import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, getStatusColor } from '@/constants/dummy';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search } from 'lucide-react';
import { Package, Layers, Receipt, Users, DollarSign, TrendingUp, AlertTriangle, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

type TransaksiStatus = 'pending' | 'completed' | 'cancelled';

type TransaksiItem = {
  productId: string;
  productName: string;
  ukuran: string;
  warna: string;
  qty: number;
  price: number;
  subtotal: number;
};

type SpkDetailEntry = {
  stepStatus: string | null;
  deadlineDate: string | null;
};

type SpkDetailMap = Record<string, SpkDetailEntry>;

type Transaksi = {
  id: string;
  invoice: string;
  date: string | null;
  customerId: string;
  customerName: string;
  items: TransaksiItem[];
  spkDetail?: SpkDetailMap;
  total: number;
  status: TransaksiStatus;
};

type Barang = {
  kode: string;
  nama: string;
  kategori: string | null;
  jenis: string[];
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

const SPK_STEP_OPTIONS = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'] as const;
type SpkStepStatus = (typeof SPK_STEP_OPTIONS)[number];

const SPK_STEP_SEQUENCE: SpkStepStatus[] = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'];

function nextSpkStep(step: SpkStepStatus): SpkStepStatus {
  const idx = SPK_STEP_SEQUENCE.indexOf(step);
  if (idx < 0) return step;
  const next = SPK_STEP_SEQUENCE[idx + 1];
  return next || step;
}

type SpkRow = {
  id: string;
  transaksiId: string;
  spkNumber: string;
  invoice: string;
  orderDate: string | null;
  customerName: string;
  kategoriProduk: string | null;
  productId: string;
  productName: string;
  warnaProduk: string | null;
  jenisProduk: string[];
  qty: number;
  sizes: Array<{ size: string; qty: number }>;
};

type SpkRowView = SpkRow & {
  deadlineDate: string | null;
  stepStatus: SpkStepStatus | null;
  masukDate: string | null;
  selesaiDate: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseInvoiceParts(invoice: string): { trxPart: string; month: string; year: string } {
  const parts = String(invoice || '').split('/').map((p) => p.trim()).filter(Boolean);
  const trxPart = parts.find((p) => /^TRX-\d{3}$/i.test(p)) || 'TRX-000';
  const month = parts.length >= 2 && /^\d{2}$/.test(parts[parts.length - 2] || '') ? (parts[parts.length - 2] as string) : '01';
  const year = parts.length >= 1 && /^\d{4}$/.test(parts[parts.length - 1] || '') ? (parts[parts.length - 1] as string) : '1970';
  return { trxPart: trxPart.toUpperCase(), month, year };
}

function getDeadlineStorageKey(args: { invoice: string; productId: string; warnaProduk: string | null }): string {
  const warna = args.warnaProduk || '';
  return `velcrone:spk_deadline:${args.invoice}:${args.productId}:${warna}`;
}

function getStepStatusStorageKey(args: { invoice: string; productId: string; warnaProduk: string | null }): string {
  const warna = args.warnaProduk || '';
  return `velcrone:spk_step:${args.invoice}:${args.productId}:${warna}`;
}

function getMasukDateStorageKey(args: { invoice: string; productId: string; warnaProduk: string | null; step: SpkStepStatus }): string {
  const warna = args.warnaProduk || '';
  return `velcrone:spk_step_in:${args.invoice}:${args.productId}:${warna}:${args.step}`;
}

function getSelesaiDateStorageKey(args: { invoice: string; productId: string; warnaProduk: string | null; step: SpkStepStatus }): string {
  const warna = args.warnaProduk || '';
  return `velcrone:spk_step_done:${args.invoice}:${args.productId}:${warna}:${args.step}`;
}

function getSelesaiByStorageKey(args: { invoice: string; productId: string; warnaProduk: string | null; step: SpkStepStatus }): string {
  const warna = args.warnaProduk || '';
  return `velcrone:spk_step_done_by:${args.invoice}:${args.productId}:${warna}:${args.step}`;
}

function readLocalStorageSafe(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function readDeadline(key: string): string | null {
  return readLocalStorageSafe(key);
}

function readStepStatus(key: string): SpkStepStatus | null {
  const v = readLocalStorageSafe(key);
  if (!v) return null;
  return (SPK_STEP_OPTIONS as readonly string[]).includes(v) ? (v as SpkStepStatus) : null;
}

function coerceSpkStepStatus(value: unknown): SpkStepStatus | null {
  const v = typeof value === 'string' ? value : '';
  return (SPK_STEP_OPTIONS as readonly string[]).includes(v) ? (v as SpkStepStatus) : null;
}

function writeLocalStorageSafe(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function productionStageForRole(role: string | undefined): SpkStepStatus | null {
  if (!role) return null;
  if (role === 'design') return 'DESIGN';
  if (role === 'setting') return 'SETTING';
  if (role === 'printing') return 'PRINTING';
  if (role === 'heat press') return 'HEAT PRESS';
  if (role === 'sewing') return 'SEWING';
  if (role === 'qc') return 'QC';
  if (role === 'packing') return 'PACKING';
  if (role === 'delivery') return 'DELIVERY';
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
  const queryClient = useQueryClient();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const productionStage = productionStageForRole(role);
  const isProductionDashboard = productionStage !== null;

  const [searchSpk, setSearchSpk] = useState('');
  const [storageTick, setStorageTick] = useState(0);
  const [selectedSpk, setSelectedSpk] = useState<SpkRowView | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'masuk' | 'selesai'>('masuk');
  const [datePickerRow, setDatePickerRow] = useState<SpkRowView | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(() => toYmd(new Date()));

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

  const updateSpkItemMutation = useMutation({
    mutationFn: async (args: { transaksiId: string; productId: string; warna: string | null; stepStatus: SpkStepStatus }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(args.transaksiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spkItem: {
            productId: args.productId,
            warna: args.warna || '',
            stepStatus: args.stepStatus,
          },
        }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memperbarui status SPK'));
      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'transaksi'] });
    },
  });

  const markTransaksiProductionDone = useMutation({
    mutationFn: async ({ transaksiId, productionDate }: { transaksiId: string; productionDate: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(transaksiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus: 'selesai', productionDate }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menandai produksi selesai'));
      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'transaksi'] });
    },
  });

  useEffect(() => {
    if (!isProductionDashboard) return;
    const onFocus = () => setStorageTick((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (!e.key.startsWith('velcrone:spk_')) return;
      setStorageTick((v) => v + 1);
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [isProductionDashboard]);

  const productionSpkRows = useMemo((): SpkRowView[] => {
    if (!isProductionDashboard) return [];
    void storageTick;

    const barangMap = new Map<string, { kategori: string | null; jenis: string[] }>();
    for (const b of products) {
      barangMap.set(b.kode, { kategori: b.kategori ?? null, jenis: Array.isArray(b.jenis) ? b.jenis : [] });
    }

    const spkDetailByTransaksiId = new Map<string, SpkDetailMap>();
    for (const t of transactions) {
      if (!t || typeof t !== 'object') continue;
      const id = typeof t.id === 'string' ? t.id : '';
      if (!id) continue;
      const d = t.spkDetail && typeof t.spkDetail === 'object' ? (t.spkDetail as SpkDetailMap) : {};
      spkDetailByTransaksiId.set(id, d);
    }

    const raw: SpkRow[] = [];
    for (const t of transactions) {
      if (t.status === 'cancelled') continue;
      const { trxPart, month, year } = parseInvoiceParts(t.invoice);

      const grouped = new Map<
        string,
        { productId: string; productName: string; warna: string; qty: number; sizes: Record<string, number> }
      >();

      for (const it of t.items || []) {
        const warna = String(it.warna || '').trim();
        const key = `${it.productId}::${warna}`;
        const sizeKey = String(it.ukuran || '').trim().toUpperCase();
        const existing = grouped.get(key);
        if (existing) {
          existing.qty += it.qty || 0;
          if (sizeKey) existing.sizes[sizeKey] = (existing.sizes[sizeKey] || 0) + (it.qty || 0);
        } else {
          const sizes: Record<string, number> = {};
          if (sizeKey) sizes[sizeKey] = (it.qty || 0);
          grouped.set(key, { productId: it.productId, productName: it.productName, warna, qty: it.qty || 0, sizes });
        }
      }

      const groups = Array.from(grouped.values()).sort((a, b) => {
        const an = a.productName.toLowerCase();
        const bn = b.productName.toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return a.warna.toLowerCase().localeCompare(b.warna.toLowerCase());
      });

      for (let i = 0; i < groups.length; i++) {
        const g = groups[i]!;
        const spkIndex = i + 1;
        const spkNumber = `${pad2(spkIndex)}/SPK-${spkIndex}/${trxPart}/${month}/${year}`;
        const barang = barangMap.get(g.productId);
        const warnaProduk = g.warna ? g.warna : null;
        const sizes = Object.entries(g.sizes || {})
          .map(([size, qty]) => ({ size, qty }))
          .filter((x) => x.size.trim() !== '' && Number.isFinite(x.qty) && x.qty > 0);

        raw.push({
          id: `${t.id}:${g.productId}:${g.warna}`,
          transaksiId: t.id,
          spkNumber,
          invoice: t.invoice,
          orderDate: t.date,
          customerName: t.customerName,
          kategoriProduk: barang?.kategori ?? null,
          productId: g.productId,
          productName: g.productName,
          warnaProduk,
          jenisProduk: barang?.jenis ?? [],
          qty: g.qty,
          sizes,
        });
      }
    }

    const q = searchSpk.trim().toLowerCase();
    const filtered: SpkRowView[] = [];
    for (const row of raw) {
      const spkKey = `${row.productId}::${row.warnaProduk || ''}`;
      const detail = spkDetailByTransaksiId.get(row.transaksiId)?.[spkKey] || null;
      const deadlineDate = detail?.deadlineDate ?? readDeadline(getDeadlineStorageKey(row));
      const stepStatus = coerceSpkStepStatus(detail?.stepStatus) ?? readStepStatus(getStepStatusStorageKey(row)) ?? 'DESIGN';
      if (stepStatus !== productionStage) continue;
      const masukDate = readLocalStorageSafe(
        getMasukDateStorageKey({ invoice: row.invoice, productId: row.productId, warnaProduk: row.warnaProduk, step: productionStage })
      );
      const selesaiDate = readLocalStorageSafe(
        getSelesaiDateStorageKey({ invoice: row.invoice, productId: row.productId, warnaProduk: row.warnaProduk, step: productionStage })
      );
      const view: SpkRowView = { ...row, deadlineDate, stepStatus, masukDate, selesaiDate };
      if (q) {
        const hay = `${row.spkNumber} ${row.invoice} ${row.customerName} ${row.productName} ${row.warnaProduk || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      filtered.push(view);
    }

    filtered.sort((a, b) => a.spkNumber.localeCompare(b.spkNumber));
    return filtered;
  }, [isProductionDashboard, products, productionStage, searchSpk, storageTick, transactions]);

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

  if (isProductionDashboard) {
    const openMasukTanggal = (row: SpkRowView) => {
      setDatePickerMode('masuk');
      setDatePickerRow(row);
      setDatePickerValue(row.masukDate || toYmd(new Date()));
      setDatePickerOpen(true);
    };

    const openSelesaiTanggal = (row: SpkRowView) => {
      setDatePickerMode('selesai');
      setDatePickerRow(row);
      setDatePickerValue(row.selesaiDate || toYmd(new Date()));
      setDatePickerOpen(true);
    };

    const commitTanggal = () => {
      if (!productionStage) return;
      if (!datePickerRow) return;
      const value = String(datePickerValue || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;

      if (datePickerMode === 'masuk') {
        const key = getMasukDateStorageKey({
          invoice: datePickerRow.invoice,
          productId: datePickerRow.productId,
          warnaProduk: datePickerRow.warnaProduk,
          step: productionStage,
        });
        writeLocalStorageSafe(key, value);
      } else {
        const nextStep = nextSpkStep(productionStage);
        const key = getSelesaiDateStorageKey({
          invoice: datePickerRow.invoice,
          productId: datePickerRow.productId,
          warnaProduk: datePickerRow.warnaProduk,
          step: productionStage,
        });
        writeLocalStorageSafe(key, value);
        writeLocalStorageSafe(
          getSelesaiByStorageKey({
            invoice: datePickerRow.invoice,
            productId: datePickerRow.productId,
            warnaProduk: datePickerRow.warnaProduk,
            step: productionStage,
          }),
          user?.name || '-'
        );

        const spkKey = `${datePickerRow.productId}::${datePickerRow.warnaProduk || ''}`;
        const transaksi = transactions.find((t) => t.id === datePickerRow.transaksiId) || null;
        const currentSpkDetail = transaksi?.spkDetail || {};
        const nextSpkDetail = { ...currentSpkDetail, [spkKey]: { ...(currentSpkDetail[spkKey] || {}), stepStatus: nextStep } };
        const allDone =
          Object.keys(nextSpkDetail).length > 0 &&
          Object.values(nextSpkDetail).every((entry) => String(entry?.stepStatus || '').toUpperCase() === 'SELESAI');

        updateSpkItemMutation.mutate(
          {
            transaksiId: datePickerRow.transaksiId,
            productId: datePickerRow.productId,
            warna: datePickerRow.warnaProduk,
            stepStatus: nextStep,
          },
          {
            onSuccess: () => {
              if (nextStep === 'SELESAI' && allDone) {
                markTransaksiProductionDone.mutate({ transaksiId: datePickerRow.transaksiId, productionDate: toYmd(new Date()) });
              }
            },
            onError: (err) => {
              toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status SPK');
            },
          }
        );
      }

      setStorageTick((v) => v + 1);
      setDatePickerOpen(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard {productionStage}</h1>
            <p className="text-sm text-muted-foreground">List SPK dengan status {productionStage}</p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">{productionSpkRows.length} SPK</div>
        </div>

        {pageError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
            {pageError}
          </div>
        )}

        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <div className="relative max-w-sm w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari SPK / invoice / pelanggan / produk..."
                value={searchSpk}
                onChange={(e) => setSearchSpk(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {transaksiQuery.isLoading || barangQuery.isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Memuat data...</div>
          ) : productionSpkRows.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada SPK pada status ini</div>
          ) : (
            <>
              <div className="sm:hidden p-4 space-y-3">
                {productionSpkRows.map((row, idx) => (
                  <div key={row.id} className="rounded-lg border bg-background p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{`#${idx + 1}`}</p>
                        <p className="font-semibold text-foreground truncate">{row.spkNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.invoice}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedSpk(row)}>
                        <Eye size={16} />
                        <span className="ml-2">Detail</span>
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{row.productName}</p>
                      <p className="text-xs text-muted-foreground">{row.warnaProduk ? `Warna: ${row.warnaProduk}` : 'Warna: -'}</p>
                      <p className="text-xs text-muted-foreground">{`Pelanggan: ${row.customerName}`}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Qty</p>
                        <p className="font-medium text-foreground">{`${row.qty} pcs`}</p>
                      </div>
                      <div className="rounded-md bg-muted/30 px-3 py-2">
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="font-medium text-foreground">{row.deadlineDate || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Masuk</p>
                          <p className="text-sm text-foreground tabular-nums">{row.masukDate || '-'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openMasukTanggal(row)}>
                          Masuk
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Selesai</p>
                          <p className="text-sm text-foreground tabular-nums">{row.selesaiDate || '-'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openSelesaiTanggal(row)}>
                          Selesai
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">No</TableHead>
                      <TableHead className="w-[210px]">No SPK</TableHead>
                      <TableHead className="w-[200px]">No Invoice</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="w-[110px]">Qty</TableHead>
                      <TableHead className="w-[150px]">Deadline</TableHead>
                      <TableHead className="w-[190px]">Masuk Tanggal</TableHead>
                      <TableHead className="w-[190px]">Selesai Tanggal</TableHead>
                      <TableHead className="w-[90px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionSpkRows.map((row, idx) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.spkNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{row.invoice}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground">{row.productName}</div>
                            <div className="text-xs text-muted-foreground">{row.warnaProduk ? `Warna: ${row.warnaProduk}` : '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{`${row.qty} pcs`}</TableCell>
                        <TableCell>{row.deadlineDate || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground tabular-nums">{row.masukDate || '-'}</span>
                            <Button variant="outline" size="sm" onClick={() => openMasukTanggal(row)}>
                              Masuk
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground tabular-nums">{row.selesaiDate || '-'}</span>
                            <Button variant="outline" size="sm" onClick={() => openSelesaiTanggal(row)}>
                              Selesai
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedSpk(row)}
                            aria-label="Detail"
                          >
                            <Eye size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <Dialog
          open={datePickerOpen}
          onOpenChange={(open) => {
            setDatePickerOpen(open);
            if (!open) setDatePickerRow(null);
          }}
        >
          <DialogContent className="bg-card max-w-md">
            <DialogHeader>
              <DialogTitle>{datePickerMode === 'masuk' ? 'Pilih Tanggal Masuk' : 'Pilih Tanggal Selesai'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <Input type="date" value={datePickerValue} onChange={(e) => setDatePickerValue(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDatePickerOpen(false)}>
                  Batal
                </Button>
                <Button onClick={commitTanggal}>OK</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedSpk} onOpenChange={(open) => !open && setSelectedSpk(null)}>
          <DialogContent className="bg-card max-w-2xl">
            <DialogHeader><DialogTitle>Detail SPK</DialogTitle></DialogHeader>
            {selectedSpk && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">No SPK</p>
                    <p className="font-medium text-foreground">{selectedSpk.spkNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No Invoice</p>
                    <p className="font-medium text-foreground">{selectedSpk.invoice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pelanggan</p>
                    <p className="font-medium text-foreground">{selectedSpk.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Order</p>
                    <p className="font-medium text-foreground">{selectedSpk.orderDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Deadline</p>
                    <p className="font-medium text-foreground">{selectedSpk.deadlineDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-foreground">{selectedSpk.stepStatus || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori Produk</p>
                    <p className="font-medium text-foreground">{selectedSpk.kategoriProduk || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warna Produk</p>
                    <p className="font-medium text-foreground">{selectedSpk.warnaProduk || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Produk</p>
                    <p className="font-medium text-foreground">{selectedSpk.jenisProduk.length ? selectedSpk.jenisProduk.join(', ') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah</p>
                    <p className="font-medium text-foreground">{`${selectedSpk.qty} pcs`}</p>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <p className="text-sm font-medium text-foreground">Detail Ukuran</p>
                  </div>
                  <div className="p-4">
                    {selectedSpk.sizes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Tidak ada detail ukuran</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedSpk.sizes.map((s) => (
                          <div key={s.size} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="text-sm font-medium text-foreground">{s.size}</span>
                            <span className="text-sm text-muted-foreground tabular-nums">{s.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
