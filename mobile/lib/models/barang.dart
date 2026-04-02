class Barang {
  String kode;
  String nama;
  String kategori;
  String jenis;
  List<String> ukuran;
  List<String> warna;
  int stok;
  String satuan;
  double hargaBeli;
  double hargaJual;
  double diskon;

  Barang({
    required this.kode,
    required this.nama,
    this.kategori = '',
    this.jenis = '',
    this.ukuran = const [],
    this.warna = const [],
    required this.stok,
    required this.satuan,
    required this.hargaBeli,
    required this.hargaJual,
    required this.diskon,
  });

  factory Barang.fromJson(Map<String, dynamic> json) {
    final ukuran = json['ukuran'];
    final warna = json['warna'];
    return Barang(
      kode: (json['kode'] ?? '').toString(),
      nama: (json['nama'] ?? '').toString(),
      kategori: (json['kategori'] ?? '').toString(),
      jenis: (json['jenis'] ?? '').toString(),
      ukuran: ukuran is List ? ukuran.map((e) => e.toString()).toList() : const [],
      warna: warna is List ? warna.map((e) => e.toString()).toList() : const [],
      stok: int.tryParse((json['stok'] ?? '0').toString()) ?? 0,
      satuan: (json['satuan'] ?? 'pcs').toString(),
      hargaBeli: (json['hargaBeli'] is num)
          ? (json['hargaBeli'] as num).toDouble()
          : double.tryParse((json['hargaBeli'] ?? '0').toString()) ?? 0,
      hargaJual: (json['hargaJual'] is num)
          ? (json['hargaJual'] as num).toDouble()
          : double.tryParse((json['hargaJual'] ?? '0').toString()) ?? 0,
      diskon: (json['diskon'] is num)
          ? (json['diskon'] as num).toDouble()
          : double.tryParse((json['diskon'] ?? '0').toString()) ?? 0,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'kode': kode,
      'nama': nama,
      'kategori': kategori,
      'jenis': jenis,
      'ukuran': ukuran,
      'warna': warna,
      'hargaBeli': hargaBeli,
      'hargaJual': hargaJual,
      'diskon': diskon,
    };
  }

  // Untuk keperluan dummy data
  static List<Barang> get dummyData => [
        Barang(
          kode: 'VLC-001',
          nama: 'Paddock Custom Shirt',
          kategori: 'Jersey',
          jenis: 'Atasan',
          ukuran: ['S', 'M', 'L', 'XL'],
          warna: ['Hitam', 'Putih'],
          stok: 50,
          satuan: 'pcs',
          hargaBeli: 150000,
          hargaJual: 250000,
          diskon: 0,
        ),
        Barang(
          kode: 'VLC-002',
          nama: 'Racing Jacket Velcrone',
          kategori: 'Jaket',
          jenis: 'Atasan',
          ukuran: ['M', 'L', 'XL', 'XXL'],
          warna: ['Hitam', 'Merah'],
          stok: 25,
          satuan: 'pcs',
          hargaBeli: 350000,
          hargaJual: 550000,
          diskon: 5,
        ),
        Barang(
          kode: 'VLC-003',
          nama: 'Velcrone Limited T-Shirt',
          kategori: 'Kaos',
          jenis: 'Atasan',
          ukuran: ['S', 'M', 'L', 'XL', 'XXL'],
          warna: ['Hitam', 'Putih'],
          stok: 100,
          satuan: 'pcs',
          hargaBeli: 85000,
          hargaJual: 150000,
          diskon: 0,
        ),
        Barang(
          kode: 'VLC-004',
          nama: 'Topi Racing Snapback',
          kategori: 'Aksesoris',
          jenis: 'Atasan',
          ukuran: ['All Size'],
          warna: ['Hitam'],
          stok: 30,
          satuan: 'pcs',
          hargaBeli: 60000,
          hargaJual: 120000,
          diskon: 10,
        ),
        Barang(
          kode: 'VLC-005',
          nama: 'Hoodie Oversized Black',
          kategori: 'Hoodie',
          jenis: 'Atasan',
          ukuran: ['M', 'L', 'XL'],
          warna: ['Hitam'],
          stok: 40,
          satuan: 'pcs',
          hargaBeli: 180000,
          hargaJual: 350000,
          diskon: 0,
        ),
      ];
}
