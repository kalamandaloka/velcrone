import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '@/assets/logo-valcrone.png';

const navLinks = [
  { label: 'Beranda', path: '/' },
  { label: 'Produk', path: '/products' },
  { label: 'Pemesanan', path: '/pemesanan' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Kontak', path: '/kontak' },
];

export default function MarketplaceHeader({ alwaysSolid = false }: { alwaysSolid?: boolean }) {
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const headerBgClass = alwaysSolid
    ? 'bg-background shadow-sm'
    : scrolled
      ? 'bg-background/80 backdrop-blur-md shadow-sm'
      : 'bg-transparent';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${headerBgClass}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tighter text-foreground">VELCRONE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.path} to={l.path} className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors"><User size={20} /></Link>
          <Link to="/cart" className="relative text-foreground/70 hover:text-foreground transition-colors">
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">{itemCount}</span>}
          </Link>
          <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-background border-t p-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.path} to={l.path} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground/70 hover:text-foreground">{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
