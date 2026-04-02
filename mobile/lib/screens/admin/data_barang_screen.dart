import 'package:flutter/material.dart';
import '../../models/barang.dart';
import '../../services/api_service.dart';

class DataBarangScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;
  
  const DataBarangScreen({
    super.key, 
    this.onHomePressed,
  });

  @override
  State<DataBarangScreen> createState() => _DataBarangScreenState();
}

class _DataBarangScreenState extends State<DataBarangScreen> {
  final ApiService _api = ApiService();
  List<Barang> _listBarang = [];
  bool _isLoading = true;
  String? _error;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadBarang();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadBarang() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await _api.fetchBarang();
      if (!mounted) return;
      setState(() {
        _listBarang = data;
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

  void _tambahDataBarang() async {
    final result = await showDialog<Barang>(
      context: context,
      builder: (context) => const FormBarangDialog(),
    );

    if (result != null) {
      if (!mounted) return;
      try {
        await _api.createBarang(result);
        if (!mounted) return;
        await _loadBarang();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Barang ${result.nama} berhasil ditambahkan')),
        );
      } on ApiException catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menambah barang: ${e.message}')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menambah barang: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _listBarang.where((barang) {
      final query = _searchQuery.toLowerCase();
      return barang.nama.toLowerCase().contains(query) ||
          barang.kode.toLowerCase().contains(query) ||
          barang.kategori.toLowerCase().contains(query) ||
          barang.jenis.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Data Barang'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
            onPressed: () {
               // Kembali ke login dengan menghapus semua route
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
                  hintText: 'Cari Barang...',
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
                                onPressed: _loadBarang,
                                child: const Text('Coba Lagi'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : (filteredList.isEmpty
                        ? const Center(child: Text('Data tidak ditemukan'))
                        : RefreshIndicator(
                            onRefresh: _loadBarang,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(bottom: 100),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final barang = filteredList[index];
                                final ukuranText = barang.ukuran.isEmpty ? '-' : barang.ukuran.join(', ');
                                final warnaText = barang.warna.isEmpty ? '-' : barang.warna.join(', ');
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      child: Text(
                                        (barang.jenis.isNotEmpty ? barang.jenis.substring(0, 1) : 'B').toUpperCase(),
                                      ),
                                    ),
                                    title: Text('${barang.nama} (${barang.kode})'),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Kategori: ${barang.kategori} • Jenis: ${barang.jenis}'),
                                        Text('Ukuran: $ukuranText'),
                                        Text('Warna: $warnaText'),
                                        Text('Harga Jual: Rp ${barang.hargaJual}'),
                                        if (barang.diskon > 0)
                                          Text(
                                            'Diskon: ${barang.diskon}%',
                                            style: const TextStyle(color: Colors.red),
                                          ),
                                      ],
                                    ),
                                    isThreeLine: true,
                                    trailing: Text(
                                      'Beli: ${barang.hargaBeli}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ),
                                );
                              },
                            ),
                          )),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 100),
        child: FloatingActionButton(
          onPressed: _tambahDataBarang,
          tooltip: 'Tambah Barang',
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

class FormBarangDialog extends StatefulWidget {
  const FormBarangDialog({super.key});

  @override
  State<FormBarangDialog> createState() => _FormBarangDialogState();
}

class _FormBarangDialogState extends State<FormBarangDialog> {
  final _formKey = GlobalKey<FormState>();
  final _kodeController = TextEditingController();
  final _namaController = TextEditingController();
  final _kategoriController = TextEditingController();
  final _ukuranController = TextEditingController();
  final _warnaController = TextEditingController();
  final _hargaBeliController = TextEditingController();
  final _hargaJualController = TextEditingController();
  final _diskonController = TextEditingController();
  String _jenis = 'Atasan';

  @override
  void dispose() {
    _kodeController.dispose();
    _namaController.dispose();
    _kategoriController.dispose();
    _ukuranController.dispose();
    _warnaController.dispose();
    _hargaBeliController.dispose();
    _hargaJualController.dispose();
    _diskonController.dispose();
    super.dispose();
  }

  List<String> _parseCsv(String value) {
    return value
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final barang = Barang(
        kode: _kodeController.text,
        nama: _namaController.text,
        kategori: _kategoriController.text.trim(),
        jenis: _jenis,
        ukuran: _parseCsv(_ukuranController.text),
        warna: _parseCsv(_warnaController.text),
        stok: 0,
        satuan: 'pcs',
        hargaBeli: double.tryParse(_hargaBeliController.text) ?? 0,
        hargaJual: double.tryParse(_hargaJualController.text) ?? 0,
        diskon: double.tryParse(_diskonController.text) ?? 0,
      );
      Navigator.of(context).pop(barang);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Tambah Data Barang'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _kodeController,
                decoration: const InputDecoration(labelText: 'Kode Barang'),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Kode wajib diisi' : null,
              ),
              TextFormField(
                controller: _namaController,
                decoration: const InputDecoration(labelText: 'Nama Barang'),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Nama wajib diisi' : null,
              ),
              DropdownButtonFormField<String>(
                key: ValueKey(_jenis),
                initialValue: _jenis,
                decoration: const InputDecoration(labelText: 'Jenis'),
                items: const [
                  DropdownMenuItem(value: 'Atasan', child: Text('Atasan')),
                  DropdownMenuItem(value: 'Pants', child: Text('Pants')),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _jenis = v);
                },
              ),
              TextFormField(
                controller: _kategoriController,
                decoration: const InputDecoration(labelText: 'Kategori'),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Kategori wajib diisi' : null,
              ),
              TextFormField(
                controller: _ukuranController,
                decoration: const InputDecoration(labelText: 'Ukuran (pisahkan dengan koma)'),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Ukuran wajib diisi' : null,
              ),
              TextFormField(
                controller: _warnaController,
                decoration: const InputDecoration(labelText: 'Warna (pisahkan dengan koma)'),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Warna wajib diisi' : null,
              ),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _hargaBeliController,
                      decoration: const InputDecoration(labelText: 'Harga Beli'),
                      keyboardType: TextInputType.number,
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Wajib' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _hargaJualController,
                      decoration: const InputDecoration(labelText: 'Harga Jual'),
                      keyboardType: TextInputType.number,
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Wajib' : null,
                    ),
                  ),
                ],
              ),
              TextFormField(
                controller: _diskonController,
                decoration: const InputDecoration(labelText: 'Diskon (%)'),
                keyboardType: TextInputType.number,
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
