import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Migration endpoint - Thêm cột is_vegetarian
router.post('/migrate-add-vegetarian', async (req: Request, res: Response) => {
  try {
    console.log('🔄 [Migration] Bắt đầu thêm cột is_vegetarian...');

    // Thêm cột is_vegetarian
    await pool.query(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT false;
    `);

    console.log('✅ [Migration] Đã thêm cột is_vegetarian');

    // Tạo index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_registrations_is_vegetarian 
      ON registrations(is_vegetarian);
    `);

    console.log('✅ [Migration] Đã tạo index cho is_vegetarian');

    // Kiểm tra kết quả
    const checkResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'registrations' AND column_name = 'is_vegetarian';
    `);

    console.log('✅ [Migration] Kết quả:', checkResult.rows);

    res.json({
      success: true,
      message: 'Migration thành công! Đã thêm cột is_vegetarian vào bảng registrations',
      column_info: checkResult.rows[0]
    });
  } catch (error: any) {
    console.error('❌ [Migration] LỖI:', error);
    console.error('❌ [Migration] Error message:', error.message);
    console.error('❌ [Migration] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi migration',
      error: error.message
    });
  }
});

// Sync vegetarian data từ local
router.post('/sync-vegetarian-data', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    console.log('🔄 [Sync] Bắt đầu sync dữ liệu is_vegetarian...');
    console.log('🔄 [Sync] Số lượng records:', data?.length || 0);

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ. Cần array với format: [{employee_code, registration_date, is_vegetarian}]'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const record of data) {
      try {
        const { employee_code, registration_date, is_vegetarian } = record;

        // Update is_vegetarian dựa trên employee_code và registration_date
        const result = await pool.query(`
          UPDATE registrations r
          SET is_vegetarian = $1, updated_at = CURRENT_TIMESTAMP
          FROM users u
          WHERE r.user_id = u.id 
            AND u.employee_code = $2 
            AND r.registration_date = $3
        `, [is_vegetarian, employee_code, registration_date]);

        if (result.rowCount && result.rowCount > 0) {
          successCount++;
          console.log(`✅ [Sync] Updated: ${employee_code} - ${registration_date} - ${is_vegetarian ? 'Chay' : 'Thường'}`);
        } else {
          errorCount++;
          console.log(`⚠️ [Sync] Không tìm thấy: ${employee_code} - ${registration_date}`);
          errors.push({ employee_code, registration_date, reason: 'Không tìm thấy record' });
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ [Sync] Lỗi update record:`, record, error.message);
        errors.push({ ...record, error: error.message });
      }
    }

    console.log(`✅ [Sync] Hoàn tất! Success: ${successCount}, Errors: ${errorCount}`);

    res.json({
      success: true,
      message: `Sync hoàn tất! Đã cập nhật ${successCount} records`,
      summary: {
        total: data.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('❌ [Sync] LỖI:', error);
    console.error('❌ [Sync] Error message:', error.message);
    console.error('❌ [Sync] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi sync data',
      error: error.message
    });
  }
});

// Export current vegetarian data (để backup hoặc compare)
router.get('/export-vegetarian-data', async (req: Request, res: Response) => {
  try {
    console.log('📤 [Export] Đang export dữ liệu is_vegetarian...');

    const result = await pool.query(`
      SELECT 
        u.employee_code,
        u.full_name,
        r.registration_date,
        r.is_vegetarian,
        r.created_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'active'
      ORDER BY r.registration_date DESC, u.employee_code
    `);

    console.log('✅ [Export] Đã export', result.rows.length, 'records');

    res.json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('❌ [Export] LỖI:', error);
    console.error('❌ [Export] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi export data',
      error: error.message
    });
  }
});

export default router;
