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

        // Gleiche Toggle-Funktion wie der section-help-btn (zweiter Weg,
        // um die Bereichshilfe zu schließen/öffnen)
        this.helpCardCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.help-card');
                this.toggleHelpSection(card.getAttribute('data-section'));
            });
        });

        // Inline help links open the full help card of the given section
        this.helpLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.openHelpSection(section);
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

function setDefaultDueDate() {
    const faellig = document.getElementById('faellig');
    if (!faellig || faellig.value) {
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    faellig.value = `${yyyy}-${mm}-${dd}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HelpSystem();
    setDefaultDueDate();
});
