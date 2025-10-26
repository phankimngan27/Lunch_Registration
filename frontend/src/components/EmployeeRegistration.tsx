import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CalendarIcon, Save, Edit, Leaf } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { CustomLunarCalendar } from "./CustomLunarCalendar";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";

const PRICE_PER_DAY = 20000;

export function EmployeeRegistration() {
  const { user } = useAuthStore();
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // State cho config
  const [config, setConfig] = useState({
    monthly_cutoff_day: 23,
    daily_deadline_hour: 17
  });

  const getInitialMonth = () => {
    // Luôn hiện tháng hiện tại khi vào trang
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  // Kiểm tra xem có thể đăng ký/chỉnh sửa không (dựa vào config)
  const canRegister = () => {
    const currentHour = today.getHours();
    return currentHour < config.daily_deadline_hour;
  };

  // Kiểm tra xem tháng đang xem có phải là tháng có thể đăng ký không
  const canRegisterForMonth = (month: Date) => {
    const monthValue = month.getMonth();
    const yearValue = month.getFullYear();

    if (currentDay >= config.monthly_cutoff_day) {
      // Từ ngày cutoff trở đi, chỉ có thể đăng ký cho tháng sau
      const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth + 1 > 11 ? currentYear + 1 : currentYear;
      return monthValue === nextMonth && yearValue === nextYear;
    } else {
      // Trước ngày cutoff, chỉ có thể đăng ký cho tháng hiện tại
      return monthValue === currentMonth && yearValue === currentYear;
    }
  };

  const [selectedMonth, setSelectedMonth] = useState<Date>(getInitialMonth());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [vegetarianDates, setVegetarianDates] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegistrationOpen = canRegisterForMonth(selectedMonth) && canRegister();

  // Load tất cả registrations và check hasSubmitted cho tháng hiện tại
  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/registrations/my');

      if (response.data && response.data.length > 0) {
        const allDates: Date[] = [];
        const vegDates = new Set<string>();

        response.data.forEach((r: any) => {
          // Backend giờ trả về date string "YYYY-MM-DD" (không có timezone)
          // Parse đúng cách để tránh lệch timezone
          const dateStr = r.registration_date; // "2025-11-04"
          const [y, m, d] = dateStr.split('-').map(Number);
          const date = new Date(y, m - 1, d); // month is 0-indexed

          // Filter bỏ ngày cuối tuần (phòng trường hợp data cũ)
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          if (isWeekend) {
            return;
          }

          allDates.push(date);

          // Lưu thông tin ăn chay
          if (r.is_vegetarian) {
            vegDates.add(date.toISOString().split('T')[0]);
          }
        });
        setSelectedDates(allDates);
        setVegetarianDates(vegDates);

        // Check xem có ngày nào của tháng đang xem không
        const month = selectedMonth.getMonth();
        const year = selectedMonth.getFullYear();
        const hasCurrentMonthDates = allDates.some((d: Date) =>
          d.getMonth() === month && d.getFullYear() === year
        );
        setHasSubmitted(hasCurrentMonthDates);
      } else {
        setSelectedDates([]);
        setVegetarianDates(new Set());
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error('Lỗi tải đăng ký:', error);
    }
  };

  // Fetch config khi component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Lỗi tải cấu hình:', error);
        // Giữ giá trị mặc định nếu lỗi
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedMonth]);

  // Chỉ tính các ngày thuộc tháng đang xem
  const datesInCurrentMonth = selectedDates.filter(d =>
    d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear()
  );
  const totalDays = datesInCurrentMonth.length;
  const totalAmount = totalDays * PRICE_PER_DAY;

  // Chỉ đếm vegetarian dates của tháng hiện tại
  const vegetarianCount = Array.from(vegetarianDates).filter(dateKey => {
    const date = new Date(dateKey);
    return date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear();
  }).length;

  const handleDateToggle = (date: Date) => {
    if (!isEditing) return;

    // Chỉ cho phép toggle ngày của tháng đang xem
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    if (date.getMonth() !== month || date.getFullYear() !== year) {
      return; // Không cho phép toggle ngày của tháng khác
    }

    // KHÔNG cho phép toggle ngày cuối tuần (Chủ nhật = 0, Thứ 7 = 6)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    }

    const dateString = date.toDateString();
    const isSelected = selectedDates.some((d) => d.toDateString() === dateString);

    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => d.toDateString() !== dateString));
      const dateKey = date.toISOString().split('T')[0];
      if (vegetarianDates.has(dateKey)) {
        const newVegDates = new Set(vegetarianDates);
        newVegDates.delete(dateKey);
        setVegetarianDates(newVegDates);
      }
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleVegetarianToggle = (date: Date) => {
    if (!isEditing) return;
    const dateKey = date.toISOString().split('T')[0];
    const newVegDates = new Set(vegetarianDates);
    if (newVegDates.has(dateKey)) {
      newVegDates.delete(dateKey);
    } else {
      newVegDates.add(dateKey);
    }
    setVegetarianDates(newVegDates);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      // Chỉ gửi các ngày thuộc tháng đang xem
      const datesInCurrentMonth = selectedDates.filter(d => {
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });

      // Format dates đúng cách để tránh lệch timezone
      const dates = datesInCurrentMonth.map(d => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      });

      // Tạo object chứa thông tin vegetarian cho từng ngày
      const vegetarianInfo: { [key: string]: boolean } = {};
      dates.forEach(dateStr => {
        vegetarianInfo[dateStr] = vegetarianDates.has(dateStr);
      });

      // Gửi thêm month, year và vegetarianDates để backend biết tháng nào cần xử lý

      if (dates.length === 0) {
        setHasSubmitted(false);
        toast.success('Đã hủy tất cả đăng ký cơm trưa của tháng này!');
      } else {
        setHasSubmitted(true);
        toast.success('Đăng ký cơm trưa thành công!');
      }

      setIsEditing(false);
      // Refresh data sau khi lưu
      await fetchRegistrations();
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Khi vào chế độ edit, chỉ giữ lại các ngày thuộc tháng đang xem
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    const datesInCurrentMonth = selectedDates.filter(d =>
      d.getMonth() === month && d.getFullYear() === year
    );
    setSelectedDates(datesInCurrentMonth);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchRegistrations();
  };

  const handleSelectAll = () => {
    if (!isEditing) return;

    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const allDates: Date[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const dayOfWeek = date.getDay();
      // Chỉ chọn các ngày không phải cuối tuần (0 = CN, 6 = T7)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        allDates.push(date);
      }
    }

    setSelectedDates(allDates);
    toast.success(`Đã chọn ${allDates.length} ngày trong tháng`);
  };

  const handleDeselectAll = () => {
    if (!isEditing) return;
    setSelectedDates([]);
    setVegetarianDates(new Set());
    toast.info('Đã bỏ chọn tất cả');
  };

  const handleMonthChange = (newMonth: Date) => {
    // Cho phép xem bất kỳ tháng nào
    setSelectedMonth(newMonth);

    // Reset editing state khi chuyển tháng
    if (isEditing) {
      setIsEditing(false);
    }

    // Không clear selectedDates ở đây nữa, để useEffect xử lý
  };

  const registrationMonthText = selectedMonth.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Đăng ký cơm trưa</h1>
        <p className="text-sm sm:text-base text-gray-500">Đăng ký cơm trưa cho tháng {registrationMonthText}</p>
      </div>

      {!canRegister() && canRegisterForMonth(selectedMonth) && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="flex items-start gap-2">
            <span>🕐</span>
            <div>
              <p className="font-medium mb-1">Đã hết thời gian đăng ký cho ngày mai</p>
              <p className="text-sm">
                Thời gian đăng ký, chỉnh sửa cơm cho ngày mai chỉ được phép trước <strong>{config.daily_deadline_hour}:00 hôm nay</strong>.
                Hiện tại đã quá giờ quy định.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!canRegisterForMonth(selectedMonth) && (selectedMonth.getFullYear() > currentYear || (selectedMonth.getFullYear() === currentYear && selectedMonth.getMonth() > currentMonth)) && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="flex items-start gap-2">
            <span>⏰</span>
            <div>
              <p className="font-medium mb-1">Chưa đến thời gian đăng ký cho tháng này</p>
              <p className="text-sm">
                Bạn đang xem tháng <strong>{selectedMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</strong>.
                {currentDay >= config.monthly_cutoff_day ? (
                  <>
                    {' '}Hiện tại bạn chỉ có thể đăng ký cho tháng <strong>{new Date(currentYear, currentMonth + 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</strong>.
                  </>
                ) : (
                  <>
                    {' '}Thời gian đăng ký cho tháng tiếp theo sẽ mở từ ngày <strong>{config.monthly_cutoff_day} tháng {currentMonth + 1}</strong>.
                  </>
                )}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasSubmitted && !isEditing && isRegistrationOpen && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="flex items-start gap-2">
            <span>📝</span>
            <div>
              <p className="font-medium mb-1">Bạn chưa có đăng ký cơm trưa</p>
              <p className="text-sm">
                Vui lòng nhấn "Bắt đầu đăng ký" bên dưới để đăng ký cơm cho tháng {registrationMonthText}.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasSubmitted && !isEditing && (
        <Alert>
          <AlertDescription>
            ✅ Bạn đã đăng ký thành công cho tháng {registrationMonthText}.
            {canRegisterForMonth(selectedMonth) && canRegister() && ' Nhấn "Chỉnh sửa đăng ký" để thay đổi.'}
            {canRegisterForMonth(selectedMonth) && !canRegister() && ' (Đã hết thời gian chỉnh sửa cho ngày mai - sau 17:00)'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chọn ngày đăng ký</CardTitle>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Chọn tất cả
                    </Button>
                    <Button
                      onClick={handleDeselectAll}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CustomLunarCalendar
                selectedDates={selectedDates}
                vegetarianDates={vegetarianDates}
                onDateToggle={handleDateToggle}
                onVegetarianToggle={handleVegetarianToggle}
                month={selectedMonth}
                onMonthChange={handleMonthChange}
                disabled={!isEditing}
                allowMonthNavigation={true}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đăng ký</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">Nhân viên</Label>
                <p>{user?.full_name} ({user?.employee_code})</p>
              </div>
              <div>
                <Label className="text-gray-500">Bộ phận</Label>
                <p>{user?.department || 'N/A'} - {user?.project || 'N/A'}</p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Số ngày đăng ký:</span>
                  <span>{totalDays} ngày</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Trong đó ăn chay:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    {vegetarianCount} ngày
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Đơn giá:</span>
                  <span>{PRICE_PER_DAY.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Tổng cộng:</span>
                  <span className="text-orange-600">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Các ngày đã chọn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {datesInCurrentMonth.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa chọn ngày nào</p>
                ) : (
                  datesInCurrentMonth
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => {
                      const dateKey = date.toISOString().split('T')[0];
                      const isVegetarian = vegetarianDates.has(dateKey);
                      return (
                        <div
                          key={date.toISOString()}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm flex items-center gap-2">
                            {date.toLocaleDateString("vi-VN", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                            {isVegetarian && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Leaf className="w-3 h-3 mr-1" />
                                Chay
                              </Badge>
                            )}
                          </span>
                          <Badge variant="secondary">
                            {PRICE_PER_DAY.toLocaleString("vi-VN")} đ
                          </Badge>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Đang lưu...' : (selectedDates.length === 0 ? 'Hủy tất cả đăng ký' : 'Lưu đăng ký')}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="w-full" disabled={loading}>
                  Hủy
                </Button>
              </>
            ) : hasSubmitted ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="w-full"
                disabled={!isRegistrationOpen}
              >
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa đăng ký
              </Button>
            ) : (
              <Button
                onClick={handleEdit}
                className="w-full"
                disabled={!isRegistrationOpen}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Bắt đầu đăng ký
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
