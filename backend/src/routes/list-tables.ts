import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// Endpoint liệt kê tất cả các bảng trong database
router.get('/list-tables', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = t.table_schema 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      tables: result.rows,
      count: result.rows.length
    });
    
  } catch (error: any) {
    console.error('List tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi liệt kê bảng',
      error: error.message
    });
  }
});

export default router;
