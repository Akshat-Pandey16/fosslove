import { use } from "react";
import { ScriptBagContext, type ScriptBagState } from "./context";

export function useScriptBag(): ScriptBagState {
  const value = use(ScriptBagContext);
  if (value === null) throw new Error("useScriptBag must be used inside a ScriptBagProvider");
  return value;
}
