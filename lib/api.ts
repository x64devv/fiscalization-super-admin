import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE, timeout: 30_000, headers: { 'Content-Type': 'application/json' } });

  client.interceptors.request.use((config) => {
    const token = Cookies.get('zimra_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        Cookies.remove('zimra_admin_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  return client;
}

const http = createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminLoginRequest  { username: string; password: string; }
export interface AdminLoginResponse { token: string; expiresAt: string; username: string; role: string; }

export interface Taxpayer {
  id: number; tin: string; name: string; vat_number?: string; status: string;
  taxpayer_day_max_hrs: number; taxpayer_day_end_notification_hrs: number;
  qr_url: string; created_at: string; updated_at: string;
}

export interface CreateTaxpayerReq {
  tin: string; name: string; vatNumber?: string; status?: string;
  taxPayerDayMaxHrs?: number; taxpayerDayEndNotificationHrs?: number; qrUrl?: string;
}

export interface Address { province: string; city: string; street: string; houseNo: string; }
export interface Contacts { phoneNo?: string; email?: string; }

export interface Device {
  id: number; device_id: number; taxpayer_id: number; device_serial_no: string;
  device_model_name: string; device_model_version: string; activation_key?: string;
  operating_mode: number; status: string; branch_name: string;
  branch_address: Address; branch_contacts?: Contacts;
  certificate_valid_till: string; created_at: string; updated_at: string;
}

export interface ProvisionDeviceReq {
  deviceID: number; taxpayerID: number; deviceSerialNo: string;
  deviceModelName: string; deviceModelVersion: string; activationKey: string;
  operatingMode?: number; branchName: string; branchAddress: Address; branchContacts?: Contacts;
}

export interface FiscalDay {
  id: number; deviceID: number; fiscalDayNo: number; fiscalDayOpened: string;
  fiscalDayClosed?: string; status: number; lastReceiptGlobalNo?: number;
}

export interface Receipt {
  id: number; receiptID: number; deviceID: number; receiptType: number;
  receiptCurrency: string; invoiceNo: string; receiptDate: string;
  receiptTotal: number; validationColor?: string | null; serverDate?: string;
}

export interface AuditLog {
  id: number; entityType: string; entityId?: number; action: string;
  deviceId?: number; ipAddress: string; details?: string; createdAt: string;
}

export interface SystemStats {
  totalCompanies: number; activeCompanies: number;
  totalDevices: number; activeDevices: number;
  todayReceipts: number; openFiscalDays: number;
  todayRevenue: number; validationErrors: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const adminApi = {
  login: (data: AdminLoginRequest) =>
    http.post<AdminLoginResponse>('/api/admin/login', data).then(r => r.data),

  getStats: () =>
    http.get<SystemStats>('/api/admin/stats').then(r => r.data),

  // Companies
  listCompanies: (params?: { offset?: number; limit?: number; search?: string }) =>
    http.get<{ total: number; rows: Taxpayer[] }>('/api/admin/companies', { params }).then(r => r.data),

  getCompany: (id: number) =>
    http.get<Taxpayer>(`/api/admin/companies/${id}`).then(r => r.data),

  createCompany: (data: CreateTaxpayerReq) =>
    http.post<Taxpayer>('/api/admin/companies', data).then(r => r.data),

  updateCompany: (id: number, data: Partial<CreateTaxpayerReq> & { status?: string }) =>
    http.put<Taxpayer>(`/api/admin/companies/${id}`, data).then(r => r.data),

  setCompanyStatus: (id: number, status: 'Active' | 'Inactive') =>
    http.patch(`/api/admin/companies/${id}/status`, { status }).then(r => r.data),

  listCompanyDevices: (id: number) =>
    http.get<{ total: number; rows: Device[] }>(`/api/admin/companies/${id}/devices`).then(r => r.data),

  // Devices
  listDevices: (params?: { offset?: number; limit?: number }) =>
    http.get<{ total: number; rows: Device[] }>('/api/admin/devices', { params }).then(r => r.data),

  provisionDevice: (data: ProvisionDeviceReq) =>
    http.post<Device>('/api/admin/devices', data).then(r => r.data),

  setDeviceStatus: (deviceID: number, status: 'Active' | 'Blocked' | 'Revoked') =>
    http.patch(`/api/admin/devices/${deviceID}/status`, { status }).then(r => r.data),

  setDeviceMode: (deviceID: number, mode: 0 | 1) =>
    http.patch(`/api/admin/devices/${deviceID}/mode`, { mode }).then(r => r.data),

  // Cross-tenant views
  listFiscalDays: (params?: { taxpayerID?: number; deviceID?: number; offset?: number; limit?: number }) =>
    http.get<{ total: number; rows: FiscalDay[] }>('/api/admin/fiscal-days', { params }).then(r => r.data),

  listReceipts: (params?: { taxpayerID?: number; deviceID?: number; from?: string; to?: string; offset?: number; limit?: number }) =>
    http.get<{ total: number; rows: Receipt[] }>('/api/admin/receipts', { params }).then(r => r.data),

  listAuditLogs: (params?: { entityType?: string; entityID?: number; offset?: number; limit?: number }) =>
    http.get<{ total: number; rows: AuditLog[] }>('/api/admin/audit', { params }).then(r => r.data),
};
