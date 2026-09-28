import { createUser, createSession, publicProfile, settingsStore, json, deleteUserFully, classHash, cleanClassName } from "../lib/data.mjs";
import crypto from "node:crypto";
function safeEqual(a,b){const aa=Buffer.from(String(a||"")),bb=Buffer.from(String(b||""));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
export default async(req)=>{
  if(req.method!=="POST")return json({error:"Methode nicht erlaubt."},405);
  const expected=process.env.TEACHER_SETUP_CODE||"";if(!expected)return json({error:"TEACHER_SETUP_CODE ist in Netlify noch nicht gesetzt."},503);
  try{
    const {nickname,password,className,setupCode}=await req.json();if(!safeEqual(setupCode,expected))return json({error:"Setup-Code ist nicht korrekt."},403);
    const cleanClass=cleanClassName(className), settings=settingsStore(), hash=classHash(cleanClass), bootstrapKey=`teacher-bootstrap/${hash}`;
    const claim=await settings.set(bootstrapKey,`pending:${Date.now()}`,{onlyIfNew:true});if(!claim.modified)return json({error:"Für diese Klasse wurde bereits ein Lehrerzugang eingerichtet."},409);
    let user=null;
    try{user=await createUser({nickname,password,className:cleanClass,role:"teacher"});await settings.setJSON(`class/${hash}`,{className:cleanClass,teacherUserId:user.userId,createdAt:new Date().toISOString()});await settings.set(bootstrapKey,`done:${user.userId}`);const session=await createSession(user);return json({ok:true,token:session.token,expiresAt:session.expiresAt,profile:publicProfile(user),state:null},201);}
    catch(error){if(user)await deleteUserFully(user.userId).catch(()=>{});await settings.delete(bootstrapKey).catch(()=>{});throw error;}
  }catch(error){const msg=error?.message||"Lehrerzugang konnte nicht eingerichtet werden.";return json({error:msg},/Passwort|Zeichen|Klasse|vergeben|bereits/.test(msg)?400:500);}
};
