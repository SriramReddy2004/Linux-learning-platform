import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { LogOut, User, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const hostName = window.location.hostname;
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
      window.location.replace(
        `http://${hostName}:4000/logout-remove-token`
      );
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      // Optional fallback to clear state in case of backend issue:
      logout();
      navigate('/login');
    }
  };

  const handleAIAssistant = async () => {
    const hostName = window.location.hostname;
    window.open(`http://${hostName}:4000/`).focus();
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Terminal className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold text-white">
              Linux Learning Mentor
            </span>
          </Link>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <User className="w-5 h-5" />
              <span>{user?.username}</span>
            </Link>

            <button
              onClick={handleAIAssistant}
              className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition"
            >
              AI Assistant
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
