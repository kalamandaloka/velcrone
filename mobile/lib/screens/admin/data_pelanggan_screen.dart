import 'package:flutter/material.dart';
import '../../models/pelanggan.dart';

class DataPelangganScreen extends StatefulWidget {
  final VoidCallback? onHomePressed;

  const DataPelangganScreen({super.key, this.onHomePressed});

  @override
  State<DataPelangganScreen> createState() => _DataPelangganScreenState();
}

class _DataPelangganScreenState extends State<DataPelangganScreen> {
  final List<Pelanggan> _listPelanggan = List.from(Pelanggan.dummyData);
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _tambahPelanggan() async {
    final result = await showDialog<Pelanggan>(
      context: context,
      builder: (context) => const FormPelangganDialog(),
    );

    if (result != null) {
      if (!mounted) return;
      setState(() {
        _listPelanggan.add(result);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Pelanggan ${result.nama} berhasil ditambahkan')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _listPelanggan.where((p) {
      final query = _searchQuery.toLowerCase();
      return p.nama.toLowerCase().contains(query) ||
             p.id.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.home),
          tooltip: 'Kembali ke Dashboard',
          onPressed: widget.onHomePressed,
        ),
        title: const Text('Data Pelanggan'),
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
                  hintText: 'Cari Pelanggan...',
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
                      final p = filteredList[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text(p.nama.substring(0, 1).toUpperCase()),
                          ),
                          title: Text(p.nama),
                          subtitle: Text('${p.kategori} • ${p.noTelepon}'),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${p.poin} Poin',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                p.id,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
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
          onPressed: _tambahPelanggan,
          tooltip: 'Tambah Pelanggan',
          child: const Icon(Icons.person_add),
        ),
      ),
    );
  }
}

class FormPelangganDialog extends StatefulWidget {
  const FormPelangganDialog({super.key});

  @override
  State<FormPelangganDialog> createState() => _FormPelangganDialogState();
}

class _FormPelangganDialogState extends State<FormPelangganDialog> {
  final _formKey = GlobalKey<FormState>();
  final _idController = TextEditingController();
  final _namaController = TextEditingController();
  final _teleponController = TextEditingController();
  final _alamatController = TextEditingController();
  String _kategori = 'Umum';

  @override
  void dispose() {
    _idController.dispose();
    _namaController.dispose();
    _teleponController.dispose();
    _alamatController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final pelanggan = Pelanggan(
        id: _idController.text,
        nama: _namaController.text,
        noTelepon: _teleponController.text,
        alamat: _alamatController.text,
        kategori: _kategori,
      );
      Navigator.of(context).pop(pelanggan);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Tambah Pelanggan'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _idController,
                decoration: const InputDecoration(labelText: 'ID Pelanggan'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _namaController,
                decoration: const InputDecoration(labelText: 'Nama Lengkap'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _teleponController,
                decoration: const InputDecoration(labelText: 'No. Telepon'),
                keyboardType: TextInputType.phone,
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              TextFormField(
                controller: _alamatController,
                decoration: const InputDecoration(labelText: 'Alamat'),
                maxLines: 2,
              ),
              DropdownButtonFormField<String>(
                initialValue: _kategori,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: ['Umum', 'Reseller', 'Komunitas Racing']
                    .map((k) => DropdownMenuItem(value: k, child: Text(k)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _kategori = val);
                },
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
