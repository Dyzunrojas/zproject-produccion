import { describe, expect, it } from "vitest";
import type { Permission } from "../types/auth";
import { formatDate } from "./format";
import { buildMatrix, permissionLabel, resourceLabel } from "./permissions";

const permission = (code: string): Permission => ({ id: 1, code, description: "" });

describe("utils del front", () => {
  it("FRONT-01: buildMatrix separa los módulos (crear/ver/editar/eliminar) de los permisos especiales", () => {
    const matrix = buildMatrix([
      permission("materials:read"),
      permission("materials:create"),
      permission("materials:purchase"),
      permission("print_orders:finalize"),
    ]);

    expect(matrix.resources).toEqual(["materials"]);
    expect(matrix.extras.map((item) => item.code)).toEqual([
      "materials:purchase",
      "print_orders:finalize",
    ]);
  });

  it("FRONT-02: buildMatrix ordena los módulos y deja los desconocidos al final", () => {
    const matrix = buildMatrix([
      permission("zzz:read"),
      permission("materials:read"),
      permission("clients:read"),
      permission("print_orders:read"),
    ]);

    expect(matrix.resources).toEqual(["clients", "print_orders", "materials", "zzz"]);
  });

  it("FRONT-03: las etiquetas usan el texto en español y, si no existe, el código", () => {
    expect(resourceLabel("print_orders")).toBe("Pedidos 3D");
    expect(resourceLabel("otro")).toBe("otro");
    expect(permissionLabel("auth:manageUsers")).toBe("Administrar usuarios");
    expect(permissionLabel("algo:raro")).toBe("algo:raro");
  });

  it("FRONT-04: formatDate convierte a dd/mm/aaaa y muestra — si no hay fecha", () => {
    expect(formatDate("2026-11-05")).toBe("05/11/2026");
    expect(formatDate("2026-11-05T14:30:00")).toBe("05/11/2026");
    expect(formatDate(null)).toBe("—");
  });
});
