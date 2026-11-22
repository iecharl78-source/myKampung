# myKampung

Versi asas pengurusan ahli dan isi rumah, dalam Bahasa Melayu dan mesra telefon. Pentadbir boleh mendaftar, mencari dan mengemas kini ahli serta ahli keluarga. Maklumat disimpan dalam SQLite pada pelayan; tiada perkhidmatan luaran atau pakej npm diperlukan.

## Panduan untuk dikongsi

- [Pemasangan tempatan untuk rakan](PANDUAN-RAKAN-LOCAL.md): muat turun kod, Node.js biasa/standalone, PowerShell, akaun pertama dan penyelesaian masalah.
- [Manual pengguna](MANUAL-PENGGUNA.md): langkah penggunaan mengikut peranan dan semua fungsi semasa.
- [Panduan teknikal tempatan](PANDUAN-TEMPATAN.md): naik taraf, sandaran dan pemulihan.

Untuk percubaan rakan, kongsi ZIP kod daripada GitHub bersama panduan; rakan mencipta data dan kata laluan sendiri. Jangan sertakan folder data, sandaran atau kelayakan pemasangan anda.

## Mula

Perlu Node.js 24 atau lebih baharu. Dari folder aplikasi yang mempunyai `server.js`, jalankan arahan Bash berikut untuk menetapkan kata laluan pentadbir pertama tanpa merekodkannya dalam sejarah shell:

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

Versi ini mempunyai akaun berasingan untuk Pentadbir, Petugas dan Ahli, pengurusan kata laluan, sejarah tindakan, amaran rekod berganda, nyahaktif/aktifkan semula ahli, pemadaman dengan pengesahan rekod bantuan yang telah diterima serta sandaran/pemulihan ahli dan bantuan dalam format JSON. Petugas boleh melihat dan mengemas kini semua rekod komuniti; akaun, audit, sandaran, pemulihan dan pemadaman ahli utama terhad kepada Pentadbir. Pendaftaran sendiri penduduk tersedia melalui /daftar dan memerlukan kelulusan Pentadbir sebelum menjadi ahli. Pemulihan kata laluan melalui e-mel dan permohonan untuk mendapatkan bantuan baharu belum disediakan; maklumat bantuan yang telah diterima boleh dicadangkan oleh ahli untuk kelulusan pentadbir. Sebelum penggunaan awam, sediakan HTTPS, sandaran berjadual dan semakan keselamatan mengikut keperluan komuniti. Ahli keluarga ialah tanggungan dalam rekod utama, bukan akaun atau ahli berdaftar yang berasingan. Menu Laporan menyediakan senarai ahli, keluarga dan bantuan, eksport CSV serta cetakan/PDF untuk Pentadbir. Rujuk PANDUAN-TEMPATAN.md untuk panduan penggunaan dan had fungsi.

Gunakan checkout sedia ada dalam tugas cloud; jangan cipta Git worktree kecuali diminta.

## Pemasangan dalam talian

Rujuk [PANDUAN-DALAM-TALIAN.md](PANDUAN-DALAM-TALIAN.md) untuk pakej VPS/Docker Compose dengan Caddy HTTPS, volume SQLite kekal, penciptaan pentadbir pertama, pemindahan data tempatan dan sandaran penuh berjadual. Ini memerlukan VPS serta domain sebenar; menerbitkan persekitaran pembangunan sahaja tidak menerbitkan laman web awam.

Mod production memerlukan `PUBLIC_ORIGIN=https://domain-anda` dan `COOKIE_SECURE=1`. `TRUST_PROXY=1` hanya digunakan apabila app di belakang proxy yang dipercayai dan port app tidak boleh dicapai terus oleh orang awam. Penggunaan tempatan melalui Node.js standalone kekal tersedia seperti panduan terdahulu.

## Portal ahli dan kelulusan perubahan

Pemohon menetapkan ID pengguna dan kata laluan semasa pendaftaran `/daftar`; akaun hanya boleh digunakan selepas kelulusan Pentadbir. Ahli hanya dapat melihat profil, keluarga dan sejarah bantuan isi rumah sendiri. Profil dikunci secara lalai; butang Kemaskini membuka borang dan Hantar untuk kelulusan. Setiap penambahan, perubahan atau pemadaman keluarga daripada portal dihantar sebagai permohonan. Ahli juga boleh menambah/mengemaskini maklumat bantuan isi rumah sendiri melalui kelulusan Pentadbir. Rekod rasmi kekal sehingga Pentadbir meluluskan melalui **Semakan perubahan**; penolakan memerlukan sebab. Petugas tidak boleh meluluskan permohonan ahli.

**Aktiviti & hebahan** menyediakan pengumuman dan kalendar waktu Malaysia. Pentadbir/Petugas mengurus siaran; Ahli hanya melihat siaran diterbitkan. **Pertanyaan** membolehkan komunikasi peribadi ahli dengan Pentadbir/Petugas. **Notifikasi** memaklumkan siaran, keputusan semakan dan balasan dalam aplikasi (tiada e-mel/SMS/push).

Sandaran JSON versi 8 mengandungi rekod ahli, bantuan, permohonan pendaftaran serta hebahan/aktiviti dan katalog zon/jenis rumah. Akaun, kata laluan, permohonan perubahan profil/bantuan, pertanyaan, mesej, notifikasi dan audit memerlukan **sandaran penuh SQLite/folder data**. Untuk memindahkan pemasangan lengkap, gunakan sandaran penuh. Rujuk panduan tempatan untuk pemautan semula akaun dan cara menguji portal tanpa penerbitan dalam talian.

## Papan pemuka

Paparan pertama selepas log masuk merangkum permohonan menunggu semakan (Pentadbir), permohonan/keputusan isi rumah sendiri (Ahli), notifikasi belum dibaca, pertanyaan terbuka, aktiviti akan datang/berlangsung dan hebahan diterbitkan. Kad menyediakan pautan terus kepada tindakan yang dibenarkan mengikut peranan. Tekan Muat semula ringkasan untuk mendapatkan jumlah terkini.

## Sandaran penuh dari aplikasi

Pentadbir boleh memuat turun sandaran SQLite lengkap melalui **Papan pemuka → Sandaran penuh sistem**, dengan pengesahan kata laluan semasa. Berbeza daripada JSON, fail ini merangkumi akaun, mesej dan semua jadual portal. Sandaran berjadual tidak diaktifkan secara automatik.

Pemulihan penuh dibuat ke folder baharu yang belum wujud menggunakan `node scripts/restore-full.js --source fail.sqlite --destination folder-baharu`, kemudian aplikasi dimulakan dengan `DATA_DIR` merujuk folder itu. Skrip mengekalkan sumber serta data asal dan menyemak integriti serta kewujudan pentadbir aktif. Rujuk panduan tempatan untuk contoh Windows/Node.js standalone dan latihan pemulihan.

## Fasa pertama profil dan isi rumah

Profil ahli/keluarga menyokong nombor pengenalan, nama panggilan, e-mel, perkahwinan, pendapatan serta OKU. Isi rumah mempunyai zon, jenis rumah, nombor rujukan dan koordinat. Pentadbir mengurus katalog melalui **Zon & jenis rumah**. Medan baharu turut melalui semakan pentadbir untuk perubahan Ahli, laporan/CSV dan sandaran versi 7. Migrasi mengekalkan rekod lama; [STRUKTUR-DATA.md](STRUKTUR-DATA.md) menerangkan jadual bermakna dan keserasian API sedia ada.

Ahli keluarga mempunyai pilihan tinggal bersama ahli utama atau alamat berasingan. Jika tidak tinggal bersama, Alamat 1 dan negara wajib; status/alamat turut melalui kelulusan portal, laporan keluarga serta sandaran JSON versi 7. Rekod lama kekal belum diisi sehingga disemak.

## Pertukaran ketua isi rumah

Menu **Pertukaran ketua** membolehkan ahli memohon untuk isi rumah sendiri serta pentadbir/petugas menyediakan permohonan. Hanya pentadbir meluluskan dengan kata laluan semasa. Calon mesti ahli keluarga rasmi yang tinggal bersama; hubungan keluarga perlu disemak semula. Akaun ketua lama dinyahaktif dan diputuskan pautan selepas kelulusan; pentadbir menyediakan akaun berasingan untuk ketua baharu. Rekod bantuan sejarah dikekalkan.

Sandaran JSON terkini ialah **versi 8**, termasuk identiti stabil individu/isi rumah. Permohonan dan sejarah pertukaran memerlukan **sandaran penuh SQLite**. Rujuk manual pengguna serta panduan naik taraf tempatan sebelum menggunakan fungsi ini.

## Rekod kematian

Menu **Rekod kematian** menyediakan permohonan bagi ahli utama/keluarga, semakan pentadbir, keputusan dan sejarah. Kelulusan memerlukan pengesahan serta kata laluan pentadbir semasa, menyekat akses akaun portal individu dan mengekalkan profil/bantuan. Pengganti ketua diurus berasingan melalui Pertukaran ketua. Rekod kematian memerlukan **sandaran penuh SQLite**; JSON versi 8 tidak mengeksportnya. Pembetulan kelulusan kematian belum disediakan. Khairat diurus melalui menu berasingan. Rujuk manual sebelum meluluskan rekod rasmi.

## Khairat kematian

Tuntutan berdasarkan kematian diluluskan, maklumat waris, kelulusan/penolakan pentadbir dan rekod satu bayaran penuh disediakan melalui **Khairat kematian**. Tuntutan baharu memilih jenis khairat dan kadar daripada katalog pentadbir serta melampirkan sijil kematian. Rekod lama tanpa jenis mengekalkan jumlah manual. Status diluluskan dan dibayar diasingkan. Fungsi bayaran merekodkan transaksi di luar sistem; aplikasi tidak memindahkan wang. Khairat diasingkan daripada bantuan biasa dan memerlukan **sandaran penuh SQLite**. Ansuran, pembatalan/suntingan bayaran dan baki tabung belum disediakan. Rujuk manual untuk langkah dan batasan.

## Tetapan pentadbir dan sijil kematian

**Khairat kematian → Urus jenis & kadar khairat** menyediakan katalog untuk Pentadbir. **Tetapan sistem** mengurus akses modul Ahli dan Petugas. Sijil kematian wajib bagi tuntutan baharu (PDF/JPG/PNG sehingga 5 MB), disimpan dalam SQLite dan dimuat turun hanya selepas semakan akses. Tuntutan mengekalkan kadar asal walaupun katalog berubah. Tuntutan lama menunggu boleh ditambah sijil sebelum kelulusan. Ambil sandaran penuh SQLite untuk memindahkan lampiran, katalog dan tetapan; JSON versi 8 tidak mengandunginya. Rujuk manual dan panduan naik taraf sebelum digunakan.

Akses modul boleh ditetapkan berasingan untuk peranan **Ahli** dan **Petugas** melalui Tetapan sistem. Pilih peranan sebelum menyimpan. Sekatan berkuat kuasa pada API serta menu selepas muat semula. Pentadbir mengekalkan akses penuh; pilihan modul tidak memberi kuasa kelulusan pentadbir kepada Petugas. Tetapan kedua-dua peranan memerlukan sandaran penuh SQLite.

Menu utama kini dikumpulkan kepada Umum, Komuniti & Kebajikan, Permohonan & Kelulusan, Maklumat & Komunikasi serta Pentadbiran. Kumpulan boleh dikembangkan/diringkaskan dan kumpulan kosong disembunyikan mengikut akses pengguna. Rujuk manual pengguna untuk susunan menu.


## Sejarah ahli, pembentangan dan pelancaran domain

- [Sejarah perubahan ahli dan keluarga](PANDUAN-SEJARAH-AHLI.md)
- [Persediaan pembentangan dan ujian penerimaan pengguna](PANDUAN-PEMBENTANGAN.md)
- [Pelancaran domain dan semakan keserasian cPanel](PANDUAN-PELANCARAN-DOMAIN.md)

Runtime projek memerlukan Node.js 24+. cPanel yang hanya menawarkan Node.js 20.20.2 belum serasi; semak kemungkinan runtime berbeza melalui Application Manager dengan penyedia sebelum memasang.

- [Laporan kualiti data ahli dan semakan potensi pendua](PANDUAN-KUALITI-DATA.md)

## Pemantauan sandaran

Pentadbir boleh membuka **Pentadbiran → Status sandaran** untuk menyemak keputusan proses sandaran pelayan, fail terakhir dan amaran sandaran lewat/gagal. Paparan juga tersedia pada papan pemuka. Muat turun ke laptop direkodkan berasingan dan tidak mengaktifkan jadual automatik. Rujuk [PANDUAN-STATUS-SANDARAN.md](PANDUAN-STATUS-SANDARAN.md) untuk ujian laptop, konfigurasi Docker/cPanel dan batasan semakan. 2FA boleh kekal tidak aktif.

## Permit kubur pada rekod kematian

Rekod kematian menyokong lampiran **permit kubur** berasingan daripada sijil kematian (PDF/JPG/PNG, maksimum 5 MB setiap fail). Muat naik ketika menghantar rekod atau tambah kemudian pada rekod menunggu/diluluskan yang belum mempunyai permit. Muat turun mengikut akses modul dan isi rumah; lampiran disertakan dalam sandaran penuh SQLite. Rujuk [MANUAL-PENGGUNA.md](MANUAL-PENGGUNA.md) untuk langkah penggunaan dan had hosting bagi dua lampiran serentak.
