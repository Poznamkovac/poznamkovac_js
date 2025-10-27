function pridatStyly(): void {
    const style = document.createElement("style");
    style.innerHTML = `
        .zvyraznenie {
            background-color: #ffff9910;
            padding: 5px;
            border-left: 5px solid #ffcc0026;
        }
    `;
    document.head.appendChild(style);
}

function zvyraznitSekciuPodlaHash(): void {
    document.querySelectorAll(".zvyraznenie").forEach((element) => {
        element.classList.remove("zvyraznenie");
    });

    const hash = decodeURIComponent(window.location.hash);
    if (hash) {
        const cielovyElement = document.getElementById(hash.substring(1))?.parentElement;
        if (cielovyElement) {
            cielovyElement.classList.add("zvyraznenie");
        }
    }
}

export default function zvyraznitNadpisy(): void {
    pridatStyly();
    zvyraznitSekciuPodlaHash();
    window.addEventListener("hashchange", zvyraznitSekciuPodlaHash);
}

