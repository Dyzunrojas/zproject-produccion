import { useCallback, useState } from "react";
import { notifyError, notifySuccess } from "../utils/notify";

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);

  // Devuelve true si la acción salió bien, false si falló (el error ya se avisó)
  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage?: string): Promise<boolean> => {
      setBusy(true);
      try {
        await action();
        if (successMessage) {
          notifySuccess(successMessage);
        }
        return true;
      } catch (error) {
        notifyError(error);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { busy, run };
}