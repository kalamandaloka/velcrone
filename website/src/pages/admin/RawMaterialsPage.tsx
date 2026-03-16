import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

type MaterialCategory = 'kain' | 'benang' | 'kancing' | 'zipper' | 'velcro' | 'label';
type ProductType = 'hoodie' | 't-shirt' | 'jacket' | 'hat';
type MaterialStatus = 'normal' | 'low' | 'critical';

type Bahan = {
  kode: string;
  nama: string;
  kategori: MaterialCategory | string | null;
  jenisProduk: ProductType | string | null;
  stok: number;
  satuan: string;
  minStok: number;
};

type BahanRow = Bahan & { status: MaterialStatus };

const categories: MaterialCategory[] = ['kain', 'benang', 'kancing', 'zipper', 'velcro', 'label'];
const productTypes: ProductType[] = ['hoodie', 't-shirt', 'jacket', 'hat'];

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

function computeStatus(stok: number, minStok: number): MaterialStatus {
  if (stok <= minStok * 0.5) return 'critical';
  if (stok <= minStok) return 'low';
  return 'normal';
}

function getMaterialStatusColor(status: MaterialStatus) {
  if (status === 'critical') return { bg: 'bg-destructive/10', text: 'text-destructive' };
  if (status === 'low') return { bg: 'bg-velcrone-warning-light', text: 'text-velcrone-warning' };
  return { bg: 'bg-velcrone-success-light', text: 'text-velcrone-success' };
}

export default function RawMaterialsPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BahanRow | null>(null);
  const [deleting, setDeleting] = useState<BahanRow | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [form, setForm] = useState({
    kode: '',
    nama: '',
    kategori: 'kain' as MaterialCategory,
    jenisProduk: 'hoodie' as ProductType,
    stok: '',
    satuan: 'm',
    minStok: '',
  });

  const listQuery = useQuery({
    queryKey: ['bahan'],
    queryFn: async (): Promise<Bahan[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data stok bahan'));
      return Array.isArray(payload) ? (payload as Bahan[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Bahan) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah stok bahan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Bahan berhasil ditambahkan');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['bahan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah stok bahan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ kode, body }: { kode: string; body: Partial<Bahan> }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan/${encodeURIComponent(kode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah stok bahan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Bahan berhasil diubah');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['bahan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah stok bahan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (kode: string) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/bahan/${encodeURIComponent(kode)}`, {
        method: 'DELETE',
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus bahan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Bahan berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['bahan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus bahan');
    },
  });

  const rows: BahanRow[] = useMemo(() => {
    const data = listQuery.data || [];
    return data.map((b) => ({
      ...b,
      status: computeStatus(Number(b.stok) || 0, Number(b.minStok) || 0),
    }));
  }, [listQuery.data]);

  const filtered = rows.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || m.nama.toLowerCase().includes(q) || m.kode.toLowerCase().includes(q);
    const matchType = filterType === 'all' || (m.jenisProduk || '') === filterType;
    return matchSearch && matchType;
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);
  const criticalCount = rows.filter((m) => m.status === 'critical').length;

  const openAdd = () => {
    setEditing(null);
    setForm({ kode: '', nama: '', kategori: 'kain', jenisProduk: 'hoodie', stok: '', satuan: 'm', minStok: '' });
    setDialogOpen(true);
  };

  const openEdit = (m: BahanRow) => {
    setEditing(m);
    setForm({
      kode: m.kode,
      nama: m.nama,
      kategori: (m.kategori as MaterialCategory) || 'kain',
      jenisProduk: (m.jenisProduk as ProductType) || 'hoodie',
      stok: String(m.stok),
      satuan: m.satuan,
      minStok: String(m.minStok),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const kode = form.kode.trim();
    const nama = form.nama.trim();
    if (!kode) {
      toast.error('Kode wajib diisi');
      return;
    }
    if (!nama) {
      toast.error('Nama bahan wajib diisi');
      return;
    }

    const stok = Number(form.stok);
    const minStok = Number(form.minStok);
    if (Number.isNaN(stok) || Number.isNaN(minStok)) {
      toast.error('Stok dan stok minimum harus angka');
      return;
    }

    const payload: Bahan = {
      kode,
      nama,
      kategori: form.kategori,
      jenisProduk: form.jenisProduk,
      stok,
      satuan: form.satuan.trim() || 'pcs',
      minStok,
    };

    if (editing) {
      updateMutation.mutate({
        kode: editing.kode,
        body: {
          nama: payload.nama,
          kategori: payload.kategori,
          jenisProduk: payload.jenisProduk,
          stok: payload.stok,
          satuan: payload.satuan,
          minStok: payload.minStok,
        },
      });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stok Bahan</h1>
        <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90"><Plus size={18} className="mr-2" /> Tambah Bahan</Button>
      </div>

      {criticalCount > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Stok Kritis!</p>
            <p className="text-xs text-muted-foreground">{criticalCount} bahan di bawah stok minimum.</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Bahan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Jenis Produk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {productTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Kode</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nama Bahan</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Jenis Produk</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Stok</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Min. Stok</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-sm text-muted-foreground">Memuat data...</td>
                </tr>
              ) : listQuery.isError ? (
                <tr>
                  <td colSpan={8} className="p-4 text-sm text-destructive">
                    {listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data'}
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-sm text-muted-foreground">Tidak ada data.</td>
                </tr>
              ) : (
                pageData.map((m) => {
                  const sc = getMaterialStatusColor(m.status);
                  return (
                    <tr key={m.kode} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{m.kode}</td>
                      <td className="p-3 font-medium text-foreground">{m.nama}</td>
                      <td className="p-3 capitalize text-muted-foreground">{m.kategori || '-'}</td>
                      <td className="p-3 capitalize text-muted-foreground">{m.jenisProduk || '-'}</td>
                      <td className="p-3 text-right tabular-nums">{m.stok} {m.satuan}</td>
                      <td className="p-3 text-right tabular-nums">{m.minStok} {m.satuan}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${sc.bg} ${sc.text}`}>{m.status}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(m)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Stok Bahan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kode</Label><Input value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))} disabled={!!editing} className="mt-1" /></div>
              <div><Label>Nama Bahan</Label><Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="mt-1" /></div>
            </div>
            <div>
              <Label>Kategori Bahan</Label>
              <Select value={form.kategori} onValueChange={(v: MaterialCategory) => setForm(f => ({ ...f, kategori: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jenis Produk</Label>
              <Select value={form.jenisProduk} onValueChange={(v: ProductType) => setForm(f => ({ ...f, jenisProduk: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{productTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Stok</Label><Input type="number" value={form.stok} onChange={e => setForm(f => ({ ...f, stok: e.target.value }))} className="mt-1" /></div>
              <div><Label>Satuan</Label><Input value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))} className="mt-1" /></div>
              <div><Label>Stok Minimum</Label><Input type="number" value={form.minStok} onChange={e => setForm(f => ({ ...f, minStok: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>Batal</Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="velcrone-gradient text-primary-foreground hover:opacity-90"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus bahan?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Tindakan ini akan menghapus bahan "${deleting.nama}" (${deleting.kode}).` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.kode)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
