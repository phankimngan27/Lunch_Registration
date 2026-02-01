import { Router } from 'express';
import { login, getProfile, refreshToken, logout } from '../controllers/authController';
import { getAllUsers, createUser, updateUser, toggleUserStatus } from '../controllers/userController';
import { createRegistration, getMyRegistrations, cancelRegistration, getRegistrationsByDate, createBulkRegistration, cancelBulkRegistration, bulkEditByUsers } from '../controllers/registrationController';
import { getStatistics, exportExcel } from '../controllers/statisticsController';
import { getDailyRegistrations, exportDailyExcel } from '../controllers/dailyRegistrationController';
import { changePassword } from '../controllers/passwordController';
import { getConfig, updateConfig } from '../controllers/configController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Madison Lunch Registration API'
  });
});

// Auth routes
router.post('/auth/login', login);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/profile', authenticate, getProfile);

// Password routes
router.post('/auth/change-password', authenticate, changePassword);

// User routes (Admin only)
router.get('/users', authenticate, isAdmin, getAllUsers);
router.post('/users', authenticate, isAdmin, createUser);
router.put('/users/:id', authenticate, isAdmin, updateUser);
router.patch('/users/:id/toggle-status', authenticate, isAdmin, toggleUserStatus);

// Registration routes
router.post('/registrations', authenticate, createRegistration);
router.get('/registrations/my', authenticate, getMyRegistrations);
router.post('/registrations/cancel', authenticate, cancelRegistration);

// Admin: Bulk registration management
router.get('/registrations/by-date', authenticate, isAdmin, getRegistrationsByDate);
router.post('/registrations/bulk-create', authenticate, isAdmin, createBulkRegistration);
router.post('/registrations/bulk-cancel', authenticate, isAdmin, cancelBulkRegistration);
router.post('/registrations/bulk-edit-by-users', authenticate, isAdmin, bulkEditByUsers);

// Statistics routes (Admin only)
router.get('/statistics', authenticate, isAdmin, getStatistics);
router.get('/statistics/export', authenticate, isAdmin, exportExcel);

// Daily registrations routes (Admin only)
router.get('/daily-registrations', authenticate, isAdmin, getDailyRegistrations);
router.get('/daily-registrations/export', authenticate, isAdmin, exportDailyExcel);

// Config routes
router.get('/config', authenticate, getConfig); // User có thể đọc config
router.put('/config', authenticate, isAdmin, updateConfig); // Chỉ admin mới update

export default router;
