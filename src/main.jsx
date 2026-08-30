import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import {
  NotificationProvider,
} from "./context/NotificationContext";

import {
  AuthProvider,
} from "./context/AuthContext";

import "./index.css";

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
);