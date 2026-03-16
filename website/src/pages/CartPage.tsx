import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { formatRupiah } from '@/constants/dummy';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link to="/products"><Button className="velcrone-gradient text-primary-foreground">Browse Products</Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map(item => {
                const price = item.product.sellPrice * (1 - item.product.discount / 100);
                return (
                  <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-lg shadow-sm">
                    <div className="w-20 h-24 bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground text-center p-1">{item.product.name}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                        </div>
                        <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm tabular-nums text-foreground">{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground"><Plus size={14} /></button>
                        </div>
                        <p className="font-semibold text-foreground tabular-nums">{formatRupiah(price * item.qty)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{formatRupiah(total)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Shipping</span><span>Free</span></div>
              <div className="border-t pt-3 flex justify-between font-semibold text-foreground"><span>Total</span><span className="tabular-nums">{formatRupiah(total)}</span></div>
              <Link to="/checkout"><Button className="w-full velcrone-gradient text-primary-foreground hover:opacity-90 h-12 mt-2">Checkout</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
