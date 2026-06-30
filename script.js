// Help System
class HelpSystem {
    constructor() {
        this.helpSidebar = document.querySelector('.help-sidebar');
        this.sectionHelpBtns = document.querySelectorAll('.section-help-btn');
        this.helpCardCloseBtns = document.querySelectorAll('.help-card-close-btn');
        this.helpLinks = document.querySelectorAll('.help-link');
        this.steuerId = document.getElementById('steuernr');
        this.inlineHelp = this.steuerId?.closest('.form-group')?.querySelector('.inline-help');
        this.microHelpBtn = document.querySelector('.micro-help-btn');
        this.formSections = document.querySelectorAll('.form-section');
        this.helpSectionCards = document.querySelectorAll('.help-section-card');
        this.mainContent = document.querySelector('.main-content');
        this.helpContent = document.querySelector('.help-content');
        this.openSections = new Set(); // Track which sections are open

        this.init();
    }

    init() {
        // Inline help - show on focus
        if (this.steuerId) {
            this.steuerId.addEventListener('focus', () => this.showInlineHelp());
        }

        if (this.microHelpBtn) {
            this.microHelpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showInlineHelp();
                this.steuerId?.focus();
            });
        }

        // Section help buttons - toggle help sidebar
        this.sectionHelpBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const section = e.currentTarget.getAttribute('data-section');
                this.toggleHelpSection(section);
            });
        });

        // Close buttons on each help card
        this.helpCardCloseBtns.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.help-section-card');
                const section = card.getAttribute('data-section');
                this.closeHelpSection(section);
            });
        });

        // Inline help links
        this.helpLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.openHelpSection(section);
            });
        });

        // Close inline help when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (this.inlineHelp && !e.target.closest('.form-group')) {
                this.hideInlineHelp();
            }
        });

        // Sync help section heights and positions with form sections
        this.syncHeightsAndPositions();
        window.addEventListener('resize', () => this.syncHeightsAndPositions());
        this.mainContent.addEventListener('scroll', () => this.syncHeightsAndPositions());
    }

    showInlineHelp() {
        if (this.inlineHelp) {
            this.inlineHelp.style.display = 'block';
        }
    }

    hideInlineHelp() {
        if (this.inlineHelp) {
            this.inlineHelp.style.display = 'none';
        }
    }

    toggleHelpSection(section) {
        if (this.openSections.has(section)) {
            this.closeHelpSection(section);
        } else {
            this.openHelpSection(section);
        }
    }

    openHelpSection(section) {
        this.openSections.add(section);
        this.updateHelpDisplay();
        this.helpSidebar.classList.remove('hidden');
        this.syncHeightsAndPositions();
    }

    closeHelpSection(section) {
        this.openSections.delete(section);
        this.updateHelpDisplay();

        // Hide sidebar if no sections are open
        if (this.openSections.size === 0) {
            this.helpSidebar.classList.add('hidden');
        } else {
            this.syncHeightsAndPositions();
        }
    }

    updateHelpDisplay() {
        // Update visibility of all help cards
        this.helpSectionCards.forEach(card => {
            const section = card.getAttribute('data-section');
            if (this.openSections.has(section)) {
                card.classList.add('visible');
                card.style.display = 'block';
            } else {
                card.classList.remove('visible');
                card.style.display = 'none';
            }
        });

        if (this.openSections.size > 0) {
            this.helpContent.style.display = 'block';
        }
    }

    syncHeightsAndPositions() {
        const isStackedLayout = window.matchMedia('(max-width: 75em)').matches;

        if (isStackedLayout) {
            this.helpSectionCards.forEach(card => {
                card.style.top = '';
                card.style.height = '';
            });
            return;
        }

        const helpContentRect = this.helpContent.getBoundingClientRect();

        // For each visible help card, align it with the corresponding form section
        this.openSections.forEach(section => {
            const helpCard = document.querySelector(`#help-${section}`);
            const formSection = document.querySelector(`.form-section[data-section="${section}"]`);

            if (helpCard && formSection) {
                const formRect = formSection.getBoundingClientRect();
                const top = formRect.top - helpContentRect.top;
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

                helpCard.style.top = `${top / rootFontSize}em`;
                helpCard.style.height = `${formRect.height / rootFontSize}em`;
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HelpSystem();
});
