import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import pool from '../config/database';
import { logger } from '../utils/logger';

// Helper function to build query with filters
const buildRegistrationQuery = (date: string, department?: string, meal_type?: string) => {
  let query = `
    SELECT 
      u.id, u.employee_code, u.full_name, u.email, u.department, u.project,
      r.is_vegetarian, r.registration_date
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.registration_date = $1 AND r.status = 'active'
      AND u.employee_code != 'admin' 
      AND u.email != 'admin@madison.dev'
  `;

  const params: any[] = [date];
  let paramCount = 2;

  if (department) {
    query += ` AND u.department = $${paramCount}`;
    params.push(department);
    paramCount++;
  }

  if (meal_type === 'vegetarian') {
    query += ` AND r.is_vegetarian = true`;
  } else if (meal_type === 'normal') {
    query += ` AND r.is_vegetarian = false`;
  }

  query += ' ORDER BY u.employee_code';

  return { query, params };
};

// Helper function to get lunch price
const getLunchPrice = async (): Promise<number> => {
  const result = await pool.query(
    `SELECT value FROM settings WHERE key = 'lunch_price'`
  );
  return result.rows[0]?.value || 20000;
};

export const getDailyRegistrations = async (req: Request, res: Response) => {
  try {
    const { date, department, meal_type } = req.query;

    logger.debug('getDailyRegistrations', { date, department, meal_type });

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
    }

    // Get lunch price and build query
    const lunchPrice = await getLunchPrice();
    const { query, params } = buildRegistrationQuery(
      date as string, 
      department as string, 
      meal_type as string
    );

    logger.dbQuery(query, params);
    const result = await pool.query(query, params);

    // Calculate summary
    const totalPeople = result.rows.length;
    const normalCount = result.rows.filter(r => !r.is_vegetarian).length;
    const vegetarianCount = result.rows.filter(r => r.is_vegetarian).length;
    const totalAmount = totalPeople * lunchPrice;

    logger.info('Daily registrations retrieved', {
      date,
      totalPeople,
      normalCount,
      vegetarianCount
    });

    res.json({
      summary: {
        total_people: totalPeople,
        normal_count: normalCount,
        vegetarian_count: vegetarianCount,
        total_amount: totalAmount,
        lunch_price: lunchPrice
      },
      registrations: result.rows
    });
  } catch (error: any) {
    logger.error('Failed to get daily registrations', error, { 
      date: req.query.date, 
      department: req.query.department, 
      meal_type: req.query.meal_type 
    });
    res.status(500).json({ 
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const exportDailyExcel = async (req: Request, res: Response) => {
  try {
    const { date, department, meal_type } = req.query;

    logger.debug('exportDailyExcel', { date, department, meal_type });

    if (!date) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày' });
    }

    // Get lunch price and registrations
    const lunchPrice = await getLunchPrice();
    const { query, params } = buildRegistrationQuery(
      date as string, 
      department as string, 
      meal_type as string
    );

    const result = await pool.query(query, params);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đăng ký');

    // Format date for display
    const dateObj = new Date(date as string);
    const formattedDate = dateObj.toLocaleDateString('vi-VN');

    // Title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `DANH SÁCH ĐĂNG KÝ CƠM TRƯA NGÀY ${formattedDate}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    const headerRow = worksheet.getRow(3);
    headerRow.values = ['STT', 'Mã NV', 'Họ và tên', 'Email', 'Bộ phận', 'Dự án', 'Loại cơm', 'Giá'];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    // Style header
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFf97316' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Data rows
    result.rows.forEach((row: any, index: number) => {
      const dataRow = worksheet.getRow(4 + index);
      dataRow.values = [
        index + 1,
        row.employee_code || '',
        row.full_name,
        row.email,
        row.department || 'N/A',
        row.project || 'N/A',
        row.is_vegetarian ? 'Cơm chay' : 'Cơm thường',
        lunchPrice
      ];

      // Style data cells
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Format price
      dataRow.getCell(8).numFmt = '#,##0';
    });

    // Summary row
    const summaryRowIndex = 4 + result.rows.length + 1;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    const normalCount = result.rows.filter((r: any) => !r.is_vegetarian).length;
    const vegetarianCount = result.rows.filter((r: any) => r.is_vegetarian).length;
    const totalAmount = result.rows.length * lunchPrice;

    summaryRow.values = [
      '', '', 'TỔNG CỘNG:', 
      `${result.rows.length} người (${normalCount} thường, ${vegetarianCount} chay)`,
      '', '', '', totalAmount
    ];
    summaryRow.font = { bold: true };
    summaryRow.getCell(8).numFmt = '#,##0';

    // Column widths
    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 12;

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=danh-sach-${date}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
    
    logger.info('Excel exported successfully', { date, rows: result.rows.length });
  } catch (error: any) {
    logger.error('Failed to export Excel', error, { 
      date: req.query.date, 
      department: req.query.department, 
      meal_type: req.query.meal_type 
    });
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};
