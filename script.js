// Help System
class HelpSystem {
    constructor() {
        this.sectionHelpBtns = document.querySelectorAll('.section-help-btn');
        this.helpCardCloseBtns = document.querySelectorAll('.help-card-close-btn');
        this.helpLinks = document.querySelectorAll('.help-link');
        this.microHelpBtns = document.querySelectorAll('.micro-help-btn');

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

        // Inline help links open the full help card of the given section
        // und springen dort direkt zum passenden Abschnitt (falls schon einer
        // hinterlegt ist)
        this.helpLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.openHelpSection(section);
                const help = e.currentTarget.closest('.inline-help');
                this.scrollHelpCardToTopic(section, this.getTopicFromHelp(help));
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
                const section = openCard.getAttribute('data-section');
                this.closeHelpSection(section);
                this.getSectionHelpBtn(section)?.focus();
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
        const wrapper = btn.closest('.input-with-help');
        return wrapper?.querySelector('.form-control, .form-select, .form-check-input') ?? null;
    }

    showInlineHelp(help, btn) {
        help.hidden = false;
        btn?.setAttribute('aria-expanded', 'true');

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

    getHelpCard(section) {
        return document.getElementById(`help-${section}`);
    }

    getSectionHelpBtn(section) {
        return document.querySelector(`.section-help-btn[data-section="${section}"]`);
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

    openHelpSection(section) {
        const card = this.getHelpCard(section);
        if (!card) {
            return;
        }

        card.hidden = false;
        this.getSectionHelpBtn(section)?.setAttribute('aria-expanded', 'true');
    }

    closeHelpSection(section) {
        const card = this.getHelpCard(section);
        if (!card) {
            return;
        }

        card.hidden = true;
        this.getSectionHelpBtn(section)?.setAttribute('aria-expanded', 'false');
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
    new HelpSystem();
    setDefaultDueDate();
    setupDateFieldControls();
});
