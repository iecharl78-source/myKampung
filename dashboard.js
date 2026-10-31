export function dashboardData(db,user,now=new Date()){
 const resident=user.role==='ahli',admin=user.role==='admin',time=now.toISOString();
 const count=(sql,...args)=>db.prepare(sql).get(...args).n;
 const result={role:user.role,generatedAt:time,unread:count("SELECT count(*) n FROM notifications WHERE userId=? AND readAt=''",user.id),openQuestions:count(`SELECT count(*) n FROM questions WHERE status='open' ${resident?'AND userId=?':''}`,...(resident?[user.id]:[]))};
 if(admin)result.pending={registrations:count("SELECT count(*) n FROM registrations WHERE status='pending'"),profiles:count("SELECT count(*) n FROM profile_requests WHERE status='pending'"),aid:count("SELECT count(*) n FROM aid_requests WHERE status='pending'")};
 if(resident){
  result.requests={};for(const [key,table] of [['profiles','profile_requests'],['aid','aid_requests']]){result.requests[key]={pending:0,approved:0,rejected:0};for(const row of db.prepare(`SELECT status,count(*) n FROM ${table} WHERE userId=? GROUP BY status`).all(user.id))result.requests[key][row.status]=row.n;}
  result.household={family:count('SELECT json_array_length(household) n FROM members WHERE id=?',user.memberId),aid:count('SELECT count(*) n FROM aid_records WHERE memberId=?',user.memberId)};
  result.decisions=db.prepare(`SELECT id,'profiles' kind,status,reviewNote,reviewedAt FROM profile_requests WHERE userId=? AND status!='pending' UNION ALL SELECT id,'aid' kind,status,reviewNote,reviewedAt FROM aid_requests WHERE userId=? AND status!='pending' ORDER BY reviewedAt DESC,id DESC LIMIT 5`).all(user.id,user.id);
 }else result.community={active:count('SELECT count(*) n FROM members WHERE isActive=1'),inactive:count('SELECT count(*) n FROM members WHERE isActive=0'),family:db.prepare('SELECT coalesce(sum(json_array_length(household)),0) n FROM members WHERE isActive=1').get().n};
 result.events=db.prepare("SELECT id,title,location,startsAt,endsAt FROM events WHERE published=1 AND CASE WHEN endsAt='' THEN startsAt ELSE endsAt END>=? ORDER BY startsAt,id LIMIT 5").all(time);
 result.announcements=db.prepare('SELECT id,title,body,createdAt FROM announcements WHERE published=1 ORDER BY createdAt DESC,id DESC LIMIT 3').all();
 return result;
}
