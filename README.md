# Normalize Lab – Normalisierung bis 3NF

Interaktiver Lernkurs für Netlify mit **Netlify Functions + Netlify Blobs**. Keine Supabase- oder SQL-Einrichtung erforderlich.

## Deployment über GitHub → Netlify
1. Inhalt dieses ZIP-Archivs in ein neues GitHub-Repository hochladen.
2. In Netlify **Add new project / Import an existing project** wählen und das GitHub-Repository verbinden.
3. Die Einstellungen aus `netlify.toml` werden übernommen: Publish-Verzeichnis `.` und Functions unter `netlify/functions`.
4. Unter **Project configuration → Environment variables** die Variable `TEACHER_SETUP_CODE` mit einem selbst gewählten, langen Code anlegen. Es ist **kein allgemeiner AUTH-Schlüssel** erforderlich.
5. Deployment ausführen. Netlify installiert die Abhängigkeit `@netlify/blobs` aus `package.json`.

## Klassen und Konten
- Der Kurs ist vollständig **ohne Anmeldung im Gastmodus** nutzbar. Der Gastfortschritt bleibt nur im jeweiligen Browser (`localStorage`).
- Für geräteübergreifendes Arbeiten registrieren sich Schüler mit **Klasse/Kurs, Nickname und Passwort**.
- Eine Klasse wird zuerst durch die Lehrkraft eingerichtet. Danach können Schülerkonten genau dieser Klasse registriert werden.
- Nicknames müssen nur innerhalb derselben Klasse eindeutig sein.
- Lehrkräfte melden sich nach der Einrichtung ebenfalls mit **Klasse/Kurs, Nickname und Passwort** an.

## Lehrerzugang einrichten
1. `TEACHER_SETUP_CODE` in Netlify setzen.
2. Auf der Startseite `Lehrerzugang für eine Klasse einrichten` öffnen.
3. Klasse/Kurs, Lehrer-Nickname, Passwort und Setup-Code eingeben.
4. Pro Klasse ist ein Ersteinrichtungs-Lehrer vorgesehen.
5. Der Lehrerbereich zeigt und verwaltet ausschließlich Schülerkonten derselben Klasse.

Der Lehrerbereich kann:
- Lernfortschritt, XP und Badges der Klasse anzeigen,
- den Fortschritt eines Schülers zurücksetzen,
- den Fortschritt aller Schüler **dieser Klasse** zurücksetzen,
- Schülerkonten entfernen,
- Schülerpasswörter neu setzen; bestehende Sitzungen werden dabei beendet.

## Sicherheit / Speicherung
- Passwörter werden serverseitig mit `scrypt` und individuellem Salt gehasht.
- Session-Tokens werden zufällig erzeugt; serverseitig wird nur ein SHA-256-Ableitungswert für die Session verwendet.
- Browserzugriffe auf Nutzerdaten laufen über Netlify Functions, nicht direkt auf Blobs.
- Nutzer-, Identitäts-, Session- und Fortschrittsdaten liegen in getrennten Netlify-Blob-Stores mit Strong Consistency.
- Klassen dienen als serverseitige Zugriffsschranke im Lehrerbereich; ein Lehrer kann keine fremde Klasse verwalten.

## Kursinhalt
- Redundanzfreiheit und Datenanomalien
- 1. Normalform und atomare Werte
- Primärschlüssel / Nichtschlüsselattribute
- funktionale, voll funktionale und partielle Abhängigkeiten
- 2. Normalform
- transitive Abhängigkeiten
- 3. Normalform
- zahlreiche Excel-Labs mit Arbeitsdateien und Musterlösungen
- verlinktes Wiederholungsvideo

## Selbstkontrolle
Geschlossene Formate werden automatisch gegen die hinterlegte Lösung geprüft. Längere Freitext- und Excel-Aufgaben werden **nicht semantisch automatisch bewertet**: Schüler erstellen ihre Lösung, öffnen nach einer Sicherheitsabfrage die Musterlösung und wählen anschließend `Richtig – als korrekt werten` oder `Nochmal bearbeiten`.

## Gamification
XP, Streaks, Ränge, Kapitel-Badges und eine XP-Galerie mit Themes, Avataren, Haustieren und Outfits. Freischaltungen verbrauchen keine XP; sie werden durch erreichte XP-Schwellen verfügbar.
