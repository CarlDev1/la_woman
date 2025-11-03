import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Trophy, 
  Menu, 
  LogOut,
  Crown,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AdminMobileNav from '@/components/admin/AdminMobileNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navigation = [
    {
      name: 'Vue d\'ensemble',
      href: '/admin/dashboard',
      icon: BarChart3,
      current: location.pathname === '/admin/dashboard'
    },
    {
      name: 'Inscriptions en attente',
      href: '/admin/pending',
      icon: UserCheck,
      current: location.pathname === '/admin/pending'
    },
    {
      name: 'Participantes',
      href: '/admin/participants',
      icon: Users,
      current: location.pathname === '/admin/participants'
    },
    {
      name: 'Gestion des trophées',
      href: '/admin/trophies',
      icon: Trophy,
      current: location.pathname === '/admin/trophies'
    },
    {
      name: 'Communauté',
      href: '/admin/community',
      icon: MessageSquare,
      current: location.pathname === '/admin/community'
    }
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <Crown className="h-8 w-8 text-pink-500" />
          <span className="text-xl font-bold gradient-text">LA WOMAN</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors
                  ${item.current
                    ? 'bg-pink-50 text-pink-600 border border-pink-200'
                    : 'text-gray-700 hover:bg-pink-25 hover:text-pink-600'
                  }
                `}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    item.current ? 'text-pink-600' : 'text-gray-400 group-hover:text-pink-600'
                  }`}
                />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* User info and logout */}
        <div className="border-t pt-4">
          <div className="px-3 py-2 text-sm text-gray-600">
            <div className="font-medium">{profile?.full_name}</div>
            <div className="text-xs text-gray-500">Administrateur</div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-x-3 text-gray-700 hover:bg-pink-25 hover:text-pink-600"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-25 via-pink-50 to-rose-50">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-72 md:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 shadow-sm">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72">
        <main className="py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminMobileNav />
    </div>
  );
};

export default AdminLayout;
