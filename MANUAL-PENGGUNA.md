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
| Katalog zon dan jenis rumah | Urus | Pilih pada profil | Pilih pada profil sendiri |
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

Buka **Ahli & isi rumah → Daftar ahli**, atau ikon pensel **Lihat / edit** pada rekod sedia ada. Tindakan direktori menggunakan ikon: pensel biru untuk lihat/edit, bulatan bergaris kuning untuk nyahaktif, tanda semak hijau untuk aktifkan semula, dan tong sampah merah untuk padam. Tuding ikon untuk keterangannya; label tindakan turut tersedia kepada pembaca skrin.

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

## 15. Fasa pertama: pengenalan, kebajikan, rumah dan zon

Pentadbir membuka **Zon & jenis rumah** untuk mencipta katalog komuniti. Pilih kategori, isi kod unik (contoh `ZON_A` atau `TERES`), nama dan status. Kod menggunakan huruf besar/nombor/garis bawah/sengkang. Nama/status boleh dikemas kini; kod kekal selepas dicipta. Nyahaktif pilihan yang tidak digunakan. Katalog bermula kosong supaya pentadbir boleh menggunakan zon dan jenis rumah sebenar komuniti, tanpa data contoh dimasukkan secara automatik.

Borang ahli utama dan pendaftaran penduduk mempunyai **Maklumat pengenalan & kebajikan** dan **Maklumat rumah & zon**, sebelum bahagian pekerjaan/majikan. Medan tambahan adalah pilihan supaya rekod lama boleh dilengkapkan secara berperingkat:

- No. pengenalan MyKad/pasport, nama panggilan, e-mel dan status perkahwinan. Nombor pengenalan disimpan sebagai teks supaya sifar awal kekal; ruang/sengkang dibuang dan huruf dijadikan huruf besar.
- Pendapatan bulanan: kosong untuk belum diketahui, `0` jika tiada pendapatan. Nilai RM menerima maksimum dua tempat perpuluhan dan tidak menerima nilai negatif.
- Status OKU: pilih Ya untuk memaparkan nombor kad, manfaat/bantuan dan nilai bantuan bulanan. Jika status bukan Ya, butiran berkaitan dikosongkan.
- Zon, jenis rumah dan nombor rujukan rumah/peta. Pilihan katalog tidak aktif dikekalkan pada rekod lama tetapi tidak ditawarkan sebagai pilihan baharu dalam borang.
- Latitud dan longitud mesti diisi bersama-sama atau dikosongkan kedua-duanya. Julat latitud −90 hingga 90 dan longitud −180 hingga 180. Koordinat tidak ditentukan secara automatik daripada alamat.

Ahli keluarga turut mempunyai medan pengenalan, nama panggilan, e-mel, status perkahwinan, pendapatan dan OKU masing-masing. Rumah/zon merujuk isi rumah ahli utama. Semakan rekod berganda kini turut membandingkan nombor pengenalan, termasuk nama berbeza dan padanan ahli utama dengan ahli keluarga. Semak identiti sebelum menggunakan pengesahan rekod berasingan.

Ahli menggunakan **Profil saya → Kemaskini → Hantar untuk kelulusan** seperti biasa. Pentadbir dapat membandingkan medan baharu dengan rekod rasmi sebelum meluluskan. Perubahan keluarga, rumah atau pendapatan daripada portal tidak terus menggantikan rekod rasmi.

Laporan ahli/keluarga dan CSV menyertakan medan tambahan; laporan ahli juga mengandungi kod zon/jenis rumah, rujukan rumah dan koordinat. Penapis **Kod zon** menggunakan kod tepat dan boleh digunakan untuk laporan ahli, keluarga atau bantuan berdasarkan isi rumah. Import nombor pengenalan sebagai Text dalam Excel untuk mengekalkan sifar awal.

## 16. Butang ikon dan carian yang lebih mudah

Semua butang tindakan kini mempunyai ikon. Tindakan berulang dalam senarai (lihat/semak, sunting, nyahaktif, pautkan ahli dan tetap semula kata laluan) menggunakan butang ikon ringkas dengan keterangan apabila dituding serta label pembaca skrin. Tindakan penting seperti Simpan, Hantar dan Luluskan menggunakan ikon bersama teks supaya tujuan tindakan jelas. Label proses dan ikon dikemas kini semasa borang sedang diproses; pengesahan dan kunci borang dikekalkan.

**Semakan perubahan** memaparkan permohonan Menunggu semakan secara lalai, dengan jumlah profil/bantuan menunggu dan lencana status. Pilih **Semua status**, **Diluluskan** atau **Ditolak** untuk melihat sejarah; gunakan carian nama/ID permohonan atau nama bantuan untuk mengecilkan senarai. Kad disusun lebih padat pada komputer dan menyesuaikan diri pada telefon.

**Akaun pengguna** mempunyai carian nama/ID pengguna serta penapis peranan dan status, dengan bilangan hasil. Rekod ahli turut menunjukkan pautan ID ahli. Tekan bahagian **Tambah pengguna** untuk membuka borang penciptaan akaun; borang ditutup semula selepas akaun berjaya dicipta. Tajuk di bahagian atas kini mengikut halaman yang sedang dibuka.

## 17. Kediaman ahli keluarga

Setiap baris keluarga mempunyai pilihan **Tinggal bersama ahli utama?**:

- **Ya:** alamat kediaman merujuk alamat ahli utama. Alamat berasingan tidak perlu diisi dan butirannya dikosongkan jika pilihan ditukar kepada Ya. Apabila alamat ahli utama berubah, laporan keluarga merujuk alamat utama terkini.
- **Tidak:** isi Alamat keluarga 1, Alamat keluarga 2, Daerah, Poskod, Negeri dan Negara. Alamat 1 serta negara wajib. Poskod Malaysia menerima 5 digit jika diisi, tetapi boleh dikosongkan jika belum diketahui. Negeri boleh dipilih atau ditaip, termasuk negeri/provinsi luar Malaysia.

Pilihan ini tersedia dalam pendaftaran penduduk, borang pentadbir/petugas dan portal ahli. Borang meminta pilihan Ya/Tidak sebelum menyimpan keluarga. Rekod lama kekal **belum diisi** sehingga disemak; sistem tidak menganggap keluarga lama tinggal bersama.

Perubahan oleh ahli memerlukan pengesahan penghantaran dan kelulusan pentadbir, termasuk pertukaran status kediaman atau alamat keluarga. Pentadbir boleh melihat butiran dalam semakan perubahan dan semakan pendaftaran. Laporan keluarga/CSV mempunyai status tinggal bersama, medan alamat berasingan dan alamat kediaman yang digunakan. Bilangan keluarga masih merujuk semua rekod keluarga yang dipautkan, bukan jumlah orang yang tinggal serumah sahaja.

## Pertukaran ketua isi rumah

1. Buka **Pertukaran ketua**. Ahli hanya melihat isi rumah sendiri; pentadbir/petugas boleh memilih ahli. Gunakan penapis status dan carian untuk menyemak sejarah.
2. Lengkapkan maklumat calon melalui profil dahulu jika perlu. Calon mesti ahli keluarga rasmi dengan status **tinggal bersama: Ya** dan status pekerjaan diisi. Perubahan profil itu perlu diluluskan sebelum memohon pertukaran.
3. Tekan **Permohonan baharu**, pilih calon, isi nombor telefon ketua baharu, tarikh berkuat kuasa dan sebab. Tarikh masa hadapan tidak diterima; sistem tidak menjadualkan pertukaran automatik.
4. Tentukan sama ada ketua lama masih tinggal bersama. Jika Tidak, isi alamat berasingan. Semak hubungan setiap ahli keluarga terhadap ketua baharu, termasuk ketua lama. Sahkan penghantaran. Rekod rasmi kekal sehingga diluluskan.
5. Pentadbir membuka permohonan untuk menyemak cadangan dan profil asal. Untuk meluluskan, tandakan pengesahan kesan akaun dan masukkan kata laluan pentadbir semasa. Untuk menolak, isi sebab penolakan. Petugas dan ahli tidak boleh meluluskan. Jika rekod asal telah berubah, tolak permohonan lapuk dan hantar semula selepas semakan.

Permohonan pertukaran tidak boleh bertindih dengan permohonan profil/bantuan yang masih menunggu untuk isi rumah sama. Selesaikan permohonan itu dahulu. Semasa pertukaran menunggu, ahli tidak boleh menghantar perubahan profil atau bantuan baharu.

Selepas kelulusan, ketua lama berada dalam senarai keluarga. Alamat dan identiti isi rumah dikekalkan. Nombor telefon ketua baharu dimasukkan sendiri; maklumat majikan ketua lama tidak diwariskan kepada calon. Maklumat yang tidak tersedia dalam borang keluarga, seperti majikan ketua lama, kekal dalam salinan profil asal yang boleh dirujuk pentadbir melalui sejarah permohonan. Lengkapkan maklumat pekerjaan ketua baharu selepas pertukaran jika diperlukan.

**Akaun ketua lama dinyahaktif, pautan ahli dikosongkan dan sesi ditamatkan.** Akaun itu tidak menjadi akaun ketua baharu. Pentadbir perlu membuka **Akaun pengguna** untuk mencipta akaun berasingan atau memautkan akaun milik individu ketua baharu selepas mengesahkan identiti.

Bantuan terdahulu kekal dengan nama/tarikh lahir penerima asal. Nama isi rumah yang dipaparkan boleh mengikut ketua semasa. Gunakan sandaran penuh untuk menyimpan semua permohonan, sejarah pertukaran serta akaun. Rekod kematian tersedia melalui menu berasingan. Tuntutan khairat diurus melalui menu Khairat kematian.

## Lokasi rumah di Google Maps

Isi Latitud dan Longitud dalam Maklumat rumah & zon, contohnya `2.9492` dan `101.6785`. Apabila kedua-duanya sah, butang **Lihat di Google Maps** dipaparkan dan membuka lokasi dalam tab baharu. Simpan maklumat (atau hantar untuk kelulusan bagi ahli) untuk mengekalkan koordinat. Butang juga membolehkan semakan lokasi sebelum menyimpan. Pautan menghantar koordinat kepada Google Maps apabila ditekan dan memerlukan internet; tiada API key diperlukan. Koordinat ini merujuk rumah ahli, bukan rekod katalog zon/jenis rumah.

Dalam **Direktori ahli**, butang **Lihat di Google Maps** turut dipaparkan di bawah alamat apabila rekod mempunyai kedua-dua koordinat yang sah. Tekan untuk membuka lokasi tanpa membuka borang ahli.

## Rekod kematian

1. Buka **Rekod kematian**. Ahli hanya boleh menghantar dan melihat rekod isi rumah sendiri. Pentadbir/petugas memilih isi rumah daripada senarai.
2. Tekan **Tambah rekod kematian**. Pilih ahli utama atau ahli keluarga, isi tarikh kematian serta catatan/sumber maklumat untuk semakan. Tarikh tidak boleh mendahului tarikh lahir atau berada pada masa hadapan.
3. Tandakan pengesahan dan sahkan penghantaran. Rekod berstatus **Menunggu semakan** belum mengubah status rasmi atau akses akaun. Individu dengan permohonan menunggu atau kematian diluluskan tidak boleh dihantar sekali lagi.
4. Pentadbir membuka **Lihat / semak**. Untuk meluluskan, semak identiti, tarikh dan sumber maklumat, tandakan pengesahan kesan kepada akaun serta masukkan kata laluan pentadbir semasa. Untuk menolak, isi sebab penolakan. Petugas dan ahli tidak boleh membuat keputusan.
5. Gunakan penapis status dan carian untuk menyemak rekod. Permohonan ditolak boleh dihantar semula dengan maklumat yang betul. Papan pemuka pentadbir turut menyediakan bilangan rekod kematian menunggu semakan.

Selesaikan permohonan profil/pertukaran ketua yang menunggu sebelum menghantar rekod kematian. Jika nama, tarikh lahir atau kedudukan individu dalam isi rumah sudah berubah semasa semakan, pentadbir perlu menolak permohonan lapuk dan meminta penghantaran semula.

Selepas kelulusan, **Meninggal dunia** dipaparkan pada ahli utama dalam direktori dan pada maklumat ahli keluarga. Akaun ahli yang dipautkan kepada individu tersebut dinyahaktif dan sesinya ditamatkan. Sistem turut menghalang akaun individu itu daripada diaktifkan atau dilog masuk semula. Akaun pentadbir/petugas diurus berasingan; mereka bukan akaun portal yang dipautkan kepada rekod penduduk.

Profil, ahli keluarga dan rekod bantuan tidak dipadam. Status keahlian Aktif/Tidak aktif kekal berasingan daripada status kematian; jumlah keluarga/statistik sedia ada masih mengira rekod yang dikekalkan. Jika ketua meninggal dunia, pentadbir/petugas mengurus pengganti melalui **Pertukaran ketua**. Individu yang diluluskan meninggal dunia tidak boleh dipilih sebagai ketua baharu. Status kematian ketua lama kekal apabila menjadi rekod keluarga.

Kelulusan kematian tidak boleh dibatalkan atau disunting melalui borang ini; semak dengan teliti sebelum meluluskan. Fungsi pembetulan rekod kematian rasmi belum disediakan. Tuntutan khairat tersedia melalui menu berasingan. Simpan **sandaran penuh SQLite** untuk semua permohonan, keputusan dan akaun; JSON rekod komuniti tidak mengandungi rekod kematian.

## Khairat kematian

Menu **Khairat kematian** mengurus tuntutan dan rekod bayaran. Jenis khairat dan jumlah disediakan pentadbir melalui **Tetapan sistem → Jenis & kadar khairat**. Pemohon memilih jenis yang berkenaan; kadar semasa disalin ke tuntutan.

### Menghantar tuntutan

1. Pastikan rekod kematian telah **Diluluskan** melalui menu Rekod kematian. Rekod yang masih menunggu/ditolak tidak boleh digunakan.
2. Buka **Khairat kematian → Tuntutan baharu**, pilih rekod kematian dan jenis khairat, lampirkan sijil kematian (PDF/JPG/PNG maksimum 5 MB), kemudian isi nama penuh waris/penerima bayaran, hubungan dengan si mati, telefon dan catatan tuntutan.
3. Tandakan pengesahan dan sahkan penghantaran. Ahli hanya boleh melihat/memohon untuk isi rumah sendiri; pentadbir/petugas boleh membantu menyediakan tuntutan.
4. Satu rekod kematian hanya boleh mempunyai satu tuntutan menunggu, diluluskan atau dibayar. Jika ditolak, baca catatan dan hantar tuntutan baharu dengan maklumat yang betul. Tuntutan yang dihantar tidak boleh disunting terus.

Jika ketua meninggal dunia dan akaunnya disekat, pentadbir/petugas boleh menyediakan tuntutan bagi waris. Selepas pengganti dilantik dan akaun disediakan, ketua baharu boleh melihat tuntutan isi rumah yang sama. Akaun orang yang meninggal dunia tidak perlu diaktifkan semula.

### Semakan pentadbir

Buka kad **Tuntutan khairat menunggu semakan** pada papan pemuka, atau buka menu Khairat kematian dan pilih status Menunggu semakan. Tekan ikon **Lihat / semak** untuk menyemak si mati, waris dan catatan.

Untuk meluluskan, muat turun dan semak sijil kematian serta kadar pada tuntutan. **Jumlah diluluskan (RM)** diisi mengikut kadar jenis khairat ketika tuntutan dihantar dan dikunci. Tandakan pengesahan dan isi kata laluan pentadbir semasa. Bagi rekod lama tanpa jenis, pentadbir masih memasukkan jumlah dengan maksimum dua tempat perpuluhan. Untuk menolak, nyatakan sebab penolakan. Hanya pentadbir boleh membuat keputusan. Status **Diluluskan · Belum dibayar** tidak bermaksud wang telah diserahkan.

### Merekod bayaran

1. Buat bayaran di luar sistem kepada waris/penerima yang dinyatakan, mengikut jumlah diluluskan. Aplikasi ini tidak memindahkan wang.
2. Pentadbir membuka tuntutan berstatus **Diluluskan · Belum dibayar**, kemudian mengisi tarikh bayaran, kaedah (Tunai/Pindahan bank/Cek), nombor rujukan transaksi/resit dan catatan jika perlu.
3. Tandakan pengesahan bahawa bayaran penuh telah dibuat dan masukkan kata laluan pentadbir semasa. Sahkan tindakan. Jumlah bayaran menggunakan jumlah diluluskan dan tidak boleh diubah pada borang bayaran.
4. Status bertukar kepada **Dibayar**. Tarikh, kaedah, rujukan dan pentadbir yang merekodkan bayaran dipaparkan dalam sejarah. Sistem menyekat rekod bayaran kedua untuk tuntutan sama.

Gunakan carian nama si mati/waris/ID dan penapis status. Ringkasan jumlah **Diluluskan belum dibayar** serta **Dibayar** mengikut rekod yang sedang ditapis. Rekod khairat diasingkan daripada bantuan biasa dan tidak menambah bilangan bantuan dalam direktori.

Fasa ini menyokong satu bayaran penuh bagi tuntutan, tanpa ansuran, pembatalan, suntingan kelulusan/bayaran atau pengiraan baki tabung/yuran ahli. Semak jumlah, waris dan rujukan sebelum mengesahkan. Semua borang dikunci semasa permintaan diproses. Gunakan **sandaran penuh SQLite** untuk memindahkan tuntutan, keputusan, bayaran dan akaun; JSON versi 8 tidak mengandungi jadual khairat.

## Sijil kematian sebagai dokumen sokongan

Tuntutan khairat baharu wajib mempunyai sijil kematian dalam format **PDF, JPG/JPEG atau PNG**, maksimum **5 MB**. Semak fail yang dipilih sebelum menghantar. Sistem menyemak format/saiz fail; pentadbir tetap perlu menyemak kandungan dan kesahihan sijil.

Buka tuntutan melalui ikon Lihat / semak dan tekan **Muat turun sijil kematian**. Dokumen hanya boleh dimuat turun oleh pentadbir, petugas serta ahli daripada isi rumah tuntutan yang mempunyai akses Khairat. Dokumen tidak disediakan melalui pautan awam. Muat turun dicatat dalam sejarah tindakan.

Tuntutan lama yang masih menunggu dan belum mempunyai sijil menyediakan borang **Lampirkan sijil kematian** dalam paparan tuntutan. Sijil wajib dilampirkan sebelum kelulusan. Lampiran yang telah dihantar tidak boleh diganti melalui borang ini; jika tersilap semasa menunggu, pentadbir menolak dengan catatan dan pemohon menghantar tuntutan baharu. Rekod lama yang sudah diluluskan/dibayar dikekalkan tanpa mengubah keputusan atau mewajibkan penghantaran semula.

## Pengurusan jenis dan kadar khairat

Pentadbir membuka **Tetapan sistem → Jenis & kadar khairat**, mengisi kod unik, nama, jumlah bayaran RM dan status Aktif. Contoh: kod `ASAS`, nama `Khairat kematian asas`; jumlah mengikut keputusan komuniti. Tiada jenis atau kadar sebenar dicipta secara automatik.

Tekan ikon Kemaskini untuk mengubah nama, kadar atau status. Kod kekal; nyahaktif jenis yang tidak lagi digunakan. Tuntutan baharu hanya menerima jenis aktif. Perubahan katalog tidak menukar nama/kadar yang telah disalin pada tuntutan sedia ada, termasuk yang masih menunggu. Pentadbir meluluskan mengikut kadar yang dipaparkan pada tuntutan itu. Satu rekod kematian masih terhad kepada satu tuntutan menunggu/diluluskan/dibayar, walaupun terdapat beberapa jenis khairat.

## Pengurusan akses modul Ahli dan Petugas

Buka **Tetapan sistem → Akses modul pengguna**, atau **Akaun pengguna → Tetapan akses modul pengguna**. Pilih peranan **Ahli** atau **Petugas**, tandakan modul yang dibenarkan, masukkan kata laluan pentadbir semasa dan sahkan penyimpanan.

Pilihan ini digunakan untuk **semua akaun dalam peranan yang dipilih**, bukan tetapan berasingan bagi setiap individu. Tetapan Ahli dan Petugas disimpan berasingan; mengubah satu peranan tidak mengubah peranan lain. Modul yang boleh ditetapkan ialah Profil/keluarga/bantuan sendiri, Aktiviti & hebahan, Pertanyaan, Notifikasi, Pertukaran ketua, Rekod kematian dan Khairat kematian. Profil, keluarga dan bantuan sendiri ialah satu pilihan kerana dikendalikan dalam portal yang sama.

Bagi **Petugas**, pilihan ialah Ahli & keluarga komuniti, Bantuan komuniti, Aktiviti & hebahan, Pertanyaan, Notifikasi, Pertukaran ketua, Rekod kematian dan Khairat. Direktori ahli dan bantuan boleh dibenarkan secara berasingan. Modul bantuan/pertukaran ketua/kematian masih menyediakan maklumat rujukan individu yang diperlukan untuk tugasan berkenaan walaupun direktori penuh disekat.

Pentadbir mengekalkan akses penuh; tetapan modul tidak memberi kuasa kelulusan, akaun pengguna, laporan, sandaran atau tetapan sistem kepada Petugas. Papan pemuka, tukar kata laluan dan log keluar sentiasa tersedia. Penyekatan modul berkuat kuasa pada permintaan seterusnya termasuk API dan dokumen. Ahli/Petugas perlu memuat semula pelayar untuk mengemas kini menu. Bahagian papan pemuka yang berkaitan turut disembunyikan. Rekod/permohonan tidak dipadam apabila akses dimatikan dan boleh dilihat semula selepas dibenarkan.

Jenis khairat, salinan kadar tuntutan, sijil dan tetapan akses memerlukan **sandaran penuh SQLite** untuk pemindahan lengkap. Sandaran JSON versi 8 tidak mengandungi data ini.

Akses Petugas sedia ada dikekalkan semasa naik taraf sehingga pentadbir mengubah pilihan. Jika modul bantuan dimatikan tetapi direktori dibenarkan, bilangan bantuan dan bahagian bantuan dalam borang ahli disembunyikan. Jika direktori dimatikan, ringkasan jumlah ahli pada papan pemuka turut disembunyikan. Notifikasi dan aktiviti yang dimatikan tidak dipaparkan melalui ringkasan papan pemuka.
