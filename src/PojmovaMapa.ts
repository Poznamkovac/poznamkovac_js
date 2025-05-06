import type { Edge, Node, Options } from "vis-network";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";
import { NadpisWalker } from "./helpers/Walker";

export class MwPojmovaMapa {
    private obsahStranky: HTMLElement;
    private elementMapy: HTMLElement;
    private mapaNodes: DataSet<Node>;
    private mapaEdges: DataSet<Edge>;
    private pojmova_mapa: Network | null = null;
    private jeMobil: boolean = window.innerWidth < 768 || "ontouchstart" in window;
    private mapaFocus: boolean = false;

    private static readonly farbySkupin = [
        [255, 102, 102], // červená
        [49, 200, 49], // zelená
        [80, 150, 250], // modrá
        [255, 200, 100], // žltá
        [255, 102, 255], // fialová
        [102, 255, 255], // cyanová
        [255, 178, 102], // oranžová
        [178, 255, 102], // limetková
        [102, 178, 255], // modrá (ako obloha)
    ];

    private walker: NadpisWalker;
    private indexSkupiny: number = 0;
    private farbySkupin: { [key: number]: number } = {};
    private posledneNadpisy: number[] = [];
    private pocitadloId: number = 1;
    private generujeSa: boolean = false;

    constructor(obsahStranky: HTMLElement, elementMapy: HTMLDivElement) {
        this.obsahStranky = obsahStranky;
        this.elementMapy = elementMapy;
        this.mapaNodes = new DataSet();
        this.mapaEdges = new DataSet();

        this.walker = new NadpisWalker(this.obsahStranky);
    }

    public vykreslit(): void {
        this.vykreslitMapu();
        this.vytvoritDataMapy();
    }

    private vytvoritDataMapy(): void {
        const korenovyNadpis = document.getElementById("firstHeading")?.innerText || "Koreň";
        const korenovyNod: Node = {
            id: 1,
            label: korenovyNadpis,
            color: this.generovatFarbu(this.indexSkupiny),
        };
        this.mapaNodes.add(korenovyNod);
        this.pocitadloId = 2;

        this.generujeSa = true;
        this.procesovatDalsiChunk();
    }

    private procesovatDalsiChunk(): void {
        if (!this.generujeSa) return;

        const chunkSize = 5;
        let processed = 0;

        let currentHeading: HTMLHeadingElement | null;
        while (processed < chunkSize && (currentHeading = this.walker.nasledovnyNadpis())) {
            const aktualnyLevel = this.ziskatLevelNadpisu(currentHeading);
            const idVrchola = this.pocitadloId++;
            const nazov = currentHeading.querySelector(".mw-headline")?.textContent || currentHeading.textContent || "";

            let idRodica = 1;
            for (let lvl = aktualnyLevel - 1; lvl >= 0; lvl--) {
                if (this.posledneNadpisy[lvl] !== undefined) {
                    idRodica = this.posledneNadpisy[lvl];
                    break;
                }
            }

            if (this.farbySkupin[idRodica] === undefined) {
                this.indexSkupiny++;
                this.farbySkupin[idRodica] = this.indexSkupiny;
            }
            const farba = this.generovatFarbu(this.farbySkupin[idRodica]);

            const obsahHTML = this.ziskatObsahPreNadpis(currentHeading);
            const node: Node = {
                id: idVrchola,
                label: nazov,
                color: farba,
                title: obsahHTML,
            };
            this.mapaNodes.add(node);
            this.mapaEdges.add({ from: idRodica, to: idVrchola });

            this.posledneNadpisy[aktualnyLevel] = idVrchola;
            this.posledneNadpisy = this.posledneNadpisy.slice(0, aktualnyLevel + 1);

            processed++;
        }

        if (currentHeading!) {
            return this.procesovatDalsiChunk();
        }
        this.generujeSa = false;
        return;
    }

    private ziskatObsahPreNadpis(nadpis: HTMLHeadingElement): string {
        const obsah: string[] = [];
        let element = nadpis.nextElementSibling;
        const currentLevel = this.ziskatLevelNadpisu(nadpis);

        while (element) {
            if (element instanceof HTMLHeadingElement) {
                const level = this.ziskatLevelNadpisu(element);
                if (level <= currentLevel) {
                    break;
                }
            }
            obsah.push(element.outerHTML);
            element = element.nextElementSibling;
        }
        return obsah.join("");
    }

    private vykreslitMapu(): void {
        const dataSiete = {
            nodes: this.mapaNodes,
            edges: this.mapaEdges,
        };

        const nastavenia: Options = {
            interaction: {
                hover: true,
                tooltipDelay: 0,
                dragNodes: false,
                dragView: !this.jeMobil,
                zoomView: false,
            },
            nodes: {
                shape: "box",
                widthConstraint: {
                    maximum: this.jeMobil ? 60 : 200,
                },
                font: {
                    size: this.jeMobil ? 10 : 14,
                },
                margin: {
                    top: this.jeMobil ? 5 : 10,
                    right: this.jeMobil ? 5 : 10,
                    bottom: this.jeMobil ? 5 : 10,
                    left: this.jeMobil ? 5 : 10,
                },
                labelHighlightBold: true,
            },
            edges: {
                width: 1.0,
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: this.jeMobil ? 0.5 : 1.0,
                    },
                },
            },
            physics: {
                enabled: false,
            },
            layout: {
                hierarchical: {
                    direction: this.jeMobil ? "LR" : "UD",
                    sortMethod: "directed",
                    nodeSpacing: this.jeMobil ? 50 : 170,
                    levelSeparation: this.jeMobil ? 80 : 70,
                    shakeTowards: "roots",
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                },
            },
            height: "400px",
        };

        this.pojmova_mapa = new Network(this.elementMapy, dataSiete, nastavenia);
        this.nastavitUdalosti();
        this.pojmova_mapa.fit();
    }

    private nastavitUdalosti(): void {
        const touchZariadenie = "ontouchstart" in window || navigator.maxTouchPoints > 0;

        if (touchZariadenie) {
            let poslednyTap = 0;

            this.pojmova_mapa!.on("click", (params) => {
                if (!this.mapaFocus) {
                    this.mapaFocus = true;
                    this.pojmova_mapa!.setOptions({ interaction: { dragView: true } });
                    return;
                }

                const aktualnyCas = new Date().getTime();
                const dlzkaTap = aktualnyCas - poslednyTap;
                poslednyTap = aktualnyCas;
                if (dlzkaTap < 500 && dlzkaTap > 0) {
                    this.navigovatNa(params);
                }
            });
        } else {
            this.pojmova_mapa!.on("click", (params) => {
                this.navigovatNa(params);
            });
        }
    }

    private navigovatNa(params: any): void {
        const nodeId = params?.nodes?.[0];
        // @ts-ignore
        const node: Node = this.mapaNodes.get(nodeId);

        if (node && node.label) {
            const anchor = node.label.replaceAll(" ", "_");
            window.location.hash = `#${anchor}`;
        }
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
