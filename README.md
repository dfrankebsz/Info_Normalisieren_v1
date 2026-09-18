# Normalize Lab – Normalisierung bis zur 3. Normalform

Full-Stack-Lernkurs für **GitHub + Netlify** mit **Netlify Functions + Netlify Blobs**.

## Inhalt des Kurses

- Normalisierung, Redundanzfreiheit und Datenanomalien
- Einfüge-, Änderungs- und Löschanomalien
- 1. Normalform und atomare Werte
- Primärschlüssel und Nichtschlüsselattribute
- funktionale Abhängigkeit
- voll funktionale Abhängigkeit
- 2. Normalform
- transitive Abhängigkeit
- 3. Normalform
- vollständige Normalisierung von Rohdaten bis zur 3NF
- verlinktes Erklärvideo: https://www.youtube.com/watch?v=N0M0_xWjIIE&t=314s

Der Kurs enthält 40 reguläre interaktive Aufgaben und zusätzliche Bonusaufgaben. Die Aufgaben enthalten u. a. Single Choice, Multiple Choice, Richtig/Falsch, Drag & Drop, Reihenfolge, Abhängigkeits-Klassifikation, längere Freitextaufgaben mit Selbstkontrolle und 12 umfangreiche Excel-Labs.

## Excel-Labs

- `downloads/arbeitsdateien/` – unfertige Dateien für die Lernenden
- `downloads/loesungen/` – Musterlösungen zum Selbstvergleich
- `downloads/korrigierte_referenz/` – einheitlich aufbereitete Normalisierungsstufen

Bei Excel-Aufgaben laden die Lernenden zunächst die Arbeitsdatei herunter. Die Musterlösung ist erst nach einer Sicherheitsabfrage erreichbar. Die Aufgabe wird anschließend per Selbstkontrolle abgeschlossen.

## Nutzerkonten und Lernstand

Die Anwendung verwendet **keine externe Datenbank und kein Supabase**.

Gespeichert wird serverseitig in Netlify Blobs:

- Nutzerkonten mit Nickname und Passwort-Hash
- Sitzungen
- Lernfortschritt
- XP, Badges und Streaks
- freigeschaltete Themes, Avatare, Pets und Outfits

Passwörter werden nicht im Klartext gespeichert. Die Netlify Function erzeugt mit Node.js `scrypt` einen gesalzenen Passwort-Hash.

Sessions sind zufällige, serverseitig in Blobs gespeicherte Tokens. Dadurch ist **kein allgemeiner `AUTH_SECRET` oder `SESSION_SECRET` erforderlich**.

## Lehrerzugang

Der Lehrerbereich ermöglicht:

- Übersicht über registrierte Nutzer
- XP, Fortschritt, Badges und letzte Synchronisierung einsehen
- Lernfortschritt eines Nutzers löschen
- gesamten Lernfortschritt löschen
- Passwort eines Nutzers zurücksetzen
- Nutzer entfernen

### Ersten Lehreraccount einrichten

Aus Sicherheitsgründen kann nicht jeder Besucher ein Lehrerkonto anlegen. Für die einmalige Einrichtung:

1. In Netlify das Projekt öffnen.
2. Unter **Project configuration → Environment variables** eine Variable anlegen:
   - Name: `TEACHER_SETUP_CODE`
   - Wert: ein selbst gewählter langer, zufälliger Code
3. Neu deployen.
4. Auf der Login-Seite **„Lehrerzugang erstmalig einrichten“** wählen.
5. Lehrer-Nickname, Lehrer-Passwort und den Setup-Code eingeben.
6. Nach erfolgreicher Einrichtung kann `TEACHER_SETUP_CODE` wieder aus Netlify entfernt werden.

Es ist **kein allgemeiner Kurs-/AUTH-Schlüssel** für Schüler notwendig.

## Deployment über GitHub + Netlify

1. Inhalt dieses Ordners in ein neues GitHub-Repository hochladen.
2. In Netlify **Add new project → Import an existing project** wählen.
3. GitHub-Repository auswählen.
4. Netlify erkennt `netlify.toml` automatisch.
5. Publish directory: `.`
6. Functions directory: `netlify/functions`
7. Deployment starten.

Die Node-Abhängigkeit `@netlify/blobs` steht in `package.json` und wird beim Build installiert.

## Netlify-Blobs-Struktur

Der Kurs verwendet getrennte Stores:

- `normalize-users-v2`
- `normalize-nicknames-v2`
- `normalize-progress-v2`
- `normalize-sessions-v2`
- `normalize-settings-v2`

Für Authentifizierung und Lernstand wird starke Konsistenz verwendet, damit Änderungen nach Login, Passwortreset oder Fortschrittsspeicherung direkt sichtbar sind.

## Lokale Vorschau

Wird `index.html` ohne Netlify Functions geöffnet, bietet die Oberfläche einen lokalen Demo-Modus. Dieser speichert nur im Browser und dient ausschließlich zum Testen der Kursoberfläche. Geräteübergreifende Synchronisierung und Lehrerfunktionen funktionieren erst nach dem Netlify-Deployment.

## Technischer Hinweis

Netlify Blobs ist ein Key-Value-Speicher und keine relationale Datenbank. Für diesen Kurs ist die Datenstruktur bewusst einfach gehalten: ein Nutzerobjekt und ein Lernstandsobjekt je Nutzer. Der Lehrerbereich liest die registrierten Nutzer serverseitig aus und kombiniert sie mit den zugehörigen Lernständen.
