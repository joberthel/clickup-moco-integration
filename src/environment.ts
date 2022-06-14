import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || `http://localhost:${{ PORT }}`;

export const CLICKUP_ID = process.env.CLICKUP_ID || '';
export const CLICKUP_SECRET = process.env.CLICKUP_SECRET || '';

export const MOCO_SUBDOMAIN = process.env.MOCO_SUBDOMAIN || '';
export const MOCO_TASK_HISTORY = parseInt(process.env.MOCO_TASK_HISTORY || '7');
export const MOCO_ADMIN_KEY = process.env.MOCO_ADMIN_KEY || '';

export const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
export const MONGODB_PORT = process.env.MONGODB_PORT || 27017;

export const MONGODB_DATABASE = process.env.MONGODB_DATABASE || '';

export const MONGODB_USER = process.env.MONGODB_USER || '';
export const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || '';
