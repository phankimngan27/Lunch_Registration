import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from '../components/ConfirmModal';

const UserManagement = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      user.employee_code?.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Quản lý Nhân viên</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-sm sm:text-base"
        >
          + Thêm nhân viên
        </button>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Tìm thấy {filteredUsers.length} kết quả
          </p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bộ phận</th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">
                    {searchTerm ? 'Không tìm thấy nhân viên nào phù hợp' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">{user.employee_code}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">{user.full_name}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm">{user.department || 'N/A'}</td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm">{user.project || 'N/A'}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {(isSuperAdmin || user.role !== 'admin' || currentUser?.id === user.id) && (
                          <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 font-medium">
                            Sửa
                          </button>
                        )}
                        {!isSuperAdmin && user.role === 'admin' && currentUser?.id !== user.id && (
                          <span className="text-gray-400 text-xs">(Không có quyền)</span>
                        )}
                        {user.employee_code !== 'admin' && user.email !== 'admin@madison.dev' && (isSuperAdmin || user.role !== 'admin') && (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isProcessing}
                            className={`font-medium ${user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {user.is_active ? 'Inactive' : 'Active'}
                          </button>
                        )}
                        {(user.employee_code === 'admin' || user.email === 'admin@madison.dev') && (
                          <span className="text-gray-400 text-xs">(Super Admin)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
            {searchTerm ? 'Không tìm thấy nhân viên nào phù hợp' : 'Chưa có nhân viên nào'}
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-base">{user.full_name}</div>
                  <div className="text-sm text-gray-600">{user.employee_code}</div>
                  <div className="text-xs text-gray-500 mt-1 break-all">{user.email}</div>
                </div>
                <div className="flex flex-col gap-1 items-end ml-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {(user.department || user.project) && (
                <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
                  {user.department && <div>Bộ phận: {user.department}</div>}
                  {user.project && <div>Dự án: {user.project}</div>}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {(isSuperAdmin || user.role !== 'admin' || currentUser?.id === user.id) && (
                  <button 
                    onClick={() => handleEdit(user)} 
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Sửa
                  </button>
                )}
                {user.employee_code !== 'admin' && user.email !== 'admin@madison.dev' && (isSuperAdmin || user.role !== 'admin') && (
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={isProcessing}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      user.is_active 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.is_active ? 'Inactive' : 'Active'}
                  </button>
                )}
                {(user.employee_code === 'admin' || user.email === 'admin@madison.dev') && (
                  <div className="flex-1 text-center text-xs text-gray-400 py-2">Super Admin</div>
                )}
                {!isSuperAdmin && user.role === 'admin' && currentUser?.id !== user.id && (
                  <div className="flex-1 text-center text-xs text-gray-400 py-2">Không có quyền</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
                required
              />
              <input
                type="text"
                placeholder="Họ tên"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
                required
              />
              {!editingUser && (
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Dự án"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={editingUser && (editingUser.employee_code === 'admin' || editingUser.email === 'admin@madison.dev')}
              >
                <option value="user">User</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
              </select>
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500">* Bạn chỉ có thể tạo tài khoản User</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base">
                  {editingUser ? 'Cập nhật' : 'Thêm'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm sm:text-base">
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
