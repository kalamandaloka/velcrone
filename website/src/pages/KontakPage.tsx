import MarketplaceHeader from '@/components/MarketplaceHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';

const whatsappAdmins = [
  { label: 'Admin 1', phone: '0858-4665-5470', wa: 'https://wa.me/6285846655470' },
  { label: 'Admin 2', phone: '0851-7955-7092', wa: 'https://wa.me/6285179557092' },
  { label: 'Admin 3', phone: '0822-6078-5868', wa: 'https://wa.me/6282260785868' },
  { label: 'Admin 4', phone: '0822-6461-7068', wa: 'https://wa.me/6282264617068' },
];

export default function KontakPage() {
  const address =
    'DUSUN Jumbleng, RT.02/RW.06, Ranjeng, Kec. Cisitu, Kabupaten Sumedang, Jawa Barat 45363, Indonesia';
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const mapsLink = 'https://maps.app.goo.gl/2uufz733ra2i9eNL8';

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader alwaysSolid />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="rounded-2xl border bg-velcrone-surface p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Kontak</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mt-2">
              Butuh bantuan cepat? Hubungi kami lewat telepon atau WhatsApp. Kami siap bantu dari konsultasi sampai order beres.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <a href={whatsappAdmins[0].wa} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  WhatsApp
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="tel:+6285846655470">
                  <Phone />
                  Telepon
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={mapsLink} target="_blank" rel="noreferrer">
                  <MapPin />
                  Google Maps
                  <ExternalLink />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Info Kontak</CardTitle>
                  <CardDescription>Alamat, telepon, dan jam operasional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Alamat</p>
                      <p className="text-sm text-muted-foreground">{address}</p>
                      <p className="text-sm text-muted-foreground mt-1">Province: West Java</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <a href="tel:+6285846655470" className="text-sm text-primary hover:underline">+62 858-4665-5470</a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Hours</p>
                      <p>Closed · Opens 8 AM Mon</p>
                      <p>Detail jam lainnya tersedia di Google Maps.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Chat Admin</CardTitle>
                  <CardDescription>Klik salah satu admin untuk langsung WhatsApp.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {whatsappAdmins.map(a => (
                      <a
                        key={a.label}
                        href={a.wa}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border bg-background px-4 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="text-sm font-medium text-foreground">{a.label}</div>
                        <div className="text-sm text-muted-foreground tabular-nums">{a.phone}</div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">Lokasi</CardTitle>
                <CardDescription>Buka peta untuk rute dan jam operasional terbaru.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border bg-background">
                  <iframe
                    title="Peta Lokasi Velcrone"
                    src={mapsEmbedSrc}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={mapsLink} target="_blank" rel="noreferrer">
                    Buka Google Maps
                    <ExternalLink />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
