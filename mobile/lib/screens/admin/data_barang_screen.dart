import 'package:flutter/material.dart';
import '../../models/barang.dart';

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
  // Initialize with dummy data
  final List<Barang> _listBarang = List.from(Barang.dummyData);
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _tambahDataBarang() async {
    final result = await showDialog<Barang>(
      context: context,
      builder: (context) => const FormBarangDialog(),
    );

    if (result != null) {
      if (!mounted) return;
      setState(() {
        _listBarang.add(result);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Barang ${result.nama} berhasil ditambahkan')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filter list based on search query
    final filteredList = _listBarang.where((barang) {
      final query = _searchQuery.toLowerCase();
      return barang.nama.toLowerCase().contains(query) ||
             barang.kode.toLowerCase().contains(query);
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
            child: filteredList.isEmpty
                ? const Center(child: Text('Data tidak ditemukan'))
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final barang = filteredList[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text(barang.satuan.substring(0, 1).toUpperCase()),
                          ),
                          title: Text('${barang.nama} (${barang.kode})'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Stok: ${barang.stok} ${barang.satuan}'),
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
  final _stokController = TextEditingController();
  final _satuanController = TextEditingController();
  final _hargaBeliController = TextEditingController();
  final _hargaJualController = TextEditingController();
  final _diskonController = TextEditingController();

  @override
  void dispose() {
    _kodeController.dispose();
    _namaController.dispose();
    _stokController.dispose();
    _satuanController.dispose();
    _hargaBeliController.dispose();
    _hargaJualController.dispose();
    _diskonController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final barang = Barang(
        kode: _kodeController.text,
        nama: _namaController.text,
        stok: int.tryParse(_stokController.text) ?? 0,
        satuan: _satuanController.text,
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
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _stokController,
                      decoration: const InputDecoration(labelText: 'Stok'),
                      keyboardType: TextInputType.number,
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Wajib' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _satuanController,
                      decoration: const InputDecoration(labelText: 'Satuan'),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Wajib' : null,
                    ),
                  ),
                ],
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
