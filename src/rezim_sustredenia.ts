const EYE_OPEN = "https://upload.wikimedia.org/wikipedia/commons/d/d8/OOjs_UI_icon_eye-progressive.svg";
const EYE_CLOSED = "https://upload.wikimedia.org/wikipedia/commons/3/30/OOjs_UI_icon_eyeClosed-progressive.svg";

export class MwZenRezim {
    private readonly obsahStranky: HTMLElement;
    private readonly tlacidlo: HTMLLIElement;
    private readonly ovladanie: HTMLDivElement;
    private readonly ikona: HTMLImageElement;

    private zen: boolean = false;
    private aktualnyElement: HTMLElement | null = null;

    constructor(obsahStranky: HTMLElement) {
        this.obsahStranky = obsahStranky;
        this.ikona = this.vytvoritIkonu();
        this.tlacidlo = this.vytvoritTlacidlo();
        this.ovladanie = this.vytvoritOvladanie();
    }

    public inicializovat(): void {
        this.pridatTlacidlo();
        this.pridatOvladanie();
        this.pridatEventListenery();
        this.aplikovatZenStyl();
    }

    public odstranit() {
        this.zen = false;
        this.odstranZenStyl();
        this.tlacidlo.remove();
    }

    private vytvoritIkonu(): HTMLImageElement {
        const ikona = document.createElement("img");
        ikona.src = EYE_OPEN;
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

    private vytvoritOvladanie(): HTMLDivElement {
        const wrapper = document.createElement("div");
        wrapper.id = "zen-ovladanie";

        const tlacidloDalsi = document.createElement("button");
        tlacidloDalsi.textContent = "↓";
        tlacidloDalsi.addEventListener("click", () => {
            this.zvyraznitDalsi();
        });

        const tlacidloKoniec = document.createElement("button");
        tlacidloKoniec.style.fontSize = "12px";
        tlacidloKoniec.style.marginLeft = "0.5rem";
        tlacidloKoniec.textContent = "Ukončiť";
        tlacidloKoniec.addEventListener("click", () => {
            this.prepnutZen();
        });

        const tlacidloPredosli = document.createElement("button");
        tlacidloPredosli.textContent = "↑";
        tlacidloPredosli.addEventListener("click", () => {
            this.zvyraznitPredosli();
        });

        wrapper.append(tlacidloPredosli);
        wrapper.append(tlacidloDalsi);
        wrapper.append(tlacidloKoniec);

        return wrapper;
    }

    private pridatOvladanie(): void {
        document.body.append(this.ovladanie);
    }

    private prepnutZen(): void {
        this.zen = !this.zen;
        this.ikona.src = this.zen ? EYE_CLOSED : EYE_OPEN;
        document.body.classList.toggle("zen-mode", this.zen);

        if (this.zen) {
            this.najdiNajblizsiElement();
        } else {
            this.aktualnyElement?.classList.remove("zen-highlighted");
            this.aktualnyElement = null;
        }
    }

    private aplikovatZenStyl(): void {
        const style = document.createElement("style");
        style.id = "zen-mode-style";
        style.textContent = `
            .zen-mode #mw-content-text *:not(section, div, blockquote) {
                filter: blur(1px) opacity(0.3);
            }

            .zen-mode #mw-content-text .mw-headline,
            .zen-mode #mw-content-text h1,
            .zen-mode #mw-content-text h2,
            .zen-mode #mw-content-text h3,
            .zen-mode #mw-content-text h4,
            .zen-mode #mw-content-text h5,
            .zen-mode #mw-content-text h6 {
                filter: opacity(0.65) !important;
            }

            .zen-mode .zen-highlighted, .zen-mode .zen-highlighted *:not(.mwe-math-element *),
            #mapa, #mapa * {
                filter: initial !important;
            }

            #zen-ovladanie {
                display: none;
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                gap: 0.5rem;
            }

            #zen-ovladanie button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 0.5rem;
                font-size: 1.2rem;
                cursor: pointer;
            }

            .zen-mode #zen-ovladanie {
                display: inline-flex;
            }

            @media screen and (max-width: 768px) {
                .zen-mode #content {
                    padding: 25vh 0 !important;
                }

                #zen-ovladanie {
                    bottom: 70px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private odstranZenStyl(): void {
        document.getElementById("zen-mode-style")?.remove();
    }

    private jePlatnyElement(element: Element): boolean {
        if (element instanceof HTMLParagraphElement) {
            return element.textContent?.trim().length !== 0;
        } else if (element instanceof HTMLUListElement || element instanceof HTMLOListElement) {
            return Array.from(element.children).some((li) => li.textContent?.trim().length !== 0);
        }
        return false;
    }

    private najdiNajblizsiElement(): void {
        const viewportMiddle = window.innerHeight / 2;
        let closestElement: HTMLElement | null = null;
        let minDistance = Infinity;

        const rekurzivneHladanie = (element: Element): void => {
            if (this.jePlatnyElement(element)) {
                const rect = element.getBoundingClientRect();
                const elementMiddle = rect.top + rect.height / 2;
                const distance = Math.abs(elementMiddle - viewportMiddle);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestElement = element as HTMLElement;
                }
            }

            for (const child of Array.from(element.children)) {
                rekurzivneHladanie(child);
            }
        };

        rekurzivneHladanie(this.obsahStranky);

        if (closestElement && closestElement !== this.aktualnyElement) {
            this.zvyraznitElement(closestElement);
        }
    }

    private najdiElement(startElement: Element, smer: "next" | "previous"): HTMLElement | null {
        const krok = (element: Element | null): Element | null => {
            if (!element) return null;
            return smer === "next" ? element.nextElementSibling : element.previousElementSibling;
        };

        const hladajHlboko = (element: Element | null): HTMLElement | null => {
            while (element) {
                if (this.jePlatnyElement(element)) {
                    return element as HTMLElement;
                }
                const result = hladajHlboko(smer === "next" ? element.firstElementChild : element.lastElementChild);
                if (result) return result;
                element = krok(element);
            }
            return null;
        };

        let current: Element | null = startElement;
        while (current && this.obsahStranky.contains(current)) {
            const result = hladajHlboko(krok(current));
            if (result) return result;
            current = current.parentElement;
        }

        return null;
    }

    private zvyraznitElement(element: HTMLElement): void {
        this.aktualnyElement?.classList.remove("zen-highlighted");
        this.aktualnyElement = element;
        element.classList.add("zen-highlighted");

        const rect = element.getBoundingClientRect();
        const scrollTarget = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
        window.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }

    private pridatEventListenery(): void {
        let scrollTimeout: number;
        let lastScrollPosition = window.scrollY;

        window.addEventListener("scroll", () => {
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

        document.addEventListener("keydown", (event) => {
            if (this.zen) {
                if (event.key === "ArrowDown" || event.key === "j") {
                    event.preventDefault();
                    this.zvyraznitDalsi();
                } else if (event.key === "ArrowUp" || event.key === "k") {
                    event.preventDefault();
                    this.zvyraznitPredosli();
                }
            }
        });
    }

    private zvyraznitDalsi(): void {
        if (this.aktualnyElement) {
            const dalsiElement = this.najdiElement(this.aktualnyElement, "next");
            if (dalsiElement) this.zvyraznitElement(dalsiElement);
        }
    }

    private zvyraznitPredosli(): void {
        if (this.aktualnyElement) {
            const predoslyElement = this.najdiElement(this.aktualnyElement, "previous");
            if (predoslyElement) this.zvyraznitElement(predoslyElement);
        }
    }
}

export default function rezimSustredenia() {
    const obsahStranky = document.querySelector<HTMLElement>("#mw-content-text .mw-parser-output");
    const search = new URLSearchParams(globalThis.window.location.search);
    const veaction = search.get("veaction");

    if (obsahStranky && veaction != "edit" && veaction != "editsource") {
        const zen = new MwZenRezim(obsahStranky);
        zen.inicializovat();

        const veedit = globalThis.document.getElementById("ca-ve-edit");
        veedit?.addEventListener("click", () => {
            zen.odstranit();
        });
    } else {
        console.warn("Stránka nepodporuje režim sústredenia.");
    }
}
