// Reglas de validación reutilizables para los formularios.
// Cada función devuelve el mensaje de error, o null si el valor es válido
// (el formato que espera `validate` de @mantine/form).

const objectNamePattern = /^[\p{L}\p{N} ._()-]+$/u;
const colorPattern = /^[\p{L} ]+$/u;
const materialTypePattern = /^[\p{L}\p{N} +-]+$/u;

export const maxStlMb = 50;

function checkText(
  value: string,
  max: number,
  pattern: RegExp,
  emptyMessage: string,
  invalidMessage: string,
): string | null {
  const text = value.trim();
  if (!text) return emptyMessage;
  if (text.length > max) return `Máximo ${max} caracteres`;
  return pattern.test(text) ? null : invalidMessage;
}

export function validateObjectName(value: string): string | null {
  return checkText(
    value,
    100,
    objectNamePattern,
    "Ingresa el nombre del objeto",
    "Solo letras, números, espacios y . - _ ( )",
  );
}

export function validateColor(value: string): string | null {
  return checkText(value, 30, colorPattern, "Ingresa el color", "Solo letras y espacios");
}

export function validateMaterialType(value: string): string | null {
  return checkText(
    value,
    30,
    materialTypePattern,
    "Ingresa el tipo de material",
    "Solo letras, números, espacios, + y -",
  );
}

export function validateStlFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".stl")) {
    return "El archivo debe ser .stl";
  }
  if (file.size > maxStlMb * 1024 * 1024) {
    return `El archivo supera el máximo de ${maxStlMb} MB`;
  }
  return null;
}
