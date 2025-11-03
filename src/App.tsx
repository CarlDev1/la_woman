import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, ProtectedRoute, useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Trophies from "./pages/Trophies";
import NewEntry from "./pages/NewEntry";
import History from "./pages/History";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateProfile from "./pages/CreateProfile";
import AdminDashboard from "./pages/admin/Dashboard";
import PendingRegistrations from "./pages/admin/PendingRegistrations";
import AdminTrophies from "./pages/admin/Trophies";
import AdminParticipants from "./pages/admin/Participants";
import AdminProfile from "./pages/admin/Profile";
import AdminCommunity from './pages/admin/Community';
import AdminRoute from "./components/admin/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle automatic redirections based on user role
const AutoRedirect = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && profile) {
      const currentPath = location.pathname;
      
      // If admin is on user routes, redirect to admin dashboard
      if (profile.role === 'admin' && currentPath.startsWith('/dashboard') && currentPath !== '/admin/dashboard') {
        navigate('/admin/dashboard', { replace: true });
      }
      
      // If user is on admin routes, redirect to user dashboard
      if (profile.role === 'user' && currentPath.startsWith('/admin')) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [profile, loading, navigate, location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AutoRedirect />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/creer-profil" element={<CreateProfile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected User Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trophies" element={<ProtectedRoute><Trophies /></ProtectedRoute>} />
            <Route path="/new-entry" element={<ProtectedRoute><NewEntry /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/profile" element={
              <ProtectedRoute requireStatus="active">
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute requireStatus="active">
                <Community />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/pending" element={<AdminRoute><PendingRegistrations /></AdminRoute>} />
            <Route path="/admin/participants" element={<AdminRoute><AdminParticipants /></AdminRoute>} />
            <Route path="/admin/trophies" element={<AdminRoute><AdminTrophies /></AdminRoute>} />
            <Route path="/admin/community" element={<AdminRoute><AdminCommunity /></AdminRoute>} />
            <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
