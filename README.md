# Normalize Lab - Normalisierung bis 3NF

Statischer Lernkurs für GitHub + Netlify mit optionaler Cloud-Synchronisierung über Supabase.

## Enthalten
- Redundanzfreiheit und Datenanomalien
- 1. Normalform
- funktionale und voll funktionale Abhängigkeiten
- 2. Normalform
- transitive Abhängigkeiten
- 3. Normalform
- 12 Excel-Labs mit Arbeitsdatei und Musterlösung
- XP, Streaks, Badges, Avatar/Pet/Theme-Galerie
- Nickname-/Passwort-Anmeldung
- Lehrerbereich: Lernfortschritt, Fortschritt löschen, Nutzer löschen, Passwort neu setzen

## Netlify Deployment
1. Den Inhalt dieses Ordners in ein GitHub-Repository laden.
2. Repository mit Netlify verbinden.
3. Publish directory: `.`
4. Functions directory wird über `netlify.toml` automatisch auf `netlify/functions` gesetzt.

## Cloud-Synchronisierung / Nutzerkonten
Für geräteübergreifenden Lernstand wird ein Supabase-Projekt benötigt.

1. Neues Supabase-Projekt erstellen.
2. Inhalt von `supabase_setup.sql` im Supabase SQL Editor ausführen.
3. In Netlify unter Environment Variables setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Neu deployen.

Der Service-Role-Key wird ausschließlich in Netlify Functions verwendet und niemals an den Browser ausgeliefert.
Ein allgemeiner Kurs-/AUTH-Schlüssel ist nicht erforderlich.

### Lehrerzugang
1. Gewünschten Lehrernickname ganz normal im Kurs registrieren.
2. Danach im Supabase SQL Editor:
   `update public.profiles set role='teacher' where lower(nickname)=lower('DEIN_NICKNAME');`
3. Neu anmelden. Dann erscheint oben der Button `Lehrer`.

## Ohne Supabase
Der Kurs bietet einen lokalen Testmodus. Lernfortschritt bleibt dann nur auf diesem Browser/Gerät gespeichert. Geräteübergreifender Zugriff und Lehrerfunktionen benötigen die Cloud-Konfiguration.

## Excel
Arbeitsdateien: `downloads/arbeitsdateien/`
Musterlösungen: `downloads/loesungen/`
Zusätzliche standardisierte Referenzstufen: `downloads/korrigierte_referenz/`
