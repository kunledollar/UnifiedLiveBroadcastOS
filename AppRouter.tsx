import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WorkspaceShell } from "./workspace/WorkspaceShell";

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/control-room/*" element={<WorkspaceShell />} />
      </Routes>
    </Router>
  );
}
