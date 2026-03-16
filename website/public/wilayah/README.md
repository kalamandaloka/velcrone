# Data Wilayah Indonesia - React Ready

Sumber data: emsifa/api-wilayah-indonesia
Jumlah data:
- Provinsi: 34
- Kabupaten/Kota: 514
- Kecamatan: 7215
- Kelurahan/Desa: 80534

## Struktur file
- api/provinces.json
- api/regencies/{provinceId}.json
- api/districts/{regencyId}.json
- api/villages/{districtId}.json

## Rekomendasi penggunaan di React
Simpan folder ini di `public/wilayah/`, lalu fetch bertahap sesuai pilihan user.
Contoh:
- `/wilayah/api/provinces.json`
- `/wilayah/api/regencies/32.json`
- `/wilayah/api/districts/3201.json`
- `/wilayah/api/villages/3201010.json`

## Simpan di database
Simpan ID, bukan nama:
- province_id
- regency_id
- district_id
- village_id
- address_detail
