class Pemasok {
  String id;
  String namaPerusahaan;
  String kontakPerson;
  String noTelepon;
  String alamat;
  String jenisProduk; // e.g. Kain, Sablon, Aksesoris, Packaging

  Pemasok({
    required this.id,
    required this.namaPerusahaan,
    required this.kontakPerson,
    required this.noTelepon,
    required this.alamat,
    required this.jenisProduk,
  });

  static List<Pemasok> get dummyData => [
        Pemasok(
          id: 'SUP-001',
          namaPerusahaan: 'CV. Tekstil Jaya',
          kontakPerson: 'Pak Budi',
          noTelepon: '021-5551234',
          alamat: 'Jl. Industri No. 1, Bandung',
          jenisProduk: 'Kain Cotton Combed',
        ),
        Pemasok(
          id: 'SUP-002',
          namaPerusahaan: 'Sablon Kilat Pro',
          kontakPerson: 'Mas Arif',
          noTelepon: '081233445566',
          alamat: 'Jl. Percetakan Negara No. 10, Jakarta',
          jenisProduk: 'Jasa Sablon & DTF',
        ),
        Pemasok(
          id: 'SUP-003',
          namaPerusahaan: 'PT. Aksesoris Garment',
          kontakPerson: 'Ibu Susi',
          noTelepon: '021-7778899',
          alamat: 'Kawasan Industri Pulogadung, Jakarta',
          jenisProduk: 'Kancing, Resleting, Label',
        ),
        Pemasok(
          id: 'SUP-004',
          namaPerusahaan: 'Racing Apparel Vendor',
          kontakPerson: 'Pak Hendi',
          noTelepon: '081998877665',
          alamat: 'Jl. Ahmad Yani No. 50, Surabaya',
          jenisProduk: 'Konveksi Jersey & Jaket',
        ),
        Pemasok(
          id: 'SUP-005',
          namaPerusahaan: 'Mitra Packindo',
          kontakPerson: 'Pak Rudi',
          noTelepon: '021-4445566',
          alamat: 'Jl. Daan Mogot KM 15, Tangerang',
          jenisProduk: 'Plastik & Kardus Packaging',
        ),
      ];
}
