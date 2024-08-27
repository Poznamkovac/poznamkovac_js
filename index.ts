import type { Options } from "vis-network";
import type { Instance as TippyInstance } from "tippy.js";

import { Network, DataSet } from "vis-network";
import tippy from "tippy.js";

export class MwPojmovaMapa {
    private tippyInstancia: TippyInstance;
    private poznamkyElement: HTMLElement;
    private elementMapy: HTMLElement;
    private mapa: { vrcholy: any[]; hrany: any[] };
    private pojmova_mapa: Network | null = null;

    private static readonly farbySkupin = [
        [255, 102, 102], // červená
        [102, 255, 102], // zelená
        [102, 102, 255], // modrá
        [255, 255, 102], // žltá
        [255, 102, 255], // fialová
        [102, 255, 255], // cyanová
        [255, 178, 102], // oranžová
        [178, 255, 102], // limetková
        [102, 178, 255], // modrá (ako obloha)
    ];

    constructor(poznamkyElement: HTMLElement, elementMapy: HTMLDivElement) {
        this.tippyInstancia = tippy(document.createElement("div"));
        this.poznamkyElement = poznamkyElement;
        this.elementMapy = elementMapy;
        this.mapa = { vrcholy: [], hrany: [] };
    }

    public async inicializovat(): Promise<void> {
        await this.vytvoritDataMapy();
        await this.vykreslitMapu();
    }

    private async vytvoritDataMapy(): Promise<void> {
        const nadpisy = this.poznamkyElement.querySelectorAll("h1, h2, h3, h4, h5, h6") as NodeListOf<HTMLHeadingElement>;
        let posledneNadpisy: number[] = [];
        let indexSkupiny = 0;
        let farbySkupin: { [key: number]: number } = {};

        let korenovyNadpis = document.getElementById("firstHeading")?.innerText || "";
        this.mapa.vrcholy.push({
            id: 1,
            label: korenovyNadpis,
            color: this.generovatFarbu(indexSkupiny),
            tooltip: "",
        });
        farbySkupin[0] = indexSkupiny;

        nadpisy.forEach((nadpis, index) => {
            const aktualnyLevel = this.ziskatLevelNadpisu(nadpis);
            const idVrchola = index + 2;
            const nazov = nadpis.querySelector(".mw-headline")?.textContent || "";

            let idRodica = 1;
            for (let lvl = aktualnyLevel - 1; lvl >= 0; lvl--) {
                if (posledneNadpisy[lvl] !== undefined) {
                    idRodica = posledneNadpisy[lvl];
                    break;
                }
            }

            if (farbySkupin[idRodica] === undefined) {
                indexSkupiny++;
                farbySkupin[idRodica] = indexSkupiny;
            }
            const color = this.generovatFarbu(farbySkupin[idRodica]);

            this.mapa.vrcholy.push({
                id: idVrchola,
                label: nazov,
                color: color,
                tooltip: this.obsahNadpisu(nadpis),
            });
            this.mapa.hrany.push({ from: idRodica, to: idVrchola });

            posledneNadpisy[aktualnyLevel] = idVrchola;
            posledneNadpisy = posledneNadpisy.slice(0, aktualnyLevel + 1);
        });
    }

    private async vykreslitMapu(): Promise<void> {
        const sirkaZobrazenia = window.innerWidth;
        const jeSirokeZobrazenie = sirkaZobrazenia > 768;

        const dataSiete = {
            nodes: new DataSet(this.mapa.vrcholy),
            edges: new DataSet(this.mapa.hrany),
        };

        const nastavenia: Options = {
            autoResize: true,
            clickToUse: true,
            interaction: {
                hover: true,
                dragNodes: false,
                dragView: true,
                zoomView: false,
            },
            nodes: {
                shape: "box",
                widthConstraint: {
                    maximum: 200,
                },
                margin: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10,
                },
                labelHighlightBold: false,
            },
            edges: {
                width: 1.0,
                arrows: {
                    to: {
                        enabled: true,
                    },
                },
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: jeSirokeZobrazenie ? "UD" : "LR",
                    sortMethod: "directed",
                    nodeSpacing: jeSirokeZobrazenie ? 220 : 100,
                    levelSeparation: jeSirokeZobrazenie ? 100 : 250,
                    shakeTowards: "roots",
                },
            },
            physics: {
                hierarchicalRepulsion: {
                    nodeDistance: 150,
                },
            },
            height: "400px",
        };

        this.pojmova_mapa = new Network(this.elementMapy, dataSiete, nastavenia);

        this.nastavitUdalosti();
        this.pridatInfoText(jeSirokeZobrazenie);
    }

    private nastavitUdalosti(): void {
        if (!this.pojmova_mapa) return;

        this.pojmova_mapa.on("hoverNode", (parametre) => {
            const obsah = this.mapa.vrcholy.find((vrchol) => vrchol.id === parametre.node)?.tooltip;
            if (!parametre.node || !obsah) return;

            this.tippyInstancia.setProps({
                triggerTarget: this.elementMapy,
                maxWidth: "90vw",
                allowHTML: true,
                arrow: false,
                interactive: true,
                getReferenceClientRect: () => this.elementMapy.getBoundingClientRect(),
            });

            this.tippyInstancia.setContent(`<div style="padding: 1rem; font-size: 12px !important; color: lightgray;">${obsah}</div>`);
            this.tippyInstancia.show();
        });

        let poslednaKliknutaBunkaId: number;
        let casPoslednehoKliknutiaNaBunku: number;

        this.pojmova_mapa.on("click", (parametre) => {
            if (!parametre.nodes.length) return;
            let bunkaId = parametre.nodes[0];

            const _navigovat = () => {
                const titulokBunky = this.mapa.vrcholy.find((vrchol) => vrchol.id === bunkaId)?.label;
                if (!titulokBunky) return;

                window.location.hash = "";
                window.location.hash = `#${titulokBunky.replaceAll(" ", "_")}`;
                this.tippyInstancia.hide();
            };

            if (window.innerWidth <= 768) {
                const aktualnyCas = new Date().getTime();

                if (poslednaKliknutaBunkaId === bunkaId && aktualnyCas - casPoslednehoKliknutiaNaBunku < 500) {
                    setTimeout(() => {
                        _navigovat();
                    }, 50);
                }

                poslednaKliknutaBunkaId = bunkaId;
                casPoslednehoKliknutiaNaBunku = aktualnyCas;
            } else {
                _navigovat();
            }
        });

        this.pojmova_mapa.on("blurNode", () => {
            this.tippyInstancia.hide();
        });
    }

    private pridatInfoText(jeSirokeZobrazenie: boolean): void {
        let info = document.createElement("small");
        info.style.fontSize = "12px";
        info.innerHTML += "Kliknite na mapu pre interakciu s ňou. ";
        info.innerHTML += `${jeSirokeZobrazenie ? "Kliknutím" : "Dvojitým kliknutím"} na vrchol sa presuniete na príslušnú sekciu.\n`;

        this.elementMapy.parentNode?.insertBefore(info, this.elementMapy.nextSibling);
    }

    private obsahNadpisu(nadpisElement: HTMLHeadingElement): string {
        let novyNadpis = nadpisElement.cloneNode(true) as HTMLElement;
        novyNadpis.innerHTML = (novyNadpis.querySelector(".mw-headline") as HTMLHeadingElement).outerHTML;
        novyNadpis.style.marginTop = "0";
        novyNadpis.style.textAlign = "center";

        let obsahDiv = document.createElement("div");
        obsahDiv.appendChild(novyNadpis);

        const __pridavajObsah = (element: Element | null): void => {
            if (element === null || ["H1", "H2", "H3", "H4", "H5", "H6"].includes(element.tagName)) {
                return;
            }

            if (element.querySelector(":scope > h1, h2, h3, h4, h5, h6")) {
                __pridavajObsah(element.firstElementChild);
            } else {
                obsahDiv.appendChild(element.cloneNode(true));
                __pridavajObsah(element.nextElementSibling);
            }
        };

        __pridavajObsah(nadpisElement.nextElementSibling);
        obsahDiv = this.skratitDiv(obsahDiv);

        return obsahDiv.innerHTML;
    }

    private skratitDiv(element: HTMLDivElement, maxDlzka: number = 2000): HTMLDivElement {
        let novyElement = document.createElement(element.tagName) as HTMLDivElement;
        let pocitadloDlzok = 0;

        for (let child of Array.from(element.childNodes)) {
            pocitadloDlzok += child.textContent?.length || 0;

            if (pocitadloDlzok > maxDlzka) {
                novyElement.appendChild(document.createTextNode("..."));
                break;
            }

            novyElement.appendChild(child.cloneNode(true));
        }

        return novyElement;
    }

    private ziskatLevelNadpisu(nadpis: Element): number {
        return parseInt(nadpis.tagName.substring(1), 10);
    }

    private generovatFarbu(indexSkupiny: number): string {
        const indexFarby = indexSkupiny % MwPojmovaMapa.farbySkupin.length;
        const [r, g, b] = MwPojmovaMapa.farbySkupin[indexFarby];
        return `rgb(${r}, ${g}, ${b})`;
    }
}

globalThis.addEventListener("load", () => {
    const poznamkyElement = document.querySelector("#mw-content-text .mw-parser-output") as HTMLElement;
    const elementMapy = document.getElementById("mapa") as HTMLDivElement;

    if (elementMapy !== null && poznamkyElement !== null) {
        const pojmovaMapa = new MwPojmovaMapa(poznamkyElement, elementMapy);
        pojmovaMapa.inicializovat();
    } else {
        console.log("Na stránke sa nenachádza pojmová mapa.");
    }
});
