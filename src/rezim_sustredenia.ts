const EYE_OPEN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/OOjs_UI_icon_eye-progressive.svg";
const EYE_CLOSED = "https://upload.wikimedia.org/wikipedia/commons/3/30/OOjs_UI_icon_eyeClosed-progressive.svg";

export class MwZenRezim {
    private readonly obsahStranky: HTMLElement;
    private readonly tlacidlo: HTMLLIElement;
    private readonly ikona: HTMLImageElement;

    private zen: boolean = false;
    private aktualnyElement: HTMLElement | null = null;

    constructor(obsahStranky: HTMLElement) {
        this.obsahStranky = obsahStranky;
        this.ikona = this.vytvoritIkonu();
        this.tlacidlo = this.vytvoritTlacidlo();
    }

    public inicializovat(): void {
        this.pridatTlacidlo();
        this.pridatEventListenery();
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

        tlacidlo.append(this.ikona, textTlacidla);
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

    private prepnutZen(): void {
        this.zen = !this.zen;
        this.ikona.src = this.zen ? EYE_OPEN : EYE_CLOSED;
        document.body.classList.toggle('zen-mode', this.zen);

        if (this.zen) {
            this.aplikovatZenStyl();
            this.najdiNajblizsiElement();
        } else {
            this.odstranZenStyl();
            this.aktualnyElement?.classList.remove('zen-highlighted');
            this.aktualnyElement = null;
        }
    }

    private aplikovatZenStyl(): void {
        const style = document.createElement('style');
        style.id = 'zen-mode-style';
        style.textContent = `
            body.zen-mode .zen-highlighted { background-color: rgba(255, 0, 255, 0.1); }
        `;
        document.head.appendChild(style);
    }

    private odstranZenStyl(): void {
        document.getElementById('zen-mode-style')?.remove();
    }

    private jePlatnyElement(element: Element): boolean {
        if (element instanceof HTMLParagraphElement) {
            return element.textContent?.trim().length !== 0;
        } else if (element instanceof HTMLUListElement || element instanceof HTMLOListElement) {
            return Array.from(element.children).some(li => li.textContent?.trim().length !== 0);
        }
        return false;
    }

    private najdiElement(startElement: Element, smer: 'next' | 'previous'): HTMLElement | null {
        const najdiRekurzivne = (element: Element | null, hladajHore: boolean = false): HTMLElement | null => {
            if (!element || !this.obsahStranky.contains(element)) {
                return null;
            }
    
            if (this.jePlatnyElement(element)) {
                return element as HTMLElement;
            }
    
            const prehladajDeti = (elem: Element): HTMLElement | null => {
                const dieta = smer === 'next' ? elem.firstElementChild : elem.lastElementChild;
                return najdiRekurzivne(dieta);
            };
    
            const prehladajSurodencov = (elem: Element): HTMLElement | null => {
                const surodenca = smer === 'next' ? elem.nextElementSibling : elem.previousElementSibling;
                return najdiRekurzivne(surodenca);
            };
    
            if (!hladajHore && element.hasChildNodes()) {
                const vysledokDeti = prehladajDeti(element);
                if (vysledokDeti) return vysledokDeti;
            }
    
            const vysledokSurodencov = prehladajSurodencov(element);
            if (vysledokSurodencov) return vysledokSurodencov;
    
            const rodic = element.parentElement;
            if (rodic && this.obsahStranky.contains(rodic)) {
                if (hladajHore) {
                    return najdiRekurzivne(rodic, true);
                } else {
                    return najdiRekurzivne(rodic, true);
                }
            }
    
            return null;
        };
    
        if (!this.obsahStranky.contains(startElement)) {
            return null;
        }
    
        const prvy = smer === 'next' ? startElement.nextElementSibling : startElement.previousElementSibling;
        const vysledok = najdiRekurzivne(prvy);
    
        if (!vysledok && this.obsahStranky.contains(startElement.parentElement)) {
            return najdiRekurzivne(startElement.parentElement, true);
        }
    
        return vysledok;
    }

    private zvyraznitElement(element: HTMLElement): void {
        this.aktualnyElement?.classList.remove('zen-highlighted');
        this.aktualnyElement = element;
        element.classList.add('zen-highlighted');

        const rect = element.getBoundingClientRect();
        const scrollTarget = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
        window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }

    private najdiNajblizsiElement(): void {
        const viewportMiddle = window.innerHeight / 2;
        const elements = this.obsahStranky.querySelectorAll<HTMLElement>("section p, ul, ol");

        let closest: HTMLElement | null = null;
        let minDistance = Infinity;

        elements.forEach((el) => {
            if (this.jePlatnyElement(el)) {
                const rect = el.getBoundingClientRect();
                const elementMiddle = rect.top + rect.height / 2;
                const distance = Math.abs(elementMiddle - viewportMiddle);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = el;
                }
            }
        });

        if (closest && closest !== this.aktualnyElement) {
            this.zvyraznitElement(closest);
        }
    }

    private pridatEventListenery(): void {
        let scrollTimeout: number;
        let lastScrollPosition = window.scrollY;

        window.addEventListener('scroll', () => {
            if (this.zen) {
                clearTimeout(scrollTimeout);
                scrollTimeout = window.setTimeout(() => {
                    const currentScrollPosition = window.scrollY;
                    if (Math.abs(currentScrollPosition - lastScrollPosition) > 50) {
                        this.najdiNajblizsiElement();
                        lastScrollPosition = currentScrollPosition;
                    }
                }, 150);
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

    private zvyraznitDalsi(): void {
        if (this.aktualnyElement) {
            const dalsiElement = this.najdiElement(this.aktualnyElement, 'next');
            if (dalsiElement) this.zvyraznitElement(dalsiElement);
        }
    }

    private zvyraznitPredosli(): void {
        if (this.aktualnyElement) {
            const predoslyElement = this.najdiElement(this.aktualnyElement, 'previous');
            if (predoslyElement) this.zvyraznitElement(predoslyElement);
        }
    }
}

export default function rezimSustredenia() {
    const obsahStranky = document.querySelector<HTMLElement>("#mw-content-text .mw-parser-output");
    if (obsahStranky) {
        new MwZenRezim(obsahStranky).inicializovat();
    } else {
        console.warn("Stránka nepodporuje režim sústredenia.");
    }
}