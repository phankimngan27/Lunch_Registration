import { Request, Response } from 'express';
import pool from '../config/database';

export const createRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { dates, month, year, vegetarianDates } = req.body;

    if (!dates || !Array.isArray(dates)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
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
      const existingResult = await client.query(
        `SELECT TO_CHAR(registration_date, 'YYYY-MM-DD') as date_string FROM registrations 
         WHERE user_id = $1 AND month = $2 AND year = $3`,
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

        if (isWeekend) {
          console.log(`⚠️ Skipping weekend date: ${d} (${y}-${m}-${day}, day ${dayOfWeek})`);
        }

        if (!isInCurrentMonth) {
          console.log(`⚠️ Skipping date not in current month: ${d}`);
        }

        return isInCurrentMonth && !isWeekend;
      });

      // Tìm ngày cần thêm và ngày cần xóa (CHỈ trong tháng đang xem)
      const newDates = datesInCurrentMonth.filter(d => !existingRegs.includes(d));
      const datesToDelete = existingRegs.filter(d => !datesInCurrentMonth.includes(d));

      console.log(`📊 Month ${month}/${year}: Existing: ${existingRegs.length}, New: ${datesInCurrentMonth.length}, To add: ${newDates.length}, To delete: ${datesToDelete.length}`);

      // Xóa các ngày không còn được chọn
      if (datesToDelete.length > 0) {
        console.log(`🗑️ Attempting to delete:`, datesToDelete);
        const deleteResult = await client.query(
          `DELETE FROM registrations 
           WHERE user_id = $1 AND TO_CHAR(registration_date, 'YYYY-MM-DD') = ANY($2::text[])`,
          [userId, datesToDelete]
        );
        console.log(`✅ Deleted ${deleteResult.rowCount || 0} registrations`);
      }

      // Thêm các ngày mới (đã được lọc theo tháng đang xem)
      const insertedDates = [];
      for (const date of newDates) {
        const isVegetarian = vegetarianDates && vegetarianDates[date] === true;
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
          const isVegetarian = vegetarianDates && vegetarianDates[date] === true;
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
    console.error('Lỗi đăng ký cơm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { month, year } = req.query;

    // Select với TO_CHAR để trả về date string thay vì timestamp, tránh lệch timezone
    let query = `SELECT id, user_id, 
                        TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date, 
                        month, year, status, is_vegetarian, created_at 
                 FROM registrations 
                 WHERE user_id = $1 AND status = $2`;
    const params: any[] = [userId, 'active'];

    if (month && year) {
      query += ` AND month = $3 AND year = $4`;
      params.push(parseInt(month as string), parseInt(year as string));
    }

    query += ' ORDER BY registration_date';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi lấy đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { dates, month, year } = req.body;

    // Nếu có month/year, xóa tất cả registrations của tháng đó
    if (month && year) {
      const result = await pool.query(
        `DELETE FROM registrations 
         WHERE user_id = $1 AND month = $2 AND year = $3`,
        [userId, parseInt(month), parseInt(year)]
      );
      console.log('✅ Cancelled rows:', result.rowCount);
      return res.json({ message: 'Hủy đăng ký thành công', count: result.rowCount });
    }

    // Nếu chỉ có dates, xóa theo từng ngày
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
    console.error('Lỗi hủy đăng ký:', error);
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
    console.error('Lỗi lấy danh sách đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Tạo đăng ký cho TẤT CẢ nhân viên active trong ngày
export const createBulkRegistration = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
    }

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
             VALUES ($1, $2, $3, $4, false)`,
            [user.id, date, month, year]
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
    console.error('Lỗi tạo đăng ký hàng loạt:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Admin: Hủy đăng ký cho TẤT CẢ nhân viên trong ngày
export const cancelBulkRegistration = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
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
    console.error('Lỗi hủy đăng ký hàng loạt:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
