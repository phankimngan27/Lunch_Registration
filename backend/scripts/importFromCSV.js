const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const employees = [];
  let dataStarted = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Tìm dòng header với STT,MÃ NV,HỌ TÊN (có thể có hoặc không có dấu ngoặc kép)
    if (line.includes('STT') && line.includes('MÃ NV') && line.includes('HỌ TÊN')) {
      dataStarted = true;
      continue;
    }
    
    if (!dataStarted) continue;
    
    // Parse dòng dữ liệu
    const parts = line.split(',');
    if (parts.length < 8) continue;
    
    const stt = parts[0].replace(/"/g, '').trim();
    if (!stt || isNaN(parseInt(stt))) continue;
    
    let employeeCode = parts[1].replace(/"/g, '').trim();
    let fullName = parts[2].replace(/"/g, '').trim();
    let role = parts[3].replace(/"/g, '').trim();
    
    // Kiểm tra xem cột 1 có phải là mã nhân viên không (có dấu chấm hoặc số)
    const hasEmployeeCode = employeeCode && (employeeCode.includes('.') || /^\d+$/.test(employeeCode));
    let columnOffset = 0; // Offset cho các cột ngày
    
    if (!hasEmployeeCode && employeeCode) {
      // Trường hợp không có mã NV: cột 1 là tên, cột 2 là role
      fullName = employeeCode;
      role = parts[2].replace(/"/g, '').trim();
      employeeCode = `TEMP${stt}`;
      columnOffset = -1; // Các cột bị lệch trái 1 cột
    } else if (!employeeCode) {
      // Cột 1 trống
      employeeCode = `TEMP${stt}`;
    }
    
    if (!fullName) continue;
    
    // Parse các ngày đăng ký (từ cột 7 trở đi, tương ứng với ngày 1-31)
    // Lưu ý: Cột 6 là "ĐÃ NHẬN", không phải ngày đăng ký
    const registrationDays = [];
    
    // Kiểm tra xem cột 6 có x không (cột ĐÃ NHẬN)
    const col6HasX = parts[6 + columnOffset] && parts[6 + columnOffset].replace(/"/g, '').trim().toLowerCase() === 'x';
    
    for (let day = 1; day <= 31; day++) {
      const colIndex = 6 + day + columnOffset; // Cột 7 là ngày 1, cột 8 là ngày 2, ... (có điều chỉnh offset)
      if (colIndex < parts.length) {
        const value = parts[colIndex].replace(/"/g, '').trim().toLowerCase();
        if (value === 'x') {
          // Nếu cột 6 có x, thì các ngày bị lệch: cột 7 thực ra là cột 6 (bỏ qua)
          // Nhưng logic hiện tại đã đúng vì ta bắt đầu từ day=1 → colIndex=7
          registrationDays.push(day);
        }
      }
    }
    
    // Nếu cột 6 có x, cần parse lại vì các cột bị lệch
    if (col6HasX && registrationDays.length > 0) {
      // Xóa và parse lại với offset +1
      registrationDays.length = 0;
      for (let day = 1; day <= 31; day++) {
        const colIndex = 5 + day + columnOffset; // Lệch 1 cột vì cột 6 có x
        if (colIndex < parts.length) {
          const value = parts[colIndex].replace(/"/g, '').trim().toLowerCase();
          if (value === 'x') {
            registrationDays.push(day);
          }
        }
      }
    }
    
    // Parse thông tin ăn chay cho 2 ngày đặc biệt (06/10 và 21/10)
    // Cột 38 là ngày 21/10, cột 39 là ngày 6/10 (có điều chỉnh offset)
    // Nếu cột 6 có x, các cột ăn chay cũng bị lệch
    let vegOffset = columnOffset;
    if (col6HasX) {
      vegOffset = columnOffset - 1; // Lệch thêm 1 cột
    }
    
    const vegCol21 = 38 + vegOffset; // 21/10 (01/09 AL)
    const vegCol6 = 39 + vegOffset; // 06/10 (15/08 AL)
    
    const isVeg6 = parts[vegCol6] && parts[vegCol6].replace(/"/g, '').trim().toLowerCase() === 'x';
    const isVeg21 = parts[vegCol21] && parts[vegCol21].replace(/"/g, '').trim().toLowerCase() === 'x';
    
    employees.push({
      employeeCode: employeeCode || `TEMP${stt}`,
      fullName,
      role, // Lưu role thay vì department
      registrationDays,
      isVegetarianDay6: isVeg6,   // Ngày 6 có ăn chay không
      isVegetarianDay21: isVeg21  // Ngày 21 có ăn chay không
    });
  }
  
  return employees;
}

async function importData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Đọc file CSV
    const csvPath = path.join(__dirname, '../../Đăng-ký-cơm-trưa-2025.csv');
    console.log('Đang đọc file CSV:', csvPath);
    
    const employees = parseCSV(csvPath);
    console.log(`Tìm thấy ${employees.length} nhân viên`);
    
    // Default password cho tất cả user (8 rounds for faster login)
    const defaultPassword = await bcrypt.hash('1234', 8);
    
    let userCount = 0;
    let registrationCount = 0;
    
    for (const emp of employees) {
      // Tạo email từ tên theo format: ten.ho.dem@madison.dev
      // Ví dụ: Phan Thị Kim Ngân -> ngan.phan.thi.kim@madison.dev
      const nameParts = emp.fullName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '') // Loại bỏ ký tự đặc biệt
        .trim()
        .split(/\s+/); // Split theo khoảng trắng
      
      // Đảo ngược: tên trước, họ và đệm sau
      const firstName = nameParts[nameParts.length - 1]; // Tên (từ cuối)
      const middleAndLastName = nameParts.slice(0, -1); // Họ và đệm
      const emailParts = [firstName, ...middleAndLastName];
      const email = emailParts.join('.') + '@madison.dev';
      
      // Kiểm tra user đã tồn tại chưa
      const existingUser = await client.query(
        'SELECT id FROM users WHERE employee_code = $1',
        [emp.employeeCode]
      );
      
      let userId;
      
      if (existingUser.rows.length > 0) {
        // Update thông tin user
        userId = existingUser.rows[0].id;
        await client.query(
          `UPDATE users 
           SET full_name = $1, department = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [emp.fullName, emp.role, userId]
        );
        console.log(`Updated user: ${emp.fullName} (${emp.role})`);
      } else {
        // Insert user mới
        const result = await client.query(
          `INSERT INTO users (employee_code, full_name, email, password_hash, department, role)
           VALUES ($1, $2, $3, $4, $5, 'user')
           RETURNING id`,
          [emp.employeeCode, emp.fullName, email, defaultPassword, emp.role]
        );
        userId = result.rows[0].id;
        userCount++;
        console.log(`Created user: ${emp.fullName} (${emp.role})`);
      }
      
      // Xóa các đăng ký cũ của tháng 10/2025
      await client.query(
        `DELETE FROM registrations 
         WHERE user_id = $1 AND month = 10 AND year = 2025`,
        [userId]
      );
      
      // Thêm các đăng ký mới cho tháng 10/2025
      for (const day of emp.registrationDays) {
        const registrationDate = new Date(2025, 9, day); // Tháng 10 (index 9)
        
        // Kiểm tra không phải cuối tuần
        const dayOfWeek = registrationDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue; // Skip Chủ nhật và Thứ 7
        }
        
        // Kiểm tra xem ngày này có ăn chay không
        // Chỉ ngày 6 và 21 mới có thông tin ăn chay
        let isVegetarian = false;
        if (day === 6 && emp.isVegetarianDay6) {
          isVegetarian = true;
        } else if (day === 21 && emp.isVegetarianDay21) {
          isVegetarian = true;
        }
        
        await client.query(
          `INSERT INTO registrations (user_id, registration_date, month, year, status, is_vegetarian)
           VALUES ($1, $2, 10, 2025, 'active', $3)
           ON CONFLICT (user_id, registration_date) DO UPDATE 
           SET is_vegetarian = $3`,
          [userId, registrationDate, isVegetarian]
        );
        registrationCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n=== Import hoàn tất ===');
    console.log(`Số user mới tạo: ${userCount}`);
    console.log(`Số user đã update: ${employees.length - userCount}`);
    console.log(`Tổng số đăng ký đã thêm: ${registrationCount}`);
    console.log('\nPassword mặc định cho tất cả user: 1234');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi import:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importData().catch(console.error);
