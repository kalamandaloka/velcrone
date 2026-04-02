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

  factory Bahan.fromJson(Map<String, dynamic> json) {
    return Bahan(
      kode: (json['kode'] ?? '').toString(),
      nama: (json['nama'] ?? '').toString(),
      kategori: (json['kategori'] ?? '').toString(),
      jenisProduk: (json['jenisProduk'] ?? '').toString(),
      stok: (json['stok'] is num) ? (json['stok'] as num).toDouble() : double.tryParse((json['stok'] ?? '0').toString()) ?? 0,
      satuan: (json['satuan'] ?? '').toString(),
      stokMinimum: (json['minStok'] is num) ? (json['minStok'] as num).toDouble() : double.tryParse((json['minStok'] ?? '0').toString()) ?? 0,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'kode': kode,
      'nama': nama,
      'kategori': kategori,
      'jenisProduk': jenisProduk,
      'stok': stok,
      'satuan': satuan,
      'minStok': stokMinimum,
    };
  }

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
