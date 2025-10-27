import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Endpoint kiểm tra schema của database
router.get('/check-schema', async (req: Request, res: Response) => {
  try {
    // Kiểm tra cấu trúc bảng daily_registrations
    // Kiểm tra bảng daily_registrations
    const dailyRegQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'daily_registrations' 
      ORDER BY ordinal_position;
    `;
    
    const dailyRegResult = await pool.query(dailyRegQuery);
    const hasDailyRegTable = dailyRegResult.rows.length > 0;
    const hasDailyRegVegColumn = dailyRegResult.rows.some(
      row => row.column_name === 'is_vegetarian'
    );
    
    // Kiểm tra bảng registrations (bảng cũ)
    const regQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'registrations' 
      ORDER BY ordinal_position;
    `;
    
    const regResult = await pool.query(regQuery);
    const hasRegTable = regResult.rows.length > 0;
    const hasRegVegColumn = regResult.rows.some(
      row => row.column_name === 'is_vegetarian'
    );
    
    // Đếm số lượng records
    let dataStats = { total: 0, vegetarian: 0 };
    
    if (hasDailyRegTable) {
      const countQuery = `
        SELECT 
          COUNT(*) as total,
          ${hasDailyRegVegColumn ? "COUNT(*) FILTER (WHERE is_vegetarian = true) as vegetarian" : "0 as vegetarian"}
        FROM daily_registrations;
      `;
      const countResult = await pool.query(countQuery);
      dataStats = {
        total: parseInt(countResult.rows[0].total),
        vegetarian: parseInt(countResult.rows[0].vegetarian)
      };
    } else if (hasRegTable) {
      const countQuery = `
        SELECT 
          COUNT(*) as total,
          ${hasRegVegColumn ? "COUNT(*) FILTER (WHERE is_vegetarian = true) as vegetarian" : "0 as vegetarian"}
        FROM registrations;
      `;
      const countResult = await pool.query(countQuery);
      dataStats = {
        total: parseInt(countResult.rows[0].total),
        vegetarian: parseInt(countResult.rows[0].vegetarian)
      };
    }
    
    // Xác định trạng thái migration
    let migrationStatus = 'NOT_STARTED';
    let message = '';
    
    if (hasDailyRegTable && hasDailyRegVegColumn) {
      migrationStatus = 'COMPLETED';
      message = '✅ Database đã được migrate hoàn toàn! Bảng daily_registrations và cột is_vegetarian đã tồn tại.';
    } else if (hasDailyRegTable && !hasDailyRegVegColumn) {
      migrationStatus = 'PARTIAL';
      message = '⚠️ Bảng daily_registrations đã tồn tại nhưng thiếu cột is_vegetarian!';
    } else if (hasRegTable && hasRegVegColumn) {
      migrationStatus = 'OLD_SCHEMA_WITH_VEG';
      message = '⚠️ Đang dùng bảng registrations cũ nhưng đã có cột is_vegetarian. Cần migrate sang daily_registrations!';
    } else if (hasRegTable && !hasRegVegColumn) {
      migrationStatus = 'OLD_SCHEMA';
      message = '❌ Đang dùng bảng registrations cũ và chưa có cột is_vegetarian. Cần migrate!';
    } else {
      migrationStatus = 'NO_TABLES';
      message = '❌ Không tìm thấy bảng registrations hoặc daily_registrations!';
    }
    
    res.json({
      success: true,
      tables: {
        daily_registrations: {
          exists: hasDailyRegTable,
          columns: dailyRegResult.rows,
          hasVegetarianColumn: hasDailyRegVegColumn
        },
        registrations: {
          exists: hasRegTable,
          columns: regResult.rows,
          hasVegetarianColumn: hasRegVegColumn
        }
      },
      data: dataStats,
      migrationStatus,
      message
    });
    
  } catch (error: any) {
    console.error('Check schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra schema',
      error: error.message
    });
  }
});

export default router;
