import { AppShell, Burger, Button, Group, NavLink, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { navItems } from "../../routes/navigation";
import { ChangePasswordModal } from "../organisms/ChangePasswordModal";

export function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure();
  const [passwordOpened, passwordHandlers] = useDisclosure(false);

  const visibleItems = navItems.filter(
    (item) => item.permission === undefined || hasPermission(item.permission),
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header bg="brand.9" c="white" withBorder={false}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            <Title order={3}>ZProject</Title>
          </Group>
          <Group>
            <Text size="sm">
              {user?.username} · {user?.role}
            </Text>
            <Button variant="subtle" color="white" size="xs" onClick={passwordHandlers.open}>
              Cambiar contraseña
            </Button>
            <Button variant="white" color="brand.9" size="xs" onClick={logout}>
              Cerrar sesión
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="white">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path}
            label={item.label}
            active={location.pathname === item.path}
            variant="filled"
            fw={500}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Outlet />
      </AppShell.Main>

      <ChangePasswordModal opened={passwordOpened} onClose={passwordHandlers.close} />
    </AppShell>
  );
}