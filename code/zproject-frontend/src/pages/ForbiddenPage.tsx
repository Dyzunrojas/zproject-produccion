import { Button, Container, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <Container py="xl">
      <Title order={2}>Acceso denegado</Title>
      <Text mt="sm" mb="md">
        No tienes permiso para ver esta sección.
      </Text>
      <Button component={Link} to="/">
        Volver al inicio
      </Button>
    </Container>
  );
}