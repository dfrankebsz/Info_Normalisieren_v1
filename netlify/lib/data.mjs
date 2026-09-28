import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const NAMES = {
  users: "normalize-users-v3",
  identities: "normalize-identities-v3",
  progress: "normalize-progress-v3",
  sessions: "normalize-sessions-v3",
  settings: "normalize-settings-v3"
};

export const usersStore = () => getStore({ name: NAMES.users, consistency: "strong" });
export const identitiesStore = () => getStore({ name: NAMES.identities, consistency: "strong" });
export const progressStore = () => getStore({ name: NAMES.progress, consistency: "strong" });
export const sessionsStore = () => getStore({ name: NAMES.sessions, consistency: "strong" });
export const settingsStore = () => getStore({ name: NAMES.settings, consistency: "strong" });

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

export function normalizeNickname(value) { return String(value || "").trim().toLowerCase().normalize("NFKC").replace(/\s+/g, " "); }
export function normalizeClassName(value) { return String(value || "").trim().toLowerCase().normalize("NFKC").replace(/\s+/g, " "); }
export function cleanClassName(value) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  if (clean.length < 1 || clean.length > 40) throw new Error("Klasse/Kurs muss 1 bis 40 Zeichen lang sein.");
  if (!/[\p{L}\p{N}]/u.test(clean)) throw new Error("Klasse/Kurs ist ungültig.");
  return clean;
}

export function publicProfile(user) {
  return { user_id: user.userId, nickname: user.nickname, role: user.role, class_name: user.className, created_at: user.createdAt };
}

function sha256(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
export function classHash(className) { return sha256(normalizeClassName(className)); }
function identityKey(nickname, className) { return sha256(`${normalizeClassName(className)}\n${normalizeNickname(nickname)}`); }

export function validateCredentials(nickname, password) {
  const clean = String(nickname || "").trim();
  if (clean.length < 2 || clean.length > 30) throw new Error("Nickname muss 2 bis 30 Zeichen lang sein.");
  if (!password || String(password).length < 6 || String(password).length > 200) throw new Error("Passwort muss 6 bis 200 Zeichen lang sein.");
  return clean;
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex"); return { salt, hash };
}
function verifyPassword(password, user) {
  try { const candidate=crypto.scryptSync(String(password), user.passwordSalt, 64); const stored=Buffer.from(user.passwordHash,"hex"); return candidate.length===stored.length && crypto.timingSafeEqual(candidate,stored); } catch { return false; }
}

export async function classExists(className) {
  const record = await settingsStore().get(`class/${classHash(className)}`, { type: "json" });
  return record || null;
}
export async function requireExistingClass(className) {
  const clean = cleanClassName(className); const record = await classExists(clean);
  if (!record) throw new Error("Diese Klasse ist noch nicht eingerichtet. Bitte prüfen Sie die Schreibweise oder wenden Sie sich an Ihre Lehrkraft.");
  return { clean, record };
}

export async function createUser({ nickname, password, className, role = "student" }) {
  const cleanNick = validateCredentials(nickname, password); const cleanClass = cleanClassName(className);
  const key = identityKey(cleanNick, cleanClass); const uid = crypto.randomUUID(); const identityStore = identitiesStore();
  const claim = await identityStore.set(key, uid, { onlyIfNew: true });
  if (!claim.modified) throw new Error("Dieser Nickname ist in dieser Klasse bereits vergeben.");
  const { salt, hash } = hashPassword(password); const now = new Date().toISOString();
  const user = { userId:uid, nickname:cleanNick, nicknameNormalized:normalizeNickname(cleanNick), className:cleanClass, classNormalized:normalizeClassName(cleanClass), role, passwordSalt:salt, passwordHash:hash, createdAt:now, updatedAt:now };
  try { await usersStore().setJSON(uid,user,{onlyIfNew:true}); return user; }
  catch(error){ await identityStore.delete(key).catch(()=>{}); throw error; }
}
export async function findUserByNickname(nickname, className) {
  const cleanClass = cleanClassName(className); const uid = await identitiesStore().get(identityKey(nickname,cleanClass));
  if (!uid) return null; return usersStore().get(uid,{type:"json"});
}
export async function authenticate(nickname,password,className) {
  const user = await findUserByNickname(nickname,className); if (!user || !verifyPassword(password,user)) return null; return user;
}

export async function createSession(user) {
  const secret=crypto.randomBytes(32).toString("base64url"), secretHash=sha256(secret), key=`${user.userId}/${secretHash}`, expiresAt=Date.now()+1000*60*60*24*30;
  await sessionsStore().setJSON(key,{userId:user.userId,createdAt:new Date().toISOString(),expiresAt}); return {token:`${user.userId}.${secret}`,expiresAt};
}
export function parseToken(req) {
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim(); if(!token)return null;
  const dot=token.indexOf("."); if(dot<1)return null; const userId=token.slice(0,dot), secret=token.slice(dot+1);
  if(!/^[0-9a-f-]{36}$/i.test(userId)||secret.length<20)return null; return {token,userId,secret,sessionKey:`${userId}/${sha256(secret)}`};
}
export async function getSessionUser(req) {
  const parsed=parseToken(req); if(!parsed)return null; const sess=await sessionsStore().get(parsed.sessionKey,{type:"json"});
  if(!sess||sess.userId!==parsed.userId||Number(sess.expiresAt)<Date.now()){if(sess)await sessionsStore().delete(parsed.sessionKey).catch(()=>{});return null;}
  const user=await usersStore().get(parsed.userId,{type:"json"}); if(!user)return null; return {user,sessionKey:parsed.sessionKey};
}
export async function requireUser(req){const found=await getSessionUser(req);if(!found)throw new Error("Sitzung ungültig oder abgelaufen. Bitte erneut anmelden.");return found;}
export async function requireTeacher(req){const found=await requireUser(req);if(found.user.role!=="teacher")throw new Error("Lehrerberechtigung erforderlich.");return found;}

export async function revokeUserSessions(userId){const store=sessionsStore();const listed=await store.list({prefix:`${userId}/`});await Promise.all((listed.blobs||[]).map(b=>store.delete(b.key)));}
export async function changePassword(userId,newPassword){
  if(!newPassword||String(newPassword).length<6||String(newPassword).length>200)throw new Error("Passwort muss 6 bis 200 Zeichen lang sein.");
  const store=usersStore(),user=await store.get(userId,{type:"json"});if(!user)throw new Error("Nutzer nicht gefunden.");const {salt,hash}=hashPassword(newPassword);user.passwordSalt=salt;user.passwordHash=hash;user.updatedAt=new Date().toISOString();await store.setJSON(userId,user);await revokeUserSessions(userId);return user;
}
export async function deleteUserFully(userId){const store=usersStore(),user=await store.get(userId,{type:"json"});if(!user)return;await Promise.all([progressStore().delete(userId).catch(()=>{}),identitiesStore().delete(identityKey(user.nickname,user.className)).catch(()=>{}),revokeUserSessions(userId)]);await store.delete(userId);}
export function sameClass(a,b){return normalizeClassName(a?.className)===normalizeClassName(b?.className);}
