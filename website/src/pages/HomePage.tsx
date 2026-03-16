import { Link } from 'react-router-dom';
import { products, formatRupiah, type ProductCategory } from '@/constants/dummy';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import heroBanner from '@/assets/hero-banner.png';
import { ArrowRight, ExternalLink } from 'lucide-react';

const categories: ProductCategory[] = ['T-shirt', 'Hoodie', 'Jacket', 'Hat', 'Accessories'];

function ProductCard({ product }: { product: typeof products[0] }) {
  const discountedPrice = product.sellPrice * (1 - product.discount / 100);
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3 relative">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80 text-muted-foreground text-xs p-4 text-center">
          {product.name}
        </div>
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-all duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <div className="bg-primary text-primary-foreground text-center py-2 rounded-md text-sm font-medium">Quick View</div>
        </div>
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">-{product.discount}%</span>
        )}
      </div>
      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{product.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-muted-foreground tabular-nums">{formatRupiah(discountedPrice)}</span>
        {product.discount > 0 && <span className="text-xs text-muted-foreground line-through tabular-nums">{formatRupiah(product.sellPrice)}</span>}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const newArrivals = products.slice(0, 6);
  const bestSellers = products.filter(p => ['P001', 'P005', 'P006', 'P011'].includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader alwaysSolid />
      <div className="h-16" />

      {/* Hero */}
      <section className="relative h-[calc(90vh-4rem)] flex items-center justify-center overflow-hidden">
        <img src={heroBanner} alt="VELCRONE Fashion" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="relative text-center text-primary-foreground z-10 animate-fade-in">
          <p className="text-sm tracking-[0.3em] uppercase mb-4 opacity-80">New Season 2024</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">VELCRONE</h1>
          <p className="text-lg opacity-80 mb-8 max-w-md mx-auto">Premium streetwear crafted with precision. Discover the new collection.</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:opacity-90 transition-opacity">
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <Link key={cat} to={`/products?cat=${cat}`} className="aspect-square bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">New Arrivals</h2>
          <Link to="/products" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 bg-velcrone-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-8">Best Sellers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold tracking-tighter mb-4">VELCRONE</h3>
            <p className="text-sm opacity-60">Custom jersey set dengan proses order mudah, cepat, dan rapi.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-60">Menu</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm opacity-60 hover:opacity-100 transition-opacity">Beranda</Link>
              <Link to="/products" className="block text-sm opacity-60 hover:opacity-100 transition-opacity">Produk</Link>
              <Link to="/pemesanan" className="block text-sm opacity-60 hover:opacity-100 transition-opacity">Pemesanan</Link>
              <Link to="/marketplace" className="block text-sm opacity-60 hover:opacity-100 transition-opacity">Marketplace</Link>
              <Link to="/kontak" className="block text-sm opacity-60 hover:opacity-100 transition-opacity">Kontak</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-60">Contact</h4>
            <div className="text-sm opacity-60 space-y-1">
              <p>DUSUN Jumbleng, Ranjeng, Cisitu, Sumedang</p>
              <p>+62 858-4665-5470</p>
              <a href="https://maps.app.goo.gl/2uufz733ra2i9eNL8" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:opacity-100 transition-opacity">
                Google Maps <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-background/10 text-center text-xs opacity-40">
          © 2024 VELCRONE. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
