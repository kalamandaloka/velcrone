import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@/constants/dummy';
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

const roles: UserRole[] = [
  'superadmin',
  'owner',
  'manager',
  'kasir',
  'design',
  'setting',
  'printing',
  'heat press',
  'sewing',
  'qc',
  'packing',
  'delivery',
];

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt?: string | null;
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

function coerceRole(value: unknown): UserRole {
  if (value === 'administrator') return 'superadmin';
  if (roles.includes(value as UserRole)) return value as UserRole;
  return 'kasir';
}

function coerceStatus(value: unknown): 'active' | 'inactive' {
  return value === 'inactive' ? 'inactive' : 'active';
}

export default function UserManagementPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'kasir' as UserRole, status: 'active' as 'active' | 'inactive' });

  const listQuery = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserRow[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/users`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data user'));
      if (!Array.isArray(payload)) return [];
      return payload.map((raw) => {
        const obj: Record<string, unknown> =
          raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

        const id = typeof obj.id === 'number' ? obj.id : Number(obj.id ?? 0);
        const name = typeof obj.name === 'string' ? obj.name : '';
        const email = typeof obj.email === 'string' ? obj.email : '';
        const role = coerceRole(obj.role);
        const status = coerceStatus(obj.status);
        const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : null;

        return { id, name, email, role, status, createdAt };
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Omit<UserRow, 'id'>) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menambah user'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('User berhasil ditambahkan (password default: 123456)');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<Omit<UserRow, 'id'>> }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal mengubah user'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('User berhasil diubah');
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/users/${id}`, { method: 'DELETE' });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menghapus user'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('User berhasil dihapus');
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus user');
    },
  });

  const roleColors: Record<string, string> = {
    superadmin: 'bg-destructive/10 text-destructive',
    owner: 'bg-velcrone-info-light text-velcrone-info',
    manager: 'bg-velcrone-success-light text-velcrone-success',
    kasir: 'bg-muted text-muted-foreground',
    design: 'bg-velcrone-warning-light text-velcrone-warning',
    setting: 'bg-velcrone-warning-light text-velcrone-warning',
    printing: 'bg-velcrone-warning-light text-velcrone-warning',
    'heat press': 'bg-velcrone-warning-light text-velcrone-warning',
    sewing: 'bg-velcrone-warning-light text-velcrone-warning',
    qc: 'bg-velcrone-warning-light text-velcrone-warning',
    packing: 'bg-velcrone-warning-light text-velcrone-warning',
    delivery: 'bg-velcrone-warning-light text-velcrone-warning',
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', role: 'kasir', status: 'active' }); setDialogOpen(true); };
  const openEdit = (u: UserRow) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, status: u.status }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, body: { ...form } });
    } else {
      await createMutation.mutateAsync({ ...form, createdAt: null });
    }
  };

  const requestDelete = (u: UserRow) => {
    setDeleting(u);
  };

  const data = (listQuery.data || []).filter(
    u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">User Management</h1>
        <Button onClick={openAdd} className="velcrone-gradient text-primary-foreground hover:opacity-90"><Plus size={18} className="mr-2" /> Tambah User</Button>
      </div>
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari User..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Role</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Aksi</th>
            </tr></thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : listQuery.isError ? (
                <tr><td colSpan={5} className="p-6 text-center text-destructive">{listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data user'}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                data.map(u => (
                  <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground text-xs font-semibold">{u.name.charAt(0)}</div>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${u.status === 'active' ? 'bg-velcrone-success-light text-velcrone-success' : 'bg-muted text-muted-foreground'}`}>{u.status}</span></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil size={16} /></button>
                        <button onClick={() => requestDelete(u)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Tambah'} User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v: UserRole) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: 'active' | 'inactive') => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Hapus user "${deleting.name}" (${deleting.email})?` : 'Hapus user ini?'}
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
