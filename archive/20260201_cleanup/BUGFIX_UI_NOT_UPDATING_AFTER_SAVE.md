# Bugfix: UI không hiển thị ngày đăng ký sau khi nhấn "Lưu đăng ký"

## Vấn đề
Khi người dùng chọn "Chọn tất cả", sau đó nhấn "Lưu đăng ký", UI hiển thị "Chưa chọn ngày nào" mặc dù đã lưu thành công. Người dùng phải F5 (refresh) trang thì mới thấy các ngày đã đăng ký.

## Root Cause
Vấn đề xảy ra do **React state batching** và timing issue:

1. Khi `handleSubmit()` được gọi:
   - API call thành công
   - `fetchRegistrations()` được gọi để load lại data từ server
   - `fetchRegistrations()` gọi `setSelectedDates()` và `setVegetarianDates()`
   - Ngay sau đó `setIsEditing(false)` được gọi

2. React batch tất cả state updates lại và chỉ re-render một lần

3. Tuy nhiên, do timing issue, khi component re-render, `selectedDates` có thể chưa được cập nhật với data mới từ server

4. Kết quả: UI hiển thị với state cũ (rỗng hoặc data cũ), không phản ánh data mới từ server

## Giải pháp

### 1. Đợi React re-render trước khi thoát edit mode
Sử dụng `requestAnimationFrame` để đảm bảo React đã re-render với state mới trước khi set `isEditing(false)`:

```typescript
const handleSubmit = async () => {
  setLoading(true);
  try {
    // ... API call và logic khác
    
    // Gọi API để lưu đăng ký
    await api.post('/registrations', {
      dates,
      month,
      year,
      vegetarianDates: vegetarianInfo
    });

    // Refresh data sau khi lưu
    await fetchRegistrations();

    // Đợi React re-render với state mới
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Sau khi fetch xong, mới cập nhật UI state
    if (dates.length === 0) {
      setHasSubmitted(false);
      toast.success('Đã hủy tất cả đăng ký cơm trưa của tháng này!');
    } else {
      setHasSubmitted(true);
      toast.success('Đăng ký cơm trưa thành công!');
    }

    setIsEditing(false);
  } catch (error: any) {
    console.error('❌ Submit error:', error);
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
  } finally {
    setLoading(false);
  }
};
```

### 2. Giải thích `requestAnimationFrame`
- `requestAnimationFrame` đảm bảo callback được gọi trước khi browser paint frame tiếp theo
- Sử dụng double `requestAnimationFrame` để đảm bảo React đã hoàn thành cả commit phase và paint phase
- Điều này cho phép state updates từ `fetchRegistrations()` được áp dụng trước khi `setIsEditing(false)` trigger re-render tiếp theo

## Files Changed
- `frontend/src/components/EmployeeRegistration.tsx`

## Testing
1. Login vào hệ thống
2. Vào trang "Đăng ký cơm trưa"
3. Nhấn "Bắt đầu đăng ký" hoặc "Chỉnh sửa đăng ký"
4. Nhấn "Chọn tất cả"
5. Nhấn "Lưu đăng ký"
6. **Verify**: UI hiển thị ngay các ngày đã đăng ký, không cần F5
7. Kiểm tra "Các ngày đã chọn" bên phải hiển thị đầy đủ
8. Kiểm tra "Số ngày đăng ký" và "Tổng cộng" hiển thị đúng

## Related Fixes
Bugfix này được thực hiện cùng với:
- **BUGFIX_DESELECT_ALL_FUTURE_ONLY.md**: Sửa nút "Bỏ tất cả" chỉ bỏ chọn ngày tương lai

## Technical Notes
- Sử dụng `requestAnimationFrame` là một workaround cho React state batching
- Trong tương lai, có thể refactor để sử dụng `useEffect` hoặc React 18's `useTransition` để xử lý tốt hơn
- Cách tiếp cận hiện tại đơn giản và hoạt động tốt cho use case này

## Impact
- **User Experience**: Người dùng thấy kết quả ngay lập tức sau khi lưu, không cần refresh trang
- **Data Consistency**: Đảm bảo UI luôn hiển thị data mới nhất từ server
- **Performance**: Minimal impact, chỉ thêm ~16-32ms delay (2 animation frames)

## Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to production
# (Follow standard deployment process)
```

## Date
February 1, 2026
