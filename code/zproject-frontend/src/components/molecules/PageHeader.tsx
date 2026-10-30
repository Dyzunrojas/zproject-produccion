import type { ReactNode } from "react";
import { Group, Title } from "@mantine/core";

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <Group justify="space-between" mb="md">
      <Title order={2}>{title}</Title>
      {actions}
    </Group>
  );
}