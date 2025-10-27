import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from '../components/ConfirmModal';

const UserManagement = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: 'blue' | 'red' | 'green' | 'orange';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: 'blue',
    onConfirm: () => { }
  });
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    password: '',
    newPassword: '', // Thêm field cho đổi mật khẩu
    department: '',
    project: '',
    role: 'user'
  });

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.employee_code === 'admin' || currentUser?.email === 'admin@madison.dev';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách nhân viên');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Cập nhật thông tin user
        await api.put(`/users/${editingUser.id}`, formData);

        // Nếu có nhập mật khẩu mới, đổi mật khẩu
        if (formData.newPassword && formData.newPassword.trim() !== '') {
          await api.post('/auth/change-password', {
            userId: editingUser.id,
            newPassword: formData.newPassword
          });
          toast.success('Cập nhật thông tin và đổi mật khẩu thành công!');
        } else {
          toast.success('Cập nhật thông tin thành công!');
        }
      } else {
        await api.post('/users', formData);
        toast.success('Thêm nhân viên thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      employee_code: user.employee_code,
      full_name: user.full_name,
      email: user.email,
      password: '',
      newPassword: '', // Reset field đổi mật khẩu
      department: user.department || '',
      project: user.project || '',
      role: user.role
    });
    setShowModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      confirmColor: 'blue',
      onConfirm: () => { }
    });
  };

  const handleToggleStatus = (user: any) => {
    const action = user.is_active ? 'vô hiệu hóa' : 'kích hoạt';
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);

    setConfirmModal({
      isOpen: true,
      title: `${actionCapitalized} tài khoản`,
      message: `Bạn có chắc muốn ${action} tài khoản "${user.full_name}" (${user.employee_code})?`,
      confirmText: actionCapitalized,
      confirmColor: user.is_active ? 'orange' : 'green',
      onConfirm: async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
          await api.patch(`/users/${user.id}/toggle-status`);
          closeConfirmModal();
          await fetchUsers();
          toast.success(`${actionCapitalized} tài khoản thành công!`);
        } catch (error: any) {
          toast.error(error.response?.data?.message || `Lỗi ${action} tài khoản`);
          closeConfirmModal();
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      employee_code: '',
      full_name: '',
      email: '',
      password: '',
      newPassword: '',
      department: '',
      project: '',
      role: 'user'
    });
    setEditingUser(null);
  };

  const canChangePassword = (user: any) => {
    if (isSuperAdmin) return true; // Super admin can change anyone's password
    if (currentUser?.id === user.id) return true; // Can change own password
    if (currentUser?.role === 'admin' && user.role !== 'admin') return true; // Admin can change user passwords
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Nhân viên</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Thêm nhân viên
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bộ phận</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.employee_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.project || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {/* Chỉ super admin hoặc user không phải admin mới được sửa */}
                  {(isSuperAdmin || user.role !== 'admin' || currentUser?.id === user.id) && (
                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800">Sửa</button>
                  )}
                  {/* Không được sửa nếu là admin thường và user là admin khác */}
                  {!isSuperAdmin && user.role === 'admin' && currentUser?.id !== user.id && (
                    <span className="text-gray-400 text-xs">(Không có quyền)</span>
                  )}
                  {/* Toggle Active/Inactive: không được thay đổi super admin, admin thường không được thay đổi admin khác */}
                  {user.employee_code !== 'admin' && user.email !== 'admin@madison.dev' && (isSuperAdmin || user.role !== 'admin') && (
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isProcessing}
                      className={`${user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {user.is_active ? 'Inactive' : 'Active'}
                    </button>
                  )}
                  {(user.employee_code === 'admin' || user.email === 'admin@madison.dev') && (
                    <span className="text-gray-400 text-xs">(Super Admin)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                  ⚠️ Đây là tài khoản Super Admin. Một số thông tin không thể thay đổi.
                </div>
              )}
              <input
                type="text"
                placeholder="Mã nhân viên"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
                required
              />
              <input
                type="text"
                placeholder="Họ tên"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
                required
              />
              {!editingUser && (
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              )}
              {editingUser && canChangePassword(editingUser) && (
                <div>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (để trống nếu không đổi)"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                    minLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">* Để trống nếu không muốn đổi mật khẩu</p>
                </div>
              )}
              <input
                type="text"
                placeholder="Bộ phận"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Dự án"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
              >
                <option value="user">User</option>
                {/* Chỉ super admin mới thấy option Admin */}
                {isSuperAdmin && <option value="admin">Admin</option>}
              </select>
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500">* Bạn chỉ có thể tạo tài khoản User</p>
              )}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingUser ? 'Cập nhật' : 'Thêm'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default UserManagement;
