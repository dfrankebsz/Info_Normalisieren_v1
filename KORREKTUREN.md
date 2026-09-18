# Prüfung und Korrekturen der gelieferten Excel-Materialien

Die Kursfassungen wurden auf einheitliche Schlüssel- und Abhängigkeitslogik gebracht.

## Schule
- In `Normalisierung_Skript_Schule_vor1NF.xlsx` stand in einer Zeile im Nachnamenfeld `Lea Lustig`. In der Kursfassung ist dies zu `Lustig` korrigiert.
- Die 2NF/3NF-Folge wurde an die im Skript dargestellte Zerlegung angeglichen:
  SCHUELER, UNTERRICHT, SCHUELER_UNTERRICHT und ab 3NF zusätzlich KLASSE.

## Sprachkurse
- In der gelieferten 3NF-Lösung wurde `Abt` aus PERSON entfernt. Dadurch ging die Zuordnung Person -> Abteilung verloren.
- Korrigiert: PERSON behält `Abt` als Fremdschlüssel; ABTEILUNG enthält `Abt` und `Leiter`.

## Projekte
- Die gelieferten 2NF/3NF-Lösungen enthielten doppelte Projektidentitäten bzw. inkonsistente Projektbeginne.
- Korrigiert wurden drei eindeutige Projekte:
  - Bilanzierung - 2020-01-01
  - interne Systeme - 2021-04-01
  - Expansion - 2023-08-01
- Die Erklärung der 2NF und 3NF wurde getrennt: partielle Abhängigkeiten werden in 2NF beseitigt; Abteilungsinformationen werden wegen transitiver Abhängigkeiten in 3NF ausgelagert.
- Für die Abteilung Finanzen ist in den Ausgangsdaten keine eigene Projekt-Kostenstelle belegt. Deshalb wird in der korrigierten Referenz keine Kostenstelle erfunden.

## Zoo
- Die ursprüngliche Erklärung zur transitiven Abhängigkeit war uneindeutig.
- Korrigierte Modellannahme: (Gehege-Nr, Tierart) ist der zusammengesetzte Schlüssel der Gehege-Tier-Zuordnung.
- 2NF trennt gehegeabhängige Attribute; 3NF trennt zusätzlich Pflegerdaten und Gehege-Bereich -> Gehegeleiter.

## Weiterbildung
- Die Grundstruktur wurde beibehalten.
- Einheitlich modelliert wird: KURS, DOZENT, KURS_DOZENT; in 3NF zusätzlich RAUM mit RaumNr, Raumtyp und Rechnerplätze.
