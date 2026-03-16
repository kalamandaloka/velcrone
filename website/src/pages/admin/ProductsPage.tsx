import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatRupiah } from '@/constants/dummy';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const UKURAN_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
type Ukuran = (typeof UKURAN_OPTIONS)[number];

type Barang = {
  kode: string;
  nama: string;
  kategori: string | null;
  ukuran: Ukuran[];
  hargaBeli: number;
  hargaJual: number;
  diskon: number;
};

type KategoriBarang = {
  id: number;
  nama: string;
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

function normalizeExcelKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function coerceExcelString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function coerceExcelNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Barang | null>(null);
  const [deleting, setDeleting] = useState<Barang | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    sizes: ['M'] as Ukuran[],
    buyPrice: '',
    sellPrice: '',
    discount: '0',
  });

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['barang'],
    queryFn: async (): Promise<Barang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, 'Gagal memuat data barang'));
      }
      const rows: unknown[] = Array.isArray(payload) ? payload : [];
      return rows.map((row) => {
        const obj: Record<string, unknown> = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        const kategori = typeof obj.kategori === 'string' ? obj.kategori : null;
        const ukuranValues: string[] = Array.isArray(obj.ukuran)
          ? obj.ukuran.map((v) => String(v).trim().toUpperCase())
          : String(obj.ukuran ?? '')
              .split(',')
              .map((v) => v.trim().toUpperCase())
              .filter(Boolean);
        const ukuran = ukuranValues.filter((s): s is Ukuran => (UKURAN_OPTIONS as readonly string[]).includes(s));
        return {
          kode: String(obj.kode ?? ''),
          nama: String(obj.nama ?? ''),
          kategori,
          ukuran: ukuran.length ? ukuran : ['M'],
          hargaBeli: Number(obj.hargaBeli ?? 0),
          hargaJual: Number(obj.hargaJual ?? 0),
          diskon: Number(obj.diskon ?? 0),
        };
      });
    },
  });

  const kategoriQuery = useQuery({
    queryKey: ['kategori-barang'],
    queryFn: async (): Promise<KategoriBarang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/kategori-barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat kategori'));
      return Array.isArray(payload) ? (payload as KategoriBarang[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Barang) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah barang'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Barang berhasil ditambahkan');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah barang');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ kode, body }: { kode: string; body: Partial<Omit<Barang, 'kode'>> }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang/${encodeURIComponent(kode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah barang'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Barang berhasil diubah');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah barang');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (kode: string) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang/${encodeURIComponent(kode)}`, {
        method: 'DELETE',
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus barang'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Barang berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus barang');
    },
  });

  const data = listQuery.data || [];

  const filtered = data.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.kode.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', name: '', category: '', sizes: ['M'], buyPrice: '', sellPrice: '', discount: '0' });
    setDialogOpen(true);
  };

  const openEdit = (p: Barang) => {
    setEditing(p);
    setForm({
      code: p.kode,
      name: p.nama,
      category: p.kategori || '',
      sizes: Array.isArray(p.ukuran) && p.ukuran.length ? p.ukuran : ['M'],
      buyPrice: String(p.hargaBeli),
      sellPrice: String(p.hargaJual),
      discount: String(p.diskon),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) return;

    const hargaBeli = Number(form.buyPrice || 0);
    const hargaJual = Number(form.sellPrice || 0);
    const diskon = Number(form.discount || 0);

    const sizes = (form.sizes || []).filter((s) => UKURAN_OPTIONS.includes(s));
    if (sizes.length === 0) {
      toast.error('Minimal pilih 1 ukuran');
      return;
    }
    if (Number.isNaN(hargaBeli)) {
      toast.error('Harga beli tidak valid');
      return;
    }
    if (Number.isNaN(hargaJual)) {
      toast.error('Harga jual tidak valid');
      return;
    }
    if (Number.isNaN(diskon)) {
      toast.error('Diskon tidak valid');
      return;
    }

    const parsed: Barang = {
      kode: form.code.trim(),
      nama: form.name.trim(),
      kategori: form.category.trim() ? form.category.trim() : null,
      ukuran: sizes,
      hargaBeli,
      hargaJual,
      diskon,
    };

    if (editing) {
      await updateMutation.mutateAsync({
        kode: editing.kode,
        body: {
          nama: parsed.nama,
          kategori: parsed.kategori,
          ukuran: parsed.ukuran,
          hargaBeli: parsed.hargaBeli,
          hargaJual: parsed.hargaJual,
          diskon: parsed.diskon,
        },
      });
    } else {
      await createMutation.mutateAsync(parsed);
    }
  };

  const requestDelete = (barang: Barang) => {
    setDeleting(barang);
  };

  const downloadTemplateExcel = () => {
    const rows = [
      {
        kode: 'VLC-001',
        nama: 'Nama Produk',
        kategori: 'Kategori (opsional)',
        ukuran: 'M',
        hargaBeli: 0,
        hargaJual: 0,
        diskon: 0,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ['kode', 'nama', 'kategori', 'ukuran', 'hargaBeli', 'hargaJual', 'diskon'],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template');
    XLSX.writeFile(wb, 'template_produk_velcrone.xlsx');
  };

  const downloadDataExcel = () => {
    const rows = (listQuery.data || []).map((p) => ({
      kode: p.kode,
      nama: p.nama,
      kategori: p.kategori || '',
      ukuran: p.ukuran.join(', '),
      hargaBeli: p.hargaBeli,
      hargaJual: p.hargaJual,
      diskon: p.diskon,
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ['kode', 'nama', 'kategori', 'ukuran', 'hargaBeli', 'hargaJual', 'diskon'],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'produk');
    XLSX.writeFile(wb, 'data_produk_velcrone.xlsx');
  };

  const importFromExcel = async (file: File) => {
    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error('File Excel tidak memiliki sheet');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rawRows.length) {
        toast.error('File Excel kosong');
        return;
      }

      const existingCodes = new Set((listQuery.data || []).map((p) => p.kode.toLowerCase()));
      const errors: string[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const normalized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          normalized[normalizeExcelKey(k)] = v;
        }

        const kode = coerceExcelString(
          normalized.kode ?? normalized.code ?? normalized.kode_barang ?? normalized.kd_barang
        ).trim();
        const nama = coerceExcelString(
          normalized.nama ?? normalized.name ?? normalized.nama_barang ?? normalized.nm_barang
        ).trim();
        const kategoriRaw = coerceExcelString(normalized.kategori ?? normalized.category).trim();
        const kategori = kategoriRaw ? kategoriRaw : null;
        const ukuranCell = coerceExcelString(normalized.ukuran ?? normalized.size).trim().toUpperCase();
        const ukuranParts = ukuranCell
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const ukuran = ukuranParts.filter((s): s is Ukuran => (UKURAN_OPTIONS as readonly string[]).includes(s));
        const hargaBeli = coerceExcelNumber(normalized.hargabeli ?? normalized.harga_beli ?? normalized.buyprice, 0);
        const hargaJual = coerceExcelNumber(normalized.hargajual ?? normalized.harga_jual ?? normalized.sellprice, 0);
        const diskon = coerceExcelNumber(normalized.diskon ?? normalized.discount, 0);

        if (!kode || !nama) {
          failCount++;
          errors.push(`Baris ${i + 2}: kode/nama wajib diisi`);
          continue;
        }
        if (ukuran.length === 0) {
          failCount++;
          errors.push(`Baris ${i + 2} (${kode}): ukuran wajib diisi (S, M, L, XL, XXL, XXXL)`);
          continue;
        }

        const payload: Barang = {
          kode,
          nama,
          kategori,
          ukuran,
          hargaBeli,
          hargaJual,
          diskon,
        };

        try {
          const exists = existingCodes.has(kode.toLowerCase());
          if (exists) {
            const response = await fetch(`${apiBaseUrl}/api/v1/barang/${encodeURIComponent(kode)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nama: payload.nama,
                kategori: payload.kategori,
                ukuran: payload.ukuran,
                hargaBeli: payload.hargaBeli,
                hargaJual: payload.hargaJual,
                diskon: payload.diskon,
              }),
            });
            const responsePayload = await parseJsonSafe(response);
            if (!response.ok) throw new Error(getApiErrorMessage(responsePayload, 'Gagal update'));
          } else {
            const response = await fetch(`${apiBaseUrl}/api/v1/barang`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const responsePayload = await parseJsonSafe(response);
            if (!response.ok) throw new Error(getApiErrorMessage(responsePayload, 'Gagal tambah'));
            existingCodes.add(kode.toLowerCase());
          }

          successCount++;
        } catch (err) {
          failCount++;
          errors.push(
            `Baris ${i + 2} (${kode}): ${err instanceof Error ? err.message : 'Gagal memproses'}`
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['barang'] });

      if (!failCount) {
        toast.success(`Import selesai: ${successCount} produk berhasil`);
        return;
      }

      const previewErrors = errors.slice(0, 5).join('\n');
      toast.error(`Import selesai: ${successCount} berhasil, ${failCount} gagal\n${previewErrors}`);
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Data Barang</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void importFromExcel(file);
            }}
          />
          <Button
            variant="outline"
            onClick={downloadTemplateExcel}
            disabled={listQuery.isLoading || isImporting}
          >
            <Download size={18} className="mr-2" /> Template Excel
          </Button>
          <Button
            variant="outline"
            onClick={downloadDataExcel}
            disabled={listQuery.isLoading || isImporting}
          >
            <Download size={18} className="mr-2" /> Download Data
          </Button>
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={listQuery.isLoading || isImporting}
          >
            <Upload size={18} className="mr-2" /> {isImporting ? 'Mengimpor...' : 'Upload Excel'}
          </Button>
          <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90">
            <Plus size={18} className="mr-2" /> Tambah Barang
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Barang..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Kode</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Ukuran</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Harga Produksi</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Harga Jual</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Diskon</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : listQuery.isError ? (
                <tr><td colSpan={8} className="p-6 text-center text-destructive">{listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data barang'}</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                pageData.map(p => (
                  <tr key={p.kode} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{p.kode}</td>
                    <td className="p-3 font-medium text-foreground">{p.nama}</td>
                    <td className="p-3 text-muted-foreground">{p.kategori || '-'}</td>
                    <td className="p-3 text-center tabular-nums">{p.ukuran.join(', ')}</td>
                    <td className="p-3 text-right tabular-nums">{formatRupiah(p.hargaBeli)}</td>
                    <td className="p-3 text-right tabular-nums">{formatRupiah(p.hargaJual)}</td>
                    <td className="p-3 text-right tabular-nums">{p.diskon}%</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => requestDelete(p)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} dari {filtered.length}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-md text-sm ${page === i + 1 ? 'velcrone-gradient text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Data Barang</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kode Barang</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} disabled={!!editing} className="mt-1" /></div>
              <div><Label>Nama Barang</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Input list="kategori_barang_options" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1" />
              <datalist id="kategori_barang_options">
                {(kategoriQuery.data || []).map(k => (
                  <option key={k.id} value={k.nama} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Ukuran</Label>
              <div className="mt-2 flex flex-wrap gap-4">
                {UKURAN_OPTIONS.map((s) => {
                  const checked = form.sizes.includes(s);
                  return (
                    <label key={s} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const nextChecked = v === true;
                          setForm((f) => ({
                            ...f,
                            sizes: nextChecked
                              ? Array.from(new Set([...f.sizes, s]))
                              : f.sizes.filter((x) => x !== s),
                          }));
                        }}
                      />
                      <span>{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Harga Produksi</Label><Input type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} className="mt-1" /></div>
              <div><Label>Harga Jual</Label><Input type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Diskon (%)</Label><Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Hapus barang "${deleting.nama}" (${deleting.kode})?` : 'Hapus barang ini?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleting) return;
                deleteMutation.mutate(deleting.kode);
              }}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
