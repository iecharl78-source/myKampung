# Sejarah perubahan maklumat ahli dan keluarga

## Tujuan dan akses

Fungsi ini membolehkan **pentadbir** menyemak keadaan sebelum dan selepas perubahan rasmi. Petugas dan ahli tidak mendapat akses sejarah penuh yang mungkin mengandungi maklumat peribadi terdahulu. Petugas tetap boleh mengemas kini ahli melalui modul yang dibenarkan; identiti mereka direkodkan sebagai pelaku perubahan.

Buka **Pentadbiran → Sejarah ahli** atau tekan **Sejarah** pada baris ahli dalam direktori. Carian menerima nama ahli, nama pengguna yang membuat tindakan atau jenis tindakan. ID ahli boleh digunakan untuk menghadkan kepada isi rumah semasa. Senarai dipaparkan 20 rekod setiap halaman. Carian global masih boleh mencari sejarah rekod yang telah dipadam.

Tekan **Lihat perbandingan**. Paparan menunjukkan medan yang berubah sahaja, termasuk ahli keluarga sebelum/selepas, tarikh tindakan (Malaysia), pengguna/peranan, catatan dan rujukan permohonan jika berkaitan. Status pendaftaran baharu mempunyai keadaan sebelum kosong; pemadaman mempunyai keadaan selepas kosong. Tiada butang memulihkan atau mengubah sejarah.

## Peristiwa yang direkodkan

- Pendaftaran ahli terus oleh pentadbir/petugas.
- Pendaftaran baharu melalui kelulusan permohonan awam.
- Kemas kini rasmi ahli dan keluarga oleh pentadbir/petugas. Ruangan **Catatan perubahan** adalah pilihan, maksimum 1,000 aksara.
- Kelulusan perubahan profil oleh pentadbir: pelulus, pemohon, rujukan dan catatan keputusan disimpan bersama perbandingan.
- Aktif/nyahaktif keahlian beserta sebab.
- Pertukaran ketua keluarga yang diluluskan, dengan perbandingan isi rumah.
- Pemadaman ahli dan pemulihan sandaran JSON yang mengubah keadaan rasmi.

Permohonan yang dihantar tetapi belum diluluskan, permohonan ditolak, perubahan cap masa sahaja dan simpanan tanpa perubahan maklumat tidak menghasilkan sejarah perubahan rasmi. Log audit asal tetap digunakan untuk tindakan tersebut. Keputusan kematian/khairat dan pembayaran mempunyai rekod serta audit modul masing-masing, bukan dimasukkan ke sejarah profil ini.

## Keselamatan dan ketepatan

Sejarah dicipta dalam transaksi sama dengan perubahan data dan audit. Kegagalan menulis sejarah membatalkan perubahan rasmi tersebut. Snapshot hanya mengandungi medan profil/keluarga yang dibenarkan, bukan hash kata laluan, token sesi, rahsia 2FA atau kunci dalaman identiti. Sejarah dihubungkan melalui identiti isi rumah yang kekal, bukan hanya nombor ID yang mungkin digunakan semula selepas pemadaman.

Perbandingan keluarga disusun mengikut urutan rekod ketika disimpan; ia bukan penggabungan individu automatik. Fungsi ini bermula selepas pemasangan: data lama kekal, tetapi keadaan sebelum/selepas bagi perubahan lampau tidak direka atau diteka. Pemulihan penuh SQLite mengembalikan sejarah yang terkandung dalam sandaran itu; pemulihan JSON mengekalkan sejarah tempatan dan merekodkan perubahan profil yang terhasil.

Sejarah mengandungi maklumat peribadi terdahulu. Hadkan akaun pentadbir, simpan sandaran dengan kawalan akses dan tentukan tempoh penyimpanan organisasi. Fungsi ini tidak menyediakan pemadaman sejarah melalui aplikasi. Pangkalan data dan backup tidak disulitkan secara menyeluruh oleh penambahan ini.

## Pemasangan dan ujian ringkas

1. Buat sandaran penuh SQLite, kemas kini kod serta folder `public`, kekalkan DATA_DIR dan restart. Jadual sejarah dicipta secara automatik. Tidak memerlukan 2FA.
2. Cipta ahli rekaan, kemas kini telefon/keluarga dengan catatan, kemudian buka Sejarah. Semak nilai sebelum/selepas.
3. Log masuk sebagai ahli dan hantar perubahan. Semak sejarah belum bertambah sehingga diluluskan. Selepas kelulusan, semak pemohon, pelulus dan rujukan.
4. Semak petugas/ahli tidak boleh membaca API sejarah; pentadbir boleh menapis dan membuka perbandingan.
5. Ambil sandaran penuh dan uji pemulihan dalam folder ujian baharu. Jangan melakukan latihan pemulihan pada data produksi.
