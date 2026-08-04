// Help System
class HelpSystem {
    constructor() {
        this.sectionHelpBtns = document.querySelectorAll('.section-help-btn');
        this.helpCardCloseBtns = document.querySelectorAll('.help-card-close-btn');
        this.helpLinks = document.querySelectorAll('.help-link');
        this.microHelpBtns = document.querySelectorAll('.micro-help-btn');

        // Section-Name -> { opener, help }: merkt sich pro Sektion, wodurch
        // die Bereichshilfe zuletzt geöffnet wurde (Bereichshilfe-Button
        // oder ein Mikrohilfe-Link samt dessen Panel), damit closeHelpSection
        // den Fokus gezielt dorthin zurückgeben kann.
        this.helpCardOpeners = new Map();

        this.init();
    }

    init() {
        // Jeder micro-help-btn steuert per aria-controls sein eigenes
        // inline-help-Panel. Bewusst nur klickbar, nicht fokusgesteuert:
        // Klick/Fokus auf das Feld selbst soll ausschließlich dessen
        // native Funktion auslösen (Dropdown/Datepicker öffnen usw.), ohne
        // gleichzeitig die Mikrohilfe mitzutriggern.
        this.microHelpBtns.forEach(btn => {
            const help = this.getInlineHelp(btn);
            if (!help) {
                return;
            }

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleInlineHelp(help, btn);
            });
        });

        // Section help buttons - toggle the help card inside that section
        this.sectionHelpBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.toggleHelpSection(section);
            });
        });

        // Schlichter X-Button: schließt die Bereichshilfe immer, kein Toggle
        this.helpCardCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.help-card');
                this.closeHelpSection(card.getAttribute('data-section'));
            });
        });

        // Inline-Help-Links öffnen die Bereichshilfe fokussiert auf genau
        // das Thema des auslösenden Felds (nicht die komplette Karte) und
        // docken direkt am Feld an statt an der Sektion (siehe
        // openHelpSectionFocused). Das umgebende Mikrohilfe-Panel schließt
        // sich dabei, damit nicht zweimal ähnlicher Hilfetext untereinander
        // steht – es öffnet sich beim Schließen der Bereichshilfe wieder
        // (siehe closeHelpSection).
        this.helpLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                const help = e.currentTarget.closest('.inline-help');
                const topic = this.getTopicFromHelp(help);

                if (help && !help.hidden) {
                    this.hideInlineHelp(help, this.getMicroHelpBtnFor(help));
                }

                this.openHelpSectionFocused(section, topic, e.currentTarget, help);
                this.focusHelpCardTopic(section, topic);
            });
        });

        // Klick außerhalb eines offenen Mikrohilfe-Panels (und außerhalb
        // seines Toggle-Buttons/Feldes) schließt es wieder
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.inline-help').forEach(help => {
                if (help.hidden) {
                    return;
                }

                const btn = this.getMicroHelpBtnFor(help);
                const control = btn ? this.getAssociatedControl(btn) : null;

                if (help.contains(e.target) || btn?.contains(e.target) || control === e.target) {
                    return;
                }

                this.hideInlineHelp(help, btn);
            });
        });

        // Escape closes whichever help panel currently has focus
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') {
                return;
            }

            document.querySelectorAll('.inline-help').forEach(help => {
                if (help.hidden) {
                    return;
                }

                const btn = this.getMicroHelpBtnFor(help);
                const control = btn ? this.getAssociatedControl(btn) : null;

                if (!help.contains(document.activeElement) && document.activeElement !== control) {
                    return;
                }

                this.hideInlineHelp(help, btn);
                (control ?? btn)?.focus();
            });

            const openCard = document.activeElement?.closest('.help-card');
            if (openCard) {
                this.closeHelpSection(openCard.getAttribute('data-section'));
            }
        });
    }

    getInlineHelp(btn) {
        const id = btn.getAttribute('aria-controls');
        return id ? document.getElementById(id) : null;
    }

    getMicroHelpBtnFor(help) {
        return help.id ? document.querySelector(`.micro-help-btn[aria-controls="${help.id}"]`) : null;
    }

    getAssociatedControl(btn) {
        const wrapper = btn.closest('.input-with-help, .form-check.checkbox-group');
        return wrapper?.querySelector('.form-control, .form-select, .form-check-input') ?? null;
    }

    showInlineHelp(help, btn) {
        // Ist irgendwo eine Bereichshilfe im Fokus-Modus offen (also über
        // einen Mikrohilfe-Link aktiviert, siehe openHelpSectionFocused),
        // schließt sie sich zuerst wieder – zwei offene Hilfe-Ebenen für
        // (potenziell) dasselbe Feld sind redundant, und ein erneuter Klick
        // aufs i-Icon eines Felds soll immer zur kleinen Mikrohilfe führen,
        // nicht zusätzlich zur weiterhin offenen Bereichshilfe. Nur
        // Fokus-Modus-Karten betroffen (entry.help gesetzt) – eine über den
        // Bereichshilfe-Button geöffnete volle Karte bleibt unangetastet.
        this.helpCardOpeners.forEach((entry, sec) => {
            if (entry.help) {
                this.closeHelpSectionCard(sec);
            }
        });

        help.hidden = false;
        btn?.setAttribute('aria-expanded', 'true');

        // Verknüpft das zum Button gehörende Feld per aria-describedby mit
        // der Mikrohilfe, solange sie sichtbar ist: Screenreader lesen den
        // Hilfetext dann als Beschreibung des Felds vor (z.B. beim erneuten
        // Fokussieren nach dem Öffnen per i-icon).
        const control = this.getAssociatedControl(btn);
        if (control) {
            const describedBy = new Set((control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
            describedBy.add(help.id);
            control.setAttribute('aria-describedby', [...describedBy].join(' '));
        }

        // Fokus ins Panel selbst (tabindex="-1" im Markup), damit der neue
        // Hilfetext von Screenreadern automatisch vorgelesen wird, statt nur
        // still im Hintergrund zu erscheinen, während der Fokus weiter auf
        // dem i-Icon steht (per NVDA-Test aufgefallen).
        help.focus({ preventScroll: true });

        // Falls die Bereichshilfe der Sektion bereits offen ist, direkt zum
        // passenden Abschnitt scrollen (no-op, falls noch keiner hinterlegt
        // ist oder die Bereichshilfe geschlossen ist)
        const section = help.closest('.form-section')?.getAttribute('data-section');
        if (section) {
            this.scrollHelpCardToTopic(section, this.getTopicFromHelp(help));
        }
    }

    hideInlineHelp(help, btn) {
        help.hidden = true;
        btn?.setAttribute('aria-expanded', 'false');

        const control = this.getAssociatedControl(btn);
        if (control) {
            const describedBy = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== help.id);
            if (describedBy.length) {
                control.setAttribute('aria-describedby', describedBy.join(' '));
            } else {
                control.removeAttribute('aria-describedby');
            }
        }
    }

    toggleInlineHelp(help, btn) {
        if (help.hidden) {
            this.showInlineHelp(help, btn);
        } else {
            this.hideInlineHelp(help, btn);
        }
    }

    // Themen-Kürzel aus der id einer Mikrohilfe ableiten, z.B.
    // "microhelp-typ" -> "typ". Passende Abschnitte in der Bereichshilfe
    // tragen dasselbe Kürzel als data-topic-Attribut.
    getTopicFromHelp(help) {
        const prefix = 'microhelp-';
        return help?.id?.startsWith(prefix) ? help.id.slice(prefix.length) : null;
    }

    // Scrollt die (bereits offene) Bereichshilfe einer Sektion so, dass der
    // Abschnitt mit dem passenden data-topic ganz oben steht. Tut nichts,
    // wenn die Bereichshilfe geschlossen ist oder noch kein Abschnitt mit
    // diesem Thema hinterlegt wurde (wird nach und nach ergänzt).
    scrollHelpCardToTopic(section, topic) {
        if (!topic) {
            return;
        }

        const card = this.getHelpCard(section);
        if (!card || card.hidden) {
            return;
        }

        const target = card.querySelector(`[data-topic="${topic}"]`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Setzt beim Öffnen der Bereichshilfe aus einer Mikrohilfe heraus den
    // Fokus in die Bereichshilfe hinein (auf den passenden Abschnitt, sonst
    // auf den Schließen-Button), statt ihn auf dem jetzt versteckten
    // Mikrohilfe-Link zu belassen.
    focusHelpCardTopic(section, topic) {
        const card = this.getHelpCard(section);
        if (!card || card.hidden) {
            return;
        }

        const target = topic ? card.querySelector(`[data-topic="${topic}"]`) : null;
        (target ?? card.querySelector('.help-card-close-btn'))?.focus({ preventScroll: true });
    }

    getHelpCard(section) {
        return document.getElementById(`help-${section}`);
    }

    getSectionHelpBtn(section) {
        return document.querySelector(`.section-help-btn[data-section="${section}"]`);
    }

    // Läuft von el aus die Ancestor-Kette hoch bis zu dem Element, das
    // direktes Kind von formSection ist (z.B. .form-row, .form-check.
    // checkbox-group). Einheitlicher Anker fürs Umhängen der Bereichshilfe,
    // unabhängig vom Feldtyp – niemals direkt in ein .form-row einfügen
    // (2-Spalten-Grid für genau 2 .form-group-Kinder, ein drittes Element
    // würde das Layout zerschießen).
    findSectionChild(el, formSection) {
        let node = el;
        while (node && node.parentElement !== formSection) {
            node = node.parentElement;
        }
        return node;
    }

    // Verschiebt die Bereichshilfe-Karte direkt hinter den übergebenen Anker
    // (die Feld-Zeile, siehe findSectionChild) und setzt die CSS-Custom-
    // Property fürs Andocken auf Feldhöhe (wirkt nur auf Desktop, siehe
    // .help-card--focused in style.css – im normalen Textfluss auf Mobile
    // landet die Karte durch die DOM-Verschiebung allein schon direkt am
    // Feld). anchor wird vom Aufrufer ermittelt statt hier selbst geclimbt,
    // damit derselbe Anker auch fürs Scrollen wiederverwendet werden kann.
    relocateHelpCardToField(card, anchor, formSection) {
        if (!anchor) {
            return;
        }

        anchor.after(card);
        const offset = anchor.getBoundingClientRect().top - formSection.getBoundingClientRect().top;
        card.style.setProperty('--help-card-top', `${offset}px`);
        card.classList.add('help-card--focused');
    }

    // Setzt eine Bereichshilfe-Karte auf ihren Grundzustand zurück: alle
    // Unterabschnitte wieder sichtbar, zurück an ihren ursprünglichen Platz
    // im DOM (direkt nach dem .section-header), Fokus-Modus-Styling entfernt.
    // Wird sowohl vor jedem Öffnen als auch beim Schließen aufgerufen, damit
    // nie Zustand einer vorherigen Öffnung hängen bleibt.
    resetHelpCardToDefault(card, formSection) {
        card.querySelectorAll('.help-subsection[hidden]').forEach(sub => {
            sub.hidden = false;
        });

        const header = formSection.querySelector(':scope > .section-header');
        if (header && card.previousElementSibling !== header) {
            header.after(card);
        }

        card.classList.remove('help-card--focused');
        card.style.removeProperty('--help-card-top');
    }

    toggleHelpSection(section) {
        const card = this.getHelpCard(section);
        if (!card) {
            return;
        }

        if (card.hidden) {
            this.openHelpSection(section);
        } else {
            this.closeHelpSection(section);
        }
    }

    // Voller Modus (Bereichshilfe-Button): zeigt wieder alle Unterabschnitte
    // an der gewohnten Stelle/Position, unabhängig davon, ob die Karte zuvor
    // im Fokus-Modus offen war.
    openHelpSection(section) {
        const card = this.getHelpCard(section);
        if (!card) {
            return;
        }

        const formSection = card.closest('.form-section');
        if (formSection) {
            this.resetHelpCardToDefault(card, formSection);
        }

        card.hidden = false;
        const btn = this.getSectionHelpBtn(section);
        btn?.setAttribute('aria-expanded', 'true');
        this.helpCardOpeners.set(section, { opener: btn });

        // Fokus auf die Karte selbst (role="region", tabindex="-1" im
        // Markup), damit sie von Screenreadern vorgelesen wird. Bisher blieb
        // der Fokus beim öffnenden Button stehen und die neu sichtbare
        // Bereichshilfe wurde dadurch nicht automatisch angesagt (per
        // NVDA-Test aufgefallen) – anders als im Fokus-Modus, wo bereits
        // gezielt in den passenden Unterabschnitt fokussiert wird.
        card.focus({ preventScroll: true });
    }

    // Fokus-Modus (Mikrohilfe-Link): zeigt nur den zu topic passenden
    // Unterabschnitt und dockt die Karte auf Höhe des auslösenden Felds an.
    // help ist das (bereits geschlossene) Mikrohilfe-Panel, aus dem der Link
    // stammt – wird beim Schließen der Bereichshilfe wieder geöffnet.
    openHelpSectionFocused(section, topic, opener, help) {
        const card = this.getHelpCard(section);
        const formSection = card?.closest('.form-section');
        if (!card || !formSection) {
            return;
        }

        this.resetHelpCardToDefault(card, formSection);

        if (topic) {
            card.querySelectorAll('.help-subsection').forEach(sub => {
                sub.hidden = sub.getAttribute('data-topic') !== topic;
            });
        }

        // Vom micro-help-btn aus climben, nicht vom Link: der Link steckt im
        // help-Panel, das gerade per hideInlineHelp geschlossen wurde (siehe
        // helpLinks-Handler in init()) – ein verstecktes Element hätte ein
        // Nullen-Rect. Der micro-help-btn ist Teil der sichtbaren Feld-UI und
        // bleibt unabhängig davon, wie das help-Panel im Markup hängt (z.B.
        // bei Checkbox-Feldern wie "Wohnhaft in Deutschland" liegt es direkt
        // unter .form-section statt im .form-group).
        const microHelpBtn = help ? this.getMicroHelpBtnFor(help) : null;
        const anchor = this.findSectionChild(microHelpBtn ?? opener, formSection);

        this.relocateHelpCardToField(card, anchor, formSection);

        card.hidden = false;
        this.getSectionHelpBtn(section)?.setAttribute('aria-expanded', 'true');
        this.helpCardOpeners.set(section, { opener, help });

        // Immer die Feld-Zeile nach oben scrollen, nicht den Hilfetext
        // innerhalb der Karte (der steht ja jetzt direkt dahinter) – sonst
        // müsste über das Feld hinweg nach unten gescrollt werden, und genau
        // das Feld, um das es geht, verschwindet aus dem Viewport.
        anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    closeHelpSection(section) {
        this.closeHelpSectionCard(section)?.focus();
    }

    // Schließt die Karte und räumt Inhalt/Position/Map-Eintrag auf, fokussiert
    // aber selbst nichts – gibt stattdessen das sinnvolle Fokus-Ziel zurück.
    // Getrennt von closeHelpSection(), damit ein Cross-Close (siehe
    // showInlineHelp: eine fokussierte Bereichshilfe wird automatisch
    // geschlossen, wenn anderswo eine Mikrohilfe geöffnet wird) den Fokus
    // nicht vom gerade angeklickten Mikrohilfe-Button wegreißt.
    closeHelpSectionCard(section) {
        const card = this.getHelpCard(section);
        if (!card) {
            return null;
        }

        const formSection = card.closest('.form-section');
        if (formSection) {
            this.resetHelpCardToDefault(card, formSection);
        }

        card.hidden = true;
        const btn = this.getSectionHelpBtn(section);
        btn?.setAttribute('aria-expanded', 'false');

        // Fokus-Ziel für den Aufrufer: beim Button-Pfad der Bereichshilfe-
        // Button selbst. Kam die Karte aus einem Mikrohilfe-Link, NICHT der
        // Link (der steckt in einem Panel, das beim Öffnen der Bereichshilfe
        // geschlossen wurde, siehe helpLinks-Handler in init(), und ist keine
        // sinnvolle Landestelle mehr), sondern direkt das Formularfeld, von
        // dem die Mikrohilfe ursprünglich geöffnet wurde.
        const entry = this.helpCardOpeners.get(section);
        this.helpCardOpeners.delete(section);

        const microHelpBtn = entry?.help ? this.getMicroHelpBtnFor(entry.help) : null;
        const control = microHelpBtn ? this.getAssociatedControl(microHelpBtn) : null;
        const opener = entry?.opener?.isConnected ? entry.opener : null;
        return control ?? opener ?? btn ?? null;
    }
}

// Parst eine manuell eingetippte Formatvorlage TT.MM.JJJJ in ein
// ISO-Datum (yyyy-mm-dd). Gibt null zurück bei leerem/ungültigem Text
// oder nicht existierenden Daten (z.B. 31.02.2026).
function parseGermanDate(text) {
    const match = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Koppelt ein sichtbares Text-Anzeigefeld mit einem unsichtbaren echten
// type="date"-Feld: kein natives Browser-Icon kann auf dem Textfeld
// auftauchen, die Datumsauswahl läuft trotzdem nativ über showPicker()
// auf dem versteckten Feld. Löst das browserabhängige Icon-Chaos endgültig.
// Manuelle Eingabe im Format TT.MM.JJJJ (siehe placeholder) bleibt möglich
// und wird beim Verlassen des Felds mit dem echten Datumsfeld synchronisiert.
function setupDateFieldControls() {
    document.querySelectorAll('.input-with-help--date').forEach(wrapper => {
        const display = wrapper.querySelector('input[type="text"].form-control');
        const nativeInput = wrapper.querySelector('.native-date-input');
        const clearBtn = wrapper.querySelector('.field-clear-btn');
        const calendarBtn = wrapper.querySelector('.field-calendar-btn');

        if (!display || !nativeInput) {
            return;
        }

        const formatter = new Intl.DateTimeFormat('de-DE');

        const syncDisplay = () => {
            if (nativeInput.value) {
                const [y, m, d] = nativeInput.value.split('-').map(Number);
                display.value = formatter.format(new Date(y, m - 1, d));
            } else {
                display.value = '';
            }

            if (clearBtn) {
                clearBtn.hidden = !nativeInput.value;
            }
        };

        nativeInput.addEventListener('change', syncDisplay);

        // Manuelle Eingabe: beim Verlassen des Felds parsen. Bei gültigem
        // Datum wird das echte Feld übernommen, sonst zeigt syncDisplay()
        // wieder den letzten gültigen Stand (oder die Formatvorlage).
        display.addEventListener('change', () => {
            const text = display.value.trim();
            nativeInput.value = text ? (parseGermanDate(text) ?? nativeInput.value) : '';
            syncDisplay();
        });

        calendarBtn?.addEventListener('click', () => {
            if (typeof nativeInput.showPicker === 'function') {
                nativeInput.showPicker();
            } else {
                nativeInput.focus();
            }
        });

        clearBtn?.addEventListener('click', () => {
            nativeInput.value = '';
            syncDisplay();
            display.focus();
        });

        syncDisplay();
    });
}

// Koppelt Checkbox und abhängiges Feld: "Land" ist nur relevant, wenn der
// Zahlungspartner NICHT in Deutschland wohnt; "Steuer-ID" ist nur bei einer
// Honorarzahlung nötig. Das abhängige Feld wird entsprechend deaktiviert
// (und damit auch aus der Tab-Reihenfolge genommen), nicht nur ausgegraut.
// Hat das Feld eine eigene Mikrohilfe (z.B. Steuer-ID), wird deren Button
// im selben Zug deaktiviert und ein bereits geöffnetes Panel geschlossen –
// ein deaktiviertes Feld soll keine aktivierbare Mikrohilfe mehr haben.
function setupConditionalFields(helpSystem) {
    const syncDisabled = (checkboxId, fieldId, disableWhenChecked) => {
        const checkbox = document.getElementById(checkboxId);
        const field = document.getElementById(fieldId);
        if (!checkbox || !field) {
            return;
        }

        const microHelpBtn = field.closest('.input-with-help')?.querySelector('.micro-help-btn');

        const sync = () => {
            const disabled = disableWhenChecked ? checkbox.checked : !checkbox.checked;
            field.disabled = disabled;

            if (!microHelpBtn) {
                return;
            }

            microHelpBtn.disabled = disabled;

            const help = helpSystem.getInlineHelp(microHelpBtn);
            if (disabled && help && !help.hidden) {
                helpSystem.hideInlineHelp(help, microHelpBtn);
            }
        };

        checkbox.addEventListener('change', sync);
        sync();
    };

    syncDisabled('wohnsitz', 'land', true);
    syncDisabled('honorar', 'steuernr', false);
}

function setDefaultDueDate() {
    const nativeInput = document.getElementById('faellig-value');
    if (!nativeInput || nativeInput.value) {
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    nativeInput.value = `${yyyy}-${mm}-${dd}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const helpSystem = new HelpSystem();
    setDefaultDueDate();
    setupDateFieldControls();
    setupConditionalFields(helpSystem);
});
