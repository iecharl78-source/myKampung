import { employmentStatuses, educationLevels, studyLevels } from './education.js';
import { formatAddress } from './address.js';

export const memberEducationLevels = ['Tiada pendidikan formal', ...educationLevels];
export const employerAddressFields = ['employerAddress1','employerAddress2','employerDistrict','employerPostcode','employerState','employerCountry'];
export const memberDetailFields = ['employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone',...employerAddressFields];

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
  const parts={
    employerAddress1:text(input.employerAddress1 ?? input.employerAddress ?? '',1000),
    employerAddress2:text(input.employerAddress2 ?? '',500), employerDistrict:text(input.employerDistrict ?? '',100),
    employerPostcode:text(input.employerPostcode ?? '',20), employerState:text(input.employerState ?? '',100), employerCountry:text(input.employerCountry ?? '',100),
  };
  if(parts.employerPostcode && parts.employerCountry.toLowerCase()==='malaysia' && !/^\d{5}$/.test(parts.employerPostcode)) throw Error('Sila masukkan poskod majikan Malaysia 5 digit atau kosongkan jika belum diketahui.');
  const employerAddress=[parts.employerAddress1,parts.employerAddress2,parts.employerDistrict,parts.employerPostcode,parts.employerState].some(Boolean) ? formatAddress({address1:parts.employerAddress1,address2:parts.employerAddress2,district:parts.employerDistrict,postcode:parts.employerPostcode,state:parts.employerState,country:parts.employerCountry}) : '';
  const employerPhone = text(input.employerPhone ?? '', 30);
  if (employerPhone && !/^[+\d\s()-]{7,30}$/.test(employerPhone)) throw Error('Sila masukkan nombor telefon majikan yang sah atau kosongkan.');
  return {employmentStatus,educationLevel,studyLevel,employerName,employerAddress,employerPhone,...parts};
}
