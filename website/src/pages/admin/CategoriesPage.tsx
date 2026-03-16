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
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

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

export default function CategoriesPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KategoriBarang | null>(null);
  const [deleting, setDeleting] = useState<KategoriBarang | null>(null);
  const [nama, setNama] = useState('');

  const listQuery = useQuery({
    queryKey: ['kategori-barang'],
    queryFn: async (): Promise<KategoriBarang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/kategori-barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat kategori'));
      return Array.isArray(payload) ? (payload as KategoriBarang[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (nama: string) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/kategori-barang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah kategori'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Kategori berhasil ditambahkan');
      setDialogOpen(false);
      setNama('');
      await queryClient.invalidateQueries({ queryKey: ['kategori-barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kategori');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nama }: { id: number; nama: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/kategori-barang/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah kategori'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Kategori berhasil diubah');
      setDialogOpen(false);
      setNama('');
      await queryClient.invalidateQueries({ queryKey: ['kategori-barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah kategori');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/kategori-barang/${id}`, {
        method: 'DELETE',
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus kategori'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Kategori berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['kategori-barang'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus kategori');
    },
  });

  const openAdd = () => {
    setEditing(null);
    setNama('');
    setDialogOpen(true);
  };

  const openEdit = (k: KategoriBarang) => {
    setEditing(k);
    setNama(k.nama);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = nama.trim();
    if (!trimmed) return;
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, nama: trimmed });
    } else {
      await createMutation.mutateAsync(trimmed);
    }
  };

  const requestDelete = (k: KategoriBarang) => {
    setDeleting(k);
  };

  const data = (listQuery.data || []).filter(k => k.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kategori Barang</h1>
        <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90">
          <Plus size={18} className="mr-2" /> Tambah Kategori
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Kategori..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : listQuery.isError ? (
                <tr><td colSpan={3} className="p-6 text-center text-destructive">{listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat kategori'}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                data.map(k => (
                  <tr key={k.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{k.id}</td>
                    <td className="p-3 font-medium text-foreground">{k.nama}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(k)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => requestDelete(k)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} Kategori</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kategori</Label>
              <Input value={nama} onChange={e => setNama(e.target.value)} className="mt-1" />
            </div>
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
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Hapus kategori "${deleting.nama}"?` : 'Hapus kategori ini?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!deleting) return;
                deleteMutation.mutate(deleting.id);
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
