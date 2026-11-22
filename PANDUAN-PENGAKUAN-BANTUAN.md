# Pengakuan penerimaan bantuan

Rekod bantuan sedia ada bermaksud bantuan telah diterima. Fungsi ini menambah pengakuan dan bukti penerimaan; label **Belum ada pengakuan** tidak bermaksud bantuan belum diserahkan. Ia juga tidak meluluskan permohonan bantuan baharu atau memindahkan wang.

## Pengguna dan langkah

- **Pentadbir/Petugas:** buka Bantuan atau rekod bantuan dalam maklumat ahli, kemudian pilih butang status pengakuan pada rekod berkenaan. Akses modul Bantuan diperlukan bagi Petugas.
- **Ahli:** buka Profil saya → Bantuan diterima isi rumah saya, kemudian pilih butang status pengakuan. Akses profil diperlukan dan hanya bantuan dalam isi rumah sendiri boleh dilihat/diakui.

1. Semak bantuan, penerima dalam rekod asal, pemberi, tarikh diterima serta nilai/kuantiti yang dipaparkan.
2. Isi **nama orang yang menerima bantuan**, termasuk wakil jika berkenaan. Nama ini berasingan daripada akaun yang sedang log masuk dan tidak diisi secara andaian.
3. Isi **tarikh pengakuan penerimaan**. Tarikh mesti sah, tidak mendahului tarikh bantuan diterima dan tidak pada masa hadapan. Tarikh bantuan diterima dalam rekod asal dikekalkan.
4. Lampirkan bukti PDF/JPG/PNG sehingga 5 MB. **Wajib apabila Pentadbir atau Petugas merekod bagi pihak penerima.** Bagi Ahli, pengakuan melalui akaun sendiri boleh dibuat tanpa lampiran; bukti boleh ditambah kemudian.
5. Isi catatan jika perlu, tandakan pengesahan dan pilih **Simpan pengakuan penerimaan**.

Paparan membezakan **Pengakuan melalui akaun Ahli** daripada **Direkodkan pegawai bagi pihak penerima**. Nama akaun merekod dan masa disimpan turut dipaparkan. Pengakuan akaun tidak dianggap pengesahan identiti orang yang memegang akaun atau tandatangan digital.

## Status dan sejarah

- **Belum ada pengakuan:** tiada pengakuan untuk isi rumah semasa pada rekod ini.
- **Pengakuan direkodkan:** pengakuan sepadan dengan versi bantuan semasa.
- **Bantuan berubah · Perlu pengakuan baharu:** butiran bantuan telah dikemas kini selepas pengakuan. Semak perubahan dan rekodkan pengakuan baharu; pengakuan, butiran bantuan asal dan bukti terdahulu dikekalkan.

Sejarah memaparkan nama penerima, tarikh pengakuan, akaun merekod, catatan serta butiran bantuan ketika pengakuan dibuat. Maksimum 50 pengakuan terkini dipaparkan, bersama jumlah sejarah jika lebih banyak. Butiran yang telah disimpan tidak disunting melalui fungsi ini. Pengakuan berulang untuk versi bantuan yang sama ditolak.

Jika bukti belum ada pada pengakuan semasa, gunakan **Tambah bukti penerimaan**. Lampiran sedia ada tidak boleh ditindih. Bukti tidak boleh ditambah pada pengakuan yang telah menjadi versi terdahulu; pengakuan baharu diperlukan untuk bantuan yang telah berubah. Bukti lama kekal boleh dimuat turun oleh pengguna yang dibenarkan.

## Kawalan akses dan audit

Nama orang yang menerima bantuan direkodkan berasingan daripada nama penerima sasaran pada rekod bantuan (ahli/keluarga/isi rumah). Memilih pengakuan tidak mengubah penerima sasaran, nilai bantuan, tarikh diterima atau maklumat profil.

Akses diperiksa pada pelayan, termasuk selepas muat naik. Ahli tidak boleh membuka rekod/bukti isi rumah lain. Jika bantuan dipindahkan kepada isi rumah lain, pengakuan isi rumah asal tidak ditunjukkan kepada Ahli dalam isi rumah baharu; Pentadbir/Petugas dengan akses Bantuan masih boleh menyemak sejarah. Log keluar membersihkan maklumat pengakuan daripada paparan.

Tindakan merekod pengakuan, menambah bukti, melihat pengakuan dan memuat turun bukti direkodkan dalam sejarah tindakan. Bukti disimpan dalam SQLite dan tidak mempunyai pautan fail awam. Had fail dan kandungan PDF/JPG/PNG disemak seperti lampiran sedia ada.

## Sandaran dan naik taraf

Ambil sandaran penuh SQLite sebelum menaik taraf, kekalkan direktori/volume data dan mulakan semula aplikasi. Jadual pengakuan dicipta automatik; rekod bantuan lama kekal tanpa pengakuan sehingga direkodkan. Fungsi ini tidak memerlukan pengaktifan 2FA.

**Gunakan sandaran/pemulihan penuh SQLite untuk pengakuan dan bukti.** Eksport JSON ahli/bantuan tidak mengandunginya. Apabila sejarah pengakuan sudah wujud, pemulihan JSON disekat supaya bukti tidak hilang atau terikat kepada rekod gantian yang salah. Pemadaman rekod bantuan yang mempunyai sejarah pengakuan turut disekat; rekod dikekalkan untuk semakan. Mengemas kini bantuan masih dibenarkan dan menyebabkan pengakuan baharu diperlukan.

Pengakuan membuktikan apa yang direkodkan dalam sistem. Pegawai tetap perlu menyemak dokumen dan proses penyerahan sebenar sebelum menggunakannya bagi urusan komuniti.

## Penapis dan laporan tindakan susulan

Dalam **Bantuan**, Pentadbir atau Petugas yang mempunyai akses modul boleh menapis **Status pengakuan** kepada Semua, Belum ada pengakuan, Pengakuan direkodkan atau Perlu pengakuan baharu. Penapis digabungkan dengan isi rumah, carian dan tarikh bantuan diterima. Bilangan rekod, isi rumah serta jumlah nilai pada paparan mengikut penapis yang dipilih.

Penapis **Bukti pengakuan semasa** menyediakan Semua, Ada lampiran dan Belum dilampirkan. Pilihan Ada/Belum dilampirkan hanya menilai pengakuan yang sepadan dengan versi bantuan semasa. Rekod yang belum mempunyai pengakuan atau sudah memerlukan pengakuan baharu tidak dianggap pengakuan semasa tanpa bukti. Bukti lama kekal dalam sejarah dan boleh disemak melalui butang pengakuan pada rekod bantuan.

Pentadbir membuka **Laporan → Pengakuan penerimaan bantuan** untuk menjana senarai tindakan susulan mengikut status pengakuan, bukti, status aktif isi rumah, negeri, daerah, zon, kategori dan tarikh bantuan diterima. Tarikh penapis merujuk kepada **tarikh bantuan diterima**, bukan tarikh pengakuan. Laporan tidak memberikan Petugas akses eksport; laporan/CSV kekal khusus Pentadbir dan diaudit.

Laporan memaparkan bantuan/penerima sasaran serta status pengakuan. Nama orang yang menerima, tarikh pengakuan, akaun merekod dan nama bukti hanya dipaparkan pada lajur pengakuan semasa apabila pengakuan masih sepadan dengan butiran bantuan. Jika bantuan sudah berubah, lajur itu dikosongkan dan tindakan mendapatkan pengakuan baharu ditunjukkan. Ini mengelakkan bukti lama kelihatan seperti mengesahkan butiran baharu. Tiada fail bukti, kandungan dokumen atau snapshot penuh dimasukkan dalam CSV.

Ringkasan mengira bilangan setiap status dan pengakuan semasa tanpa bukti **selepas penapis digunakan**. Satu bantuan ialah satu baris, tanpa menggandakan jumlah nilai akibat beberapa pengakuan dalam sejarah. Gunakan **Cetak / Simpan PDF** atau **Muat turun CSV**. Paparan/cetakan terhad kepada 500 baris; CSV membawa semua rekod sepadan. Laporan menunjukkan masa dijana dalam waktu Malaysia.

Jika bantuan, pengakuan atau bukti yang mempengaruhi hasil berubah sejak pratonton, eksport dalam aplikasi ditolak dengan arahan **Jana laporan semula**. Jana semula untuk menyemak hasil terkini sebelum mengeksport. Laporan ini ialah gambaran semasa untuk tindakan susulan; ia tidak mengesahkan penyerahan baharu atau menukar keputusan bantuan. Fail CSV/PDF mengandungi maklumat penerima dan perlu disimpan mengikut kawalan akses komuniti.
