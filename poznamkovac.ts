import vykreslitMapu from "./src/PojmovaMapa";
import rezimSustredenia from "./src/RezimSustredenia";

globalThis.addEventListener("load", () => {
    rezimSustredenia();
    vykreslitMapu();
});
