# Laporan kualiti data ahli dan keluarga

Buka **Pentadbiran → Kualiti data** sebagai pentadbir. Laporan membantu menyemak rekod rasmi yang telah disimpan; cadangan profil yang masih menunggu tidak dimasukkan sehingga diluluskan. Petugas dan ahli tidak mendapat akses laporan ini.

## Kelengkapan dan format

Tab **Kelengkapan & format** memaparkan seorang individu setiap dapatan, bersama nama isi rumah dan butang **Buka rekod ahli**. Tapis mengikut status isi rumah (lalai Aktif), zon, jenis dapatan atau nama. Bilangan dalam ringkasan ialah bilangan isi rumah/orang yang dipilih, orang belum lengkap, orang perlu semak format serta kumpulan padanan. Satu orang boleh mempunyai beberapa dapatan dan boleh termasuk dalam dua kiraan kelengkapan serta format.

Semakan meliputi nama, tarikh lahir, status pekerjaan, maklumat pelajar, telefon ahli utama, alamat/negara, medan daerah/negeri/poskod Malaysia, rujukan zon/jenis rumah, koordinat, e-mel/pengenalan jika diisi, hubungan dan kediaman keluarga. Senarai keluarga yang tidak dapat dibaca turut ditandakan untuk semakan teknikal.

Maklumat kosong dalam medan pilihan ialah **cadangan kelengkapan**, bukan bukti rekod tidak sah atau arahan untuk menjadikannya wajib. Telefon, pengenalan dan e-mel tidak disahkan dengan pihak luar. Pemeriksaan format bukan pengesahan identiti, alamat atau nombor telefon sebenar.

- Pendapatan RM0 tidak dianggap hilang; pendapatan, pengenalan, e-mel dan koordinat kosong tidak diwajibkan oleh laporan ini.
- Zon/jenis rumah yang belum dipilih hanya dicadangkan jika pilihan aktif telah tersedia dalam katalog.
- Rujukan kepada zon/jenis rumah yang sudah dinyahaktifkan masih sah bagi rekod lama. Kod yang tidak lagi wujud dalam katalog memerlukan semakan.
- Koordinat boleh dikosongkan kedua-duanya; satu koordinat sahaja atau nilai di luar julat memerlukan semakan.
- Status aktif/tidak aktif dalam laporan merujuk kepada isi rumah, bukan keputusan kematian setiap individu.

## Potensi pendua

Tab **Potensi pendua** menunjukkan kumpulan yang mempunyai nama, nombor pengenalan atau telefon ahli utama yang sama. Nama dinormalisasi mengikut kaedah semakan semasa simpanan (huruf besar/kecil, ruang/tanda baca); telefon Malaysia berformat `012…`, `+6012…` dan `006012…` dibandingkan sebagai nombor yang sama. Pengenalan dinormalisasi tanpa ruang/sempang dan dengan huruf besar.

Ahli utama dan keluarga dibandingkan dalam isi rumah sendiri serta merentas isi rumah untuk nama/pengenalan. Telefon dibandingkan antara ahli utama kerana keluarga tidak mempunyai medan telefon khusus dalam struktur ini. Nilai kosong tidak menghasilkan kumpulan padanan.

**Padanan tidak bermaksud individu yang sama.** Nama boleh sama, keluarga boleh berkongsi telefon dan rekod tidak aktif masih perlu dirujuk. Semak tarikh lahir dan maklumat asal sebelum membuat keputusan. Laporan tidak menggabungkan atau memadam rekod secara automatik. Semakan semasa simpanan yang sedia ada kekal berfungsi.

Penapis memilih kumpulan jika sekurang-kurangnya seorang peserta sepadan dengan penapis. **Kumpulan penuh boleh merangkumi peserta di luar zon, nama atau status yang sedang ditapis**, supaya hubungan dengan rekod lain tidak disembunyikan. Contoh: seorang di Zon A dan seorang di Zon B boleh muncul dalam kumpulan yang sama ketika menapis Zon A.

Kad memaparkan tiga peserta awal; pilih **Lihat semua padanan** untuk melihat semua peserta dalam halaman sepuluh orang. Senarai utama pula berhalaman 20 dapatan/kumpulan. Kumpulan dihitung sebagai kumpulan, bukan bilangan pasangan atau bilangan individu yang disahkan berganda.

## Membetulkan rekod

1. Tekan **Buka rekod ahli** pada individu yang hendak disemak. Bagi keluarga, cari nama individu dalam borang isi rumah tersebut.
2. Semak maklumat dengan sumber yang sesuai dan simpan melalui borang ahli sedia ada. Catatan perubahan boleh direkodkan untuk rujukan sejarah.
3. Jika amaran pendua sedia ada muncul, semak padanan sebelum menggunakan pengesahan rekod berasingan. Jangan mengubah maklumat sebenar semata-mata untuk menghilangkan amaran.
4. Buka semula **Kualiti data**, atau tekan **Semak / muat semula**. Dapatan dikira semula daripada rekod terkini.

Laporan tidak mencipta status pembetulan kekal. Kumpulan yang tidak lagi mempunyai padanan boleh hilang selepas pembetulan; jika pautan kumpulan lama dibuka, muat semula laporan. Tiada fungsi menyunting terus atau menindih data daripada laporan.

## Keselamatan dan pemasangan

API laporan dan kumpulan terhad kepada pentadbir. Paparan tidak mengembalikan nombor pengenalan atau telefon penuh dalam payload laporan; pentadbir membuka rekod asal jika diperlukan. Kumpulan menggunakan ID hash supaya nombor pengenalan/telefon tidak dimasukkan dalam URL kumpulan. Akses laporan direkodkan dalam audit; rekod ahli dan sejarah profil hanya berubah apabila pengguna menyimpan pembetulan melalui aliran biasa.

Kemas kini kod dan folder `public`, kekalkan data sedia ada dan restart aplikasi. Tiada migrasi jadual baharu diperlukan untuk laporan ini. Buat sandaran penuh sebelum menaik taraf seperti biasa. 2FA tidak perlu diaktifkan. Laporan ini ialah semakan petunjuk terpilih, bukan audit menyeluruh semua kemungkinan kesalahan data.
