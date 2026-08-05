# Hilfesystem

Prototyp eines **zweistufigen, kontextuellen Hilfesystems** für Web-Formulare, am Beispiel des Formulars *"Zahlung verausgaben"* aus dem Fachverfahren Erasmus+ (Design-Look **at:las**). Entsteht im Rahmen einer Bachelorarbeit zu Barrierefreiheit in Verwaltungsportalen.

## Ausprobieren

- **`index.html`** — Formular mit Hilfesystem
- **`index.html?variante=baseline`** — dieselbe Formularseite ohne Hilfesystem (Vergleichs-Baseline für die geplante Nutzerstudie)

Reine statische Seite, kein Build-Schritt nötig:

```bash
open index.html
# oder lokal servieren:
npx serve .
```

## Die zwei Hilfe-Ebenen

- **Bereichshilfe**: `i`-Button im Header jedes Formularabschnitts öffnet eine seitliche Karte mit ausführlichen Erklärungen zu allen Feldern des Abschnitts.
- **Mikrohilfe**: `i`-Button an einzelnen Feldern öffnet eine kurze, feldspezifische Erklärung direkt darunter.
- Jede Mikrohilfe verlinkt auf "Weitere Informationen in der Bereichshilfe" — das öffnet die Bereichshilfe fokussiert auf genau das passende Thema.

## Bedienung

**Mikrohilfe öffnen/schließen**: `i`-Button neben einem Feld anklicken (oder per Tastatur fokussieren und <kbd>Enter</kbd>/<kbd>Leertaste</kbd> drücken) öffnet ein kurzes Erklärungs-Panel direkt unter dem Feld. Erneuter Klick auf denselben Button, ein Klick außerhalb des Panels, oder <kbd>Escape</kbd> (während der Fokus im Panel oder auf dem Feld liegt) schließt es wieder.

**Bereichshilfe allgemein öffnen**: großer `i`-Button im Abschnitts-Header öffnet die Bereichshilfe-Karte mit **allen** Themen des Abschnitts untereinander. Der Fokus springt auf die Karte selbst, damit Screenreader den neuen Inhalt automatisch ansagen. Schließen über den X-Button in der Karte, erneuten Klick auf den Header-Button, oder <kbd>Escape</kbd> — der Fokus kehrt danach zum Header-Button zurück.

**Bereichshilfe kontextuell aus der Mikrohilfe öffnen**: Der Link "Weitere Informationen in der Bereichshilfe" am Ende einer Mikrohilfe öffnet dieselbe Bereichshilfe-Karte, aber reduziert auf **nur den zum Feld passenden Abschnitt** (alle anderen Themen bleiben ausgeblendet) und dockt die Karte auf Höhe des Feldes an. Beim Schließen kehrt der Fokus gezielt zu genau diesem Feld zurück, nicht zum Header-Button.

Ist an anderer Stelle bereits eine solche kontextuell geöffnete Bereichshilfe offen und wird eine neue Mikrohilfe geöffnet, schließt sich die alte Bereichshilfe automatisch — zwei offene Hilfe-Ebenen für unterschiedliche Felder gleichzeitig sind nicht vorgesehen.

**Baseline-Variante ausprobieren**: `index.html?variante=baseline` blendet Mikrohilfe und Bereichshilfe vollständig aus (nicht nur unsichtbar, sondern auch aus Tab-Reihenfolge und Accessibility-Tree entfernt) — als Vergleichsbedingung ohne Hilfesystem.

## Dateien

Drei Dateien, keine weitere Modul-Aufteilung: `index.html` (Markup), `style.css` (Styling), `script.js` (`HelpSystem`-Klasse steuert beide Hilfe-Ebenen, plus Formular-Logik wie Datumsfelder und Feld-Abhängigkeiten).
