import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/transaksi.dart';
import '../../models/barang.dart';
import '../../models/pelanggan.dart';

class FormTransaksiScreen extends StatefulWidget {
  const FormTransaksiScreen({super.key});

  @override
  State<FormTransaksiScreen> createState() => _FormTransaksiScreenState();
}

class _FormTransaksiScreenState extends State<FormTransaksiScreen> {
  // Controllers
  final _qtyController = TextEditingController();
  final _bayarController = TextEditingController();
  
  // Data
  final List<Pelanggan> _pelangganList = Pelanggan.dummyData;
  final List<Barang> _barangList = Barang.dummyData;
  
  // State
  bool _isHutang = false;
  Pelanggan? _selectedPelanggan;
  Barang? _selectedBarang;
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
    _bayarController.dispose();
    super.dispose();
  }

  // Computed Properties
  double get _totalBelanja => _cart.fold(0, (sum, item) => sum + item.subtotal);
  
  double get _bayar {
    if (_bayarController.text.isEmpty) return 0;
    // Remove non-digits for parsing if user types "Rp 100.000" (though we'll restrict to number input)
    String clean = _bayarController.text.replaceAll(RegExp(r'[^0-9]'), '');
    return double.tryParse(clean) ?? 0;
  }
  
  double get _kembalian => _bayar - _totalBelanja;
  double get _kembalianNonNegatif {
    final k = _kembalian;
    return k > 0 ? k : 0;
  }

  double get _sisa {
    final s = _totalBelanja - _bayar;
    return s > 0 ? s : 0;
  }

  void _addItem() {
    if (_selectedBarang == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih barang terlebih dahulu')),
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

    if (qty > _selectedBarang!.stok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Stok tidak cukup (Sisa: ${_selectedBarang!.stok})')),
      );
      return;
    }

    setState(() {
      // Check if item already exists
      final index = _cart.indexWhere((item) => item.idBarang == _selectedBarang!.kode);
      if (index != -1) {
        // Update existing item
        final existingItem = _cart[index];
        final newQty = existingItem.qty + qty;
        _cart[index] = DetailTransaksi(
          idBarang: existingItem.idBarang,
          namaBarang: existingItem.namaBarang,
          harga: existingItem.harga,
          qty: newQty,
        );
      } else {
        // Add new item
        _cart.add(DetailTransaksi(
          idBarang: _selectedBarang!.kode,
          namaBarang: _selectedBarang!.nama,
          harga: _selectedBarang!.hargaJual,
          qty: qty,
        ));
      }
      
      // Reset Item Input
      _selectedBarang = null;
      _qtyController.clear();
    });
  }

  void _removeItem(int index) {
    setState(() {
      _cart.removeAt(index);
    });
  }

  void _saveTransaksi() {
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

    if (!_isHutang && _bayar < _totalBelanja) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pembayaran kurang')),
      );
      return;
    }

    // Create Transaksi Object
    final now = DateTime.now();
    final noFaktur = 'INV/${DateFormat('yyyyMMdd').format(now)}/${now.millisecondsSinceEpoch.toString().substring(8)}';
    
    final transaksi = Transaksi(
      id: 'TRX-${now.millisecondsSinceEpoch}',
      noFaktur: noFaktur,
      tanggal: now,
      namaPelanggan: _selectedPelanggan!.nama,
      totalHarga: _totalBelanja,
      bayar: _bayar,
      kembalian: _isHutang ? 0 : _kembalianNonNegatif,
      items: List.from(_cart),
      status: _isHutang ? 'Pending' : 'Lunas',
    );

    Navigator.pop(context, transaksi);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tambah Transaksi'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                              setState(() => _selectedBarang = val);
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
                      return ListTile(
                        title: Text(item.namaBarang),
                        subtitle: Text('${item.qty} x ${_currencyFormat.format(item.harga)}'),
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
                    TextField(
                      controller: _bayarController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Bayar (Rp)',
                        border: OutlineInputBorder(),
                        prefixText: 'Rp ',
                      ),
                      onChanged: (val) {
                        setState(() {}); // Rebuild to update change calculation
                      },
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Hutang'),
                      value: _isHutang,
                      onChanged: (value) {
                        setState(() {
                          _isHutang = value ?? false;
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isHutang ? 'Sisa' : 'Kembalian',
                          style: const TextStyle(fontSize: 16),
                        ),
                        Text(
                          _currencyFormat.format(_isHutang ? _sisa : _kembalianNonNegatif),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _isHutang
                                ? (_sisa > 0 ? Colors.orange : Colors.green)
                                : Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _saveTransaksi,
              icon: const Icon(Icons.save),
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
