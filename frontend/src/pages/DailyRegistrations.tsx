import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

interface Registration {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  project: string;
  is_vegetarian: boolean;
}

interface Summary {
  total_people: number;
  normal_count: number;
  vegetarian_count: number;
  total_amount: number;
  lunch_price: number;
}

const DailyRegistrations = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [mealType, setMealType] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchRegistrations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users');
      const uniqueDepts = [...new Set(response.data.map((u: any) => u.department).filter(Boolean))];
      setDepartments(uniqueDepts as string[]);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('date', date);
      if (department) params.append('department', department);
      if (mealType) params.append('meal_type', mealType);

      const response = await api.get(`/daily-registrations?${params.toString()}`);
      setRegistrations(response.data.registrations);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Lỗi tải danh sách đăng ký');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRegistrations();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('date', date);
      if (department) params.append('department', department);
      if (mealType) params.append('meal_type', mealType);

      const response = await api.get(`/daily-registrations/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `danh-sach-${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất file thành công!');
    } catch (error) {
      toast.error('Lỗi xuất file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Danh sách đăng ký theo ngày</h1>
          <p className="text-gray-600 mt-1">Xem chi tiết người đăng ký ăn từng ngày</p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg flex items-center gap-2"
        >
          <span>📥</span>
          Xuất Excel
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Chọn ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 Bộ phận</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Tất cả bộ phận</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">🍃 Loại cơm</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="normal">Cơm thường</option>
              <option value="vegetarian">Cơm chay</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-lg"
          >
            🔍 Tìm kiếm
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Tổng số người</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{summary.total_people}</p>
              </div>
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Cơm thường</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{summary.normal_count}</p>
              </div>
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-2xl">
                🍱
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Cơm chay</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{summary.vegetarian_count}</p>
              </div>
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-2xl">
                🥗
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Tổng tiền</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {(summary.total_amount / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Không có dữ liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-orange-500 to-red-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">STT</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Mã NV</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Họ và tên</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Bộ phận</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Dự án</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Loại cơm</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Giá</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((reg, index) => (
                  <tr
                    key={reg.id}
                    className={`hover:${reg.is_vegetarian ? 'bg-green-50' : 'bg-orange-50'} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {reg.employee_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${reg.is_vegetarian ? 'bg-green-500' : 'bg-orange-500'} rounded-full flex items-center justify-center text-white font-bold mr-3`}>
                          {reg.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{reg.full_name}</div>
                          <div className="text-xs text-gray-500">{reg.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {reg.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {reg.project || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.is_vegetarian ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white shadow-md bg-gradient-to-r from-green-500 to-green-600">
                          🥗 Cơm chay
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white shadow-md bg-gradient-to-r from-orange-500 to-orange-600">
                          🍱 Cơm thường
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {summary?.lunch_price.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRegistrations;
