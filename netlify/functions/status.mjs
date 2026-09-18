import { settingsStore, json } from "../lib/data.mjs";
export default async () => {
  try {
    await settingsStore().get("healthcheck");
    return json({ configured: true, provider: "Netlify Blobs" });
  } catch (error) {
    return json({ configured: false, error: "Netlify Blobs nicht erreichbar." }, 503);
  }
};
