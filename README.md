# myKampung

Versi asas pengurusan ahli dan isi rumah, dalam Bahasa Melayu dan mesra telefon. Pentadbir boleh mendaftar, mencari dan mengemas kini ahli serta ahli keluarga. Maklumat disimpan dalam SQLite pada pelayan; tiada perkhidmatan luaran atau pakej npm diperlukan.

## Mula

Perlu Node.js 24 atau lebih baharu. Dari `/workspace/myKampung`, jalankan arahan Bash berikut untuk menetapkan kata laluan pentadbir pertama tanpa merekodkannya dalam sejarah shell:

```bash
read -rs -p 'Kata laluan pentadbir (minimum 12 aksara): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
npm start
```

Buka pelayar pada port 3000 pada mesin pelayan. Kata laluan disimpan sebagai hash scrypt semasa mula pertama. Selepas pentadbir diwujudkan, pemboleh ubah itu tidak diperlukan lagi; menukarnya tidak menukar kata laluan sedia ada. Tiada kata laluan lalai. Sesi tamat selepas 8 jam atau apabila pelayan dimulakan semula.

`npm test` menjalankan ujian integrasi dengan pangkalan data sementara, termasuk log masuk, sekatan akses, pendaftaran keluarga, pengesahan input dan ketekalan data selepas mula semula.

## Data dan akses

`data/kampung.sqlite` mengandungi maklumat peribadi dan tidak dimasukkan dalam Git. `DATA_DIR`, `HOST` dan `PORT` boleh ditetapkan untuk konfigurasi tempatan. Sandarkan pangkalan data menggunakan SQLite backup atau hentikan pelayan sebelum menyalin keseluruhan direktori data. Lindungi akses fail dan sandaran.

Pelayan terikat pada `127.0.0.1` secara lalai. Untuk kegunaan sebenar melalui telefon dan komputer, sediakan domain dan reverse proxy HTTPS, tetapkan `COOKIE_SECURE=1`, dan kekalkan port aplikasi terhad kepada reverse proxy. Jika proxy pada mesin berlainan, tetapkan `HOST` yang sesuai dengan kawalan rangkaian. Proxy mesti mengekalkan pengepala Host awam. Jangan dedahkan aplikasi melalui HTTP awam.

Versi ini mempunyai satu akaun pentadbir, amaran rekod berganda serta sandaran/pemulihan rekod ahli dalam format JSON. Pendaftaran sendiri oleh penduduk, akaun berasingan, pemulihan kata laluan, log audit, modul bantuan dan eksport laporan belum disediakan. Ia sesuai untuk penilaian aliran asas dahulu; sebelum penggunaan awam, lengkapkan pengurusan akaun, sandaran berjadual dan semakan keselamatan mengikut keperluan komuniti. Ahli keluarga ialah tanggungan dalam rekod utama, bukan akaun atau ahli berdaftar yang berasingan. Elakkan merekodkan orang yang sama berulang kali di beberapa isi rumah. Rujuk PANDUAN-TEMPATAN.md untuk cara sandaran dan pemulihan.

Gunakan checkout sedia ada dalam tugas cloud; jangan cipta Git worktree kecuali diminta.
