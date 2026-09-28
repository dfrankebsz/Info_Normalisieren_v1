import { requireTeacher, usersStore, progressStore, changePassword, deleteUserFully, revokeUserSessions, json, sameClass } from "../lib/data.mjs";
async function managedStudent(teacher,userId){const user=await usersStore().get(userId,{type:"json"});if(!user||user.role!=="student"||!sameClass(teacher,user))throw new Error("Dieser Schüler gehört nicht zu Ihrer Klasse.");return user;}
export default async(req)=>{
 if(req.method!=="POST")return json({error:"Methode nicht erlaubt."},405);
 try{
  const {user:teacher}=await requireTeacher(req);const body=await req.json(),action=body?.action;
  if(action==="list"){
   const store=usersStore(),listed=await store.list(),users=[];
   for(const b of (listed.blobs||[])){const u=await store.get(b.key,{type:"json"});if(!u||u.role!=="student"||!sameClass(teacher,u))continue;const p=await progressStore().get(u.userId,{type:"json"});users.push({user_id:u.userId,nickname:u.nickname,class_name:u.className,role:u.role,created_at:u.createdAt,state:p?.state||{},updated_at:p?.updatedAt||null});}
   users.sort((a,b)=>String(a.nickname).localeCompare(String(b.nickname),"de"));return json({className:teacher.className,users});
  }
  if(action==="resetProgress"){const u=await managedStudent(teacher,body.userId);await progressStore().delete(u.userId);return json({ok:true});}
  if(action==="resetAllProgress"){
   const store=usersStore(),listed=await store.list();let count=0;
   for(const b of (listed.blobs||[])){const u=await store.get(b.key,{type:"json"});if(u?.role==="student"&&sameClass(teacher,u)){await progressStore().delete(u.userId).catch(()=>{});count++;}}
   return json({ok:true,count});
  }
  if(action==="resetPassword"){const u=await managedStudent(teacher,body.userId);await changePassword(u.userId,body.newPassword);return json({ok:true,note:"Alle bestehenden Sitzungen dieses Schülers wurden beendet."});}
  if(action==="deleteUser"){const u=await managedStudent(teacher,body.userId);await deleteUserFully(u.userId);return json({ok:true});}
  if(action==="logoutUser"){const u=await managedStudent(teacher,body.userId);await revokeUserSessions(u.userId);return json({ok:true});}
  return json({error:"Unbekannte Aktion."},400);
 }catch(error){const msg=error?.message||"Aktion fehlgeschlagen.";return json({error:msg},/Lehrerberechtigung|Sitzung|gehört nicht/.test(msg)?403:500);}
};
