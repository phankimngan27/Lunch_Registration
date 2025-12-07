import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Calendar, Users, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

interface Registration {
  id: number;
  user_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  project: string;
  is_vegetarian: boolean;
}

const RegistrationConfig = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState({
    monthly_cutoff_day: 23,
    daily_deadline_hour: 17,
    updated_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bulk registration management
  const [selectedDate, setSelectedDate] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // Check if user is super admin
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
    
    // Validate
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

  const fetchRegistrationsByDate = async (date: string) => {
    if (!date) return;
    
    setLoadingRegistrations(true);
    try {
      const response = await api.get(`/registrations/by-date?date=${date}`);
      setRegistrations(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách đăng ký');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      fetchRegistrationsByDate(date);
    } else {
      setRegistrations([]);
    }
  };

  const handleBulkCreate = () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Tạo đăng ký cho TẤT CẢ',
      message: `Bạn có chắc muốn tạo đăng ký cho TẤT CẢ nhân viên active vào ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setBulkActionLoading(true);
        try {
          const response = await api.post('/registrations/bulk-create', { date: selectedDate });
          toast.success(response.data.message);
          fetchRegistrationsByDate(selectedDate);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Lỗi tạo đăng ký hàng loạt');
        } finally {
          setBulkActionLoading(false);
        }
      }
    });
  };

  const handleBulkCancel = () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    if (registrations.length === 0) {
      toast.info('Không có đăng ký nào để hủy');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hủy TẤT CẢ đăng ký',
      message: `Bạn có chắc muốn HỦY TẤT CẢ ${registrations.length} đăng ký vào ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setBulkActionLoading(true);
        try {
          const response = await api.post('/registrations/bulk-cancel', { date: selectedDate });
          toast.success(response.data.message);
          fetchRegistrationsByDate(selectedDate);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Lỗi hủy đăng ký hàng loạt');
        } finally {
          setBulkActionLoading(false);
        }
      }
    });
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Hệ thống</h1>
        <p className="text-gray-600 mt-2">Quản lý thời gian đăng ký và chỉnh sửa đăng ký theo ngày</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Time Configuration */}
        <div className="space-y-6">

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

        {/* Right Column: Bulk Registration Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Chỉnh sửa Đăng ký theo Ngày
            </h2>

            {/* Date Picker */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ngày
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              {selectedDate && (
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkCreate}
                    disabled={bulkActionLoading}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {bulkActionLoading ? 'Đang xử lý...' : 'Tạo cho TẤT CẢ'}
                  </button>
                  <button
                    onClick={handleBulkCancel}
                    disabled={bulkActionLoading || registrations.length === 0}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {bulkActionLoading ? 'Đang xử lý...' : 'Hủy TẤT CẢ'}
                  </button>
                </div>
              )}

              {/* Registration List */}
              {selectedDate && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">
                      Danh sách đã đăng ký ({registrations.length})
                    </h3>
                    <button
                      onClick={() => fetchRegistrationsByDate(selectedDate)}
                      disabled={loadingRegistrations}
                      className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      {loadingRegistrations ? 'Đang tải...' : '🔄 Làm mới'}
                    </button>
                  </div>

                  {loadingRegistrations ? (
                    <div className="text-center py-8 text-gray-500">Đang tải...</div>
                  ) : registrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      Chưa có ai đăng ký
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Mã NV</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Họ tên</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Phòng ban</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Chay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {registrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{reg.employee_code}</td>
                              <td className="px-3 py-2 text-gray-900">{reg.full_name}</td>
                              <td className="px-3 py-2 text-gray-600">{reg.department || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {reg.is_vegetarian ? '🥬' : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Box for Bulk Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Hướng dẫn sử dụng</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>Tạo cho TẤT CẢ:</strong> Tạo đăng ký cho tất cả nhân viên active (bỏ qua nếu đã có)</li>
              <li><strong>Hủy TẤT CẢ:</strong> Xóa tất cả đăng ký trong ngày đã chọn</li>
              <li>Danh sách hiển thị ai đã đăng ký và có ăn chay không</li>
              <li>Thao tác này chỉ áp dụng cho ngày được chọn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default RegistrationConfig;
