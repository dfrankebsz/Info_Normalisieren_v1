import crypto from "node:crypto";
function normalizeNickname(v){return String(v||"").trim().toLowerCase().normalize("NFKD");}
function emailFor(nickname){return crypto.createHash("sha256").update(normalizeNickname(nickname)).digest("hex").slice(0,40)+"@normalize.local";}
export default async (req) => {
  try{
    const url=process.env.SUPABASE_URL, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!service) return json({error:"Cloud-Registrierung ist noch nicht konfiguriert."},503);
    const {nickname,password}=await req.json();
    if(!nickname||String(nickname).trim().length<2) return json({error:"Nickname muss mindestens 2 Zeichen lang sein."},400);
    if(!password||String(password).length<6) return json({error:"Passwort muss mindestens 6 Zeichen lang sein."},400);
    const r=await fetch(url+"/auth/v1/admin/users",{method:"POST",headers:{"apikey":service,"Authorization":"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({email:emailFor(nickname),password,email_confirm:true,user_metadata:{nickname:String(nickname).trim()}})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=String(data.msg||data.message||data.error_description||"Registrierung fehlgeschlagen");
      return json({error:msg.toLowerCase().includes("already")?"Dieser Nickname ist bereits vergeben.":msg},r.status);
    }
    return json({ok:true});
  }catch(e){return json({error:e.message||"Registrierung fehlgeschlagen"},500);}
};
function json(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json"}});}