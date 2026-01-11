const FOCUS_MODE_CLASS = "focus-mode-active";
const FOCUS_BLOCK_CLASS = "focus-block";
const FOCUS_CURRENT_CLASS = "focus-block--current";
const BLOCK_SELECTORS =
  "p, ul, ol, figure, blockquote, table, table>caption, div:not(.mw-parser-output):not([id])";

// highlight these as one group, do not go further into them:
const ATOMIC_SELECTORS = [
  "[style*='display: flex']",
  "[style*='display:flex']",
  ".mw-references-wrap",
  "table",
  ".poz-box",
];

class FocusMode {
  private readonly parserOutput: HTMLElement;
  private readonly bloky: HTMLElement[] = [];
  private aktivny: boolean = false;
  private aktualnyIndex: number = 0;
  private klavesovaNagivacia: boolean = false;

  constructor(parserOutput: HTMLElement) {
    this.parserOutput = parserOutput;
    this.inicializovatBloky();
  }

  private inicializovatBloky(): void {
    const atomicSelector = ATOMIC_SELECTORS.join(", ");
    const vsetkyElementy = Array.from(
      this.parserOutput.querySelectorAll<HTMLElement>(
        `:scope > section > ${BLOCK_SELECTORS}`,
      ),
    );

    let i = 0;
    while (i < vsetkyElementy.length) {
      const element = vsetkyElementy[i];

      if (this.jePrazdnyElement(element)) {
        i++;
        continue;
      }

      if (this.jeVnútriBloku(element)) {
        i++;
        continue;
      }

      if (element.matches(atomicSelector)) {
        element.classList.add(FOCUS_BLOCK_CLASS);
        this.bloky.push(element);
        i++;
        continue;
      }

      if (element.tagName === "P") {
        const skupina = this.ziskatSkupinu(element, vsetkyElementy, i);
        if (skupina.length > 1) {
          const wrapper = this.vytvorWrapper(skupina);
          this.bloky.push(wrapper);
          i += skupina.length;
          continue;
        }
      }

      element.classList.add(FOCUS_BLOCK_CLASS);
      this.bloky.push(element);
      i++;
    }
  }

  private jeVnútriBloku(element: HTMLElement): boolean {
    return this.bloky.some(
      (blok) => blok.contains(element) && blok !== element,
    );
  }

  private jePrazdnyElement(element: HTMLElement): boolean {
    const text = element.textContent?.trim() || "";
    if (
      text === "" &&
      element.querySelector("img, figure, video, audio") === null
    ) {
      return true;
    }
    if (element.classList.contains("mw-empty-elt")) {
      return true;
    }
    return false;
  }

  private ziskatSkupinu(
    p: HTMLElement,
    vsetky: HTMLElement[],
    index: number,
  ): HTMLElement[] {
    const skupina: HTMLElement[] = [p];
    let nasledujuciIndex = index + 1;

    while (nasledujuciIndex < vsetky.length) {
      const nasledujuci = vsetky[nasledujuciIndex];
      const tag = nasledujuci.tagName;

      if (tag === "UL" || tag === "OL") {
        skupina.push(nasledujuci);
        nasledujuciIndex++;
      } else {
        break;
      }
    }

    return skupina;
  }

  private vytvorWrapper(elementy: HTMLElement[]): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add(FOCUS_BLOCK_CLASS, "focus-block--group");

    const prvy = elementy[0];
    prvy.parentElement?.insertBefore(wrapper, prvy);

    for (const el of elementy) {
      wrapper.appendChild(el);
    }

    return wrapper;
  }

  public prepnut(): void {
    this.aktivny = !this.aktivny;

    if (this.aktivny) {
      this.aktivovat();
    } else {
      this.deaktivovat();
    }
  }

  private aktivovat(): void {
    document.body.classList.add(FOCUS_MODE_CLASS);
    this.pridatStyly();
    this.nastavitUdalosti();
    this.aktualizovatFocus();
  }

  private deaktivovat(): void {
    document.body.classList.remove(FOCUS_MODE_CLASS);
    this.bloky.forEach((blok) => blok.classList.remove(FOCUS_CURRENT_CLASS));
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  private pridatStyly(): void {
    if (document.getElementById("focus-mode-styles")) return;

    const style = document.createElement("style");
    style.id = "focus-mode-styles";
    style.textContent = `
      body.${FOCUS_MODE_CLASS} .mw-parser-output .${FOCUS_BLOCK_CLASS} {
        opacity: 0.35;
        filter: grayscale(100%);
        transition: opacity 0.2s ease, filter 0.2s ease;
      }
      body.${FOCUS_MODE_CLASS} .mw-parser-output .${FOCUS_BLOCK_CLASS}.${FOCUS_CURRENT_CLASS} {
        opacity: 1;
        filter: none;
      }
      body.${FOCUS_MODE_CLASS} .mw-parser-output h2,
      body.${FOCUS_MODE_CLASS} .mw-parser-output h3,
      body.${FOCUS_MODE_CLASS} .mw-parser-output h4 {
        opacity: 0.5;
        filter: grayscale(100%);
      }
    `;
    document.head.appendChild(style);
  }

  private nastavitUdalosti(): void {
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("keydown", this.handleKeydown);
  }

  private handleScroll = (): void => {
    if (this.klavesovaNagivacia) return;
    this.aktualizovatFocusPodlaScroll();
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (!this.aktivny) return;

    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      this.nasledujuciBlok();
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      this.predchadzajuciBlok();
    } else if (e.key === "Escape") {
      this.prepnut();
    }
  };

  private aktualizovatFocusPodlaScroll(): void {
    const viewportStred = window.innerHeight / 2;

    let najblizsiaVzdialenost = Infinity;
    let najblizsiIndex = 0;

    for (let i = 0; i < this.bloky.length; i++) {
      const rect = this.bloky[i].getBoundingClientRect();
      const stredBloku = rect.top + rect.height / 2;
      const vzdialenost = Math.abs(stredBloku - viewportStred);

      if (vzdialenost < najblizsiaVzdialenost) {
        najblizsiaVzdialenost = vzdialenost;
        najblizsiIndex = i;
      }
    }

    if (najblizsiIndex !== this.aktualnyIndex) {
      this.aktualnyIndex = najblizsiIndex;
      this.aktualizovatFocus();
    }
  }

  private nasledujuciBlok(): void {
    if (this.aktualnyIndex < this.bloky.length - 1) {
      this.aktualnyIndex++;
      this.aktualizovatFocus();
      this.scrollNaAktualny();
    }
  }

  private predchadzajuciBlok(): void {
    if (this.aktualnyIndex > 0) {
      this.aktualnyIndex--;
      this.aktualizovatFocus();
      this.scrollNaAktualny();
    }
  }

  private aktualizovatFocus(): void {
    this.bloky.forEach((blok, index) => {
      blok.classList.toggle(FOCUS_CURRENT_CLASS, index === this.aktualnyIndex);
    });
  }

  private scrollNaAktualny(): void {
    this.klavesovaNagivacia = true;
    this.bloky[this.aktualnyIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(() => {
      this.klavesovaNagivacia = false;
    }, 500);
  }

  public jeAktivny(): boolean {
    return this.aktivny;
  }
}

function pridatTlacidloStyly(): void {
  if (document.getElementById("focus-button-styles")) return;

  const style = document.createElement("style");
  style.id = "focus-button-styles";
  style.textContent = `
    #ca-focus {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--color-surface-2, #f8f9fa);
      color: var(--color-base, #202122);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }

    #ca-focus:hover {
      background: var(--color-surface-3, #eaecf0);
      transform: scale(1.05);
    }

    #ca-focus.focus-button--active {
      background: var(--color-primary, #36c);
      color: #fff;
    }

    #ca-focus.focus-button--active:hover {
      background: var(--color-primary--hover, #447ff5);
    }

    @media (max-width: 719px) {
      #ca-focus {
        bottom: 60px;
      }
    }
  `;
  document.head.appendChild(style);
}

function vytvorTlacidloFocus(focusMode: FocusMode): HTMLButtonElement {
  pridatTlacidloStyly();

  const button = document.createElement("button");
  button.id = "ca-focus";
  button.title = "Focus mode (Escape to exit)";
  button.type = "button";
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16m0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12m0-10a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4"/></svg>`;

  button.addEventListener("click", () => {
    focusMode.prepnut();
    button.classList.toggle("focus-button--active", focusMode.jeAktivny());
  });

  return button;
}

export default function inicializovatFocusMode(): void {
  const parserOutput = document.querySelector<HTMLElement>(".mw-parser-output");

  if (!parserOutput) {
    return;
  }

  const focusMode = new FocusMode(parserOutput);
  const tlacidlo = vytvorTlacidloFocus(focusMode);
  document.body.appendChild(tlacidlo);
}
