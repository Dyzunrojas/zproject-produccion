import { useState } from "react";
import { Button, Collapse, NumberInput, Paper, Select, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { purchaseMaterial } from "../../services/materialService";

interface InlineMaterialPurchaseProps {
  options: { value: string; label: string }[];
  onPurchased: () => void;
}

// Para cuando llegó material y aún no se había registrado: se registra sin salir de la ventana
export function InlineMaterialPurchase({ options, onPurchased }: InlineMaterialPurchaseProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const { busy, run } = useAsyncAction();
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [grams, setGrams] = useState<number | string>("");

  const canSubmit = materialId !== null && Number(grams) > 0;

  const handlePurchase = async () => {
    if (!materialId) return;
    const ok = await run(
      () => purchaseMaterial(Number(materialId), { grams: Number(grams) }),
      "Compra registrada",
    );
    if (ok) {
      setGrams("");
      onPurchased();
    }
  };

  return (
    <>
      <Button variant="subtle" size="compact-sm" w="fit-content" onClick={toggle}>
        {opened ? "Ocultar compra de material" : "¿Falta stock? Registrar compra de material"}
      </Button>
      <Collapse expanded={opened}>
        <Paper withBorder p="sm">
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Registrar compra
            </Text>
            <Select
              placeholder="Material comprado"
              data={options}
              value={materialId}
              onChange={(value) => setMaterialId(value === null ? null : String(value))}
            />
            <NumberInput
              placeholder="Gramos comprados"
              min={0}
              decimalScale={2}
              hideControls
              value={grams}
              onChange={(value) => setGrams(typeof value === "bigint" ? Number(value) : value)}
            />
            <Button
              w="fit-content"
              disabled={!canSubmit}
              loading={busy}
              onClick={handlePurchase}
            >
              Registrar compra
            </Button>
          </Stack>
        </Paper>
      </Collapse>
    </>
  );
}
