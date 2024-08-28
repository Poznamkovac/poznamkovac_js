const EYE_OPEN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/OOjs_UI_icon_eye-progressive.svg";
const EYE_CLOSED = "https://upload.wikimedia.org/wikipedia/commons/3/30/OOjs_UI_icon_eyeClosed-progressive.svg";

export class MwZenRezim {
    private obsahStranky: HTMLElement;
    private tlacidlo: HTMLLIElement;
    private ikona: HTMLImageElement;

    private zen: boolean = false;
    private aktualnyElement: HTMLElement | null = null;

    constructor(obsahStranky: HTMLElement) {
        this.obsahStranky = obsahStranky;
        this.ikona = this.vytvoritIkonu();
        this.tlacidlo = this.vytvoritTlacidlo();
    }

    public inicializovat(): void {
        this.pridatTlacidlo();
        this.pridatScrolovanieListenerov();
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
        this.najdiNajblizsiElement();
    }

    private vypnutZen(): void {
        this.ikona.src = EYE_CLOSED;
        this.zen = false;
        this.odstranZenStyl();
        if (this.aktualnyElement) {
            this.aktualnyElement.classList.remove('zen-highlighted');
            this.aktualnyElement = null;
        }
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
    }

    private jePlatnyElement(element: Element): boolean {
        if (element.tagName === "P" || element.tagName.startsWith("H")) {
            return element.textContent?.trim().length !== 0;
        } else if (element.tagName === "UL" || element.tagName === "OL") {
            return Array.from(element.children).some(li => li.textContent?.trim().length !== 0);
        }
        return false;
    }

    private najdiDalsiElement(startElement: Element, smer: 'next' | 'previous'): HTMLElement | null {
        let currentElement: Element | null = startElement;
        
        while (currentElement) {
            currentElement = smer === 'next' ? currentElement.nextElementSibling : currentElement.previousElementSibling;
            
            if (!currentElement) {
                const parentSection = startElement.closest('section');
                if (parentSection) {
                    currentElement = smer === 'next' ? parentSection.nextElementSibling : parentSection.previousElementSibling;
                }
            }
            
            if (currentElement && this.jePlatnyElement(currentElement)) {
                return currentElement as HTMLElement;
            }
        }
        
        return null;
    }

    private zvyraznitElement(element: HTMLElement): void {
        if (this.aktualnyElement) {
            this.aktualnyElement.classList.remove('zen-highlighted');
        }
        this.aktualnyElement = element;
        element.classList.add('zen-highlighted');
        const rect = element.getBoundingClientRect();
        const scrollTarget = window.pageYOffset + rect.top - (window.innerHeight - rect.height) / 2;
        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });
    }

    private zvyraznitDalsi(): void {
        if (this.aktualnyElement) {
            const dalsiElement = this.najdiDalsiElement(this.aktualnyElement, 'next');
            if (dalsiElement) {
                this.zvyraznitElement(dalsiElement);
            }
        }
    }

    private zvyraznitPredosli(): void {
        if (this.aktualnyElement) {
            const predoslyElement = this.najdiDalsiElement(this.aktualnyElement, 'previous');
            if (predoslyElement) {
                this.zvyraznitElement(predoslyElement);
            }
        }
    }

    private najdiNajblizsiElement(): void {
        const viewportMiddle = window.innerHeight / 2;
        let closest: HTMLElement | null = null;
        let minDistance = Infinity;

        const elements = this.obsahStranky.querySelectorAll("section p, ul, ol, h1, h2, h3, h4, h5, h6");
        
        elements.forEach((el) => {
            if (this.jePlatnyElement(el)) {
                const rect = el.getBoundingClientRect();
                const elementMiddle = rect.top + rect.height / 2;
                const distance = Math.abs(elementMiddle - viewportMiddle);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = el as HTMLElement;
                }
            }
        });

        if (closest && closest !== this.aktualnyElement) {
            this.zvyraznitElement(closest);
        }
    }

    private pridatScrolovanieListenerov(): void {
        let timeout: number;
        let lastScrollPosition = window.pageYOffset;

        window.addEventListener('scroll', () => {
            if (this.zen) {
                clearTimeout(timeout);
                timeout = window.setTimeout(() => {
                    const currentScrollPosition = window.pageYOffset;
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
