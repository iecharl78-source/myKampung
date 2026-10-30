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
