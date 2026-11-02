import type { Client } from "../types/client";


export function buildClientOptions(clients: Client[], keepId?: number) {
  return clients
    .filter((client) => client.isActive || client.id === keepId)
    .map((client) => ({
      value: String(client.id),
      label: client.phone ? `${client.name} · ${client.phone}` : client.name,
    }));
}