export interface User {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department?: string;
  project?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Registration {
  id: number;
  user_id: number;
  registration_date: Date;
  month: number;
  year: number;
  status: 'active' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  user_id: number;
  dates: string[]; // Array of dates in YYYY-MM-DD format
}

export interface StatisticsQuery {
  month: number;
  year: number;
  department?: string;
  project?: string;
}
