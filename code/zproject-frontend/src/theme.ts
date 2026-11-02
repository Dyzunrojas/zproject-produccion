import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Verde de la marca. El tono 7 (#1e7e45) con texto blanco da contraste ~5:1 (cumple RU-2: 4.5:1)
const brand: MantineColorsTuple = [
  "#ecf8f1",
  "#d6f0e1",
  "#aee0c4",
  "#82d0a5",
  "#5bc18b",
  "#3fb176",
  "#2a9560",
  "#1e7e45",
  "#17663a",
  "#0f4d2b",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 7,
  colors: { brand },
  autoContrast: true,
  black: "#13201a",
  defaultRadius: "md",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  headings: { fontWeight: "700" },
});
