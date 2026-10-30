import { Button, Container, Group, Text, Title } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <Container py="xl">
      <Group justify="space-between">
        <Title order={2}>Bienvenido, {user?.username}</Title>
        <Button variant="light" onClick={logout}>
          Cerrar sesión
        </Button>
      </Group>
      <Text mt="md">Rol: {user?.role}</Text>
      <Text>Permisos: {user?.permissions.length}</Text>
    </Container>
  );
}