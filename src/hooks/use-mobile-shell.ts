import * as React from "react";

/**
 * Considera "shell mobile" telas estreitas OU telas baixas em paisagem
 * (celulares deitados costumam ter largura >= 768px mas pouca altura).
 */
const QUERY = "(max-width: 767px), (max-height: 540px) and (orientation: landscape)";

export function useMobileShell() {
  const [isMobileShell, setIsMobileShell] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobileShell(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobileShell;
}

/** Vibração curta (quando o dispositivo suporta) para feedback tátil. */
export function hapticTap(padrao: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(padrao);
    }
  } catch {
    // silencioso: feedback tátil é opcional
  }
}
