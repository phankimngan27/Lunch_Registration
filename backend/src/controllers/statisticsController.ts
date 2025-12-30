import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/database';

export const getStatistics = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { month, year, department, phone_number } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Vui lòng chọn tháng và năm' });
    }

    const priceResult = await pool.query(
      `SELECT value FROM settings WHERE key = 'lunch_price'`
    );
    const lunchPrice = priceResult.rows[0]?.value || 20000;

    let query = `
      SELECT 
        u.id, u.employee_code, u.full_name, u.department, u.phone_number,
        COUNT(r.id) as total_days,
        COUNT(r.id) * ${lunchPrice} as total_amount
      FROM users u
      LEFT JOIN registrations r ON u.id = r.user_id 
        AND r.status = 'active'
        AND r.month = $1 AND r.year = $2
      WHERE u.is_active = true 
        AND u.employee_code != 'admin' 
        AND u.email != 'admin@madison.dev'
    `;

    const params: any[] = [month, year];
    let paramCount = 3;

    if (department) {
      query += ` AND u.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (phone_number) {
      query += ` AND u.phone_number = $${paramCount}`;
      params.push(phone_number);
    }

    query += ' GROUP BY u.id, u.employee_code, u.full_name, u.department, u.phone_number ORDER BY u.employee_code';

    const result = await pool.query(query, params);
    
    const summary = {
      total_employees: result.rows.filter(row => parseInt(row.total_days) > 0).length,
      total_registrations: result.rows.reduce((sum, row) => sum + parseInt(row.total_days), 0),
      total_amount: result.rows.reduce((sum, row) => sum + parseInt(row.total_amount), 0)
    };

    res.json({ summary, details: result.rows });
  } catch (error) {
    console.error('Lỗi thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const { month, year, department, phone_number } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Vui lòng chọn tháng và năm' });
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);

    const priceResult = await pool.query(
      `SELECT value FROM settings WHERE key = 'lunch_price'`
    );
    const lunchPrice = priceResult.rows[0]?.value || 20000;

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    let userQuery = `
      SELECT u.id, u.employee_code, u.full_name, u.department, u.phone_number
      FROM users u
      WHERE u.is_active = true 
        AND u.employee_code != 'admin' 
        AND u.email != 'admin@madison.dev'
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (department) {
      userQuery += ` AND u.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (phone_number) {
      userQuery += ` AND u.phone_number = $${paramCount}`;
      params.push(phone_number);
    }

    userQuery += ' ORDER BY u.employee_code';

    const usersResult = await pool.query(userQuery, params);

    const regsResult = await pool.query(
      `SELECT user_id, EXTRACT(DAY FROM registration_date) as day FROM registrations 
       WHERE month = $1 AND year = $2 AND status = 'active'`,
      [monthNum, yearNum]
    );

    const regsByUser: { [key: number]: Set<number> } = {};
    regsResult.rows.forEach((reg: any) => {
      if (!regsByUser[reg.user_id]) {
        regsByUser[reg.user_id] = new Set();
      }
      regsByUser[reg.user_id].add(parseInt(reg.day));
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Thống kê ${monthNum}-${yearNum}`);

    worksheet.mergeCells(1, 1, 1, 6 + daysInMonth);
    worksheet.getCell('A1').value = `DANH SÁCH ĐĂNG KÝ CƠM TRƯA TẠI CÔNG TY THÁNG ${monthNum}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    const headerRow = worksheet.getRow(2);
    headerRow.values = ['STT', 'MÃ NV', 'HỌ TÊN', 'BỘ PHẬN', 'TỔNG NGÀY', 'SỐ TIỀN'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      headerRow.getCell(6 + day).value = day;
    }

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    let rowIndex = 3;
    usersResult.rows.forEach((user: any, index: number) => {
      const userRegs = regsByUser[user.id] || new Set();
      const totalDays = userRegs.size;
      const totalAmount = totalDays * lunchPrice;

      const row = worksheet.getRow(rowIndex);
      row.values = [
        index + 1,
        user.employee_code || '',
        user.full_name,
        user.department || '',
        totalDays,
        totalAmount
      ];

      for (let day = 1; day <= daysInMonth; day++) {
        if (userRegs.has(day)) {
          row.getCell(6 + day).value = 'x';
        }
      }

      rowIndex++;
    });

    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 15;

    for (let day = 1; day <= daysInMonth; day++) {
      worksheet.getColumn(6 + day).width = 4;
    }

    worksheet.getColumn(6).numFmt = '#,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=dang-ky-com-trua-${monthNum}-${yearNum}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};
