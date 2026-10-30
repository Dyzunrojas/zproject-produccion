import { useCallback, useEffect, useState } from "react";
import { notifyError } from "../utils/notify";

// Importante: `fetcher` debe ser una función estable (por ejemplo, una función
// exportada de un service), no una función creada dentro del componente.
export function useLoad<T>(fetcher: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(notifyError)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, loading, reload };
}