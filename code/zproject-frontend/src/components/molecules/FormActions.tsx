import { Button, Group } from "@mantine/core";

interface FormActionsProps {
  submitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
}

export function FormActions({ submitting, onCancel, submitLabel = "Guardar" }: FormActionsProps) {
  return (
    <Group justify="flex-end" mt="sm">
      <Button variant="default" onClick={onCancel} disabled={submitting}>
        Cancelar
      </Button>
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </Group>
  );
}