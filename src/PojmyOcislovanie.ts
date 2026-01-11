function vytvorOdkazNaCislo(cislo: string, id: string): HTMLAnchorElement {
    const odkaz = document.createElement("a");
    odkaz.id = id;
    odkaz.href = `#${id}`;
    odkaz.textContent = cislo;
    return odkaz;
}

function zformatovatCislo(nadradeneCislo: string | undefined, aktualnyPojem: number): string {
    return nadradeneCislo ? `${nadradeneCislo}.${aktualnyPojem}` : `${aktualnyPojem}`;
}

function zformatovatId(nadradeneCislo: string | undefined, aktualnyPojem: number): string {
    return `pojem-${nadradeneCislo ?? "1"}-${aktualnyPojem}`;
}

export default function ocislujPojmy(): void {
    const nadradeneCislo = document.getElementById("sidebar-pojmy-config")?.dataset.cislo;
    const pojmy = document.querySelectorAll(".sidebar-pojem");

    pojmy.forEach((pojem, index) => {
        const pojemCislovanie = pojem.querySelector(".sidebar-pojem-cislovanie");
        if (!pojemCislovanie) return;

        const poradoveCislo = index + 1;
        const cislo = zformatovatCislo(nadradeneCislo, poradoveCislo);
        const id = zformatovatId(nadradeneCislo, poradoveCislo);
        pojemCislovanie.appendChild(vytvorOdkazNaCislo(cislo, id));
    });
}
