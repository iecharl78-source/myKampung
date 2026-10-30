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

1. Log masuk menggunakan kata laluan yang baru ditetapkan.
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

Semasa mendaftar atau mengemas kini ahli, sistem menyemak padanan nama atau telefon dengan ahli utama lain. Nama dibandingkan tanpa perbezaan huruf besar/kecil, ruang atau tanda baca. Telefon Malaysia dalam format `012…`, `+6012…` atau `006012…` dibandingkan sebagai nombor yang sama. Ini bukan pengesahan identiti dan tidak mengesan semua variasi ejaan nama atau pendua dalam senarai tanggungan keluarga.

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
