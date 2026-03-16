import { useState } from 'react';
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
import { Search, Plus, Pencil, Trash2, Truck } from 'lucide-react';

type Pemasok = {
  id: string;
  namaPerusahaan: string;
  kontakPerson: string | null;
  noTelepon: string | null;
  alamat: string | null;
  jenisProduk: string | null;
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

export default function SuppliersPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pemasok | null>(null);
  const [deleting, setDeleting] = useState<Pemasok | null>(null);
  const [form, setForm] = useState({
    id: '',
    namaPerusahaan: '',
    kontakPerson: '',
    noTelepon: '',
    alamat: '',
    jenisProduk: '',
  });

  const listQuery = useQuery({
    queryKey: ['pemasok'],
    queryFn: async (): Promise<Pemasok[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pemasok`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data pemasok'));
      return Array.isArray(payload) ? (payload as Pemasok[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Pemasok) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pemasok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah pemasok'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pemasok berhasil ditambahkan');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['pemasok'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah pemasok');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Pemasok> }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pemasok/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah pemasok'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pemasok berhasil diubah');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['pemasok'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah pemasok');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pemasok/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus pemasok'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pemasok berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['pemasok'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus pemasok');
    },
  });

  const data = listQuery.data || [];
  const filtered = data.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.id.toLowerCase().includes(q) ||
      (s.namaPerusahaan || '').toLowerCase().includes(q) ||
      (s.kontakPerson || '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      id: '',
      namaPerusahaan: '',
      kontakPerson: '',
      noTelepon: '',
      alamat: '',
      jenisProduk: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (s: Pemasok) => {
    setEditing(s);
    setForm({
      id: s.id,
      namaPerusahaan: s.namaPerusahaan || '',
      kontakPerson: s.kontakPerson || '',
      noTelepon: s.noTelepon || '',
      alamat: s.alamat || '',
      jenisProduk: s.jenisProduk || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const id = form.id.trim();
    const namaPerusahaan = form.namaPerusahaan.trim();
    if (!id) {
      toast.error('ID pemasok wajib diisi');
      return;
    }
    if (!namaPerusahaan) {
      toast.error('Nama perusahaan wajib diisi');
      return;
    }

    const payload: Pemasok = {
      id,
      namaPerusahaan,
      kontakPerson: form.kontakPerson.trim() || null,
      noTelepon: form.noTelepon.trim() || null,
      alamat: form.alamat.trim() || null,
      jenisProduk: form.jenisProduk.trim() || null,
    };

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        body: {
          namaPerusahaan: payload.namaPerusahaan,
          kontakPerson: payload.kontakPerson,
          noTelepon: payload.noTelepon,
          alamat: payload.alamat,
          jenisProduk: payload.jenisProduk,
        },
      });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Data Pemasok</h1>
        <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90">
          <Plus size={18} className="mr-2" /> Tambah Pemasok
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Pemasok..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {listQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat data pemasok...</div>
          ) : listQuery.isError ? (
            <div className="text-sm text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data pemasok'}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Tidak ada data pemasok.</div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="bg-velcrone-surface rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg velcrone-card-gradient flex items-center justify-center text-primary-foreground">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{s.namaPerusahaan}</p>
                      <p className="text-xs text-muted-foreground">{s.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                      disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting(s)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Kontak: {s.kontakPerson || '-'}</p>
                  <p>Tel: {s.noTelepon || '-'}</p>
                  <p>Produk: {s.jenisProduk || '-'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Tambah'} Pemasok</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID Pemasok</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                disabled={!!editing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nama Perusahaan</Label>
              <Input value={form.namaPerusahaan} onChange={(e) => setForm((f) => ({ ...f, namaPerusahaan: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Kontak Person</Label>
              <Input value={form.kontakPerson} onChange={(e) => setForm((f) => ({ ...f, kontakPerson: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>No. Telepon</Label>
              <Input value={form.noTelepon} onChange={(e) => setForm((f) => ({ ...f, noTelepon: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Jenis Produk/Jasa</Label>
              <Input value={form.jenisProduk} onChange={(e) => setForm((f) => ({ ...f, jenisProduk: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>
                Batal
              </Button>
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
            <AlertDialogTitle>Hapus pemasok?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Tindakan ini akan menghapus pemasok "${deleting.namaPerusahaan}" (${deleting.id}).` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
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
