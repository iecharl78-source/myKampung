export const employmentStatuses = ['Bekerja', 'Bekerja sendiri', 'Tidak bekerja', 'Suri rumah', 'Pesara', 'Pelajar', 'Belum bersekolah'];
export const educationLevels = ['Universiti', 'Sekolah menengah', 'Sekolah rendah', 'Taska/Tadika'];
export const studyLevels = ['Diploma', 'Sarjana Muda', 'Sarjana', 'Doktor Falsafah (PhD)', 'Asasi'];

export function normalizeEducation(person) {
  const employmentStatus = person.employmentStatus ?? '';
  // Status kosong dibenarkan pada rekod versi lama; borang meminta pengguna melengkapkannya.
  if (employmentStatus !== '' && !employmentStatuses.includes(employmentStatus)) throw Error('Sila pilih status pekerjaan ahli keluarga yang sah.');
  let educationLevel = '', studyLevel = '';
  if (employmentStatus === 'Pelajar') {
    educationLevel = person.educationLevel;
    if (!educationLevels.includes(educationLevel)) throw Error('Sila pilih tahap pendidikan untuk ahli keluarga berstatus pelajar.');
    if (educationLevel === 'Universiti') {
      studyLevel = person.studyLevel;
      if (!studyLevels.includes(studyLevel)) throw Error('Sila pilih tahap pengajian universiti ahli keluarga.');
    }
  }
  return { employmentStatus, educationLevel, studyLevel };
}
