import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { logout } from '@/services/auth';

export function Header() {
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Sistema de Checklist</h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
} 