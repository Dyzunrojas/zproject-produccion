import { useCallback, useState } from "react";

export function useItemModal<T>() {
  const [opened, setOpened] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  // open() abre en blanco (crear); open(elemento) abre con ese elemento (editar)
  const open = useCallback((value: T | null = null) => {
    setItem(value);
    setOpened(true);
  }, []);

  const close = useCallback(() => setOpened(false), []);

  return { opened, item, open, close };
}