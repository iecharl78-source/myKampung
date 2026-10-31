# myKampung

Versi asas pengurusan ahli dan isi rumah, dalam Bahasa Melayu dan mesra telefon. Pentadbir boleh mendaftar, mencari dan mengemas kini ahli serta ahli keluarga. Maklumat disimpan dalam SQLite pada pelayan; tiada perkhidmatan luaran atau pakej npm diperlukan.

## Mula

Perlu Node.js 24 atau lebih baharu. Dari `/workspace/myKampung`, jalankan arahan Bash berikut untuk menetapkan kata laluan pentadbir pertama tanpa merekodkannya dalam sejarah shell:

```bash
read -rs -p 'Kata laluan pentadbir (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
npm start
```

Buka pelayar pada port 3000 pada mesin pelayan. Nama pengguna pertama ialah `admin`; gunakan kata laluan yang ditetapkan di atas. Akaun daripada versi lama dinaik taraf kepada `admin` dengan kata laluan asal dikekalkan. Kata laluan disimpan sebagai hash scrypt semasa mula pertama. Selepas pentadbir diwujudkan, pemboleh ubah itu tidak diperlukan lagi; menukarnya tidak menukar kata laluan sedia ada. Tiada kata laluan lalai. Sesi tamat selepas 8 jam atau apabila pelayan dimulakan semula.

`npm test` menjalankan ujian integrasi dengan pangkalan data sementara, termasuk log masuk, sekatan akses, pendaftaran keluarga, pengesahan input dan ketekalan data selepas mula semula.

## Data dan akses

`data/kampung.sqlite` mengandungi maklumat peribadi dan tidak dimasukkan dalam Git. `DATA_DIR`, `HOST` dan `PORT` boleh ditetapkan untuk konfigurasi tempatan. Sandarkan pangkalan data menggunakan SQLite backup atau hentikan pelayan sebelum menyalin keseluruhan direktori data. Lindungi akses fail dan sandaran.

Pelayan terikat pada `127.0.0.1` secara lalai. Untuk kegunaan sebenar melalui telefon dan komputer, sediakan domain dan reverse proxy HTTPS, tetapkan `COOKIE_SECURE=1`, dan kekalkan port aplikasi terhad kepada reverse proxy. Jika proxy pada mesin berlainan, tetapkan `HOST` yang sesuai dengan kawalan rangkaian. Proxy mesti mengekalkan pengepala Host awam. Jangan dedahkan aplikasi melalui HTTP awam.

Versi ini mempunyai akaun berasingan untuk Pentadbir dan Petugas, pengurusan kata laluan, sejarah tindakan, amaran rekod berganda, nyahaktif/aktifkan semula ahli, pemadaman dengan pengesahan rekod bantuan yang telah diterima serta sandaran/pemulihan ahli dan bantuan dalam format JSON. Petugas boleh melihat dan mengemas kini semua rekod komuniti; akaun, audit, sandaran, pemulihan dan pemadaman ahli utama terhad kepada Pentadbir. Pendaftaran sendiri oleh penduduk, pemulihan kata laluan melalui e-mel, permohonan/kelulusan bantuan belum disediakan. Sebelum penggunaan awam, sediakan HTTPS, sandaran berjadual dan semakan keselamatan mengikut keperluan komuniti. Ahli keluarga ialah tanggungan dalam rekod utama, bukan akaun atau ahli berdaftar yang berasingan. Menu Laporan menyediakan senarai ahli, keluarga dan bantuan, eksport CSV serta cetakan/PDF untuk Pentadbir. Rujuk PANDUAN-TEMPATAN.md untuk panduan penggunaan dan had fungsi.

Gunakan checkout sedia ada dalam tugas cloud; jangan cipta Git worktree kecuali diminta.

## Pemasangan dalam talian

Rujuk [PANDUAN-DALAM-TALIAN.md](PANDUAN-DALAM-TALIAN.md) untuk pakej VPS/Docker Compose dengan Caddy HTTPS, volume SQLite kekal, penciptaan pentadbir pertama, pemindahan data tempatan dan sandaran penuh berjadual. Ini memerlukan VPS serta domain sebenar; menerbitkan persekitaran pembangunan sahaja tidak menerbitkan laman web awam.

Mod production memerlukan `PUBLIC_ORIGIN=https://domain-anda` dan `COOKIE_SECURE=1`. `TRUST_PROXY=1` hanya digunakan apabila app di belakang proxy yang dipercayai dan port app tidak boleh dicapai terus oleh orang awam. Penggunaan tempatan melalui Node.js standalone kekal tersedia seperti panduan terdahulu.
