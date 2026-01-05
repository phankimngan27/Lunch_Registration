import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Calendar } from 'lucide-react';

const RegistrationConfig = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState({
    monthly_cutoff_day: 23,
    daily_deadline_hour: 17,
    updated_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.employee_code === 'admin' || user?.email === 'admin@madison.dev';

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }
    fetchConfig();
  }, [isSuperAdmin]);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config');
      setConfig(response.data);
    } catch (error) {
      toast.error('Lỗi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const day = parseInt(config.monthly_cutoff_day.toString());
    const hour = parseInt(config.daily_deadline_hour.toString());

    if (isNaN(day) || day < 1 || day > 28) {
      toast.error('Ngày mở đăng ký phải từ 1 đến 28');
      return;
    }

    if (isNaN(hour) || hour < 0 || hour > 23) {
      toast.error('Giờ đóng đăng ký phải từ 0 đến 23');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/config', {
        monthly_cutoff_day: day,
        daily_deadline_hour: hour
      });
      setConfig(response.data.config);
      toast.success('Cập nhật cấu hình thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Không có quyền truy cập</h2>
        <p className="text-gray-600 mt-2">Chỉ Super Admin mới có thể truy cập trang này</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Hệ thống</h1>
        <p className="text-gray-600 mt-2">Quản lý thời gian đăng ký</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cấu hình Thời gian
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monthly Cutoff Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày mở đăng ký tháng sau
            </label>
            <input
              type="number"
              min="1"
              max="28"
              value={config.monthly_cutoff_day}
              onChange={(e) => setConfig({...config, monthly_cutoff_day: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              📅 Từ ngày này trong tháng, nhân viên có thể đăng ký cho tháng tiếp theo (1-28)
            </p>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ví dụ:</strong> Nếu đặt là <strong>23</strong>, từ ngày 23 tháng này, nhân viên có thể đăng ký cho tháng sau.
              </p>
            </div>
          </div>

          {/* Daily Deadline Hour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ đóng đăng ký hàng ngày
            </label>
            <select
              value={config.daily_deadline_hour}
              onChange={(e) => setConfig({...config, daily_deadline_hour: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              ⏰ Sau giờ này mỗi ngày, nhân viên không thể đăng ký nữa
            </p>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ví dụ:</strong> Nếu đặt là <strong>17:00</strong>, sau 17:00 mỗi ngày, nút đăng ký sẽ bị khóa.
              </p>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-700 mb-2">Cấu hình hiện tại:</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày mở đăng ký:</span>
                <span className="font-semibold">Ngày {config.monthly_cutoff_day} hàng tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Giờ đóng đăng ký:</span>
                <span className="font-semibold">{config.daily_deadline_hour}:00 hàng ngày</span>
              </div>
              {config.updated_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cập nhật lần cuối:</span>
                  <span className="text-gray-500">
                    {new Date(config.updated_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
            <button
              type="button"
              onClick={fetchConfig}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Làm mới
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Thay đổi cấu hình sẽ áp dụng ngay lập tức cho tất cả nhân viên</li>
          <li>Ngày mở đăng ký nên đặt trước ngày 1 của tháng sau để nhân viên có thời gian đăng ký</li>
          <li>Giờ đóng đăng ký nên đặt trước giờ làm việc kết thúc để có thời gian xử lý</li>
          <li>Chỉ Super Admin mới có quyền thay đổi cấu hình này</li>
        </ul>
      </div>
    </div>
  );
};

export default RegistrationConfig;
