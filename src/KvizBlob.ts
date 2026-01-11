async function nahraditObrazokBlob(subor: Element): Promise<void> {
    const obrazok = subor.querySelector("img");
    if (!obrazok) return;

    try {
        const response = await fetch(obrazok.src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        obrazok.src = URL.createObjectURL(blob);
    } catch (error) {
        console.warn("Nepodarilo sa načítať obrázok:", error);
        return;
    }

    const odkaz = subor.querySelector("a");
    if (odkaz) {
        odkaz.href = "#";
        odkaz.dataset.bsTitle = "Súbor:?";
    }
}

export default function nahradKvizObrazkyAkoBlob(): void {
    const kvizSubory = document.querySelectorAll<Element>('.quiz *[typeof*="mw:File"]');
    Promise.allSettled(Array.from(kvizSubory, nahraditObrazokBlob));
}
