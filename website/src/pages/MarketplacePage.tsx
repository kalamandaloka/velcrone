import MarketplaceHeader from '@/components/MarketplaceHeader';
import { ExternalLink } from 'lucide-react';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader alwaysSolid />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Marketplace</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Cari produk Velcrone di marketplace resmi. Kalau belum langsung muncul, gunakan pencarian dengan nama toko di halaman tersebut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="https://shopee.co.id/search?keyword=Velcrone%20Official%20Store"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border bg-background p-6 hover:bg-muted/40 transition-colors"
            >
              <h2 className="text-base font-semibold text-foreground mb-2">Shopee</h2>
              <p className="text-sm text-muted-foreground mb-4">Velcrone Official Store</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                Buka Shopee <ExternalLink size={16} />
              </span>
            </a>

            <a
              href="https://www.tokopedia.com/search?st=shop&q=Velcrone%20Store"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border bg-background p-6 hover:bg-muted/40 transition-colors"
            >
              <h2 className="text-base font-semibold text-foreground mb-2">Tokopedia</h2>
              <p className="text-sm text-muted-foreground mb-4">Velcrone Store</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                Buka Tokopedia <ExternalLink size={16} />
              </span>
            </a>

            <a
              href="https://www.tiktok.com/@velcrone_"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border bg-background p-6 hover:bg-muted/40 transition-colors"
            >
              <h2 className="text-base font-semibold text-foreground mb-2">TikTok Shop</h2>
              <p className="text-sm text-muted-foreground mb-4">Velcrone_</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                Buka TikTok <ExternalLink size={16} />
              </span>
            </a>
          </div>

          <div className="mt-12">
            <div className="flex items-end justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Instagram</h2>
                <p className="text-sm text-muted-foreground">Lihat foto dan update terbaru dari @velcroneproject.</p>
              </div>
              <a
                href="https://www.instagram.com/velcroneproject/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Buka Instagram <ExternalLink size={16} />
              </a>
            </div>

            <div className="rounded-xl border bg-background overflow-hidden">
              <div className="aspect-[16/10] w-full">
                <iframe
                  title="Instagram Velcrone Project"
                  src="https://www.instagram.com/velcroneproject/embed"
                  className="h-full w-full"
                  loading="lazy"
                  allow="encrypted-media; picture-in-picture"
                />
              </div>
              <div className="p-4 text-sm text-muted-foreground">
                Jika embed tidak muncul, klik “Buka Instagram” untuk melihat galeri.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
