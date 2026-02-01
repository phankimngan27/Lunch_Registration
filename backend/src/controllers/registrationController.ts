import { Request, Response } from 'express';
import pool from '../config/database';
import { 
  validateMonth, 
  validateYear, 
  validateRegistrationDates,
  validateDateFormat,
  validateVegetarianDates,
  isWeekend,
  isPastDate
} from '../utils/validation';

export const createRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { dates, month, year, vegetarianDates } = req.body;

    // SECURITY: Validate input types to prevent type confusion attacks
    if (!dates || !Array.isArray(dates)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    // Validate month type and value
    if (month !== undefined) {
      if (typeof month !== 'number') {
        return res.status(400).json({ message: 'Tháng phải là số' });
      }
      const monthValidation = validateMonth(month);
      if (!monthValidation.valid) {
        return res.status(400).json({ message: monthValidation.message });
      }
    }

    // Validate year type and value
    if (year !== undefined) {
      if (typeof year !== 'number') {
        return res.status(400).json({ message: 'Năm phải là số' });
      }
      const yearValidation = validateYear(year);
      if (!yearValidation.valid) {
        return res.status(400).json({ message: yearValidation.message });
      }
    }

    // Validate vegetarianDates type
    if (vegetarianDates !== undefined && typeof vegetarianDates !== 'object') {
      return res.status(400).json({ message: 'Dữ liệu ăn chay không hợp lệ' });
    }

    // Validate dates array (check format and weekends)
    if (dates.length > 0) {
      const datesValidation = validateRegistrationDates(dates);
      if (!datesValidation.valid) {
        return res.status(400).json({ message: datesValidation.message });
      }
    }

    // CRITICAL: Validate vegetarian dates to prevent API abuse
    // This ensures users can only mark actual lunar 1st/15th as vegetarian
    const vegetarianValidation = validateVegetarianDates(vegetarianDates, dates);
    if (!vegetarianValidation.valid) {
      return res.status(400).json({ message: vegetarianValidation.message });
    }
    // Use validated vegetarian dates (filtered to only actual vegetarian days)
    const validatedVegetarianDates = vegetarianValidation.validatedDates || {};

    // Kiểm tra thời gian đăng ký
    if (month && year) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentHour = today.getHours();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      // Lấy cấu hình từ database
      const configResult = await pool.query(
        'SELECT monthly_cutoff_day, daily_deadline_hour FROM registration_config LIMIT 1'
      );
      const monthlyCutoffDay = configResult.rows[0]?.monthly_cutoff_day || 25;
      const dailyDeadlineHour = configResult.rows[0]?.daily_deadline_hour || 20;

      // Kiểm tra xem tháng được đăng ký có hợp lệ không
      const isCurrentMonth = month === currentMonth && year === currentYear;
      
      // Tính tháng kế tiếp
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const isNextMonth = month === nextMonth && year === nextYear;

      // Chỉ cho phép đăng ký cho:
      // 1. Tháng hiện tại
      // 2. Tháng kế tiếp (nếu đã qua ngày cutoff)
      if (!isCurrentMonth && !isNextMonth) {
        return res.status(403).json({ 
          message: 'Bạn chỉ có thể đăng ký cho tháng hiện tại hoặc tháng kế tiếp' 
        });
      }

      // Nếu đăng ký cho tháng kế tiếp, kiểm tra xem đã qua ngày cutoff chưa
      if (isNextMonth && currentDay < monthlyCutoffDay) {
        return res.status(403).json({ 
          message: `Chưa đến thời gian đăng ký cho tháng ${month}/${year}. Vui lòng đợi đến ngày ${monthlyCutoffDay} tháng ${currentMonth}.` 
        });
      }

      // Kiểm tra daily deadline cho từng ngày
      if (dates.length > 0) {
        const today = new Date();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const dateStr of dates) {
          const dateValidation = validateDateFormat(dateStr);
          if (!dateValidation.valid || !dateValidation.date) {
            return res.status(400).json({ message: `Ngày không hợp lệ: ${dateStr}` });
          }

          const registrationDate = dateValidation.date;
          const regDateStart = new Date(registrationDate);
          regDateStart.setHours(0, 0, 0, 0);

          // Không cho phép đăng ký cho ngày quá khứ
          if (regDateStart.getTime() < todayStart.getTime()) {
            return res.status(403).json({ 
              message: `Không thể đăng ký cho ngày quá khứ: ${dateStr}` 
            });
          }

          // Không cho phép đăng ký cho ngày hôm nay
          if (regDateStart.getTime() === todayStart.getTime()) {
            return res.status(403).json({ 
              message: `Không thể đăng ký cho ngày hôm nay. Deadline là ${dailyDeadlineHour}:00 hôm qua.` 
            });
          }

          // Nếu là ngày mai, kiểm tra deadline (chỉ áp dụng cho ngày mai)
          if (regDateStart.getTime() === tomorrow.getTime() && currentHour >= dailyDeadlineHour) {
            return res.status(403).json({ 
              message: `Đã hết thời gian đăng ký cho ngày ${dateStr}. Deadline là ${dailyDeadlineHour}:00 hôm nay.` 
            });
          }

          // Các ngày trong tương lai (sau ngày mai) luôn được phép đăng ký/chỉnh sửa
        }
      }
    }

    // Nếu không có ngày nào được chọn, xóa tất cả đăng ký của tháng
    if (dates.length === 0) {
      // Sử dụng month/year từ request, hoặc tính toán nếu không có
      let targetMonth = month;
      let targetYear = year;

      if (!targetMonth || !targetYear) {
        const today = new Date();
        const currentDay = today.getDate();
        targetMonth = today.getMonth() + 1;
        targetYear = today.getFullYear();

        if (currentDay >= 23) {
          targetMonth = targetMonth + 1;
          if (targetMonth > 12) {
            targetMonth = 1;
            targetYear = targetYear + 1;
          }
        }
      }

      const result = await pool.query(
        `DELETE FROM registrations 
         WHERE user_id = $1 AND month = $2 AND year = $3`,
        [userId, targetMonth, targetYear]
      );

      // Deleted registrations for the month
      return res.json({ message: 'Đã hủy tất cả đăng ký', count: result.rowCount });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // CHỈ xử lý tháng đang được chỉnh sửa (từ request)
      if (!month || !year) {
        throw new Error('Month and year are required');
      }

      // Lấy tất cả registrations hiện tại của tháng đang xem
      // Dùng TO_CHAR để format date đúng cách, tránh lệch timezone
      // FOR UPDATE: Lock rows để tránh race condition khi có nhiều request đồng thời
      const existingResult = await client.query(
        `SELECT TO_CHAR(registration_date, 'YYYY-MM-DD') as date_string FROM registrations 
         WHERE user_id = $1 AND month = $2 AND year = $3
         FOR UPDATE`,
        [userId, month, year]
      );
      const existingRegs: string[] = existingResult.rows.map((r: any) => r.date_string);

      // Lọc chỉ lấy các ngày thuộc tháng đang xem và KHÔNG PHẢI cuối tuần
      const datesInCurrentMonth = dates.filter(d => {
        // Parse date string đúng cách để tránh lệch timezone
        const [y, m, day] = d.split('-').map(Number);
        const dateObj = new Date(y, m - 1, day); // Local timezone

        const dateMonth = dateObj.getMonth() + 1;
        const dateYear = dateObj.getFullYear();
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

        // Chỉ chấp nhận ngày thuộc tháng đang xem và không phải cuối tuần (0 = CN, 6 = T7)
        const isInCurrentMonth = dateMonth === month && dateYear === year;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        return isInCurrentMonth && !isWeekend;
      });

      // Tìm ngày cần thêm và ngày cần xóa (CHỈ trong tháng đang xem)
      const newDates = datesInCurrentMonth.filter(d => !existingRegs.includes(d));
      
      // CHỈ xóa các ngày TƯƠNG LAI mà user bỏ chọn (không xóa ngày quá khứ)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      
      const datesToDelete = existingRegs.filter(d => {
        // Nếu ngày không có trong danh sách mới
        if (datesInCurrentMonth.includes(d)) {
          return false; // Không xóa
        }
        
        // Parse date để kiểm tra xem có phải ngày quá khứ không
        const [y, m, day] = d.split('-').map(Number);
        const dateObj = new Date(y, m - 1, day);
        const dateStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
        
        // CHỈ xóa nếu là ngày tương lai (sau hôm nay)
        return dateStart.getTime() > todayStart.getTime();
      });

      // Xóa các ngày không còn được chọn (chỉ ngày tương lai)
      if (datesToDelete.length > 0) {
        const deleteResult = await client.query(
          `DELETE FROM registrations 
           WHERE user_id = $1 AND TO_CHAR(registration_date, 'YYYY-MM-DD') = ANY($2::text[])`,
          [userId, datesToDelete]
        );
      }

      // Thêm các ngày mới (đã được lọc theo tháng đang xem)
      const insertedDates = [];
      for (const date of newDates) {
        // Use validated vegetarian dates instead of raw input
        const isVegetarian = validatedVegetarianDates && validatedVegetarianDates[date] === true;
        const result = await client.query(
          `INSERT INTO registrations (user_id, registration_date, month, year, is_vegetarian) 
           VALUES ($1, $2::date, $3, $4, $5) 
           RETURNING *`,
          [userId, date, month, year, isVegetarian]
        );
        insertedDates.push(result.rows[0]);
      }

      // Cập nhật is_vegetarian cho các ngày đã tồn tại
      const datesToUpdate = datesInCurrentMonth.filter(d => existingRegs.includes(d));
      if (datesToUpdate.length > 0) {
        for (const date of datesToUpdate) {
          // Use validated vegetarian dates instead of raw input
          const isVegetarian = validatedVegetarianDates && validatedVegetarianDates[date] === true;
          await client.query(
            `UPDATE registrations 
             SET is_vegetarian = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND TO_CHAR(registration_date, 'YYYY-MM-DD') = $3`,
            [isVegetarian, userId, date]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Đăng ký thành công',
        data: { added: insertedDates.length, deleted: datesToDelete.length }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { month, year } = req.query;

    // Add caching headers for better performance
    res.setHeader('Cache-Control', 'private, max-age=60'); // Cache for 1 minute

    // Optimized query with proper index usage
    let query = `SELECT id, user_id, 
                        TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date, 
                        month, year, status, is_vegetarian, created_at 
                 FROM registrations 
                 WHERE user_id = $1 AND status = $2`;
    const params: any[] = [userId, 'active'];

    if (month && year) {
      // This will use idx_registrations_user_month_year index
      query += ` AND month = $3 AND year = $4`;
      params.push(parseInt(month as string), parseInt(year as string));
    }

    query += ' ORDER BY registration_date';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { dates, month, year } = req.body;

    // SECURITY: Validate input types
    if (month !== undefined && typeof month !== 'number') {
      return res.status(400).json({ message: 'Tháng phải là số' });
    }

    if (year !== undefined && typeof year !== 'number') {
      return res.status(400).json({ message: 'Năm phải là số' });
    }

    // Nếu có month/year, xóa tất cả registrations của tháng đó
    if (month && year) {
      const result = await pool.query(
        `DELETE FROM registrations 
         WHERE user_id = $1 AND month = $2 AND year = $3`,
        [userId, month, year]
      );
      return res.json({ message: 'Hủy đăng ký thành công', count: result.rowCount });
    }

    // Validate dates type
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày cần hủy' });
    }

    const result = await pool.query(
      `DELETE FROM registrations 
       WHERE user_id = $1 AND registration_date = ANY($2::date[])`,
      [userId, dates]
    );

    res.json({ message: 'Hủy đăng ký thành công', count: result.rowCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Lấy danh sách đăng ký theo ngày
export const getRegistrationsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
    }

    // Add caching headers
    res.setHeader('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes

    // Optimized query - will use idx_registrations_date_status index
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.registration_date, r.is_vegetarian,
              u.employee_code, u.full_name, u.email, u.department, u.phone_number
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.registration_date = $1 AND r.status = 'active'
       AND u.employee_code != 'admin' AND u.email != 'admin@madison.dev'
       ORDER BY u.employee_code`,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Tạo đăng ký cho TẤT CẢ nhân viên active trong ngày
export const createBulkRegistration = async (req: Request, res: Response) => {
  try {
    const { date, isVegetarian = false } = req.body;
    
    // SECURITY: Validate input types
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Ngày không hợp lệ' });
    }

    // Convert to boolean to ensure correct type
    const isVeg = Boolean(isVegetarian);

    // Parse date để lấy month và year
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    // Lấy tất cả user active, LOẠI TRỪ super admin
    const usersResult = await pool.query(
      `SELECT id FROM users 
       WHERE is_active = true 
       AND employee_code != 'admin' 
       AND email != 'admin@madison.dev'`
    );

    if (usersResult.rows.length === 0) {
      return res.status(400).json({ message: 'Không có nhân viên active' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let created = 0;
      let skipped = 0;

      for (const user of usersResult.rows) {
        // Check nếu đã có đăng ký
        const existingReg = await client.query(
          'SELECT id FROM registrations WHERE user_id = $1 AND registration_date = $2',
          [user.id, date]
        );

        if (existingReg.rows.length === 0) {
          await client.query(
            `INSERT INTO registrations (user_id, registration_date, month, year, is_vegetarian) 
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, date, month, year, isVeg]
          );
          created++;
        } else {
          skipped++;
        }
      }

      await client.query('COMMIT');
      res.json({ 
        message: `Đã tạo ${created} đăng ký mới, bỏ qua ${skipped} đăng ký đã tồn tại`,
        created,
        skipped
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Hủy đăng ký cho TẤT CẢ nhân viên trong ngày
export const cancelBulkRegistration = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;

    // SECURITY: Validate input type
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Ngày không hợp lệ' });
    }

    const result = await pool.query(
      'DELETE FROM registrations WHERE registration_date = $1',
      [date]
    );

    res.json({ 
      message: `Đã hủy ${result.rowCount} đăng ký`,
      count: result.rowCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Chỉnh sửa đăng ký theo người (bulk edit by users)
export const bulkEditByUsers = async (req: Request, res: Response) => {
  try {
    const { userIds, action, dates, month, year, isVegetarian = false } = req.body;
    
    // SECURITY: Validate input types
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một nhân viên' });
    }

    // Validate all userIds are numbers
    if (!userIds.every(id => typeof id === 'number' && Number.isInteger(id))) {
      return res.status(400).json({ message: 'ID nhân viên không hợp lệ' });
    }

    if (!action || typeof action !== 'string' || !['register', 'cancel'].includes(action)) {
      return res.status(400).json({ message: 'Action không hợp lệ (register hoặc cancel)' });
    }

    // Validate dates type
    if (dates !== undefined && !Array.isArray(dates)) {
      return res.status(400).json({ message: 'Danh sách ngày phải là mảng' });
    }

    // Validate month and year types
    if (month !== undefined && typeof month !== 'number') {
      return res.status(400).json({ message: 'Tháng phải là số' });
    }

    if (year !== undefined && typeof year !== 'number') {
      return res.status(400).json({ message: 'Năm phải là số' });
    }

    // Convert to boolean to ensure correct type
    const isVeg = Boolean(isVegetarian);

    // Validate dates or month/year
    if (action === 'register' && (!dates || dates.length === 0)) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một ngày' });
    }

    if (action === 'cancel' && !dates && (!month || !year)) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày hoặc tháng cần hủy' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let totalCreated = 0;
      let totalDeleted = 0;
      let totalSkipped = 0;

      if (action === 'register') {
        // FIX N+1 QUERY: Sử dụng bulk insert với ON CONFLICT thay vì loop
        // Tạo danh sách các registrations cần insert
        const registrationsToInsert: Array<{userId: number, dateStr: string, month: number, year: number}> = [];
        
        for (const userId of userIds) {
          for (const dateStr of dates) {
            // Parse date để lấy month và year
            const dateObj = new Date(dateStr);
            const regMonth = dateObj.getMonth() + 1;
            const regYear = dateObj.getFullYear();
            
            registrationsToInsert.push({
              userId,
              dateStr,
              month: regMonth,
              year: regYear
            });
          }
        }

        // Bulk insert với ON CONFLICT DO NOTHING để tránh duplicate
        // Sử dụng unnest để insert nhiều rows cùng lúc
        if (registrationsToInsert.length > 0) {
          const userIdArray = registrationsToInsert.map(r => r.userId);
          const dateArray = registrationsToInsert.map(r => r.dateStr);
          const monthArray = registrationsToInsert.map(r => r.month);
          const yearArray = registrationsToInsert.map(r => r.year);
          const vegArray = registrationsToInsert.map(() => isVeg);

          const result = await client.query(
            `INSERT INTO registrations (user_id, registration_date, month, year, is_vegetarian)
             SELECT * FROM UNNEST($1::int[], $2::date[], $3::int[], $4::int[], $5::boolean[])
             ON CONFLICT (user_id, registration_date) DO NOTHING
             RETURNING id`,
            [userIdArray, dateArray, monthArray, yearArray, vegArray]
          );

          totalCreated = result.rowCount || 0;
          totalSkipped = registrationsToInsert.length - totalCreated;
        }

        await client.query('COMMIT');
        res.json({ 
          message: `Đã tạo ${totalCreated} đăng ký mới, bỏ qua ${totalSkipped} đăng ký đã tồn tại`,
          created: totalCreated,
          skipped: totalSkipped
        });
      } else if (action === 'cancel') {
        // Hủy đăng ký cho các người được chọn
        if (dates && dates.length > 0) {
          // Hủy theo ngày cụ thể
          const result = await client.query(
            `DELETE FROM registrations 
             WHERE user_id = ANY($1::int[]) AND registration_date = ANY($2::date[])`,
            [userIds, dates]
          );
          totalDeleted = result.rowCount || 0;
        } else if (month && year) {
          // Hủy theo tháng
          const result = await client.query(
            `DELETE FROM registrations 
             WHERE user_id = ANY($1::int[]) AND month = $2 AND year = $3`,
            [userIds, month, year]
          );
          totalDeleted = result.rowCount || 0;
        }

        await client.query('COMMIT');
        res.json({ 
          message: `Đã hủy ${totalDeleted} đăng ký`,
          deleted: totalDeleted
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
