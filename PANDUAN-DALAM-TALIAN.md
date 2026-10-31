# myKampung melalui telefon dan komputer

Pakej ini menyediakan satu aplikasi Node.js/SQLite, Caddy untuk HTTPS, dan sandaran penuh berjadual menggunakan Docker Compose. Fail dalam repositori ialah konfigurasi pemasangan; memuat turunnya atau menerbitkan persekitaran Codex tidak menjadikan laman web awam.

## Pilihan hosting

Untuk komuniti kecil, mulakan dengan VPS Linux yang mempunyai sekurang-kurangnya 2 GB RAM dan storan SSD 20 GB. Pilih pusat data Malaysia atau Singapura yang sesuai dengan keperluan organisasi; DigitalOcean atau Vultr ialah contoh penyedia yang boleh dibandingkan. Semak harga, caj sandaran dan lokasi semasa terus dengan penyedia. Pakej ini memerlukan Docker Engine dan Docker Compose v2; hosting yang hanya menyokong PHP atau storan sementara tidak mencukupi untuk konfigurasi ini.

Keperluan sebelum penerbitan:

- VPS Ubuntu 24.04 LTS atau Linux lain yang disokong Docker, dengan akses pentadbiran melalui SSH.
- Domain/subdomain, contohnya `kampung.domain-anda.com`, dengan rekod DNS A menunjuk kepada IP VPS. Tambah AAAA hanya jika IPv6 VPS memang disediakan.
- Port TCP 80 dan 443 terbuka untuk Caddy dan pengesahan sijil. Hadkan SSH kepada akses pentadbiran yang diperlukan. Port aplikasi 3000 **tidak** diterbitkan.
- Docker Engine/Compose dipasang mengikut panduan rasmi: https://docs.docker.com/engine/install/ubuntu/ dan https://docs.docker.com/compose/install/ .

SSL/TLS awam akan diuruskan Caddy selepas DNS dan port betul. Tiada keperluan membeli sijil berasingan untuk konfigurasi lalai ini. Pembelian hosting/domain dan pemilihan pelan dibuat oleh pemilik sistem.

## 1. Letakkan aplikasi pada VPS

Muat turun ZIP terkini dari GitHub dan pindahkan melalui SCP/SFTP ke VPS. Ekstrak ke folder khusus, contohnya `/srv/mykampung`, supaya folder itu mengandungi `compose.yaml`, `Dockerfile`, `server.js`, `public`, `scripts` dan `deploy`. Jika repositori boleh diakses terus daripada VPS, Git juga boleh digunakan. Jangan letakkan folder aplikasi atau pangkalan data dalam direktori web awam.

Semua arahan berikut dijalankan dari folder aplikasi pada VPS:

```bash
cd /srv/mykampung
docker version
docker compose version
cp deploy/env.example .env
chmod 600 .env
```

Edit `.env` menggunakan editor VPS dan gantikan contoh dengan maklumat anda:

```dotenv
DOMAIN=kampung.domain-anda.com
ACME_EMAIL=pentadbir@domain-anda.com
```

DOMAIN ialah hostname sahaja, tanpa `https://`, port atau laluan. E-mel digunakan untuk pendaftaran sijil Caddy. Jangan masukkan kata laluan pentadbir ke dalam fail ini atau GitHub.

```bash
docker compose config --quiet
docker compose build app
```

## 2. Pilih pemasangan baharu atau pindahkan sistem sedia ada

### A. Pemasangan kosong

Tetapkan kata laluan melalui prompt Bash supaya nilainya tidak ditulis dalam sejarah arahan:

```bash
read -rs -p 'Kata laluan pentadbir pertama (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
docker compose run --rm --no-deps -e ADMIN_PASSWORD app node scripts/bootstrap-admin.js
unset ADMIN_PASSWORD
```

Arahan ini mencipta akaun `admin` jika belum ada. Ia tidak menetapkan semula kata laluan akaun sedia ada. Kata laluan awal hanya dibekalkan kepada proses penciptaan, bukan perkhidmatan berjalan biasa.

### B. Pindahkan sistem daripada external hard drive

1. Hentikan Node.js lama dengan Ctrl+C. Jangan gunakan kedua-dua salinan serentak ketika pemindahan.
2. Buat satu salinan keseluruhan folder `data` pada komputer anda. Folder ini mengandungi rekod, akaun, hash kata laluan, sejarah tindakan dan sandaran setempat. Lindungi salinan ini.
3. Pindahkan folder data melalui SCP/SFTP ke lokasi persendirian VPS, contohnya `/srv/mykampung-import/data`. Kekalkan fail SQLite serta fail `-wal`/`-shm` jika ada.
4. Sebelum menghidupkan perkhidmatan, jalankan arahan di bawah. Ia hanya dibenarkan apabila pangkalan data sasaran belum wujud, supaya data pelayan yang sudah digunakan tidak ditimpa:

```bash
docker compose run --rm --no-deps --user 0 \
  --volume /srv/mykampung-import/data:/import:ro \
  app sh -c 'test ! -f /app/data/kampung.sqlite && cp -a /import/. /app/data/ && chown -R 1000:1000 /app/data'
```

Jangan jalankan penciptaan akaun kosong jika anda sedang memindahkan pangkalan data lama. Akaun dan kata laluan lama dikekalkan. Simpan salinan sumber sehingga semakan pemindahan selesai; uruskan salinan sementara VPS dengan selamat selepas itu.

## 3. Hidupkan dan semak

```bash
docker compose up -d --wait --wait-timeout 120
docker compose ps
docker compose logs --tail=50 app web backup
```

Caddy memerlukan DNS/port yang betul sebelum sijil HTTPS awam boleh dikeluarkan. Jika ia gagal, semak rekod DNS, firewall penyedia dan konflik perkhidmatan pada port 80/443. `docker compose up --wait` sahaja tidak membuktikan sijil awam sudah berjaya; semak pelayar.

Buka `https://` diikuti DOMAIN anda melalui komputer dan telefon. Pastikan pelayar menerima sijil tanpa amaran. Log masuk sebagai `admin` atau akaun lama yang dipindahkan. Cuba dengan data rekaan dahulu:

- Semak profil, keluarga dan sejarah bantuan sedia ada jika melakukan pemindahan.
- Simpan satu rekod ujian dan semak melalui peranti kedua. Borang perlu menunjukkan proses simpan dan dibekukan ketika permintaan berlangsung.
- Pastikan Petugas tidak mempunyai akses pengurusan akaun, laporan, sandaran atau pemadaman ahli utama.
- Jalankan `docker compose restart app`, log masuk semula dan pastikan rekod kekal. Sesi log masuk sengaja tidak disimpan merentas mula semula.
- Semak `docker compose logs backup` untuk mesej sandaran penuh berjaya dan semak bahawa fail sandaran boleh dipulihkan di persekitaran ujian.

`/healthz` hanya memulangkan status ringkas tanpa data peribadi. Ia digunakan Docker untuk memeriksa aplikasi dan capaian SQLite; ia tidak mengesahkan DNS, sijil awam, kebenaran pengguna atau kebolehpulihan sandaran.

## 4. Data, sandaran dan penyelenggaraan

Docker named volumes menyimpan pangkalan data, sandaran penuh dan konfigurasi/sijil Caddy secara berasingan daripada imej aplikasi. `docker compose down` tidak memadam volumes. **Jangan gunakan `docker compose down -v` pada sistem sebenar** kerana ia memadam data dan sijil yang disimpan.

Perkhidmatan `backup` mengambil sandaran penuh SQLite semasa aplikasi berjalan, menyemak `quick_check`, dan menyimpan tujuh fail yang telah disahkan. Sandaran dibuat ketika perkhidmatan bermula dan kemudian setiap 24 jam. Ia menggunakan SQLite backup API untuk membaca data WAL secara konsisten; jangan menggantikannya dengan salinan fail SQLite yang sedang ditulis. Fail akhir adalah pangkalan data tunggal, termasuk akaun dan sejarah tindakan.

Untuk sandaran manual tambahan:

```bash
docker compose exec backup node scripts/backup-full.js
docker compose exec backup ls -l /backups
```

Untuk menyalin sandaran ke folder persendirian pada VPS, pilih nama fail yang telah disahkan daripada senarai tersebut:

```bash
mkdir -p /srv/mykampung-private-backups
chmod 700 /srv/mykampung-private-backups
docker compose cp backup:/backups/NAMA-FAIL.sqlite /srv/mykampung-private-backups/
chmod 600 /srv/mykampung-private-backups/NAMA-FAIL.sqlite
```

Gantikan NAMA-FAIL dengan nama sebenar. Muat turun melalui SCP/SFTP ke storan selamat yang berasingan daripada VPS, dan gunakan penyulitan yang sesuai. Tujuh salinan pada VPS yang sama tidak melindungi daripada kehilangan keseluruhan VPS. Fail SQLite penuh mengandungi hash kata laluan dan maklumat peribadi; jangan kongsi melalui pautan awam atau muat naik ke GitHub. Sandaran JSON dalam aplikasi tetap tersedia untuk pemulihan rekod komuniti sahaja.

### Memulihkan sandaran penuh

Lakukan dahulu pada pemasangan ujian yang berasingan. Hentikan semua perkhidmatan sebelum menggantikan pangkalan data. Jangan menimpa fail SQLite yang sedang dibuka aplikasi. Simpan salinan penuh keadaan sasaran sebelum melakukan pemulihan.

Cara paling mudah ialah menggunakan folder aplikasi/pemasangan Docker yang baharu dengan volumes yang kosong, letakkan fail sandaran penuh yang disahkan sebagai `kampung.sqlite` dalam folder import persendirian, kemudian ikuti langkah 2B. Mulakan aplikasi dan semak akaun, bilangan ahli, bantuan dan audit. Kaedah ini mengekalkan pemasangan asal untuk kembali semula jika perlu. Domain/port baharu atau ujian tempatan diperlukan supaya kedua-dua pemasangan tidak bertembung. Fail SQLite penuh tidak dimuat naik melalui borang Pulihkan data JSON.

### Mengemas kini aplikasi

Ambil sandaran penuh dan salin ke tempat selamat terlebih dahulu. Gantikan fail aplikasi dengan versi baharu sambil mengekalkan `.env` dan volumes. Kemudian:

```bash
docker compose build app
docker compose up -d --force-recreate --wait --wait-timeout 120
docker compose ps
```

Perkhidmatan sandaran perlu dicipta semula bersama aplikasi supaya menggunakan skrip versi baharu. Jika pembinaan gagal, imej/perkhidmatan lama tidak perlu dipadam. Selepas kemas kini, semak log masuk, satu rekod ahli, bantuan, laporan dan fail sandaran. Untuk kembali kepada versi lama yang tidak serasi dengan migrasi baharu, gunakan sandaran penuh sebelum kemas kini pada pemasangan berasingan, bukan sekadar menukar fail program.

## Tetapan teknikal penting

- App berjalan sebagai pengguna tanpa root, dengan root filesystem baca sahaja. Hanya volume data boleh ditulis; port 3000 tidak dipetakan ke host.
- Caddy mengurus HTTPS dan menetapkan `X-Real-IP` sendiri. Aplikasi mempercayainya hanya kerana `TRUST_PROXY=1` dan port aplikasi berada dalam rangkaian backend tertutup. Jangan dedahkan port app apabila tetapan itu digunakan.
- `PUBLIC_ORIGIN` ditetapkan daripada domain untuk semakan Origin borang. `COOKIE_SECURE=1` memastikan kuki sesi hanya dihantar melalui HTTPS. Mod production menolak permulaan jika dua tetapan ini tidak lengkap.
- Jika menggunakan CDN/load balancer lain di hadapan Caddy, konfigurasi kepercayaan IP perlu disemak semula; jangan terus mempercayai sebarang pengepala IP yang dibekalkan pengguna.
- `restart: unless-stopped` menghidupkan semula proses yang keluar. Status Docker unhealthy perlu dipantau; ia bukan perkhidmatan pemantauan atau jaminan mula semula bagi proses yang tergantung.
- Gunakan satu instance aplikasi sahaja untuk susunan SQLite ini. Penskalaan berbilang pelayan, penghantaran e-mel/SMS dan pendaftaran awam penduduk belum termasuk.

Simpan domain, akses akaun hosting, akses SSH dan kata laluan pentadbir dalam pengurus kata laluan. Berikan maklumat awam seperti nama penyedia/domain/IP untuk panduan lanjut; jangan hantar kata laluan, private key atau fail pangkalan data melalui chat.

## Semakan pemasangan untuk penyelenggara

`npm test` menguji konfigurasi production dan sandaran penuh selain aliran aplikasi. Untuk ujian pemasangan berasingan pada mesin Linux yang mempunyai Docker, Compose v2 terkini dan Python 3, jalankan `python3 test/container-smoke.py`. Ujian menggunakan projek Docker sementara, data rekaan dan sijil CA ujian setempat dengan pengesahan TLS diaktifkan. Ia menyemak Compose, proxy, kuki, Origin, mula semula dan fail sandaran penuh, kemudian membuang hanya containers/volumes projek ujian tersebut. Ia tidak meminta sijil awam atau menerbitkan domain. Imej `mykampung:local` dibina daripada checkout semasa; gunakan mesin ujian atau uruskan pembinaan imej pada pelayan sebenar dengan teratur.

Ujian ini tidak menggantikan semakan akhir DNS, firewall, sijil awam serta capaian daripada telefon selepas domain sebenar disediakan.
