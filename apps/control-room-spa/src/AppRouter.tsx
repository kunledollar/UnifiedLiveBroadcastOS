import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AutonomousProvider } from "./workspace/autonomous/AutonomousProvider";
import WorkspaceShell from "./workspace/WorkspaceShell";

export function AppRouter() {
  return (
    <Router>
      <AutonomousProvider>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/control-room" replace />}
          />

          <Route
            path="/control-room/*"
            element={<WorkspaceShell />}
          />

          <Route
            path="*"
            element={<Navigate to="/control-room" replace />}
          />
        </Routes>
      </AutonomousProvider>
    </Router>
  );
}