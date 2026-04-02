import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../models/transaksi.dart';
import '../../services/pdf_service.dart';
import '../../services/api_service.dart';
import 'form_transaksi_screen.dart';

class RiwayatTransaksiScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;

  const RiwayatTransaksiScreen({super.key, this.onHomePressed});

  @override
  State<RiwayatTransaksiScreen> createState() => _RiwayatTransaksiScreenState();
}

class _RiwayatTransaksiScreenState extends State<RiwayatTransaksiScreen> {
  final ApiService _api = ApiService();
  List<Transaksi> _listTransaksi = [];
  bool _isLoading = true;
  String? _error;
  final TextEditingController _searchController = TextEditingController();
  final PdfService _pdfService = PdfService();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadTransaksi();
  }

  Future<void> _loadTransaksi() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await _api.fetchTransaksi();
      data.sort((a, b) => b.tanggal.compareTo(a.tanggal));
      if (!mounted) return;
      setState(() {
        _listTransaksi = data;
        _isLoading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _handleDownload(Transaksi t) async {
    try {
      final bytes = await _pdfService.generateInvoice(t);
      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'Invoice_${t.noFaktur.replaceAll('/', '_')}.pdf';
      final file = File('${directory.path}/$fileName');
      await file.writeAsBytes(bytes);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Invoice berhasil disimpan di ${file.path}'),
            action: SnackBarAction(
              label: 'Buka',
              onPressed: () {
                // Open file logic if needed, or just let user know
                // Using Printing package to preview/open can work too
                Printing.sharePdf(bytes: bytes, filename: fileName);
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal download invoice: $e')),
        );
      }
    }
  }

  Future<void> _handleShare(Transaksi t) async {
    try {
      final bytes = await _pdfService.generateInvoice(t);
      final directory = await getTemporaryDirectory();
      final fileName = 'Invoice_${t.noFaktur.replaceAll('/', '_')}.pdf';
      final file = File('${directory.path}/$fileName');
      await file.writeAsBytes(bytes);

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'Invoice ${t.noFaktur}',
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal share invoice: $e')),
        );
      }
    }
  }

  Future<void> _handlePrint(Transaksi t) async {
    try {
      final bytes = await _pdfService.generateInvoice(t);
      await Printing.layoutPdf(
        onLayout: (_) => Future.value(bytes),
        name: 'Invoice ${t.noFaktur}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal print invoice: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _listTransaksi.where((t) {
      final query = _searchQuery.toLowerCase();
      return t.noFaktur.toLowerCase().contains(query) ||
             t.namaPelanggan.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Transaksi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
            onPressed: () {
              Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
            },
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + kBottomNavigationBarHeight + 12,
        ),
        child: FloatingActionButton.extended(
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const FormTransaksiScreen()),
            );

            if (!context.mounted) return;
            if (result != null && result is Transaksi) {
              setState(() {
                _listTransaksi.insert(0, result);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Transaksi berhasil ditambahkan')),
              );
            }
          },
          label: const Text('Tambah Transaksi'),
          icon: const Icon(Icons.add),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withValues(alpha: 0.2),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Cari Transaksi...',
                  border: InputBorder.none,
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : (_error != null)
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Gagal memuat data: $_error'),
                              const SizedBox(height: 12),
                              FilledButton(
                                onPressed: _loadTransaksi,
                                child: const Text('Coba Lagi'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : (filteredList.isEmpty
                        ? const Center(child: Text('Data tidak ditemukan'))
                        : RefreshIndicator(
                            onRefresh: _loadTransaksi,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(bottom: 100),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final t = filteredList[index];
                                final dateStr = DateFormat('dd MMM yyyy HH:mm').format(t.tanggal);
                                final currency = NumberFormat.currency(
                                  locale: 'id_ID',
                                  symbol: 'Rp ',
                                  decimalDigits: 0,
                                );

                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: ExpansionTile(
                                    leading: Icon(
                                      t.status == 'Lunas'
                                          ? Icons.check_circle
                                          : Icons.pending_actions,
                                      color: t.status == 'Lunas' ? Colors.green : Colors.orange,
                                    ),
                                    title: Text(t.noFaktur),
                                    subtitle: Text(
                                      '$dateStr • ${t.namaPelanggan}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                    trailing: Text(
                                      currency.format(t.totalHarga),
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(16),
                                        color: Theme.of(context).colorScheme.surfaceContainerHighest.withAlpha(50),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'Detail Barang:',
                                              style: TextStyle(fontWeight: FontWeight.bold),
                                            ),
                                            const SizedBox(height: 8),
                                            ...t.items.map((item) => Padding(
                                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Expanded(
                                                        child: Text(
                                                          '${item.namaBarang} (${item.qty}x)',
                                                        ),
                                                      ),
                                                      Text(currency.format(item.subtotal)),
                                                    ],
                                                  ),
                                                )),
                                            const Divider(),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                const Text('Total'),
                                                Text(
                                                  currency.format(t.totalHarga),
                                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 16),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                              children: [
                                                IconButton.filled(
                                                  onPressed: () => _handleDownload(t),
                                                  icon: const Icon(Icons.download),
                                                  tooltip: 'Download',
                                                ),
                                                IconButton.filled(
                                                  onPressed: () => _handleShare(t),
                                                  icon: const Icon(Icons.share),
                                                  tooltip: 'Share',
                                                ),
                                                IconButton.filled(
                                                  onPressed: () => _handlePrint(t),
                                                  icon: const Icon(Icons.print),
                                                  tooltip: 'Print',
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          )),
          ),
        ],
      ),
    );
  }
}
