import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, Eye, Pencil, Printer, Search, ImagePlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import logoValcrone from '@/assets/logo-valcrone.png';

type ProductionStatus =
  | 'order_masuk'
  | 'quotation'
  | 'persetujuan_desain'
  | 'sampel'
  | 'pembelian_material'
  | 'pembuatan_pola'
  | 'cutting'
  | 'print_bordir'
  | 'sewing'
  | 'finishing'
  | 'qc'
  | 'packing'
  | 'shipping'
  | 'diterima_konsumen'
  | 'selesai';

type TransaksiItem = {
  productId: string;
  productName: string;
  ukuran: string;
  warna: string;
  qty: number;
  price: number;
  subtotal: number;
};

type TransaksiStatus = 'pending' | 'completed' | 'cancelled';

type BarangRow = {
  kode: string;
  kategori: string | null;
  jenis: string[];
};

type SpkDetailEntry = {
  stepStatus: string | null;
  deadlineDate: string | null;
};

type SpkDetailMap = Record<string, SpkDetailEntry>;

type TransaksiRow = {
  id: string;
  invoice: string;
  date: string | null;
  customerName: string;
  status: TransaksiStatus;
  productionStatus: ProductionStatus;
  spkDetail: SpkDetailMap;
  items: TransaksiItem[];
  total: number;
};

type SpkRow = {
  id: string;
  transaksiId: string;
  spkNumber: string;
  invoice: string;
  orderDate: string | null;
  deadlineDate: string | null;
  stepStatus: SpkStepStatus | null;
  kategoriProduk: string | null;
  productId: string;
  productName: string;
  warnaProduk: string | null;
  jenisProduk: string[];
  qty: number;
  sizes: { size: string; qty: number }[];
  customerName: string;
  status: TransaksiStatus;
  productionStatus: ProductionStatus;
};

const SPK_STEP_OPTIONS = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'] as const;
type SpkStepStatus = (typeof SPK_STEP_OPTIONS)[number];

type SpkMaterials = {
  kerah: string;
  body: string;
  aplikasi: string;
  lengan: string;
  celana: string;
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
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

function coerceProductionStatus(value: unknown): ProductionStatus {
  const v = typeof value === 'string' ? value : '';
  const allowed: ProductionStatus[] = [
    'order_masuk',
    'quotation',
    'persetujuan_desain',
    'sampel',
    'pembelian_material',
    'pembuatan_pola',
    'cutting',
    'print_bordir',
    'sewing',
    'finishing',
    'qc',
    'packing',
    'shipping',
    'diterima_konsumen',
    'selesai',
  ];
  return (allowed as string[]).includes(v) ? (v as ProductionStatus) : 'order_masuk';
}

function coerceTransaksiStatus(value: unknown): TransaksiStatus {
  const v = typeof value === 'string' ? value : '';
  if (v === 'pending' || v === 'completed' || v === 'cancelled') return v;
  return 'pending';
}

function normalizeItems(value: unknown): TransaksiItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const productId = typeof obj.productId === 'string' ? obj.productId : '';
      const productName = typeof obj.productName === 'string' ? obj.productName : '';
      const ukuran = typeof obj.ukuran === 'string' ? obj.ukuran : '';
      const warna = typeof obj.warna === 'string' ? obj.warna : '';
      const qty = typeof obj.qty === 'number' ? obj.qty : Number(obj.qty);
      const price = typeof obj.price === 'number' ? obj.price : Number(obj.price);
      const subtotal = typeof obj.subtotal === 'number' ? obj.subtotal : Number(obj.subtotal);
      if (!productId || !productName) return null;
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
}

function normalizeSpkDetail(value: unknown): SpkDetailMap {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const out: SpkDetailMap = {};
  for (const [key, raw] of Object.entries(obj)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const step = typeof row.stepStatus === 'string' ? row.stepStatus : null;
    const stepStatus = step && (SPK_STEP_OPTIONS as readonly string[]).includes(step) ? step : null;
    const deadlineDate = typeof row.deadlineDate === 'string' && row.deadlineDate.trim() ? row.deadlineDate.slice(0, 10) : null;
    out[key] = { stepStatus, deadlineDate };
  }
  return out;
}

function normalizeTransaksi(raw: unknown): TransaksiRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const invoice = typeof obj.invoice === 'string' ? obj.invoice : '';
  if (!id || !invoice) return null;

  const date = typeof obj.date === 'string' ? obj.date : null;
  const customerName = typeof obj.customerName === 'string' ? obj.customerName : 'Umum';
  const status = coerceTransaksiStatus(obj.status);
  const productionStatus = coerceProductionStatus(obj.productionStatus);
  const spkDetail = normalizeSpkDetail(obj.spkDetail);
  const items = normalizeItems(obj.items);
  const total = typeof obj.total === 'number' ? obj.total : Number(obj.total);

  return {
    id,
    invoice,
    date,
    customerName,
    status,
    productionStatus,
    spkDetail,
    items,
    total: Number.isFinite(total) ? total : 0,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function createQrDataUrl(data: string, size: number): Promise<string> {
  return await QRCode.toDataURL(data, { width: size, margin: 0 });
}

function formatDateDisplay(value: string | null): string {
  if (!value) return '-';
  const datePart = value.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function formatPrintedAtJakarta(): { date: string; time: string } {
  const d = new Date();
  const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date, time };
}

function formatDateJakartaIso(value: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

function buildSpkHtml(args: {
  row: SpkRow;
  logoUrl: string;
  qrDataUrl: string;
  printedAtDate: string;
  printedAtTime: string;
  designImageSrc: string | null;
  sponsorImageSrc: string | null;
  materials: SpkMaterials;
}): string {
  const { row, logoUrl, qrDataUrl, printedAtDate, printedAtTime, designImageSrc, sponsorImageSrc, materials } = args;
  const qtyText = `${row.qty} pcs`;
  const orderDate = formatDateDisplay(row.orderDate);
  const deadlineDate = row.deadlineDate ? formatDateDisplay(row.deadlineDate) : '-';

  const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const sizesSorted = [...(row.sizes || [])].sort((a, b) => {
    const ai = sizeOrder.indexOf(a.size.toUpperCase());
    const bi = sizeOrder.indexOf(b.size.toUpperCase());
    if (ai === -1 && bi === -1) return a.size.localeCompare(b.size);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const sizes = sizesSorted.length ? sizesSorted : [{ size: '-', qty: 0 }];
  const maxRows = 5;
  const rows = Array.from({ length: Math.max(maxRows, sizes.length) }, (_, i) => sizes[i] || { size: '', qty: 0 });

  const assignToPants = row.jenisProduk.includes('Pants') && !row.jenisProduk.includes('Atasan');
  const totalQty = sizesSorted.reduce((acc, s) => acc + (Number.isFinite(s.qty) ? s.qty : 0), 0) || row.qty || 0;

  const sizeRowsHtml = rows
    .slice(0, maxRows)
    .map((r) => {
      const size = escapeHtml(r.size || '');
      const qty = escapeHtml(r.qty ? String(r.qty) : '');
      const atasanSize = assignToPants ? '' : size;
      const atasanQty = assignToPants ? '' : qty;
      const pantsSize = assignToPants ? size : '';
      const pantsQty = assignToPants ? qty : '';
      return `<tr>
  <td class="cell center">${atasanSize}</td>
  <td class="cell center">${atasanQty}</td>
  <td class="cell center">${pantsSize}</td>
  <td class="cell center">${pantsQty}</td>
  <td class="cell"></td>
</tr>`;
    })
    .join('');

  const stepsOrder: SpkStepStatus[] = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY'];

  const readLocalStorageSafe = (key: string): string | null => {
    try {
      const v = localStorage.getItem(key);
      return v && v.trim() ? v : null;
    } catch {
      return null;
    }
  };

  const buildDoneDateKey = (step: SpkStepStatus): string => {
    const warna = row.warnaProduk || '';
    return `velcrone:spk_step_done:${row.invoice}:${row.productId}:${warna}:${step}`;
  };

  const buildDoneByKey = (step: SpkStepStatus): string => {
    const warna = row.warnaProduk || '';
    return `velcrone:spk_step_done_by:${row.invoice}:${row.productId}:${warna}:${step}`;
  };

  const invoiceCreatedBy = readLocalStorageSafe(`velcrone:invoice_created_by:${row.invoice}`) || 'SYSTEM';

  const stepsNamaRowHtml = stepsOrder
    .map((step) => {
      const doneBy = readLocalStorageSafe(buildDoneByKey(step)) || '';
      return `<td class="nama">Nama : ${escapeHtml(doneBy)}</td>`;
    })
    .join('');

  const stepsTglRowHtml = stepsOrder
    .map((step) => {
      const doneDateRaw = readLocalStorageSafe(buildDoneDateKey(step));
      const doneDate = doneDateRaw ? formatDateDisplay(doneDateRaw) : '';
      return `<td class="tgl">Tgl : ${escapeHtml(doneDate)}</td>`;
    })
    .join('');

  const kerah = escapeHtml(materials.kerah || '-');
  const body = escapeHtml(materials.body || '-');
  const aplikasi = escapeHtml(materials.aplikasi || '-');
  const lengan = escapeHtml(materials.lengan || '-');
  const celana = escapeHtml(materials.celana || '-');

  const designHtml = designImageSrc
    ? `<img class="visual-img" src="${escapeHtml(designImageSrc)}" alt="Design" onerror="this.outerHTML='<div class=&quot;visual-note&quot;>Gambar akan di tampilkan di sini</div>'" />`
    : `<div class="visual-note">Gambar akan di tampilkan di sini</div>`;
  const sponsorHtml = sponsorImageSrc
    ? `<img class="visual-img" src="${escapeHtml(sponsorImageSrc)}" alt="Sponsor" onerror="this.outerHTML='<div class=&quot;visual-note&quot;>Sponsor akan di masukan di sini</div>'" />`
    : `<div class="visual-note">Sponsor akan di masukan di sini</div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SPK ${escapeHtml(row.spkNumber)}</title>
  <style>
    @page { size: A4; margin: 6mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
    .page { width: 210mm; height: 297mm; border: 1px solid #bdbdbd; padding: 7mm; overflow: hidden; }
    .top { display: grid; grid-template-columns: 100px 1fr 100px; gap: 6mm; align-items: start; }
    .qr { width: 80px; height: 80px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .qr img { width: 80px; height: 80px; object-fit: cover; }
    .title { padding-top: 6px; }
    .spkno { font-size: 16px; font-weight: 800; letter-spacing: 0.3px; }
    .prod { font-size: 14px; font-weight: 800; margin-top: 2px; text-transform: uppercase; }
    .cust { font-size: 18px; font-weight: 900; margin-top: 2px; text-transform: uppercase; }
    .admin { border: 1px solid #111; width: 100%; }
    .admin .h { background: #2f2f2f; color: #fff; font-weight: 800; text-align: center; padding: 6px 0; font-size: 12px; }
    .admin .v { text-align: center; padding: 10px 0; font-weight: 800; font-size: 12px; }
    .section { margin-top: 6mm; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; align-items: start; }
    .block { border: 1px solid #111; }
    .block-title { background: #d9d9d9; padding: 6px 8px; font-weight: 800; font-size: 12px; }
    .order { padding: 8px; font-size: 11px; }
    .order-grid { display: grid; grid-template-columns: 120px 10px 1fr; gap: 4px 8px; align-items: center; }
    .order-grid div { padding: 2px 0; }
    table { width: 100%; border-collapse: collapse; }
    .cell { border: 1px solid #111; font-size: 11px; padding: 6px; height: 22px; vertical-align: middle; }
    .center { text-align: center; }
    .head { background: #d9d9d9; font-weight: 800; }
    .materials { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
    .mat-body { padding: 8px; font-size: 11px; min-height: 70px; }
    .mat-grid { display: grid; grid-template-columns: 80px 10px 1fr; gap: 4px 8px; }
    .mat-right { display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; min-height: 80px; }
    .visual { border: 1px solid #111; margin-top: 6mm; }
    .visual table { width: 100%; border-collapse: collapse; }
    .visual th { background: #d9d9d9; border: 1px solid #111; font-size: 12px; padding: 6px 8px; text-align: center; font-weight: 900; }
    .visual td { border: 1px solid #111; min-height: 95mm; height: 95mm; padding: 10px; vertical-align: middle; }
    .visual-note { color: #666; font-weight: 700; font-size: 12px; text-transform: uppercase; text-align: center; }
    .visual-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .steps { margin-top: 6mm; border: 1px solid #111; }
    .steps table th { background: #2f2f2f; color: #fff; font-size: 11px; padding: 6px 4px; border: 1px solid #111; }
    .steps table td { border: 1px solid #111; height: 26px; }
    .steps .nama { font-size: 10px; color: #333; padding: 4px; }
    .steps .tgl { font-size: 10px; color: #333; padding: 4px; }
    .footer { margin-top: 6mm; display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 10px; color: #333; }
    .footer div:nth-child(2) { text-align: center; font-weight: 700; }
    .footer div:nth-child(3) { text-align: right; }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div class="qr"><img src="${escapeHtml(qrDataUrl)}" alt="QR" onerror="this.style.display='none'" /></div>
      <div class="title">
        <div class="spkno">${escapeHtml(row.spkNumber)}</div>
        <div class="prod">${escapeHtml(row.productName)}</div>
        <div class="cust">${escapeHtml(row.customerName)}</div>
      </div>
      <div class="admin">
        <div class="h">ADMIN</div>
        <div class="v">${escapeHtml(invoiceCreatedBy)}</div>
      </div>
    </div>

    <div class="section row2">
      <div class="block">
        <div class="block-title">DATA ORDER</div>
        <div class="order">
          <div class="order-grid">
            <div>Nomor SPK</div><div>:</div><div><b>${escapeHtml(row.spkNumber)}</b></div>
            <div>No. Kwitansi</div><div>:</div><div><b>${escapeHtml(row.invoice)}</b></div>
            <div>Tanggal Order</div><div>:</div><div><b>${escapeHtml(orderDate)}</b></div>
            <div>Tanggal Deadline</div><div>:</div><div><b>${escapeHtml(deadlineDate)}</b></div>
            <div>Nama Produk</div><div>:</div><div><b>${escapeHtml(row.productName)}</b></div>
            <div>Warna</div><div>:</div><div><b>${escapeHtml(row.warnaProduk || '-')}</b></div>
            <div>Kategori</div><div>:</div><div><b>${escapeHtml(row.kategoriProduk || '-')}</b></div>
            <div>Jumlah</div><div>:</div><div><b>${escapeHtml(qtyText)}</b></div>
          </div>
        </div>
      </div>

      <div class="block">
        <table>
          <thead>
            <tr>
              <th class="cell head center" colspan="2">Atasan</th>
              <th class="cell head center" colspan="2">Pants</th>
              <th class="cell head center">KET</th>
            </tr>
            <tr>
              <th class="cell head center">Size</th>
              <th class="cell head center">Jml</th>
              <th class="cell head center">Size</th>
              <th class="cell head center">Jml</th>
              <th class="cell head center"></th>
            </tr>
          </thead>
          <tbody>
            ${sizeRowsHtml}
            <tr>
              <td class="cell head center">JML</td>
              <td class="cell head center">${assignToPants ? '' : escapeHtml(String(totalQty || ''))}</td>
              <td class="cell head center">JML</td>
              <td class="cell head center">${assignToPants ? escapeHtml(String(totalQty || '')) : ''}</td>
              <td class="cell head"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section materials">
      <div class="block">
        <div class="block-title">MATERIAL GEARSET</div>
        <div class="mat-body">
          <div class="mat-grid">
            <div>Kerah</div><div>:</div><div>${kerah}</div>
            <div>Body</div><div>:</div><div>${body}</div>
            <div>Aplikasi</div><div>:</div><div>${aplikasi}</div>
            <div>Lengan</div><div>:</div><div>${lengan}</div>
            <div>Celana</div><div>:</div><div>${celana}</div>
          </div>
        </div>
      </div>
      <div class="block">
        <div class="block-title">MATERIAL NON GEARSET</div>
        <div class="mat-right">-</div>
      </div>
    </div>

    <div class="visual">
      <table>
        <thead>
          <tr>
            <th style="width:75%">DESIGN</th>
            <th style="width:25%">SPONSOR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${designHtml}</td>
            <td>${sponsorHtml}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="steps">
      <table>
        <thead>
          <tr>
            <th>DESIGN</th>
            <th>SETTING</th>
            <th>PRINTING</th>
            <th>HEAT PRESS</th>
            <th>SEWING</th>
            <th>QC</th>
            <th>PACKING</th>
            <th>DELIVERY</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            ${stepsNamaRowHtml}
          </tr>
          <tr>
            ${stepsTglRowHtml}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>${escapeHtml(printedAtDate)}</div>
      <div>SPK</div>
      <div>${escapeHtml(printedAtTime)}</div>
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

async function createSpkPdfBlob(row: SpkRow): Promise<Blob> {
  const materialsObj = safeParseJsonObject(localStorage.getItem(getSpkMaterialsStorageKey(row)));
  const materials: SpkMaterials = {
    kerah: typeof materialsObj?.kerah === 'string' ? (materialsObj.kerah as string) : '',
    body: typeof materialsObj?.body === 'string' ? (materialsObj.body as string) : '',
    aplikasi: typeof materialsObj?.aplikasi === 'string' ? (materialsObj.aplikasi as string) : '',
    lengan: typeof materialsObj?.lengan === 'string' ? (materialsObj.lengan as string) : '',
    celana: typeof materialsObj?.celana === 'string' ? (materialsObj.celana as string) : '',
  };

  const designUrlRaw = coerceStoredUploadValue(localStorage.getItem(getSpkDesignImageStorageKey(row)) || '');
  const sponsorUrlRaw = coerceStoredUploadValue(localStorage.getItem(getSpkSponsorImageStorageKey(row)) || '');
  const designUrl = resolveStoredUploadUrlForFetch(designUrlRaw);
  const sponsorUrl = resolveStoredUploadUrlForFetch(sponsorUrlRaw);
  const [designImageDataUrl, sponsorImageDataUrl] = await Promise.all([
    designUrl ? fetchImageAsDataUrl(designUrl) : Promise.resolve(null),
    sponsorUrl ? fetchImageAsDataUrl(sponsorUrl) : Promise.resolve(null),
  ]);
  const designImageSrc = designImageDataUrl || resolveStoredUploadUrl(designUrlRaw) || null;
  const sponsorImageSrc = sponsorImageDataUrl || resolveStoredUploadUrl(sponsorUrlRaw) || null;

  const qrDataUrl = await createQrDataUrl(`${row.spkNumber}|${row.invoice}|${row.productId}`, 240);
  const { date, time } = formatPrintedAtJakarta();
  const html = buildSpkHtml({
    row,
    logoUrl: logoValcrone,
    qrDataUrl,
    printedAtDate: date,
    printedAtTime: time,
    designImageSrc,
    sponsorImageSrc,
    materials,
  });
  return await createPdfBlobFromHtml(html);
}

function parseInvoiceParts(invoice: string): { trxPart: string; month: string; year: string } {
  const parts = invoice.split('/').map((p) => p.trim());
  const trxPart = parts.find((p) => /^TRX-\d{3}$/i.test(p)) || 'TRX-000';
  const month = parts.length >= 2 && /^\d{2}$/.test(parts[parts.length - 2] || '') ? (parts[parts.length - 2] as string) : '01';
  const year = parts.length >= 1 && /^\d{4}$/.test(parts[parts.length - 1] || '') ? (parts[parts.length - 1] as string) : '1970';
  return { trxPart: trxPart.toUpperCase(), month, year };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getSpkMaterialsStorageKey(row: Pick<SpkRow, 'invoice' | 'productId' | 'warnaProduk'>): string {
  const warna = row.warnaProduk || '';
  return `velcrone:spk_materials:${row.invoice}:${row.productId}:${warna}`;
}

function getSpkDesignImageStorageKey(row: Pick<SpkRow, 'invoice' | 'productId' | 'warnaProduk'>): string {
  const warna = row.warnaProduk || '';
  return `velcrone:spk_image_design:${row.invoice}:${row.productId}:${warna}`;
}

function getSpkSponsorImageStorageKey(row: Pick<SpkRow, 'invoice' | 'productId' | 'warnaProduk'>): string {
  const warna = row.warnaProduk || '';
  return `velcrone:spk_image_sponsor:${row.invoice}:${row.productId}:${warna}`;
}

function safeParseJsonObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const v = JSON.parse(value);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractUploadsFilename(path: string): string {
  const v = String(path || '').trim();
  if (!v) return '';
  const i = v.lastIndexOf('/uploads/') === -1 ? v.lastIndexOf('uploads/') : v.lastIndexOf('/uploads/');
  if (i === -1) return '';
  const after = v.slice(i + (v[i] === '/' ? '/uploads/'.length : 'uploads/'.length));
  const q = after.split('?')[0]?.split('#')[0] || '';
  return q.trim();
}

function extractSpkApiFilename(value: string): string {
  const v = String(value || '').trim();
  if (!v) return '';
  const i = v.indexOf('/uploads/spk/');
  if (i === -1) return '';
  const after = v.slice(i + '/uploads/spk/'.length);
  const q = after.split('?')[0]?.split('#')[0] || '';
  return q.trim();
}

function extractBrokenUploadsHostFilename(value: string): string {
  const v = String(value || '').trim();
  if (!/^https?:\/\//i.test(v)) return '';
  try {
    const u = new URL(v);
    if (String(u.hostname || '').toLowerCase() !== 'uploads') return '';
    const path = String(u.pathname || '').replace(/^\/+/, '');
    if (!path) return '';
    const normalized = path.startsWith('uploads/') ? path.slice('uploads/'.length) : path;
    return normalized.trim();
  } catch {
    return '';
  }
}

function looksLikeUploadFilename(value: string): boolean {
  const v = String(value || '').trim();
  if (!v) return false;
  if (v.includes('/') || v.includes('\\')) return false;
  return /^[A-Za-z0-9_.-]+\.(png|jpe?g|webp)$/i.test(v) || (/^spk_[A-Za-z0-9_.-]+$/i.test(v) && !v.includes('..'));
}

function unquoteMaybe(value: string): string {
  const v = String(value || '').trim();
  if (v.length >= 2) {
    const first = v[0];
    const last = v[v.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) return v.slice(1, -1);
  }
  return v;
}

function coerceStoredUploadValue(value: string): string {
  const v = String(value || '').trim();
  if (!v) return '';
  const obj = v.startsWith('{') ? safeParseJsonObject(v) : null;
  const path = obj && typeof obj.path === 'string' ? (obj.path as string) : '';
  const url = obj && typeof obj.url === 'string' ? (obj.url as string) : '';
  const resolved = unquoteMaybe((path || url || v).trim());
  if (/^https?:\/\//i.test(resolved)) {
    try {
      const u = new URL(resolved);
      if (String(u.hostname || '').toLowerCase() === 'uploads') {
        return String(u.pathname || '').replace(/^\/+/, '');
      }
    } catch {
      void 0;
    }
  }
  return resolved;
}

function normalizeUploadsPath(value: string): string {
  const v = coerceStoredUploadValue(value);
  if (!v) return '';
  if (v.startsWith('uploads/')) return `/${v}`;
  return v;
}

function normalizeUploadValueForStorage(value: string): string {
  const raw = coerceStoredUploadValue(value);
  if (!raw) return '';
  if (raw.startsWith('/uploads/')) return raw;
  if (raw.startsWith('uploads/')) return `/${raw}`;
  if (/^https?:\/\//i.test(raw)) {
    const apiFilename = extractSpkApiFilename(raw);
    if (apiFilename) return apiFilename;
    const brokenHostFilename = extractBrokenUploadsHostFilename(raw);
    if (brokenHostFilename && looksLikeUploadFilename(brokenHostFilename)) return brokenHostFilename;
    const uploadsFilename = extractUploadsFilename(raw);
    if (uploadsFilename && looksLikeUploadFilename(uploadsFilename)) return uploadsFilename;
    return raw;
  }
  const uploadsFilename = extractUploadsFilename(raw);
  if (uploadsFilename && looksLikeUploadFilename(uploadsFilename)) return uploadsFilename;
  if (looksLikeUploadFilename(raw)) return raw;
  return raw;
}

function resolveStoredUploadUrl(value: string): string {
  const raw = normalizeUploadsPath(value);
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  const uploadsFilenameAny = extractUploadsFilename(raw);
  if (uploadsFilenameAny) return `${window.location.origin}/uploads/${encodeURIComponent(uploadsFilenameAny)}`;
  if (/^https?:\/\//i.test(raw)) {
    const brokenHostFilename = extractBrokenUploadsHostFilename(raw);
    if (brokenHostFilename && looksLikeUploadFilename(brokenHostFilename)) {
      return `${window.location.origin}/uploads/${encodeURIComponent(brokenHostFilename)}`;
    }
    const apiFilename = extractSpkApiFilename(raw);
    if (apiFilename) return `${window.location.origin}/uploads/${encodeURIComponent(apiFilename)}`;
    return raw;
  }
  if (raw.startsWith('/uploads/')) {
    return `${window.location.origin}${raw}`;
  }
  if (looksLikeUploadFilename(raw)) {
    return `${window.location.origin}/uploads/${encodeURIComponent(raw)}`;
  }
  return raw;
}

function resolveStoredUploadUrlForFetch(value: string): string {
  const raw = normalizeUploadsPath(value);
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('/uploads/') || /^https?:\/\//i.test(raw) || looksLikeUploadFilename(raw)) {
    const apiFilename = extractSpkApiFilename(raw);
    if (apiFilename) return `${window.location.origin}/uploads/${encodeURIComponent(apiFilename)}`;
    const brokenHostFilename = extractBrokenUploadsHostFilename(raw);
    if (brokenHostFilename && looksLikeUploadFilename(brokenHostFilename)) {
      return `${window.location.origin}/uploads/${encodeURIComponent(brokenHostFilename)}`;
    }
    return resolveStoredUploadUrl(raw);
  }
  return resolveStoredUploadUrl(raw);
}

function revokeObjectUrlMaybe(url: string) {
  const v = String(url || '').trim();
  if (v.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(v);
    } catch {
      void 0;
    }
  }
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  try {
    const res = await fetch(raw);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
    return dataUrl && dataUrl.startsWith('data:') ? dataUrl : null;
  } catch {
    return null;
  }
}

export default function ListSpkPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openInvoices, setOpenInvoices] = useState<Record<string, boolean>>({});
  const [stepOverrides, setStepOverrides] = useState<Record<string, SpkStepStatus | null>>({});
  const [selectedDetail, setSelectedDetail] = useState<SpkRow | null>(null);
  const [selectedEdit, setSelectedEdit] = useState<SpkRow | null>(null);
  const [editDeadlineDate, setEditDeadlineDate] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<SpkRow | null>(null);
  const [designMaterials, setDesignMaterials] = useState<SpkMaterials>({ kerah: '', body: '', aplikasi: '', lengan: '', celana: '' });
  const [designImageFile, setDesignImageFile] = useState<File | null>(null);
  const [sponsorImageFile, setSponsorImageFile] = useState<File | null>(null);
  const [designImagePreview, setDesignImagePreview] = useState('');
  const [sponsorImagePreview, setSponsorImagePreview] = useState('');
  const [designImagePath, setDesignImagePath] = useState('');
  const [sponsorImagePath, setSponsorImagePath] = useState('');
  const [designSaving, setDesignSaving] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl('');
    }
  };

  const openPdfPreview = (blob: Blob) => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    const url = URL.createObjectURL(blob);
    setPdfPreviewBlob(blob);
    setPdfPreviewUrl(url);
    setPdfPreviewOpen(true);
  };

  const previewSpk = async (row: SpkRow) => {
    const t = toast.loading('Menyiapkan preview PDF SPK...');
    try {
      const blob = await createSpkPdfBlob(row);
      toast.dismiss(t);
      openPdfPreview(blob);
    } catch (e) {
      toast.dismiss(t);
      toast.error(e instanceof Error ? e.message : 'Gagal menyiapkan preview PDF SPK');
    }
  };

  const listQuery = useQuery({
    queryKey: ['transaksi', 'spk'],
    queryFn: async (): Promise<SpkRow[]> => {
      const [transaksiRes, barangRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/transaksi`),
        fetch(`${apiBaseUrl}/api/v1/barang`),
      ]);

      const transaksiPayload = await parseJsonSafe(transaksiRes);
      if (!transaksiRes.ok) throw new Error(getApiErrorMessage(transaksiPayload, 'Gagal memuat data transaksi'));

      const barangPayload = await parseJsonSafe(barangRes);
      if (!barangRes.ok) throw new Error(getApiErrorMessage(barangPayload, 'Gagal memuat data barang'));

      const transaksis = Array.isArray(transaksiPayload)
        ? (transaksiPayload as unknown[])
            .map(normalizeTransaksi)
            .filter((v): v is TransaksiRow => !!v)
        : [];

      const barangs = Array.isArray(barangPayload) ? (barangPayload as unknown[]) : [];
      const barangMap = new Map<string, BarangRow>();
      for (const raw of barangs) {
        if (!raw || typeof raw !== 'object') continue;
        const obj = raw as Record<string, unknown>;
        const kode = typeof obj.kode === 'string' ? obj.kode : '';
        if (!kode) continue;
        const kategori = typeof obj.kategori === 'string' ? obj.kategori : null;
        const jenis = Array.isArray(obj.jenis) ? obj.jenis.filter((x): x is string => typeof x === 'string') : [];
        barangMap.set(kode, { kode, kategori, jenis });
      }

      const result: SpkRow[] = [];

      for (const t of transaksis) {
        if (t.status === 'cancelled' || t.productionStatus === 'selesai') continue;
        const { trxPart, month, year } = parseInvoiceParts(t.invoice);

        const grouped = new Map<string, { productId: string; productName: string; warna: string; qty: number; sizes: Record<string, number> }>();
        for (const it of t.items) {
          const warna = (it.warna || '').trim();
          const key = `${it.productId}::${warna}`;
          const sizeKey = (it.ukuran || '').trim().toUpperCase();
          const existing = grouped.get(key);
          if (existing) {
            existing.qty += it.qty || 0;
            if (sizeKey) existing.sizes[sizeKey] = (existing.sizes[sizeKey] || 0) + (it.qty || 0);
          } else {
            const sizes: Record<string, number> = {};
            if (sizeKey) sizes[sizeKey] = (it.qty || 0);
            grouped.set(key, { productId: it.productId, productName: it.productName, warna, qty: it.qty || 0, sizes });
          }
        }

        const groups = Array.from(grouped.values()).sort((a, b) => {
          const an = a.productName.toLowerCase();
          const bn = b.productName.toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return a.warna.toLowerCase().localeCompare(b.warna.toLowerCase());
        });

        for (let i = 0; i < groups.length; i++) {
          const g = groups[i]!;
          const spkIndex = i + 1;
          const spkNumber = `${pad2(spkIndex)}/SPK-${spkIndex}/${trxPart}/${month}/${year}`;
          const barang = barangMap.get(g.productId);
          const warnaProduk = g.warna ? g.warna : null;
          const spkKey = `${g.productId}::${g.warna}`;
          const detail = t.spkDetail[spkKey] || null;
          const deadlineDate = detail?.deadlineDate ?? null;
          const stepStatus = ((detail?.stepStatus ?? null) as SpkStepStatus | null) ?? 'DESIGN';
          const sizes = Object.entries(g.sizes || {})
            .map(([size, qty]) => ({ size, qty }))
            .filter((x) => x.size.trim() !== '' && Number.isFinite(x.qty) && x.qty > 0);
          result.push({
            id: `${t.id}:${g.productId}:${g.warna}`,
            transaksiId: t.id,
            spkNumber,
            invoice: t.invoice,
            orderDate: t.date,
            deadlineDate,
            stepStatus,
            kategoriProduk: barang?.kategori ?? null,
            productId: g.productId,
            productName: g.productName,
            warnaProduk,
            jenisProduk: barang?.jenis ?? [],
            qty: g.qty,
            sizes,
            customerName: t.customerName,
            status: t.status,
            productionStatus: t.productionStatus,
          });
        }
      }

      return result;
    },
  });

  const filtered = useMemo(() => {
    const all = listQuery.data ?? [];
    const q = search.toLowerCase().trim();
    return all.filter((t) => {
      const dateKey = t.orderDate ? t.orderDate.slice(0, 10) : '';
      const hasValidDateKey = /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
      if ((dateFrom || dateTo) && !hasValidDateKey) return false;
      if (dateFrom && hasValidDateKey && dateKey < dateFrom) return false;
      if (dateTo && hasValidDateKey && dateKey > dateTo) return false;

      if (!q) return true;
      return (
        t.invoice.toLowerCase().includes(q) ||
        t.spkNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.productName || '').toLowerCase().includes(q)
      );
    });
  }, [listQuery.data, search, dateFrom, dateTo]);

  const groupedByInvoice = useMemo(() => {
    const groups = new Map<string, SpkRow[]>();
    for (const row of filtered) {
      const list = groups.get(row.invoice) || [];
      list.push(row);
      groups.set(row.invoice, list);
    }

    const parseDateMs = (value: string | null) => {
      if (!value) return 0;
      const ms = Date.parse(value);
      return Number.isFinite(ms) ? ms : 0;
    };

    return Array.from(groups.entries())
      .map(([invoice, rows]) => {
        const sortedRows = [...rows].sort((a, b) => a.spkNumber.localeCompare(b.spkNumber));
        const latestOrderDateMs = sortedRows.reduce((acc, r) => Math.max(acc, parseDateMs(r.orderDate)), 0);
        return { invoice, rows: sortedRows, latestOrderDateMs };
      })
      .sort((a, b) => {
        if (b.latestOrderDateMs !== a.latestOrderDateMs) return b.latestOrderDateMs - a.latestOrderDateMs;
        return a.invoice.localeCompare(b.invoice);
      });
  }, [filtered]);

  const toggleInvoice = (invoice: string) => {
    setOpenInvoices((prev) => ({ ...prev, [invoice]: !prev[invoice] }));
  };

  const updateSpkItemMutation = useMutation({
    mutationFn: async (args: {
      transaksiId: string;
      productId: string;
      warna: string | null;
      stepStatus?: SpkStepStatus | null;
      deadlineDate?: string | null;
    }) => {
      const body: Record<string, unknown> = {
        spkItem: {
          productId: args.productId,
          warna: args.warna || '',
          ...(args.stepStatus !== undefined ? { stepStatus: args.stepStatus } : {}),
          ...(args.deadlineDate !== undefined ? { deadlineDate: args.deadlineDate } : {}),
        },
      };
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(args.transaksiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menyimpan perubahan SPK'));
      return payload;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaksi'] }),
        queryClient.invalidateQueries({ queryKey: ['transaksi', 'spk'] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan perubahan SPK');
    },
  });

  const markTransaksiProductionDone = useMutation({
    mutationFn: async ({ transaksiId }: { transaksiId: string }) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/transaksi/${encodeURIComponent(transaksiId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus: 'selesai', productionDate: formatDateJakartaIso() }),
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Gagal menandai produksi selesai'));
      return payload;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transaksi'] }),
        queryClient.invalidateQueries({ queryKey: ['transaksi', 'spk'] }),
      ]);
    },
  });

  const openEdit = (row: SpkRow) => {
    setSelectedEdit(row);
    setEditDeadlineDate(row.deadlineDate || '');
  };

  const closeDesign = () => {
    revokeObjectUrlMaybe(designImagePreview);
    revokeObjectUrlMaybe(sponsorImagePreview);
    setDesignImageFile(null);
    setSponsorImageFile(null);
    setDesignImagePreview('');
    setSponsorImagePreview('');
    setSelectedDesign(null);
  };

  const openDesign = (row: SpkRow) => {
    const obj = safeParseJsonObject(localStorage.getItem(getSpkMaterialsStorageKey(row)));
    setDesignMaterials({
      kerah: typeof obj?.kerah === 'string' ? (obj.kerah as string) : '',
      body: typeof obj?.body === 'string' ? (obj.body as string) : '',
      aplikasi: typeof obj?.aplikasi === 'string' ? (obj.aplikasi as string) : '',
      lengan: typeof obj?.lengan === 'string' ? (obj.lengan as string) : '',
      celana: typeof obj?.celana === 'string' ? (obj.celana as string) : '',
    });
    setDesignImagePath(normalizeUploadValueForStorage(localStorage.getItem(getSpkDesignImageStorageKey(row)) || ''));
    setSponsorImagePath(normalizeUploadValueForStorage(localStorage.getItem(getSpkSponsorImageStorageKey(row)) || ''));
    setDesignImageFile(null);
    setSponsorImageFile(null);
    revokeObjectUrlMaybe(designImagePreview);
    revokeObjectUrlMaybe(sponsorImagePreview);
    setDesignImagePreview('');
    setSponsorImagePreview('');
    setSelectedDesign(row);
  };

  const submitEdit = async () => {
    if (!selectedEdit) return;
    const v = editDeadlineDate.trim();
    const t = toast.loading('Menyimpan deadline SPK...');
    try {
      await updateSpkItemMutation.mutateAsync({
        transaksiId: selectedEdit.transaksiId,
        productId: selectedEdit.productId,
        warna: selectedEdit.warnaProduk,
        deadlineDate: v || null,
      });
      toast.dismiss(t);
      toast.success('Deadline SPK tersimpan');
      setSelectedEdit(null);
      setSelectedDetail((prev) => {
        if (!prev || prev.id !== selectedEdit.id) return prev;
        return { ...prev, deadlineDate: v || null };
      });
    } catch (e) {
      toast.dismiss(t);
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan deadline SPK');
    }
  };

  const submitDesign = async () => {
    if (!selectedDesign) return;
    setDesignSaving(true);
    try {
      const upload = async (type: 'design' | 'sponsor', file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('invoice', selectedDesign.invoice);
        fd.append('productId', selectedDesign.productId);
        fd.append('warna', selectedDesign.warnaProduk || '');
        fd.append('type', type);
        fd.append('file', file);
        const res = await fetch(`${apiBaseUrl}/api/v1/uploads/spk`, { method: 'POST', body: fd });
        const rawText = await res.text();
        const payload = (() => {
          try {
            return JSON.parse(rawText) as unknown;
          } catch {
            return null;
          }
        })();
        if (!res.ok) throw new Error(getApiErrorMessage(payload, 'Gagal upload gambar'));

        const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
        const urlFromApi =
          (obj && typeof obj.url === 'string' ? (obj.url as string) : '') ||
          (obj && obj.data && typeof obj.data === 'object' && typeof (obj.data as Record<string, unknown>).url === 'string'
            ? ((obj.data as Record<string, unknown>).url as string)
            : '');
        const pathFromApi =
          (obj && typeof obj.path === 'string' ? (obj.path as string) : '') ||
          (obj && obj.data && typeof obj.data === 'object' && typeof (obj.data as Record<string, unknown>).path === 'string'
            ? ((obj.data as Record<string, unknown>).path as string)
            : '');
        const fallbackPath = (() => {
          const t = rawText.trim();
          if (t.startsWith('/uploads/')) return t;
          const m = /"path"\s*:\s*"([^"]+)"/.exec(t);
          return m && m[1] ? m[1] : '';
        })();
        const finalPath = (pathFromApi || urlFromApi || fallbackPath).trim();
        if (!finalPath) {
          throw new Error(`Respons upload tidak valid: ${rawText.slice(0, 300)}`);
        }
        return normalizeUploadValueForStorage(finalPath);
      };

      let nextDesignPath = normalizeUploadValueForStorage(designImagePath.trim());
      let nextSponsorPath = normalizeUploadValueForStorage(sponsorImagePath.trim());
      if (designImageFile) nextDesignPath = await upload('design', designImageFile);
      if (sponsorImageFile) nextSponsorPath = await upload('sponsor', sponsorImageFile);

      localStorage.setItem(getSpkMaterialsStorageKey(selectedDesign), JSON.stringify(designMaterials));
      if (nextDesignPath) localStorage.setItem(getSpkDesignImageStorageKey(selectedDesign), nextDesignPath);
      else localStorage.removeItem(getSpkDesignImageStorageKey(selectedDesign));
      if (nextSponsorPath) localStorage.setItem(getSpkSponsorImageStorageKey(selectedDesign), nextSponsorPath);
      else localStorage.removeItem(getSpkSponsorImageStorageKey(selectedDesign));

      setDesignImagePath(nextDesignPath);
      setSponsorImagePath(nextSponsorPath);
      toast.success('Data design tersimpan');
      closeDesign();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan data design');
    } finally {
      setDesignSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">List SPK</h1>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-sm w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari SPK / invoice / pelanggan / produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full sm:w-[170px]"
                aria-label="Tanggal dari"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full sm:w-[170px]"
                aria-label="Tanggal sampai"
              />
            </div>
          </div>
        </div>

        {listQuery.isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Memuat data...</div>
        ) : listQuery.isError ? (
          <div className="p-6 text-center text-destructive">
            {listQuery.error instanceof Error ? listQuery.error.message : 'Gagal memuat data'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Tidak ada data</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No - Invoice</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedByInvoice.map((g, idx) => {
                const isOpen = !!openInvoices[g.invoice];
                const doneCount = g.rows.reduce((acc, row) => {
                  const statusValue = stepOverrides[row.id] ?? row.stepStatus ?? null;
                  return statusValue === 'SELESAI' ? acc + 1 : acc;
                }, 0);
                return (
                  <Fragment key={g.invoice}>
                    <TableRow className="cursor-pointer" onClick={() => toggleInvoice(g.invoice)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <span>{`${idx + 1} - ${g.invoice}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{`${doneCount}/${g.rows.length} Selesai`}</TableCell>
                    </TableRow>

                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={2} className="bg-muted/30 p-2">
                          <div className="rounded-md border bg-background">
                            <Table className="w-full">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[210px]">No - No SPK</TableHead>
                                  <TableHead className="w-[150px]">Tanggal Order</TableHead>
                                  <TableHead className="w-[150px]">Tanggal Deadline</TableHead>
                                  <TableHead>Nama Produk</TableHead>
                                  <TableHead className="w-[120px]">Jumlah</TableHead>
                                  <TableHead className="w-[170px]">Status</TableHead>
                                  <TableHead className="text-right w-[160px]">Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {g.rows.map((row, rowIdx) => {
                                  const statusValue = stepOverrides[row.id] ?? row.stepStatus ?? null;
                                  return (
                                  <TableRow key={row.id}>
                                    <TableCell className="font-medium">{`${rowIdx + 1} - ${row.spkNumber}`}</TableCell>
                                    <TableCell>{row.orderDate || '-'}</TableCell>
                                    <TableCell>{row.deadlineDate || '-'}</TableCell>
                                    <TableCell>{row.productName}</TableCell>
                                    <TableCell>{`${row.qty} pcs`}</TableCell>
                                    <TableCell>
                                      <Select
                                        value={statusValue || ''}
                                        onValueChange={(v) => {
                                          const next = v ? (v as SpkStepStatus) : null;
                                          setStepOverrides((prev) => ({ ...prev, [row.id]: next }));
                                          updateSpkItemMutation.mutate({
                                            transaksiId: row.transaksiId,
                                            productId: row.productId,
                                            warna: row.warnaProduk,
                                            stepStatus: next,
                                          });

                                          if (next === 'SELESAI') {
                                            const isAllDone = g.rows.every((r) => {
                                              const s = r.id === row.id ? next : (stepOverrides[r.id] ?? r.stepStatus ?? null);
                                              return s === 'SELESAI';
                                            });
                                            if (isAllDone) {
                                              markTransaksiProductionDone.mutate(
                                                { transaksiId: row.transaksiId },
                                                { onSuccess: () => toast.success('Produksi transaksi ditandai selesai') },
                                              );
                                            }
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {SPK_STEP_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDetail(row);
                                          }}
                                          aria-label="Detail"
                                        >
                                          <Eye size={16} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEdit(row);
                                          }}
                                          aria-label="Edit"
                                        >
                                          <Pencil size={16} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDesign(row);
                                          }}
                                          aria-label="Design"
                                        >
                                          <ImagePlus size={16} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            previewSpk(row);
                                          }}
                                          aria-label="Print"
                                        >
                                          <Printer size={16} />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="bg-card max-w-2xl">
          <DialogHeader><DialogTitle>Detail SPK</DialogTitle></DialogHeader>
          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">No SPK</p>
                  <p className="font-medium text-foreground">{selectedDetail.spkNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No Invoice</p>
                  <p className="font-medium text-foreground">{selectedDetail.invoice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium text-foreground">{selectedDetail.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Order</p>
                  <p className="font-medium text-foreground">{selectedDetail.orderDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Deadline</p>
                  <p className="font-medium text-foreground">{selectedDetail.deadlineDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori Produk</p>
                  <p className="font-medium text-foreground">{selectedDetail.kategoriProduk || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama Produk</p>
                  <p className="font-medium text-foreground">{selectedDetail.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warna Produk</p>
                  <p className="font-medium text-foreground">{selectedDetail.warnaProduk || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Produk + Jumlah</p>
                  <p className="font-medium text-foreground">{`${selectedDetail.jenisProduk.join(', ') || '-'} - ${selectedDetail.qty} pcs`}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedDetail(null)}>Tutup</Button>
                <Button onClick={() => previewSpk(selectedDetail)} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                  <Printer size={16} className="mr-2" /> Preview SPK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pdfPreviewOpen} onOpenChange={(open) => !open && closePdfPreview()}>
        <DialogContent className="bg-card max-w-6xl">
          <DialogHeader><DialogTitle>Preview PDF SPK</DialogTitle></DialogHeader>
          <div className="rounded-md border bg-background overflow-hidden">
            {pdfPreviewUrl ? (
              <iframe title="Preview PDF SPK" src={pdfPreviewUrl} className="w-full h-[80vh]" />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">Preview belum tersedia</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closePdfPreview}>Tutup</Button>
            <Button
              className="velcrone-gradient text-primary-foreground hover:opacity-90"
              onClick={() => {
                if (!pdfPreviewBlob) {
                  toast.error('PDF belum siap');
                  return;
                }
                printPdf(pdfPreviewBlob);
              }}
              disabled={!pdfPreviewBlob}
            >
              <Printer size={16} className="mr-2" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEdit} onOpenChange={(open) => !open && setSelectedEdit(null)}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle>Edit SPK</DialogTitle></DialogHeader>
          {selectedEdit && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">No SPK</p>
                <p className="font-medium text-foreground">{selectedEdit.spkNumber}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">No Invoice</p>
                <p className="font-medium text-foreground">{selectedEdit.invoice}</p>
              </div>

              <div>
                <Label>Tanggal Deadline</Label>
                <Input
                  className="mt-1"
                  value={editDeadlineDate}
                  onChange={(e) => setEditDeadlineDate(e.target.value)}
                  type="date"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setSelectedEdit(null)}>Batal</Button>
                <Button onClick={submitEdit} className="velcrone-gradient text-primary-foreground hover:opacity-90">
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDesign} onOpenChange={(open) => !open && closeDesign()}>
        <DialogContent className="bg-card max-w-3xl">
          <DialogHeader><DialogTitle>Design SPK</DialogTitle></DialogHeader>
          {selectedDesign && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">No SPK</p>
                  <p className="font-medium text-foreground">{selectedDesign.spkNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No Invoice</p>
                  <p className="font-medium text-foreground">{selectedDesign.invoice}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kerah</Label>
                  <Input value={designMaterials.kerah} onChange={(e) => setDesignMaterials((p) => ({ ...p, kerah: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Input value={designMaterials.body} onChange={(e) => setDesignMaterials((p) => ({ ...p, body: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Aplikasi</Label>
                  <Input value={designMaterials.aplikasi} onChange={(e) => setDesignMaterials((p) => ({ ...p, aplikasi: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Lengan</Label>
                  <Input value={designMaterials.lengan} onChange={(e) => setDesignMaterials((p) => ({ ...p, lengan: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Celana</Label>
                  <Input value={designMaterials.celana} onChange={(e) => setDesignMaterials((p) => ({ ...p, celana: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gambar Design</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setDesignImageFile(f);
                      if (!f) {
                        revokeObjectUrlMaybe(designImagePreview);
                        setDesignImagePreview('');
                        return;
                      }
                      revokeObjectUrlMaybe(designImagePreview);
                      setDesignImagePreview(URL.createObjectURL(f));
                    }}
                  />
                  {(designImagePreview || designImagePath) && (
                    <div className="rounded-md border p-2 bg-background">
                      <img
                        src={designImagePreview || resolveStoredUploadUrl(designImagePath)}
                        alt="Design preview"
                        className="w-full max-h-64 object-contain"
                      />
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDesignImageFile(null);
                            revokeObjectUrlMaybe(designImagePreview);
                            setDesignImagePreview('');
                            setDesignImagePath('');
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gambar Sponsor</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setSponsorImageFile(f);
                      if (!f) {
                        revokeObjectUrlMaybe(sponsorImagePreview);
                        setSponsorImagePreview('');
                        return;
                      }
                      revokeObjectUrlMaybe(sponsorImagePreview);
                      setSponsorImagePreview(URL.createObjectURL(f));
                    }}
                  />
                  {(sponsorImagePreview || sponsorImagePath) && (
                    <div className="rounded-md border p-2 bg-background">
                      <img
                        src={sponsorImagePreview || resolveStoredUploadUrl(sponsorImagePath)}
                        alt="Sponsor preview"
                        className="w-full max-h-64 object-contain"
                      />
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSponsorImageFile(null);
                            revokeObjectUrlMaybe(sponsorImagePreview);
                            setSponsorImagePreview('');
                            setSponsorImagePath('');
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={closeDesign} disabled={designSaving}>Batal</Button>
                <Button onClick={submitDesign} className="velcrone-gradient text-primary-foreground hover:opacity-90" disabled={designSaving}>
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
