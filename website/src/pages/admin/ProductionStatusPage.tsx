import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Search, Pencil } from 'lucide-react';

type ProductionStatus =
  | 'order_masuk'
  | 'quotation'
  | 'persetujuan_desain'
  | 'sampel'
  | 'pembelian_material'
  | 'pembuatan_pola'
  | 'cutting'
  | 'print_bordir'
  | 'sewing'
  | 'finishing'
  | 'qc'
  | 'packing'
  | 'shipping'
  | 'diterima_konsumen'
  | 'selesai';

type TransaksiRow = {
  id: string;
  invoice: string;
  date: string | null;
  customerName: string;
  productionStatus: ProductionStatus;
};

const productionOptions: Array<{ value: ProductionStatus; label: string }> = [
  { value: 'order_masuk', label: 'Order Masuk' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'persetujuan_desain', label: 'Persetujuan Desain' },
  { value: 'sampel', label: 'Sampel (Opsional)' },
  { value: 'pembelian_material', label: 'Pembelian Material' },
  { value: 'pembuatan_pola', label: 'Pembuatan Pola' },
  { value: 'cutting', label: 'Cutting' },
  { value: 'print_bordir', label: 'Print/Bordir' },
  { value: 'sewing', label: 'Sewing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'qc', label: 'QC' },
  { value: 'packing', label: 'Packing' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'diterima_konsumen', label: 'Diterima Konsumen' },
  { value: 'selesai', label: 'Selesai' },
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

function coerceProductionStatus(value: unknown): ProductionStatus {
  const v = typeof value === 'string' ? value : '';
  const found = productionOptions.find((o) => o.value === v);
  return found ? found.value : 'order_masuk';
}

function getProductionBadgeClass(status: ProductionStatus): string {
  if (status === 'order_masuk') return 'bg-destructive text-destructive-foreground';
  if (status === 'selesai') return 'bg-velcrone-success-light text-velcrone-success';
  return 'bg-muted text-muted-foreground';
}

function normalizeRow(raw: unknown): TransaksiRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const invoice = typeof obj.invoice === 'string' ? obj.invoice : '';
  if (!id || !invoice) return null;

  const customerName = typeof obj.customerName === 'string' ? obj.customerName : 'Umum';
  const date = typeof obj.date === 'string' ? obj.date : null;
  const productionStatus = coerceProductionStatus(obj.productionStatus);

  return { id, invoice, date, customerName, productionStatus };
}

export default function ProductionStatusPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ProductionStatus>('all');
  const [selected, setSelected] = useState<TransaksiRow | null>(null);
  const [formStatus, setFormStatus] = useState<ProductionStatus>('order_masuk');
  const [formDate, setFormDate] = useState<string>('');

  const listQuery = useQuery({
    queryKey: ['transaksi', 'production-status'],
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
    mutationFn: async ({ id, productionStatus, productionDate }: { id: string; productionStatus: ProductionStatus; productionDate: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus, productionDate }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah status produksi'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Status produksi berhasil diperbarui');
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaksi'] }),
        queryClient.invalidateQueries({ queryKey: ['transaksi', 'production-status'] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status produksi');
    },
  });

  const filtered = useMemo(() => {
    const all = listQuery.data ?? [];
    const q = search.toLowerCase().trim();
    return all.filter((t) => {
      if (filterStatus !== 'all' && t.productionStatus !== filterStatus) return false;
      if (!q) return true;
      return t.invoice.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q);
    });
  }, [listQuery.data, search, filterStatus]);

  const openEdit = (row: TransaksiRow) => {
    setSelected(row);
    setFormStatus(row.productionStatus);
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!selected) return;
    if (!formDate.trim()) {
      toast.error('Tanggal status wajib diisi');
      return;
    }
    await updateMutation.mutateAsync({ id: selected.id, productionStatus: formStatus, productionDate: formDate });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Status Produksi</h1>
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

            <div className="w-full sm:w-64">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | ProductionStatus)}>
                <SelectTrigger><SelectValue placeholder="Filter status produksi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {productionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
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
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-md ${getProductionBadgeClass(t.productionStatus)}`}>
                    {productionOptions.find((o) => o.value === t.productionStatus)?.label || 'Order Masuk'}
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
          <DialogHeader><DialogTitle>Ubah Status Produksi</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>
                <p className="font-medium text-foreground">{selected.invoice}</p>
              </div>

              <div>
                <Label>Status Produksi</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProductionStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih status produksi" /></SelectTrigger>
                  <SelectContent>
                    {productionOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tanggal Status</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
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
