import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RequestDetailPage from "./pages/RequestDetailPage";
import Analytics from "./pages/Analytics";
import Traces from "./pages/Traces";
import TraceDetail from "./pages/TraceDetail";
import AuthPage from "./pages/AuthPage";
import MainLayout from './components/MainLayout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/logs/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/traces" element={<ProtectedRoute><Traces /></ProtectedRoute>} />
        <Route path="/traces/:traceId" element={<ProtectedRoute><TraceDetail /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
