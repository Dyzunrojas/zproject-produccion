import { Card, SimpleGrid, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { navItems } from "../routes/navigation";

const descriptions: Record<string, string> = {
  "/printOrders": "Crea pedidos, sube los archivos STL y finalízalos.",
  "/materials": "Controla el stock y registra compras de filamento.",
  "/users": "Crea usuarios, asigna roles y restablece contraseñas.",
  "/roles": "Define qué puede hacer cada rol.",
  "/tools": "Inventario de herramientas del taller.",
  "/warranties": "Garantías de las reparaciones.",
  "/spareParts": "Repuestos disponibles y su uso.",
  "/repairs": "Recibe, diagnostica y finaliza reparaciones.",
};

export function HomePage() {
  const { user, hasPermission } = useAuth();

  const modules = navItems.filter(
    (item) => item.path !== "/" && (item.permission === undefined || hasPermission(item.permission)),
  );

  return (
    <>
      <Title order={2}>Bienvenido, {user?.username}</Title>
      <Text c="dimmed" mb="lg">
        ¿Qué quieres hacer hoy?
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {modules.map((item) => (
          <Card key={item.path} component={Link} to={item.path} withBorder padding="lg">
            <Text fw={700} c="brand.8">
              {item.label}
            </Text>
            <Text size="sm" mt={4}>
              {descriptions[item.path]}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
