# Architektur: Netlify Functions + Netlify Blobs

Browser
→ Netlify Functions
→ Netlify Blobs

Der Browser erhält niemals direkten Schreibzugriff auf die Blob-Stores.

## Authentifizierung

1. Registrierung sendet Nickname + Passwort an `auth-register`.
2. Die Function speichert einen gesalzenen scrypt-Hash.
3. Login erzeugt ein kryptografisch zufälliges Session-Token.
4. Nur ein Hash des geheimen Tokenanteils wird als Blob-Key verwendet.
5. Der Browser sendet das Token als Bearer-Token an weitere Functions.
6. Sessions laufen nach 30 Tagen ab.

## Relevante Functions

- `status.mjs`
- `auth-register.mjs`
- `auth-login.mjs`
- `auth-me.mjs`
- `auth-logout.mjs`
- `progress.mjs`
- `teacher-setup.mjs`
- `admin.mjs`

## Lehrer-Bootstrap

Die Umgebungsvariable `TEACHER_SETUP_CODE` wird nur für den einmaligen Lehrer-Bootstrap benötigt. Nach erfolgreicher Einrichtung blockiert ein Blob-Eintrag weitere Bootstrap-Versuche.
