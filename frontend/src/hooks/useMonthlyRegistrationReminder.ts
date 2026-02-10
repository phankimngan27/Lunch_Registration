import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from '../api/axios';

/**
 * Hook để kiểm tra và hiển thị notification nhắc nhở đăng ký cơm
 * Logic: User được đăng ký từ ngày 25 đến cuối tháng cho tháng sau
 * 
 * Chỉ hoạt động khi:
 * - User đang mở website
 * - Trong khoảng thời gian được phép đăng ký (từ ngày cutoff đến cuối tháng)
 * - User chưa đăng ký cho tháng tiếp theo
 * - Browser hỗ trợ và user cho phép notification
 */
export const useMonthlyRegistrationReminder = () => {
  const { user } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Chỉ chạy cho user thường (không phải admin hoặc super admin)
    if (!user || user.role === 'admin' || hasChecked) {
      return;
    }

    // Kiểm tra browser có hỗ trợ notification không
    if (!('Notification' in window)) {
      return;
    }

    const checkAndNotify = async () => {
      try {
        // Lấy cấu hình registration
        const configResponse = await axios.get('/api/config');
        const monthlyCutoffDay = configResponse.data.monthly_cutoff_day || 25;

        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // Kiểm tra xem có trong khoảng thời gian được phép đăng ký không
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
        
        // Kiểm tra user đã đăng ký cho tháng sau chưa
        const response = await axios.get('/api/registrations/my-registrations', {
          params: {
            month: targetMonth,
            year: targetYear
          }
        });

        const registrations = response.data;

        // Nếu đã có đăng ký cho tháng sau, không cần nhắc
        if (registrations && registrations.length > 0) {
          setHasChecked(true);
          return;
        }

        // User chưa đăng ký, yêu cầu permission và hiển thị notification
        if (Notification.permission === 'granted') {
          showNotification(targetMonth);
        } else if (Notification.permission !== 'denied') {
          // Yêu cầu permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            showNotification(targetMonth);
          }
        }

        setHasChecked(true);
      } catch (error) {
        // Silent fail - không cần thông báo lỗi cho user
        // Chỉ đánh dấu đã check để không retry
        setHasChecked(true);
      }
    };

    const showNotification = (targetMonth: number) => {
      const notification = new Notification('🍚 Nhắc nhở đăng ký cơm', {
        body: `Bạn chưa đăng ký cơm tháng ${targetMonth}. Đăng ký ngay để không bỏ lỡ bữa trưa!`,
        icon: '/madison-icon.png',
        badge: '/madison-icon.png',
        tag: 'monthly-registration-reminder',
        requireInteraction: false,
        silent: false
      });

      // Khi click vào notification, chuyển đến trang đăng ký
      notification.onclick = () => {
        window.focus();
        window.location.href = '/registration';
        notification.close();
      };

      // Tự động đóng sau 10 giây
      setTimeout(() => {
        notification.close();
      }, 10000);
    };

    // Delay 2 giây sau khi load trang để không làm gián đoạn UX
    const timer = setTimeout(() => {
      checkAndNotify();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, hasChecked]);
};
