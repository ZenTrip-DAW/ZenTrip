import { useState, useEffect } from "react";

/**
 * Devuelve { displayed, full }
 *   displayed - texto parcial que se está escribiendo/borrando
 *   full      - texto completo del turno actual (útil para calcular estilos)
 */
export default function useTypewriter(texts, { speed = 80, deleteSpeed = 40, pause = 1800 } = {}) {
  const list = Array.isArray(texts) ? texts : [texts];
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing"); // "typing" | "deleting"

  useEffect(() => {
    const current = list[index];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), speed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), pause);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), deleteSpeed);
        return () => clearTimeout(t);
      }
      setIndex((i) => (i + 1) % list.length);
      setPhase("typing");
    }
  }, [displayed, phase, index, list, speed, deleteSpeed, pause]);

  return { displayed, full: list[index] };
}
