import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import {
  MomentsProvider,
} from "./contexts/MomentsContext";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import "leaflet/dist/leaflet.css";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/animations.css";
import "./styles/utilities.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <MomentsProvider>
                <App />
              </MomentsProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);