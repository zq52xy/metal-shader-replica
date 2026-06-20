// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: Browser root element.
// OUTPUT: Mounted React shader application.
// POS: Keep app bootstrap only; no shader or UI state here.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
