# Hilfesystem

Ein HTML/CSS/JS-Prototyp für ein **zweistufiges, kontextuelles Hilfesystem** in Web-Formularen. Demonstriert wird das Konzept am Beispiel des Formulars *"Zahlung verausgaben"* aus dem Fachverfahren **Erasmus+** (Design-Look des Systems **at:las**).

Ziel des Prototyps ist es zu zeigen, wie sich Nutzer:innen an zwei unterschiedlichen Stellen mit passend dosierter Hilfe unterstützen lassen: einmal auf Ebene eines ganzen Formularabschnitts, einmal direkt am einzelnen Eingabefeld – und wie beide Ebenen miteinander verknüpft sind.

## Hintergrund

Die Seite ist der Nachbau einer einzelnen Bildschirmmaske aus einem größeren Verwaltungssystem (**at:las**), mit der Sachbearbeiter:innen im Rahmen des Förderprogramms **Erasmus+** Zahlungen verausgaben. Statt das gesamte System nachzubauen, konzentriert sich der Prototyp bewusst auf diese eine Seite, um daran das zweistufige Hilfekonzept isoliert zu entwickeln und zu testen: Formularstruktur, Feldbezeichnungen und Breadcrumb-Pfad orientieren sich an einem realen Ablauf (*Startseite → Erasmus → Projektübersicht → Kontoverwaltung → Zahlung verausgaben*), die Inhalte selbst sind aber exemplarisch.

## Navigation

- **Header**: Logo links, rechts drei Icon-Buttons (Darstellung umschalten, allgemeine Hilfe, Benutzerkonto).
- **Breadcrumb**: zeigt den Pfad zur aktuellen Seite als semantische Liste (`<nav aria-label="Breadcrumb"><ol>…</ol></nav>`). Der aktuelle Schritt ist zusätzlich per `aria-current="page"` ausgezeichnet; die "/"-Trennzeichen sind rein dekorativ per CSS erzeugt und für Screenreader unsichtbar.
- **Formular**: drei inhaltlich abgeschlossene Abschnitte – *Zahlungspartner*, *Zahlungsdaten*, *Anhänge*. Jeder Abschnitt ist ein per `aria-labelledby` benanntes `<section>` (Landmark-Region) mit eigenem `?`-Button für die Bereichshilfe.
- **Footer**: Rechtliche/Support-Links, ebenfalls als semantische Liste (`<ul>`).
- **Überschriften-Hierarchie**: durchgängig `h1` (Seitentitel) → `h2` (Formularabschnitt) → `h3` (Bereichshilfe-Titel) → `h4` (Unterabschnitte in der Bereichshilfe), ohne Sprünge – Screenreader-Nutzer:innen können damit per Kurzbefehl gezielt durch die Struktur springen.

## Die zwei Hilfe-Ebenen

### 1. Bereichshilfe (Section Help)
Jeder Formularabschnitt (*Zahlungspartner*, *Zahlungsdaten*, *Anhänge*) hat einen `?`-Button im Abschnitts-Header. Ein Klick öffnet eine seitliche Hilfekarte (`.help-card`, `role="region"`) mit ausführlichen Erklärungen zu allen Feldern des Abschnitts, inkl. Hinweisen und Links zur allgemeinen Dokumentation/FAQ. Der Button wirkt als Toggle, ein eigener Schließen-Button (X) schließt die Karte immer.

![Bereichshilfe und Mikrohilfe](FormularSeiteBereichshilfeMikrohilfe.png)

### 2. Mikrohilfe (Inline Help)
Einzelne Felder (z. B. *Typ*, *Steuer-ID*, *Fällig am*, *Verwendungszweck*) haben einen kleinen `i`-Button. Er öffnet ein kompaktes Inline-Panel direkt unter dem Feld mit einer kurzen, feldspezifischen Erklärung.

![Mikrohilfe / Tooltip](FormularSeiteToolTip.png)

### Verknüpfung beider Ebenen
Jede Mikrohilfe enthält einen Link *"Weitere Informationen und Hilfen finden Sie in der Bereichshilfe"*. Ein Klick darauf öffnet die zugehörige Bereichshilfe und scrollt automatisch zum passenden Unterabschnitt. Die Zuordnung erfolgt über ein gemeinsames Themen-Kürzel: Die ID der Mikrohilfe (`microhelp-typ`) wird zu einem Topic (`typ`) und mit dem `data-topic`-Attribut des passenden Abschnitts in der Bereichshilfe abgeglichen.

## Barrierefreiheit

Neben den beiden Hilfe-Ebenen selbst wurde gezielt auf Screenreader- und Tastatur-Kompatibilität geachtet:

- **Fokus-Management**: Die Bereichshilfe merkt sich beim Schließen (X-Button, erneuter Klick aufs `?`-Icon oder Escape) immer den auslösenden Button und fokussiert ihn zurück. Öffnet man die Bereichshilfe über den "Weitere Informationen"-Link einer Mikrohilfe, springt der Fokus direkt in den passenden Unterabschnitt.
- **`aria-describedby`-Kopplung**: Solange eine Mikrohilfe geöffnet ist, wird das zugehörige Eingabefeld per `aria-describedby` mit dem Hilfetext verknüpft – Screenreader lesen ihn dann als Beschreibung des Feldes vor.
- **Landmark-Regionen**: Alle drei Formularabschnitte sind per `aria-labelledby` benannte Regionen. Die Bereichshilfe-Karten selbst sind `role="region"` statt `<aside>`, das als "complementary" – also als überspringbare Nebensächlichkeit – missverstanden würde, obwohl der Inhalt für das Ausfüllen relevant ist.
- **Kontrast**: Link- und Icon-Farben sowie Placeholder-Text erfüllen WCAG AA (≥ 4.5:1 auf Weiß).
- **Bedingte Felder**: "Land" ist deaktiviert, solange "Wohnhaft in Deutschland" aktiv ist; "Steuer-ID" ist nur bei aktivierter "Honorarzahlung" nutzbar. Deaktivierte Felder sind rein optisch abgeblendet (nicht grau hinterlegt) und aus der Tab-Reihenfolge entfernt.
- **Interaktion**: Klick außerhalb eines offenen Mikrohilfe-Panels schließt es; Escape schließt das fokussierte Panel bzw. die offene Bereichshilfe.
- **Icons**: alle dekorativen Icons sind inline SVGs (Bootstrap-Icons-Pfade) mit `aria-hidden="true"` und tauchen damit nicht als eigener, unbenannter Eintrag im Accessibility-Baum auf.

## Projektstruktur

| Datei/Ordner | Beschreibung |
|---|---|
| `index.html` | Formular-Markup mit den drei Abschnitten Zahlungspartner, Zahlungsdaten, Anhänge inkl. eingebetteter Hilfe-Elemente |
| `style.css` | Styling im at:las-Look (Farben, Header, Formular, Hilfekarten, Responsive-Verhalten) |
| `script.js` | `HelpSystem`-Klasse (Steuerung von Bereichs-/Mikrohilfe) sowie Datumsfeld- und Feld-Abhängigkeits-Logik (Land/Steuer-ID) |
| `FormularSeiteBereichshilfeMikrohilfe.png`, `FormularSeiteToolTip.png` | Screenshots der beiden Hilfe-Ebenen |


## Verwendung

Der Prototyp ist eine rein statische Seite (Bootstrap 5.3.3 wird per CDN eingebunden). Es genügt, `index.html` im Browser zu öffnen, z. B.:

```bash
open index.html
```

Alternativ lokal hosten, z. B. mit:

```bash
npx serve .
```
