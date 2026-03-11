class Barang {
  String kode;
  String nama;
  int stok;
  String satuan;
  double hargaBeli;
  double hargaJual;
  double diskon;

  Barang({
    required this.kode,
    required this.nama,
    required this.stok,
    required this.satuan,
    required this.hargaBeli,
    required this.hargaJual,
    required this.diskon,
  });

  // Untuk keperluan dummy data
  static List<Barang> get dummyData => [
        Barang(
          kode: 'VLC-001',
          nama: 'Paddock Custom Shirt',
          stok: 50,
          satuan: 'pcs',
          hargaBeli: 150000,
          hargaJual: 250000,
          diskon: 0,
        ),
        Barang(
          kode: 'VLC-002',
          nama: 'Racing Jacket Velcrone',
          stok: 25,
          satuan: 'pcs',
          hargaBeli: 350000,
          hargaJual: 550000,
          diskon: 5,
        ),
        Barang(
          kode: 'VLC-003',
          nama: 'Velcrone Limited T-Shirt',
          stok: 100,
          satuan: 'pcs',
          hargaBeli: 85000,
          hargaJual: 150000,
          diskon: 0,
        ),
        Barang(
          kode: 'VLC-004',
          nama: 'Topi Racing Snapback',
          stok: 30,
          satuan: 'pcs',
          hargaBeli: 60000,
          hargaJual: 120000,
          diskon: 10,
        ),
        Barang(
          kode: 'VLC-005',
          nama: 'Hoodie Oversized Black',
          stok: 40,
          satuan: 'pcs',
          hargaBeli: 180000,
          hargaJual: 350000,
          diskon: 0,
        ),
      ];
}
