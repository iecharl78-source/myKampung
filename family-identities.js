import {randomBytes} from 'node:crypto';
export function familyIdentity(person,existing=[]){
 if(person.personKey!==undefined){if(typeof person.personKey!=='string'||!/^[a-f0-9]{32}$/.test(person.personKey))throw Error('Maklumat identiti keluarga tidak sah.');return {personKey:person.personKey};}
 const matches=existing.filter(p=>(person.identificationNumber&&p.identificationNumber===person.identificationNumber)||(!person.identificationNumber&&p.name===person.name&&(p.birthDate||'')===(person.birthDate||'')));
 return matches.length===1&&matches[0].personKey?{personKey:matches[0].personKey}:{};
}
export const newIdentity=()=>randomBytes(16).toString('hex');
