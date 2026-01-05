import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Users, Check, X, Search, Calendar, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { convertSolar2Lunar } from '../utils/lunarCalendar';

interface User {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  phone_number: string;
  is_active: boolean;
}

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

const BulkRegistrationEdit = () => {
  const [activeTab, setActiveTab] = useState<'by-date' | 'by-users'>('by-date');

  // Common state
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

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-2">Chỉnh sửa Đăng ký</h1>
          <p className="text-gray-600">
            Quản lý đăng ký hàng loạt theo ngày hoặc theo người
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('by-date')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'by-date'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5 inline-block mr-2" />
            Chỉnh sửa theo Ngày
          </button>
          <button
            onClick={() => setActiveTab('by-users')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'by-users'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            Chỉnh sửa theo Người
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'by-date' ? (
            <ByDateTab confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
          ) : (
            <ByUsersTab confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

// By Date Tab Component
const ByDateTab = ({ setConfirmDialog }: any) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegetarianDay, setIsVegetarianDay] = useState(false);
  const [lunarDateInfo, setLunarDateInfo] = useState('');

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
      // Check if it's a vegetarian day (lunar day 1 or 15)
      const [year, month, day] = date.split('-').map(Number);
      const [lunarDay, lunarMonth, , lunarYear] = convertSolar2Lunar(day, month, year);
      const isVegDay = lunarDay === 1 || lunarDay === 15;
      setIsVegetarianDay(isVegDay);
      setLunarDateInfo(`${lunarDay}/${lunarMonth}/${lunarYear} Âm lịch`);
      
      // Reset vegetarian checkbox if not a vegetarian day
      if (!isVegDay) {
        setIsVegetarian(false);
      }
      
      fetchRegistrationsByDate(date);
    } else {
      setRegistrations([]);
      setIsVegetarianDay(false);
      setLunarDateInfo('');
      setIsVegetarian(false);
    }
  };

  const handleBulkCreate = () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    const mealType = isVegetarian ? 'cơm chay' : 'cơm thường';
    setConfirmDialog({
      isOpen: true,
      title: 'Tạo đăng ký cho TẤT CẢ',
      message: `Bạn có chắc muốn tạo đăng ký ${mealType} cho TẤT CẢ nhân viên active vào ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}?`,
      type: 'info',
      onConfirm: async () => {
        setBulkActionLoading(true);
        try {
          const response = await api.post('/registrations/bulk-create', { 
            date: selectedDate,
            isVegetarian 
          });
          toast.success(response.data.message);
          
          // Refresh the list to show new registrations
          await fetchRegistrationsByDate(selectedDate);
          
          // Reset vegetarian checkbox after successful creation
          setIsVegetarian(false);
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

  return (
    <div className="space-y-6">
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

      {/* Vegetarian Option */}
      <div className="space-y-2">
        {selectedDate && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            📅 Ngày âm lịch: <span className="font-medium">{lunarDateInfo}</span>
            {isVegetarianDay ? (
              <span className="ml-2 text-green-600 font-medium">✓ Ngày chay</span>
            ) : (
              <span className="ml-2 text-orange-600 font-medium">⚠ Không phải ngày chay</span>
            )}
          </div>
        )}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${isVegetarianDay ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-300'}`}>
          <input
            type="checkbox"
            id="vegetarian-bulk"
            checked={isVegetarian}
            onChange={(e) => setIsVegetarian(e.target.checked)}
            disabled={!isVegetarianDay}
            className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label 
            htmlFor="vegetarian-bulk" 
            className={`text-sm font-medium cursor-pointer ${isVegetarianDay ? 'text-gray-700' : 'text-gray-400'}`}
          >
            🥬 Đăng ký cơm chay (áp dụng cho tất cả nhân viên)
          </label>
        </div>
        {!isVegetarianDay && selectedDate && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
            💡 Chỉ có thể đăng ký cơm chay vào ngày Mùng 1 và Rằm (15) âm lịch
          </div>
        )}
      </div>

      {selectedDate && (
        <>
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

          <div>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Hướng dẫn sử dụng</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>Tạo cho TẤT CẢ:</strong> Tạo đăng ký cho tất cả nhân viên active (bỏ qua nếu đã có)</li>
              <li><strong>Hủy TẤT CẢ:</strong> Xóa tất cả đăng ký trong ngày đã chọn</li>
              <li>Danh sách hiển thị ai đã đăng ký và có ăn chay không</li>
              <li>Thao tác này chỉ áp dụng cho ngày được chọn</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

// By Users Tab Component
const ByUsersTab = ({ setConfirmDialog }: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [action, setAction] = useState<'register' | 'cancel'>('register');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [editMode, setEditMode] = useState<'date' | 'month'>('date');

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [dateInputValue, setDateInputValue] = useState('');
  
  // Check if all selected dates are vegetarian days
  const [allDatesAreVegetarian, setAllDatesAreVegetarian] = useState(false);
  const [vegetarianDatesInfo, setVegetarianDatesInfo] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const filteredUsers = response.data.filter(
        (u: User) => u.employee_code !== 'admin' && u.email !== 'admin@madison.dev'
      );
      setUsers(filteredUsers);
    } catch (error) {
      toast.error('Lỗi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      user.employee_code?.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.department?.toLowerCase().includes(search)
    );
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map(u => u.id);
    setSelectedUserIds(allFilteredIds);
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    
    if (selectedDates.includes(dateStr)) {
      toast.info('Ngày này đã được chọn rồi');
    } else {
      setSelectedDates(prev => [...prev, dateStr]);
      setDateInputValue(''); // Reset input after adding
    }
  };

  const removeDateFromList = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  // Check vegetarian days whenever selectedDates changes
  useEffect(() => {
    if (selectedDates.length === 0) {
      setAllDatesAreVegetarian(false);
      setVegetarianDatesInfo('');
      setIsVegetarian(false);
      return;
    }

    const vegDays: string[] = [];
    const nonVegDays: string[] = [];

    selectedDates.forEach(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [lunarDay] = convertSolar2Lunar(day, month, year);
      const isVegDay = lunarDay === 1 || lunarDay === 15;
      
      if (isVegDay) {
        vegDays.push(dateStr);
      } else {
        nonVegDays.push(dateStr);
      }
    });

    const allAreVeg = nonVegDays.length === 0;
    setAllDatesAreVegetarian(allAreVeg);
    
    if (allAreVeg) {
      setVegetarianDatesInfo(`Tất cả ${vegDays.length} ngày đều là ngày chay`);
    } else if (vegDays.length > 0) {
      setVegetarianDatesInfo(`${vegDays.length} ngày chay, ${nonVegDays.length} ngày thường`);
      setIsVegetarian(false); // Reset checkbox if mixed
    } else {
      setVegetarianDatesInfo(`Không có ngày chay nào`);
      setIsVegetarian(false);
    }
  }, [selectedDates]);

  const generateDatesForMonth = () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Vui lòng chọn tháng và năm');
      return;
    }

    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dateStr);
      }
    }
    
    setSelectedDates(dates);
    toast.success(`Đã chọn ${dates.length} ngày trong tháng ${month}/${year}`);
  };

  const handleSubmit = () => {
    if (selectedUserIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên');
      return;
    }

    if (action === 'register' && selectedDates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày');
      return;
    }

    if (action === 'cancel' && editMode === 'month' && (!selectedMonth || !selectedYear)) {
      toast.error('Vui lòng chọn tháng và năm');
      return;
    }

    if (action === 'cancel' && editMode === 'date' && selectedDates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày');
      return;
    }

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    const userNames = selectedUsers.map(u => u.full_name).join(', ');

    let message = '';
    if (action === 'register') {
      const mealType = isVegetarian ? 'cơm chay' : 'cơm thường';
      message = `Bạn có chắc muốn đăng ký ${mealType} cho ${selectedDates.length} ngày, ${selectedUserIds.length} nhân viên?\n\nNhân viên: ${userNames}`;
    } else {
      if (editMode === 'month') {
        message = `Bạn có chắc muốn HỦY TẤT CẢ đăng ký tháng ${selectedMonth}/${selectedYear} cho ${selectedUserIds.length} nhân viên?\n\nNhân viên: ${userNames}`;
      } else {
        message = `Bạn có chắc muốn HỦY ${selectedDates.length} ngày đăng ký cho ${selectedUserIds.length} nhân viên?\n\nNhân viên: ${userNames}`;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: action === 'register' ? 'Xác nhận đăng ký' : 'Xác nhận hủy đăng ký',
      message,
      type: action === 'register' ? 'info' : 'danger',
      onConfirm: executeAction
    });
  };

  const executeAction = async () => {
    setProcessing(true);
    try {
      const payload: any = {
        userIds: selectedUserIds,
        action
      };

      if (action === 'register') {
        payload.dates = selectedDates;
        payload.isVegetarian = isVegetarian;
      } else {
        if (editMode === 'month') {
          payload.month = selectedMonth;
          payload.year = selectedYear;
        } else {
          payload.dates = selectedDates;
        }
      }

      const response = await api.post('/registrations/bulk-edit-by-users', payload);
      
      if (action === 'register') {
        toast.success(response.data.message || 'Đăng ký thành công');
      } else {
        toast.success(response.data.message || 'Hủy đăng ký thành công');
      }

      // Reset form to initial state
      setSelectedDates([]);
      setSelectedUserIds([]);
      setSelectedMonth('');
      setSelectedYear('');
      setIsVegetarian(false);
      setSearchTerm('');
      setDateInputValue('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Users */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Bước 1: Chọn nhân viên</h2>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm theo mã NV, tên, email, phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={selectAllFiltered}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Chọn tất cả ({filteredUsers.length})
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Bỏ chọn tất cả
          </button>
          <div className="ml-auto text-sm text-gray-600 flex items-center">
            Đã chọn: <span className="font-semibold ml-1">{selectedUserIds.length}</span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Không tìm thấy nhân viên</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <label
                  key={user.id}
                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                    selectedUserIds.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-sm text-gray-500">({user.employee_code})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.department} • {user.email}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Action */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Bước 2: Chọn hành động</h2>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="action"
              value="register"
              checked={action === 'register'}
              onChange={(e) => setAction(e.target.value as 'register' | 'cancel')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium">Đăng ký</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="action"
              value="cancel"
              checked={action === 'cancel'}
              onChange={(e) => setAction(e.target.value as 'register' | 'cancel')}
              className="w-4 h-4 text-red-600"
            />
            <span className="font-medium">Hủy đăng ký</span>
          </label>
        </div>

        {/* Vegetarian Option - Only show when action is register */}
        {action === 'register' && (
          <div className="space-y-2">
            {selectedDates.length > 0 && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                📅 {vegetarianDatesInfo}
              </div>
            )}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${allDatesAreVegetarian && selectedDates.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-300'}`}>
              <input
                type="checkbox"
                id="vegetarian-users"
                checked={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.checked)}
                disabled={!allDatesAreVegetarian || selectedDates.length === 0}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label 
                htmlFor="vegetarian-users" 
                className={`text-sm font-medium cursor-pointer ${allDatesAreVegetarian && selectedDates.length > 0 ? 'text-gray-700' : 'text-gray-400'}`}
              >
                🥬 Đăng ký cơm chay (áp dụng cho tất cả người được chọn)
              </label>
            </div>
            {!allDatesAreVegetarian && selectedDates.length > 0 && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                💡 Chỉ có thể đăng ký cơm chay khi TẤT CẢ các ngày đều là Mùng 1 hoặc Rằm (15) âm lịch
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Select Date/Month */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Bước 3: Chọn ngày hoặc tháng</h2>
        
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="editMode"
              value="date"
              checked={editMode === 'date'}
              onChange={(e) => setEditMode(e.target.value as 'date' | 'month')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium">Theo ngày</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="editMode"
              value="month"
              checked={editMode === 'month'}
              onChange={(e) => setEditMode(e.target.value as 'date' | 'month')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium">Theo tháng</span>
          </label>
        </div>

        {editMode === 'date' ? (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ngày (có thể chọn nhiều ngày)
              </label>
              <input
                type="date"
                value={dateInputValue}
                onChange={(e) => {
                  setDateInputValue(e.target.value);
                  handleDateChange(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {selectedDates.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Đã chọn {selectedDates.length} ngày:
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {selectedDates.map(date => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      {date}
                      <button
                        onClick={() => removeDateFromList(date)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn tháng {action === 'cancel' ? 'cần hủy' : ''}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn tháng</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn năm</option>
                {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {action === 'register' && selectedMonth && selectedYear && (
              <div className="mt-2">
                <button
                  onClick={generateDatesForMonth}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Tạo danh sách ngày trong tháng
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSubmit}
          disabled={processing || selectedUserIds.length === 0}
          className={`px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 ${
            action === 'register'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-red-600 hover:bg-red-700'
          } disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {processing ? (
            <>Đang xử lý...</>
          ) : (
            <>
              {action === 'register' ? (
                <>
                  <Check className="w-5 h-5" />
                  Đăng ký
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Hủy đăng ký
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkRegistrationEdit;
