# Architektur

Browser → Netlify Functions → Netlify Blobs

## Stores
- `normalize-users-v3`: Benutzerprofile und Passwort-Hashes
- `normalize-identities-v3`: Zuordnung aus normalisierter Klasse + Nickname zu User-ID
- `normalize-progress-v3`: Lernstand je User-ID
- `normalize-sessions-v3`: serverseitige Session-Nachweise
- `normalize-settings-v3`: Klassenregistrierung und Lehrer-Bootstrap

## Klassenisolation
Eine Klasse wird beim Lehrer-Setup registriert. Schüler können sich nur für eine bereits eingerichtete Klasse registrieren. Lehrerfunktionen prüfen serverseitig, dass Zielnutzer Schüler derselben Klasse sind. `resetAllProgress` löscht daher nur Lernstände der eigenen Klasse.

## Gastmodus
Der Gastmodus ruft keine Authentifizierungsfunktion auf und speichert ausschließlich in `localStorage`. Alle Lerninhalte und Aufgaben bleiben nutzbar; geräteübergreifende Synchronisierung und Lehrerzuordnung setzen ein Konto voraus.
