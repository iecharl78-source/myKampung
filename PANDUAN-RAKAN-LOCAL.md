# Panduan rakan: jalankan myKampung pada komputer sendiri

Panduan ini menyediakan pemasangan baharu untuk mencuba sistem menggunakan data rekaan. Anda tidak memerlukan VPS, domain, Docker atau akaun hosting. Sistem dibuka dalam pelayar, tetapi Node.js mesti berjalan pada komputer yang sama.

## 1. Dapatkan fail aplikasi

1. Buka [repositori myKampung](https://github.com/iecharl78-source/myKampung).
2. Tekan **Code → Download ZIP**. Jika repositori memerlukan kebenaran akses, minta pemilik berkongsi ZIP kod aplikasi sahaja.
3. Klik kanan ZIP → **Extract All / Ekstrak semua**. Jangan jalankan fail terus dari dalam ZIP.
4. Letakkan aplikasi, contohnya dalam `D:\myKampung`. Buka folder yang benar-benar mempunyai `server.js`, `package.json`, folder `public` dan folder `scripts`. ZIP GitHub kadangkala menghasilkan folder bersarang seperti `myKampung-main\myKampung-main`; gunakan folder yang mempunyai fail tersebut.

Pemilik boleh berkongsi kod yang dimuat turun daripada GitHub. Untuk percubaan rakan, jangan sertakan folder `data`, folder `backups`, fail sandaran `.sqlite`/JSON, fail `.env` atau kata laluan pemilik. Pemasangan rakan akan mempunyai akaun dan data sendiri. Rekod tidak disegerakkan antara kedua-dua komputer.

## 2. Sediakan Node.js 24 LTS atau lebih baharu

Muat turun daripada [nodejs.org](https://nodejs.org/en/download). Pilih versi untuk sistem operasi dan jenis pemproses komputer anda.

### Windows: pilih salah satu cara

| Cara | Langkah |
| --- | --- |
| Pemasang biasa | Pasang Windows Installer, kemudian buka semula PowerShell. Jalankan `node --version`; nombor utama mesti 24 atau lebih baharu. |
| Standalone / portable | Muat turun **Windows Binary (.zip)** dan ekstrak. Cari fail **node.exe** sebenar. Folder sahaja tidak boleh dijalankan sebagai program. |

Node.js dan aplikasi boleh diletakkan pada pemacu luar. Kekalkan sambungan pemacu sepanjang aplikasi berjalan dan gunakan huruf pemacu yang betul. Aplikasi tidak memerlukan arahan `npm install`.

## 3. Buka PowerShell dalam folder aplikasi (Windows)

Buka folder aplikasi dalam File Explorer, taip `powershell` pada bar alamat dan tekan Enter. Atau buka PowerShell dan jalankan:

```powershell
Set-Location 'D:\myKampung'
Test-Path '.\server.js'
```

Gantikan laluan mengikut folder sebenar. `Test-Path` mesti memaparkan **True**.

Tetapkan lokasi Node.js mengikut cara yang dipilih.

**Jika menggunakan pemasang biasa:**

```powershell
$nodePath = (Get-Command node.exe).Source
& $nodePath --version
```

**Jika menggunakan standalone / portable:**

```powershell
$nodePath = 'E:\Node\node.exe'
Test-Path $nodePath
& $nodePath --version
```

Gantikan `E:\Node\node.exe` dengan laluan sebenar. Jika pengekstrakan menghasilkan folder bersarang, masukkan keseluruhan laluan hingga **node.exe**. `Test-Path` mesti **True**, dan versi Node.js mesti 24 atau lebih baharu.

`$nodePath` hanya wujud dalam tetingkap PowerShell itu. Tetapkan semula apabila membuka tetingkap baharu.

## 4. Cipta pentadbir dan mulakan aplikasi kali pertama

Masih dalam folder aplikasi dan tetingkap PowerShell yang sama:

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:COOKIE_SECURE = '0'
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Cipta kata laluan pentadbir sendiri (minimum 12 aksara)' -AsSecureString)).Password
& $nodePath server.js
```

Masukkan kata laluan sendiri apabila diminta. Aksara disembunyikan semasa menaip. Jangan salin kata laluan pemilik sistem; tiada kata laluan lalai.

Apabila terminal memaparkan **myKampung berjalan pada port 3000**, biarkan tetingkap itu terbuka. Node.js mungkin memaparkan amaran `ExperimentalWarning` untuk SQLite; jika mesej pelayan berjalan turut dipaparkan, amaran itu sahaja tidak bermakna aplikasi gagal.

Folder `data` dan pangkalan data akan dicipta secara automatik dalam folder aplikasi jika DATA_DIR tidak ditetapkan. Untuk pemasangan baharu ini, tidak perlu menyalin folder data daripada komputer lain.

## 5. Buka sistem dalam pelayar

Buka Chrome, Edge atau Firefox dan masukkan:

**http://127.0.0.1:3000**

Log masuk menggunakan:

- **Nama pengguna:** `admin`
- **Kata laluan:** kata laluan yang anda cipta pada langkah 4.

Papan pemuka sepatutnya memaparkan ringkasan kosong untuk pemasangan baharu. Buka **Ahli & isi rumah → Daftar ahli** untuk mencuba data rekaan.

Untuk mencuba pendaftaran penduduk, buka:

**http://127.0.0.1:3000/daftar**

Gunakan tetingkap peribadi / Incognito / InPrivate atau pelayar berlainan untuk menguji akaun ahli dan pentadbir serentak. Tab biasa dalam pelayar sama lazimnya berkongsi sesi log masuk.

## 6. Cuba aliran asas

1. Dalam tetingkap peribadi, buka `/daftar`, isi maklumat rekaan, pilih ID pengguna/kata laluan ahli dan simpan kod rujukan permohonan.
2. Dalam sesi pentadbir, buka **Permohonan ahli**, semak maklumat dan luluskan.
3. Dalam tetingkap peribadi, log masuk menggunakan akaun ahli tadi. Buka **Profil saya → Kemaskini**, ubah maklumat dan tekan **Hantar untuk kelulusan**. Sahkan dialog penghantaran.
4. Pentadbir membuka **Semakan perubahan** dan meluluskan atau menolak dengan sebab. Semak status dan notifikasi dalam akaun ahli.
5. Cuba tambah maklumat bantuan diterima menggunakan tarikh yang sudah berlalu; pentadbir meluluskan maklumat itu sebelum menjadi rekod rasmi.
6. Pentadbir menambah aktiviti/hebahan dan ahli melihat kalendar. Cuba pertanyaan serta balasan menggunakan kedua-dua sesi.
7. Pentadbir boleh mencipta akaun **Petugas** melalui **Akaun pengguna** untuk menguji peranan ketiga.

Langkah penggunaan terperinci: [MANUAL-PENGGUNA.md](MANUAL-PENGGUNA.md).

## 7. Hentikan dan buka semula

**Hentikan:** tekan `Ctrl+C` dalam PowerShell yang menjalankan pelayan. Tutup tab pelayar sahaja tidak menghentikan Node.js. Rekod yang telah disimpan kekal dalam pangkalan data.

**Buka semula:** buka PowerShell dalam folder aplikasi yang sama, tetapkan `$nodePath` seperti langkah 3, kemudian:

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:COOKIE_SECURE = '0'
& $nodePath server.js
```

Tidak perlu menetapkan ADMIN_PASSWORD lagi untuk pangkalan data sedia ada. Kata laluan asal dikekalkan; menetapkan ADMIN_PASSWORD baharu tidak menukar kata laluan sedia ada. Log masuk semula pada `http://127.0.0.1:3000`.

Jika menggunakan DATA_DIR khas, tetapkan folder yang sama setiap kali memulakan aplikasi. Jangan padam folder `data` untuk menyelesaikan masalah log masuk.

## 8. Sandaran dan kemas kini

Pentadbir membuka **Papan pemuka → Sandaran penuh sistem**, mengesahkan kata laluan dan menyimpan fail SQLite yang dimuat turun. Salin ke pemacu lain. Ia merangkumi akaun, permohonan dan mesej; sandaran rekod JSON sahaja tidak merangkumi semua jadual.

Untuk menaik taraf: hentikan pelayan, sandarkan data, ekstrak kod baharu ke folder sementara, kemudian gantikan fail aplikasi termasuk seluruh `public` dan `scripts`. Kekalkan folder `data` asal. Mulakan semula dan tekan `Ctrl+F5` dalam pelayar.

Jika mahu memindahkan data sebenar dengan kebenaran pemilik, gunakan **sandaran penuh** dan langkah pemulihan ke folder baharu dalam [PANDUAN-TEMPATAN.md](PANDUAN-TEMPATAN.md#sandaran-penuh-dan-latihan-pemulihan-tempatan). Pemulihan membawa akaun serta kata laluan daripada sandaran; ia bukan pemasangan kosong dengan kata laluan baharu.

## 9. macOS atau Linux

Pasang Node.js 24 atau lebih baharu yang sesuai. Ekstrak kod aplikasi dan buka Terminal dalam folder yang mempunyai `server.js`.

Jalankan menggunakan Bash:

```bash
node --version
read -rs -p 'Cipta kata laluan pentadbir sendiri (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
HOST=127.0.0.1 PORT=3000 COOKIE_SECURE=0 node server.js
```

Jika menggunakan zsh, jalankan `bash` dahulu untuk arahan `read` di atas. Kemudian buka `http://127.0.0.1:3000`. Hentikan dengan `Ctrl+C`. Untuk mula semula, masuk folder yang sama dan jalankan `HOST=127.0.0.1 PORT=3000 COOKIE_SECURE=0 node server.js`; kata laluan sedia ada dikekalkan.

## 10. Penyelesaian masalah ringkas

| Masalah | Tindakan |
| --- | --- |
| `node` tidak dikenali | Gunakan laluan penuh `node.exe` melalui `$nodePath`, atau buka semula PowerShell selepas pemasangan Node.js. |
| `The term ... is not recognized` | Pastikan laluan berakhir dengan `node.exe`, bukan nama folder. Gunakan `& $nodePath server.js`. |
| `Cannot find module ... server.js` | Masuk folder aplikasi yang mempunyai `server.js`; pastikan ZIP telah diekstrak. |
| `node:sqlite` tidak tersedia | Semak `--version`; gunakan Node.js 24 atau lebih baharu. |
| Port 3000 digunakan / `EADDRINUSE` | Hentikan salinan aplikasi yang lain. Atau tetapkan `$env:PORT = '3001'`, jalankan semula dan buka `http://127.0.0.1:3001`. |
| Laman tidak boleh dibuka | Pastikan terminal masih menjalankan pelayan dan port pada alamat pelayar sepadan. Cuba `http://127.0.0.1:3000/healthz`; pelayan yang berjalan memaparkan `{"ok":true}`. |
| Tidak boleh log masuk | Gunakan `admin` dan kata laluan yang ditetapkan pada pemasangan ini. Jika data dipulihkan, gunakan akaun/kata laluan daripada sandaran. Selepas lima percubaan gagal, tunggu 15 minit. |
| Paparan masih versi lama | Tekan `Ctrl+F5`; pastikan semua fail baharu termasuk folder `public` dan `scripts` telah disalin. |
| Ralat berkaitan production / HTTPS pada percubaan tempatan | Dalam PowerShell percubaan baharu, jalankan `$env:NODE_ENV = 'development'` dan `Remove-Item Env:PUBLIC_ORIGIN -ErrorAction SilentlyContinue`, kemudian ulang arahan tempatan. Tetapan ini hanya untuk percubaan pada komputer sendiri. |
| Data kelihatan kosong selepas mula semula | Semak folder aplikasi dan DATA_DIR; kemungkinan anda membuka pangkalan data berbeza. Jangan padam data asal. |

**Alamat 127.0.0.1 merujuk komputer yang sedang digunakan.** Rakan tidak boleh membuka sistem pada komputer anda hanya dengan menyalin alamat itu. Panduan ini menjalankan salinan sistem pada komputer beliau sendiri. Tetapan lalai tidak membuka akses dari telefon/peranti lain atau internet. Selepas fail aplikasi dan Node.js diperoleh, fungsi utama tempatan tidak memerlukan sambungan internet; pautan luar seperti laman Pos Malaysia memerlukannya.
