import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/barang.dart';
import '../models/bahan.dart';
import '../models/pelanggan.dart';
import '../models/pemasok.dart';
import '../models/transaksi.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => 'ApiException(statusCode: $statusCode, message: $message)';
}

class ApiService {
  static const String baseUrl = 'https://api.velcrone.com/api/v1';

  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final data = await _postJson(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    final user = data['user'];
    if (user is Map<String, dynamic>) return user;
    throw ApiException('Response login tidak valid');
  }

  Future<List<Barang>> fetchBarang() async {
    final data = await _getJson('/barang');
    if (data is! List) throw ApiException('Response barang tidak valid');
    return data.map((e) => Barang.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createBarang(Barang barang) async {
    await _postJson('/barang', body: barang.toCreateJson());
  }

  Future<List<Pelanggan>> fetchPelanggan() async {
    final data = await _getJson('/pelanggan');
    if (data is! List) throw ApiException('Response pelanggan tidak valid');
    return data.map((e) => Pelanggan.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createPelanggan(Pelanggan pelanggan) async {
    await _postJson('/pelanggan', body: pelanggan.toCreateJson());
  }

  Future<List<Pemasok>> fetchPemasok() async {
    final data = await _getJson('/pemasok');
    if (data is! List) throw ApiException('Response pemasok tidak valid');
    return data.map((e) => Pemasok.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createPemasok(Pemasok pemasok) async {
    await _postJson('/pemasok', body: pemasok.toCreateJson());
  }

  Future<List<Bahan>> fetchBahan() async {
    final data = await _getJson('/bahan');
    if (data is! List) throw ApiException('Response bahan tidak valid');
    return data.map((e) => Bahan.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createBahan(Bahan bahan) async {
    await _postJson('/bahan', body: bahan.toCreateJson());
  }

  Future<List<Transaksi>> fetchTransaksi() async {
    final data = await _getJson('/transaksi');
    if (data is! List) throw ApiException('Response transaksi tidak valid');
    return data.map((e) => Transaksi.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Transaksi> fetchTransaksiById(String id) async {
    final data = await _getJson('/transaksi/$id');
    if (data is! Map<String, dynamic>) throw ApiException('Response transaksi tidak valid');
    return Transaksi.fromJson(data);
  }

  Future<Transaksi> createTransaksi({
    String? invoice,
    DateTime? date,
    required String customerId,
    String? customerName,
    required List<DetailTransaksi> items,
    required String paymentMethod,
  }) async {
    final body = <String, dynamic>{
      if (invoice != null) 'invoice': invoice,
      if (date != null) 'date': date.toIso8601String(),
      if (customerId.trim().isNotEmpty) 'customerId': customerId,
      if (customerName != null) 'customerName': customerName,
      'items': items.map((e) => e.toCreateJson()).toList(),
      'paymentMethod': paymentMethod,
    };

    final created = await _postJson('/transaksi', body: body);
    final id = created['id'];
    if (id is! String || id.isEmpty) {
      throw ApiException('Response create transaksi tidak valid');
    }
    return fetchTransaksiById(id);
  }

  Future<void> updateTransaksi({
    required String id,
    required Map<String, dynamic> body,
  }) async {
    await _putJson('/transaksi/$id', body: body);
  }

  Future<dynamic> _getJson(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await _client.get(uri, headers: _jsonHeaders());
    return _decodeResponse(res);
  }

  Future<Map<String, dynamic>> _postJson(
    String path, {
    required Map<String, dynamic> body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await _client.post(
      uri,
      headers: _jsonHeaders(),
      body: jsonEncode(body),
    );
    final decoded = _decodeResponse(res);
    if (decoded is Map<String, dynamic>) return decoded;
    throw ApiException('Response tidak valid', statusCode: res.statusCode);
  }

  Future<Map<String, dynamic>> _putJson(
    String path, {
    required Map<String, dynamic> body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final res = await _client.put(
      uri,
      headers: _jsonHeaders(),
      body: jsonEncode(body),
    );
    final decoded = _decodeResponse(res);
    if (decoded is Map<String, dynamic>) return decoded;
    throw ApiException('Response tidak valid', statusCode: res.statusCode);
  }

  Map<String, String> _jsonHeaders() => const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

  dynamic _decodeResponse(http.Response res) {
    final int code = res.statusCode;
    final String raw = res.body;

    dynamic decoded;
    try {
      decoded = raw.isEmpty ? null : jsonDecode(raw);
    } catch (_) {
      decoded = null;
    }

    if (code >= 200 && code < 300) return decoded;

    String message = 'Request gagal';
    if (decoded is Map<String, dynamic>) {
      final m = decoded['message'];
      if (m is String && m.trim().isNotEmpty) message = m;
    }
    throw ApiException(message, statusCode: code);
  }
}
