import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: {
      username: (value) => (value.trim() ? null : "Ingresa tu usuario"),
      password: (value) => (value ? null : "Ingresa tu contraseña"),
    },
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.username.trim(), values.password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Center h="100vh" bg="brand.9">
      <Paper w={380} p="xl" shadow="md" radius="md" withBorder>
        <Title order={2} ta="center" mb="md" c="brand.9">
          ZProject
        </Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput
              label="Usuario"
              autoComplete="username"
              {...form.getInputProps("username")}
            />
            <PasswordInput
              label="Contraseña"
              autoComplete="current-password"
              {...form.getInputProps("password")}
            />
            <Button type="submit" loading={submitting}>
              Iniciar sesión
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}