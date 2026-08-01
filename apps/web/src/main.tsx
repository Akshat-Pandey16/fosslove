import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/martian-mono";
import { App } from "./App";
import "./styles/base.css";

const container = document.getElementById("root");
if (container === null) throw new Error("Root container is missing");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
