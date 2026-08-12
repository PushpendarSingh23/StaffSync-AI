import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import AICopilot from './pages/AICopilot';
import ChatHistory from './pages/ChatHistory';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

const App = () => (
  <Router>
    <AuthProvider>
      <NavBar />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected — all authenticated users */}
        <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/documents"  element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/copilot"    element={<ProtectedRoute><AICopilot /></ProtectedRoute>} />
        <Route path="/history"    element={<ProtectedRoute><ChatHistory /></ProtectedRoute>} />

        {/* Protected — admin only */}
        <Route path="/analytics"
          element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />

        {/* 404 — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </Router>
);

export default App;
