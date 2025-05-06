import vykreslitMapu from "./src/PojmovaMapa";
import ocislujPojmy from "./src/PojmyOcislovanie";

globalThis.addEventListener("load", () => {
    ocislujPojmy();
    vykreslitMapu();
});
