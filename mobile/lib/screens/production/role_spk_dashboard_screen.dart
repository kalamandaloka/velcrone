import 'package:flutter/material.dart';
import '../../models/transaksi.dart';
import '../../services/api_service.dart';

enum ProductionRole { design, setting, printing, heatPress, sewing, qc, packing, delivery }

extension ProductionRoleX on ProductionRole {
  static const List<String> stepOrder = [
    'DESIGN',
    'SETTING',
    'PRINTING',
    'HEAT PRESS',
    'SEWING',
    'QC',
    'PACKING',
    'DELIVERY',
    'SELESAI',
  ];

  String get label {
    return switch (this) {
      ProductionRole.design => 'DESIGN',
      ProductionRole.setting => 'SETTING',
      ProductionRole.printing => 'PRINTING',
      ProductionRole.heatPress => 'HEAT PRESS',
      ProductionRole.sewing => 'SEWING',
      ProductionRole.qc => 'QC',
      ProductionRole.packing => 'PACKING',
      ProductionRole.delivery => 'DELIVERY',
    };
  }

  String get stepStatus => label;

  String get productionStatus {
    return switch (this) {
      ProductionRole.design => 'persetujuan_desain',
      ProductionRole.setting => 'pembuatan_pola',
      ProductionRole.printing => 'print_bordir',
      ProductionRole.heatPress => 'print_bordir',
      ProductionRole.sewing => 'sewing',
      ProductionRole.qc => 'qc',
      ProductionRole.packing => 'packing',
      ProductionRole.delivery => 'shipping',
    };
  }

  String get nextStepStatus {
    return switch (this) {
      ProductionRole.design => 'SETTING',
      ProductionRole.setting => 'PRINTING',
      ProductionRole.printing => 'HEAT PRESS',
      ProductionRole.heatPress => 'SEWING',
      ProductionRole.sewing => 'QC',
      ProductionRole.qc => 'PACKING',
      ProductionRole.packing => 'DELIVERY',
      ProductionRole.delivery => 'SELESAI',
    };
  }

  String get nextProductionStatus {
    return switch (this) {
      ProductionRole.design => 'pembuatan_pola',
      ProductionRole.setting => 'print_bordir',
      ProductionRole.printing => 'print_bordir',
      ProductionRole.heatPress => 'sewing',
      ProductionRole.sewing => 'qc',
      ProductionRole.qc => 'packing',
      ProductionRole.packing => 'shipping',
      ProductionRole.delivery => 'selesai',
    };
  }
}

class _SpkRowView {
  final String id;
  final Transaksi transaksi;
  final String spkNumber;
  final String invoice;
  final String customerName;
  final String productId;
  final String productName;
  final String warna;
  final int qty;
  final List<({String size, int qty})> sizes;
  final String stepStatus;
  final DateTime? deadlineDate;

  _SpkRowView({
    required this.id,
    required this.transaksi,
    required this.spkNumber,
    required this.invoice,
    required this.customerName,
    required this.productId,
    required this.productName,
    required this.warna,
    required this.qty,
    required this.sizes,
    required this.stepStatus,
    required this.deadlineDate,
  });
}

class RoleSpkDashboardScreen extends StatefulWidget {
  final ProductionRole role;

  const RoleSpkDashboardScreen({super.key, required this.role});

  @override
  State<RoleSpkDashboardScreen> createState() => _RoleSpkDashboardScreenState();
}

class _RoleSpkDashboardScreenState extends State<RoleSpkDashboardScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  String? _error;
  List<Transaksi> _all = [];
  final Set<String> _updatingRowIds = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await _api.fetchTransaksi();
      data.sort((a, b) => b.tanggal.compareTo(a.tanggal));
      if (!mounted) return;
      setState(() {
        _all = data;
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

  String _keyFor(String productId, String warna) => '$productId::$warna';

  String _stepStatusFor(Transaksi t, String productId, String warna) {
    final key = _keyFor(productId, warna);
    final raw = t.spkDetail[key]?.stepStatus;
    final v = (raw ?? '').toString().trim().toUpperCase();
    if (v.isEmpty) return 'DESIGN';
    return (ProductionRoleX.stepOrder.contains(v)) ? v : 'DESIGN';
  }

  DateTime? _deadlineFor(Transaksi t, String productId, String warna) {
    final key = _keyFor(productId, warna);
    return t.spkDetail[key]?.deadlineDate;
  }

  DateTime? _productionDateOf(Transaksi t, String status) {
    for (final row in t.productionDetails) {
      if (row.status == status) return row.date;
    }
    return null;
  }

  ({DateTime? masuk, DateTime? selesai}) _getStepTimes(Transaksi t) {
    final masuk = _productionDateOf(t, widget.role.productionStatus) ?? t.tanggal;

    DateTime? selesai;
    final nextProduction = widget.role.nextProductionStatus;
    if (nextProduction != widget.role.productionStatus) {
      selesai = _productionDateOf(t, nextProduction);
    }
    return (masuk: masuk, selesai: selesai);
  }

  int _stepIndex(String step) {
    final idx = ProductionRoleX.stepOrder.indexOf(step.toUpperCase());
    return idx < 0 ? 0 : idx;
  }

  String _pad2(int n) => n.toString().padLeft(2, '0');

  ({String trxPart, String month, String year}) _parseInvoiceParts(String invoice) {
    final parts = invoice.split('/').map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
    final trx = parts.firstWhere(
      (p) => RegExp(r'^TRX-\d{3}$', caseSensitive: false).hasMatch(p),
      orElse: () => 'TRX-000',
    );
    final month = (parts.length >= 2 && RegExp(r'^\d{2}$').hasMatch(parts[parts.length - 2])) ? parts[parts.length - 2] : '01';
    final year = (parts.isNotEmpty && RegExp(r'^\d{4}$').hasMatch(parts.last)) ? parts.last : '1970';
    return (trxPart: trx.toUpperCase(), month: month, year: year);
  }

  List<_SpkRowView> _buildRows() {
    final List<_SpkRowView> out = [];
    for (final t in _all) {
      if (t.status == 'Batal') continue;

      final grouped = <String, ({String productId, String productName, String warna, int qty, Map<String, int> sizes})>{};
      for (final it in t.items) {
        final warna = it.warna.trim();
        final key = _keyFor(it.idBarang, warna);
        final sizeKey = it.ukuran.trim().toUpperCase();
        final existing = grouped[key];
        if (existing != null) {
          final nextSizes = Map<String, int>.from(existing.sizes);
          if (sizeKey.isNotEmpty) {
            nextSizes[sizeKey] = (nextSizes[sizeKey] ?? 0) + it.qty;
          }
          grouped[key] = (
            productId: existing.productId,
            productName: existing.productName,
            warna: existing.warna,
            qty: existing.qty + it.qty,
            sizes: nextSizes,
          );
        } else {
          final sizes = <String, int>{};
          if (sizeKey.isNotEmpty) sizes[sizeKey] = it.qty;
          grouped[key] = (productId: it.idBarang, productName: it.namaBarang, warna: warna, qty: it.qty, sizes: sizes);
        }
      }

      final groups = grouped.values.toList()
        ..sort((a, b) {
          final an = a.productName.toLowerCase();
          final bn = b.productName.toLowerCase();
          if (an != bn) return an.compareTo(bn);
          return a.warna.toLowerCase().compareTo(b.warna.toLowerCase());
        });

      final parts = _parseInvoiceParts(t.noFaktur);
      for (int i = 0; i < groups.length; i++) {
        final g = groups[i];
        final spkIndex = i + 1;
        final spkNumber = '${_pad2(spkIndex)}/SPK-$spkIndex/${parts.trxPart}/${parts.month}/${parts.year}';
        final sizes = g.sizes.entries
            .where((e) => e.key.trim().isNotEmpty && e.value > 0)
            .map((e) => (size: e.key, qty: e.value))
            .toList()
          ..sort((a, b) => a.size.compareTo(b.size));

        final stepStatus = _stepStatusFor(t, g.productId, g.warna);
        out.add(
          _SpkRowView(
            id: '${t.id}:${g.productId}:${g.warna}',
            transaksi: t,
            spkNumber: spkNumber,
            invoice: t.noFaktur,
            customerName: t.namaPelanggan,
            productId: g.productId,
            productName: g.productName,
            warna: g.warna,
            qty: g.qty,
            sizes: sizes,
            stepStatus: stepStatus,
            deadlineDate: _deadlineFor(t, g.productId, g.warna),
          ),
        );
      }
    }
    return out;
  }

  List<_SpkRowView> get _masukRows {
    final roleStep = widget.role.stepStatus;
    return _buildRows()
        .where((r) => r.stepStatus == roleStep)
        .toList()
      ..sort((a, b) => b.transaksi.tanggal.compareTo(a.transaksi.tanggal));
  }

  List<_SpkRowView> get _selesaiRows {
    final roleIdx = _stepIndex(widget.role.stepStatus);
    return _buildRows()
        .where((r) => _stepIndex(r.stepStatus) > roleIdx)
        .toList()
      ..sort((a, b) => b.transaksi.tanggal.compareTo(a.transaksi.tanggal));
  }

  String _jakartaYmd() {
    final now = DateTime.now().toUtc().add(const Duration(hours: 7));
    final y = now.year.toString().padLeft(4, '0');
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  Future<void> _markSelesai(_SpkRowView row) async {
    if (_updatingRowIds.contains(row.id)) return;
    setState(() {
      _updatingRowIds.add(row.id);
    });

    try {
      final nextStep = widget.role.nextStepStatus;
      final t = row.transaksi;
      final spkKey = _keyFor(row.productId, row.warna);
      final nextDetail = Map<String, SpkItemDetail>.from(t.spkDetail);
      nextDetail[spkKey] = SpkItemDetail(stepStatus: nextStep, deadlineDate: t.spkDetail[spkKey]?.deadlineDate);
      final allDone = nextDetail.isNotEmpty &&
          nextDetail.values.every((v) => (v.stepStatus ?? '').toString().toUpperCase() == 'SELESAI');

      await _api.updateTransaksi(
        id: t.id,
        body: {
          'spkItem': {
            'productId': row.productId,
            'warna': row.warna,
            'stepStatus': nextStep,
          },
        },
      );

      if (nextStep == 'SELESAI' && allDone) {
        await _api.updateTransaksi(
          id: t.id,
          body: {
            'productionStatus': 'selesai',
            'productionDate': _jakartaYmd(),
          },
        );
      }

      if (!mounted) return;
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('SPK berhasil dipindah ke $nextStep')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal update SPK: ${e.message}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal update SPK: $e')));
    } finally {
      if (mounted) {
        setState(() {
          _updatingRowIds.remove(row.id);
        });
      }
    }
  }

  String _two(int n) => n.toString().padLeft(2, '0');

  String _monthIdShort(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    if (month < 1 || month > 12) return '-';
    return months[month - 1];
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return '-';
    final d = dt.toLocal();
    return '${_two(d.day)} ${_monthIdShort(d.month)} ${d.year} ${_two(d.hour)}:${_two(d.minute)}';
  }

  String _formatDateShort(DateTime? dt) {
    if (dt == null) return '-';
    final d = dt.toLocal();
    return '${_two(d.day)} ${_monthIdShort(d.month)} ${d.year}';
  }

  String _formatSizes(List<({String size, int qty})> sizes) {
    if (sizes.isEmpty) return '-';
    return sizes.map((s) => '${s.size}:${s.qty}').join(', ');
  }

  Widget _buildList(List<_SpkRowView> list, {required bool allowComplete}) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Gagal memuat data: $_error'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _load,
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }

    if (list.isEmpty) return const Center(child: Text('Belum ada SPK'));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final row = list[index];
          final t = row.transaksi;
          final times = _getStepTimes(t);
          final bool isUpdating = _updatingRowIds.contains(row.id);
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              row.spkNumber,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${row.productName}${row.warna.trim().isEmpty ? '' : ' • ${row.warna}'}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              row.customerName,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${row.qty} pcs',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE50914).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: const Color(0xFFE50914).withValues(alpha: 0.35)),
                            ),
                            child: Text(
                              row.stepStatus,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFE50914),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _InfoField(
                          label: 'Masuk',
                          value: _formatDate(times.masuk ?? t.tanggal),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _InfoField(
                          label: 'Selesai',
                          value: _formatDate(times.selesai),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _InfoField(
                          label: 'Deadline',
                          value: _formatDateShort(row.deadlineDate),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _InfoField(
                          label: 'Size',
                          value: _formatSizes(row.sizes),
                        ),
                      ),
                    ],
                  ),
                  if (allowComplete) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton(
                            onPressed: isUpdating ? null : () => _markSelesai(row),
                            child: isUpdating
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Text('Tandai Selesai'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final masuk = _masukRows;
    final selesai = _selesaiRows;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Dashboard ${widget.role.label}'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Keluar',
              onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false),
            ),
          ],
          bottom: TabBar(
            tabs: [
              Tab(text: 'Masuk (${masuk.length})'),
              Tab(text: 'Selesai (${selesai.length})'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildList(masuk, allowComplete: true),
            _buildList(selesai, allowComplete: false),
          ],
        ),
      ),
    );
  }
}

class _InfoField extends StatelessWidget {
  final String label;
  final String value;

  const _InfoField({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withAlpha(60),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
