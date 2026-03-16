import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { formatRupiah } from '@/constants/dummy';
import { Search, Pencil } from 'lucide-react';

type PaymentStatus = 'belum_lunas' | 'lunas';

type PaymentRow = {
  step: number;
  amount: number;
  date: string | null;
};

type TransaksiRow = {
  id: string;
  invoice: string;
  date: string | null;
  customerName: string;
  paymentStatus: PaymentStatus;
  paymentStep: number;
  total: number;
  paymentDue: number;
  paymentPaid: number;
  paymentRemaining: number;
  payments: PaymentRow[];
};

const paymentStepOptions: Array<{ value: number; label: string }> = [
  { value: 0, label: '-' },
  { value: 1, label: 'Pembayaran ke-1' },
  { value: 2, label: 'Pembayaran ke-2' },
  { value: 3, label: 'Pembayaran ke-3' },
  { value: 4, label: 'Pembayaran ke-4' },
  { value: 5, label: 'Pelunasan' },
];

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'belum_lunas', label: 'Belum Lunas' },
  { value: 'lunas', label: 'Lunas' },
];

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

function coercePaymentStatus(value: unknown): PaymentStatus {
  return value === 'lunas' ? 'lunas' : 'belum_lunas';
}

function coercePaymentStep(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, Math.trunc(n)));
}

function coerceMoney(value: unknown): number {
  const raw = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  const digits = raw.replace(/[^\d]/g, '');
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function normalizePayments(value: unknown): PaymentRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const step = coercePaymentStep(obj.step);
      const amount = typeof obj.amount === 'number' ? obj.amount : Number(obj.amount);
      const date = typeof obj.date === 'string' ? obj.date : null;
      if (step < 1 || step > 5) return null;
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return { step, amount, date };
    })
    .filter((v): v is PaymentRow => !!v)
    .sort((a, b) => a.step - b.step);
}

function normalizeRow(raw: unknown): TransaksiRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const invoice = typeof obj.invoice === 'string' ? obj.invoice : '';
  if (!id || !invoice) return null;

  const customerName = typeof obj.customerName === 'string' ? obj.customerName : 'Umum';
  const date = typeof obj.date === 'string' ? obj.date : null;
  const paymentStatus = coercePaymentStatus(obj.paymentStatus);
  const paymentStep = coercePaymentStep(obj.paymentStep);
  const total = typeof obj.total === 'number' ? obj.total : Number(obj.total);
  const paymentDue = typeof obj.paymentDue === 'number' ? obj.paymentDue : Number(obj.paymentDue ?? total);
  const paymentPaid = typeof obj.paymentPaid === 'number' ? obj.paymentPaid : Number(obj.paymentPaid);
  const paymentRemaining =
    typeof obj.paymentRemaining === 'number' ? obj.paymentRemaining : Number(obj.paymentRemaining ?? (paymentDue - paymentPaid));
  const payments = normalizePayments(obj.payments);

  return {
    id,
    invoice,
    date,
    customerName,
    paymentStatus,
    paymentStep,
    total: Number.isFinite(total) ? total : 0,
    paymentDue: Number.isFinite(paymentDue) ? paymentDue : 0,
    paymentPaid: Number.isFinite(paymentPaid) ? paymentPaid : 0,
    paymentRemaining: Number.isFinite(paymentRemaining) ? paymentRemaining : 0,
    payments,
  };
}

export default function PaymentStatusPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [selected, setSelected] = useState<TransaksiRow | null>(null);
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('belum_lunas');
  const [formPaymentStep, setFormPaymentStep] = useState<number>(1);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');

  const listQuery = useQuery({
    queryKey: ['transaksi', 'payment-status'],
    queryFn: async (): Promise<TransaksiRow[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data transaksi'));
      if (!Array.isArray(payload)) return [];
      return (payload as unknown[])
        .map(normalizeRow)
        .filter((v): v is TransaksiRow => !!v);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, paymentStatus, paymentStep, amount, date }: { id: string; paymentStatus: PaymentStatus; paymentStep: number; amount: number; date: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          paymentStep,
          payment: {
            step: paymentStep,
            amount,
            date,
          },
        }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah status pembayaran'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Status pembayaran berhasil diperbarui');
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaksi'] }),
        queryClient.invalidateQueries({ queryKey: ['transaksi', 'payment-status'] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status pembayaran');
    },
  });

  const filtered = useMemo(() => {
    const all = listQuery.data ?? [];
    const q = search.toLowerCase().trim();
    return all.filter((t) => {
      if (statusFilter !== 'all' && t.paymentStatus !== statusFilter) return false;
      if (!q) return true;
      return t.invoice.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q);
    });
  }, [listQuery.data, search, statusFilter]);

  const openEdit = (row: TransaksiRow) => {
    setSelected(row);
    const defaultStep = row.paymentStep > 0 ? row.paymentStep : 1;
    setFormPaymentStep(defaultStep);

    const existing = row.payments.find((p) => p.step === defaultStep);
    const isPelunasan = defaultStep === 5;
    const remaining = Math.max(0, Math.trunc(row.paymentRemaining));

    setFormPaymentStatus(isPelunasan ? 'lunas' : row.paymentStatus);
    setFormAmount(
      isPelunasan ? String(remaining) : existing ? String(Math.trunc(existing.amount)) : ''
    );
    setFormDate(existing?.date ? String(existing.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!selected) return;
    const isPelunasan = formPaymentStep === 5;
    const remaining = Math.max(0, Math.trunc(selected.paymentRemaining));
    const amount = isPelunasan ? remaining : coerceMoney(formAmount);
    if (!isPelunasan && amount <= 0) {
      toast.error('Nominal pembayaran wajib diisi');
      return;
    }
    if (!formDate.trim()) {
      toast.error('Tanggal pembayaran wajib diisi');
      return;
    }

    await updateMutation.mutateAsync({
      id: selected.id,
      paymentStatus: isPelunasan ? 'lunas' : formPaymentStatus,
      paymentStep: formPaymentStep,
      amount,
      date: formDate,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Status Pembayaran</h1>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-sm w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari invoice / pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full sm:w-56">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | PaymentStatus)}>
                <SelectTrigger><SelectValue placeholder="Filter status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {listQuery.isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Memuat data...</div>
          ) : listQuery.isError ? (
            <div className="p-6 text-center text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data'}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada data</div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">{t.invoice}</p>
                  <p className="text-xs text-muted-foreground">{t.date || '-'} • {t.customerName}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span>Tagihan: {formatRupiah(t.paymentDue)}</span>
                    <span className="mx-2">•</span>
                    <span>Sudah dibayar: {formatRupiah(t.paymentPaid)}</span>
                    <span className="mx-2">•</span>
                    <span>Sisa: {formatRupiah(t.paymentRemaining)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    {paymentStepOptions.find((o) => o.value === t.paymentStep)?.label || '-'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-md ${t.paymentStatus === 'lunas' ? 'bg-velcrone-success-light text-velcrone-success' : 'bg-velcrone-warning-light text-velcrone-warning'}`}>
                    {t.paymentStatus === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                    <Pencil size={16} className="mr-2" /> Ubah
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Ubah Status Pembayaran</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>
                <p className="font-medium text-foreground">{selected.invoice}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Tagihan</p>
                  <p className="text-sm font-medium text-foreground">{formatRupiah(selected.paymentDue)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Sudah dibayar</p>
                  <p className="text-sm font-medium text-foreground">{formatRupiah(selected.paymentPaid)}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Sisa</p>
                  <p className="text-sm font-medium text-foreground">{formatRupiah(selected.paymentRemaining)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Pembayaran</Label>
                  <Select
                    value={String(formPaymentStep)}
                    onValueChange={(v) => {
                      const step = coercePaymentStep(v);
                      setFormPaymentStep(step);
                      const existing = selected.payments.find((p) => p.step === step);
                      if (step === 5) {
                        setFormPaymentStatus('lunas');
                        setFormAmount(String(Math.max(0, Math.trunc(selected.paymentRemaining))));
                      } else {
                        setFormAmount(existing ? String(Math.trunc(existing.amount)) : '');
                      }
                      setFormDate(existing?.date ? String(existing.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
                    }}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih pembayaran" /></SelectTrigger>
                    <SelectContent>
                      {paymentStepOptions.filter((o) => o.value !== 0).map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={formPaymentStatus} onValueChange={(v) => setFormPaymentStatus(coercePaymentStatus(v))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nominal Pembayaran</Label>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    placeholder="Masukkan nominal (contoh: 500000)"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    disabled={formPaymentStep === 5}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Akan mengurangi sisa tagihan otomatis.</p>
                </div>

                <div>
                  <Label>Tanggal Pembayaran</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-medium text-foreground mb-2">Riwayat Pembayaran</p>
                {selected.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada pembayaran</p>
                ) : (
                  <div className="space-y-2">
                    {selected.payments.map((p) => (
                      <div key={p.step} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{paymentStepOptions.find((o) => o.value === p.step)?.label || `Pembayaran ke-${p.step}`}</span>
                        <span className="text-foreground">{formatRupiah(p.amount)}{p.date ? ` • ${p.date}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setSelected(null)} disabled={updateMutation.isPending}>Batal</Button>
                <Button onClick={submit} disabled={updateMutation.isPending} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
