import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Package, Layers, Truck, Users, Receipt,
  BarChart3, Settings, UserCog, LogOut, Menu, X, Bell, Search, Tags, ClipboardList, FileText
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rawMaterials } from '@/constants/dummy';
import type { UserRole } from '@/constants/dummy';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  group: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['superadmin', 'owner', 'manager', 'kasir', 'design', 'setting', 'printing', 'heat press', 'sewing', 'qc', 'packing', 'delivery'], group: 'Menu' },
  { label: 'Data Barang', path: '/dashboard/products', icon: <Package size={20} />, roles: ['superadmin', 'owner', 'manager', 'kasir'], group: 'Inventory' },
  { label: 'Kategori Barang', path: '/dashboard/categories', icon: <Tags size={20} />, roles: ['superadmin', 'owner', 'manager'], group: 'Inventory' },
  { label: 'Stok Bahan', path: '/dashboard/raw-materials', icon: <Layers size={20} />, roles: ['superadmin', 'owner', 'manager'], group: 'Inventory' },
  { label: 'Data Pemasok', path: '/dashboard/suppliers', icon: <Truck size={20} />, roles: ['superadmin', 'owner', 'manager'], group: 'Inventory' },
  { label: 'Data Pelanggan', path: '/dashboard/customers', icon: <Users size={20} />, roles: ['superadmin', 'kasir'], group: 'Sales' },
  { label: 'Transaksi', path: '/dashboard/transactions', icon: <Receipt size={20} />, roles: ['superadmin', 'owner', 'manager', 'kasir'], group: 'Sales' },
  { label: 'Status Pembayaran', path: '/dashboard/transactions/pembayaran', icon: <Receipt size={20} />, roles: ['superadmin', 'owner', 'manager', 'kasir'], group: 'Sales' },
  { label: 'List SPK', path: '/dashboard/produksi/spk', icon: <ClipboardList size={20} />, roles: ['superadmin', 'owner', 'manager'], group: 'Produksi' },
  { label: 'Status Produksi', path: '/dashboard/produksi/status', icon: <Receipt size={20} />, roles: ['superadmin', 'owner', 'manager', 'kasir', 'design', 'setting', 'printing', 'heat press', 'sewing', 'qc', 'packing', 'delivery'], group: 'Produksi' },
  { label: 'Dokumen', path: '/dashboard/produksi/dokumen', icon: <FileText size={20} />, roles: ['superadmin', 'owner', 'manager'], group: 'Produksi' },
  { label: 'Laporan', path: '/dashboard/reports', icon: <BarChart3 size={20} />, roles: ['superadmin', 'owner'], group: 'Management' },
  { label: 'User Management', path: '/dashboard/users', icon: <UserCog size={20} />, roles: ['superadmin'], group: 'Management' },
  { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} />, roles: ['superadmin'], group: 'Management' },
];

export default function AdminLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const criticalStock = rawMaterials.filter(m => m.status === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => hasRole(item.roles));
  const groups = [...new Set(filteredNav.map(i => i.group))];

  return (
    <div className="min-h-screen flex bg-velcrone-surface">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="text-xl font-bold tracking-tighter text-sidebar-foreground">VELCRONE</Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-6 overflow-y-auto scrollbar-hidden h-[calc(100vh-8rem)]">
          {groups.map(group => (
            <div key={group}>
              <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-3">{group}</p>
              <div className="space-y-1">
                {filteredNav.filter(i => i.group === group).map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-200 ${
                        active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu size={24} />
            </button>
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <Input placeholder="Cari..." className="w-64" autoFocus onBlur={() => setSearchOpen(false)} />
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Search size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              {criticalStock > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">{criticalStock}</span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {user?.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
