import type { Edge, Node, Options } from "vis-network";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";
import { NadpisWalker } from "./helpers/Walker";

type RGB = [number, number, number];

const MOBILE_BREAKPOINT = 768;
const CHUNK_SIZE = 5;
const DOUBLE_TAP_THRESHOLD = 500;

export class MwPojmovaMapa {
    private readonly obsahStranky: HTMLElement;
    private readonly elementMapy: HTMLElement;
    private readonly mapaNodes: DataSet<Node>;
    private readonly mapaEdges: DataSet<Edge>;
    private readonly jeMobil: boolean;
    private readonly walker: NadpisWalker;

    private pojmova_mapa: Network | null = null;
    private mapaFocus: boolean = false;
    private indexSkupiny: number = 0;
    private farbySkupin: Map<number, number> = new Map();
    private posledneNadpisy: number[] = [];
    private pocitadloId: number = 1;
    private generujeSa: boolean = false;

    private static readonly farbySkupin: RGB[] = [
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

    constructor(obsahStranky: HTMLElement, elementMapy: HTMLDivElement) {
        this.obsahStranky = obsahStranky;
        this.elementMapy = elementMapy;
        this.mapaNodes = new DataSet();
        this.mapaEdges = new DataSet();
        this.jeMobil = window.innerWidth < MOBILE_BREAKPOINT || "ontouchstart" in window;
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

        let processed = 0;
        let currentHeading: HTMLHeadingElement | null;

        while (processed < CHUNK_SIZE && (currentHeading = this.walker.nasledovnyNadpis())) {
            this.spracovatNadpis(currentHeading);
            processed++;
        }

        if (currentHeading) {
            this.procesovatDalsiChunk();
        } else {
            this.generujeSa = false;
        }
    }

    private spracovatNadpis(nadpis: HTMLHeadingElement): void {
        const aktualnyLevel = this.ziskatLevelNadpisu(nadpis);
        const idVrchola = this.pocitadloId++;
        const nazov = nadpis.querySelector(".mw-headline")?.textContent || nadpis.textContent || "";
        const idRodica = this.najstIdRodica(aktualnyLevel);
        const farba = this.ziskatFarbuPreRodica(idRodica);
        const obsahHTML = this.ziskatObsahPreNadpis(nadpis);

        this.mapaNodes.add({
            id: idVrchola,
            label: nazov,
            color: farba,
            title: obsahHTML,
        });
        this.mapaEdges.add({ from: idRodica, to: idVrchola });

        this.posledneNadpisy[aktualnyLevel] = idVrchola;
        this.posledneNadpisy = this.posledneNadpisy.slice(0, aktualnyLevel + 1);
    }

    private najstIdRodica(aktualnyLevel: number): number {
        for (let lvl = aktualnyLevel - 1; lvl >= 0; lvl--) {
            if (this.posledneNadpisy[lvl] !== undefined) {
                return this.posledneNadpisy[lvl];
            }
        }
        return 1;
    }

    private ziskatFarbuPreRodica(idRodica: number): string {
        if (!this.farbySkupin.has(idRodica)) {
            this.indexSkupiny++;
            this.farbySkupin.set(idRodica, this.indexSkupiny);
        }
        return this.generovatFarbu(this.farbySkupin.get(idRodica)!);
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

        this.pojmova_mapa = new Network(this.elementMapy, dataSiete, this.vytvorNastavenia());
        this.nastavitUdalosti();
        this.pojmova_mapa.fit();
    }

    private vytvorNastavenia(): Options {
        const margin = this.jeMobil ? 5 : 10;

        return {
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
                margin: { top: margin, right: margin, bottom: margin, left: margin },
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
    }

    private nastavitUdalosti(): void {
        const touchZariadenie = "ontouchstart" in window || navigator.maxTouchPoints > 0;

        if (touchZariadenie) {
            this.nastavitDotykovyHandler();
        } else {
            this.pojmova_mapa!.on("click", (params) => this.navigovatNa(params));
        }
    }

    private nastavitDotykovyHandler(): void {
        let poslednyTap = 0;

        this.pojmova_mapa!.on("click", (params) => {
            if (!this.mapaFocus) {
                this.mapaFocus = true;
                this.pojmova_mapa!.setOptions({ interaction: { dragView: true } });
                return;
            }

            const aktualnyCas = Date.now();
            const dlzkaTap = aktualnyCas - poslednyTap;
            poslednyTap = aktualnyCas;

            if (dlzkaTap < DOUBLE_TAP_THRESHOLD && dlzkaTap > 0) {
                this.navigovatNa(params);
            }
        });
    }

    private navigovatNa(params: any): void {
        const nodeId = params?.nodes?.[0];
        if (!nodeId) return;

        const node = this.mapaNodes.get(nodeId) as Node | null;
        if (node?.label) {
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
