import { Routes, Route } from "react-router-dom";
import Welcome from "../pages/Welcome/Welcome";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
}

export default AppRouter;