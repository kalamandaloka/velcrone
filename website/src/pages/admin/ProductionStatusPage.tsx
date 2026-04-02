import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Search } from 'lucide-react';

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

type BarangRow = {
  kode: string;
  kategori: string | null;
  jenis: string[];
};

type TransaksiRow = {
  id: string;
  invoice: string;
  date: string | null;
  customerName: string;
  status: TransaksiStatus;
  productionStatus: ProductionStatus;
  spkDetail: SpkDetailMap;
  items: TransaksiItem[];
};

const SPK_STEP_OPTIONS = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'] as const;
type SpkStepStatus = (typeof SPK_STEP_OPTIONS)[number];

const KANBAN_STAGES = ['ORDER', 'DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'] as const;
type KanbanStage = (typeof KANBAN_STAGES)[number];

type RawSpkRow = {
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
  sizes: { size: string; qty: number }[];
  status: TransaksiStatus;
  productionStatus: ProductionStatus;
  spkDetail: SpkDetailMap;
};

type SpkRowView = RawSpkRow & {
  deadlineDate: string | null;
  stage: KanbanStage;
};

type SpkDetailEntry = {
  stepStatus: string | null;
  deadlineDate: string | null;
};

type SpkDetailMap = Record<string, SpkDetailEntry>;

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
  const allowed: ProductionStatus[] = [
    'order_masuk',
    'quotation',
    'persetujuan_desain',
    'sampel',
    'pembelian_material',
    'pembuatan_pola',
    'cutting',
    'print_bordir',
    'sewing',
    'finishing',
    'qc',
    'packing',
    'shipping',
    'diterima_konsumen',
    'selesai',
  ];
  return (allowed as string[]).includes(v) ? (v as ProductionStatus) : 'order_masuk';
}

function normalizeItems(value: unknown): TransaksiItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const productId = typeof obj.productId === 'string' ? obj.productId : '';
      const productName = typeof obj.productName === 'string' ? obj.productName : '';
      const ukuran = typeof obj.ukuran === 'string' ? obj.ukuran : '';
      const warna = typeof obj.warna === 'string' ? obj.warna : '';
      const qty = typeof obj.qty === 'number' ? obj.qty : Number(obj.qty);
      const price = typeof obj.price === 'number' ? obj.price : Number(obj.price);
      const subtotal = typeof obj.subtotal === 'number' ? obj.subtotal : Number(obj.subtotal);
      if (!productId || !productName) return null;
      return {
        productId,
        productName,
        ukuran,
        warna,
        qty: Number.isFinite(qty) ? qty : 0,
        price: Number.isFinite(price) ? price : 0,
        subtotal: Number.isFinite(subtotal) ? subtotal : 0,
      };
    })
    .filter((v): v is TransaksiItem => !!v);
}

function normalizeSpkDetail(value: unknown): SpkDetailMap {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const out: SpkDetailMap = {};
  for (const [key, raw] of Object.entries(obj)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const step = typeof row.stepStatus === 'string' ? row.stepStatus : null;
    const stepStatus = step && (SPK_STEP_OPTIONS as readonly string[]).includes(step) ? step : null;
    const deadlineDate = typeof row.deadlineDate === 'string' && row.deadlineDate.trim() ? row.deadlineDate.slice(0, 10) : null;
    out[key] = { stepStatus, deadlineDate };
  }
  return out;
}

function normalizeRow(raw: unknown): TransaksiRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const invoice = typeof obj.invoice === 'string' ? obj.invoice : '';
  if (!id || !invoice) return null;

  const customerName = typeof obj.customerName === 'string' ? obj.customerName : 'Umum';
  const date = typeof obj.date === 'string' ? obj.date : null;
  const status = typeof obj.status === 'string' ? (obj.status as TransaksiStatus) : 'pending';
  const productionStatus = coerceProductionStatus(obj.productionStatus);
  const items = normalizeItems(obj.items);
  const spkDetail = normalizeSpkDetail(obj.spkDetail);

  return { id, invoice, date, customerName, status, productionStatus, spkDetail, items };
}

function parseInvoiceParts(invoice: string): { trxPart: string; month: string; year: string } {
  const parts = String(invoice || '').split('/').map((p) => p.trim()).filter(Boolean);
  const trxPart = parts.find((p) => /^TRX-\d{3}$/i.test(p)) || 'TRX-000';
  const month = parts.length >= 2 && /^\d{2}$/.test(parts[parts.length - 2] || '') ? (parts[parts.length - 2] as string) : '01';
  const year = parts.length >= 1 && /^\d{4}$/.test(parts[parts.length - 1] || '') ? (parts[parts.length - 1] as string) : '1970';
  return { trxPart: trxPart.toUpperCase(), month, year };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export default function ProductionStatusPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

  const [search, setSearch] = useState('');
  const [selectedSpk, setSelectedSpk] = useState<SpkRowView | null>(null);

  const listQuery = useQuery({
    queryKey: ['transaksi', 'production-status'],
    queryFn: async (): Promise<RawSpkRow[]> => {
      const [transaksiRes, barangRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/transaksi`),
        fetch(`${apiBaseUrl}/api/v1/barang`),
      ]);

      const transaksiPayload = await parseJsonSafe(transaksiRes);
      if (!transaksiRes.ok) throw new Error(getApiErrorMessage(transaksiPayload, 'Gagal memuat data transaksi'));

      const barangPayload = await parseJsonSafe(barangRes);
      if (!barangRes.ok) throw new Error(getApiErrorMessage(barangPayload, 'Gagal memuat data barang'));

      const transaksis = Array.isArray(transaksiPayload)
        ? (transaksiPayload as unknown[])
            .map(normalizeRow)
            .filter((v): v is TransaksiRow => !!v)
            .filter((t) => t.status !== 'cancelled')
        : [];

      const barangs = Array.isArray(barangPayload) ? (barangPayload as unknown[]) : [];
      const barangMap = new Map<string, BarangRow>();
      for (const raw of barangs) {
        if (!raw || typeof raw !== 'object') continue;
        const obj = raw as Record<string, unknown>;
        const kode = typeof obj.kode === 'string' ? obj.kode : '';
        if (!kode) continue;
        const kategori = typeof obj.kategori === 'string' ? obj.kategori : null;
        const jenis = Array.isArray(obj.jenis) ? obj.jenis.filter((x): x is string => typeof x === 'string') : [];
        barangMap.set(kode, { kode, kategori, jenis });
      }

      const result: RawSpkRow[] = [];
      for (const t of transaksis) {
        const { trxPart, month, year } = parseInvoiceParts(t.invoice);

        const grouped = new Map<string, { productId: string; productName: string; warna: string; qty: number; sizes: Record<string, number> }>();
        for (const it of t.items) {
          const warna = (it.warna || '').trim();
          const key = `${it.productId}::${warna}`;
          const sizeKey = (it.ukuran || '').trim().toUpperCase();
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

          result.push({
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
            status: t.status,
            productionStatus: t.productionStatus,
            spkDetail: t.spkDetail,
          });
        }
      }

      return result;
    },
  });

  const spkRows = useMemo((): SpkRowView[] => {
    const all = listQuery.data ?? [];
    const q = search.toLowerCase().trim();
    const out: SpkRowView[] = [];
    for (const row of all) {
      const spkKey = `${row.productId}::${row.warnaProduk || ''}`;
      const detail = row.spkDetail[spkKey] || null;
      const deadlineDate = detail?.deadlineDate ?? null;
      const stepStatus = ((detail?.stepStatus ?? null) as SpkStepStatus | null) ?? 'DESIGN';
      const stage: KanbanStage = (KANBAN_STAGES as readonly string[]).includes(stepStatus)
        ? (stepStatus as KanbanStage)
        : 'DESIGN';
      const view: SpkRowView = { ...row, deadlineDate, stage };
      if (q) {
        const hay = `${row.invoice} ${row.spkNumber} ${row.customerName} ${row.productName}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      out.push(view);
    }
    return out;
  }, [listQuery.data, search]);

  const kanban = useMemo(() => {
    const map = new Map<KanbanStage, SpkRowView[]>();
    for (const s of KANBAN_STAGES) map.set(s, []);
    for (const row of spkRows) {
      const list = map.get(row.stage);
      if (list) list.push(row);
    }
    for (const s of KANBAN_STAGES) {
      const list = map.get(s);
      if (list) list.sort((a, b) => a.spkNumber.localeCompare(b.spkNumber));
    }
    return map;
  }, [spkRows]);

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
                placeholder="Cari SPK / invoice / pelanggan / produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Memuat data...</div>
        ) : listQuery.isError ? (
          <div className="p-6 text-center text-destructive">
            {listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data'}
          </div>
        ) : spkRows.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Tidak ada data</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {KANBAN_STAGES.map((stage) => {
                const rows = kanban.get(stage) || [];
                return (
                  <div key={stage} className="w-[280px] shrink-0">
                    <div className="rounded-lg border bg-background">
                      <div className="p-3 border-b flex items-center justify-between">
                        <p className="font-semibold text-sm text-foreground">{stage}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{rows.length}</span>
                      </div>
                      <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
                        {rows.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-2 py-2">Tidak ada SPK</p>
                        ) : (
                          rows.map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              className="w-full text-left rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors p-2"
                              onClick={() => setSelectedSpk(row)}
                            >
                              <p className="text-sm font-medium text-foreground truncate">{row.spkNumber}</p>
                              <p className="text-xs text-muted-foreground truncate">{row.invoice}</p>
                              <p className="text-xs text-muted-foreground truncate">{row.productName}{row.warnaProduk ? ` • ${row.warnaProduk}` : ''}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedSpk} onOpenChange={(open) => !open && setSelectedSpk(null)}>
        <DialogContent className="bg-card max-w-2xl">
          <DialogHeader><DialogTitle>Detail SPK</DialogTitle></DialogHeader>
          {selectedSpk && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor SPK</p>
                  <p className="font-medium text-foreground">{selectedSpk.spkNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Invoice</p>
                  <p className="font-medium text-foreground">{selectedSpk.invoice}</p>
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
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium text-foreground">{selectedSpk.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">{selectedSpk.stage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produk</p>
                  <p className="font-medium text-foreground">{selectedSpk.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warna</p>
                  <p className="font-medium text-foreground">{selectedSpk.warnaProduk || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <p className="font-medium text-foreground">{selectedSpk.kategoriProduk || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qty</p>
                  <p className="font-medium text-foreground">{`${selectedSpk.qty} pcs`}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Jenis</p>
                  <p className="font-medium text-foreground">{selectedSpk.jenisProduk.join(', ') || '-'}</p>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium text-foreground">Rincian Ukuran</p>
                </div>
                <div className="p-3">
                  {selectedSpk.sizes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada item</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedSpk.sizes.map((s) => (
                        <div key={s.size} className="rounded-md border bg-muted/20 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Ukuran</p>
                          <p className="text-sm font-medium text-foreground">{s.size}</p>
                          <p className="text-xs text-muted-foreground mt-1">Qty</p>
                          <p className="text-sm font-medium text-foreground">{s.qty}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSpk(null)}>Tutup</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
