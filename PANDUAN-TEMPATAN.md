# Cuba myKampung pada komputer sendiri

## 1. Persediaan

Pasang Node.js versi 24 LTS atau lebih baharu daripada https://nodejs.org. Ekstrak fail ZIP. Buka Terminal atau PowerShell di dalam folder `myKampung` yang mengandungi `package.json`.

Semak pemasangan:

```text
node --version
```

Nombor versi mestilah 24 atau lebih baharu. Tiada arahan `npm install` diperlukan kerana aplikasi ini menggunakan modul terbina dalam Node.js.

## 2. Mula pertama dan kata laluan pentadbir

Pilih arahan mengikut komputer anda. Kata laluan mesti sekurang-kurangnya 12 aksara. Simpan kata laluan dengan selamat; pemulihan kata laluan belum disediakan.

### Windows (PowerShell)

```powershell
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Kata laluan pentadbir (minimum 12 aksara)' -AsSecureString)).Password
npm.cmd start
```

`npm.cmd` digunakan supaya anda tidak perlu mengubah dasar pelaksanaan skrip PowerShell.

### macOS atau Linux (Bash)

```bash
read -rs -p 'Kata laluan pentadbir (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
npm start
```

Jika terminal menggunakan zsh, jalankan `bash` dahulu sebelum arahan di atas.

## 3. Cuba aplikasi

Apabila terminal memaparkan `myKampung berjalan pada port 3000`, buka pelayar pada komputer yang sama dan taip `http://127.0.0.1:3000` dalam bar alamat.

1. Log masuk menggunakan nama pengguna **admin** dan kata laluan yang baru ditetapkan. Untuk pemasangan versi lama, kata laluan asal dikekalkan selepas kemas kini.
2. Tekan **Daftar ahli** dan gunakan maklumat rekaan dahulu.
3. Masukkan nama, telefon dan alamat. Tambah ahli keluarga jika perlu.
4. Tekan **Simpan maklumat**. Semak rekod dalam direktori.
5. Cuba carian dan **Lihat / edit** untuk mengemas kini rekod.
6. Kecilkan tetingkap pelayar untuk mencuba susun atur telefon.
7. Hentikan pelayan dengan `Ctrl+C`, jalankan `npm.cmd start` pada Windows atau `npm start` pada macOS/Linux, kemudian log masuk semula. Rekod sepatutnya masih ada.

Kata laluan hanya diperlukan sebagai pemboleh ubah persekitaran semasa mencipta pangkalan data pertama. Pada sesi terminal baharu, `npm start` menggunakan hash kata laluan yang telah disimpan. Menetapkan `ADMIN_PASSWORD` yang baharu tidak menukar kata laluan pentadbir sedia ada.

## 4. Data dan had percubaan tempatan

Data disimpan dalam `data/kampung.sqlite` pada komputer anda, bukan dalam pelayar. Jangan padam folder `data`. Untuk sandaran tempatan, hentikan pelayan dan salin keseluruhan folder `data` ke lokasi yang selamat. Jangan kongsi folder itu kerana ia mengandungi maklumat peribadi dan hash kata laluan.

Percubaan ini hanya boleh dibuka pada komputer pelayan yang sama. Penerbitan persekitaran Codex tidak menerbitkan laman web awam. Akses daripada telefon sebenar akan disediakan kemudian melalui konfigurasi rangkaian dan HTTPS yang sesuai.

## Jika tidak berjaya

- `node` tidak dikenali: pasang Node.js, tutup terminal dan buka semula.
- `ENOENT` atau `package.json` tidak ditemui: terminal berada di folder yang salah. Masuk ke folder yang mengandungi `package.json`.
- Port 3000 sedang digunakan: hentikan salinan myKampung yang sedang berjalan. Jangan jalankan dua salinan serentak.
- Pentadbir belum disediakan: hentikan pelayan, kemudian ulang langkah 2 dengan kata laluan sekurang-kurangnya 12 aksara.
- Selepas lima percubaan kata laluan yang salah: tunggu 15 minit sebelum mencuba lagi.

Ujian automatik boleh dijalankan dengan `npm.cmd test` pada Windows atau `npm test` pada macOS/Linux. Ujian ini menggunakan data rekaan dan pangkalan data sementara yang berasingan.

## Mengemas kini aplikasi yang sudah mempunyai data

Hentikan pelayan dengan `Ctrl+C` dan sandarkan folder `data` terlebih dahulu. Ekstrak ZIP versi baharu ke folder sementara. Salin fail aplikasi baharu ke folder myKampung yang sedang digunakan, termasuk seluruh folder `public`. Kekalkan folder `data` asal; jangan padam atau gantikannya. Jalankan semula aplikasi menggunakan arahan Node.js yang sama dan muat semula pelayar dengan `Ctrl+F5`.

Umur ahli dan keluarga dikira daripada tarikh lahir mengikut tarikh Malaysia dan dipaparkan dalam tahun lengkap. Tarikh lahir kosong dipaparkan sebagai `Umur: —`. Tiada pengisian umur atau perubahan pangkalan data diperlukan. Butang **Tunjuk kata laluan** dan **Sembunyi kata laluan** terdapat pada borang log masuk; kata laluan disembunyikan semula apabila borang dihantar.

Alamat kini diasingkan kepada **Alamat 1, Alamat 2, Daerah, Poskod, Negeri dan Negara**. Semasa pelayan versi baharu dimulakan, struktur pangkalan data dinaik taraf secara automatik. Keseluruhan alamat lama disalin ke Alamat 1 tanpa meneka poskod, daerah atau negeri. Buka rekod lama dan asingkan maklumat itu mengikut medan yang sesuai apabila diperlukan. Sandarkan folder `data` sebelum menaik taraf seperti arahan di atas.

Poskod ialah pilihan; poskod Malaysia yang diisi mestilah 5 digit, termasuk sifar awal. Selepas daerah, negeri dan negara Malaysia diisi, sistem menunjukkan pilihan poskod yang pernah disimpan dalam rekod komuniti bagi padanan daerah/negeri itu. Pengguna mesti memilih dan menyemak sendiri; poskod tidak diisi hanya kerana negeri atau daerah dipilih, dan poskod sedia ada tidak ditukar apabila daerah/negeri ditukar. Cadangan ini bukan senarai rasmi atau lengkap seluruh Malaysia. Jika belum ada rekod setempat, kosongkan dahulu dan semak dengan penerima atau laman rasmi Pos Malaysia. Cadangan ini tersedia tanpa Internet, manakala pautan Pos Malaysia memerlukan Internet.

## Status pekerjaan dan pendidikan ahli keluarga

Setiap baris ahli keluarga kini mempunyai pilihan **Status pekerjaan**: Bekerja, Bekerja sendiri, Tidak bekerja, Suri rumah, Pesara, Pelajar atau Belum bersekolah. Rekod lama kekal dan statusnya belum dinyatakan; lengkapkannya semasa mengemas kini melalui borang.

Jika **Pelajar** dipilih, **Tahap pendidikan** wajib dipilih: Universiti, Sekolah menengah, Sekolah rendah atau Taska/Tadika. Jika **Universiti** dipilih, pilih juga **Tahap pengajian**: Diploma, Sarjana Muda, Sarjana, Doktor Falsafah (PhD) atau Asasi. Ini merujuk kepada pengajian semasa, bukan kelayakan tertinggi yang pernah diperoleh.

Apabila status ditukar daripada Pelajar, butiran pendidikan dibersihkan. Apabila tahap pendidikan ditukar daripada Universiti, tahap pengajian universiti dibersihkan. Tiada perubahan pada tarikh lahir, hubungan atau maklumat ahli keluarga lain.

## Pekerjaan, pendidikan dan majikan ahli utama

Borang ahli utama mempunyai **Status pekerjaan**, **Pekerjaan / jawatan**, **Tahap pendidikan** dan **Tahap pengajian universiti**. Untuk ahli berstatus Pelajar, isi tahap pendidikan semasa. Untuk ahli lain, tahap pendidikan tertinggi boleh direkodkan walaupun sudah bekerja atau bersara. Pendidikan ahli utama dikekalkan apabila status berubah daripada Pelajar kepada Bekerja. Tahap pengajian universiti wajib jika Universiti dipilih, dan dibersihkan jika tahap pendidikan bertukar kepada sekolah atau pilihan lain.

Maklumat majikan terdiri daripada **Nama syarikat / majikan**, **Alamat syarikat / majikan** dan **No. telefon syarikat / majikan**. Semua medan ini pilihan dan boleh dikosongkan jika tiada maklumat. Maklumat yang telah diisi tidak dipadam apabila status pekerjaan ditukar; kemas kini atau kosongkan sendiri jika tidak lagi berkenaan.

Pelayan menambah medan baharu ke pangkalan data secara automatik ketika dimulakan selepas kemas kini. Teks pekerjaan lama, data keluarga dan rekod lain dikekalkan. Status pekerjaan, pendidikan dan butiran majikan bagi rekod lama dibiarkan kosong untuk dilengkapkan, bukan diteka daripada pekerjaan lama. Sandarkan folder `data` sebelum mengemas kini.

## Semakan rekod berganda

Semasa mendaftar atau mengemas kini ahli, sistem menyemak padanan nama atau telefon dengan ahli utama lain. Nama dibandingkan tanpa perbezaan huruf besar/kecil, ruang atau tanda baca. Telefon Malaysia dalam format `012…`, `+6012…` atau `006012…` dibandingkan sebagai nombor yang sama. Ini bukan pengesahan identiti dan tidak mengesan semua variasi ejaan nama. Ahli keluarga juga disemak seperti penerangan di bawah.

Jika padanan ditemui, borang memaparkan nama, ID dan telefon rekod berkaitan. Semak dahulu. Jika ia benar-benar individu berbeza, tekan **Simpan sebagai rekod berasingan**; nombor telefon boleh dikongsi oleh keluarga. Rekod tidak digabungkan atau dipadam secara automatik. Pengesahan hanya terpakai pada kandungan yang disemak; perubahan borang memerlukan semakan semula.

## Sandaran melalui aplikasi

Selepas log masuk, tekan **Sandaran**. Pelayar akan menyediakan fail `myKampung-sandaran-….json` untuk dimuat turun. Pastikan fail benar-benar tersimpan dalam folder muat turun anda. Fail ini mengandungi semua rekod ahli, keluarga, pekerjaan, pendidikan dan majikan. Ia tidak mengandungi akaun, hash kata laluan atau sesi pentadbir.

Fail sandaran **tidak disulitkan** dan mengandungi maklumat peribadi. Simpan di tempat selamat dan jangan muat naik ke GitHub atau kongsi secara terbuka. Salin sandaran ke pemacu lain supaya kerosakan external hard drive tidak memusnahkan data dan sandaran serentak. Had sandaran aplikasi ialah 10 MB / 20,000 rekod ahli. Untuk data melebihi had itu, hentikan pelayan dan sandarkan keseluruhan folder `data`.

## Pemulihan melalui aplikasi

1. Log masuk dan tekan **Pulihkan data**.
2. Pilih fail JSON yang dimuat turun melalui fungsi Sandaran. Fail ZIP aplikasi atau fail SQLite tidak diterima oleh borang ini.
3. Semak tarikh sandaran, bilangan ahli/keluarga dalam fail, dan bilangan rekod semasa yang akan digantikan. Pratonton tidak mengubah data dan tamat selepas 10 minit.
4. Masukkan kata laluan pentadbir semasa dan taip **PULIHKAN**.
5. Tekan **Gantikan data dan pulihkan**. Pemulihan menggantikan semua rekod ahli/keluarga; ia bukan penggabungan. Sandaran yang mempunyai sifar rekod akan mengosongkan direktori ahli.

Sistem memeriksa format, versi, checksum, ID unik dan kesahan maklumat sebelum menerima fail. Checksum membantu mengesan kerosakan tetapi bukan tandatangan digital; gunakan fail daripada sumber yang dipercayai. Jika data semasa berubah selepas pratonton, fail mesti dipilih dan disemak semula.

Sebelum menggantikan data, sistem menyimpan sandaran keadaan semasa dalam `data/backups/sebelum-pemulihan-….json`. Jika fail keselamatan tidak dapat ditulis, pemulihan tidak diteruskan. Penggantian data menggunakan satu transaksi supaya kegagalan penulisan tidak meninggalkan separuh rekod. Untuk membatalkan pemulihan yang telah berjaya, gunakan fungsi **Pulihkan data** dengan fail sebelum-pemulihan yang berkaitan.

Kata laluan pentadbir semasa kekal selepas pemulihan. Sesi pentadbir lain ditamatkan supaya mereka log masuk semula. Sandaran JSON hanya memulihkan rekod komuniti; untuk memindahkan keseluruhan sistem termasuk akaun pentadbir, hentikan pelayan dan salin keseluruhan folder `data` seperti panduan terdahulu. Sandaran berjadual belum disediakan.

## Nyahaktif, aktifkan semula dan padam ahli

Setiap baris direktori mempunyai butang **Nyahaktif** (atau **Aktifkan semula** untuk ahli tidak aktif) dan **Padam**. Fungsi ini hanya boleh digunakan selepas log masuk pentadbir.

**Nyahaktif** sesuai apabila ahli berpindah keluar kampung. Tekan butang itu, masukkan sebab jika diketahui dan sahkan. Tarikh nyahaktif direkodkan secara automatik; nama, alamat, pekerjaan, pendidikan, majikan dan semua maklumat keluarga kekal. Ahli serta tanggungan dalam isi rumahnya tidak lagi dikira dalam statistik aktif. Ini menukar status keseluruhan rekod isi rumah; jika hanya seorang tanggungan berpindah, kemas kini maklumat keluarga yang berkenaan secara berasingan.

Direktori memaparkan ahli **Aktif** secara lalai. Gunakan penapis **Tidak aktif** atau **Semua** untuk mencari ahli yang dinyahaktifkan. Maklumat sebab dan tarikh boleh dilihat melalui **Lihat / edit**. Tekan **Aktifkan semula** dan sahkan untuk mengembalikannya kepada statistik aktif. Sebab dan tarikh nyahaktif semasa dibersihkan ketika diaktifkan semula; sejarah perubahan status belum disediakan. Mengedit profil biasa tidak menukar status aktif.

**Padam** sesuai untuk rekod yang tersilap didaftarkan. Semak nama, ID dan nombor telefon yang dipaparkan, masukkan kata laluan pentadbir semasa dan taip **PADAM**. Pengesahan membuang rekod ahli serta semua tanggungan dalam rekodnya daripada pangkalan data semasa. Rekod ahli utama lain tidak terjejas. Tekan **Batal** jika tidak pasti atau gunakan Nyahaktif untuk ahli yang berpindah.

Sebelum memadam, sistem menyimpan sandaran keseluruhan rekod semasa dalam `data/backups/sebelum-padam-….json`. Jika sandaran gagal disimpan, pemadaman tidak diteruskan. Fail sandaran itu masih mengandungi rekod yang dipadam dan perlu dilindungi seperti sandaran lain. Jika perlu memulihkannya melalui **Pulihkan data**, ingat bahawa pemulihan menggantikan keseluruhan direktori, termasuk perubahan lain yang berlaku selepas sandaran; semak dan sandarkan data terkini dahulu.

Rekod lama ditandakan aktif secara automatik ketika menaik taraf. Status tidak aktif, sebab dan tarikh disertakan dalam sandaran versi semasa. Jika sandaran daripada versi lama yang belum mempunyai status dipulihkan, ahli di dalamnya dianggap aktif. Semakan pendua turut melibatkan ahli tidak aktif supaya ahli yang kembali boleh diaktifkan semula tanpa perlu mendaftar semula.

## Semakan pendua dan Padam ahli keluarga

Semakan ketika menyimpan kini meliputi nama ahli keluarga yang sama dalam borang sendiri, dalam isi rumah lain, atau dengan rekod ahli utama. Ahli utama baharu juga dibandingkan dengan ahli keluarga sedia ada. Rekod aktif dan tidak aktif disertakan; isi rumah yang sedang diedit tidak dibandingkan dengan salinan lamanya sendiri.

Amaran memaparkan kedudukan baris ahli keluarga dan isi rumah yang berkaitan. Jika kedua-dua tarikh lahir tersedia, sistem menyatakan sama ada tarikhnya sama atau berbeza. Nama sama dengan tarikh lahir berbeza atau kosong masih diberi amaran untuk semakan, bukan diputuskan sebagai orang yang sama. Nama dibandingkan tanpa perbezaan huruf besar/kecil, ruang atau tanda baca. Jika benar-benar individu berbeza, gunakan **Simpan sebagai rekod berasingan** selepas menyemak. Menukar maklumat borang atau memadam baris keluarga membatalkan pengesahan amaran lama.

Setiap baris keluarga mempunyai butang **Padam**. Tekan butang itu dan sahkan nama yang ingin dibuang. Tekan **Simpan maklumat** pada borang ahli untuk menyimpan pemadaman. Menekan Batal pada pengesahan mengekalkan baris; menutup atau membatalkan borang sebelum menyimpan tidak memadam rekod dalam pangkalan data. Ini hanya membuang tanggungan tersebut daripada isi rumah yang sedang diedit, bukan memadam ahli utama atau rekod dalam isi rumah lain. Bilangan keluarga dikemas kini selepas simpan. Buat sandaran melalui butang Sandaran sebelum perubahan penting jika perlu dipulihkan kemudian.

## Akaun pentadbir dan petugas

Selepas kemas kini ini, akaun pentadbir lama menjadi nama pengguna **admin**. Kata laluan sedia ada dan semua rekod komuniti dikekalkan. Pelayan menaik taraf jadual akaun secara automatik. Hentikan pelayan dan sandarkan keseluruhan folder `data` sebelum menaik taraf; salin semua fail aplikasi baharu, termasuk `accounts.js` dan seluruh folder `public`. Tiada pemasangan pakej tambahan diperlukan.

Setiap orang yang mengurus sistem sepatutnya mempunyai akaun sendiri:

| Fungsi | Pentadbir | Petugas |
| --- | --- | --- |
| Lihat semua ahli dan keluarga, daftar dan kemas kini profil | Ya | Ya |
| Tambah/padam baris keluarga melalui borang ahli | Ya | Ya |
| Nyahaktif/aktifkan semula ahli | Ya | Ya |
| Padam ahli utama dan keseluruhan isi rumahnya | Ya | Tidak |
| Muat turun sandaran dan pulihkan rekod | Ya | Tidak |
| Cipta akaun, nyahaktif/aktifkan akaun lain, tetap semula kata laluan orang lain | Ya | Tidak |
| Lihat sejarah tindakan | Ya | Tidak |
| Tukar kata laluan sendiri | Ya | Ya |

Pentadbir membuka menu **Akaun pengguna**, mengisi nama pengguna unik (3–40 aksara), nama penuh, peranan dan kata laluan awal (minimum 12 aksara). Nama pengguna menggunakan huruf, nombor, titik, sengkang atau garis bawah. Sampaikan kata laluan secara peribadi, bukan dalam rekod ahli atau ruangan nama. Minta pengguna menukar kata laluan selepas log masuk. Peranan dipilih ketika akaun dicipta; penyuntingan peranan akaun sedia ada belum disediakan.

Butang **Nyahaktif** akaun menghentikan akses dan menamatkan semua sesi pengguna itu. Rekod komuniti yang pernah diciptanya kekal. Akaun boleh diaktifkan semula kemudian. Akaun pengguna tidak dipadam supaya sejarah tindakannya kekal. Pentadbir tidak boleh menyahaktifkan akaun sendiri dan sistem memastikan ada pentadbir aktif.

Gunakan **Tetap semula kata laluan** untuk pengguna lain yang terlupa kata laluan; masukkan kata laluan pentadbir yang sedang log masuk dan kata laluan baharu pengguna. Tindakan ini turut menamatkan semua sesi pengguna berkenaan. Sistem tidak menghantar kata laluan melalui e-mel atau SMS. Jika semua pentadbir kehilangan akses, pemulihan layan diri belum disediakan; jangan padam pangkalan data kerana tindakan itu membuang rekod. Simpan akses sekurang-kurangnya satu akaun pentadbir dengan selamat.

Setiap pengguna boleh menekan **Tukar kata laluan**, memasukkan kata laluan semasa dan mengulangi kata laluan baharu. Selepas berjaya, semua sesi akaun tersebut termasuk sesi semasa ditamatkan. Log masuk semula menggunakan nama pengguna yang sama dan kata laluan baharu. Menukar pemboleh ubah `ADMIN_PASSWORD` pada pelayan tidak menetapkan semula kata laluan akaun yang sudah wujud.

## Sejarah tindakan

Menu **Sejarah tindakan** memaparkan masa Malaysia, nama pengguna, tindakan dan ID rekod berkaitan. Gunakan Sebelumnya/Seterusnya untuk melihat 50 tindakan pada setiap halaman. Tindakan yang direkodkan termasuk log masuk/keluar berjaya, pendaftaran dan kemas kini ahli/keluarga, perubahan status, pemadaman ahli, muat turun/pemulihan sandaran serta pengurusan akaun dan kata laluan.

Sejarah bermula apabila fungsi ini diaktifkan; tindakan versi lama tidak dicipta semula. Kandungan penuh profil, alamat, telefon, kata laluan dan hash kata laluan tidak disalin ke sejarah. Rekod ini ialah ringkasan tindakan, bukan perbandingan setiap medan sebelum/selepas atau log yang kebal daripada perubahan terus kepada fail pangkalan data.

Sandaran JSON ahli tidak mengandungi akaun atau sejarah tindakan. Memulihkan fail JSON tidak menggantikan akaun atau memadam sejarah; pemulihan itu sendiri direkodkan. Untuk memindahkan keseluruhan sistem termasuk pengguna dan sejarah, hentikan pelayan dan salin keseluruhan folder `data` dengan selamat. Akses melalui telefon/komputer berlainan masih memerlukan persediaan rangkaian dan HTTPS seperti diterangkan sebelum ini.

## Tunjuk kata laluan, cadangan dan tahap kekuatan

Medan kata laluan pada borang tukar kata laluan sendiri, cipta akaun, tetapkan semula kata laluan, padam ahli dan pulihkan sandaran mempunyai butang **Tunjuk kata laluan / Sembunyi kata laluan**. Setiap medan boleh ditunjukkan secara berasingan, termasuk kata laluan semasa dan pengesahan. Kata laluan disembunyikan semula selepas borang dihantar atau ditetapkan semula.

Medan kata laluan baharu mempunyai butang **Cadangkan kata laluan** dan penunjuk **Weak / Medium / Strong / Strongest**. Cadangan menggunakan penjana rawak kriptografi pelayar pada peranti sendiri, mengandungi 20 aksara dengan huruf besar/kecil, nombor dan simbol, dan tidak dihantar ke perkhidmatan luar. Pada borang tukar kata laluan sendiri, medan ulang kata laluan turut diisi dengan cadangan yang sama. Gunakan Tunjuk untuk menyemak dan simpan kata laluan dengan selamat sebelum menghantarnya. Cadangan memerlukan pelayar moden melalui localhost atau HTTPS; jika tidak tersedia, masukkan kata laluan sendiri.

Penunjuk kekuatan ialah anggaran berdasarkan panjang, kepelbagaian aksara dan beberapa corak mudah, bukan semakan pangkalan data kebocoran atau jaminan keselamatan. Keperluan pelayan kekal minimum 12 aksara; penunjuk tidak memaksa pengguna menukar kata laluan sedia ada. Elakkan penggunaan semula kata laluan.

## Penunjuk proses simpan dan pembekuan borang

Semasa log masuk, menyimpan ahli/keluarga, mencipta akaun, mengubah kata laluan, mengurus status/pemadaman atau memulihkan data, butang tindakan memaparkan status seperti **Sedang menyimpan rekod…** dengan penunjuk proses. Medan, pilihan dan butang borang dikunci. Navigasi serta tindakan lain juga disekat sementara, termasuk Batal dan kekunci Escape untuk menutup dialog.

Penghantaran berulang semasa permintaan yang sama diproses diabaikan. Apabila permintaan selesai atau gagal, borang dibuka semula; medan yang memang tidak berkenaan seperti tahap universiti tersembunyi kekal dilumpuhkan. Jika pelayan memberikan ralat, baca mesej dan betulkan maklumat sebelum mencuba lagi. Jangan tutup pelayar atau cabut pemacu semasa proses berjalan.

Penunjuk proses kini berada di bahagian atas borang dan melekat ketika menatal borang panjang. Penguncian meliputi ketujuh-tujuh borang: **Log masuk, Maklumat ahli/keluarga, Tambah pengguna, Tukar kata laluan, Pengurusan akaun, Status/pemadaman ahli dan Pemulihan data**. Pada Tambah pengguna, butang memaparkan **Sedang menyimpan pengguna baharu…**; pada maklumat ahli, **Sedang menyimpan rekod…**. Permintaan yang selesai dengan cepat mungkin memaparkan penunjuk hanya seketika; sistem tidak melambatkan simpan secara sengaja.

## Alamat majikan berasingan

Alamat syarikat/majikan kini menggunakan **Alamat majikan 1, Alamat majikan 2, Daerah majikan, Poskod majikan, Negeri majikan dan Negara majikan**, sama seperti susunan alamat kediaman. Semua maklumat majikan kekal pilihan. Poskod Malaysia yang diisi mestilah 5 digit, termasuk sifar awal.

Selepas daerah, negeri dan negara majikan diisi, cadangan poskod daripada alamat kediaman/majikan dalam rekod setempat boleh dipilih jika ada padanan. Semak alamat sebenar sebelum memilih; daerah/negeri sahaja tidak menentukan satu poskod. Boleh kosongkan poskod dan lengkapkan kemudian.

Pangkalan data dinaik taraf secara automatik ketika pelayan dimulakan. Keseluruhan alamat majikan lama disalin ke **Alamat majikan 1**, tanpa meneka poskod atau negeri. Asingkan komponennya apabila mengemas kini rekod. Sandaran JSON versi lama masih boleh dipulihkan dan menggunakan kaedah yang sama. Sandarkan folder `data` sebelum mengemas kini aplikasi dan kekalkan folder itu ketika menggantikan fail program.

## Rekod bantuan diterima

Menu **Bantuan** tersedia kepada Pentadbir dan Petugas. Versi ini merekodkan bantuan yang **sudah diterima**, bukan permohonan, kelayakan atau kelulusan bantuan. Jadual bantuan ditambah secara automatik ketika pelayan dimulakan selepas kemas kini; semua maklumat asas sedia ada dikekalkan.

1. Buka **Ahli & isi rumah**, pilih **Lihat / edit** ahli, kemudian tekan **＋ Rekod bantuan diterima** dalam bahagian **Bantuan diterima ahli dan keluarga**.
2. Ahli/isi rumah aktif dipilih secara automatik mengikut profil. Pilih jenis bantuan yang telah didaftarkan oleh pentadbir. Jenis penerima boleh berupa **Ahli utama**, **Isi rumah** atau **Ahli keluarga**. Untuk keluarga, pilih orang dalam senarai keluarga isi rumah tersebut.
3. Isi nama bantuan, kategori, pemberi/agensi dan tarikh bantuan diterima. Tarikh masa hadapan tidak diterima.
4. Isi nilai dalam **RM**, atau kuantiti berserta unit seperti bakul/pek/kg. Sekurang-kurangnya satu daripada nilai atau kuantiti mesti diisi. Nilai RM menggunakan maksimum dua perpuluhan; kuantiti maksimum tiga perpuluhan. Jika kedua-duanya diisi, nilai RM dianggap nilai bantuan itu dan bukan nilai setiap unit.
5. Tambah catatan jika perlu dan tekan **Simpan bantuan**. Borang dikunci sehingga penyimpanan selesai.

Jika penerima, nama bantuan, pemberi dan tarikh sepadan dengan rekod sedia ada, sistem memberikan amaran. Semak terlebih dahulu; gunakan **Simpan sebagai agihan berasingan** hanya jika ia benar-benar pemberian berasingan. Amaran bukan bukti seseorang menerima bantuan secara tidak sah.

Carian merangkumi nama bantuan, kategori, pemberi, penerima dan isi rumah. Penapis isi rumah serta tarikh Dari/Hingga mengehadkan rekod yang dipaparkan. Ringkasan menunjukkan bilangan rekod sepadan, jumlah nilai RM yang diisi dan bilangan isi rumah berbeza. Kuantiti berlainan unit tidak dijumlahkan. Bantuan tanpa nilai RM tidak ditafsirkan sebagai tiada nilai, cuma nilainya belum direkodkan.

Nama dan tarikh lahir penerima disimpan sebagai gambaran semasa bantuan direkodkan. Menukar nama profil atau membuang baris keluarga tidak memadam atau menamakan semula sejarah penerima. Rekod lama masih boleh disunting walaupun ahli telah dinyahaktifkan atau penerima keluarga tidak lagi dalam senarai; pilihan penerima asal ditandakan **rekod asal**. Ahli tidak aktif tidak ditawarkan untuk bantuan baharu. Semak identiti apabila ahli keluarga mempunyai nama dan tarikh lahir yang sama kerana mereka belum mempunyai ID individu berasingan.

Pentadbir dan Petugas boleh merekod serta menyunting bantuan. Hanya Pentadbir boleh **Padam** bantuan dengan menaip **PADAM**. Sandaran keselamatan keseluruhan data disimpan dalam `data/backups/sebelum-padam-bantuan-….json` sebelum pemadaman. Sejarah tindakan mencatat penciptaan, suntingan dan pemadaman bantuan. Ahli yang mempunyai rekod bantuan tidak boleh dipadam terus; gunakan **Nyahaktif** supaya sejarah bantuan kekal.

## Sandaran dan pemulihan selepas modul bantuan

Butang **Sandaran** kini menghasilkan format versi 4 yang mengandungi ahli, keluarga, semua bantuan termasuk penerima asal, senarai jenis bantuan serta permohonan pendaftaran. Hadnya 10 MB, 20,000 ahli dan 50,000 rekod bantuan. Akaun dan sejarah tindakan masih tidak dimasukkan; gunakan salinan keseluruhan folder `data` ketika pelayan dihentikan untuk sandaran sistem penuh.

Pratonton pemulihan memaparkan bilangan bantuan. Pemulihan versi terkini menggantikan ahli/keluarga, **bantuan dan jenis bantuan** bersama-sama dalam satu transaksi; jika penulisan gagal, kedua-duanya dikekalkan pada keadaan sebelumnya. Sandaran keselamatan sebelum pemulihan juga mengandungi bantuan. Jika ahli atau bantuan berubah selepas pratonton, pilih fail semula sebelum mengesahkan.

Fail versi 1 daripada versi aplikasi lama masih boleh dipulihkan jika sistem semasa belum mempunyai bantuan. Jika bantuan sudah direkodkan, pemulihan versi 1 disekat supaya rekod bantuan tidak hilang atau dipautkan kepada ahli yang salah. Gunakan fail versi 2 yang sesuai. Akaun pengguna dan sejarah tindakan tidak digantikan oleh pemulihan rekod komuniti.

## Susunan baharu maklumat bantuan

**Dalam profil ahli:** selepas maklumat keluarga, bahagian **Bantuan diterima ahli dan keluarga** memaparkan semua bantuan ahli utama, tanggungan dan isi rumah tersebut. Ia tidak terjejas oleh penapis di menu Bantuan. Ringkasan menunjukkan bilangan bantuan dan jumlah nilai RM yang direkodkan. Gunakan Lihat / edit atau Padam (Pentadbir sahaja) pada rekod berkenaan.

Untuk menambah bantuan, tekan **＋ Rekod bantuan diterima** dalam profil ahli aktif. Penerima isi rumah dikunci kepada profil yang dibuka; pilih sama ada bantuan untuk ahli utama, isi rumah atau ahli keluarga tertentu. Simpan maklumat ahli/keluarga terlebih dahulu jika senarai penerima baru berubah. Bantuan menggunakan borang dan penyimpanan berasingan: membatalkan borang maklumat ahli tidak membatalkan bantuan yang telah berjaya disimpan. Ahli baharu mesti disimpan dahulu sebelum bantuan boleh ditambah.

**Dalam menu Bantuan:** bahagian atas mengandungi senarai jenis bantuan dan borang pengurusan jenis oleh Pentadbir. Bahagian bawah mengekalkan senarai keseluruhan bantuan yang telah diterima, bersama carian, penapis tarikh/isi rumah dan ringkasan. Pendaftaran penerimaan baharu dimulakan dari profil ahli, bukannya borang umum dalam menu ini.

Pentadbir boleh menambah nama jenis, kategori, pemberi asal (pilihan), penerangan dan status. Petugas boleh melihat jenis dan memilih jenis aktif ketika merekod bantuan diterima. Maklumat pemberi asal diisi sebagai cadangan dan boleh dikemas kini mengikut agihan sebenar. Gunakan Edit jenis untuk menukar butiran atau status; jenis tidak dipadam supaya sejarah kekal. Jenis tidak aktif tidak ditawarkan untuk agihan baharu.

Nama bantuan dan kategori pada penerimaan baharu diperoleh daripada jenis yang dipilih. Nama/kategori dalam rekod penerimaan sedia ada kekal sebagai gambaran sejarah apabila jenis tersebut dinamakan semula atau dinyahaktifkan. Rekod lama tanpa pautan jenis boleh terus dilihat/disunting. Ketika naik taraf pertama, jenis daripada rekod bantuan lama diambil masuk ke senarai jenis secara automatik; tiada rekod penerimaan lama dipadam.

Sandaran format versi 3 merangkumi senarai jenis bantuan dan pautannya. Pemulihan menyemak bahawa setiap pautan jenis bantuan merujuk kepada jenis yang sah sebelum mengubah data. Fail versi 1/2 yang tidak mengandungi senarai jenis hanya boleh dipulihkan jika sistem belum mempunyai jenis bantuan; jika sudah ada, gunakan sandaran versi 3 supaya katalog tidak hilang. Untuk kembali kepada keseluruhan pemasangan lama, gunakan sandaran penuh folder data yang dibuat ketika pelayan dihentikan sebelum naik taraf. Akaun dan sejarah tindakan masih tidak digantikan oleh pemulihan JSON.

## Bilangan bantuan dalam direktori ahli

Lajur **Bantuan diterima** dalam direktori menunjukkan jumlah rekod bantuan bagi setiap ahli/isi rumah, dengan pecahan **Ahli**, **Keluarga** dan **Isi rumah**. Setiap rekod penerimaan dikira sekali mengikut jenis penerimanya. Bilangan ini bukan bilangan jenis bantuan berbeza atau kuantiti barang. Jika bantuan yang sama diterima pada dua agihan berasingan dan direkodkan dua kali, ia dikira dua rekod.

Ahli tanpa bantuan dipaparkan sebagai `0 bantuan`. Klik jumlah bantuan untuk terus membuka bahagian sejarah bantuan dalam profil ahli. Bilangan dikemas kini apabila direktori dimuatkan serta selepas penambahan, suntingan, pemadaman atau pemulihan rekod bantuan melalui aplikasi. Sejarah keluarga yang tidak lagi berada dalam senarai tanggungan tetap dikira; penapis Aktif/Tidak aktif menentukan ahli yang dipaparkan, bukan memadam sejarah bantuan.

## Laporan, CSV dan cetakan

Menu **Laporan** tersedia kepada Pentadbir sahaja. Petugas disekat pada paparan dan API laporan/eksport. Tiga laporan disediakan:

- **Senarai ahli:** maklumat hubungan, alamat, pekerjaan, umur, bilangan tanggungan dan jumlah rekod bantuan bagi ahli utama.
- **Senarai ahli keluarga:** seorang tanggungan pada setiap baris, bersama ID/nama ahli utama, hubungan, umur, pekerjaan dan pendidikan.
- **Bantuan diterima:** penerima asal, isi rumah semasa, bantuan, pemberi, tarikh, nilai RM, kuantiti, unit dan catatan.

Pilih status aktif/tidak aktif/semua, negeri, daerah dan carian. Status/negeri/daerah mengikut profil isi rumah semasa; untuk melihat keseluruhan sejarah termasuk penerima yang sudah berpindah, pilih **Semua**. Pada laporan bantuan, penapis tarikh merujuk kepada tarikh bantuan diterima dan kategori merujuk kepada kategori yang tersimpan dalam rekod sejarah. Negeri lama yang belum diasingkan daripada Alamat 1 perlu dilengkapkan dalam profil untuk padanan penapis negeri.

Tekan **Jana laporan**. Ringkasan memaparkan jumlah rekod sepadan dan bilangan isi rumah berbeza. Laporan bantuan turut memaparkan jumlah nilai RM yang telah diisi, tanpa menganggap nilai kosong sebagai sifar bantuan atau mencampurkan kuantiti barang berlainan unit. Umur dikira semasa laporan dijana, bukan umur pada tarikh bantuan.

Paparan dan cetakan terhad kepada **500 rekod pertama**. Jika hasil lebih banyak, amaran had dipaparkan dan disertakan dalam cetakan. **Muat turun CSV** mengandungi semua hasil sepadan. Untuk mencetak subset yang lebih kecil, sempitkan penapis terlebih dahulu. Menukar penapis membatalkan paparan lama dan melumpuhkan butang eksport/cetak sehingga laporan dijana semula.

Fail CSV menggunakan UTF-8 dan boleh dibuka dalam Excel. Untuk mengekalkan sifar awal pada poskod/telefon, gunakan **Data → From Text/CSV** dan tetapkan lajur tersebut sebagai **Text**, bukan nombor. Nilai yang bermula dengan corak formula seperti `=`, `+`, `-` atau `@` diberi awalan apostrof supaya tidak dijalankan sebagai formula oleh perisian hamparan; ini boleh terlihat sebagai aksara tambahan dalam sesetengah aplikasi. CSV bukan sandaran yang boleh dipulihkan melalui fungsi Pulihkan data.

Gunakan **Cetak / Simpan PDF** untuk membuka dialog cetak pelayar dan pilih pencetak atau **Save as PDF**. Cetakan hanya merangkumi hasil laporan, penapis dan masa dijana dalam waktu Malaysia, tanpa menu, borang atau butang aplikasi. Susun atur dicadangkan A4 melintang; hasil sebenar bergantung pada tetapan pelayar/pencetak.

Data laporan dicapai semasa permintaan diproses. Eksport menggunakan penapis laporan terakhir pada data terkini, jadi jana semula dahulu jika rekod berubah sejak paparan disediakan. Sejarah tindakan merekodkan penjanaan laporan dan eksport CSV, tetapi cetakan tempatan melalui pelayar tidak direkodkan sebagai tindakan pelayan. Laporan dan CSV mengandungi maklumat peribadi; simpan dan kongsikan hanya kepada pihak yang dibenarkan. Akaun, kata laluan dan hash tidak dimasukkan dalam laporan.

## Pendaftaran sendiri penduduk dan kelulusan

Akses dalam talian ditangguhkan; kemas kini ini tidak menerbitkan laman atau mengubah tetapan rangkaian. Borang pendaftaran boleh diuji pada pemasangan sedia ada melalui pautan **Daftar sebagai penduduk / Semak permohonan** di skrin log masuk, atau laluan `/daftar` pada alamat aplikasi. Dengan HOST lalai 127.0.0.1, hanya pelayar pada komputer pelayan yang sama boleh membukanya. Capaian daripada telefon/peranti lain masih memerlukan susunan rangkaian yang sesuai, yang akan disediakan kemudian.

Penduduk boleh mengisi maklumat diri, alamat, pekerjaan/pendidikan, majikan (pilihan), dan ahli keluarga tanpa log masuk. Status pekerjaan ahli dan setiap tanggungan perlu dilengkapkan. Penghantar mengesahkan ketepatan maklumat serta persetujuan semakan sebelum menekan **Hantar permohonan**. Borang dibekukan ketika permintaan berlangsung. Pemohon turut menetapkan ID pengguna (3–40 aksara) dan kata laluan (minimum 12 aksara) serta mengesahkan kata laluan. Akaun disediakan dalam keadaan tidak aktif; rekod ahli hanya diwujudkan dan akaun diaktifkan selepas kelulusan pentadbir. Kata laluan dihash, tidak dimasukkan ke dalam data borang permohonan.

Selepas dihantar, sistem memberikan kod rujukan rawak **MK-…** dan status **Menunggu semakan**. Simpan kod secara peribadi. Gunakan borang Semak status dengan kod tersebut untuk mengetahui keputusan dan catatan yang diberikan pentadbir. Semakan tidak memaparkan nama, telefon atau seluruh profil. Jika kod hilang, hubungi pentadbir; tiada carian awam melalui nama/telefon dan tiada pemberitahuan e-mel/SMS automatik.

Pentadbir membuka **Permohonan ahli** untuk melihat permohonan menunggu, diluluskan, ditolak atau semua. Semak butiran pemohon, ahli keluarga dan persetujuan. Petugas biasa tidak boleh melihat atau memutuskan permohonan. **Lulus dan daftar ahli** memasukkan ahli/keluarga ke direktori dalam transaksi yang sama dengan keputusan dan sejarah tindakan. Permohonan yang sudah diproses tidak boleh diluluskan kali kedua.

Jika nama, telefon atau ahli keluarga menyerupai rekod sedia ada, sistem memaparkan amaran. Semak identiti dahulu; pengesahan **Saya telah menyemak — lulus sebagai ahli berasingan** hanya digunakan jika ia memang individu berbeza. Untuk maklumat yang salah atau memerlukan pembetulan, tekan **Tolak permohonan** dan isi sebab. Pemohon boleh menyemak sebab melalui kod rujukan dan menghantar borang baharu. Penyuntingan permohonan oleh pemohon serta pembetulan terus dalam borang semakan belum disediakan; profil boleh dikemas kini menggunakan fungsi ahli selepas kelulusan jika sesuai.

Permintaan berulang dengan kandungan dan kunci penghantaran sama tidak mencipta dua permohonan. Had lalai ialah 20 permohonan baharu sejam bagi satu IP, 30 semakan status seminit/IP, dan 5,000 permohonan menunggu. Akaun/mesin berkongsi sambungan boleh berkongsi had IP. `REGISTRATION_MAX_PER_HOUR` boleh ditetapkan antara 1–1,000 untuk keperluan tempat pendaftaran; pendaftaran terus oleh petugas melalui direktori tetap tersedia. Ini kawalan asas, bukan pengesahan telefon atau perlindungan CAPTCHA.

Keputusan pendaftaran berbeza daripada status keahlian semasa. Permohonan yang pernah diluluskan kekal diluluskan walaupun ahli kemudian dinyahaktifkan. Memadam ahli tidak memadam permohonan asal; pautan ID ahli dikosongkan dan maklumat permohonan/keputusan dikekalkan sebagai sejarah. Semakan menggunakan data yang dihantar, bukan bukti identiti yang disahkan secara automatik.

### Sandaran permohonan

Sandaran JSON versi 5 turut mengandungi permohonan, persetujuan, kod rujukan, keputusan dan pautan ahli. Fail ini mesti dilindungi kerana mengandungi maklumat peribadi serta kod semakan. Pemulihan menyemak data dan pautan terlebih dahulu, kemudian menggantikan rekod komuniti serta permohonan dalam satu transaksi. Had fail kekal 10 MB; maksimum 20,000 permohonan dalam sandaran.

Sandaran versi lama yang tiada permohonan boleh dipulihkan hanya apabila sistem semasa belum mempunyai permohonan. Jika sudah ada, gunakan sandaran versi 5 supaya permohonan tidak hilang. Sandaran penuh SQLite turut merangkumi jadual ini secara automatik. Akaun dan audit tidak digantikan melalui pemulihan JSON.

## Pengesahan dan proses log keluar

Butang **Log keluar** kini membuka dialog pengesahan dahulu. **Batal** mengekalkan sesi. **Ya, log keluar** menghantar permintaan, memaparkan **Sedang log keluar…**, dan mengunci butang, medan, navigasi serta penutupan dialog sementara menunggu pelayan. Klik atau penghantaran berulang diabaikan.

Jika pelayan memberikan ralat, dialog memaparkan mesej dan dibuka semula untuk mencuba lagi; sistem tidak mendakwa log keluar berjaya ketika permintaan belum disahkan. Selepas berjaya, sesi dipadam, skrin log masuk dipaparkan dan pemberitahuan **Anda telah log keluar** ditunjukkan. Jika sesi sudah tamat, pengguna dimaklumkan bahawa sesi telah tamat dan telah log keluar. Simpan perubahan borang terlebih dahulu.

## Portal ahli: semua perubahan memerlukan kelulusan

Selepas pendaftaran diluluskan, ahli log masuk di skrin utama menggunakan ID dan kata laluan yang dipilih semasa memohon. **Profil saya** hanya memaparkan maklumat diri, keluarga dan bantuan isi rumah sendiri. Ahli tidak mempunyai akses kepada direktori komuniti, akaun, laporan atau sandaran. Ahli keluarga kekal sebagai tanggungan; tiada akaun berasingan secara automatik.

Profil dipaparkan berkunci dan butang penghantaran disembunyikan secara lalai. Tekan **Kemaskini** untuk membuka borang serta memaparkan **Hantar untuk kelulusan**. Butang penghantaran hanya boleh ditekan selepas terdapat perubahan pada borang. **Batal kemaskini** memulihkan paparan rekod rasmi dan mengunci borang. Selepas permohonan dihantar, profil dikunci semula; permohonan yang masih menunggu semakan perlu diputuskan dahulu sebelum perubahan profil seterusnya. Penambahan atau pemadaman ahli keluarga juga memerlukan kelulusan. Borang serta navigasi dikunci semasa penghantaran. Rekod rasmi kekal; bahagian status memaparkan cadangan dihantar, keputusan dan catatan. Hanya satu permohonan perubahan boleh menunggu semakan bagi setiap akaun. Jika ditolak, betulkan borang berdasarkan catatan dan hantar semula.

Pentadbir membuka **Semakan perubahan**, membandingkan rekod rasmi dengan cadangan (medan berbeza ditandakan), kemudian meluluskan atau menolak dengan sebab. Semakan pendua turut merangkumi ahli keluarga. Jika rekod rasmi telah berubah sejak penghantaran atau ahli tidak lagi aktif/dipautkan kepada akaun sama, kelulusan dihalang; tolak dengan sebab dan minta penghantaran semula. Rekod hanya berubah apabila kelulusan, audit dan notifikasi selesai dalam satu transaksi. Petugas tidak boleh meluluskan perubahan daripada portal. Penyuntingan terus oleh pentadbir/petugas melalui direktori mengekalkan aliran pengurusan sedia ada.

Permohonan lama tanpa ID/kata laluan masih boleh disemak. Untuk ahli sedia ada, pentadbir membuka **Akaun pengguna → Tambah pengguna**, memilih peranan **Ahli**, dan memautkan rekod ahli aktif yang belum mempunyai akaun. Untuk akaun yang kehilangan pautan selepas pemulihan sandaran lama, gunakan **Pautkan ahli**, pilih rekod yang telah disahkan dan masukkan kata laluan pentadbir. Pemautan memutuskan sesi akaun tersebut; status aktif akaun masih diurus berasingan. Jangan memaut berdasarkan nombor ID sahaja tanpa menyemak identiti. Ahli yang dinyahaktifkan tidak boleh menggunakan portal walaupun akaunnya masih aktif.

## Aktiviti, hebahan dan pertanyaan

Dalam **Aktiviti & hebahan**, Pentadbir/Petugas boleh menambah pengumuman atau aktiviti dengan tarikh/masa serta lokasi. Masa menggunakan Malaysia. Pilih Draf untuk menyimpan tanpa dipaparkan kepada ahli; edit siaran dan ubah status untuk menariknya daripada paparan ahli. Siaran baharu yang diterbitkan menghasilkan notifikasi; pilihan beritahu semula digunakan bagi perubahan siaran sedia ada. Kalendar menggunakan nama hari penuh dan menyenaraikan aktiviti pada setiap hari dari tarikh mula hingga tarikh tamat, termasuk aktiviti yang merentas bulan. Gunakan **Bulan sebelum / Bulan selepas** atau pemilih bulan. Hari beraktiviti disorot kuning dengan tajuk hijau yang boleh ditekan untuk melihat butiran; tarikh hari ini dibulatkan biru. Pada telefon, kalendar boleh dileret mendatar untuk mengekalkan nama hari penuh.

**Pertanyaan** membolehkan ahli menghantar soalan dan menerima balasan Pentadbir/Petugas. Ahli hanya melihat pertanyaan sendiri; semua petugas dan pentadbir boleh melihat serta menjawabnya. Petugas boleh menutup atau membuka semula pertanyaan. Mesej tidak mengubah profil atau rekod bantuan, dan tidak memerlukan kelulusan profil.

**Notifikasi** memaparkan 100 pemberitahuan terkini dan bilangan belum dibaca. Tandakan satu atau semua sebagai dibaca. Bilangan dikemas kini ketika membuka menu dan sekitar setiap seminit apabila aplikasi aktif. Ini pemberitahuan dalam sistem sahaja; tiada SMS, e-mel atau pemberitahuan telefon di luar aplikasi.

## Sandaran portal dan naik taraf

Hentikan aplikasi dan sandarkan seluruh folder `data` sebelum menggantikan fail aplikasi. Salin semua fail baharu termasuk `community.js`, `migrations.js`, `accounts.js` dan seluruh `public`. Mulakan semula menggunakan Node.js 24; naik taraf jadual adalah automatik dan kata laluan asal dikekalkan.

JSON versi 5 turut menyimpan pengumuman, aktiviti dan ID pengguna yang diminta pada permohonan pendaftaran. Ia tidak mengandungi hash/kata laluan akaun, permohonan perubahan profil, mesej/pertanyaan, notifikasi atau audit. Jadual ini kekal pada pemasangan semasa ketika pemulihan JSON; **sandaran penuh SQLite/folder data diperlukan untuk pemindahan dan pemulihan lengkap portal**. Pada komputer baharu, permohonan pendaftaran yang dipulihkan melalui JSON sahaja tidak boleh mengaktifkan akaun asal tanpa data akaun; gunakan sandaran penuh, atau tolak permohonan lama dan minta pemohon memohon semula.

Pautan akaun kepada ahli dikekalkan semasa pemulihan JSON baharu menggunakan identiti rekod yang stabil. Jika rekod asal tiada atau sandaran lama tiada identiti stabil, pautan dikosongkan untuk mengelakkan akaun terbuka kepada individu lain apabila nombor ID digunakan semula. Pentadbir boleh memautkan semula selepas semakan identiti. Sesi ahli ditamatkan selepas pemulihan. Sandaran lama tanpa hebahan/aktiviti tidak diterima apabila siaran sudah wujud.

Akses awam masih ditangguhkan. Dengan tetapan lalai, uji semua peranan melalui pelayar pada komputer sama; gunakan tetingkap peribadi atau pelayar berlainan untuk sesi pentadbir dan ahli.

## Bantuan diisi sendiri oleh ahli

Di **Profil saya**, tekan **Tambah maklumat bantuan** atau **Kemaskini bantuan** pada rekod isi rumah sendiri. Pilih jenis bantuan aktif daripada senarai, atau isi nama/kategori sendiri jika belum disenaraikan. Lengkapkan pemberi, penerima (ahli, keluarga atau isi rumah), tarikh sudah diterima serta nilai RM atau kuantiti dengan unit. Borang dikunci ketika penghantaran. Bantuan ini ialah rekod bantuan diterima, bukan permohonan mendapatkan bantuan baharu.

Maklumat dihantar sebagai **permohonan maklumat bantuan**. Penambahan belum muncul dalam rekod rasmi dan kemaskini belum menggantikan nilai asal sehingga diluluskan. Status serta catatan boleh dilihat di bawah rekod bantuan. Hanya satu kemaskini boleh menunggu semakan bagi rekod bantuan sama; permohonan berulang dengan data sama tidak mencipta permohonan tambahan.

Pentadbir membuka **Semakan perubahan → Permohonan maklumat bantuan**, menyemak cadangan dan rekod rasmi semasa (untuk kemaskini), kemudian meluluskan atau menolak dengan sebab. Sistem menyemak padanan bantuan berganda, penerima keluarga dan perubahan pada rekod sejak penghantaran. Petugas dan ahli tidak boleh meluluskan permohonan. Keputusan dihantar sebagai notifikasi kepada ahli.

Sandaran JSON masih versi 5 dan merangkumi bantuan rasmi yang telah diluluskan. Jadual permohonan maklumat bantuan, sama seperti permohonan perubahan profil, memerlukan **sandaran penuh SQLite/folder data** untuk pemindahan lengkap. Selepas pemulihan JSON, permohonan kemaskini bantuan lama yang hilang pautan rekod mesti ditolak dengan catatan dan dihantar semula; ini menghalang kelulusan kepada rekod lain yang menggunakan nombor ID sama. Semasa menaik taraf, salin juga `aid-requests.js` dan `public/portal-aid.js` bersama fail lain.

### Pengesahan sebelum penghantaran ahli

Selepas ahli menekan **Hantar untuk kelulusan** pada borang profil/keluarga atau maklumat bantuan, dialog pengesahan meminta ahli memastikan maklumat tepat dan lengkap. **OK** meneruskan penghantaran untuk semakan pentadbir. **Batal** mengekalkan suntingan pada borang tanpa menghantar permohonan, supaya ahli boleh menyemaknya semula. Borang dikunci semasa permintaan penghantaran sebenar berlangsung.

**Batal kemaskini** pada profil kini butang berwarna jingga, berbeza daripada butang Kemaskini dan butang penghantaran hijau. Butang ini membuang suntingan yang belum dihantar, memaparkan semula rekod rasmi dan mengunci profil.

## Papan pemuka mengikut peranan

Selepas log masuk atau memuat semula aplikasi, **Papan pemuka** menjadi paparan pertama. Menu **Ahli & isi rumah** dan **Profil saya** kekal tersedia untuk rekod terperinci.

Pentadbir melihat bilangan pendaftaran, perubahan profil dan maklumat bantuan yang menunggu semakan. Tekan kad untuk membuka senarai berkaitan; kad pendaftaran memilih status menunggu semakan secara automatik. Pautan maklumat bantuan terus membawa pentadbir ke bahagian semakan bantuan. Ringkasan komuniti menunjukkan ahli aktif, ahli tidak aktif dan keluarga isi rumah aktif.

Ahli melihat bilangan permohonan profil/bantuan sendiri yang menunggu semakan, bilangan keputusan diluluskan/ditolak dan lima keputusan terkini berserta catatan. Ringkasan keluarga dan bantuan hanya merujuk kepada isi rumah sendiri. Papan pemuka ahli tidak memaparkan jumlah permohonan atau rekod milik penduduk lain.

Semua peranan melihat bilangan notifikasi sendiri yang belum dibaca, pertanyaan terbuka yang dibenarkan mengikut akses, lima aktiviti akan datang atau sedang berlangsung, dan tiga hebahan terkini yang telah disiarkan. Aktiviti tamat dan siaran draf tidak dipaparkan. **Lihat dalam kalendar** memilih bulan aktiviti dan membuka butiran berkaitan. Petugas tidak melihat kad kelulusan yang dikhaskan kepada pentadbir.

Ringkasan dikemas kini semasa membuka Papan pemuka atau menekan **Muat semula ringkasan**; masa kemas kini dipaparkan dalam waktu Malaysia. Untuk menaik taraf, salin juga `dashboard.js` dan `public/dashboard-ui.js` bersama fail aplikasi lain, kemudian mulakan semula pelayan. Tiada jadual data baharu diperlukan untuk papan pemuka.
