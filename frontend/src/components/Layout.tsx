import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Madison Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                <img src="/madison-logo.png" alt="Madison Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-bold text-lg">Madison Technologies</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              
              {/* Chỉ hiển thị link đăng ký cơm nếu KHÔNG phải super admin */}
              {user?.employee_code !== 'admin' && user?.email !== 'admin@madison.dev' && (
                <Link 
                  to="/registration" 
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/registration') 
                      ? 'bg-white/20 text-white' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🍱 Đăng ký cơm
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link 
                    to="/statistics" 
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive('/statistics') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    📊 Thống kê
                  </Link>
                  <Link 
                    to="/daily-registrations" 
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive('/daily-registrations') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    📋 Danh sách theo ngày
                  </Link>
                  <Link 
                    to="/users" 
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive('/users') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    👥 Quản lý nhân viên
                  </Link>
                  {/* Chỉ super admin mới thấy menu config */}
                  {(user?.employee_code === 'admin' || user?.email === 'admin@madison.dev') && (
                    <Link 
                      to="/config" 
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive('/config') 
                          ? 'bg-white/20 text-white' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      ⚙️ Cấu hình
                    </Link>
                  )}
                </>
              )}
              <Link 
                to="/dashboard" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-white/20' 
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium">
                  {user?.full_name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                Đăng xuất
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4 space-y-2">
              {/* User Info */}
              <Link 
                to="/dashboard" 
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-white/20' 
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{user?.full_name}</div>
                  <div className="text-blue-100 text-sm">{user?.email}</div>
                </div>
              </Link>

              {/* Navigation Links */}
              {user?.employee_code !== 'admin' && user?.email !== 'admin@madison.dev' && (
                <Link 
                  to="/registration" 
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/registration') 
                      ? 'bg-white/20 text-white' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🍱 Đăng ký cơm
                </Link>
              )}
              
              {user?.role === 'admin' && (
                <>
                  <Link 
                    to="/statistics" 
                    onClick={closeMobileMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive('/statistics') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    📊 Thống kê
                  </Link>
                  <Link 
                    to="/daily-registrations" 
                    onClick={closeMobileMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive('/daily-registrations') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    📋 Danh sách theo ngày
                  </Link>
                  <Link 
                    to="/users" 
                    onClick={closeMobileMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive('/users') 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    👥 Quản lý nhân viên
                  </Link>
                  {(user?.employee_code === 'admin' || user?.email === 'admin@madison.dev') && (
                    <Link 
                      to="/config" 
                      onClick={closeMobileMenu}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive('/config') 
                          ? 'bg-white/20 text-white' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      ⚙️ Cấu hình
                    </Link>
                  )}
                </>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full text-left px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
