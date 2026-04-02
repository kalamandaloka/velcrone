class Pelanggan {
  String id;
  String nama;
  String? email;
  String noTelepon;
  String alamat;
  String kategori; // e.g. Umum, Reseller, Komunitas Racing
  int poin;

  Pelanggan({
    required this.id,
    required this.nama,
    this.email,
    required this.noTelepon,
    required this.alamat,
    required this.kategori,
    this.poin = 0,
  });

  factory Pelanggan.fromJson(Map<String, dynamic> json) {
    return Pelanggan(
      id: (json['id'] ?? '').toString(),
      nama: (json['nama'] ?? '').toString(),
      email: (json['email'] as String?)?.toString(),
      noTelepon: (json['noTelepon'] ?? '').toString(),
      alamat: (json['alamat'] ?? '').toString(),
      kategori: (json['kategori'] ?? '').toString(),
      poin: (json['poin'] is num)
          ? (json['poin'] as num).toInt()
          : int.tryParse((json['poin'] ?? '0').toString()) ?? 0,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'id': id,
      'nama': nama,
      'email': email,
      'noTelepon': noTelepon,
      'alamat': alamat,
      'kategori': kategori,
      'poin': poin,
    };
  }

  static List<Pelanggan> get dummyData => [
        Pelanggan(
          id: 'CUST-001',
          nama: 'Budi Santoso',
          email: null,
          noTelepon: '081234567890',
          alamat: 'Jl. Pemuda No. 10, Jakarta',
          kategori: 'Umum',
          poin: 50,
        ),
        Pelanggan(
          id: 'CUST-002',
          nama: 'Speed Tuner Garage',
          email: null,
          noTelepon: '081987654321',
          alamat: 'Jl. Sirkuit Sentul No. 5, Bogor',
          kategori: 'Komunitas Racing',
          poin: 1200,
        ),
        Pelanggan(
          id: 'CUST-003',
          nama: 'Andi Pratama',
          email: null,
          noTelepon: '085678901234',
          alamat: 'Jl. Merdeka No. 45, Bandung',
          kategori: 'Reseller',
          poin: 500,
        ),
        Pelanggan(
          id: 'CUST-004',
          nama: 'Rina Kartika',
          email: null,
          noTelepon: '081345678901',
          alamat: 'Jl. Diponegoro No. 20, Surabaya',
          kategori: 'Umum',
          poin: 20,
        ),
        Pelanggan(
          id: 'CUST-005',
          nama: 'Fast Lane Club',
          email: null,
          noTelepon: '081298765432',
          alamat: 'Jl. Raya Bogor KM 30, Depok',
          kategori: 'Komunitas Racing',
          poin: 2500,
        ),
      ];
}
