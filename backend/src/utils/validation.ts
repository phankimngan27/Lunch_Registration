// Validation utilities for input sanitization and validation

/**
 * Validate email format and domain
 */
export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email không được để trống' };
  }

  // Check length
  if (email.length > 255) {
    return { valid: false, message: 'Email quá dài (tối đa 255 ký tự)' };
  }

  // Check format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Email không đúng định dạng' };
  }

  // Check domain
  if (!email.endsWith('@madison.dev')) {
    return { valid: false, message: 'Email phải có định dạng @madison.dev' };
  }

  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Mật khẩu không được để trống' };
  }

  if (password.length < 4) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 4 ký tự' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Mật khẩu quá dài (tối đa 128 ký tự)' };
  }

  return { valid: true };
};

/**
 * Validate phone number format (Vietnamese)
 */
export const validatePhoneNumber = (phone: string): { valid: boolean; message?: string } => {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  if (typeof phone !== 'string') {
    return { valid: false, message: 'Số điện thoại không hợp lệ' };
  }

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // Vietnamese phone: 10-11 digits, starts with 0
  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, message: 'Số điện thoại phải có 10-11 số và bắt đầu bằng 0' };
  }

  return { valid: true };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const validateDateFormat = (dateStr: string): { valid: boolean; message?: string; date?: Date } => {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, message: 'Ngày không được để trống' };
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, message: 'Định dạng ngày phải là YYYY-MM-DD' };
  }

  // Parse date correctly to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Ngày không hợp lệ' };
  }

  // Check if date is not too far in the past or future
  const minDate = new Date(2020, 0, 1);
  const maxDate = new Date(2100, 11, 31);
  if (date < minDate || date > maxDate) {
    return { valid: false, message: 'Ngày phải trong khoảng 2020-2100' };
  }

  return { valid: true, date };
};

/**
 * Validate month (1-12)
 */
export const validateMonth = (month: any): { valid: boolean; message?: string; value?: number } => {
  const monthNum = parseInt(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return { valid: false, message: 'Tháng phải từ 1 đến 12' };
  }
  return { valid: true, value: monthNum };
};

/**
 * Validate year (2020-2100)
 */
export const validateYear = (year: any): { valid: boolean; message?: string; value?: number } => {
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
    return { valid: false, message: 'Năm phải từ 2020 đến 2100' };
  }
  return { valid: true, value: yearNum };
};

/**
 * Validate employee code
 */
export const validateEmployeeCode = (code: string): { valid: boolean; message?: string } => {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Mã nhân viên không được để trống' };
  }

  if (code.length > 50) {
    return { valid: false, message: 'Mã nhân viên quá dài (tối đa 50 ký tự)' };
  }

  // Only allow alphanumeric, dash, underscore
  const codeRegex = /^[a-zA-Z0-9_-]+$/;
  if (!codeRegex.test(code)) {
    return { valid: false, message: 'Mã nhân viên chỉ được chứa chữ, số, gạch ngang và gạch dưới' };
  }

  return { valid: true };
};

/**
 * Validate full name
 */
export const validateFullName = (name: string): { valid: boolean; message?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Họ tên không được để trống' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Họ tên phải có ít nhất 2 ký tự' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, message: 'Họ tên quá dài (tối đa 100 ký tự)' };
  }

  return { valid: true };
};

/**
 * Validate department name
 */
export const validateDepartment = (dept: string): { valid: boolean; message?: string } => {
  if (!dept) {
    return { valid: true }; // Department is optional
  }

  if (typeof dept !== 'string') {
    return { valid: false, message: 'Tên bộ phận không hợp lệ' };
  }

  if (dept.length > 100) {
    return { valid: false, message: 'Tên bộ phận quá dài (tối đa 100 ký tự)' };
  }

  return { valid: true };
};

/**
 * Check if date is weekend
 */
export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

/**
 * Validate registration dates array
 */
export const validateRegistrationDates = (dates: any[]): { valid: boolean; message?: string; validDates?: string[] } => {
  if (!Array.isArray(dates)) {
    return { valid: false, message: 'Danh sách ngày phải là mảng' };
  }

  if (dates.length > 31) {
    return { valid: false, message: 'Không thể đăng ký quá 31 ngày cùng lúc' };
  }

  const validDates: string[] = [];
  for (const dateStr of dates) {
    const validation = validateDateFormat(dateStr);
    if (!validation.valid) {
      return { valid: false, message: `Ngày không hợp lệ: ${dateStr}` };
    }

    // Check if weekend
    if (validation.date && isWeekend(validation.date)) {
      return { valid: false, message: `Không thể đăng ký cho ngày cuối tuần: ${dateStr}` };
    }

    validDates.push(dateStr);
  }

  return { valid: true, validDates };
};
