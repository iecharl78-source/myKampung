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

Versi ini mempunyai akaun berasingan untuk Pentadbir, Petugas dan Ahli, pengurusan kata laluan, sejarah tindakan, amaran rekod berganda, nyahaktif/aktifkan semula ahli, pemadaman dengan pengesahan rekod bantuan yang telah diterima serta sandaran/pemulihan ahli dan bantuan dalam format JSON. Petugas boleh melihat dan mengemas kini semua rekod komuniti; akaun, audit, sandaran, pemulihan dan pemadaman ahli utama terhad kepada Pentadbir. Pendaftaran sendiri penduduk tersedia melalui /daftar dan memerlukan kelulusan Pentadbir sebelum menjadi ahli. Pemulihan kata laluan melalui e-mel serta permohonan/kelulusan bantuan belum disediakan. Sebelum penggunaan awam, sediakan HTTPS, sandaran berjadual dan semakan keselamatan mengikut keperluan komuniti. Ahli keluarga ialah tanggungan dalam rekod utama, bukan akaun atau ahli berdaftar yang berasingan. Menu Laporan menyediakan senarai ahli, keluarga dan bantuan, eksport CSV serta cetakan/PDF untuk Pentadbir. Rujuk PANDUAN-TEMPATAN.md untuk panduan penggunaan dan had fungsi.

Gunakan checkout sedia ada dalam tugas cloud; jangan cipta Git worktree kecuali diminta.

## Pemasangan dalam talian

Rujuk [PANDUAN-DALAM-TALIAN.md](PANDUAN-DALAM-TALIAN.md) untuk pakej VPS/Docker Compose dengan Caddy HTTPS, volume SQLite kekal, penciptaan pentadbir pertama, pemindahan data tempatan dan sandaran penuh berjadual. Ini memerlukan VPS serta domain sebenar; menerbitkan persekitaran pembangunan sahaja tidak menerbitkan laman web awam.

Mod production memerlukan `PUBLIC_ORIGIN=https://domain-anda` dan `COOKIE_SECURE=1`. `TRUST_PROXY=1` hanya digunakan apabila app di belakang proxy yang dipercayai dan port app tidak boleh dicapai terus oleh orang awam. Penggunaan tempatan melalui Node.js standalone kekal tersedia seperti panduan terdahulu.

## Portal ahli dan kelulusan perubahan

Pemohon menetapkan ID pengguna dan kata laluan semasa pendaftaran `/daftar`; akaun hanya boleh digunakan selepas kelulusan Pentadbir. Ahli hanya dapat melihat profil, keluarga dan sejarah bantuan isi rumah sendiri. Profil dikunci secara lalai; butang Kemaskini membuka borang dan Hantar untuk kelulusan. Setiap penambahan, perubahan atau pemadaman keluarga daripada portal dihantar sebagai permohonan. Ahli juga boleh menambah/mengemaskini maklumat bantuan isi rumah sendiri melalui kelulusan Pentadbir. Rekod rasmi kekal sehingga Pentadbir meluluskan melalui **Semakan perubahan**; penolakan memerlukan sebab. Petugas tidak boleh meluluskan permohonan ahli.

**Aktiviti & hebahan** menyediakan pengumuman dan kalendar waktu Malaysia. Pentadbir/Petugas mengurus siaran; Ahli hanya melihat siaran diterbitkan. **Pertanyaan** membolehkan komunikasi peribadi ahli dengan Pentadbir/Petugas. **Notifikasi** memaklumkan siaran, keputusan semakan dan balasan dalam aplikasi (tiada e-mel/SMS/push).

Sandaran JSON versi 5 mengandungi rekod ahli, bantuan, permohonan pendaftaran serta hebahan/aktiviti. Akaun, kata laluan, permohonan perubahan profil/bantuan, pertanyaan, mesej, notifikasi dan audit memerlukan **sandaran penuh SQLite/folder data**. Untuk memindahkan pemasangan lengkap, gunakan sandaran penuh. Rujuk panduan tempatan untuk pemautan semula akaun dan cara menguji portal tanpa penerbitan dalam talian.

## Papan pemuka

Paparan pertama selepas log masuk merangkum permohonan menunggu semakan (Pentadbir), permohonan/keputusan isi rumah sendiri (Ahli), notifikasi belum dibaca, pertanyaan terbuka, aktiviti akan datang/berlangsung dan hebahan diterbitkan. Kad menyediakan pautan terus kepada tindakan yang dibenarkan mengikut peranan. Tekan Muat semula ringkasan untuk mendapatkan jumlah terkini.

## Sandaran penuh dari aplikasi

Pentadbir boleh memuat turun sandaran SQLite lengkap melalui **Papan pemuka → Sandaran penuh sistem**, dengan pengesahan kata laluan semasa. Berbeza daripada JSON, fail ini merangkumi akaun, mesej dan semua jadual portal. Sandaran berjadual tidak diaktifkan secara automatik.

Pemulihan penuh dibuat ke folder baharu yang belum wujud menggunakan `node scripts/restore-full.js --source fail.sqlite --destination folder-baharu`, kemudian aplikasi dimulakan dengan `DATA_DIR` merujuk folder itu. Skrip mengekalkan sumber serta data asal dan menyemak integriti serta kewujudan pentadbir aktif. Rujuk panduan tempatan untuk contoh Windows/Node.js standalone dan latihan pemulihan.
