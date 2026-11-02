import { Alert, Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { getOrderBalance, registerPayment } from "../../services/paymentService";
import type { OrderBalance, PaymentMethod } from "../../types/payment";
import { formatMoney } from "../../utils/format";
import { notifyError, notifySuccess } from "../../utils/notify";
import { paymentMethodOptions } from "../../utils/paymentMethod";
import { FormActions } from "../molecules/FormActions";

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

interface PaymentFormValues {
  orderId: number | string;
  amountPaid: number | string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  note: string;
}

interface PaymentFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

function PaymentForm({ onSaved, onCancel }: PaymentFormProps) {
  const { busy, run } = useAsyncAction();
  const [balance, setBalance] = useState<OrderBalance | null>(null);
  const [checking, setChecking] = useState(false);

  const form = useForm<PaymentFormValues>({
    initialValues: {
      orderId: "",
      amountPaid: "",
      paymentMethod: "efectivo",
      paymentDate: todayIso(),
      note: "",
    },
    validate: {
      orderId: (value) =>
        value === "" || Number(value) < 1 ? "Ingresa el número de pedido" : null,
      amountPaid: (value) =>
        value === "" || Number(value) <= 0 ? "El monto debe ser mayor a 0" : null,
      paymentMethod: (value) => (value ? null : "Selecciona un método de pago"),
      paymentDate: (value) => {
        if (!value) return "Ingresa la fecha";
        return value > todayIso() ? "La fecha no puede ser futura" : null;
      },
      note: (value) => (value.length > 255 ? "Máximo 255 caracteres" : null),
    },
  });

  const handleCheckBalance = async () => {
    const orderId = form.values.orderId;
    if (orderId === "" || Number(orderId) < 1) {
      form.setFieldError("orderId", "Ingresa el número de pedido");
      return;
    }
    setChecking(true);
    try {
      setBalance(await getOrderBalance(Number(orderId)));
    } catch (error) {
      setBalance(null);
      notifyError(error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (values: PaymentFormValues) => {
    let remaining = "";
    const ok = await run(async () => {
      const result = await registerPayment({
        orderId: Number(values.orderId),
        amountPaid: Number(values.amountPaid),
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate,
        note: values.note.trim(),
      });
      remaining = formatMoney(Number(result.balance.balance));
    });
    if (ok) {
      notifySuccess(`Abono registrado. Saldo pendiente: ${remaining}`);
      onSaved();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Group align="flex-end" wrap="nowrap">
          <NumberInput
            label="N.º de pedido o reparación"
            min={1}
            allowDecimal={false}
            style={{ flex: 1 }}
            {...form.getInputProps("orderId")}
            onChange={(value) => {
              setBalance(null);
              form.setFieldValue("orderId", typeof value === "bigint" ? Number(value) : value);
            }}
          />
          <Button variant="default" onClick={handleCheckBalance} loading={checking}>
            Ver saldo
          </Button>
        </Group>

        {balance && (
          <Alert color={balance.fullyPaid ? "green" : "blue"} title={`Pedido #${balance.orderId}`}>
            <Text size="sm">Total: {formatMoney(Number(balance.totalAmount))}</Text>
            <Text size="sm">Abonado: {formatMoney(Number(balance.totalPaid))}</Text>
            <Text size="sm" fw={600}>
              Saldo pendiente: {formatMoney(Number(balance.balance))}
            </Text>
            {balance.fullyPaid && <Text size="sm">El pedido ya está pagado por completo.</Text>}
          </Alert>
        )}

        <NumberInput
          label="Monto del abono (₡)"
          min={0}
          decimalScale={2}
          thousandSeparator=" "
          {...form.getInputProps("amountPaid")}
        />
        <Select
          label="Método de pago"
          data={paymentMethodOptions}
          allowDeselect={false}
          {...form.getInputProps("paymentMethod")}
        />
        <TextInput
          label="Fecha del pago"
          type="date"
          max={todayIso()}
          {...form.getInputProps("paymentDate")}
        />
        <TextInput
          label="Nota"
          placeholder="Opcional"
          maxLength={255}
          {...form.getInputProps("note")}
        />
        <FormActions submitting={busy} onCancel={onCancel} submitLabel="Registrar abono" />
      </Stack>
    </form>
  );
}

interface PaymentFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PaymentFormModal({ opened, onClose, onSaved }: PaymentFormModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Registrar abono" centered>
      <PaymentForm onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}