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
              {user?.phone_number && (
                <div className="flex items-center gap-2">
                  <span className="opacity-80">📞</span>
                  <span className="font-semibold">{user.phone_number}</span>
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
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 sm:p-6 rounded-xl shadow-lg border border-orange-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/registration')}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <span className="text-2xl">🍱</span>
              </div>
              <h3 className="text-lg font-semibold text-orange-900">Đăng ký cơm</h3>
            </div>
            <p className="text-sm text-orange-700 mb-4">Đăng ký suất cơm trưa cho tháng này</p>
            <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
              Đi đến đăng ký →
            </button>
          </div>
        )}

        {/* Cards cho admin */}
        {user?.role === 'admin' && (
          <>
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 rounded-xl shadow-lg border border-emerald-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/statistics')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">Thống kê</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-4">Xem thống kê và quản lý nhân viên</p>
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                Xem thống kê →
              </button>
            </div>

            <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-sky-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/daily-registrations')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-sky-900">Danh sách theo ngày</h3>
              </div>
              <p className="text-sm text-sky-700 mb-4">Xem chi tiết người đăng ký ăn từng ngày</p>
              <button className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                Xem danh sách →
              </button>
            </div>

            <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-6 rounded-xl shadow-lg border border-pink-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/users')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-pink-900">Quản lý nhân viên</h3>
              </div>
              <p className="text-sm text-pink-700 mb-4">Thêm, sửa, xóa thông tin nhân viên</p>
              <button className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
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
