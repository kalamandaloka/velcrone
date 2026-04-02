class DetailTransaksi {
  String idBarang;
  String namaBarang;
  double harga;
  int qty;
  String ukuran;
  String warna;
  double subtotal;

  DetailTransaksi({
    required this.idBarang,
    required this.namaBarang,
    required this.harga,
    required this.qty,
    this.ukuran = '',
    this.warna = '',
  }) : subtotal = harga * qty;

  factory DetailTransaksi.fromJson(Map<String, dynamic> json) {
    return DetailTransaksi(
      idBarang: (json['productId'] ?? '').toString(),
      namaBarang: (json['productName'] ?? '').toString(),
      harga: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse((json['price'] ?? '0').toString()) ?? 0,
      qty: (json['qty'] is num) ? (json['qty'] as num).toInt() : int.tryParse((json['qty'] ?? '0').toString()) ?? 0,
      ukuran: (json['ukuran'] ?? '').toString(),
      warna: (json['warna'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'productId': idBarang,
      'productName': namaBarang,
      'ukuran': ukuran,
      'warna': warna.isEmpty ? null : warna,
      'qty': qty,
      'price': harga,
    };
  }
}

class ProductionDetail {
  final String status;
  final DateTime? date;

  ProductionDetail({required this.status, required this.date});

  factory ProductionDetail.fromJson(Map<String, dynamic> json) {
    final raw = (json['date'] ?? '').toString();
    DateTime? parsed;
    if (raw.trim().isNotEmpty) {
      parsed = DateTime.tryParse(raw.replaceAll(' ', 'T'));
    }
    return ProductionDetail(
      status: (json['status'] ?? '').toString(),
      date: parsed,
    );
  }
}

class SpkItemDetail {
  final String? stepStatus;
  final DateTime? deadlineDate;

  SpkItemDetail({required this.stepStatus, required this.deadlineDate});

  factory SpkItemDetail.fromJson(Map<String, dynamic> json) {
    final raw = json['deadlineDate'];
    DateTime? deadline;
    if (raw is String && raw.trim().isNotEmpty) {
      deadline = DateTime.tryParse(raw.replaceAll(' ', 'T'));
    }
    final step = json['stepStatus'];
    final stepStr = (step == null) ? null : step.toString();
    return SpkItemDetail(stepStatus: stepStr, deadlineDate: deadline);
  }
}

class Transaksi {
  String id;
  String noFaktur;
  DateTime tanggal;
  String namaPelanggan; // Simplified from full Pelanggan object for list view
  double totalHarga;
  double bayar;
  double kembalian;
  List<DetailTransaksi> items;
  String status; // Lunas, Pending, Batal
  String paymentStatus;
  String productionStatus;
  List<ProductionDetail> productionDetails;
  String? spkNumber;
  Map<String, SpkItemDetail> spkDetail;

  Transaksi({
    required this.id,
    required this.noFaktur,
    required this.tanggal,
    required this.namaPelanggan,
    required this.totalHarga,
    required this.bayar,
    required this.kembalian,
    required this.items,
    required this.status,
    this.paymentStatus = '',
    this.productionStatus = 'order_masuk',
    this.productionDetails = const [],
    this.spkNumber,
    this.spkDetail = const {},
  });

  factory Transaksi.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final items = itemsRaw is List
        ? itemsRaw.map((e) => DetailTransaksi.fromJson(e as Map<String, dynamic>)).toList()
        : <DetailTransaksi>[];

    final paymentStatus = (json['paymentStatus'] ?? '').toString();
    final statusRaw = (json['status'] ?? '').toString();
    final status = statusRaw == 'cancelled'
        ? 'Batal'
        : (paymentStatus == 'lunas' ? 'Lunas' : 'Pending');

    DateTime date = DateTime.now();
    final dateStr = json['date'];
    if (dateStr is String && dateStr.trim().isNotEmpty) {
      final parsed = DateTime.tryParse(dateStr.replaceAll(' ', 'T'));
      if (parsed != null) date = parsed;
    }

    final total = (json['total'] is num)
        ? (json['total'] as num).toDouble()
        : double.tryParse((json['total'] ?? '0').toString()) ?? 0;
    final paid = (json['paymentPaid'] is num)
        ? (json['paymentPaid'] as num).toDouble()
        : double.tryParse((json['paymentPaid'] ?? '0').toString()) ?? 0;

    final spkDetailRaw = json['spkDetail'];
    final Map<String, SpkItemDetail> spkDetail = {};
    if (spkDetailRaw is Map) {
      for (final entry in spkDetailRaw.entries) {
        final key = entry.key.toString();
        final value = entry.value;
        if (value is Map<String, dynamic>) {
          spkDetail[key] = SpkItemDetail.fromJson(value);
        } else if (value is Map) {
          spkDetail[key] = SpkItemDetail.fromJson(value.map((k, v) => MapEntry(k.toString(), v)));
        }
      }
    }

    final productionDetailsRaw = json['productionDetails'];
    final productionDetails = productionDetailsRaw is List
        ? productionDetailsRaw.whereType<Map<String, dynamic>>().map(ProductionDetail.fromJson).toList()
        : <ProductionDetail>[];

    return Transaksi(
      id: (json['id'] ?? '').toString(),
      noFaktur: (json['invoice'] ?? '').toString(),
      spkNumber: (json['spkNumber'] == null) ? null : (json['spkNumber'] ?? '').toString(),
      tanggal: date,
      namaPelanggan: (json['customerName'] ?? 'Umum').toString(),
      totalHarga: total,
      bayar: paid,
      kembalian: 0,
      items: items,
      status: status,
      paymentStatus: paymentStatus,
      productionStatus: (json['productionStatus'] ?? 'order_masuk').toString(),
      productionDetails: productionDetails,
      spkDetail: spkDetail,
    );
  }

  static List<Transaksi> get dummyData => [
        Transaksi(
          id: 'TRX-001',
          noFaktur: 'INV/20231001/001',
          tanggal: DateTime(2023, 10, 1, 10, 30),
          namaPelanggan: 'Budi Santoso',
          totalHarga: 400000,
          bayar: 400000,
          kembalian: 0,
          status: 'Lunas',
          items: [
            DetailTransaksi(
              idBarang: 'VLC-001',
              namaBarang: 'Paddock Custom Shirt',
              harga: 250000,
              qty: 1,
              ukuran: 'L',
              warna: 'Hitam',
            ),
            DetailTransaksi(
              idBarang: 'VLC-003',
              namaBarang: 'Velcrone Limited T-Shirt',
              harga: 150000,
              qty: 1,
              ukuran: 'M',
              warna: 'Putih',
            ),
          ],
        ),
        Transaksi(
          id: 'TRX-002',
          noFaktur: 'INV/20231002/002',
          tanggal: DateTime(2023, 10, 2, 14, 15),
          namaPelanggan: 'Speed Tuner Garage',
          totalHarga: 2750000,
          bayar: 3000000,
          kembalian: 250000,
          status: 'Lunas',
          items: [
            DetailTransaksi(
              idBarang: 'VLC-002',
              namaBarang: 'Racing Jacket Velcrone',
              harga: 550000,
              qty: 5,
              ukuran: 'XL',
              warna: 'Merah',
            ),
          ],
        ),
        Transaksi(
          id: 'TRX-003',
          noFaktur: 'INV/20231003/003',
          tanggal: DateTime(2023, 10, 3, 09, 45),
          namaPelanggan: 'Andi Pratama',
          totalHarga: 120000,
          bayar: 120000,
          kembalian: 0,
          status: 'Lunas',
          items: [
            DetailTransaksi(
              idBarang: 'VLC-004',
              namaBarang: 'Topi Racing Snapback',
              harga: 120000,
              qty: 1,
              ukuran: 'All Size',
              warna: 'Hitam',
            ),
          ],
        ),
        Transaksi(
          id: 'TRX-004',
          noFaktur: 'INV/20231004/004',
          tanggal: DateTime(2023, 10, 4, 16, 20),
          namaPelanggan: 'Rina Kartika',
          totalHarga: 350000,
          bayar: 350000,
          kembalian: 0,
          status: 'Pending',
          items: [
            DetailTransaksi(
              idBarang: 'VLC-005',
              namaBarang: 'Hoodie Oversized Black',
              harga: 350000,
              qty: 1,
              ukuran: 'L',
              warna: 'Hitam',
            ),
          ],
        ),
      ];
}
