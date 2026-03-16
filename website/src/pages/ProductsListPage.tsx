import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products, formatRupiah, type ProductCategory } from '@/constants/dummy';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const categories: ProductCategory[] = ['T-shirt', 'Hoodie', 'Jacket', 'Hat', 'Accessories'];

export default function ProductsListPage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sort === 'price-low') filtered.sort((a, b) => a.sellPrice - b.sellPrice);
  if (sort === 'price-high') filtered.sort((a, b) => b.sellPrice - a.sellPrice);
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-8">All Products</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={category} onValueChange={v => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pageData.map(p => {
            const discounted = p.sellPrice * (1 - p.discount / 100);
            return (
              <Link key={p.id} to={`/product/${p.id}`} className="group block">
                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3 relative">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-4 text-center">{p.name}</div>
                  {p.discount > 0 && <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">-{p.discount}%</span>}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <div className="bg-primary text-primary-foreground text-center py-2 rounded-md text-sm font-medium">Quick View</div>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground tabular-nums">{formatRupiah(discounted)}</span>
                  {p.discount > 0 && <span className="text-xs text-muted-foreground line-through tabular-nums">{formatRupiah(p.sellPrice)}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-md text-sm ${page === i + 1 ? 'velcrone-gradient text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
