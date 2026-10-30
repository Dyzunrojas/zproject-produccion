import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "../api/errors";

export function notifySuccess(message: string): void {
  notifications.show({ message, color: "green" });
}

export function notifyError(error: unknown): void {
  notifications.show({ title: "Error", message: getErrorMessage(error), color: "red" });
}