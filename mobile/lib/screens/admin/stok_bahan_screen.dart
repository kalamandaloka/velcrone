import 'package:flutter/material.dart';

class StokBahanScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;

  const StokBahanScreen({
    super.key,
    this.onHomePressed,
  });

  @override
  State<StokBahanScreen> createState() => _StokBahanScreenState();
}

class _StokBahanScreenState extends State<StokBahanScreen> {
  final List<Bahan> _listBahan = List.from(Bahan.dummyData);
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _filterJenisProduk = _jenisProdukOptions.first;

  static const List<String> _jenisProdukOptions = [
    'Semua',
    'Jaket',
    'Celana',
    'Tas',
    'Sofa',
    'Kursi',
    'Lainnya',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatNumber(double value) {
    if (value == value.roundToDouble()) return value.toInt().toString();
    return value.toStringAsFixed(2);
  }

  Future<void> _tambahBahan() async {
    final result = await showDialog<Bahan>(
      context: context,
      builder: (context) => const FormBahanDialog(),
    );

    if (result != null) {
      if (!mounted) return;
      setState(() {
        _listBahan.add(result);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bahan ${result.nama} berhasil ditambahkan')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _listBahan.where((bahan) {
      final query = _searchQuery.toLowerCase();
      final matchesQuery = bahan.nama.toLowerCase().contains(query) ||
          bahan.kode.toLowerCase().contains(query) ||
          bahan.kategori.toLowerCase().contains(query) ||
          bahan.jenisProduk.toLowerCase().contains(query);

      final matchesJenisProduk =
          _filterJenisProduk == 'Semua' || bahan.jenisProduk == _filterJenisProduk;

      return matchesQuery && matchesJenisProduk;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Stok Bahan'),
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
                  hintText: 'Cari Bahan...',
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
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
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
              child: DropdownButtonFormField<String>(
                key: ValueKey(_filterJenisProduk),
                initialValue: _filterJenisProduk,
                decoration: const InputDecoration(
                  labelText: 'Jenis Produk',
                  border: OutlineInputBorder(borderSide: BorderSide.none),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: _jenisProdukOptions
                    .map(
                      (e) => DropdownMenuItem<String>(
                        value: e,
                        child: Text(e),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _filterJenisProduk = value);
                },
              ),
            ),
          ),
          Expanded(
            child: filteredList.isEmpty
                ? const Center(child: Text('Data tidak ditemukan'))
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final bahan = filteredList[index];
                      final bool menipis = bahan.stokMinimum > 0 && bahan.stok <= bahan.stokMinimum;
                      final Color statusColor = menipis ? Colors.red : Colors.green;
                      final String statusText = menipis ? 'Menipis' : 'Aman';

                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text(bahan.satuan.substring(0, 1).toUpperCase()),
                          ),
                          title: Text('${bahan.nama} (${bahan.kode})'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Stok: ${_formatNumber(bahan.stok)} ${bahan.satuan}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: statusColor,
                                ),
                              ),
                              Text('Kategori: ${bahan.kategori} • Produk: ${bahan.jenisProduk}'),
                              Text(
                                'Minimum: ${_formatNumber(bahan.stokMinimum)} ${bahan.satuan} • Status: $statusText',
                              ),
                            ],
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 100),
        child: FloatingActionButton(
          onPressed: _tambahBahan,
          tooltip: 'Tambah Bahan',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class Bahan {
  final String kode;
  final String nama;
  final String kategori;
  final String jenisProduk;
  final double stok;
  final String satuan;
  final double stokMinimum;

  const Bahan({
    required this.kode,
    required this.nama,
    required this.kategori,
    required this.jenisProduk,
    required this.stok,
    required this.satuan,
    required this.stokMinimum,
  });

  static const List<Bahan> dummyData = [
    Bahan(
      kode: 'BHN-001',
      nama: 'Kain Kanvas',
      kategori: 'Kain',
      jenisProduk: 'Tas',
      stok: 40,
      satuan: 'm',
      stokMinimum: 15,
    ),
    Bahan(
      kode: 'BHN-002',
      nama: 'Busa Lembar',
      kategori: 'Busa',
      jenisProduk: 'Sofa',
      stok: 6,
      satuan: 'lembar',
      stokMinimum: 8,
    ),
    Bahan(
      kode: 'BHN-003',
      nama: 'Kancing 15mm',
      kategori: 'Kancing',
      jenisProduk: 'Jaket',
      stok: 120,
      satuan: 'pcs',
      stokMinimum: 200,
    ),
    Bahan(
      kode: 'BHN-004',
      nama: 'Resleting 20cm',
      kategori: 'Resleting',
      jenisProduk: 'Celana',
      stok: 30,
      satuan: 'pcs',
      stokMinimum: 20,
    ),
    Bahan(
      kode: 'BHN-005',
      nama: 'Benang Jahit',
      kategori: 'Benang',
      jenisProduk: 'Jaket',
      stok: 9,
      satuan: 'gulung',
      stokMinimum: 10,
    ),
    Bahan(
      kode: 'BHN-006',
      nama: 'Velcro 2cm',
      kategori: 'Velcro',
      jenisProduk: 'Tas',
      stok: 18,
      satuan: 'm',
      stokMinimum: 12,
    ),
  ];
}

class FormBahanDialog extends StatefulWidget {
  const FormBahanDialog({super.key});

  @override
  State<FormBahanDialog> createState() => _FormBahanDialogState();
}

class _FormBahanDialogState extends State<FormBahanDialog> {
  final _formKey = GlobalKey<FormState>();
  final _kodeController = TextEditingController();
  final _namaController = TextEditingController();
  final _stokController = TextEditingController();
  final _satuanController = TextEditingController();
  final _stokMinimumController = TextEditingController();
  String _selectedKategori = _kategoriOptions.first;
  String _selectedJenisProduk = _jenisProdukOptions.first;

  static const List<String> _kategoriOptions = [
    'Kain',
    'Busa',
    'Kancing',
    'Resleting',
    'Benang',
    'Lem',
    'Velcro',
    'Kulit Sintetis',
    'Aksesoris',
  ];

  static const List<String> _jenisProdukOptions = [
    'Jaket',
    'Celana',
    'Tas',
    'Sofa',
    'Kursi',
    'Lainnya',
  ];

  @override
  void dispose() {
    _kodeController.dispose();
    _namaController.dispose();
    _stokController.dispose();
    _satuanController.dispose();
    _stokMinimumController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final bahan = Bahan(
        kode: _kodeController.text.trim(),
        nama: _namaController.text.trim(),
        kategori: _selectedKategori,
        jenisProduk: _selectedJenisProduk,
        stok: double.tryParse(_stokController.text.replaceAll(',', '.')) ?? 0,
        satuan: _satuanController.text.trim(),
        stokMinimum: double.tryParse(_stokMinimumController.text.replaceAll(',', '.')) ?? 0,
      );
      Navigator.of(context).pop(bahan);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Tambah Stok Bahan'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _kodeController,
                decoration: const InputDecoration(
                  labelText: 'Kode',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Kode wajib diisi';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _namaController,
                decoration: const InputDecoration(
                  labelText: 'Nama Bahan',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Nama bahan wajib diisi';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: ValueKey(_selectedKategori),
                initialValue: _selectedKategori,
                decoration: const InputDecoration(
                  labelText: 'Kategori Bahan',
                  border: OutlineInputBorder(),
                ),
                items: _kategoriOptions
                    .map(
                      (e) => DropdownMenuItem<String>(
                        value: e,
                        child: Text(e),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _selectedKategori = value);
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: ValueKey(_selectedJenisProduk),
                initialValue: _selectedJenisProduk,
                decoration: const InputDecoration(
                  labelText: 'Jenis Produk',
                  border: OutlineInputBorder(),
                ),
                items: _jenisProdukOptions
                    .map(
                      (e) => DropdownMenuItem<String>(
                        value: e,
                        child: Text(e),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _selectedJenisProduk = value);
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _stokController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Stok',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Stok wajib diisi';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _satuanController,
                decoration: const InputDecoration(
                  labelText: 'Satuan (m/pcs/cm/lembar)',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Satuan wajib diisi';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _stokMinimumController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Stok Minimum',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Stok minimum wajib diisi';
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Batal'),
        ),
        FilledButton(
          onPressed: _submit,
          child: const Text('Simpan'),
        ),
      ],
    );
  }
}
