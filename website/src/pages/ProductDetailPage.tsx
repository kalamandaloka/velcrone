import { useParams, Link } from 'react-router-dom';
import { products, formatRupiah } from '@/constants/dummy';
import { useCart } from '@/hooks/useCart';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ShoppingBag, Minus, Plus, ArrowLeft } from 'lucide-react';

const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [added, setAdded] = useState(false);

  if (!product) return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="pt-24 container mx-auto px-4 text-center"><p className="text-muted-foreground">Produk tidak ditemukan.</p></div>
    </div>
  );

  const discounted = product.sellPrice * (1 - product.discount / 100);

  const handleAdd = () => {
    addItem(product, qty, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            {product.name}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.category} • {product.code}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{product.name}</h1>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-foreground tabular-nums">{formatRupiah(discounted)}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through tabular-nums">{formatRupiah(product.sellPrice)}</span>
                  <span className="text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-medium">-{product.discount}%</span>
                </>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            {/* Size */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Size</p>
              <div className="flex gap-2">
                {sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className={`w-12 h-12 rounded-md text-sm font-medium transition-colors ${selectedSize === s ? 'bg-foreground text-background' : 'bg-muted text-foreground hover:bg-muted/80'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"><Minus size={16} /></button>
                <span className="w-12 text-center font-medium tabular-nums text-foreground">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80"><Plus size={16} /></button>
              </div>
            </div>

            <Button onClick={handleAdd} className="w-full velcrone-gradient text-primary-foreground hover:opacity-90 h-12 text-base">
              <ShoppingBag size={20} className="mr-2" />
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
