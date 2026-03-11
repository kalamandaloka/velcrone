class DetailTransaksi {
  String idBarang;
  String namaBarang;
  double harga;
  int qty;
  double subtotal;

  DetailTransaksi({
    required this.idBarang,
    required this.namaBarang,
    required this.harga,
    required this.qty,
  }) : subtotal = harga * qty;
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
  });

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
            ),
            DetailTransaksi(
              idBarang: 'VLC-003',
              namaBarang: 'Velcrone Limited T-Shirt',
              harga: 150000,
              qty: 1,
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
            ),
          ],
        ),
      ];
}
