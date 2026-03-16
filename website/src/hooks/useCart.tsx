import { createContext, useContext, useState, ReactNode } from 'react';
import type { Product } from '@/constants/dummy';

interface CartItem {
  product: Product;
  qty: number;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty: number, size: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, qty: number, size: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map(i => i.product.id === product.id && i.size === size ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { product, qty, size }];
    });
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.product.id !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) return removeItem(productId);
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i));
  };
  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => {
    const price = i.product.sellPrice * (1 - i.product.discount / 100);
    return s + price * i.qty;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, itemCount: items.reduce((s, i) => s + i.qty, 0) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
