// Automatische Aufzeichnung für den Nutzertest der Bachelorarbeit.
//
// Aktiv NUR, wenn das Formular über testleitung.html geöffnet wurde (URL
// enthält tp, durchgang und szenario). Bei normalem Aufruf von index.html
// passiert hier nichts.
//
// Bewusst von script.js getrennt: Die Aufzeichnung greift nicht in die
// HelpSystem-Klasse ein und ändert weder DOM-Struktur noch ARIA-Angaben des
// Formulars. Sie beobachtet nur, welche Hilfetexte sichtbar werden, und liest
// beim Bestätigen die Felder aus.
//
// Erhoben wird (siehe Methodenteil der Arbeit):
//   - Endzustand aller Felder beim Klick auf "Richtigkeit der Daten bestätigen"
//   - je Feld mit Hilfe: War die Hilfe zu diesem Feld mindestens einmal
//     sichtbar? (Mikrohilfe des Felds ODER Themenabschnitt der Bereichshilfe,
//     egal in welchem Modus geöffnet)
// Bewusst NICHT erhoben: Zeitstempel, Häufigkeiten, Klickwege, Mausdaten.

(() => {
    const params = new URLSearchParams(location.search);
    const tp = params.get('tp');
    const durchgang = params.get('durchgang');
    const szenario = params.get('szenario');
    if (!tp || !durchgang || !szenario) {
        return;
    }

    const SPEICHER_SCHLUESSEL = 'nutzertest-daten';
    const variante = document.documentElement.classList.contains('baseline') ? 'Baseline' : 'Prototyp';

    // Felder in Formularreihenfolge (id → Spaltenname in der Export-Tabelle).
    const FELDER = [
        ['typ', 'Typ'],
        ['anrede', 'Anrede'],
        ['vorname', 'Vorname'],
        ['name-jp', 'Name (juristische Person)'],
        ['nachname', 'Nachname'],
        ['strasse', 'Straße'],
        ['hausnummer', 'Hausnummer'],
        ['postleitzahl', 'Postleitzahl'],
        ['ort', 'Ort'],
        ['wohnsitz', 'Wohnhaft in Deutschland'],
        ['land', 'Land'],
        ['iban', 'IBAN'],
        ['bic', 'BIC'],
        ['konto', 'Abweichender Kontoinhaber'],
        ['honorar', 'Honorarzahlung'],
        ['steuernr', 'Steuer-ID'],
        ['steuernummer', 'Steuernummer'],
        ['geburtsdatum', 'Geburtsdatum'],
        ['betrag', 'Auszahlungsbetrag'],
        ['faellig', 'Fällig am'],
        ['verwendung', 'Verwendungszweck'],
        ['vermerkt', 'Interner Vermerk'],
        ['kommentar', 'Kommentar Zahlungsdaten'],
        ['kommentar-anhang', 'Kommentar Anhänge'],
    ];

    // Themen mit Hilfe: Mikrohilfe #microhelp-<thema>, Bereichshilfe
    // .help-subsection[data-topic="<thema>"].
    const HILFE_THEMEN = ['typ', 'wohnsitz', 'iban', 'bic', 'konto', 'honorar',
        'steuernr', 'steuernummer', 'faellig', 'verwendung', 'vermerkt'];

    const hilfeSichtbar = Object.fromEntries(HILFE_THEMEN.map(t => [t, false]));

    // Sichtbar = weder das Element selbst noch ein Vorfahr trägt [hidden].
    // (Die Hilfen werden in script.js ausschließlich über das hidden-Attribut
    // ein- und ausgeblendet.)
    const istSichtbar = el => el !== null && el.closest('[hidden]') === null;

    function hilfeZustandErfassen() {
        for (const thema of HILFE_THEMEN) {
            if (hilfeSichtbar[thema]) {
                continue;
            }
            const mikro = document.getElementById(`microhelp-${thema}`);
            const bereich = document.querySelector(`.help-card .help-subsection[data-topic="${thema}"]`);
            if (istSichtbar(mikro) || istSichtbar(bereich)) {
                hilfeSichtbar[thema] = true;
            }
        }
    }

    function feldWert(id) {
        const el = document.getElementById(id);
        if (!el) {
            return '';
        }
        if (el.closest('[hidden]')) {
            return 'ausgeblendet';
        }
        if (el.disabled) {
            return 'gesperrt';
        }
        if (el.type === 'checkbox') {
            return el.checked ? 'ja' : 'nein';
        }
        if (el.tagName === 'SELECT') {
            return el.value === '' ? '' : el.options[el.selectedIndex].text.trim();
        }
        return el.value;
    }

    function datensatzSpeichern() {
        hilfeZustandErfassen();
        // Als geordnete [Spaltenname, Wert]-Paare gespeichert, damit
        // testleitung.html die Export-Tabelle ohne eigene Feldliste bauen kann.
        const feldname = Object.fromEntries(FELDER);
        const felder = FELDER.map(([id, name]) => [name, feldWert(id)]);
        const hilfe = HILFE_THEMEN.map(thema => [
            feldname[thema],
            variante === 'Prototyp' ? (hilfeSichtbar[thema] ? 'ja' : 'nein') : '–',
        ]);
        const datensatz = { tp, durchgang, szenario, variante, felder, hilfe };

        const alle = JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL) || '[]')
            .filter(d => !(d.tp === tp && d.durchgang === durchgang));
        alle.push(datensatz);
        localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(alle));
    }

    function dankesmeldungZeigen(gespeichert) {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        const ueberschrift = document.createElement('h1');
        ueberschrift.textContent = 'Vielen Dank.';
        ueberschrift.tabIndex = -1;
        const text = document.createElement('p');
        text.textContent = 'Ihre Angaben wurden übernommen.';
        main.append(ueberschrift, text);
        if (!gespeichert) {
            const fehler = document.createElement('p');
            fehler.textContent = '(Hinweis für den Testleiter: Speichern fehlgeschlagen.)';
            main.append(fehler);
        }
        ueberschrift.focus();
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (variante === 'Prototyp') {
            new MutationObserver(hilfeZustandErfassen).observe(document.body, {
                subtree: true,
                attributes: true,
                attributeFilter: ['hidden'],
            });
        }

        const bestaetigen = document.querySelector('.form-actions .btn-primary');
        bestaetigen?.addEventListener('click', () => {
            let gespeichert = true;
            try {
                datensatzSpeichern();
            } catch (fehler) {
                console.error(fehler);
                gespeichert = false;
            }
            dankesmeldungZeigen(gespeichert);
        });
    });
})();
