export const addressFields = ['address1', 'address2', 'district', 'postcode', 'state', 'country'];
export const malaysiaStates = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya'];

export function formatAddress(address) {
  return [address.address1, address.address2, [address.postcode, address.district].filter(Boolean).join(' '), address.state, address.country].filter(Boolean).join('\n');
}

// Cadangan daripada rekod setempat, bukan direktori poskod rasmi.
export function postcodeSuggestions(members, address) {
  const normalize = value => String(value || '').trim().toLocaleLowerCase('ms').replace(/\s+/g,' ');
  const district = normalize(address.district), state = normalize(address.state), country = normalize(address.country);
  if (!district || !state || country !== 'malaysia') return [];
  return [...new Set(members.filter(m => normalize(m.district) === district && normalize(m.state) === state && normalize(m.country) === country && /^\d{5}$/.test(m.postcode)).map(m => m.postcode))].sort();
}
