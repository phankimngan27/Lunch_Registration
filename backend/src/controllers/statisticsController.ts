import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/database';

export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Add caching for statistics (cache for 2 minutes)
    res.setHeader('Cache-Control', 'private, max-age=120');
    
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

    // Optimized query - will use idx_registrations_month_year index
    const regsResult = await pool.query(
      `SELECT user_id, EXTRACT(DAY FROM registration_date) as day, is_vegetarian FROM registrations 
       WHERE month = $1 AND year = $2 AND status = 'active'`,
      [monthNum, yearNum]
    );

    const regsByUser: { [key: number]: Set<number> } = {};
    const vegetarianByUser: { [key: number]: Set<number> } = {};
    const allVegetarianDays = new Set<number>();
    
    regsResult.rows.forEach((reg: any) => {
      if (!regsByUser[reg.user_id]) {
        regsByUser[reg.user_id] = new Set();
      }
      regsByUser[reg.user_id].add(parseInt(reg.day));
      
      if (reg.is_vegetarian) {
        const day = parseInt(reg.day);
        allVegetarianDays.add(day);
        if (!vegetarianByUser[reg.user_id]) {
          vegetarianByUser[reg.user_id] = new Set();
        }
        vegetarianByUser[reg.user_id].add(day);
      }
    });
    
    // Sắp xếp các ngày chay theo thứ tự tăng dần
    const sortedVegetarianDays = Array.from(allVegetarianDays).sort((a, b) => a - b);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Thống kê ${monthNum}-${yearNum}`);

    const numVegetarianCols = sortedVegetarianDays.length;
    
    worksheet.mergeCells(1, 1, 1, 7 + numVegetarianCols + daysInMonth);
    worksheet.getCell('A1').value = `DANH SÁCH ĐĂNG KÝ CƠM TRƯA TẠI CÔNG TY THÁNG ${monthNum}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Tạo header row với merge cells
    const headerRow1 = worksheet.getRow(2);
    
    // Merge các cột cơ bản từ row 2 đến row 3
    worksheet.mergeCells(2, 1, 3, 1); // STT
    worksheet.mergeCells(2, 2, 3, 2); // MÃ NV
    worksheet.mergeCells(2, 3, 3, 3); // HỌ TÊN
    worksheet.mergeCells(2, 4, 3, 4); // BỘ PHẬN
    worksheet.mergeCells(2, 5, 3, 5); // TỔNG NGÀY
    worksheet.mergeCells(2, 6, 3, 6); // SỐ TIỀN
    
    headerRow1.getCell(1).value = 'STT';
    headerRow1.getCell(2).value = 'MÃ NV';
    headerRow1.getCell(3).value = 'HỌ TÊN';
    headerRow1.getCell(4).value = 'BỘ PHẬN';
    headerRow1.getCell(5).value = 'TỔNG NGÀY';
    headerRow1.getCell(6).value = 'SỐ TIỀN';
    
    // Format các cột cơ bản
    for (let col = 1; col <= 6; col++) {
      const cell = headerRow1.getCell(col);
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Merge cell cho "ĐĂNG KÝ CƠM CHAY" nếu có ngày chay
    if (numVegetarianCols > 0) {
      worksheet.mergeCells(2, 7, 2, 6 + numVegetarianCols);
      headerRow1.getCell(7).value = 'ĐĂNG KÝ CƠM CHAY';
      headerRow1.getCell(7).font = { bold: true };
      headerRow1.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow1.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      };
      headerRow1.getCell(7).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Merge cell cho "CHẤM NGÀY ĐĂNG KÝ"
    worksheet.mergeCells(2, 7 + numVegetarianCols, 2, 6 + numVegetarianCols + daysInMonth);
    headerRow1.getCell(7 + numVegetarianCols).value = 'CHẤM NGÀY ĐĂNG KÝ';
    headerRow1.getCell(7 + numVegetarianCols).font = { bold: true };
    headerRow1.getCell(7 + numVegetarianCols).alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow1.getCell(7 + numVegetarianCols).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Tạo header row 2 với các cột con (chỉ cho phần ĐĂNG KÝ CƠM CHAY và CHẤM NGÀY ĐĂNG KÝ)
    const headerRow2 = worksheet.getRow(3);
    
    // Thêm các cột ngày chay (bắt đầu từ cột 7)
    sortedVegetarianDays.forEach((day, index) => {
      const cell = headerRow2.getCell(7 + index);
      cell.value = day;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }
      };
    });
    
    // Thêm các cột ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      const dayOfWeek = date.getDay();
      const cell = headerRow2.getCell(7 + numVegetarianCols + day - 1);
      cell.value = day;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Highlight thứ 7 và CN
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      }
    }

    let rowIndex = 4;
    usersResult.rows.forEach((user: any, index: number) => {
      const userRegs = regsByUser[user.id] || new Set();
      const userVegetarian = vegetarianByUser[user.id] || new Set();
      const totalDays = userRegs.size;
      const totalAmount = totalDays * lunchPrice;

      const row = worksheet.getRow(rowIndex);
      const rowValues = [
        index + 1,
        user.employee_code || '',
        user.full_name,
        user.department || '',
        totalDays,
        totalAmount
      ];
      
      // Thêm các cột đăng ký cơm chay
      sortedVegetarianDays.forEach(vegDay => {
        rowValues.push(userVegetarian.has(vegDay) ? 'x' : '');
      });
      
      // Thêm các cột chấm công
      for (let day = 1; day <= daysInMonth; day++) {
        rowValues.push(userRegs.has(day) ? 'x' : '');
      }
      
      row.values = rowValues;
      
      // Format các ô
      for (let col = 1; col <= 6 + numVegetarianCols + daysInMonth; col++) {
        const cell = row.getCell(col);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Highlight các cột ngày chay có đăng ký
        if (col >= 7 && col < 7 + numVegetarianCols) {
          const vegDayIndex = col - 7;
          const vegDay = sortedVegetarianDays[vegDayIndex];
          if (userVegetarian.has(vegDay)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' }
            };
          }
        }
        
        // Highlight thứ 7 và CN trong phần chấm công
        if (col >= 7 + numVegetarianCols) {
          const dayIndex = col - 6 - numVegetarianCols;
          const date = new Date(yearNum, monthNum - 1, dayIndex);
          const dayOfWeek = date.getDay();
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD3D3D3' }
            };
          }
          // Highlight ngày chay trong phần chấm công
          else if (sortedVegetarianDays.includes(dayIndex) && userRegs.has(dayIndex)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' }
            };
          }
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

    // Set width cho các cột ngày chay
    for (let i = 0; i < numVegetarianCols; i++) {
      worksheet.getColumn(7 + i).width = 4;
    }

    // Set width cho các cột ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      worksheet.getColumn(7 + numVegetarianCols + day - 1).width = 4;
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
