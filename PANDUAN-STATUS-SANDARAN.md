# Status sandaran sistem

Pentadbir membuka **Pentadbiran → Status sandaran** atau butang semakan pada kad sandaran di papan pemuka. Ahli dan Petugas tidak mempunyai akses. Penggunaan tidak memerlukan pengaktifan 2FA.

Paparan menunjukkan keputusan proses terakhir yang berjaya direkodkan, tarikh sandaran terakhir yang disahkan ketika dicipta, saiz fail, bilangan nama fail mengikut format sistem dan sela masa dijangka. Muat semula untuk mendapatkan keadaan semasa. Semakan direkodkan dalam sejarah tindakan.

## Maksud status

| Status | Tindakan |
| --- | --- |
| Belum direkodkan | Jalankan sandaran penuh pelayan atau semak konfigurasi folder. |
| Fail lama perlu disemak | Fail lama ditemui tanpa rekod pengesahan versi baharu; jalankan sandaran penuh baharu. |
| Terkini | Proses berjaya direkodkan dalam sela masa dan fail terakhir masih fail biasa dengan saiz/cap masa sepadan. |
| Sandaran lewat | Sandaran terakhir melepasi sela masa ditambah toleransi lima minit; semak penjadual dan log. |
| Percubaan terakhir gagal | Semak log, ruang cakera dan kebenaran folder. Rekod kejayaan terdahulu masih dipaparkan jika tersedia. |
| Fail terakhir hilang / berubah | Sediakan sandaran baharu dan siasat perubahan fail atau lokasinya. |
| Status/storan/tetapan perlu disemak | Semak kebenaran, jam pelayan, rekod status dan tetapan sela masa. |

Ketika penciptaan, salinan SQLite disemak dengan `quick_check` dan `foreign_key_check`. Paparan kemudian menyemak kewujudan, jenis, saiz serta cap masa fail; ia tidak mengulangi semakan penuh kandungan pada setiap permintaan. Status Terkini bukan bukti ujian pemulihan atau salinan di lokasi berasingan. Jalankan ujian pemulihan berkala mengikut panduan teknikal tempatan. Pastikan jam pelayan disegerakkan.

## Ujian pada laptop

Selepas mengemas kini kod dan memulakan semula aplikasi, buka Terminal dalam folder projek menggunakan Node.js 24+. Jalankan:

```bash
node scripts/backup-full.js
```

Dengan tetapan lalai, sumber ialah `data/kampung.sqlite` dan sandaran disimpan dalam `backups/`. Jika pemasangan anda menggunakan `DATA_DIR` atau `BACKUP_DIR` tersendiri, gunakan nilai yang sama semasa menjalankan skrip dan aplikasi. Buka Status sandaran dan pilih Muat semula status. Arahan ini menjalankan satu sandaran; untuk automasi gunakan penjadual sistem operasi atau servis yang diterangkan di bawah.

Jangan padam folder data atau menggantikan pangkalan data untuk menguji paparan ini. Ujian kegagalan, fail hilang dan pemulihan hendaklah menggunakan pemasangan ujian berasingan.

## Jadual dan storan

- **Docker Compose:** servis `backup` menggunakan volume `full_backups`; aplikasi memasangnya sebagai baca sahaja untuk pemantauan. Servis menjalankan sandaran pada permulaan dan selepas sela masa yang ditetapkan. Bina semula imej dan cipta semula servis selepas kemas kini, tanpa memadam volume. `BACKUP_INTERVAL_HOURS` lalai 24 (1–168); `BACKUP_KEEP` lalai 7 (1–365). Healthcheck servis menggunakan status yang sama.
- **cPanel:** runtime mesti menyokong Node.js 24+ dan SQLite terbina dalam. Tetapkan `BACKUP_DIR` aplikasi kepada folder peribadi yang sama dengan Cron Jobs, serta `BACKUP_INTERVAL_HOURS` mengikut jadual sebenar. Lihat panduan pelancaran domain. Menetapkan sela masa aplikasi sahaja tidak mencipta Cron Job.
- **Laptop tanpa Docker:** jalankan skrip sekali untuk ujian atau gunakan penjadual OS dengan pemboleh ubah/laluan yang sama. Pelayan web tidak memulakan sandaran automatik.

Status ditulis secara atomik dalam `.backup-status.json` di folder sandaran dengan kebenaran 600. Folder mesti boleh ditulis oleh proses sandaran dan boleh dibaca oleh aplikasi; jangan letak folder tersebut dalam ruang web awam. Fail status menyimpan metadata, bukannya salinan data. Jangan sunting fail ini untuk menjadikan status kelihatan berjaya. Kekalkan satu penjadual bagi setiap folder untuk mengelakkan proses bertindih.

Jika cakera penuh atau folder tidak dapat ditulis, keputusan kegagalan mungkin turut gagal direkodkan. Semak log penjadual dan ruang storan secara berkala; paparan hanya mengetahui keputusan yang berjaya direkodkan. API tidak menghantar laluan mutlak atau mesej ralat mentah kepada pelayar.

## Sandaran untuk muat turun

Butang **Sediakan sandaran penuh untuk muat turun** menggunakan pengesahan kata laluan semasa yang sedia ada. Tarikh “Fail muat turun terakhir disediakan” berasal daripada audit penyediaan fail, bukan pengesahan bahawa pelayar telah menyimpan fail. Semak folder muat turun dan salin fail ke storan lain yang dikawal aksesnya.

Muat turun tidak menukar status sandaran pelayan atau menandakan jadual automatik berjaya. Sandaran mengandungi maklumat peribadi, lampiran dan hash kata laluan; lindungi fail serta hadkan akses. Kunci `MFA_ENCRYPTION_KEY`, jika digunakan kemudian, tetap memerlukan salinan berasingan.
