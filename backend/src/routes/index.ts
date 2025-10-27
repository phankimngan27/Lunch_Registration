import { Router } from 'express';
import { login, getProfile } from '../controllers/authController';
import { getAllUsers, createUser, updateUser, toggleUserStatus } from '../controllers/userController';
import { createRegistration, getMyRegistrations, cancelRegistration } from '../controllers/registrationController';
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

// Statistics routes (Admin only)
router.get('/statistics', authenticate, isAdmin, getStatistics);
router.get('/statistics/export', authenticate, isAdmin, exportExcel);

// Daily registrations routes (Admin only)
router.get('/daily-registrations', authenticate, isAdmin, getDailyRegistrations);
router.get('/daily-registrations/export', authenticate, isAdmin, exportDailyExcel);

// Config routes (Admin only)
router.get('/config', authenticate, isAdmin, getConfig);
router.put('/config', authenticate, isAdmin, updateConfig);

export default router;
