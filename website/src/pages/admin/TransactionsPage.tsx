import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatRupiah, getStatusColor } from '@/constants/dummy';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import logoValcrone from '@/assets/logo-valcrone.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Search, Download, Share2, Printer, CheckCircle, Clock, XCircle, Plus, Trash2 } from 'lucide-react';

type TransaksiStatus = 'pending' | 'completed' | 'cancelled';

type TransaksiItem = {
  productId: string;
  productName: string;
  ukuran: string;
  warna: string;
  qty: number;
  price: number;
  subtotal: number;
};

type Transaksi = {
  id: string;
  invoice: string;
  date: string | null;
  customerId: string;
  customerName: string;
  items: TransaksiItem[];
  total: number;
  status: TransaksiStatus;
  cancelReason?: string | null;
  productionStatus: string;
  spkDetail: SpkDetailMap;
  paymentStatus: string;
  paymentStep: number;
  paymentDue: number;
  paymentPaid: number;
  paymentRemaining: number;
  paymentMethod: string;
};

type SpkDetailEntry = {
  stepStatus: string | null;
  deadlineDate: string | null;
};

type SpkDetailMap = Record<string, SpkDetailEntry>;

type Barang = {
  kode: string;
  nama: string;
  ukuran: string[];
  warna: string[];
  hargaJual: number;
  diskon: number;
};

type PelangganOption = { id: string; nama: string; kategori: string | null };
type PelangganDetail = {
  id: string;
  nama: string;
  noTelepon: string | null;
  alamat: string | null;
  provinsi: string | null;
  kotaKab: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  kodepos: string | null;
  kategori: string | null;
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeSpkDetail(value: unknown): SpkDetailMap {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const out: SpkDetailMap = {};
  for (const [key, raw] of Object.entries(obj)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const stepStatus = typeof row.stepStatus === 'string' && row.stepStatus.trim() ? row.stepStatus : null;
    const deadlineDate = typeof row.deadlineDate === 'string' && row.deadlineDate.trim() ? row.deadlineDate.slice(0, 10) : null;
    out[key] = { stepStatus, deadlineDate };
  }
  return out;
}

function normalizeTransaksi(raw: unknown): Transaksi | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' ? obj.id : '';
  const invoice = typeof obj.invoice === 'string' ? obj.invoice : '';
  if (!id || !invoice) return null;

  const statusRaw = typeof obj.status === 'string' ? obj.status : 'pending';
  const status: TransaksiStatus =
    statusRaw === 'completed' || statusRaw === 'pending' || statusRaw === 'cancelled'
      ? statusRaw
      : 'pending';

  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  const items: TransaksiItem[] = itemsRaw
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const item = it as Record<string, unknown>;
      const productId = typeof item.productId === 'string' ? item.productId : '';
      const productName = typeof item.productName === 'string' ? item.productName : '';
      const ukuran = typeof item.ukuran === 'string' ? item.ukuran : '';
      const warna = typeof item.warna === 'string' ? item.warna : '';
      const qty = typeof item.qty === 'number' ? item.qty : Number(item.qty);
      const price = typeof item.price === 'number' ? item.price : Number(item.price);
      const subtotal = typeof item.subtotal === 'number' ? item.subtotal : Number(item.subtotal);
      if (!productId) return null;
      return {
        productId,
        productName,
        ukuran,
        warna,
        qty: Number.isFinite(qty) ? qty : 0,
        price: Number.isFinite(price) ? price : 0,
        subtotal: Number.isFinite(subtotal) ? subtotal : 0,
      };
    })
    .filter((v): v is TransaksiItem => !!v);

  const total = typeof obj.total === 'number' ? obj.total : Number(obj.total);
  const date = typeof obj.date === 'string' ? obj.date : null;
  const customerId = typeof obj.customerId === 'string' ? obj.customerId : '';
  const customerName = typeof obj.customerName === 'string' ? obj.customerName : '';
  const cancelReason = typeof obj.cancelReason === 'string' ? obj.cancelReason : null;
  const productionStatus = typeof obj.productionStatus === 'string' ? obj.productionStatus : 'order_masuk';
  const spkDetail = normalizeSpkDetail(obj.spkDetail);
  const paymentStatus = typeof obj.paymentStatus === 'string' ? obj.paymentStatus : 'belum_lunas';
  const paymentStep =
    typeof obj.paymentStep === 'number'
      ? obj.paymentStep
      : Number.isFinite(Number(obj.paymentStep))
        ? Number(obj.paymentStep)
        : 0;
  const paymentDue = typeof obj.paymentDue === 'number' ? obj.paymentDue : Number(obj.paymentDue);
  const paymentPaid = typeof obj.paymentPaid === 'number' ? obj.paymentPaid : Number(obj.paymentPaid);
  const paymentRemaining =
    typeof obj.paymentRemaining === 'number' ? obj.paymentRemaining : Number(obj.paymentRemaining);
  const paymentMethod = typeof obj.paymentMethod === 'string' ? obj.paymentMethod : '';

  return {
    id,
    invoice,
    date,
    customerId,
    customerName,
    items,
    total: Number.isFinite(total) ? total : 0,
    status,
    cancelReason,
    productionStatus,
    spkDetail,
    paymentStatus,
    paymentStep: Number.isFinite(paymentStep) ? paymentStep : 0,
    paymentDue: Number.isFinite(paymentDue) ? paymentDue : Number.isFinite(total) ? total : 0,
    paymentPaid: Number.isFinite(paymentPaid) ? paymentPaid : 0,
    paymentRemaining: Number.isFinite(paymentRemaining) ? paymentRemaining : Number.isFinite(total) ? total : 0,
    paymentMethod,
  };
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  const obj: Record<string, unknown> | null =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

  const message = obj?.message;
  if (typeof message === 'string' && message.trim()) return message;

  const errors = obj?.errors;
  if (errors && typeof errors === 'object') {
    const errorObj = errors as Record<string, unknown>;
    const firstKey = Object.keys(errorObj)[0];
    const firstVal = firstKey ? errorObj[firstKey] : null;
    const firstMsg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
    if (typeof firstMsg === 'string' && firstMsg.trim()) return firstMsg;
  }

  return fallback;
}

function buildPelangganFullAddress(p: PelangganDetail | null): string {
  if (!p) return '';
  const parts = [
    p.alamat,
    p.kelurahan ? `Kel. ${p.kelurahan}` : null,
    p.kecamatan ? `Kec. ${p.kecamatan}` : null,
    p.kotaKab,
    p.provinsi,
    p.kodepos,
  ].filter((v): v is string => !!v && v.trim() !== '');
  return parts.join(', ');
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function createQrDataUrl(data: string, size: number): Promise<string> {
  return await QRCode.toDataURL(data, { width: size, margin: 0 });
}

function buildInvoiceHtml(args: {
  t: Transaksi;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  logoUrl: string;
  qrDataUrl: string;
}): string {
  const { t, receiverName, receiverPhone, receiverAddress, logoUrl, qrDataUrl } = args;
  const orderDate = t.date ? String(t.date).slice(0, 10) : '-';
  const due = Math.max(0, Number.isFinite(t.paymentRemaining) ? t.paymentRemaining : t.total);
  const paid = Math.max(0, Number.isFinite(t.paymentPaid) ? t.paymentPaid : 0);
  const subtotal = Math.max(0, Number.isFinite(t.total) ? t.total : 0);

  const rows = t.items
    .map((item) => {
      const ukuran = item.ukuran;
      const warna = item.warna;
      return `<tr>
  <td class="td center">${escapeHtml(item.productId)}</td>
  <td class="td">${escapeHtml(item.productName)}</td>
  <td class="td center">${escapeHtml(ukuran || '-')}</td>
  <td class="td center">${escapeHtml(warna || '-')}</td>
  <td class="td center">${item.qty}</td>
  <td class="td center">pcs</td>
  <td class="td right">${escapeHtml(formatRupiah(item.price))}</td>
  <td class="td right">${escapeHtml(formatRupiah(item.subtotal))}</td>
</tr>`;
    })
    .join('');

  const emptyRows = Math.max(0, 10 - t.items.length);
  const empty = Array.from({ length: emptyRows }).map(() => `<tr>
  <td class="td">&nbsp;</td>
  <td class="td"></td>
  <td class="td"></td>
  <td class="td"></td>
  <td class="td"></td>
  <td class="td"></td>
  <td class="td"></td>
  <td class="td"></td>
</tr>`).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(t.invoice)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
    .page { border: 1px solid #d4d4d4; padding: 12px; }
    .header { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
    .brand { display: flex; gap: 10px; }
    .logo { width: 52px; height: 52px; object-fit: contain; }
    .title { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .addr { font-size: 11px; line-height: 1.35; color: #333; margin-top: 4px; }
    .tagline { font-size: 10px; text-align: right; color: #444; line-height: 1.35; }
    .meta { margin-top: 10px; display: grid; grid-template-columns: 1fr 220px; gap: 12px; align-items: start; }
    .meta-left { font-size: 12px; }
    .meta-row { display: grid; grid-template-columns: 130px 1fr; gap: 8px; margin: 2px 0; }
    .paybox { border: 1px solid #111; padding: 10px; text-align: center; }
    .paybox-title { font-size: 12px; font-weight: 800; margin: 0; }
    .paybox-amt { font-size: 32px; font-weight: 900; margin: 6px 0 0 0; }
    .table-wrap { margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0b0b0b; color: #fff; font-size: 11px; padding: 8px 6px; border: 1px solid #0b0b0b; }
    .td { border: 1px solid #222; font-size: 11px; padding: 6px; height: 26px; vertical-align: top; }
    .center { text-align: center; }
    .right { text-align: right; font-variant-numeric: tabular-nums; }
    .footer { margin-top: 10px; display: grid; grid-template-columns: 150px 1fr 220px; gap: 12px; align-items: end; }
    .qr { width: 130px; height: 130px; border: 1px solid #222; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .qr img { width: 130px; height: 130px; object-fit: cover; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px; text-align: center; }
    .sign-box { height: 80px; border-bottom: 1px solid #555; }
    .totals { border: 1px solid #bdbdbd; }
    .totals-row { display: grid; grid-template-columns: 1fr 90px; border-bottom: 1px solid #e0e0e0; }
    .totals-row:last-child { border-bottom: 0; }
    .totals-row div { padding: 6px 8px; font-size: 11px; }
    .totals-row .lbl { background: #f1f5f9; font-weight: 700; }
    .totals-row .val { text-align: right; font-variant-numeric: tabular-nums; }
    .to { margin-top: 8px; padding: 8px; border: 1px solid #e5e5e5; }
    .to-title { font-size: 11px; font-weight: 700; margin: 0 0 4px 0; }
    .to-line { font-size: 11px; color: #333; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="Velcrone" />
          <div>
            <p class="title">SALES INVOICE</p>
            <div class="addr">
              Dusun Jumbleng, RT.02/RW.06, Ranjeng, Kec. Cisitu<br/>
              Kabupaten Sumedang, Jawa Barat 45363<br/>
              Indonesia<br/>
              Whatsapp : 085846655470
            </div>
          </div>
        </div>
      </div>
      <div class="tagline">
        Velcrone is a specialist brand in manufacturing<br/>
        Gearset, Jacket, Jersey, Glove and many other<br/>
        apparel. We always prioritize the quality and<br/>
        satisfaction customers.
      </div>
    </div>

    <div class="meta">
      <div class="meta-left">
        <div class="meta-row"><div><b>No</b></div><div>: ${escapeHtml(t.invoice)}</div></div>
        <div class="meta-row"><div><b>Tanggal Order</b></div><div>: ${escapeHtml(orderDate)}</div></div>
        <div class="meta-row"><div><b>Tanggal Selesai</b></div><div>: -</div></div>
        <div class="to">
          <p class="to-title">Kepada Yth.</p>
          <div class="to-line"><b>${escapeHtml(receiverName || '-')}</b></div>
          <div class="to-line">${escapeHtml(receiverPhone || '')}</div>
          <div class="to-line">${escapeHtml(receiverAddress || '')}</div>
        </div>
      </div>
      <div class="paybox">
        <p class="paybox-title">JUMLAH YANG HARUS DIBAYAR</p>
        <p class="paybox-amt">${escapeHtml(formatRupiah(due))}</p>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:80px">KODE</th>
            <th>NAMA PRODUK</th>
            <th style="width:86px">SIZE<br/>ATASAN</th>
            <th style="width:86px">WARNA</th>
            <th style="width:70px">JUMLAH</th>
            <th style="width:70px">SATUAN</th>
            <th style="width:100px">HARGA</th>
            <th style="width:110px">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${empty}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="qr">
        <img src="${escapeHtml(qrDataUrl)}" alt="QR" onerror="this.style.display='none'" />
      </div>
      <div class="signs">
        <div>
          <div class="sign-box"></div>
          <div>Tanda Terima</div>
        </div>
        <div>
          <div class="sign-box"></div>
          <div>Velcrone Admin</div>
        </div>
      </div>
      <div class="totals">
        <div class="totals-row"><div class="lbl">Sub Total</div><div class="val">${escapeHtml(formatRupiah(subtotal))}</div></div>
        <div class="totals-row"><div class="lbl">Diskon</div><div class="val">${escapeHtml(formatRupiah(0))}</div></div>
        <div class="totals-row"><div class="lbl">Total</div><div class="val">${escapeHtml(formatRupiah(subtotal))}</div></div>
        <div class="totals-row"><div class="lbl">Bayar</div><div class="val">${escapeHtml(formatRupiah(paid))}</div></div>
        <div class="totals-row"><div class="lbl">Sisa</div><div class="val">${escapeHtml(formatRupiah(Math.max(0, subtotal - paid)))}</div></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildShippingHtml(args: {
  t: Transaksi;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  qrDataUrl: string;
}): string {
  const { t, receiverName, receiverPhone, receiverAddress, qrDataUrl } = args;
  const itemsList = t.items
    .map((it) => `<tr><td class="td">${escapeHtml(it.productName)}</td><td class="td center">${it.qty} pcs</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pengiriman ${escapeHtml(t.invoice)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
    .page { border: 1px solid #d4d4d4; padding: 12px; }
    .title { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.3px; }
    .sub { margin: 6px 0 0 0; font-size: 12px; color: #333; }
    .grid { margin-top: 12px; display: grid; grid-template-columns: 240px 1fr 1fr; gap: 12px; align-items: start; }
    .card { border: 1px solid #222; padding: 10px; min-height: 260px; }
    .card-title { font-size: 12px; font-weight: 800; margin: 0 0 8px 0; }
    .qr { width: 180px; height: 180px; border: 1px solid #222; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; overflow: hidden; }
    .qr img { width: 180px; height: 180px; object-fit: cover; }
    table { width: 100%; border-collapse: collapse; }
    .th { background: #0b0b0b; color: #fff; font-size: 11px; padding: 6px; border: 1px solid #0b0b0b; text-align: left; }
    .td { border: 1px solid #222; font-size: 11px; padding: 6px; vertical-align: top; }
    .center { text-align: center; }
    .line { font-size: 12px; margin: 6px 0; }
    .muted { color: #333; }
  </style>
</head>
<body>
  <div class="page">
    <p class="title">DOKUMEN PENGIRIMAN</p>
    <p class="sub"><b>Invoice</b>: ${escapeHtml(t.invoice)}</p>

    <div class="grid">
      <div class="card">
        <p class="card-title">QR Invoice & Produk</p>
        <div class="qr">
          <img src="${escapeHtml(qrDataUrl)}" alt="QR" onerror="this.style.display='none'" />
        </div>
        <table>
          <thead>
            <tr><th class="th">Nama Produk</th><th class="th" style="width:70px">Qty</th></tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
      </div>

      <div class="card">
        <p class="card-title">Penerima</p>
        <div class="line"><b>Nama</b>: <span class="muted">${escapeHtml(receiverName || '-')}</span></div>
        <div class="line"><b>No. Telp</b>: <span class="muted">${escapeHtml(receiverPhone || '-')}</span></div>
        <div class="line"><b>Alamat</b>:</div>
        <div class="line muted">${escapeHtml(receiverAddress || '-')}</div>
      </div>

      <div class="card">
        <p class="card-title">Pengirim</p>
        <div class="line"><b>Nama</b>: <span class="muted">Velcrone</span></div>
        <div class="line"><b>No. Telp</b>: <span class="muted">085846655470</span></div>
        <div class="line"><b>Alamat</b>:</div>
        <div class="line muted">Dusun Jumbleng, RT.02/RW.06, Ranjeng, Kec. Cisitu, Kabupaten Sumedang, Jawa Barat 45363</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function createPdfBlobFromHtml(html: string): Promise<Blob> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) throw new Error('Gagal menyiapkan dokumen');

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((r) => win.setTimeout(r, 50));

    const fonts = (doc as unknown as { fonts?: { ready?: Promise<void> } }).fonts;
    if (fonts?.ready) {
      try {
        await fonts.ready;
      } catch {
        void 0;
      }
    }

    const images = Array.from(doc.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const pageEl = (doc.querySelector('.page') as HTMLElement | null) || (doc.body as unknown as HTMLElement);
    const canvas = await html2canvas(pageEl, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: pageEl.scrollWidth,
      windowHeight: pageEl.scrollHeight,
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  } finally {
    iframe.remove();
  }
}

async function downloadPdf(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    toast.error('Popup diblokir browser');
    URL.revokeObjectURL(url);
    return;
  }
  w.focus();
  w.setTimeout(() => {
    try {
      w.print();
    } catch {
      void 0;
    }
  }, 500);
}

async function sharePdf(filename: string, title: string, blob: Blob) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  const nav = navigator as unknown as { share?: (data: unknown) => Promise<void>; canShare?: (data: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title });
    return;
  }
  await downloadPdf(filename, blob);
  toast('Perangkat tidak mendukung share, file diunduh');
}

const statusIcons = {
  completed: <CheckCircle size={20} className="text-velcrone-success" />,
  pending: <Clock size={20} className="text-velcrone-warning" />,
  cancelled: <XCircle size={20} className="text-destructive" />,
};

function formatTimestampJakarta(value: string | null): string {
  if (!value) return '-';
  return `${value} WIB`;
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function getSpkStepStatusStorageKey(args: { invoice: string; productId: string; warna: string | null }): string {
  const warna = args.warna || '';
  return `velcrone:spk_step:${args.invoice}:${args.productId}:${warna}`;
}

function readLocalStorageSafe(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function getSpkCompletionFromLocalStorage(t: Pick<Transaksi, 'invoice' | 'items' | 'spkDetail'>): { done: number; total: number } {
  const grouped = new Map<string, { productId: string; warna: string }>();
  for (const it of t.items || []) {
    const productId = (it.productId || '').trim();
    const warna = (it.warna || '').trim();
    if (!productId) continue;
    const key = `${productId}::${warna}`;
    if (!grouped.has(key)) grouped.set(key, { productId, warna });
  }

  const entries = Array.from(grouped.values());
  const total = entries.length;
  if (!total) return { done: 0, total: 0 };

  let done = 0;
  const hasDbSpkDetail = t.spkDetail && Object.keys(t.spkDetail).length > 0;
  for (const spk of entries) {
    const spkKey = `${spk.productId}::${spk.warna}`;
    if (hasDbSpkDetail) {
      const status = t.spkDetail[spkKey]?.stepStatus || null;
      if (status === 'SELESAI') done += 1;
      continue;
    }

    const key = getSpkStepStatusStorageKey({ invoice: t.invoice, productId: spk.productId, warna: spk.warna });
    const status = readLocalStorageSafe(key);
    if (status === 'SELESAI') done += 1;
  }
  return { done, total };
}

function formatDateJakartaIso(value: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

function getPaymentBadge(paymentStatus: string): { label: string; className: string } {
  const normalized = String(paymentStatus || '').toLowerCase();
  if (normalized === 'lunas') {
    return { label: 'Lunas', className: 'bg-velcrone-success/10 text-velcrone-success' };
  }
  return { label: 'Belum Lunas', className: 'bg-velcrone-warning/10 text-velcrone-warning' };
}

export default function TransactionsPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Transaksi | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: 'umum',
    customerName: '',
    paymentMethod: 'cash',
    items: [{ productId: 'pilih', ukuran: 'pilih', warna: 'pilih', qty: '1', price: '' }],
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const listQuery = useQuery({
    queryKey: ['transaksi'],
    queryFn: async (): Promise<Transaksi[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data transaksi'));
      if (!Array.isArray(payload)) return [];
      return (payload as unknown[])
        .map(normalizeTransaksi)
        .filter((v): v is Transaksi => !!v);
    },
  });

  const markProductionDoneMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus: 'selesai', productionDate: formatDateJakartaIso() }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menandai produksi selesai'));
      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transaksi'] });
    },
  });

  useEffect(() => {
    const data = listQuery.data ?? [];
    for (const t of data) {
      if (t.status === 'cancelled') continue;
      if ((t.productionStatus || '').toLowerCase() === 'selesai') continue;
      const spk = getSpkCompletionFromLocalStorage(t);
      if (spk.total > 0 && spk.done === spk.total) {
        markProductionDoneMutation.mutate({ id: t.id });
      }
    }
  }, [listQuery.data, markProductionDoneMutation]);

  const pelangganDetailQuery = useQuery({
    queryKey: ['pelanggan', 'detail', selected?.customerId || ''],
    enabled: !!selected?.customerId,
    queryFn: async (): Promise<PelangganDetail | null> => {
      if (!selected?.customerId) return null;
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan/${encodeURIComponent(selected.customerId)}`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat detail pelanggan'));
      if (!payload || typeof payload !== 'object') return null;
      const obj = payload as Record<string, unknown>;
      return {
        id: typeof obj.id === 'string' ? obj.id : selected.customerId,
        nama: typeof obj.nama === 'string' ? obj.nama : selected.customerName,
        noTelepon: typeof obj.noTelepon === 'string' ? obj.noTelepon : null,
        alamat: typeof obj.alamat === 'string' ? obj.alamat : null,
        provinsi: typeof obj.provinsi === 'string' ? obj.provinsi : null,
        kotaKab: typeof obj.kotaKab === 'string' ? obj.kotaKab : null,
        kecamatan: typeof obj.kecamatan === 'string' ? obj.kecamatan : null,
        kelurahan: typeof obj.kelurahan === 'string' ? obj.kelurahan : null,
        kodepos: typeof obj.kodepos === 'string' ? obj.kodepos : null,
        kategori: typeof obj.kategori === 'string' ? obj.kategori : null,
      };
    },
  });

  const pelangganQuery = useQuery({
    queryKey: ['pelanggan', 'options'],
    enabled: createOpen,
    queryFn: async (): Promise<PelangganOption[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/pelanggan`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data pelanggan'));
      if (!Array.isArray(payload)) return [];
      return (payload as Array<Record<string, unknown>>)
        .map((p) => ({
          id: typeof p.id === 'string' ? p.id : '',
          nama: typeof p.nama === 'string' ? p.nama : '',
          kategori: typeof p.kategori === 'string' ? p.kategori : null,
        }))
        .filter((p) => p.id && p.nama);
    },
  });

  const barangQuery = useQuery({
    queryKey: ['barang', 'options'],
    enabled: true,
    queryFn: async (): Promise<Barang[]> => {
      const response = await fetch(`${apiBaseUrl}/api/v1/barang`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal memuat data barang'));
      if (!Array.isArray(payload)) return [];
      return (payload as Array<Record<string, unknown>>)
        .map((b) => ({
          kode: typeof b.kode === 'string' ? b.kode : '',
          nama: typeof b.nama === 'string' ? b.nama : '',
          ukuran: Array.isArray(b.ukuran) ? (b.ukuran as unknown[]).filter((v): v is string => typeof v === 'string') : [],
          warna: Array.isArray(b.warna) ? (b.warna as unknown[]).filter((v): v is string => typeof v === 'string') : [],
          hargaJual: typeof b.hargaJual === 'number' ? b.hargaJual : Number(b.hargaJual),
          diskon: typeof b.diskon === 'number' ? b.diskon : Number(b.diskon),
        }))
        .filter((b) => b.kode && b.nama && Number.isFinite(b.hargaJual) && Number.isFinite(b.diskon));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal membuat transaksi'));
      return payload;
    },
    onSuccess: async (payload) => {
      try {
        const obj: Record<string, unknown> | null =
          payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
        const invoice = typeof obj?.invoice === 'string' ? obj.invoice : '';
        if (invoice.trim() && user?.name) {
          localStorage.setItem(`velcrone:invoice_created_by:${invoice}`, user.name);
        }
      } catch {
        void 0;
      }

      toast.success('Transaksi berhasil dibuat');
      setCreateOpen(false);
      setCreateForm({
        customerId: 'umum',
        customerName: '',
        paymentMethod: 'cash',
        items: [{ productId: 'pilih', ukuran: 'pilih', warna: 'pilih', qty: '1', price: '' }],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaksi'] }),
        queryClient.invalidateQueries({ queryKey: ['barang'] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat transaksi');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelReason: reason }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal membatalkan transaksi'));
      return payload;
    },
    onSuccess: async () => {
      toast.success('Transaksi berhasil dibatalkan');
      setCancelOpen(false);
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ['transaksi'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal membatalkan transaksi');
    },
  });

  const filtered = useMemo(() => {
    const all = listQuery.data ?? [];
    const q = search.toLowerCase().trim();
    if (!q) return all;
    return all.filter((t) =>
      t.invoice.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
    );
  }, [listQuery.data, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const barangByKode = useMemo(() => {
    const map = new Map<string, Barang>();
    (barangQuery.data || []).forEach((b) => map.set(b.kode, b));
    return map;
  }, [barangQuery.data]);

  const getBarangInfo = (kode: string) => barangByKode.get(kode) || null;

  const computedItems = useMemo(() => {
    return createForm.items.map((row) => {
      const qty = Math.max(0, Number(row.qty || 0));
      const price =
        row.price.trim() !== ''
          ? Number(row.price)
          : (() => {
              const b = barangByKode.get(row.productId) || null;
              if (!b) return 0;
              return b.hargaJual * (1 - b.diskon / 100);
            })();
      const safePrice = Number.isFinite(price) ? price : 0;
      const b = barangByKode.get(row.productId) || null;
      return {
        ...row,
        qty,
        price: safePrice,
        subtotal: safePrice * qty,
        productName: b?.nama || '',
      };
    });
  }, [barangByKode, createForm.items]);

  const computedTotal = useMemo(() => computedItems.reduce((s, i) => s + i.subtotal, 0), [computedItems]);

  const openCreate = () => {
    setCreateOpen(true);
    setCreateForm({
      customerId: 'umum',
      customerName: '',
      paymentMethod: 'cash',
      items: [{ productId: 'pilih', ukuran: 'pilih', warna: 'pilih', qty: '1', price: '' }],
    });
  };

  const submitCreate = async () => {
    const missingUkuran = computedItems.some((i) => i.productId && i.productId !== 'pilih' && (!i.ukuran || i.ukuran === 'pilih'));
    if (missingUkuran) {
      toast.error('Ukuran wajib dipilih untuk setiap barang');
      return;
    }

    const missingWarna = computedItems.some((i) => {
      if (!i.productId || i.productId === 'pilih') return false;
      const info = getBarangInfo(i.productId);
      if (!info || !Array.isArray(info.warna) || info.warna.length === 0) return false;
      return !i.warna || i.warna === 'pilih';
    });
    if (missingWarna) {
      toast.error('Warna wajib dipilih untuk setiap barang yang memiliki pilihan warna');
      return;
    }

    const itemsPayload = computedItems
      .filter((i) => i.productId && i.productId !== 'pilih' && i.ukuran && i.ukuran !== 'pilih' && i.qty > 0)
      .map((i) => ({
        productId: i.productId,
        ukuran: i.ukuran,
        warna: i.warna && i.warna !== 'pilih' ? i.warna : null,
        qty: i.qty,
        price: i.price,
      }));

    if (itemsPayload.length === 0) {
      toast.error('Minimal 1 item barang');
      return;
    }

    const payload = {
      customerId: createForm.customerId === 'umum' ? null : createForm.customerId.trim(),
      customerName: createForm.customerId === 'umum' ? (createForm.customerName.trim() || 'Umum') : null,
      paymentMethod: createForm.paymentMethod,
      productionStatus: 'order_masuk',
      paymentStatus: 'belum_lunas',
      paymentStep: 0,
      items: itemsPayload,
    };

    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transaksi</h1>
        <Button onClick={openCreate} className="velcrone-gradient text-primary-foreground hover:opacity-90">
          <Plus size={18} className="mr-2" /> Tambah Transaksi
        </Button>
      </div>
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari Transaksi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
        </div>
        <div className="divide-y">
          {listQuery.isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Memuat data...</div>
          ) : listQuery.isError ? (
            <div className="p-6 text-center text-destructive">{listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat transaksi'}</div>
          ) : pageData.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada data</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-3 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="col-span-4">No - Invoice</div>
                <div className="col-span-3">Nama Pelanggan</div>
                <div className="col-span-2">Status Produksi</div>
                <div className="col-span-2">Status Pembayaran</div>
                <div className="col-span-1 text-right">Total</div>
              </div>
              {pageData.map((t, idx) => {
                const sc = getStatusColor(t.status) || getStatusColor('pending');
                const pay = getPaymentBadge(t.paymentStatus);
                const no = (page - 1) * perPage + idx + 1;
                const spk = getSpkCompletionFromLocalStorage(t);
                const spkLabel = spk.total ? `${spk.done}/${spk.total} Selesai` : '-';
                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-12 gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors items-center"
                    onClick={() => setSelected(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelected(t);
                    }}
                  >
                    <div className="col-span-4 min-w-0">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5">{statusIcons[t.status] || statusIcons.pending}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {no}. {t.invoice}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatTimestampJakarta(t.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-foreground truncate">{t.customerName || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-sm ${spk.total > 0 && spk.done === spk.total ? 'text-velcrone-success' : 'text-foreground'}`}>
                        {spkLabel}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pay.className}`}>{pay.label}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="font-semibold text-foreground tabular-nums text-sm">{formatRupiah(t.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} font-medium capitalize`}>{t.status}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">{(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} dari {filtered.length}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-md text-sm ${page === i + 1 ? 'velcrone-gradient text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Detail Transaksi</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{selected.invoice}</p>
                  <p className="text-sm text-muted-foreground">{formatTimestampJakarta(selected.date)}</p>
                  <p className="text-sm text-muted-foreground">{selected.customerName}</p>
                </div>
                {statusIcons[selected.status]}
              </div>
              {selected.status === 'cancelled' && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">Alasan dibatalkan</p>
                  <p className="text-muted-foreground mt-1">{selected.cancelReason || '-'}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="font-medium text-foreground mb-3">Detail Barang:</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.productName} ({item.qty}x)</span>
                      <span className="tabular-nums text-foreground">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="tabular-nums text-foreground">{formatRupiah(selected.total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  disabled={selected.status === 'cancelled'}
                  onClick={() => {
                    setCancelReason('');
                    setCancelOpen(true);
                  }}
                >
                  Batalkan
                </Button>
              </div>
              <div className="space-y-3 pt-1">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground">Invoice</p>
                  <div className="flex justify-center gap-3 mt-2">
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 130);
                          const html = buildInvoiceHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            logoUrl: logoValcrone,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          await downloadPdf(`invoice-${selected.invoice}.pdf`, pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF invoice');
                        }
                      }}
                      type="button"
                      aria-label="Download invoice"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 130);
                          const html = buildInvoiceHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            logoUrl: logoValcrone,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          await sharePdf(`invoice-${selected.invoice}.pdf`, `Invoice ${selected.invoice}`, pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF invoice');
                        }
                      }}
                      type="button"
                      aria-label="Share invoice"
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 130);
                          const html = buildInvoiceHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            logoUrl: logoValcrone,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          printPdf(pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF invoice');
                        }
                      }}
                      type="button"
                      aria-label="Print invoice"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground">Pengiriman</p>
                  <div className="flex justify-center gap-3 mt-2">
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 160);
                          const html = buildShippingHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          await downloadPdf(`pengiriman-${selected.invoice}.pdf`, pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF pengiriman');
                        }
                      }}
                      type="button"
                      aria-label="Download pengiriman"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 160);
                          const html = buildShippingHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          await sharePdf(`pengiriman-${selected.invoice}.pdf`, `Pengiriman ${selected.invoice}`, pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF pengiriman');
                        }
                      }}
                      type="button"
                      aria-label="Share pengiriman"
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      className="w-12 h-12 rounded-full velcrone-gradient flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={async () => {
                        try {
                          const p = pelangganDetailQuery.data || null;
                          const receiverAddress = buildPelangganFullAddress(p);
                          const qrDataUrl = await createQrDataUrl(selected.invoice, 160);
                          const html = buildShippingHtml({
                            t: selected,
                            receiverName: p?.nama || selected.customerName,
                            receiverPhone: p?.noTelepon || '',
                            receiverAddress,
                            qrDataUrl,
                          });
                          const pdfBlob = await createPdfBlobFromHtml(html);
                          printPdf(pdfBlob);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF pengiriman');
                        }
                      }}
                      type="button"
                      aria-label="Print pengiriman"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Batalkan Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alasan pembatalan</Label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-1" placeholder="Contoh: pelanggan membatalkan pesanan" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelMutation.isPending}>Batal</Button>
              <Button
                onClick={async () => {
                  if (!selected) return;
                  const reason = cancelReason.trim();
                  if (!reason) {
                    toast.error('Alasan pembatalan wajib diisi');
                    return;
                  }
                  await cancelMutation.mutateAsync({ id: selected.id, reason });
                }}
                disabled={cancelMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card w-full max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nama Pelanggan</Label>
                <Select
                  value={createForm.customerId}
                  onValueChange={(value) => setCreateForm((f) => ({ ...f, customerId: value }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="umum">Umum</SelectItem>
                    {(pelangganQuery.data || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.customerId === 'umum' && (
                  <div className="mt-3">
                    <Label>Nama Pelanggan (opsional)</Label>
                    <Input
                      value={createForm.customerName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, customerName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Kategori</Label>
                  <Input
                    value={
                      createForm.customerId !== 'umum'
                        ? ((pelangganQuery.data || []).find((p) => p.id === createForm.customerId)?.kategori || '-')
                        : '-'
                    }
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label>Metode Pembayaran</Label>
                  <Select value={createForm.paymentMethod} onValueChange={(value) => setCreateForm((f) => ({ ...f, paymentMethod: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cicil">Cicil</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                <div className="col-span-4">Barang</div>
                <div className="col-span-2 text-right">Warna</div>
                <div className="col-span-2 text-right">Ukuran</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Harga</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y">
                {createForm.items.map((row, idx) => {
                  const info = getBarangInfo(row.productId);
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center">
                      <div className="col-span-4">
                        <Select
                          value={row.productId}
                          onValueChange={(value) => {
                            const nextInfo = getBarangInfo(value);
                            const defaultPrice = nextInfo ? nextInfo.hargaJual * (1 - nextInfo.diskon / 100) : 0;
                            setCreateForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      productId: value,
                                      ukuran: nextInfo?.ukuran?.[0] || 'pilih',
                                      warna: nextInfo?.warna?.[0] || 'pilih',
                                      price: nextInfo ? String(Math.max(0, Math.round(defaultPrice))) : '',
                                    }
                                  : it
                              ),
                            }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Pilih barang" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pilih">Pilih barang</SelectItem>
                            {(barangQuery.data || []).map((b) => (
                              <SelectItem key={b.kode} value={b.kode}>{b.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {info && (
                          <p className="text-xs text-muted-foreground mt-1">{info.kode}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={row.warna}
                          onValueChange={(value) => {
                            setCreateForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, warna: value } : it),
                            }));
                          }}
                          disabled={!info || info.warna.length === 0}
                        >
                          <SelectTrigger className="text-right"><SelectValue placeholder="Warna" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pilih">Pilih</SelectItem>
                            {(info?.warna || []).map((w) => (
                              <SelectItem key={w} value={w}>{w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={row.ukuran}
                          onValueChange={(value) => {
                            setCreateForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) => i === idx ? { ...it, ukuran: value } : it),
                            }));
                          }}
                          disabled={!info || info.ukuran.length === 0}
                        >
                          <SelectTrigger className="text-right"><SelectValue placeholder="Ukuran" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pilih">Pilih</SelectItem>
                            {(info?.ukuran || []).map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          value={row.qty}
                          onChange={(e) => setCreateForm((f) => ({
                            ...f,
                            items: f.items.map((it, i) => i === idx ? { ...it, qty: e.target.value } : it),
                          }))}
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={row.price}
                          onChange={(e) => setCreateForm((f) => ({
                            ...f,
                            items: f.items.map((it, i) => i === idx ? { ...it, price: e.target.value } : it),
                          }))}
                          onBlur={() => {
                            const info = getBarangInfo(row.productId);
                            if (!info) return;
                            if (row.price.trim() !== '') return;
                            const defaultPrice = info.hargaJual * (1 - info.diskon / 100);
                            setCreateForm((f) => ({
                              ...f,
                              items: f.items.map((it, i) =>
                                i === idx ? { ...it, price: String(Math.max(0, Math.round(defaultPrice))) } : it
                              ),
                            }));
                          }}
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => {
                            setCreateForm((f) => ({
                              ...f,
                              items: f.items.length <= 1 ? f.items : f.items.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          type="button"
                          aria-label="Hapus item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateForm((f) => ({ ...f, items: [...f.items, { productId: 'pilih', ukuran: 'pilih', warna: 'pilih', qty: '1', price: '' }] }))}
                >
                  <Plus size={16} className="mr-2" /> Tambah Item
                </Button>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold tabular-nums text-foreground">{formatRupiah(computedTotal)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>Batal</Button>
              <Button onClick={submitCreate} disabled={createMutation.isPending} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
