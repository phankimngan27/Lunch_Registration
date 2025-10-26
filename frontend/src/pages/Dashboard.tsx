import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.employee_code === 'admin' || user?.email === 'admin@madison.dev';

  return (
    <div className="space-y-6">
      {/* Header Banner với thông tin cá nhân */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Chào mừng, {user?.full_name}! 👋</h1>
            <p className="text-blue-100 mb-4 text-sm sm:text-base">Hệ thống đăng ký cơm trưa</p>
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="opacity-80">👤 Mã NV:</span>
                <span className="font-semibold">{user?.employee_code}</span>
              </div>
              <div className="flex items-center gap-2 break-all">
                <span className="opacity-80">📧</span>
                <span className="font-semibold">{user?.email}</span>
              </div>
              {user?.department && (
                <div className="flex items-center gap-2">
                  <span className="opacity-80">🏢</span>
                  <span className="font-semibold">{user.department}</span>
                </div>
              )}
              {user?.project && (
                <div className="flex items-center gap-2">
                  <span className="opacity-80">📁</span>
                  <span className="font-semibold">{user.project}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid chung cho tất cả cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card Đăng ký cơm - hiển thị cho tất cả trừ Super Admin */}
        {!isSuperAdmin && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/registration')}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">🍱</span>
              </div>
              <h3 className="text-lg font-semibold text-orange-900">Đăng ký cơm</h3>
            </div>
            <p className="text-sm text-orange-700 mb-4">Đăng ký suất cơm trưa cho tháng này</p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Đi đến đăng ký →
            </button>
          </div>
        )}

        {/* Cards cho admin */}
        {user?.role === 'admin' && (
          <>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/statistics')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-green-900">Thống kê</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">Xem thống kê và quản lý nhân viên</p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Xem thống kê →
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/daily-registrations')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Danh sách theo ngày</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">Xem chi tiết người đăng ký ăn từng ngày</p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Xem danh sách →
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/users')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-purple-900">Quản lý nhân viên</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">Thêm, sửa, xóa thông tin nhân viên</p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Quản lý →
              </button>
            </div>

            {isSuperAdmin && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-indigo-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/config')}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-900">Cấu hình</h3>
                </div>
                <p className="text-sm text-indigo-700 mb-4">Quản lý thời gian mở và đóng đăng ký cơm trưa</p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Cấu hình →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
