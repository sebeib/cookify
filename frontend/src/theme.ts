import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "sage",
  defaultRadius: "md",
  fontFamily: "IBM Plex Sans, sans-serif",
  headings: {
    fontFamily: "IBM Plex Sans, sans-serif",
    fontWeight: "600",
  },
  colors: {
    sage: [
      "#f4f8f3",
      "#e6efe2",
      "#d4e2cd",
      "#bfd4b6",
      "#afc8a4",
      "#a4c09a",
      "#8fa986",
      "#7c9372",
      "#6a7d5f",
      "#59694f",
    ],
    slate: [
      "#f5f7f8",
      "#e7ebee",
      "#d3dbe0",
      "#bcc8d0",
      "#a8b8c2",
      "#99acb8",
      "#8396a3",
      "#6f808c",
      "#5b6972",
      "#465159",
    ],
  },
  other: {
    appShellBorder: "#e8ecef",
    subtleSurface: "#f7f8f9",
    mutedText: "#66717a",
    pastelAccent: "#a4c09a",
    pastelSurface: "#f4f8f3",
  },
});
