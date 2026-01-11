import vykreslitMapu from "./src/PojmovaMapa";
import ocislujPojmy from "./src/PojmyOcislovanie";
import nahradKvizObrazkyAkoBlob from "./src/KvizBlob";
import zvyraznitNadpisy from "./src/ZvyraznitNadpisy";
import inicializovatFocusMode from "./src/FocusMode";

globalThis.addEventListener("load", () => {
  ocislujPojmy();
  vykreslitMapu();
  nahradKvizObrazkyAkoBlob();
  zvyraznitNadpisy();
  inicializovatFocusMode();
});
