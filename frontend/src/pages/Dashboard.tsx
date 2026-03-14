import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMonthlyRegistrationReminder } from '../hooks/useMonthlyRegistrationReminder';
import axios from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);

  const isSuperAdmin = user?.employee_code === 'admin' || user?.email === 'admin@madison.dev';

  // Sử dụng hook notification
  useMonthlyRegistrationReminder();

  // Kiểm tra xem user đã đăng ký tháng sau chưa (cho banner)
  useEffect(() => {
    if (!user || user.role === 'admin' || isSuperAdmin) {
      return;
    }

    const checkMonthlyRegistration = async () => {
      try {
        // Lấy cấu hình registration
        const configResponse = await axios.get('/api/config');
        const monthlyCutoffDay = configResponse.data.monthly_cutoff_day || 25;

        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // Chỉ hiển thị banner trong khoảng thời gian được phép đăng ký
        if (dayOfMonth < monthlyCutoffDay) {
          return; // Chưa đến thời gian đăng ký
        }

        // Tính tháng cần kiểm tra (tháng sau)
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();
        
        let targetMonth = currentMonth + 2; // +1 để chuyển sang 1-12, +1 để lấy tháng sau
        let targetYear = currentYear;
        
        if (targetMonth > 12) {
          targetMonth = 1;
          targetYear++;
        }
        
        const response = await axios.get('/api/registrations/my-registrations', {
          params: {
            month: targetMonth,
            year: targetYear
          }
        });

        const registrations = response.data;
        
        if (!registrations || registrations.length === 0) {
          setShowReminderBanner(true);
          setTargetMonth(targetMonth);
        }
      } catch (error) {
        // Không hiển thị banner nếu có lỗi
      }
    };

    checkMonthlyRegistration();
  }, [user, isSuperAdmin]);

  return (
    <div className="space-y-6">
      {/* Banner nhắc nhở đăng ký cơm đầu tháng */}
      {showReminderBanner && !isSuperAdmin && (
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-4 sm:p-6 text-white shadow-2xl border-2 border-orange-300 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🍚</span>
                <h2 className="text-xl sm:text-2xl font-bold">Nhắc nhở đăng ký cơm!</h2>
              </div>
              <p className="text-white/90 mb-4 text-sm sm:text-base">
                Bạn chưa đăng ký cơm tháng {targetMonth}. Đăng ký ngay để không bỏ lỡ bữa trưa nhé! 😊
              </p>
              <button 
                onClick={() => navigate('/registration')}
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Đăng ký ngay →
              </button>
            </div>
            <button 
              onClick={() => setShowReminderBanner(false)}
              className="text-white/80 hover:text-white text-2xl font-bold leading-none"
              title="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
        {/* Card Đăng ký cơm - chỉ hiển thị cho user thường và admin (không phải Super Admin) */}
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

            {isSuperAdmin && (
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
            )}

            <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => navigate('/bulk-registration-edit')}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <span className="text-2xl">✏️</span>
                </div>
                <h3 className="text-lg font-semibold text-purple-900">Chỉnh sửa đăng ký</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">Chỉnh sửa đăng ký hàng loạt theo tháng</p>
              <button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                Chỉnh sửa →
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
