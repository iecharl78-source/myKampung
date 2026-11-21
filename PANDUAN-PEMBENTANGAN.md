# Persediaan pembentangan dan penerimaan pengguna myKampung

## Sebelum sesi

Gunakan pemasangan demo dan DATA_DIR berasingan daripada data sebenar. Sediakan akaun pentadbir, petugas dan ahli rekaan dengan kata laluan berbeza yang tidak dipaparkan pada slaid. Jangan menggunakan nombor MyKad, telefon, sijil atau resit individu sebenar. Tanda dokumen contoh dengan jelas sebagai **CONTOH UNTUK UJIAN**.

Catat versi/commit yang dipasang, pautan perubahan yang telah digabungkan, tarikh ujian dan keputusan. Ciri dalam branch/PR yang belum dipasang tidak dianggap tersedia. Penambahan zon kubur dan nombor batu nisan yang masih menunggu ujian pengguna perlu disemak berasingan sebelum demonstrasi atau pelepasan gabungan. Dokumen ini tidak menyatakan semua cadangan masa hadapan telah dilaksanakan.

Pastikan laptop tidak tidur semasa sesi, pelayar dimuat semula selepas kemas kini dan sandaran penuh tersedia. 2FA boleh kekal tidak aktif mengikut keputusan pengguna; kawalan peranan dan tamat sesi tetap berfungsi.

## Cadangan perjalanan demonstrasi (20–30 minit)

| Masa anggaran | Demonstrasi | Perkara yang perlu dilihat |
| --- | --- | --- |
| 2 minit | Log masuk dan papan pemuka | Modul berbeza mengikut peranan; ringkasan komuniti dan tugasan. |
| 4 minit | Pendaftaran dan keluarga | Hantar permohonan, semak sebagai pentadbir, lulus dan lihat rekod rasmi. |
| 4 minit | Perubahan keluarga | Ahli mencadangkan perubahan, pentadbir meluluskan, direktori sepadan dan sejarah memaparkan sebelum/selepas. |
| 3 minit | Bantuan | Rekod penerimaan bantuan dan lihat sejarah bantuan isi rumah serta laporan. |
| 4 minit | Kematian dan khairat | Sijil pada rekod kematian, kelulusan, penggunaan sijil dalam tuntutan dan rekod bayaran dengan nombor serta fail resit. Zon/nombor nisan hanya jika versi berkaitan sudah dipasang. |
| 3 minit | Pusat tugasan | Tapis tertunggak, tetapkan pegawai dan tunjuk notifikasi dalam sistem. |
| 3 minit | Komunikasi | Hebahan, aktiviti dan pertanyaan ahli dengan balasan petugas. |
| 3 minit | Keselamatan dan operasi | Sejarah/audit, sekatan akses, pengurusan sesi serta muat turun sandaran penuh. |

Terangkan bahawa bayaran dibuat di luar sistem; aplikasi merekodkan bukti dan keputusan. Kelulusan kematian ketua menyekat akaun individu; sediakan akaun waris/ketua pengganti secara berasingan supaya aliran demo tidak terhenti. Jangan membentangkan pemulihan data secara langsung pada sistem yang digunakan orang lain.

## Borang ujian penerimaan pengguna

Lengkapkan lajur keputusan selepas ujian sebenar, bukan berdasarkan andaian.

| Senario | Jangkaan | Keputusan / catatan |
| --- | --- | --- |
| Pendaftaran awam | Akaun belum boleh digunakan sehingga diluluskan. | Belum diuji pengguna |
| Ahli melihat isi rumah sendiri | Rekod isi rumah lain tidak boleh diakses. | Belum diuji pengguna |
| Perubahan keluarga 1 kepada 3 | Selepas kelulusan, portal dan direktori menunjukkan 3. | Belum diuji pada versi demo |
| Sejarah perubahan rasmi | Nilai lama/baharu, pelaku, pemohon dan catatan tepat. | Belum diuji pengguna |
| Percubaan akses sejarah oleh petugas/ahli | Ditolak. | Belum diuji pengguna |
| Rekod kematian dan sijil | Lampiran tersedia kepada pihak yang dibenarkan. | Belum diuji pada versi demo |
| Zon kubur / nombor nisan | Nilai termasuk sifar awal disimpan, dicari dan boleh dibetulkan pentadbir. | Versi berkaitan perlu dipasang/diuji |
| Bayaran tanpa nombor atau resit | Ditolak; status belum dibayar dikekalkan. | Belum diuji pada versi demo |
| Bayaran lengkap | Dibayar sekali, resit boleh dimuat turun. | Belum diuji pada versi demo |
| Penugasan serentak | Versi lama ditolak, tiada tindihan senyap. | Belum diuji pengguna |
| Log keluar / tamat sesi | Data paparan dibersihkan dan perlu log masuk semula. | Belum diuji pada versi demo |
| Sandaran dan pemulihan percubaan | Akaun, data, lampiran serta sejarah sepadan di folder ujian. | Belum diuji pengguna |
| Domain/HTTPS hosting | Sijil sah, origin sepadan dan data peribadi tidak terdedah sebagai fail. | Belum boleh diuji sehingga hosting serasi |

Rekodkan isu dengan peranan pengguna, ID rekod/permohonan, langkah menghasilkan masalah dan mesej ralat. Jangan lampirkan kata laluan atau maklumat peribadi sebenar dalam laporan isu GitHub awam.

## Sebelum pelancaran umum

Penyedia hosting mesti mengesahkan runtime Node.js 24+, SQLite setempat, satu worker, storan kekal dan SSL. Lihat PANDUAN-PELANCARAN-DOMAIN.md. Tetapkan pentadbir operasi, pegawai kelulusan/bayaran, jadual sandaran dan saluran bantuan pengguna. Sediakan penerangan tujuan pengumpulan data dan akses pengguna yang mudah difahami, serta gunakan akaun individu supaya audit boleh dikenal pasti.

Mulakan dengan kumpulan perintis kecil, selesaikan isu penerimaan, semak sandaran/ruang cakera dan kemudian buka pendaftaran kepada kumpulan lebih luas. Langkah ini belum dijalankan pada hosting pengguna dan bukan pengesahan bahawa aplikasi telah dilancarkan.
