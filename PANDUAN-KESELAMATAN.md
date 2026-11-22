# Keselamatan akaun dan pusat tugasan

Versi ini menambah pusat tugasan, pengesahan dua faktor (2FA/TOTP), pengurusan sesi sendiri dan sekatan percubaan log masuk mengikut akaun. Fungsi sedia ada dan rekod bayaran dikekalkan. Tiada penghantaran data kepada aplikasi pengesah atau perkhidmatan QR luaran.

## Pasang pada pelayan

1. Buat **Sandaran penuh sistem (SQLite)** dan simpan di tempat yang dikawal aksesnya. Sandaran mengandungi maklumat peribadi, lampiran dan hash kata laluan; tiada penyulitan menyeluruh pangkalan data diperkenalkan oleh perubahan ini.
2. Kemas kini kod, bina dan mulakan semula aplikasi menggunakan kaedah sedia ada. Kekalkan volume/direktori data. Jangan gunakan `docker compose down -v`. Jadual tambahan dicipta secara automatik. Sesi lama tamat apabila pelayan dimulakan semula.
3. Untuk membolehkan persediaan 2FA, cipta kunci **sekali** pada pelayan atau komputer yang dipercayai:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Simpan nilai tersebut sebagai `MFA_ENCRYPTION_KEY` dalam `.env` bagi Docker Compose, atau pemboleh ubah persekitaran perkhidmatan Node. Compose menghantar nilai ini kepada aplikasi. Fail `.env` diabaikan oleh Git. Jangan tampal nilai tersebut ke GitHub, chat, tangkap layar atau log. Hadkan akses fail kepada pentadbir pelayan. Jika nilai tiada, aplikasi terus berfungsi tetapi persediaan 2FA baharu tidak tersedia. Nilai yang ditetapkan tetapi bukan 64 aksara hex ditolak semasa permulaan.
5. **Simpan salinan kunci berasingan daripada sandaran SQLite**, contohnya pengurus kata laluan organisasi. Kekalkan nilai sama pada pemasangan semula/pemulihan. Jangan menjana kunci baharu setiap kali aplikasi bermula. Rahsia TOTP disulitkan AES-256-GCM dengan kunci ini dan terikat kepada ID akaun; kod pemulihan hanya disimpan sebagai hash.
6. Uji log masuk, satu akaun 2FA dan pemulihan sandaran dalam persekitaran ujian sebelum digunakan meluas. Gunakan HTTPS pada produksi seperti konfigurasi sedia ada.

## Aktifkan 2FA bagi akaun sendiri

1. Buka **Umum → Keselamatan akaun**. Semua peranan boleh mengurus keselamatan akaun sendiri; pentadbir digalakkan mengaktifkannya terlebih dahulu.
2. Masukkan kata laluan semasa, pilih **Mulakan persediaan 2FA** dan tambah akaun secara manual dalam aplikasi pengesah menggunakan kunci yang dipaparkan. Pilih TOTP berasaskan masa, 6 digit, 30 saat. Jangan kongsikan kunci ini.
3. Dalam masa 10 minit, masukkan kod aplikasi dan kata laluan semasa, kemudian **Sahkan dan aktifkan 2FA**. Sehingga kod disahkan, log masuk tidak berubah.
4. Simpan sepuluh kod pemulihan di tempat peribadi. Kod dipaparkan sekali sahaja; setiap satu hanya boleh digunakan sekali. Pengaktifan menamatkan sesi lain bagi akaun yang sama.
5. Semasa log masuk, isi kata laluan serta kod aplikasi atau satu kod pemulihan. Kod aplikasi yang telah digunakan ditolak daripada digunakan semula; tunggu kod seterusnya jika perlu. Jam telefon/pelayan perlu betul (toleransi satu sela masa).
6. Untuk nyahaktifkan 2FA, masukkan kata laluan semasa serta kod aplikasi/kod pemulihan. Sesi lain turut ditamatkan. Tetapan semula kata laluan oleh pentadbir tidak membuang 2FA.

Jika kunci pelayan hilang atau berubah, TOTP sedia ada tidak dapat disahkan. Kod pemulihan yang belum digunakan masih boleh digunakan untuk log masuk, kemudian nyahaktif dan sediakan semula 2FA selepas konfigurasi dipulihkan. Jika semua kod hilang, perlukan bantuan pentadbir pelayan melalui prosedur pemulihan terkawal. Jangan memadam data pengguna untuk menyelesaikan masalah log masuk.

2FA bersifat pilihan setiap akaun dalam versi ini. Tiada penguatkuasaan mandatori atau pendaftaran automatik, untuk mengelakkan pentadbir sedia ada terkunci sebelum bersedia.

## Sesi dan percubaan log masuk

- Pelayan menamatkan sesi selepas 30 minit tanpa permintaan sah, atau maksimum 8 jam selepas log masuk. Pelayar membersihkan paparan selepas 30 minit tanpa interaksi; kembali ke tab selepas tempoh itu turut menyemak tamat sesi.
- Skrin **Keselamatan akaun** menyenaraikan sesi sendiri dan membolehkan **Tamatkan semua sesi lain** dengan kata laluan semasa. ID yang dipaparkan API bukan token kuki. Akaun lain tidak boleh dibaca/ditamatkan melalui fungsi ini.
- Maksimum sepuluh sesi serentak bagi satu akaun. Sesi lama ditamatkan apabila had dicapai. Mula semula pelayan tetap menamatkan semua sesi.
- Sekatan sedia ada: lima percubaan gagal bagi alamat IP dalam 15 minit. Tambahan: sepuluh percubaan gagal bagi satu akaun dalam 15 minit, walaupun IP berubah; sekatan akaun kekal dalam SQLite selepas mula semula. Berjaya log masuk membersihkan pembilang akaun. Percubaan mengurus keselamatan turut dihadkan selepas kegagalan.
- Log keluar, tamat sesi, pengaktifan/nyahaktifan 2FA dan penamatan sesi membersihkan maklumat sensitif yang berkaitan daripada paparan. Aktiviti keselamatan yang berjaya direkodkan dalam audit; kata laluan, rahsia TOTP dan kod pemulihan tidak dimasukkan dalam audit.

## Pusat tugasan pentadbir

Buka **Permohonan & Kelulusan → Pusat tugasan**, atau kad pada papan pemuka. Pusat ini menggabungkan pendaftaran ahli, perubahan profil, maklumat bantuan, pertukaran ketua, kematian, tuntutan khairat dan khairat diluluskan tetapi belum dibayar.

- Tapis mengikut jenis, usia (3/7/14 hari), nama/ID, belum ditugaskan atau tugasan sendiri. Tertunggak bermaksud 7 hari atau lebih; untuk bayaran, tempoh dikira sejak kelulusan.
- Pilih **Tetapkan pegawai**, pentadbir aktif dan catatan sehingga 500 aksara. Pegawai menerima notifikasi dalam sistem apabila baru ditugaskan. Tiada e-mel/WhatsApp dihantar.
- Penugasan ialah tanggungjawab operasi, bukan kebenaran tambahan. Semua kelulusan masih melalui modul asal dengan kawalan asal. Petugas/ahli tidak mendapat akses pusat ini.
- Pilih **Buka modul** untuk semakan. Tugasan selesai tidak lagi muncul selepas memuat semula pusat tugasan. Jika pegawai dinyahaktifkan, nama ditandakan tidak aktif dan boleh ditugaskan semula.
- Perubahan serentak ditolak jika rekod penugasan sudah berubah atau permohonan telah diproses. Penugasan dan notifikasi diaudit.

## Pelaksanaan seterusnya

Sejarah perubahan profil kini diterangkan dalam [PANDUAN-SEJARAH-AHLI.md](PANDUAN-SEJARAH-AHLI.md). Laporan kualiti data kini diterangkan dalam [PANDUAN-KUALITI-DATA.md](PANDUAN-KUALITI-DATA.md). Paparan status sandaran kini diterangkan dalam [PANDUAN-STATUS-SANDARAN.md](PANDUAN-STATUS-SANDARAN.md). Had dan label per kapita Asnaf kini diterangkan dalam [PANDUAN-ASNAF.md](PANDUAN-ASNAF.md). Pengakuan penerimaan bantuan kini diterangkan dalam [PANDUAN-PENGAKUAN-BANTUAN.md](PANDUAN-PENGAKUAN-BANTUAN.md). Ringkasan zon kini diterangkan dalam [PANDUAN-RINGKASAN-ZON.md](PANDUAN-RINGKASAN-ZON.md). Cadangan yang belum dilaksanakan dalam versi ini: pemisahan penyedia/pelulus bayaran, tabung dan sumbangan, kelayakan bantuan, kehadiran aktiviti, aduan bergambar, sukarelawan serta notifikasi luar. Integrasi e-mel/WhatsApp memerlukan pilihan penyedia, akaun dan persetujuan penerima. Modul kewangan memerlukan penetapan peraturan tabung serta pegawai yang bertanggungjawab sebelum diaktifkan.
