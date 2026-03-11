import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/transaksi.dart';

class PdfService {
  Future<Uint8List> generateInvoice(Transaksi transaksi) async {
    final pdf = pw.Document();

    // Load font if necessary, but default font usually works for basic text.
    // For more professional look, we might want to load a custom font.
    // final font = await PdfGoogleFonts.nunitoExtraLight();

    // Load Logo
    // Note: Ensure the asset is declared in pubspec.yaml
    final logoImage = await imageFromAssetBundle('assets/logo-valcrone.jpg');

    final dateFormat = DateFormat('dd/MM/yyyy');
    final currencyFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Logo
                  pw.Container(
                    width: 80,
                    height: 80,
                    child: pw.Image(logoImage),
                  ),
                  pw.SizedBox(width: 20),
                  // Company Info
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'SALES INVOICE',
                          style: pw.TextStyle(
                            fontSize: 24,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'Dusun Jumbleng, RT.02/RW.06, Ranjeng, Kec. Cisitu\n'
                          'Kabupaten Sumedang, Jawa Barat 45363\n'
                          'Indonesia\n'
                          'Whatsapp : 085846655470',
                          style: const pw.TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  // Invoice Details
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'No : ${transaksi.noFaktur}',
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text('Tanggal Order : ${dateFormat.format(transaksi.tanggal)}'),
                      pw.Text('Tanggal Selesai : ${dateFormat.format(DateTime.now())}'),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Customer & Amount
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Kepada Yth.', style: const pw.TextStyle(fontSize: 12)),
                      pw.Text(
                        transaksi.namaPelanggan,
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'JUMLAH YANG HARUS DIBAYAR',
                        style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                      ),
                      pw.Text(
                        currencyFormat.format(transaksi.totalHarga),
                        style: pw.TextStyle(
                          fontSize: 24,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.black, 
                        ),
                      ),
                      pw.Text(
                        transaksi.status == 'Lunas'
                            ? 'Terima Kasih Transaksi anda Sudah Lunas'
                            : 'Status: ${transaksi.status}',
                        style: pw.TextStyle(fontSize: 10, fontStyle: pw.FontStyle.italic),
                      ),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Table
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300),
                columnWidths: {
                  0: const pw.FlexColumnWidth(2), // Kode
                  1: const pw.FlexColumnWidth(4), // Nama Produk
                  2: const pw.FlexColumnWidth(1.5), // Size Atasan
                  3: const pw.FlexColumnWidth(1.5), // Size Bawahan
                  4: const pw.FlexColumnWidth(1.5), // Jumlah
                  5: const pw.FlexColumnWidth(1.5), // Satuan
                  6: const pw.FlexColumnWidth(2), // Harga
                  7: const pw.FlexColumnWidth(2), // Total
                },
                children: [
                  // Table Header
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.black),
                    children: [
                      _buildHeaderCell('KODE'),
                      _buildHeaderCell('NAMA PRODUK'),
                      _buildHeaderCell('SIZE\nATASAN'),
                      _buildHeaderCell('SIZE\nBAWAHAN'),
                      _buildHeaderCell('JUMLAH'),
                      _buildHeaderCell('SATUAN'),
                      _buildHeaderCell('HARGA'),
                      _buildHeaderCell('TOTAL'),
                    ],
                  ),
                  // Table Data
                  ...transaksi.items.map((item) {
                    return pw.TableRow(
                      children: [
                        _buildDataCell(item.idBarang),
                        _buildDataCell(item.namaBarang),
                        _buildDataCell('-'), // Placeholder for Size Atasan
                        _buildDataCell('-'), // Placeholder for Size Bawahan
                        _buildDataCell('${item.qty}'),
                        _buildDataCell('Pcs'), // Placeholder for Satuan
                        _buildDataCell(currencyFormat.format(item.harga)),
                        _buildDataCell(currencyFormat.format(item.subtotal)),
                      ],
                    );
                  }),
                ],
              ),
              
              // Spacer to push footer down if needed, or just some space
              pw.SizedBox(height: 20),

              // Footer Section (Signatures & Totals)
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // QR Code & Signatures
                  pw.Expanded(
                    flex: 6,
                    child: pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                      children: [
                        // QR Code Placeholder
                        pw.Container(
                          width: 80,
                          height: 80,
                          child: pw.BarcodeWidget(
                            barcode: pw.Barcode.qrCode(),
                            data: transaksi.noFaktur,
                          ),
                        ),
                        pw.Column(
                          children: [
                            pw.SizedBox(height: 40),
                            pw.Text('Tanda Terima', style: const pw.TextStyle(fontSize: 10)),
                            pw.SizedBox(height: 40),
                            pw.Container(width: 80, height: 1, color: PdfColors.black),
                          ],
                        ),
                        pw.Column(
                          children: [
                            pw.SizedBox(height: 40),
                            pw.Text('Velcrone Admin', style: const pw.TextStyle(fontSize: 10)),
                            pw.SizedBox(height: 40),
                            pw.Container(width: 80, height: 1, color: PdfColors.black),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Totals
                  pw.Expanded(
                    flex: 4,
                    child: pw.Container(
                      padding: const pw.EdgeInsets.only(left: 10),
                      child: pw.Column(
                        children: [
                          _buildSummaryRow('Sub Total', currencyFormat.format(transaksi.totalHarga)),
                          _buildSummaryRow('Diskon', 'Rp 0'),
                          pw.Divider(),
                          _buildSummaryRow('Total', currencyFormat.format(transaksi.totalHarga), isBold: true),
                          _buildSummaryRow('Bayar', currencyFormat.format(transaksi.bayar)),
                          _buildSummaryRow('Sisa', currencyFormat.format(transaksi.totalHarga - transaksi.bayar)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              pw.Spacer(),

              // Bottom Footer
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(top: pw.BorderSide(color: PdfColors.black)),
                ),
                padding: const pw.EdgeInsets.only(top: 8),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('https://velcrone.id', style: const pw.TextStyle(fontSize: 8)),
                    pw.Text('velcroneid@gmail.com', style: const pw.TextStyle(fontSize: 8)),
                    pw.Text('@velcrone', style: const pw.TextStyle(fontSize: 8)),
                    pw.Text('Velcrone Official Store', style: const pw.TextStyle(fontSize: 8)),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  pw.Widget _buildHeaderCell(String text) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(4),
      alignment: pw.Alignment.center,
      child: pw.Text(
        text,
        style: pw.TextStyle(
          color: PdfColors.white,
          fontWeight: pw.FontWeight.bold,
          fontSize: 8,
        ),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  pw.Widget _buildDataCell(String text) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(4),
      alignment: pw.Alignment.center,
      child: pw.Text(
        text,
        style: const pw.TextStyle(fontSize: 8),
        textAlign: pw.TextAlign.center,
      ),
    );
  }

  pw.Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          label,
          style: pw.TextStyle(
            fontSize: 10,
            fontWeight: isBold ? pw.FontWeight.bold : null,
          ),
        ),
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 10,
            fontWeight: isBold ? pw.FontWeight.bold : null,
          ),
        ),
      ],
    );
  }
}
