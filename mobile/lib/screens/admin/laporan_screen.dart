import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/barang.dart';
import '../../models/transaksi.dart';

class LaporanScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;

  const LaporanScreen({
    super.key,
    this.onHomePressed,
  });

  @override
  State<LaporanScreen> createState() => _LaporanScreenState();
}

class _LaporanScreenState extends State<LaporanScreen> {
  String _periode = _periodeOptions.first;

  static const List<String> _periodeOptions = [
    '7 Hari',
    '30 Hari',
    'Semua',
  ];

  DateTime _startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

  DateTime? _getStartDateForPeriode(DateTime now) {
    return switch (_periode) {
      '7 Hari' => now.subtract(const Duration(days: 6)),
      '30 Hari' => now.subtract(const Duration(days: 29)),
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    final dateFmt = DateFormat('dd MMM yyyy');

    final List<Barang> barangList = List<Barang>.from(Barang.dummyData);
    final List<Transaksi> transaksiList = List<Transaksi>.from(Transaksi.dummyData)
      ..sort((a, b) => a.tanggal.compareTo(b.tanggal));

    final DateTime now = DateTime.now();
    final DateTime? startDate = _getStartDateForPeriode(now);
    final List<Transaksi> transaksiFiltered = startDate == null
        ? transaksiList
        : transaksiList.where((t) => !t.tanggal.isBefore(_startOfDay(startDate))).toList();

    final List<Transaksi> transaksiLunas = transaksiFiltered.where((t) => t.status == 'Lunas').toList();
    final List<Transaksi> transaksiPending = transaksiFiltered.where((t) => t.status == 'Pending').toList();

    final double totalPenghasilan = transaksiLunas.fold<double>(0, (sum, t) => sum + t.totalHarga);
    final double totalPending = transaksiPending.fold<double>(0, (sum, t) => sum + t.totalHarga);
    final int totalTransaksi = transaksiFiltered.length;

    final Map<DateTime, double> penghasilanHarian = <DateTime, double>{};
    for (final t in transaksiLunas) {
      final day = _startOfDay(t.tanggal);
      penghasilanHarian[day] = (penghasilanHarian[day] ?? 0) + t.totalHarga;
    }

    final List<MapEntry<DateTime, double>> chartEntries = penghasilanHarian.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final List<_ChartPoint> chartData = chartEntries
        .map((e) => _ChartPoint(label: DateFormat('dd/MM').format(e.key), value: e.value))
        .toList();

    final Map<String, _ProdukAgg> produkAgg = <String, _ProdukAgg>{};
    for (final t in transaksiLunas) {
      for (final item in t.items) {
        final agg = produkAgg.putIfAbsent(item.namaBarang, () => _ProdukAgg(nama: item.namaBarang));
        agg.qty += item.qty;
        agg.omzet += item.subtotal;
      }
    }
    final List<_ProdukAgg> topProduk = produkAgg.values.toList()
      ..sort((a, b) => b.omzet.compareTo(a.omzet));

    final List<Barang> stokTersisaRendah = List<Barang>.from(barangList)..sort((a, b) => a.stok.compareTo(b.stok));
    final int lowStockThreshold = 10;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Laporan'),
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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  key: ValueKey(_periode),
                  initialValue: _periode,
                  decoration: const InputDecoration(
                    labelText: 'Periode',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  items: _periodeOptions
                      .map(
                        (e) => DropdownMenuItem<String>(
                          value: e,
                          child: Text(e),
                        ),
                      )
                      .toList(),
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() => _periode = v);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SummaryGrid(
            items: [
              _SummaryItem(title: 'Transaksi', value: totalTransaksi.toString(), icon: Icons.receipt_long),
              _SummaryItem(title: 'Penghasilan', value: currency.format(totalPenghasilan), icon: Icons.payments),
              _SummaryItem(title: 'Pending', value: currency.format(totalPending), icon: Icons.pending_actions),
              _SummaryItem(title: 'Jumlah Barang', value: barangList.length.toString(), icon: Icons.inventory_2),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Grafik Penghasilan Harian',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        startDate == null
                            ? 'Semua'
                            : '${dateFmt.format(_startOfDay(startDate))} - ${dateFmt.format(_startOfDay(now))}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _BarChart(
                    data: chartData.isEmpty ? const [_ChartPoint(label: '-', value: 0)] : chartData,
                    currency: currency,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Top Produk (Omzet)',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  topProduk.isEmpty
                      ? const Text('Belum ada transaksi lunas pada periode ini.')
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: DataTable(
                            columns: const [
                              DataColumn(label: Text('Produk')),
                              DataColumn(label: Text('Qty')),
                              DataColumn(label: Text('Omzet')),
                            ],
                            rows: topProduk
                                .take(5)
                                .map(
                                  (p) => DataRow(
                                    cells: [
                                      DataCell(Text(p.nama)),
                                      DataCell(Text(p.qty.toString())),
                                      DataCell(Text(currency.format(p.omzet))),
                                    ],
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sisa Stok (Terendah)',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Barang')),
                        DataColumn(label: Text('Stok')),
                        DataColumn(label: Text('Status')),
                      ],
                      rows: stokTersisaRendah.take(6).map((b) {
                        final bool menipis = b.stok <= lowStockThreshold;
                        return DataRow(
                          cells: [
                            DataCell(Text(b.nama)),
                            DataCell(Text('${b.stok} ${b.satuan}')),
                            DataCell(
                              Text(
                                menipis ? 'Menipis' : 'Aman',
                                style: TextStyle(
                                  color: menipis ? Colors.red : Colors.green,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Batas stok menipis: $lowStockThreshold',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  final List<_SummaryItem> items;

  const _SummaryGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 2.2,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: const Color(0xFFE50914).withValues(alpha: 0.12),
                  foregroundColor: const Color(0xFFE50914),
                  child: Icon(item.icon),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.value,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SummaryItem {
  final String title;
  final String value;
  final IconData icon;

  const _SummaryItem({
    required this.title,
    required this.value,
    required this.icon,
  });
}

class _BarChart extends StatelessWidget {
  final List<_ChartPoint> data;
  final NumberFormat currency;

  const _BarChart({
    required this.data,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final double maxValue = data.fold<double>(0, (m, e) => e.value > m ? e.value : m);
    return LayoutBuilder(
      builder: (context, constraints) {
        final double chartHeight = 140;
        return SizedBox(
          height: chartHeight + 36,
          child: Column(
            children: [
              SizedBox(
                height: chartHeight,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: data.map((e) {
                    final double ratio = maxValue <= 0 ? 0 : (e.value / maxValue).clamp(0, 1);
                    final double barHeight = chartHeight * ratio;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Tooltip(
                          message: '${e.label}\n${currency.format(e.value)}',
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              height: barHeight,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE50914).withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: data.map((e) {
                  return Expanded(
                    child: Text(
                      e.label,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ChartPoint {
  final String label;
  final double value;

  const _ChartPoint({
    required this.label,
    required this.value,
  });
}

class _ProdukAgg {
  final String nama;
  int qty = 0;
  double omzet = 0;

  _ProdukAgg({required this.nama});
}
