import { Link } from 'react-router-dom';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, MessageCircle } from 'lucide-react';

const whatsappAdmins = [
  { label: 'Admin 1', phone: '0858-4665-5470', wa: 'https://wa.me/6285846655470' },
  { label: 'Admin 2', phone: '0851-7955-7092', wa: 'https://wa.me/6285179557092' },
  { label: 'Admin 3', phone: '0822-6078-5868', wa: 'https://wa.me/6282260785868' },
  { label: 'Admin 4', phone: '0822-6461-7068', wa: 'https://wa.me/6282264617068' },
];

export default function PemesananPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader alwaysSolid />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-3 mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Pemesanan</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Order jersey set tanpa ribet. Tinggal chat admin, konsultasi kebutuhan, lalu kami bantu sampai desain fix dan siap produksi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="rounded-xl border bg-background p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Paket Set Produk</h2>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1 pcs Jersey atasan</li>
                  <li>1 pcs pants (celana)</li>
                  <li>Free Sticker pack dan shopping bag</li>
                </ul>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Free custom warna, penambahan nama, nomor punggung, dan sponsorship.</p>
                  <p>Estimasi pengerjaan order 10–14 hari kerja setelah Fix Design.</p>
                  <p>DP 50% untuk mulai proses produksi.</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href={whatsappAdmins[0].wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle size={18} />
                    Chat Admin
                  </a>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 bg-muted text-foreground px-5 py-3 rounded-md font-medium hover:bg-muted/80 transition-colors"
                  >
                    Lihat Produk <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">Info Order & Lainnya</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whatsappAdmins.map(a => (
                    <a
                      key={a.label}
                      href={a.wa}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{a.phone}</span>
                    </a>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>Shopee: Velcrone Official Store</p>
                  <p>Tokopedia: Velcrone Store</p>
                  <p>Tiktokshop: Velcrone_</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-background p-6">
              <h2 className="text-base font-semibold text-foreground mb-3">FAQ</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Bagaimana cara mulai order?</AccordionTrigger>
                  <AccordionContent>
                    Chat admin, kirim kebutuhan (jenis produk, warna, nama/nomor, sponsor). Setelah desain fix, produksi langsung berjalan.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Berapa lama estimasi pengerjaan?</AccordionTrigger>
                  <AccordionContent>Estimasi 10–14 hari kerja setelah Fix Design.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Apakah bisa custom warna, nama, nomor, dan sponsor?</AccordionTrigger>
                  <AccordionContent>Bisa, dan gratis untuk penyesuaian warna, nama, nomor punggung, serta sponsorship.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>DP dan pembayaran seperti apa?</AccordionTrigger>
                  <AccordionContent>DP 50% untuk memulai proses. Pelunasan dilakukan sebelum pengiriman sesuai arahan admin.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Kalau order untuk tim/komunitas bisa?</AccordionTrigger>
                  <AccordionContent>Bisa. Admin akan bantu size, jumlah, dan detail desain agar hasil rapi dan seragam.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
