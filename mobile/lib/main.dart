import 'package:flutter/material.dart';
import 'screens/admin/data_barang_screen.dart';
import 'screens/admin/data_pelanggan_screen.dart';
import 'screens/admin/data_pemasok_screen.dart';
import 'screens/admin/laporan_screen.dart';
import 'screens/admin/riwayat_transaksi_screen.dart';
import 'screens/admin/stok_bahan_screen.dart';

void main() {
  runApp(const VelcroneApp());
}

class VelcroneApp extends StatelessWidget {
  const VelcroneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Velcrone Inventory',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE50914), // Red color
          primary: const Color(0xFFE50914),
          secondary: const Color(0xFFE50914),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF5F5F5), // Light grey background
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFE50914),
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: Color(0xFFE50914),
          foregroundColor: Colors.white,
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.grey),
          ),
          enabledBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.grey),
          ),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Color(0xFFE50914), width: 2),
          ),
          labelStyle: TextStyle(color: Colors.grey),
          floatingLabelStyle: TextStyle(color: Color(0xFFE50914)),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFE50914),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          color: Colors.white,
          shadowColor: Colors.black26,
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginPage(),
      },
    );
  }
}

enum UserRole { administrator, manager, kasir, pelanggan }

extension UserRoleX on UserRole {
  String get label {
    return switch (this) {
      UserRole.administrator => 'Administrator',
      UserRole.manager => 'Manager',
      UserRole.kasir => 'Kasir',
      UserRole.pelanggan => 'Pelanggan',
    };
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _openDashboard(UserRole role) {
    final Widget destination = switch (role) {
      UserRole.administrator => const AdminHomePage(),
      UserRole.manager => const SimpleHomePage(title: 'Dashboard Manager'),
      UserRole.kasir => const SimpleHomePage(title: 'Dashboard Kasir'),
      UserRole.pelanggan => const SimpleHomePage(title: 'Dashboard Pelanggan'),
    };

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => destination),
    );
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    setState(() {
      _isSubmitting = true;
    });

    await Future<void>.delayed(const Duration(milliseconds: 250));

    final String username = _usernameController.text.trim();
    final String password = _passwordController.text;

    // Determine role based on credentials
    UserRole? determinedRole;
    if (username == 'admin' && password == 'admin') {
      determinedRole = UserRole.administrator;
    } else if (username == 'manager' && password == 'manager') {
      determinedRole = UserRole.manager;
    } else if (username == 'kasir' && password == 'kasir') {
      determinedRole = UserRole.kasir;
    } else if (username == 'pelanggan' && password == 'pelanggan') {
      determinedRole = UserRole.pelanggan;
    }

    if (!mounted) return;

    setState(() {
      _isSubmitting = false;
    });

    if (determinedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login gagal. Periksa username dan password Anda.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    _openDashboard(determinedRole);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black),
          onPressed: () {
            // No back action for initial route, but UI requirement
          },
        ),
        title: const Text(
          'Back',
          style: TextStyle(color: Colors.black, fontSize: 16),
        ),
        titleSpacing: 0,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo
              Center(
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE50914), width: 3),
                    image: const DecorationImage(
                      image: AssetImage('assets/logo-valcrone.jpg'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Proceed with your account',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 48),
              
              TextFormField(
                controller: _usernameController,
                textInputAction: TextInputAction.next,
                enabled: !_isSubmitting,
                decoration: const InputDecoration(
                  labelText: 'Username',
                  hintText: 'Enter your username',
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _passwordController,
                textInputAction: TextInputAction.done,
                enabled: !_isSubmitting,
                obscureText: true,
                onFieldSubmitted: _isSubmitting ? null : (_) => _submit(),
                decoration: const InputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                ),
              ),
              const SizedBox(height: 48),
              FilledButton(
                onPressed: _isSubmitting ? null : _submit,
                child: Text(_isSubmitting ? 'Logging in...' : 'LOGIN'),
              ),
              const SizedBox(height: 24),
               Text(
                'Dummy login: admin / admin',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminHomePage extends StatefulWidget {
  const AdminHomePage({super.key});

  @override
  State<AdminHomePage> createState() => _AdminHomePageState();
}

class _AdminHomePageState extends State<AdminHomePage> {
  int _currentIndex = 0;

  void _setTabIndex(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      const DashboardHome(),
      DataBarangScreen(onHomePressed: () => _setTabIndex(0)),
      RiwayatTransaksiScreen(onHomePressed: () => _setTabIndex(0)),
      StokBahanScreen(onHomePressed: () => _setTabIndex(0)),
      LaporanScreen(onHomePressed: () => _setTabIndex(0)),
    ];

    return Scaffold(
      extendBody: true,
      body: pages[_currentIndex],
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: const Color(0xFFE50914).withValues(alpha: 0.45), width: 1.5),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildCustomNavItem(Icons.home_outlined, Icons.home, 0),
                _buildCustomNavItem(Icons.inventory_2_outlined, Icons.inventory_2, 1),
                _buildCustomNavItem(Icons.receipt_long_outlined, Icons.receipt_long, 2),
                _buildCustomNavItem(Icons.kitchen_outlined, Icons.kitchen, 3),
                _buildCustomNavItem(Icons.analytics_outlined, Icons.analytics, 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomNavItem(IconData icon, IconData activeIcon, int index) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => _setTabIndex(index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: isSelected
            ? const BoxDecoration(
                color: Color(0xFFE50914),
                shape: BoxShape.circle,
              )
            : null,
        child: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? Colors.white : Colors.grey,
          size: 24,
        ),
      ),
    );
  }
}

class DashboardHome extends StatelessWidget {
  const DashboardHome({super.key});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> menuItems = [
      {'key': 'barang', 'title': 'Data Barang', 'icon': Icons.inventory_2, 'tabIndex': 1},
      {'key': 'pelanggan', 'title': 'Data Pelanggan', 'icon': Icons.people},
      {'key': 'transaksi', 'title': 'Transaksi', 'icon': Icons.receipt_long, 'tabIndex': 2},
      {'key': 'pemasok', 'title': 'Data Pemasok', 'icon': Icons.local_shipping},
      {'key': 'stok', 'title': 'Stok Bahan', 'icon': Icons.kitchen, 'tabIndex': 3},
      {'key': 'laporan', 'title': 'Laporan', 'icon': Icons.analytics, 'tabIndex': 4},
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginPage()),
                (route) => false,
              );
            },
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100), // Bottom padding for floating nav
        children: [
          const Text(
            'Selamat Datang, Administrator',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Silakan pilih menu di bawah ini untuk mengelola data.',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.1,
            ),
            itemCount: menuItems.length,
            itemBuilder: (context, index) {
              final item = menuItems[index];
              return Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                clipBehavior: Clip.antiAlias,
                child: Ink(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFFF3B47),
                        Color(0xFFE50914),
                        Color(0xFFB20710),
                      ],
                    ),
                  ),
                  child: InkWell(
                    onTap: () {
                      final adminHomeState = context.findAncestorStateOfType<_AdminHomePageState>();
                      if (adminHomeState != null) {
                        final int? tabIndex = item['tabIndex'] as int?;
                        if (tabIndex != null) {
                          adminHomeState._setTabIndex(tabIndex);
                          return;
                        }

                        final String key = item['key'] as String;
                        if (key == 'pelanggan') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => DataPelangganScreen(
                                onHomePressed: () => Navigator.of(context).pop(),
                              ),
                            ),
                          );
                          return;
                        }

                        if (key == 'pemasok') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => DataPemasokScreen(
                                onHomePressed: () => Navigator.of(context).pop(),
                              ),
                            ),
                          );
                        }
                      }
                    },
                    child: Stack(
                      children: [
                        Positioned(
                          top: -28,
                          right: -28,
                          child: Container(
                            width: 92,
                            height: 92,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.14),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(item['icon'], size: 48, color: Colors.white),
                              const SizedBox(height: 12),
                              Text(
                                item['title'],
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}


class SimpleHomePage extends StatelessWidget {
  final String title;

  const SimpleHomePage({super.key, required this.title});

  void _logout(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
          ),
        ],
      ),
      body: const Center(
        child: Text('Halaman ini masih placeholder.'),
      ),
    );
  }
}

class PlaceholderPage extends StatelessWidget {
  final String title;
  final VoidCallback? onHomePressed;

  const PlaceholderPage({
    super.key, 
    required this.title,
    this.onHomePressed,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: onHomePressed != null 
          ? IconButton(
              icon: const Icon(Icons.home),
              tooltip: 'Kembali ke Dashboard',
              onPressed: onHomePressed,
            )
          : null,
        title: Text(title),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Halaman ini masih placeholder.\n'
                  'Nanti bisa diisi CRUD dan laporan sesuai kebutuhan.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
