import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

      <div className="bg-card rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-4">Profil Toko</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Nama Toko:</span><p className="font-medium text-foreground">VELCRONE</p></div>
            <div><span className="text-muted-foreground">Email:</span><p className="font-medium text-foreground">info@velcrone.com</p></div>
            <div><span className="text-muted-foreground">Telepon:</span><p className="font-medium text-foreground">+62 21 1234 5678</p></div>
            <div><span className="text-muted-foreground">Alamat:</span><p className="font-medium text-foreground">Jl. Fashion No. 1, Jakarta</p></div>
          </div>
        </div>
        <div className="border-t pt-6">
          <h3 className="font-semibold text-foreground mb-4">Akun Saya</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Nama:</span><p className="font-medium text-foreground">{user?.name}</p></div>
            <div><span className="text-muted-foreground">Email:</span><p className="font-medium text-foreground">{user?.email}</p></div>
            <div><span className="text-muted-foreground">Role:</span><p className="font-medium text-foreground capitalize">{user?.role}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
