import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { EmployeeRegistration } from '../components/EmployeeRegistration';
import { useAuthStore } from '../store/authStore';

const Registration = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Chặn super admin truy cập trang đăng ký
    if (user?.employee_code === 'admin' || user?.email === 'admin@madison.dev') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Nếu là super admin, không render gì cả (sẽ redirect)
  if (user?.employee_code === 'admin' || user?.email === 'admin@madison.dev') {
    return null;
  }

  try {
    return <EmployeeRegistration />;
  } catch (error) {
    console.error('Error rendering EmployeeRegistration:', error);
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Đăng ký Cơm Trưa</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Có lỗi xảy ra khi tải trang. Vui lòng kiểm tra console.</p>
          <p className="text-sm text-gray-600 mt-2">Error: {String(error)}</p>
        </div>
      </div>
    );
  }
};

export default Registration;
