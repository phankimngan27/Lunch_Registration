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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Thống kê Đăng ký Cơm</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Xuất Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tháng</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Năm</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Tổng nhân viên</p>
                <p className="text-2xl font-bold">{data.summary.total_employees}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Tổng số ngày</p>
                <p className="text-2xl font-bold">{data.summary.total_registrations}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="text-2xl font-bold">{data.summary.total_amount.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bộ phận</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số ngày</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.details.map((row: any) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.employee_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.department || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.project || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{row.total_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {parseInt(row.total_amount).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Statistics;
