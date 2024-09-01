import type { Edge, Node, Options } from "vis-network";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";

export class MwPojmovaMapa {
    private obsahStranky: HTMLElement;
    private elementMapy: HTMLElement;
    private mapa: { vrcholy: Node[]; hrany: Edge[] };
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

    constructor(obsahStranky: HTMLElement, elementMapy: HTMLDivElement) {
        this.obsahStranky = obsahStranky;
        this.elementMapy = elementMapy;
        this.mapa = { vrcholy: [], hrany: [] };
    }

    public vykreslit(): void {
        this.vytvoritDataMapy();
        this.vykreslitMapu();
    }

    private vytvoritDataMapy(): void {
        const nadpisy = this.obsahStranky.querySelectorAll("h1, h2, h3, h4, h5, h6") as NodeListOf<HTMLHeadingElement>;
        let posledneNadpisy: number[] = [];
        let indexSkupiny = 0;
        let farbySkupin: { [key: number]: number } = {};

        let korenovyNadpis = document.getElementById("firstHeading")?.innerText || "";
        this.mapa.vrcholy.push({
            id: 1,
            label: korenovyNadpis,
            color: this.generovatFarbu(indexSkupiny),
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
            });
            this.mapa.hrany.push({ from: idRodica, to: idVrchola });

            posledneNadpisy[aktualnyLevel] = idVrchola;
            posledneNadpisy = posledneNadpisy.slice(0, aktualnyLevel + 1);
        });
    }

    private vykreslitMapu(): void {
        const sirkaZobrazenia = window.innerWidth;
        const jeSirokeZobrazenie = sirkaZobrazenia > 768;

        const dataSiete = {
            nodes: new DataSet(this.mapa.vrcholy),
            edges: new DataSet(this.mapa.hrany),
        };

        const nastavenia: Options = {
            interaction: {
                hover: true,
                zoomView: false,
                dragView: false,
                dragNodes: false,
            },
            nodes: {
                shape: "box",
                widthConstraint: {
                    maximum: 200,
                },
                labelHighlightBold: true,
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
                    nodeSpacing: jeSirokeZobrazenie ? 200 : 40,
                    levelSeparation: jeSirokeZobrazenie ? 80 : 140,
                    shakeTowards: "roots",
                },
            },
            height: "400px",
        };

        this.pojmova_mapa = new Network(this.elementMapy, dataSiete, nastavenia);

        this.nastavitUdalosti();
    }

    private nastavitUdalosti(): void {
        if (!this.pojmova_mapa) return;

        this.pojmova_mapa.on("click", (parametre) => {
            const titulokBunky = this.mapa.vrcholy.find((vrchol) => vrchol.id === parametre?.nodes?.[0])?.label;
            if (!titulokBunky) return;

            window.location.hash = "";
            window.location.hash = `#${titulokBunky.replaceAll(" ", "_")}`;
        });
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

export default function vykreslitMapu() {
    const obsahStranky = document.querySelector("#mw-content-text .mw-parser-output") as HTMLElement;
    const elementMapy = document.getElementById("mapa") as HTMLDivElement;

    if (elementMapy && obsahStranky) {
        const pojmovaMapa = new MwPojmovaMapa(obsahStranky, elementMapy);
        pojmovaMapa.vykreslit();
    } else {
        console.warn("Na stránke sa nenachádza pojmová mapa.");
    }
}
