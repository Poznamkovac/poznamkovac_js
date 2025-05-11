export default function nahradKvizObrazkyAkoBlob() {
    const kvizSubory = globalThis.document.querySelectorAll('.quiz *[typeof*="mw:File"]');

    kvizSubory.forEach(async (subor) => {
        const obrazok = subor.querySelector("img");
        if (!obrazok) return;

        const obrazokUrl = obrazok.src;
        const blob = await fetch(obrazokUrl).then((r) => r.blob());
        obrazok.src = URL.createObjectURL(blob);

        const a = subor.querySelector("a");
        if (!a) return;

        a.href = "#";
        a.dataset.bsTitle = "Súbor:?";
    });
}
