import { BarChart3, UserCheck, Users, Trophy, User, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const AdminMobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      label: 'Vue d\'ensemble',
      icon: BarChart3,
      path: '/admin/dashboard'
    },
    {
      label: 'Inscriptions',
      icon: UserCheck,
      path: '/admin/pending'
    },
    {
      label: '', // Pas de label pour le bouton central
      icon: Users,
      path: '/admin/participants',
      isCenter: true
    },
    {
      label: 'Trophées',
      icon: Trophy,
      path: '/admin/trophies'
    },
    {
      label: 'Profil',
      icon: User,
      path: '/admin/profile'
    },
    {
      label: 'Communauté',
      icon: MessageSquare,
      path: '/community',
      external: true
    }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-end justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.isCenter) {
            return (
              <Link
                key={index}
                to={item.path}
                className="flex items-center justify-center w-14 h-14 -mt-8 bg-pink-500 rounded-full shadow-lg transition-all duration-200 hover:bg-pink-600 active:scale-95"
              >
                <Icon className="w-7 h-7 text-white" />
              </Link>
            );
          }
          
          return (
            <Link
              key={index}
              to={item.path}
              target={item.external ? '_blank' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-pink-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminMobileNav;
