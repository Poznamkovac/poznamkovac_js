const EYE_OPEN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/OOjs_UI_icon_eye-progressive.svg";
const EYE_CLOSED = "https://upload.wikimedia.org/wikipedia/commons/3/30/OOjs_UI_icon_eyeClosed-progressive.svg";

export class MwZenRezim {
    private obsahStranky: HTMLElement;
    private tlacidlo: HTMLLIElement;
    private ikona: HTMLImageElement;

    private naZvyraznenie: HTMLElement[] = [];
    private zen: boolean = false;

    constructor(obsahStranky: HTMLElement) {
        this.obsahStranky = obsahStranky;

        this.ikona = this.vytvoritIkonu();
        this.tlacidlo = this.vytvoritTlacidlo();
    }

    public inicializovat(): void {
        this.naZvyraznenie = this.zobratNaZvyraznenie();
        this.pridatTlacidlo();
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

        return ikona
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
    }

    private vypnutZen(): void {
        this.ikona.src = EYE_CLOSED;
        this.zen = false;
    }

    private prepnutZen(): void {
        this.zen ? this.vypnutZen() : this.zapnutZen();
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
