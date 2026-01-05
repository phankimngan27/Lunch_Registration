import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Statistics from './pages/Statistics';
import UserManagement from './pages/UserManagement';
import DailyRegistrations from './pages/DailyRegistrations';
import RegistrationConfig from './pages/RegistrationConfig';
import BulkRegistrationEdit from './pages/BulkRegistrationEdit';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/daily-registrations" element={<DailyRegistrations />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/config" element={<RegistrationConfig />} />
          <Route path="/bulk-registration-edit" element={<BulkRegistrationEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
