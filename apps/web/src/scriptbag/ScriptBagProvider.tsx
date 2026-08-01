import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLATFORMS, type Platform } from "@/api/types";
import { ScriptBagContext, type BagItem, type ScriptBagState } from "./context";
import { readBag, writeBag } from "./storage";

export function ScriptBagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Record<Platform, BagItem[]>>(readBag);

  useEffect(() => {
    writeBag(items);
  }, [items]);

  const add = useCallback((item: BagItem) => {
    setItems((current) => {
      if (current[item.platform].some((entry) => entry.id === item.id)) return current;
      return { ...current, [item.platform]: [...current[item.platform], item] };
    });
  }, []);

  const remove = useCallback((appId: number) => {
    setItems((current) => {
      const next = { ...current };
      let changed = false;
      for (const platform of PLATFORMS) {
        const filtered = current[platform].filter((entry) => entry.id !== appId);
        if (filtered.length !== current[platform].length) {
          next[platform] = filtered;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, []);

  const toggle = useCallback(
    (item: BagItem) => {
      setItems((current) =>
        current[item.platform].some((entry) => entry.id === item.id)
          ? {
              ...current,
              [item.platform]: current[item.platform].filter((entry) => entry.id !== item.id),
            }
          : { ...current, [item.platform]: [...current[item.platform], item] },
      );
    },
    [],
  );

  const clear = useCallback((platform: Platform) => {
    setItems((current) => (current[platform].length === 0 ? current : { ...current, [platform]: [] }));
  }, []);

  const value = useMemo<ScriptBagState>(() => {
    const ids = new Set<number>();
    for (const platform of PLATFORMS) {
      for (const entry of items[platform]) ids.add(entry.id);
    }
    return {
      items,
      has: (appId: number) => ids.has(appId),
      add,
      remove,
      toggle,
      clear,
      count: (platform: Platform) => items[platform].length,
      total: ids.size,
    };
  }, [items, add, remove, toggle, clear]);

  return <ScriptBagContext value={value}>{children}</ScriptBagContext>;
}
