import { Button, Container, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <Container py="xl">
      <Title order={2}>Página no encontrada</Title>
      <Text mt="sm" mb="md">
        La dirección que buscas no existe.
      </Text>
      <Button component={Link} to="/">
        Volver al inicio
      </Button>
    </Container>
  );
}