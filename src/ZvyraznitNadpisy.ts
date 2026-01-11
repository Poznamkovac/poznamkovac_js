const TRIEDA_ZVYRAZNENIA = "zvyraznenie";

function pridatStyly(): void {
    const style = document.createElement("style");
    style.textContent = `
        .${TRIEDA_ZVYRAZNENIA} {
            background-color: #ffff9910;
            padding: 5px;
            border-left: 5px solid #ffcc0026;
        }
    `;
    document.head.appendChild(style);
}

function zvyraznitSekciuPodlaHash(): void {
    document.querySelectorAll(`.${TRIEDA_ZVYRAZNENIA}`).forEach((el) => {
        el.classList.remove(TRIEDA_ZVYRAZNENIA);
    });

    const hash = decodeURIComponent(window.location.hash).substring(1);
    if (!hash) return;

    document.getElementById(hash)?.parentElement?.classList.add(TRIEDA_ZVYRAZNENIA);
}

export default function zvyraznitNadpisy(): void {
    pridatStyly();
    zvyraznitSekciuPodlaHash();
    window.addEventListener("hashchange", zvyraznitSekciuPodlaHash);
}

