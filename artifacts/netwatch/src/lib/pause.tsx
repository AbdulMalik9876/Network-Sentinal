import { createContext, useContext, useState, ReactNode } from "react";

interface PauseCtx {
  paused: boolean;
  setPaused: (p: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<PauseCtx>({ paused: false, setPaused: () => {}, toggle: () => {} });

export function PauseProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const toggle = () => setPaused((p) => !p);
  return <Ctx.Provider value={{ paused, setPaused, toggle }}>{children}</Ctx.Provider>;
}

export function usePause() {
  return useContext(Ctx);
}
