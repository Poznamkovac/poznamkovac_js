const FOCUS_MODE_CLASS = "focus-mode-active";
const FOCUS_BLOCK_CLASS = "focus-block";
const FOCUS_CURRENT_CLASS = "focus-block--current";
const BLOCK_SELECTORS =
  "p, ul, ol, figure, blockquote, div:not(.mw-parser-output):not([id])";

class FocusMode {
  private readonly parserOutput: HTMLElement;
  private readonly bloky: HTMLElement[] = [];
  private aktivny: boolean = false;
  private aktualnyIndex: number = 0;

  constructor(parserOutput: HTMLElement) {
    this.parserOutput = parserOutput;
    this.inicializovatBloky();
  }

  private inicializovatBloky(): void {
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
    this.bloky[this.aktualnyIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  public jeAktivny(): boolean {
    return this.aktivny;
  }
}

function vytvorTlacidloFocus(focusMode: FocusMode): HTMLLIElement {
  const li = document.createElement("li");
  li.id = "ca-focus";
  li.className = "mw-list-item";

  const a = document.createElement("a");
  a.href = "#";
  a.title = "Focus mode";
  a.addEventListener("click", (e) => {
    e.preventDefault();
    focusMode.prepnut();
    li.classList.toggle("selected", focusMode.jeAktivny());
  });

  const iconSpan = document.createElement("span");
  iconSpan.className =
    "citizen-ui-icon mw-ui-icon-eye mw-ui-icon-wikimedia-eye";

  const textSpan = document.createElement("span");
  textSpan.textContent = "Focus";

  a.appendChild(iconSpan);
  a.appendChild(document.createTextNode(" "));
  a.appendChild(textSpan);
  li.appendChild(a);

  return li;
}

export default function inicializovatFocusMode(): void {
  const parserOutput = document.querySelector<HTMLElement>(".mw-parser-output");
  const viewsMenu = document.querySelector(
    "#p-views .citizen-menu__content-list, #p-views ul",
  );

  if (!parserOutput || !viewsMenu) {
    return;
  }

  const focusMode = new FocusMode(parserOutput);
  const tlacidlo = vytvorTlacidloFocus(focusMode);
  viewsMenu.appendChild(tlacidlo);
}
