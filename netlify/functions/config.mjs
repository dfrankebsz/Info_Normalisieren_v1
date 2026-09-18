export default async () => {
  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  return new Response(JSON.stringify({configured:Boolean(url && anonKey),url,anonKey}), {
    headers: {"content-type":"application/json","cache-control":"no-store"}
  });
};