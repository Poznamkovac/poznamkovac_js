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
        const elementy = Array.from(this.obsahStranky.querySelectorAll("section p, ul, ol")) as HTMLElement[];

        return elementy.filter((element) => {
            return element.tagName === "P" ? element.textContent?.length !== 0 : true;
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

        tlacidlo.addEventListener("click", () => {
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
            body.zen-mode #content * { color: #666; }
            body.zen-mode .zen-highlighted, body.zen-mode .zen-highlighted * { color: #fff !important; background-color: #2a2a2a; }
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
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            const distance = Math.abs(rect.top + rect.height / 2 - viewportMiddle);
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
        let timeout: Timer;
        window.addEventListener('scroll', () => {
            if (this.zen) {
                clearTimeout(timeout);
                timeout = setTimeout(() => this.najdiNajblizsiElement(), 100);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (this.zen) {
                if (event.key === 'ArrowDown' || event.key === 'j') {
                    this.zvyraznitDalsi();
                } else if (event.key === 'ArrowUp' || event.key === 'k') {
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