export default function ocislujPojmy() {
    const sidebarPojmyConfig = globalThis.document.getElementById("sidebar-pojmy-config");
    const nadradeneCislo = sidebarPojmyConfig?.dataset.cislo;
    let aktualnyPojem = 1;

    const pojmy = document.querySelectorAll(".sidebar-pojem");
    pojmy.forEach((pojem) => {
        const pojemCislovanie = pojem.querySelector(".sidebar-pojem-cislovanie");
        if (!pojemCislovanie) {
            aktualnyPojem++;
            return;
        }

        const text = nadradeneCislo ? `${nadradeneCislo}.${aktualnyPojem}` : `${aktualnyPojem}`;
        const id = `pojem-${nadradeneCislo ?? "1"}-${aktualnyPojem}`;
        const a = globalThis.document.createElement("a");

        a.id = id;
        a.href = "#" + id;
        a.textContent = text;

        pojemCislovanie.appendChild(a);
        aktualnyPojem++;
    });
}
