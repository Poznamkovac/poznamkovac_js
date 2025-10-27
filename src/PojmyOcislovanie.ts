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
    const sidebarPojmyConfig = document.getElementById("sidebar-pojmy-config");
    const nadradeneCislo = sidebarPojmyConfig?.dataset.cislo;

    const pojmy = document.querySelectorAll(".sidebar-pojem");
    let aktualnyPojem = 1;

    pojmy.forEach((pojem) => {
        const pojemCislovanie = pojem.querySelector(".sidebar-pojem-cislovanie");
        if (pojemCislovanie) {
            const cislo = zformatovatCislo(nadradeneCislo, aktualnyPojem);
            const id = zformatovatId(nadradeneCislo, aktualnyPojem);
            const odkaz = vytvorOdkazNaCislo(cislo, id);
            pojemCislovanie.appendChild(odkaz);
        }
        aktualnyPojem++;
    });
}
