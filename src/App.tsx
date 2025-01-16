import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import DynamicForm from "./pages/DynamicForm";
import Login from "./pages/Login";
import WebhookTest from "./pages/WebhookTest";
import LandingPage from "./pages/LandingPage";
import ProtectedFormPage from "./pages/ProtectedFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/forms/:slug" element={<ProtectedFormPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/f/:slug" element={<DynamicForm />} />
        <Route path="/webhook-test" element={<WebhookTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;