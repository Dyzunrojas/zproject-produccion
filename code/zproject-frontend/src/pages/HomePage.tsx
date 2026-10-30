import { Text, Title } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <Title order={2}>Bienvenido, {user?.username}</Title>
      <Text mt="md">Rol: {user?.role}</Text>
      <Text>Permisos: {user?.permissions.length}</Text>
    </>
  );
}