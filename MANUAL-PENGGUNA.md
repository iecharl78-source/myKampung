# Manual pengguna myKampung

Manual ini meliputi fungsi semasa untuk Pentadbir, Petugas dan Ahli. Untuk memasang dan membuka aplikasi pada komputer sendiri, mulakan dengan [Panduan rakan — pemasangan tempatan](PANDUAN-RAKAN-LOCAL.md). Panduan teknikal dan pemulihan data tersedia dalam [PANDUAN-TEMPATAN.md](PANDUAN-TEMPATAN.md).

## 1. Peranan dan akses

| Fungsi | Pentadbir | Petugas | Ahli |
| --- | --- | --- | --- |
| Papan pemuka | Ringkasan komuniti dan semakan | Ringkasan komuniti dan pertanyaan | Ringkasan isi rumah serta permohonan sendiri |
| Rekod ahli/keluarga | Urus semua rekod | Urus semua rekod | Lihat sendiri; cadangkan perubahan untuk kelulusan |
| Daftar ahli terus melalui direktori | Ya | Ya | Melalui borang pendaftaran penduduk |
| Lulus pendaftaran/perubahan profil/maklumat bantuan | Ya | Tidak | Tidak |
| Rekod bantuan diterima | Urus rekod komuniti | Urus rekod komuniti | Tambah/ubah isi rumah sendiri untuk kelulusan |
| Aktiviti dan hebahan | Cipta, sunting, siar/nyahsiar | Cipta, sunting, siar/nyahsiar | Lihat siaran diterbitkan |
| Pertanyaan | Lihat/balas semua, urus status | Lihat/balas semua, urus status | Hantar/lihat/balas pertanyaan sendiri |
| Notifikasi | Milik sendiri | Milik sendiri | Milik sendiri |
| Akaun pengguna, laporan, audit dan sandaran | Ya | Tidak | Tidak |
| Padam rekod ahli utama/bantuan rasmi | Ya, dengan pengesahan | Tidak | Tidak |
| Tukar kata laluan sendiri | Ya | Ya | Ya |

Ahli keluarga ialah tanggungan dalam profil ahli utama. Mereka tidak mendapat akaun berasingan secara automatik. Penyuntingan terus melalui direktori oleh Pentadbir/Petugas menggunakan aliran pengurusan sedia ada; cadangan daripada portal Ahli memerlukan kelulusan Pentadbir.

## 2. Log masuk, kata laluan dan log keluar

Buka alamat aplikasi yang diberikan. Pada pemasangan tempatan lalai, alamatnya `http://127.0.0.1:3000` pada komputer pelayan sendiri.

1. Masukkan ID/nama pengguna dan kata laluan. Pentadbir pemasangan baharu menggunakan ID `admin` dengan kata laluan ciptaan sendiri.
2. **Tunjuk kata laluan** membantu menyemak taipan sebelum log masuk.
3. **Tukar kata laluan** memerlukan kata laluan semasa, kata laluan baharu dan pengesahan. Cadangan kata laluan serta penunjuk Weak/Medium/Strong/Strongest disediakan; panjang minimum ialah 12 aksara.
4. Selepas pertukaran berjaya, log masuk semula menggunakan kata laluan baharu.
5. **Log keluar** membuka pengesahan. **Batal** mengekalkan sesi; pengesahan keluar memaparkan **Sedang log keluar…** sehingga selesai.

Sesi tamat selepas 8 jam atau apabila pelayan dimulakan semula. Jika terlupa kata laluan, hubungi pentadbir untuk tetapan semula akaun lain. Tiada pemulihan automatik melalui e-mel. Menukar ADMIN_PASSWORD pada terminal tidak menukar kata laluan akaun sedia ada.

## 3. Papan pemuka

Papan pemuka ialah paparan pertama selepas log masuk. Tekan kad ringkasan untuk membuka bahagian berkaitan.

- **Pentadbir:** pendaftaran, perubahan profil dan maklumat bantuan yang menunggu semakan; jumlah ahli/keluarga serta pautan sandaran penuh.
- **Petugas:** ringkasan komuniti dan pertanyaan yang boleh diurus, tanpa kad kelulusan pentadbir.
- **Ahli:** permohonan sendiri yang menunggu semakan, jumlah keputusan, lima keputusan terkini, keluarga serta bantuan rasmi sendiri.
- **Semua peranan:** notifikasi sendiri yang belum dibaca, pertanyaan terbuka mengikut akses, lima aktiviti akan datang/berlangsung dan tiga hebahan diterbitkan terkini.

Tekan **Muat semula ringkasan** untuk jumlah terkini. Masa kemas kini dipaparkan dalam waktu Malaysia.

## 4. Daftar sendiri sebagai penduduk

1. Pada skrin log masuk, pilih **Daftar sebagai penduduk / Semak permohonan**, atau buka `/daftar` pada alamat aplikasi.
2. Tetapkan ID pengguna 3–40 aksara dan kata laluan minimum 12 aksara. Isi pengesahan kata laluan.
3. Lengkapkan maklumat diri, alamat dan status pekerjaan. Maklumat pendidikan/majikan serta keluarga diisi mengikut keadaan. Pelajar memerlukan tahap pendidikan; universiti memerlukan tahap pengajian.
4. Sahkan persetujuan dan hantar permohonan.
5. Simpan kod rujukan **MK-…** secara peribadi. Gunakan kod itu untuk menyemak status dan catatan pentadbir.
6. Akaun belum boleh digunakan sehingga pentadbir meluluskan pendaftaran. Selepas diluluskan, log masuk di halaman utama menggunakan ID/kata laluan yang telah dipilih.

Jika ditolak, baca catatan dan hantar permohonan baharu yang dibetulkan. Jika kod rujukan atau kata laluan hilang, hubungi pentadbir. Akaun ahli tidak aktif atau ahli yang sudah dinyahaktifkan tidak boleh mengakses portal.

## 5. Pentadbir/Petugas: rekod ahli dan keluarga

Buka **Ahli & isi rumah → Daftar ahli**, atau **Lihat / edit** pada rekod sedia ada.

- Isi nama, telefon dan tarikh lahir. Umur dikira secara automatik.
- Alamat mempunyai Alamat 1, Alamat 2, Daerah, Poskod, Negeri dan Negara. Poskod boleh dikosongkan jika belum diketahui. Negeri/daerah sahaja tidak menentukan satu poskod yang pasti; semak cadangan sebelum menggunakannya.
- Isi pekerjaan dan pendidikan. Maklumat majikan adalah pilihan; alamatnya juga menggunakan medan berasingan.
- **Tambah keluarga** untuk pasangan/anak/tanggungan. Lengkapkan hubungan, tarikh lahir jika diketahui dan status pekerjaan. Jika pelajar, pilih tahap pendidikan dan tahap pengajian universiti yang berkaitan.
- **Padam** pada baris keluarga membuangnya daripada borang; simpan perubahan untuk mengesahkan rekod rasmi.

Semak amaran rekod berganda untuk ahli dan keluarga. Sahkan sebagai rekod berasingan hanya selepas identiti disemak. Gunakan carian serta penapis Aktif/Tidak aktif/Semua untuk mencari rekod.

**Nyahaktif** digunakan apabila ahli berpindah keluar; rekod dan sejarah bantuan dikekalkan. **Aktifkan semula** digunakan apabila kembali. **Padam** ahli utama terhad kepada Pentadbir dengan pengesahan dan kata laluan. Ahli yang mempunyai rekod bantuan rasmi tidak boleh dipadam terus; gunakan Nyahaktif untuk mengekalkan sejarah.

## 6. Ahli: kemas kini profil/keluarga sendiri

1. Buka **Profil saya**. Borang dikunci secara lalai dan butang penghantaran disembunyikan.
2. Tekan **Kemaskini** untuk membuka borang. Ubah maklumat diri, alamat, pekerjaan, majikan atau keluarga.
3. **Batal kemaskini** (jingga) membuang suntingan yang belum dihantar dan memaparkan semula rekod rasmi.
4. Selepas ada perubahan, **Hantar untuk kelulusan** boleh ditekan. Baca dialog pengesahan: **OK** menghantar; **Batal** mengekalkan suntingan untuk semakan semula tanpa menghantar.
5. Selepas penghantaran berjaya, profil dikunci semula dan status permohonan dipaparkan. Rekod rasmi masih menggunakan maklumat terdahulu.
6. Semak keputusan serta catatan dalam profil, papan pemuka atau notifikasi.

Penambahan dan pemadaman keluarga juga memerlukan kelulusan. Hanya satu permohonan profil boleh menunggu semakan bagi setiap akaun. Jika ditolak, betulkan borang dan hantar semula selepas membaca sebab penolakan.

## 7. Pentadbir: semak dan luluskan

### Pendaftaran ahli baharu

Buka **Permohonan ahli**. Semak maklumat pemohon/keluarga, ID pengguna dan persetujuan. Kelulusan mewujudkan rekod ahli serta mengaktifkan akaun pemohon. Penolakan memerlukan sebab yang boleh disemak melalui kod rujukan.

### Perubahan profil/keluarga

Buka **Semakan perubahan**. Bandingkan rekod rasmi semasa dengan cadangan ahli; medan berbeza ditandakan. Luluskan jika tepat/lengkap, atau tolak dengan catatan pembetulan.

### Maklumat bantuan

Dalam **Semakan perubahan → Permohonan maklumat bantuan**, semak penerima, pemberi, tarikh dan nilai/kuantiti. Untuk kemaskini, rekod rasmi semasa turut dipaparkan.

Semua semakan ini terhad kepada Pentadbir. Amaran pendua memerlukan semakan sebelum pengesahan tambahan. Jika rekod rasmi telah berubah, dipadam atau keahlian/pautan akaun tidak lagi sesuai sejak penghantaran, kelulusan boleh dihalang. Tolak dengan sebab yang jelas dan minta ahli menghantar semula maklumat terkini. Permohonan yang sudah diproses tidak boleh diluluskan dua kali.

## 8. Jenis bantuan dan rekod bantuan diterima

**Bantuan** menyediakan katalog jenis bantuan dan senarai rekod diterima dalam sistem. Pentadbir/Petugas boleh menambah jenis, kategori, pemberi asal dan penerangan. Jenis tidak aktif kekal dalam sejarah tetapi tidak ditawarkan untuk rekod baharu.

**Melalui pentadbir/petugas:** buka profil ahli untuk menambah atau menyunting bantuan diterima. Pilih penerima ahli utama, keluarga atau isi rumah. Isi tarikh sudah diterima, pemberi dan nilai RM atau kuantiti beserta unit. Semak amaran pendua. Pemadaman bantuan rasmi terhad kepada Pentadbir.

**Melalui ahli:** dalam **Profil saya**, gunakan **Tambah maklumat bantuan** atau **Kemaskini bantuan** pada rekod sendiri. Pilih jenis daripada katalog atau isi sendiri jika belum disenaraikan. Tekan **Hantar untuk kelulusan** dan sahkan dialog. Permohonan/status dipaparkan berasingan daripada rekod rasmi sehingga diluluskan.

Ini merekodkan **bantuan yang telah diterima**, bukan permohonan untuk mendapatkan bantuan baharu. Jika maklumat keluarga baharu masih menunggu kelulusan, tunggu kelulusan sebelum memilih keluarga itu sebagai penerima rasmi.

## 9. Aktiviti dan hebahan

Pentadbir/Petugas membuka **Aktiviti & hebahan** untuk mencipta pengumuman atau aktiviti dengan tarikh/masa, lokasi dan keterangan. Pilih Draf jika belum mahu dipaparkan kepada ahli. Edit siaran untuk mengubah maklumat atau menariknya daripada paparan. Pilihan beritahu semula boleh digunakan bagi perubahan siaran sedia ada.

Ahli hanya melihat siaran diterbitkan. Pada kalendar:

- Gunakan **Bulan sebelum / Bulan selepas** atau pemilih bulan.
- Nama hari dipaparkan penuh; hari beraktiviti disorot kuning dengan tajuk hijau.
- Aktiviti berbilang hari disorot sepanjang tarikh mula hingga tamat.
- Tekan tajuk untuk melihat butiran. Tarikh hari ini dibulatkan biru.
- Pada telefon, leret kalendar mendatar untuk melihat semua hari.

Masa dipaparkan mengikut Malaysia. Papan pemuka turut menyediakan pautan terus ke aktiviti akan datang/berlangsung.

## 10. Pertanyaan dan notifikasi

**Pertanyaan:** ahli menghantar tajuk dan mesej, kemudian membaca/balas jawapan pada pertanyaan sendiri. Pentadbir/Petugas boleh melihat serta membalas semua pertanyaan dan menutup atau membuka semula statusnya. Pertanyaan tertutup tidak menerima balasan sehingga dibuka semula. Mesej tidak mengubah rekod rasmi profil/bantuan.

**Notifikasi:** lihat 100 pemberitahuan terkini dan tandakan satu atau semua sebagai dibaca. Bilangan dikemas kini ketika membuka menu dan sekitar setiap seminit apabila aplikasi aktif. Notifikasi ini berada dalam aplikasi sahaja; tiada e-mel, SMS atau pemberitahuan telefon di luar aplikasi.

## 11. Akaun pengguna dan sejarah tindakan

Pentadbir membuka **Akaun pengguna → Tambah pengguna** untuk mencipta akaun Pentadbir, Petugas atau Ahli. Bagi akaun Ahli, pautkan rekod ahli aktif yang belum mempunyai akaun. Ini juga boleh digunakan untuk ahli sedia ada yang didaftarkan terus melalui direktori.

Sampaikan kata laluan awal secara peribadi dan minta pengguna menukarnya. Pentadbir boleh menetapkan semula kata laluan akaun lain, mengaktifkan/menyahaktif akaun dan memautkan semula akaun ahli selepas semakan identiti. Tindakan akaun yang berkaitan memutuskan sesi sasaran. Jangan bergantung pada nombor ID rekod sahaja untuk mengesahkan identiti.

**Sejarah tindakan** memaparkan rekod tindakan sistem yang diaudit. Jangan padam data untuk menyelesaikan masalah akaun; gunakan fungsi pengurusan akaun yang tersedia.

## 12. Laporan

Pentadbir membuka **Laporan** untuk laporan ahli, keluarga dan bantuan. Pilih penapis, kemudian tekan **Jana laporan**. Paparan/cetakan terhad kepada 500 rekod pertama; eksport CSV merangkumi semua hasil sepadan.

**Cetak / Simpan PDF** menggunakan dialog cetak pelayar. Untuk mengekalkan sifar awal telefon/poskod dalam Excel, import CSV dan tetapkan lajur itu sebagai Text. CSV ialah laporan, bukan fail sandaran yang boleh dipulihkan. Menukar penapis memerlukan laporan dijana semula sebelum eksport/cetakan.

## 13. Sandaran dan pemulihan

| Pilihan | Kandungan / cara guna |
| --- | --- |
| **Papan pemuka → Sandaran penuh sistem** | Fail SQLite lengkap: rekod, akaun, permohonan, mesej, notifikasi dan audit. Pentadbir mengesahkan kata laluan. Gunakan untuk pemindahan/pemulihan sistem lengkap. |
| **Ahli & isi rumah → Sandaran rekod JSON** | Rekod ahli/keluarga, bantuan rasmi, katalog bantuan, permohonan pendaftaran serta hebahan/aktiviti. Tidak merangkumi semua jadual portal atau akaun. |
| **Pulihkan data** | Memulihkan JSON melalui pratonton dan pengesahan. Ia menggantikan rekod komuniti dalam pemasangan semasa, bukan keseluruhan sistem. |

Simpan sandaran penuh yang selesai dimuat turun pada pemacu lain. Sandaran manual tidak mengaktifkan jadual sandaran automatik. Panduan [pemulihan penuh ke folder baharu](PANDUAN-TEMPATAN.md#sandaran-penuh-dan-latihan-pemulihan-tempatan) menerangkan penggunaan skrip dan DATA_DIR; hentikan pelayan sebelum bertukar pemasangan dan kekalkan data asal.

## 14. Semasa borang sedang diproses

Apabila **Sedang menyimpan…**, **Sedang menghantar…** atau mesej proses lain dipaparkan, tunggu sehingga selesai. Medan, butang dan navigasi dikunci untuk mengelakkan penghantaran berulang. Jika ralat dipaparkan, baca sebab dan cuba semula selepas membetulkan maklumat. Bezakan penghantaran berjaya daripada kelulusan pentadbir: status menunggu semakan belum mengubah rekod rasmi.

Jika tidak boleh membuka sistem tempatan, pastikan pelayan Node.js masih berjalan pada komputer yang sama. Gunakan [jadual penyelesaian masalah pemasangan](PANDUAN-RAKAN-LOCAL.md#10-penyelesaian-masalah-ringkas) sebelum mengubah data.
