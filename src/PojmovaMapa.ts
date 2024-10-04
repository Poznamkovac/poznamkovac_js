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

    private walker: NadpisWalker;
    private indexSkupiny: number = 0;
    private farbySkupin: { [key: number]: number } = {};
    private posledneNadpisy: number[] = [];
    private nodeIdCounter: number = 1;
    private processing: boolean = false;

    constructor(obsahStranky: HTMLElement, elementMapy: HTMLDivElement) {
        this.obsahStranky = obsahStranky;
        this.elementMapy = elementMapy;
        this.mapaNodes = new DataSet();
        this.mapaEdges = new DataSet();

        // Initialize the Walker to walk over headings
        this.walker = new NadpisWalker(this.obsahStranky);
    }

    public vykreslit(): void {
        this.vykreslitMapu();
        this.vytvoritDataMapy();
    }

    private vytvoritDataMapy(): void {
        const korenovyNadpis = document.getElementById("firstHeading")?.innerText || "Koreň";
        const rootNode: Node = {
            id: 1,
            label: korenovyNadpis,
            color: this.generovatFarbu(this.indexSkupiny),
        };
        this.mapaNodes.add(rootNode);
        this.farbySkupin[1] = this.indexSkupiny;
        this.nodeIdCounter = 2;

        this.processing = true;
        this.procesovatDalsiChunk();
    }

    private procesovatDalsiChunk(): void {
        if (!this.processing) return;

        const chunkSize = 5;
        let processed = 0;

        let currentHeading: HTMLHeadingElement | null;
        while (processed < chunkSize && (currentHeading = this.walker.nasledovnyNadpis())) {
            const aktualnyLevel = this.ziskatLevelNadpisu(currentHeading);
            const idVrchola = this.nodeIdCounter++;
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
            const color = this.generovatFarbu(this.farbySkupin[idRodica]);

            const contentHtml = this.ziskatObsahPreNadpis(currentHeading);
            const node: Node = {
                id: idVrchola,
                label: nazov,
                color: color,
                title: contentHtml,
            };
            this.mapaNodes.add(node);
            this.mapaEdges.add({ from: idRodica, to: idVrchola });

            this.posledneNadpisy[aktualnyLevel] = idVrchola;
            this.posledneNadpisy = this.posledneNadpisy.slice(0, aktualnyLevel + 1);

            processed++;
        }

        if (currentHeading!) {
            setTimeout(() => this.procesovatDalsiChunk(), 0);
        } else {
            this.processing = false;
        }
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
                zoomView: !this.jeMobil,
                dragView: !this.jeMobil,
                dragNodes: false,
            },
            nodes: {
                shape: "box",
                widthConstraint: { maximum: 200 },
                labelHighlightBold: true,
            },
            edges: {
                width: 1.0,
                arrows: { to: { enabled: true } },
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: this.jeMobil ? "LR" : "UD",
                    sortMethod: "directed",
                    nodeSpacing: this.jeMobil ? 40 : 200,
                    levelSeparation: this.jeMobil ? 140 : 80,
                    shakeTowards: "roots",
                },
            },
            height: "400px",
        };

        this.pojmova_mapa = new Network(this.elementMapy, dataSiete, nastavenia);
        this.nastavitUdalosti();
    }

    private nastavitUdalosti(): void {
        const touchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

        if (touchDevice) {
            // On touch devices, first click shows the tooltip, double-click navigates
            let lastTapTime = 0;

            this.pojmova_mapa?.on("click", (params) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                lastTapTime = currentTime;
                if (tapLength < 500 && tapLength > 0) {
                    // Double-tap detected
                    this.navigateToNode(params);
                } else {
                    // Treat as hover
                    // Show tooltip (vis-network handles this automatically if 'title' is set)
                    // Do nothing extra
                }
            });
        } else {
            // On non-touch devices
            this.pojmova_mapa?.on("click", (params) => {
                this.navigateToNode(params);
            });
        }
    }

    private navigateToNode(params: any): void {
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
