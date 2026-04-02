import 'package:flutter/material.dart';
import '../../models/pemasok.dart';
import '../../services/api_service.dart';

class DataPemasokScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;

  const DataPemasokScreen({super.key, this.onHomePressed});

  @override
  State<DataPemasokScreen> createState() => _DataPemasokScreenState();
}

class _DataPemasokScreenState extends State<DataPemasokScreen> {
  final ApiService _api = ApiService();
  List<Pemasok> _listPemasok = [];
  bool _isLoading = true;
  String? _error;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadPemasok();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadPemasok() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await _api.fetchPemasok();
      if (!mounted) return;
      setState(() {
        _listPemasok = data;
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

  void _tambahPemasok() async {
    final result = await showDialog<Pemasok>(
      context: context,
      builder: (context) => const FormPemasokDialog(),
    );

    if (result != null) {
      if (!mounted) return;
      try {
        await _api.createPemasok(result);
        if (!mounted) return;
        await _loadPemasok();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${result.namaPerusahaan} berhasil ditambahkan')),
        );
      } on ApiException catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menambah pemasok: ${e.message}')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menambah pemasok: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _listPemasok.where((p) {
      final query = _searchQuery.toLowerCase();
      return p.namaPerusahaan.toLowerCase().contains(query) ||
             p.kontakPerson.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Data Pemasok'),
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
                  hintText: 'Cari Pemasok...',
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
                                onPressed: _loadPemasok,
                                child: const Text('Coba Lagi'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : (filteredList.isEmpty
                        ? const Center(child: Text('Data tidak ditemukan'))
                        : RefreshIndicator(
                            onRefresh: _loadPemasok,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(bottom: 100),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final p = filteredList[index];
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: ListTile(
                                    leading: const Icon(Icons.store, size: 36),
                                    title: Text(p.namaPerusahaan),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Kontak: ${p.kontakPerson} (${p.noTelepon})'),
                                        Text(
                                          p.jenisProduk,
                                          style: TextStyle(
                                            color: Theme.of(context).primaryColor,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                    isThreeLine: true,
                                    trailing: const Icon(Icons.chevron_right),
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
          onPressed: _tambahPemasok,
          tooltip: 'Tambah Pemasok',
          child: const Icon(Icons.add_business),
        ),
      ),
    );
  }
}

class FormPemasokDialog extends StatefulWidget {
  const FormPemasokDialog({super.key});

  @override
  State<FormPemasokDialog> createState() => _FormPemasokDialogState();
}

class _FormPemasokDialogState extends State<FormPemasokDialog> {
  final _formKey = GlobalKey<FormState>();
  final _idController = TextEditingController();
  final _namaController = TextEditingController();
  final _kontakController = TextEditingController();
  final _teleponController = TextEditingController();
  final _alamatController = TextEditingController();
  final _jenisController = TextEditingController();

  @override
  void dispose() {
    _idController.dispose();
    _namaController.dispose();
    _kontakController.dispose();
    _teleponController.dispose();
    _alamatController.dispose();
    _jenisController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final pemasok = Pemasok(
        id: _idController.text,
        namaPerusahaan: _namaController.text,
        kontakPerson: _kontakController.text,
        noTelepon: _teleponController.text,
        alamat: _alamatController.text,
        jenisProduk: _jenisController.text,
      );
      Navigator.of(context).pop(pemasok);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Tambah Pemasok'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _idController,
                decoration: const InputDecoration(labelText: 'ID Pemasok'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _namaController,
                decoration: const InputDecoration(labelText: 'Nama Perusahaan'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _kontakController,
                decoration: const InputDecoration(labelText: 'Kontak Person'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _teleponController,
                decoration: const InputDecoration(labelText: 'No. Telepon'),
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _jenisController,
                decoration: const InputDecoration(labelText: 'Jenis Produk/Jasa'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _alamatController,
                decoration: const InputDecoration(labelText: 'Alamat'),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
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
