import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Statistics = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [month, year]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/statistics?month=${month}&year=${year}`);
      setData(response.data);
    } catch (error) {
      toast.error('Lỗi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/statistics/export?month=${month}&year=${year}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `thong-ke-${month}-${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất file thành công!');
    } catch (error) {
      toast.error('Lỗi xuất file');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Thống kê Đăng ký Cơm</h1>
        <button
          onClick={handleExport}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap text-sm sm:text-base font-medium"
        >
          📊 Xuất Excel
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tháng</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Năm</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Đang tải...</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Tổng nhân viên</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{data.summary.total_employees}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Tổng bữa ăn</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-700">{data.summary.total_registrations}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Tổng tiền</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-700 break-words">{data.summary.total_amount.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bộ phận</th>
                    <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SDT</th>
                    <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số ngày</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.details.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">{row.employee_code}</td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">{row.full_name}</td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.department || 'N/A'}</td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.phone_number || 'N/A'}</td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">{row.total_days}</td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-green-600">
                        {parseInt(row.total_amount).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {data.details.map((row: any) => (
                <div key={row.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-base">{row.full_name}</div>
                      <div className="text-sm text-gray-600">{row.employee_code}</div>
                      {row.department && (
                        <div className="text-xs text-gray-500 mt-1">Bộ phận: {row.department}</div>
                      )}
                      {row.phone_number && (
                        <div className="text-xs text-gray-500">SDT: {row.phone_number}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <div>
                      <div className="text-xs text-gray-500">Số ngày</div>
                      <div className="text-lg font-bold text-blue-600">{row.total_days}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Thành tiền</div>
                      <div className="text-lg font-bold text-green-600">
                        {parseInt(row.total_amount).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Statistics;
