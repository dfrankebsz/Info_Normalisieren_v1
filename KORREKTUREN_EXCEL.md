# Prüfung und Vereinheitlichung der Excel-Materialien

Die gelieferten Dateien wurden für die Kursfassungen auf eine einheitliche Schlüssel- und Abhängigkeitslogik gebracht. Die ursprünglichen Uploads bleiben unverändert; im Kurs werden korrigierte Arbeits- und Referenzdateien verwendet.

## Schule

- In einer Zwischenfassung stand bei Lea im Nachnamenfeld noch der vollständige Name. In der Kursfassung wurde der Nachname einheitlich zu `Lustig` korrigiert.
- Die Zerlegung folgt einheitlich der Logik SCHUELER, UNTERRICHT, SCHUELER_UNTERRICHT und in der 3NF zusätzlich KLASSE.

## Sprachkurse

- In der gelieferten 3NF-Lösung ging bei der Auslagerung der Abteilung die Zuordnung der Person zur Abteilung verloren.
- Korrektur: PERSON behält `Abt` als Fremdschlüssel; ABTEILUNG enthält `Abt` und `Leiter`.

## Projekte

- Projektdaten und Projektbeginne wurden vereinheitlicht, damit dieselbe fachliche Projektinstanz nicht widersprüchlich mehrfach geführt wird.
- Die 2NF und 3NF wurden fachlich getrennt: partielle Abhängigkeiten werden in der 2NF beseitigt; transitive Abteilungsinformationen werden in der 3NF ausgelagert.
- Für nicht durch die Ausgangsdaten belegte Abteilungsinformationen werden keine Werte erfunden.

## Zoo

- Die Abhängigkeitslogik wurde expliziter gefasst. Die Gehege-Tier-Zuordnung wird über einen zusammengesetzten fachlichen Zusammenhang modelliert.
- In der 3NF werden Pflegerdaten sowie die Abhängigkeit Gehege-Bereich → Gehegeleiter getrennt abgebildet.

## Weiterbildung

- Die vorhandene Grundstruktur wurde beibehalten und einheitlich als KURS, DOZENT und KURS_DOZENT modelliert.
- In der 3NF wird RAUM mit RaumNr, Raumtyp und Rechnerplätze separat geführt.

## Zusätzliche Kursdatei

Für das Gesamttraining wurde ergänzend ein eigener Fall „Future Skills Festival“ erstellt. Er dient als roter Faden und enthält bewusst Wiederholungsgruppen, partielle und transitive Abhängigkeiten, sodass alle drei Normalformen nacheinander angewendet werden können.
