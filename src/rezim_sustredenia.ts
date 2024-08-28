const EYE_OPEN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/OOjs_UI_icon_eye-progressive.svg";
const EYE_CLOSED = "https://upload.wikimedia.org/wikipedia/commons/3/30/OOjs_UI_icon_eyeClosed-progressive.svg";

export class MwZenRezim {
    private obsahStranky: HTMLElement;
    private tlacidlo: HTMLLIElement;
    private ikona: HTMLImageElement;

    private naZvyraznenie: HTMLElement[] = [];
    private zen: boolean = false;
    private aktualnePozicia: number = 0;

    constructor(obsahStranky: HTMLElement) {
        this.obsahStranky = obsahStranky;

        this.ikona = this.vytvoritIkonu();
        this.tlacidlo = this.vytvoritTlacidlo();
    }

    public inicializovat(): void {
        this.naZvyraznenie = this.zobratNaZvyraznenie();
        this.pridatTlacidlo();
        this.pridatScrolovanieListenerov();
    }

    private zobratNaZvyraznenie(): HTMLElement[] {
        const elementy = Array.from(this.obsahStranky.querySelectorAll("section p, ul, ol, h1, h2, h3, h4, h5, h6")) as HTMLElement[];

        return elementy.filter((element) => {
            if (element.tagName === "P" || element.tagName.startsWith("H")) {
                return element.textContent?.trim().length !== 0;
            } else if (element.tagName === "UL" || element.tagName === "OL") {
                return Array.from(element.children).some(li => li.textContent?.trim().length !== 0);
            }
            return false;
        });
    }

    private vytvoritIkonu(): HTMLImageElement {
        const ikona = document.createElement("img");
        ikona.src = EYE_CLOSED;
        ikona.alt = "👁️";

        return ikona;
    }

    private vytvoritTlacidlo(): HTMLLIElement {
        const liTlacidlo = document.createElement("li");
        const tlacidlo = document.createElement("a");
        const textTlacidla = document.createElement("span");

        liTlacidlo.id = "p-zen";
        liTlacidlo.className = "mw-list-item";
        tlacidlo.href = "#";

        textTlacidla.textContent = tlacidlo.title = "Režim sústredenia";

        tlacidlo.appendChild(this.ikona);
        tlacidlo.appendChild(textTlacidla);
        liTlacidlo.appendChild(tlacidlo);

        tlacidlo.addEventListener("click", (e) => {
            e.preventDefault();
            this.prepnutZen();
        });

        return liTlacidlo;
    }

    private pridatTlacidlo(): void {
        const nav = document.body.querySelector("nav#p-views ul.citizen-menu__content-list");
        nav?.prepend(this.tlacidlo);
    }

    private zapnutZen(): void {
        this.ikona.src = EYE_OPEN;
        this.zen = true;
        this.aplikovatZenStyl();
        this.zvyraznitElement(this.aktualnePozicia);
    }

    private vypnutZen(): void {
        this.ikona.src = EYE_CLOSED;
        this.zen = false;
        this.odstranZenStyl();
    }

    private prepnutZen(): void {
        this.zen ? this.vypnutZen() : this.zapnutZen();
    }

    private aplikovatZenStyl(): void {
        document.body.classList.add('zen-mode');
        const style = document.createElement('style');
        style.id = 'zen-mode-style';
        style.textContent = `
            body.zen-mode { background-color: #1a1a1a; }
            body.zen-mode #content * { color: #666 !important; }
            body.zen-mode .zen-highlighted { color: #fff !important; background-color: #2a2a2a; }
        `;
        document.head.appendChild(style);
    }

    private odstranZenStyl(): void {
        document.body.classList.remove('zen-mode');
        const style = document.getElementById('zen-mode-style');
        if (style) {
            style.remove();
        }
        this.naZvyraznenie.forEach(el => el.classList.remove('zen-highlighted'));
    }

    private zvyraznitElement(index: number): void {
        if (!this.zen) return;
        
        this.naZvyraznenie.forEach(el => el.classList.remove('zen-highlighted'));
        const element = this.naZvyraznenie[index];
        if (element) {
            element.classList.add('zen-highlighted');
            const rect = element.getBoundingClientRect();
            const scrollTarget = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
            window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
        }
    }

    private zvyraznitDalsi(): void {
        if (this.aktualnePozicia < this.naZvyraznenie.length - 1) {
            this.aktualnePozicia++;
            this.zvyraznitElement(this.aktualnePozicia);
        }
    }

    private zvyraznitPredosli(): void {
        if (this.aktualnePozicia > 0) {
            this.aktualnePozicia--;
            this.zvyraznitElement(this.aktualnePozicia);
        }
    }

    private najdiNajblizsiElement(): void {
        const viewportMiddle = window.innerHeight / 2;
        let closest = 0;
        let minDistance = Infinity;

        this.naZvyraznenie.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const elementMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(elementMiddle - viewportMiddle);
            if (distance < minDistance) {
                minDistance = distance;
                closest = index;
            }
        });

        if (closest !== this.aktualnePozicia) {
            this.aktualnePozicia = closest;
            this.zvyraznitElement(this.aktualnePozicia);
        }
    }

    private pridatScrolovanieListenerov(): void {
        let timeout: number;
        let lastScrollPosition = window.scrollY;

        window.addEventListener('scroll', () => {
            if (this.zen) {
                clearTimeout(timeout);
                timeout = window.setTimeout(() => {
                    const currentScrollPosition = window.scrollY;
                    if (Math.abs(currentScrollPosition - lastScrollPosition) > 50) {
                        this.najdiNajblizsiElement();
                        lastScrollPosition = currentScrollPosition;
                    }
                }, 100);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (this.zen) {
                if (event.key === 'ArrowDown' || event.key === 'j') {
                    event.preventDefault();
                    this.zvyraznitDalsi();
                } else if (event.key === 'ArrowUp' || event.key === 'k') {
                    event.preventDefault();
                    this.zvyraznitPredosli();
                }
            }
        });
    }
}

export default function rezimSustredenia() {
    const obsahStranky = document.querySelector("#mw-content-text .mw-parser-output") as HTMLElement;

    if (obsahStranky) {
        const zen = new MwZenRezim(obsahStranky);
        zen.inicializovat();
    } else {
        console.log("Stránka nepodporuje režim sústredenia.");
    }
}