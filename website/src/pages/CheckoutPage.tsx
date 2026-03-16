import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { formatRupiah } from '@/constants/dummy';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', payment: 'transfer' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    clearCart();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceHeader />
        <div className="pt-24 pb-16 container mx-auto px-4 max-w-lg text-center">
          <div className="animate-fade-in">
            <CheckCircle size={64} className="mx-auto text-velcrone-success mb-6" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Order Berhasil!</h1>
            <p className="text-muted-foreground mb-8">Terima kasih telah berbelanja di VELCRONE. Pesanan Anda sedang diproses.</p>
            <Link to="/"><Button className="velcrone-gradient text-primary-foreground">Kembali ke Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-8">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Alamat Pengiriman</h3>
                <div><Label>Nama Lengkap</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
                <div><Label>No. Telepon</Label><Input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
                <div><Label>Alamat</Label><Input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" /></div>
                <div><Label>Kota</Label><Input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" /></div>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Metode Pembayaran</h3>
                <div className="space-y-2">
                  {['transfer', 'cod', 'ewallet'].map(m => (
                    <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.payment === m ? 'border-primary bg-velcrone-red-light' : 'border-border hover:bg-muted'}`}>
                      <input type="radio" name="payment" value={m} checked={form.payment === m} onChange={() => setForm(f => ({ ...f, payment: m }))} className="accent-primary" />
                      <span className="text-sm font-medium capitalize text-foreground">{m === 'transfer' ? 'Bank Transfer' : m === 'cod' ? 'Cash on Delivery' : 'E-Wallet'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-card rounded-lg p-6 shadow-sm space-y-4 sticky top-24">
                <h3 className="font-semibold text-foreground">Ringkasan Order</h3>
                <div className="space-y-3">
                  {items.map(item => {
                    const price = item.product.sellPrice * (1 - item.product.discount / 100);
                    return (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-foreground">{item.product.name} x{item.qty}</span>
                        <span className="tabular-nums text-foreground">{formatRupiah(price * item.qty)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-foreground">
                  <span>Total</span><span className="tabular-nums">{formatRupiah(total)}</span>
                </div>
                <Button type="submit" className="w-full velcrone-gradient text-primary-foreground hover:opacity-90 h-12" disabled={items.length === 0}>Bayar Sekarang</Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
