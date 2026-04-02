import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/transaksi.dart';
import '../../models/barang.dart';
import '../../models/pelanggan.dart';
import '../../services/api_service.dart';

class FormTransaksiScreen extends StatefulWidget {
  const FormTransaksiScreen({super.key});

  @override
  State<FormTransaksiScreen> createState() => _FormTransaksiScreenState();
}

class _FormTransaksiScreenState extends State<FormTransaksiScreen> {
  // Controllers
  final _qtyController = TextEditingController();
  final _warnaController = TextEditingController();
  
  final ApiService _api = ApiService();
  List<Pelanggan> _pelangganList = [];
  List<Barang> _barangList = [];
  bool _isLoading = true;
  String? _error;
  
  // State
  String _paymentMethod = 'cash';
  Pelanggan? _selectedPelanggan;
  Barang? _selectedBarang;
  String? _selectedUkuran;
  final List<DetailTransaksi> _cart = [];
  
  // Formatters
  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void dispose() {
    _qtyController.dispose();
    _warnaController.dispose();
    super.dispose();
  }

  // Computed Properties
  double get _totalBelanja => _cart.fold(0, (sum, item) => sum + item.subtotal);
  
  @override
  void initState() {
    super.initState();
    _loadMasterData();
  }

  Future<void> _loadMasterData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final pelanggan = await _api.fetchPelanggan();
      final barang = await _api.fetchBarang();
      if (!mounted) return;
      setState(() {
        _pelangganList = pelanggan;
        _barangList = barang;
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

  void _addItem() {
    if (_selectedBarang == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih barang terlebih dahulu')),
      );
      return;
    }

    if (_selectedUkuran == null || _selectedUkuran!.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih ukuran terlebih dahulu')),
      );
      return;
    }
    
    final qty = int.tryParse(_qtyController.text) ?? 0;
    if (qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Jumlah harus lebih dari 0')),
      );
      return;
    }

    setState(() {
      // Check if item already exists
      final index = _cart.indexWhere((item) =>
          item.idBarang == _selectedBarang!.kode &&
          item.ukuran == _selectedUkuran &&
          item.warna == _warnaController.text.trim());

      final defaultPrice = _selectedBarang!.hargaJual * (1 - (_selectedBarang!.diskon / 100));
      if (index != -1) {
        // Update existing item
        final existingItem = _cart[index];
        final newQty = existingItem.qty + qty;
        _cart[index] = DetailTransaksi(
          idBarang: existingItem.idBarang,
          namaBarang: existingItem.namaBarang,
          harga: existingItem.harga,
          qty: newQty,
          ukuran: existingItem.ukuran,
          warna: existingItem.warna,
        );
      } else {
        // Add new item
        _cart.add(DetailTransaksi(
          idBarang: _selectedBarang!.kode,
          namaBarang: _selectedBarang!.nama,
          harga: defaultPrice,
          qty: qty,
          ukuran: _selectedUkuran!,
          warna: _warnaController.text.trim(),
        ));
      }
      
      // Reset Item Input
      _selectedBarang = null;
      _selectedUkuran = null;
      _warnaController.clear();
      _qtyController.clear();
    });
  }

  void _removeItem(int index) {
    setState(() {
      _cart.removeAt(index);
    });
  }

  Future<void> _saveTransaksi() async {
    if (_selectedPelanggan == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih pelanggan terlebih dahulu')),
      );
      return;
    }
    
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Keranjang belanja masih kosong')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final created = await _api.createTransaksi(
        customerId: _selectedPelanggan!.id,
        items: _cart,
        paymentMethod: _paymentMethod,
      );
      if (!mounted) return;
      Navigator.pop(context, created);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.message;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal simpan transaksi: ${e.message}')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal simpan transaksi: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tambah Transaksi'),
      ),
      body: (_isLoading && _pelangganList.isEmpty && _barangList.isEmpty)
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text('Gagal memuat data: $_error'),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _loadMasterData,
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_error != null) ...[
                    Card(
                      color: Theme.of(context).colorScheme.errorContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          _error!,
                          style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
            // Section 1: Header Info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tanggal: ${DateFormat('dd MMM yyyy HH:mm').format(DateTime.now())}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<Pelanggan>(
                      key: ValueKey(_selectedPelanggan?.id ?? 'pelanggan_none'),
                      decoration: const InputDecoration(
                        labelText: 'Pelanggan',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                      initialValue: _selectedPelanggan,
                      items: _pelangganList.map((p) {
                        return DropdownMenuItem(
                          value: p,
                          child: Text(p.nama),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedPelanggan = val);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Section 2: Add Item
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tambah Barang', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<Barang>(
                            key: ValueKey(_selectedBarang?.kode ?? 'barang_none'),
                            decoration: const InputDecoration(
                              labelText: 'Pilih Barang',
                              border: OutlineInputBorder(),
                            ),
                            initialValue: _selectedBarang,
                            isExpanded: true,
                            items: _barangList.map((b) {
                              return DropdownMenuItem(
                                value: b,
                                child: Text(
                                  '${b.nama} (${_currencyFormat.format(b.hargaJual)})',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedBarang = val;
                                _selectedUkuran = null;
                                _warnaController.clear();
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 1,
                          child: TextField(
                            controller: _qtyController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Qty',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          onPressed: _addItem,
                          icon: const Icon(Icons.add),
                          tooltip: 'Tambah ke Keranjang',
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: DropdownButtonFormField<String>(
                            key: ValueKey('${_selectedBarang?.kode ?? 'barang_none'}_${_selectedUkuran ?? 'ukuran_none'}'),
                            decoration: const InputDecoration(
                              labelText: 'Ukuran',
                              border: OutlineInputBorder(),
                            ),
                            initialValue: _selectedUkuran,
                            items: (_selectedBarang?.ukuran ?? const <String>[])
                                .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                                .toList(),
                            onChanged: (_selectedBarang == null)
                                ? null
                                : (val) {
                                    setState(() => _selectedUkuran = val);
                                  },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 1,
                          child: TextField(
                            controller: _warnaController,
                            decoration: const InputDecoration(
                              labelText: 'Warna (opsional)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Section 3: Cart List
            const Text('Daftar Belanja', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            _cart.isEmpty
                ? const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('Belum ada barang')))
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _cart.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, index) {
                      final item = _cart[index];
                      final label = [
                        '${item.qty} x ${_currencyFormat.format(item.harga)}',
                        item.ukuran,
                        if (item.warna.trim().isNotEmpty) item.warna.trim(),
                      ].join(' • ');
                      return ListTile(
                        title: Text(item.namaBarang),
                        subtitle: Text(label),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _currencyFormat.format(item.subtotal),
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _removeItem(index),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            const Divider(thickness: 2),

            // Section 4: Payment Summary
            Card(
              color: Theme.of(context).colorScheme.surfaceContainerHighest.withAlpha(50),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Belanja', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(
                          _currencyFormat.format(_totalBelanja),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      key: ValueKey(_paymentMethod),
                      initialValue: _paymentMethod,
                      decoration: const InputDecoration(
                        labelText: 'Metode Pembayaran',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'cash', child: Text('Cash')),
                        DropdownMenuItem(value: 'transfer', child: Text('Transfer')),
                        DropdownMenuItem(value: 'qris', child: Text('QRIS')),
                        DropdownMenuItem(value: 'cicil', child: Text('Cicil')),
                      ],
                      onChanged: (val) {
                        if (val == null) return;
                        setState(() => _paymentMethod = val);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _saveTransaksi,
              icon: _isLoading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save),
              label: const Text('SIMPAN TRANSAKSI'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
