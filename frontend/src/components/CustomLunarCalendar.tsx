import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { Button } from "./ui/button";
import { convertSolar2Lunar } from "../utils/lunarCalendar";

interface CustomLunarCalendarProps {
  selectedDates: Date[];
  vegetarianDates: Set<string>;
  onDateToggle: (date: Date) => void;
  onVegetarianToggle: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  disabled?: boolean;
  allowMonthNavigation?: boolean;
}

export function CustomLunarCalendar({
  selectedDates,
  vegetarianDates,
  onDateToggle,
  onVegetarianToggle,
  month,
  onMonthChange,
  disabled = false,
  allowMonthNavigation = true,
}: CustomLunarCalendarProps) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  // Tính các ngày của tháng trước cần hiển thị
  const prevMonth = new Date(month.getFullYear(), month.getMonth(), 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  const days: Array<{ day: number; month: 'prev' | 'current' | 'next' }> = [];
  
  // Thêm các ngày cuối tháng trước
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, month: 'prev' });
  }
  
  // Thêm các ngày của tháng hiện tại
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month: 'current' });
  }
  
  // Thêm các ngày đầu tháng sau để đủ 42 ô (6 hàng x 7 cột)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, month: 'next' });
  }

  const getDateFromDayInfo = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    let date: Date;
    if (dayInfo.month === 'prev') {
      date = new Date(month.getFullYear(), month.getMonth() - 1, dayInfo.day);
    } else if (dayInfo.month === 'next') {
      date = new Date(month.getFullYear(), month.getMonth() + 1, dayInfo.day);
    } else {
      date = new Date(month.getFullYear(), month.getMonth(), dayInfo.day);
    }
    // Set time to 00:00:00 để đảm bảo so sánh chính xác
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const isWeekend = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    const date = getDateFromDayInfo(dayInfo);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isSelected = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    const date = getDateFromDayInfo(dayInfo);
    return selectedDates.some(d => {
      // So sánh theo năm, tháng, ngày thay vì dùng toDateString()
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
  };

  const isVegetarian = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    const date = getDateFromDayInfo(dayInfo);
    // Dùng local date string thay vì ISO để tránh lệch timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return vegetarianDates.has(dateKey);
  };

  const getLunarDate = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    try {
      const date = getDateFromDayInfo(dayInfo);
      const lunar = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), 7);
      return {
        day: lunar[0],
        month: lunar[1],
        isLeapMonth: lunar[2] === 1
      };
    } catch (error) {
      return { day: 0, month: 0, isLeapMonth: false };
    }
  };

  const isVegetarianDay = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    const lunar = getLunarDate(dayInfo);
    return lunar.day === 1 || lunar.day === 15;
  };

  const handlePrevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const isPastDate = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    const date = getDateFromDayInfo(dayInfo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDayClick = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }) => {
    // Chỉ cho phép click vào ngày của tháng hiện tại và không phải cuối tuần
    if (disabled || dayInfo.month !== 'current') return;
    
    const date = getDateFromDayInfo(dayInfo);
    const dayOfWeek = date.getDay();
    
    // KHÔNG cho phép chọn Chủ nhật (0) và Thứ 7 (6)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return;
    }
    
    // KHÔNG cho phép chọn ngày quá khứ
    if (isPastDate(dayInfo)) {
      return;
    }
    
    onDateToggle(date);
  };

  const handleVegetarianClick = (dayInfo: { day: number; month: 'prev' | 'current' | 'next' }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || dayInfo.month !== 'current' || !isSelected(dayInfo)) return;
    
    // KHÔNG cho phép toggle vegetarian cho ngày quá khứ
    if (isPastDate(dayInfo)) {
      return;
    }
    
    const date = getDateFromDayInfo(dayInfo);
    onVegetarianToggle(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          disabled={!allowMonthNavigation}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          Tháng {month.getMonth() + 1}/{month.getFullYear()}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          disabled={!allowMonthNavigation}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {days.map((dayInfo, index) => {
          const isCurrentMonth = dayInfo.month === 'current';
          const weekend = isWeekend(dayInfo);
          const selected = isSelected(dayInfo);
          const vegetarian = isVegetarian(dayInfo);
          const pastDate = isPastDate(dayInfo);

          const lunar = getLunarDate(dayInfo);
          const isVegDay = isVegetarianDay(dayInfo);

          return (
            <div
              key={`${dayInfo.month}-${dayInfo.day}-${index}`}
              onClick={() => handleDayClick(dayInfo)}
              className={`
                relative aspect-square p-1 rounded-lg border text-center
                transition-all flex flex-col justify-between
                ${!isCurrentMonth ? 'text-gray-300 bg-gray-50 cursor-default' : ''}
                ${isCurrentMonth && weekend ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}
                ${isCurrentMonth && pastDate && !weekend && !selected ? 'bg-gray-50 opacity-60' : ''}
                ${isCurrentMonth && pastDate && !weekend ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${isCurrentMonth && selected && !weekend ? 'bg-orange-100 border-orange-500' : 'border-gray-200'}
                ${isCurrentMonth && selected && pastDate && !weekend ? 'opacity-70' : ''}
                ${isCurrentMonth && !disabled && !weekend && !pastDate ? 'hover:border-orange-300' : ''}
              `}
            >
              <div className="text-sm font-medium">{dayInfo.day}</div>
              <div className={`text-[10px] ${isCurrentMonth && isVegDay ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                {lunar.day}/{lunar.month}
              </div>
              {isCurrentMonth && selected && !weekend && isVegDay && (
                <button
                  onClick={(e) => handleVegetarianClick(dayInfo, e)}
                  className={`
                    absolute bottom-0.5 right-0.5 p-0.5 rounded
                    ${vegetarian ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
                    hover:scale-110 transition-transform
                  `}
                  title={vegetarian ? "Ăn chay" : "Click để chọn ăn chay"}
                >
                  <Leaf className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-100 border border-orange-500 rounded"></div>
          <span>Đã chọn</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Cuối tuần</span>
        </div>
        <div className="flex items-center gap-1">
          <Leaf className="w-4 h-4 text-green-500" />
          <span>Ăn chay</span>
        </div>
      </div>
    </div>
  );
}
