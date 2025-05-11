import vykreslitMapu from "./src/PojmovaMapa";
import ocislujPojmy from "./src/PojmyOcislovanie";
import nahradKvizObrazkyAkoBlob from "./src/KvizBlob";

globalThis.addEventListener("load", () => {
    ocislujPojmy();
    vykreslitMapu();
    nahradKvizObrazkyAkoBlob();
});
