// Kira tahun lengkap berdasarkan tarikh kalendar Malaysia, bukan beza milisaat.
export function todayInMalaysia(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function calculateAge(birthDate, today = todayInMalaysia()) {
  const validDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!validDate(birthDate) || !validDate(today) || birthDate > today) return null;
  const [year, month, day] = today.split('-').map(Number);
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  return year - birthYear - (month < birthMonth || (month === birthMonth && day < birthDay) ? 1 : 0);
}

export function ageLabel(birthDate) {
  const age = calculateAge(birthDate);
  return age === null ? 'Umur: —' : `Umur: ${age} tahun`;
}
