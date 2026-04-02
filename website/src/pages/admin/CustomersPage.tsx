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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

const CUSTOMER_CATEGORY_OPTIONS = [
  'umum',
  'reseller',
  'vip',
  'tiktok',
  'tokopedia',
  'shopee',
  'instagram',
  'website',
  'marketplace',
] as const;
type CustomerCategory = (typeof CUSTOMER_CATEGORY_OPTIONS)[number];

type Pelanggan = {
  id: string;
  nama: string;
  email: string | null;
  noTelepon: string | null;
  alamat: string | null;
  provinsiId?: string | null;
  provinsi?: string | null;
  kotaKabId?: string | null;
  kotaKab?: string | null;
  kecamatanId?: string | null;
  kecamatan?: string | null;
  kelurahanId?: string | null;
  kelurahan?: string | null;
  kodepos?: string | null;
  kategori: string | null;
  poin: number;
};

type WilayahItem = {
  id: string;
  name: string;
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

function coerceCategory(value: unknown): CustomerCategory {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

  const normalized = raw === 'markateplace' ? 'marketplace' : raw;
  if ((CUSTOMER_CATEGORY_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as CustomerCategory;
  }
  return 'umum';
}

function coerceWilayahList(payload: unknown): WilayahItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row) => {
      const obj: Record<string, unknown> =
        row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const id = typeof obj.id === 'string' ? obj.id : '';
      const name = typeof obj.name === 'string' ? obj.name : '';
      return { id, name };
    })
    .filter((x) => x.id && x.name);
}

export default function CustomersPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();
  const wilayahBaseUrl = `${import.meta.env.BASE_URL}wilayah/api`;

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message.trim()) return err.message;
    if (typeof err === 'string' && err.trim()) return err;
    return fallback;
  };

  const fetchWilayahPayload = async (relativePath: string) => {
    const url = `${wilayahBaseUrl}/${relativePath}`;
    const response = await fetch(url);
    const payload = await parseJsonSafe(response);
    if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
    return payload;
  };

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [editing, setEditing] = useState<Pelanggan | null>(null);
  const [deleting, setDeleting] = useState<Pelanggan | null>(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    alamat: '',
    provinsiId: '',
    provinsi: '',
    kotaKabId: '',
    kotaKab: '',
    kecamatanId: '',
    kecamatan: '',
    kelurahanId: '',
    kelurahan: '',
    kodepos: '',
    category: 'umum' as CustomerCategory,
    points: '0',
  });

  const listQuery = useQuery({
    queryKey: ['pelanggan'],
    queryFn: async (): Promise<Pelanggan[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data pelanggan'));
      return Array.isArray(payload) ? (payload as Pelanggan[]) : [];
    },
  });

  const provincesQuery = useQuery({
    queryKey: ['wilayah', 'provinces'],
    enabled: dialogOpen,
    queryFn: async (): Promise<WilayahItem[]> => {
      const payload = await fetchWilayahPayload('provinces.json');
      return coerceWilayahList(payload);
    },
  });

  const regenciesQuery = useQuery({
    queryKey: ['wilayah', 'regencies', form.provinsiId],
    enabled: dialogOpen && !!form.provinsiId,
    queryFn: async (): Promise<WilayahItem[]> => {
      const payload = await fetchWilayahPayload(`regencies/${encodeURIComponent(form.provinsiId)}.json`);
      return coerceWilayahList(payload);
    },
  });

  const districtsQuery = useQuery({
    queryKey: ['wilayah', 'districts', form.kotaKabId],
    enabled: dialogOpen && !!form.kotaKabId,
    queryFn: async (): Promise<WilayahItem[]> => {
      const payload = await fetchWilayahPayload(`districts/${encodeURIComponent(form.kotaKabId)}.json`);
      return coerceWilayahList(payload);
    },
  });

  const villagesQuery = useQuery({
    queryKey: ['wilayah', 'villages', form.kecamatanId],
    enabled: dialogOpen && !!form.kecamatanId,
    queryFn: async (): Promise<WilayahItem[]> => {
      const payload = await fetchWilayahPayload(`villages/${encodeURIComponent(form.kecamatanId)}.json`);
      return coerceWilayahList(payload);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Pelanggan) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah pelanggan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pelanggan berhasil ditambahkan');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['pelanggan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah pelanggan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Pelanggan> }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah pelanggan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pelanggan berhasil diubah');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['pelanggan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah pelanggan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus pelanggan'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Pelanggan berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['pelanggan'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus pelanggan');
    },
  });

  const data = (listQuery.data || []).filter(c => {
    const q = search.toLowerCase();
    return (
      c.nama.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.noTelepon || '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    setStep(1);
    setForm({
      id: `CUST-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      alamat: '',
      provinsiId: '',
      provinsi: '',
      kotaKabId: '',
      kotaKab: '',
      kecamatanId: '',
      kecamatan: '',
      kelurahanId: '',
      kelurahan: '',
      kodepos: '',
      category: 'umum',
      points: '0',
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Pelanggan) => {
    setEditing(c);
    setStep(1);
    setForm({
      id: c.id,
      name: c.nama,
      email: c.email || '',
      phone: c.noTelepon || '',
      alamat: c.alamat || '',
      provinsiId: c.provinsiId || '',
      provinsi: c.provinsi || '',
      kotaKabId: c.kotaKabId || '',
      kotaKab: c.kotaKab || '',
      kecamatanId: c.kecamatanId || '',
      kecamatan: c.kecamatan || '',
      kelurahanId: c.kelurahanId || '',
      kelurahan: c.kelurahan || '',
      kodepos: c.kodepos || '',
      category: coerceCategory(c.kategori),
      points: String(c.poin ?? 0),
    });
    setDialogOpen(true);
  };

  const requestDelete = (c: Pelanggan) => {
    setDeleting(c);
  };

  const canGoNextFromStep1 = !!form.id.trim() && !!form.name.trim();

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim()) return;

    const points = Number(form.points || 0);
    if (Number.isNaN(points)) {
      toast.error('Poin tidak valid');
      return;
    }

    const payload: Pelanggan = {
      id: form.id.trim(),
      nama: form.name.trim(),
      email: form.email.trim() ? form.email.trim() : null,
      noTelepon: form.phone.trim() ? form.phone.trim() : null,
      alamat: form.alamat.trim() ? form.alamat.trim() : null,
      provinsiId: form.provinsiId.trim() ? form.provinsiId.trim() : null,
      provinsi: form.provinsi.trim() ? form.provinsi.trim() : null,
      kotaKabId: form.kotaKabId.trim() ? form.kotaKabId.trim() : null,
      kotaKab: form.kotaKab.trim() ? form.kotaKab.trim() : null,
      kecamatanId: form.kecamatanId.trim() ? form.kecamatanId.trim() : null,
      kecamatan: form.kecamatan.trim() ? form.kecamatan.trim() : null,
      kelurahanId: form.kelurahanId.trim() ? form.kelurahanId.trim() : null,
      kelurahan: form.kelurahan.trim() ? form.kelurahan.trim() : null,
      kodepos: form.kodepos.trim() ? form.kodepos.trim() : null,
      kategori: form.category,
      poin: points,
    };

    if (editing) {
      const updateBody: Partial<Pelanggan> = {
        nama: payload.nama,
        email: payload.email,
        noTelepon: payload.noTelepon,
        alamat: payload.alamat,
        provinsiId: payload.provinsiId,
        provinsi: payload.provinsi,
        kotaKabId: payload.kotaKabId,
        kotaKab: payload.kotaKab,
        kecamatanId: payload.kecamatanId,
        kecamatan: payload.kecamatan,
        kelurahanId: payload.kelurahanId,
        kelurahan: payload.kelurahan,
        kodepos: payload.kodepos,
        kategori: payload.kategori,
        poin: payload.poin,
      };
      await updateMutation.mutateAsync({ id: editing.id, body: updateBody });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const categoryColors: Record<string, string> = {
    vip: 'bg-velcrone-warning-light text-velcrone-warning',
    reseller: 'bg-velcrone-info-light text-velcrone-info',
    umum: 'bg-muted text-muted-foreground',
    tiktok: 'bg-velcrone-info-light text-velcrone-info',
    tokopedia: 'bg-velcrone-info-light text-velcrone-info',
    shopee: 'bg-velcrone-info-light text-velcrone-info',
    instagram: 'bg-velcrone-info-light text-velcrone-info',
    website: 'bg-velcrone-info-light text-velcrone-info',
    marketplace: 'bg-velcrone-info-light text-velcrone-info',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Data Pelanggan</h1>
        <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90"><Plus size={18} className="mr-2" /> Tambah Pelanggan</Button>
      </div>
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Pelanggan..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Telepon</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Kategori</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Poin</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
            </tr></thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : listQuery.isError ? (
                <tr><td colSpan={7} className="p-6 text-center text-destructive">{listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data pelanggan'}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                data.map(c => {
                  const cat = coerceCategory(c.kategori);
                  return (
                    <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                      <td className="p-3 font-medium text-foreground">{c.nama}</td>
                      <td className="p-3 text-muted-foreground">{c.email || '-'}</td>
                      <td className="p-3 text-muted-foreground">{c.noTelepon || '-'}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[cat]}`}>{cat}</span></td>
                      <td className="p-3 text-right tabular-nums">{c.poin}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil size={16} /></button>
                          <button onClick={() => requestDelete(c)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setStep(1);
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit' : 'Tambah'} Pelanggan • Tahap {step}/3
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {step === 1 ? (
              <>
                <div><Label>ID Pelanggan</Label><Input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editing} className="mt-1" /></div>
                <div><Label>Nama Lengkap</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
                <div><Label>No. Telepon</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
              </>
            ) : step === 2 ? (
              <>
                <div><Label>Alamat</Label><Input value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="mt-1" /></div>
                <div>
                  <Label>Provinsi</Label>
                  <Select
                    value={form.provinsiId}
                    onValueChange={(id: string) => {
                      const selected = (provincesQuery.data || []).find((p) => p.id === id);
                      setForm((f) => ({
                        ...f,
                        provinsiId: id,
                        provinsi: selected?.name || '',
                        kotaKabId: '',
                        kotaKab: '',
                        kecamatanId: '',
                        kecamatan: '',
                        kelurahanId: '',
                        kelurahan: '',
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={provincesQuery.isLoading ? 'Memuat provinsi...' : 'Pilih provinsi'} />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {provincesQuery.isError ? (
                        <SelectItem value="__error__" disabled>
                          {`Gagal memuat provinsi: ${getErrorMessage(provincesQuery.error, 'Unknown error')}`}
                        </SelectItem>
                      ) : (provincesQuery.data || []).length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          {provincesQuery.isLoading ? 'Memuat...' : 'Tidak ada data'}
                        </SelectItem>
                      ) : (
                        (provincesQuery.data || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kota/Kab</Label>
                  <Select
                    value={form.kotaKabId}
                    onValueChange={(id: string) => {
                      const selected = (regenciesQuery.data || []).find((p) => p.id === id);
                      setForm((f) => ({
                        ...f,
                        kotaKabId: id,
                        kotaKab: selected?.name || '',
                        kecamatanId: '',
                        kecamatan: '',
                        kelurahanId: '',
                        kelurahan: '',
                      }));
                    }}
                    disabled={!form.provinsiId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue
                        placeholder={
                          !form.provinsiId
                            ? 'Pilih provinsi dulu'
                            : regenciesQuery.isLoading
                              ? 'Memuat kota/kab...'
                              : 'Pilih kota/kab'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {regenciesQuery.isError ? (
                        <SelectItem value="__error__" disabled>
                          {`Gagal memuat kota/kab: ${getErrorMessage(regenciesQuery.error, 'Unknown error')}`}
                        </SelectItem>
                      ) : (regenciesQuery.data || []).length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          {regenciesQuery.isLoading ? 'Memuat...' : 'Tidak ada data'}
                        </SelectItem>
                      ) : (
                        (regenciesQuery.data || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kecamatan</Label>
                  <Select
                    value={form.kecamatanId}
                    onValueChange={(id: string) => {
                      const selected = (districtsQuery.data || []).find((p) => p.id === id);
                      setForm((f) => ({
                        ...f,
                        kecamatanId: id,
                        kecamatan: selected?.name || '',
                        kelurahanId: '',
                        kelurahan: '',
                      }));
                    }}
                    disabled={!form.kotaKabId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue
                        placeholder={
                          !form.kotaKabId
                            ? 'Pilih kota/kab dulu'
                            : districtsQuery.isLoading
                              ? 'Memuat kecamatan...'
                              : 'Pilih kecamatan'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {districtsQuery.isError ? (
                        <SelectItem value="__error__" disabled>
                          {`Gagal memuat kecamatan: ${getErrorMessage(districtsQuery.error, 'Unknown error')}`}
                        </SelectItem>
                      ) : (districtsQuery.data || []).length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          {districtsQuery.isLoading ? 'Memuat...' : 'Tidak ada data'}
                        </SelectItem>
                      ) : (
                        (districtsQuery.data || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kelurahan</Label>
                  <Select
                    value={form.kelurahanId}
                    onValueChange={(id: string) => {
                      const selected = (villagesQuery.data || []).find((p) => p.id === id);
                      setForm((f) => ({
                        ...f,
                        kelurahanId: id,
                        kelurahan: selected?.name || '',
                      }));
                    }}
                    disabled={!form.kecamatanId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue
                        placeholder={
                          !form.kecamatanId
                            ? 'Pilih kecamatan dulu'
                            : villagesQuery.isLoading
                              ? 'Memuat kelurahan...'
                              : 'Pilih kelurahan'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {villagesQuery.isError ? (
                        <SelectItem value="__error__" disabled>
                          {`Gagal memuat kelurahan: ${getErrorMessage(villagesQuery.error, 'Unknown error')}`}
                        </SelectItem>
                      ) : (villagesQuery.data || []).length === 0 ? (
                        <SelectItem value="__empty__" disabled>
                          {villagesQuery.isLoading ? 'Memuat...' : 'Tidak ada data'}
                        </SelectItem>
                      ) : (
                        (villagesQuery.data || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Kodepos</Label><Input value={form.kodepos} onChange={e => setForm(f => ({ ...f, kodepos: e.target.value }))} className="mt-1" /></div>
              </>
            ) : (
              <>
                <div>
                  <Label>Kategori</Label>
                  <Select value={form.category} onValueChange={(v: CustomerCategory) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="umum">Umum</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="tiktok">Tiktok</SelectItem>
                      <SelectItem value="tokopedia">Tokopedia</SelectItem>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Poin</Label><Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} className="mt-1" /></div>
              </>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (step === 1) {
                    setDialogOpen(false);
                    setStep(1);
                    return;
                  }
                  setStep((s) => (s === 2 ? 1 : 2));
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {step === 1 ? 'Batal' : 'Kembali'}
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !canGoNextFromStep1) {
                      toast.error('ID dan Nama wajib diisi');
                      return;
                    }
                    setStep((s) => (s === 1 ? 2 : 3));
                  }}
                  disabled={(step === 1 && !canGoNextFromStep1) || createMutation.isPending || updateMutation.isPending}
                  className="velcrone-gradient text-primary-foreground hover:opacity-90"
                >
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : (editing ? 'Simpan' : 'Tambah')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Hapus pelanggan "${deleting.nama}" (${deleting.id})?` : 'Hapus pelanggan ini?'}
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
