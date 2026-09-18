async function serviceFetch(url, service, path, opts={}){
  const r=await fetch(url+path,{...opts,headers:{"apikey":service,"Authorization":"Bearer "+service,"Content-Type":"application/json",...(opts.headers||{})}});
  if(!r.ok){const t=await r.text();throw new Error(t||("HTTP "+r.status));}
  if(r.status===204)return null;const t=await r.text();return t?JSON.parse(t):null;
}
async function assertTeacher(req,url,anon,service){
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token)throw new Error("Nicht angemeldet.");
  const ur=await fetch(url+"/auth/v1/user",{headers:{"apikey":anon,"Authorization":"Bearer "+token}});
  if(!ur.ok)throw new Error("Sitzung ungültig.");const user=await ur.json();
  const p=await serviceFetch(url,service,`/rest/v1/profiles?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,nickname,role`);
  if(!p?.[0]||p[0].role!=="teacher")throw new Error("Lehrerberechtigung erforderlich.");
  return p[0];
}
export default async (req)=>{
 try{
  const url=process.env.SUPABASE_URL, anon=process.env.SUPABASE_ANON_KEY, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return json({error:"Cloud-Verwaltung ist nicht konfiguriert."},503);
  const teacher=await assertTeacher(req,url,anon,service);
  const body=await req.json();const action=body.action;
  if(action==="list"){
    const profiles=await serviceFetch(url,service,"/rest/v1/profiles?select=user_id,nickname,role,created_at&order=nickname.asc");
    const progress=await serviceFetch(url,service,"/rest/v1/progress?select=user_id,state,updated_at");
    const map=new Map((progress||[]).map(x=>[x.user_id,x]));
    return json({users:(profiles||[]).map(p=>({...p,state:map.get(p.user_id)?.state||{},updated_at:map.get(p.user_id)?.updated_at||null}))});
  }
  if(action==="resetProgress"){await serviceFetch(url,service,`/rest/v1/progress?user_id=eq.${encodeURIComponent(body.userId)}`,{method:"DELETE",headers:{"Prefer":"return=minimal"}});return json({ok:true});}
  if(action==="resetAllProgress"){await serviceFetch(url,service,"/rest/v1/progress?user_id=not.is.null",{method:"DELETE",headers:{"Prefer":"return=minimal"}});return json({ok:true});}
  if(action==="resetPassword"){
    if(!body.newPassword||String(body.newPassword).length<6)return json({error:"Passwort muss mindestens 6 Zeichen lang sein."},400);
    await serviceFetch(url,service,`/auth/v1/admin/users/${encodeURIComponent(body.userId)}`,{method:"PUT",body:JSON.stringify({password:String(body.newPassword)})});return json({ok:true});
  }
  if(action==="deleteUser"){
    if(body.userId===teacher.user_id)return json({error:"Das aktuell angemeldete Lehrerkonto kann sich nicht selbst löschen."},400);
    await serviceFetch(url,service,`/auth/v1/admin/users/${encodeURIComponent(body.userId)}`,{method:"DELETE"});return json({ok:true});
  }
  return json({error:"Unbekannte Aktion."},400);
 }catch(e){return json({error:e.message||"Aktion fehlgeschlagen"},403);}
};
function json(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json"}});}