import { employmentStatuses, educationLevels, studyLevels } from './education.js';

export const memberEducationLevels = ['Tiada pendidikan formal', ...educationLevels];
export const memberDetailFields = ['employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone'];

export function normalizeMemberDetails(input) {
  const text = (value, max) => {
    if (typeof value !== 'string' || value.length > max) throw Error('Maklumat pekerjaan atau pendidikan tidak sah atau terlalu panjang.');
    return value.trim();
  };
  const employmentStatus = text(input.employmentStatus ?? '', 50);
  if (employmentStatus && !employmentStatuses.includes(employmentStatus)) throw Error('Sila pilih status pekerjaan ahli yang sah.');
  const educationLevel = text(input.educationLevel ?? '', 50);
  if (educationLevel && !memberEducationLevels.includes(educationLevel)) throw Error('Sila pilih tahap pendidikan ahli yang sah.');
  if (employmentStatus === 'Pelajar' && !educationLevels.includes(educationLevel)) throw Error('Sila pilih tahap pendidikan semasa ahli berstatus pelajar.');
  let studyLevel = '';
  if (educationLevel === 'Universiti') {
    studyLevel = text(input.studyLevel ?? '', 50);
    if (!studyLevels.includes(studyLevel)) throw Error('Sila pilih tahap pengajian universiti ahli.');
  }
  const employerName = text(input.employerName ?? '', 200);
  const employerAddress = text(input.employerAddress ?? '', 1000);
  const employerPhone = text(input.employerPhone ?? '', 30);
  if (employerPhone && !/^[+\d\s()-]{7,30}$/.test(employerPhone)) throw Error('Sila masukkan nombor telefon majikan yang sah atau kosongkan.');
  return {employmentStatus,educationLevel,studyLevel,employerName,employerAddress,employerPhone};
}
