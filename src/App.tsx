import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Admin from "./pages/Admin";
import AdminParticipants from "./pages/AdminParticipants";
import AdminTrophies from "./pages/AdminTrophies";
import Community from "./pages/Community";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import NewEntry from "./pages/NewEntry";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Trophies from "./pages/Trophies";
import AdminDashboard from "./pages/admin/Dashboard";
import PendingRegistrations from "./pages/admin/PendingRegistrations";

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
      if (
        profile.role === "admin" &&
        currentPath.startsWith("/dashboard") &&
        currentPath !== "/admin/dashboard"
      ) {
        navigate("/admin/dashboard", { replace: true });
      }

      // If user is on admin routes, redirect to user dashboard
      if (profile.role === "user" && currentPath.startsWith("/admin")) {
        navigate("/dashboard", { replace: true });
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
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* User Routes - Accessible sans connexion */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/trophies" element={<Trophies />} />
            <Route path="/new-entry" element={<NewEntry />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes - Accessible sans connexion */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/participants" element={<AdminParticipants />} />
            <Route path="/admin/trophies" element={<AdminTrophies />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/pending" element={<PendingRegistrations />} />
            <Route path="/admin/community" element={<Community />} />



            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
