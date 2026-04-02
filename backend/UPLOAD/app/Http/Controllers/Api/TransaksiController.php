<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Pelanggan;
use App\Models\Transaksi;
use App\Models\TransaksiItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TransaksiController extends Controller
{
    private const UKURAN_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    private const PAYMENT_METHODS = ['transfer', 'cash', 'cicil', 'qris'];
    private const PRODUCTION_STATUSES = [
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
    private const SPK_STEP_STATUSES = ['DESIGN', 'SETTING', 'PRINTING', 'HEAT PRESS', 'SEWING', 'QC', 'PACKING', 'DELIVERY', 'SELESAI'];

    private function normalizePaymentDetails(Transaksi $t): array
    {
        $raw = $t->pembayaran_detail;
        if (! is_array($raw)) return [];

        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) continue;
            $step = array_key_exists('step', $row) ? (int) $row['step'] : 0;
            $amount = array_key_exists('amount', $row) ? (float) $row['amount'] : 0.0;
            $date = array_key_exists('date', $row) && is_string($row['date']) ? $row['date'] : null;

            if ($step < 1 || $step > 5) continue;
            if (! is_finite($amount) || $amount <= 0) continue;
            if ($date !== null && trim($date) === '') $date = null;

            $out[] = [
                'step' => $step,
                'amount' => $amount,
                'date' => $date,
            ];
        }

        usort($out, fn ($a, $b) => $a['step'] <=> $b['step']);
        return $out;
    }

    private function normalizeProductionDetails(Transaksi $t): array
    {
        $raw = $t->produksi_detail;
        if (! is_array($raw)) return [];

        $latest = [];
        foreach ($raw as $row) {
            if (! is_array($row)) continue;
            $status = array_key_exists('status', $row) && is_string($row['status']) ? (string) $row['status'] : '';
            $date = array_key_exists('date', $row) && is_string($row['date']) ? (string) $row['date'] : null;

            if ($status === '' || ! in_array($status, self::PRODUCTION_STATUSES, true)) continue;
            if ($date !== null && trim($date) === '') $date = null;

            if ($date !== null) {
                try {
                    $date = Carbon::parse($date)->toDateString();
                } catch (\Throwable) {
                    $date = null;
                }
            }

            $latest[$status] = [
                'status' => $status,
                'date' => $date,
            ];
        }

        $ordered = [];
        foreach (self::PRODUCTION_STATUSES as $status) {
            if (array_key_exists($status, $latest)) {
                $ordered[] = $latest[$status];
            }
        }
        return $ordered;
    }

    private function sumPaid(array $details): float
    {
        $sum = 0.0;
        foreach ($details as $row) {
            $sum += (float) ($row['amount'] ?? 0);
        }
        return $sum;
    }

    private function computeTransaksiStatus(string $dbStatus, string $productionStatus, string $paymentStatus): string
    {
        if ($dbStatus === 'cancelled') return 'cancelled';
        if ($productionStatus === 'selesai' && $paymentStatus === 'lunas') return 'completed';
        return 'pending';
    }

    public function index(): JsonResponse
    {
        $data = Transaksi::query()
            ->with('items')
            ->orderByDesc('tanggal')
            ->get()
            ->map(function (Transaksi $t) {
                $payments = $this->normalizePaymentDetails($t);
                $productionDetails = $this->normalizeProductionDetails($t);
                $due = (float) $t->total;
                $paid = $this->sumPaid($payments);
                if ($paid <= 0 && ((string) $t->status_pembayaran) === 'lunas') $paid = $due;
                $remaining = max(0.0, $due - $paid);
                $paymentStatus = $remaining <= 0 ? 'lunas' : 'belum_lunas';
                $productionStatus = $t->status_produksi ? (string) $t->status_produksi : 'order_masuk';
                $status = $this->computeTransaksiStatus((string) $t->status, $productionStatus, $paymentStatus);

                return [
                    'id' => (string) $t->id,
                    'invoice' => (string) $t->invoice,
                    'spkNumber' => $t->nomor_spk ? (string) $t->nomor_spk : null,
                    'date' => $t->tanggal ? $t->tanggal->setTimezone('Asia/Jakarta')->format('Y-m-d H:i') : null,
                    'customerId' => $t->pelanggan_id ? (string) $t->pelanggan_id : '',
                    'customerName' => $t->pelanggan_nama ? (string) $t->pelanggan_nama : 'Umum',
                    'spkDetail' => is_array($t->spk_detail) ? $t->spk_detail : null,
                    'items' => $t->items->map(function (TransaksiItem $item) {
                        return [
                            'productId' => (string) $item->barang_kode,
                            'productName' => (string) $item->barang_nama,
                            'ukuran' => $item->ukuran ? (string) $item->ukuran : '',
                            'warna' => $item->warna ? (string) $item->warna : '',
                            'qty' => (int) $item->qty,
                            'price' => (float) $item->harga,
                            'subtotal' => (float) $item->subtotal,
                        ];
                    })->values(),
                    'total' => (float) $t->total,
                    'status' => $status,
                    'cancelReason' => $t->alasan_batal ? (string) $t->alasan_batal : null,
                    'productionStatus' => $productionStatus,
                    'productionDetails' => $productionDetails,
                    'paymentStatus' => $paymentStatus,
                    'paymentStep' => (int) ($t->pembayaran_ke ?? 0),
                    'payments' => $payments,
                    'paymentDue' => $due,
                    'paymentPaid' => $paid,
                    'paymentRemaining' => $remaining,
                    'paymentMethod' => $t->metode_pembayaran ? (string) $t->metode_pembayaran : '',
                ];
            });

        return response()->json($data);
    }

    public function show(string $id): JsonResponse
    {
        $t = Transaksi::query()->with('items')->findOrFail($id);
        $payments = $this->normalizePaymentDetails($t);
        $productionDetails = $this->normalizeProductionDetails($t);
        $due = (float) $t->total;
        $paid = $this->sumPaid($payments);
        if ($paid <= 0 && ((string) $t->status_pembayaran) === 'lunas') $paid = $due;
        $remaining = max(0.0, $due - $paid);
        $paymentStatus = $remaining <= 0 ? 'lunas' : 'belum_lunas';
        $productionStatus = $t->status_produksi ? (string) $t->status_produksi : 'order_masuk';
        $status = $this->computeTransaksiStatus((string) $t->status, $productionStatus, $paymentStatus);

        return response()->json([
            'id' => (string) $t->id,
            'invoice' => (string) $t->invoice,
            'spkNumber' => $t->nomor_spk ? (string) $t->nomor_spk : null,
            'date' => $t->tanggal ? $t->tanggal->setTimezone('Asia/Jakarta')->format('Y-m-d H:i') : null,
            'customerId' => $t->pelanggan_id ? (string) $t->pelanggan_id : '',
            'customerName' => $t->pelanggan_nama ? (string) $t->pelanggan_nama : 'Umum',
            'spkDetail' => is_array($t->spk_detail) ? $t->spk_detail : null,
            'items' => $t->items->map(function (TransaksiItem $item) {
                return [
                    'productId' => (string) $item->barang_kode,
                    'productName' => (string) $item->barang_nama,
                    'ukuran' => $item->ukuran ? (string) $item->ukuran : '',
                    'warna' => $item->warna ? (string) $item->warna : '',
                    'qty' => (int) $item->qty,
                    'price' => (float) $item->harga,
                    'subtotal' => (float) $item->subtotal,
                ];
            })->values(),
            'total' => (float) $t->total,
            'status' => $status,
            'cancelReason' => $t->alasan_batal ? (string) $t->alasan_batal : null,
            'productionStatus' => $productionStatus,
            'productionDetails' => $productionDetails,
            'paymentStatus' => $paymentStatus,
            'paymentStep' => (int) ($t->pembayaran_ke ?? 0),
            'payments' => $payments,
            'paymentDue' => $due,
            'paymentPaid' => $paid,
            'paymentRemaining' => $remaining,
            'paymentMethod' => $t->metode_pembayaran ? (string) $t->metode_pembayaran : '',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice' => ['nullable', 'string', Rule::unique('transaksis', 'invoice')],
            'date' => ['nullable', 'date'],
            'customerId' => ['nullable', 'string', Rule::exists('pelanggans', 'id')],
            'customerName' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['required', 'string'],
            'items.*.ukuran' => ['required', 'string', Rule::in(self::UKURAN_OPTIONS)],
            'items.*.warna' => ['nullable', 'string', 'max:50'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => ['required', 'string', Rule::in(self::PAYMENT_METHODS)],
        ]);

        $tanggal = array_key_exists('date', $validated)
            ? Carbon::parse($validated['date'])
            : now();

        return DB::transaction(function () use ($validated, $tanggal) {
            $pelangganNama = 'Umum';
            $pelangganId = null;

            if (! empty($validated['customerId'])) {
                $pelanggan = Pelanggan::findOrFail((string) $validated['customerId']);
                $pelangganId = (string) $pelanggan->id;
                $pelangganNama = (string) $pelanggan->nama;
            } elseif (! empty($validated['customerName'])) {
                $pelangganNama = (string) $validated['customerName'];
            }

            $invoice = ! empty($validated['invoice'])
                ? (string) $validated['invoice']
                : $this->generateInvoice($tanggal);

            $spkDetail = [];
            foreach ($validated['items'] as $row) {
                $productId = trim((string) $row['productId']);
                $warna = array_key_exists('warna', $row) ? trim((string) $row['warna']) : '';
                if ($warna === '' || strtolower($warna) === 'pilih') $warna = '';
                if ($productId === '') continue;
                $key = "{$productId}::{$warna}";
                if (! array_key_exists($key, $spkDetail)) {
                    $spkDetail[$key] = ['stepStatus' => 'DESIGN', 'deadlineDate' => null];
                }
            }

            $transaksi = Transaksi::create([
                'id' => (string) Str::uuid(),
                'invoice' => $invoice,
                'tanggal' => $tanggal,
                'pelanggan_id' => $pelangganId,
                'pelanggan_nama' => $pelangganNama,
                'total' => 0,
                'status' => 'pending',
                'alasan_batal' => null,
                'status_produksi' => 'persetujuan_desain',
                'produksi_detail' => [
                    ['status' => 'persetujuan_desain', 'date' => $tanggal->toDateString()],
                ],
                'spk_detail' => $spkDetail,
                'status_pembayaran' => 'belum_lunas',
                'pembayaran_ke' => 0,
                'pembayaran_detail' => null,
                'metode_pembayaran' => (string) $validated['paymentMethod'],
            ]);

            $total = 0.0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $row) {
                $kode = (string) $row['productId'];
                $ukuran = strtoupper(trim((string) $row['ukuran']));
                $warna = array_key_exists('warna', $row) ? trim((string) $row['warna']) : '';
                if ($warna === '' || strtolower($warna) === 'pilih') $warna = '';
                $qty = (int) $row['qty'];
                $barang = Barang::find($kode);
                if (! $barang) {
                    return response()->json(['message' => "Barang tidak ditemukan: {$kode}"], 422);
                }
                if (! $this->ukuranIsAvailable($barang->ukuran, $ukuran)) {
                    return response()->json(['message' => "Ukuran tidak tersedia untuk {$kode}: {$ukuran}"], 422);
                }
                if ($warna !== '' && ! $this->warnaIsAvailable($barang->warna, $warna)) {
                    return response()->json(['message' => "Warna tidak tersedia untuk {$kode}: {$warna}"], 422);
                }

                $hargaDefault = (float) $barang->harga_jual * (1 - ((float) $barang->diskon / 100));
                $harga = array_key_exists('price', $row) && $row['price'] !== null ? (float) $row['price'] : $hargaDefault;
                $subtotal = $harga * $qty;

                $itemsToCreate[] = [
                    'transaksi_id' => $transaksi->id,
                    'barang_kode' => $barang->kode,
                    'barang_nama' => $barang->nama,
                    'ukuran' => $ukuran,
                    'warna' => $warna !== '' ? $warna : null,
                    'qty' => $qty,
                    'harga' => $harga,
                    'subtotal' => $subtotal,
                ];

                $total += $subtotal;
            }

            $transaksi->update(['total' => $total]);
            TransaksiItem::query()->insert($itemsToCreate);

            return response()->json([
                'message' => 'Transaksi created',
                'id' => (string) $transaksi->id,
                'invoice' => (string) $transaksi->invoice,
            ], 201);
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $transaksi = Transaksi::query()->with('items')->findOrFail($id);
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['cancelled'])],
            'cancelReason' => ['required_with:status', 'string', 'max:255'],
            'paymentMethod' => ['sometimes', 'string'],
            'spkNumber' => ['sometimes', 'nullable', 'string', 'max:50'],
            'productionStatus' => ['sometimes', Rule::in(self::PRODUCTION_STATUSES)],
            'productionDate' => ['required_with:productionStatus', 'date'],
            'spkItem' => ['sometimes', 'array'],
            'spkItem.productId' => ['required_with:spkItem', 'string'],
            'spkItem.warna' => ['nullable', 'string', 'max:50'],
            'spkItem.stepStatus' => ['sometimes', 'nullable', Rule::in(self::SPK_STEP_STATUSES)],
            'spkItem.deadlineDate' => ['sometimes', 'nullable', 'date'],
            'paymentStatus' => ['sometimes', Rule::in(['belum_lunas', 'lunas'])],
            'paymentStep' => ['sometimes', 'integer', 'min:0', 'max:5'],
            'payment' => ['sometimes', 'array'],
            'payment.step' => ['required_with:payment', 'integer', 'min:1', 'max:5'],
            'payment.amount' => ['required_with:payment', 'numeric', 'min:0'],
            'payment.date' => ['required_with:payment', 'date'],
        ]);

        return DB::transaction(function () use ($transaksi, $validated) {
            $fromStatus = (string) $transaksi->status;
            $isCancel = array_key_exists('status', $validated) && ((string) $validated['status']) === 'cancelled';
            $toStatus = $isCancel ? 'cancelled' : $fromStatus;

            $productionStatus = array_key_exists('productionStatus', $validated)
                ? (string) $validated['productionStatus']
                : ((string) ($transaksi->status_produksi ?? 'order_masuk'));

            $productionDetails = $this->normalizeProductionDetails($transaksi);
            if (array_key_exists('productionStatus', $validated)) {
                $productionDate = Carbon::parse((string) $validated['productionDate'])->toDateString();
                $byStatus = [];
                foreach ($productionDetails as $row) {
                    if (! is_array($row)) continue;
                    $s = array_key_exists('status', $row) && is_string($row['status']) ? (string) $row['status'] : '';
                    $d = array_key_exists('date', $row) && is_string($row['date']) ? (string) $row['date'] : null;
                    if ($s === '' || ! in_array($s, self::PRODUCTION_STATUSES, true)) continue;
                    $byStatus[$s] = ['status' => $s, 'date' => $d];
                }
                $byStatus[$productionStatus] = ['status' => $productionStatus, 'date' => $productionDate];
                $productionDetails = [];
                foreach (self::PRODUCTION_STATUSES as $s) {
                    if (array_key_exists($s, $byStatus)) $productionDetails[] = $byStatus[$s];
                }
            }

            $payments = $this->normalizePaymentDetails($transaksi);
            if (array_key_exists('payment', $validated)) {
                $p = is_array($validated['payment']) ? $validated['payment'] : [];
                $step = array_key_exists('step', $p) ? (int) $p['step'] : 0;
                $amount = array_key_exists('amount', $p) ? (float) $p['amount'] : 0.0;
                $date = Carbon::parse((string) $p['date'])->toDateString();

                $payments = array_values(array_filter($payments, fn ($row) => (int) ($row['step'] ?? 0) !== $step));
                if ($amount > 0) {
                    $payments[] = [
                        'step' => $step,
                        'amount' => $amount,
                        'date' => $date,
                    ];
                }
                usort($payments, fn ($a, $b) => $a['step'] <=> $b['step']);
            }

            $paid = $this->sumPaid($payments);
            $due = (float) $transaksi->total;
            $remaining = $due - $paid;
            $maxStep = 0;
            foreach ($payments as $row) {
                $maxStep = max($maxStep, (int) ($row['step'] ?? 0));
            }
            $computedPaymentStatus = $remaining <= 0 ? 'lunas' : 'belum_lunas';
            $paymentStatus = $computedPaymentStatus;

            if (! $isCancel) {
                $toStatus = $this->computeTransaksiStatus((string) $transaksi->status, $productionStatus, $paymentStatus);
            }

            $spkDetail = is_array($transaksi->spk_detail) ? $transaksi->spk_detail : [];
            if (array_key_exists('spkItem', $validated)) {
                $item = is_array($validated['spkItem']) ? $validated['spkItem'] : [];
                $productId = trim((string) ($item['productId'] ?? ''));
                $warna = array_key_exists('warna', $item) ? trim((string) $item['warna']) : '';
                if ($productId !== '') {
                    $key = "{$productId}::{$warna}";
                    $existing = array_key_exists($key, $spkDetail) && is_array($spkDetail[$key]) ? $spkDetail[$key] : [];
                    $entry = is_array($existing) ? $existing : [];

                    if (array_key_exists('stepStatus', $item)) {
                        $stepStatus = $item['stepStatus'];
                        $entry['stepStatus'] = ($stepStatus !== null && trim((string) $stepStatus) !== '') ? (string) $stepStatus : null;
                    }

                    if (array_key_exists('deadlineDate', $item)) {
                        $deadline = $item['deadlineDate'];
                        $entry['deadlineDate'] = $deadline !== null ? Carbon::parse((string) $deadline)->toDateString() : null;
                    }

                    $nextStep = array_key_exists('stepStatus', $entry) ? $entry['stepStatus'] : null;
                    $nextDeadline = array_key_exists('deadlineDate', $entry) ? $entry['deadlineDate'] : null;

                    if ($nextStep === null && $nextDeadline === null) {
                        unset($spkDetail[$key]);
                    } else {
                        $spkDetail[$key] = ['stepStatus' => $nextStep, 'deadlineDate' => $nextDeadline];
                    }
                }
            }

            $transaksi->update([
                'status' => $toStatus,
                'alasan_batal' => $isCancel ? (string) ($validated['cancelReason'] ?? '') : $transaksi->alasan_batal,
                'metode_pembayaran' => array_key_exists('paymentMethod', $validated)
                    ? (string) $validated['paymentMethod']
                    : $transaksi->metode_pembayaran,
                'nomor_spk' => array_key_exists('spkNumber', $validated)
                    ? (($validated['spkNumber'] !== null && trim((string) $validated['spkNumber']) !== '') ? trim((string) $validated['spkNumber']) : null)
                    : $transaksi->nomor_spk,
                'status_produksi' => $productionStatus,
                'produksi_detail' => $productionDetails,
                'spk_detail' => $spkDetail,
                'pembayaran_ke' => array_key_exists('payment', $validated)
                    ? $maxStep
                    : (array_key_exists('paymentStep', $validated) ? (int) $validated['paymentStep'] : $transaksi->pembayaran_ke),
                'status_pembayaran' => $paymentStatus,
                'pembayaran_detail' => $payments,
            ]);

            return response()->json(['message' => 'Transaksi updated']);
        });
    }

    private function generateInvoice(Carbon $tanggal): string
    {
        $tanggalJakarta = $tanggal->copy()->setTimezone('Asia/Jakarta');
        $bulan = $tanggalJakarta->format('m');
        $tahun = $tanggalJakarta->format('Y');

        while (true) {
            $no = (string) random_int(100, 999);
            $trx = str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT);
            $invoice = "{$no}/VLC/TRX-{$trx}/{$bulan}/{$tahun}";
            $exists = Transaksi::query()->where('invoice', $invoice)->exists();
            if (! $exists) return $invoice;
        }
    }

    private function ukuranIsAvailable(?string $barangUkuran, string $selected): bool
    {
        $selected = strtoupper(trim($selected));
        if ($selected === '' || ! in_array($selected, self::UKURAN_OPTIONS, true)) return false;
        $raw = strtoupper(trim((string) $barangUkuran));
        if ($raw === '') return false;
        $parts = preg_split('/\s*,\s*/', $raw) ?: [];
        return in_array($selected, $parts, true);
    }

    private function warnaIsAvailable(?string $barangWarna, string $selected): bool
    {
        $selected = strtoupper(trim($selected));
        if ($selected === '') return false;
        $raw = strtoupper(trim((string) $barangWarna));
        if ($raw === '') return false;
        $parts = array_values(array_filter(preg_split('/\s*,\s*/', $raw) ?: []));
        return in_array($selected, $parts, true);
    }
}
