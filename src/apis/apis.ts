import AuthService, { EKeyAsyncStorage } from '../services/AuthService';
import { client } from './config';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  GetTransactionsParams,
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  DashboardSummary,
  MonthlyStats,
  Category,
  CreateCategoryRequest,
  DepositRequest,
  ApiResponse,
} from './types';

export const getAccessToken = async () => {
  const section = await AuthService.shared.getCredentials(
    EKeyAsyncStorage.SECTION_KEY,
  );
  try {
    const accessToken = section && JSON.parse(section)?.accessToken;

    return accessToken;
  } catch {
    return null;
  }
};

export const requestCheckPhone = async (phone: string): Promise<any> => {
  try {
    const res = await client.post('/auth/check-phone', { phone });
    return res;
  } catch (error: any) {
    console.error('requestCheckPhone error:', error);
    throw error;
  }
};

export const requestLogin = async (
  phone: string,
  password: string,
): Promise<any> => {
  try {
    const res = await client.post('/auth/login', { phone, password });
    return res;
  } catch (error: any) {
    console.error('requestLogin error:', error);
    throw error;
  }
};

export const requestRegister = async (
  phone: string,
  password: string,
  name: string,
): Promise<any> => {
  try {
    const res = await client.post('/auth/register', { phone, password, name });
    return res;
  } catch (error: any) {
    console.error('requestRegister error:', error);
    throw error;
  }
};

export const requestLogout = async (): Promise<any> => {
  try {
    const section = await AuthService.shared.getCredentials(
      EKeyAsyncStorage.SECTION_KEY,
    );
    const refreshToken = section && JSON.parse(section)?.refreshToken;

    if (!refreshToken) {
      throw new Error('Không tìm thấy refresh token');
    }

    const res = await client.post('/auth/logout', { refreshToken });
    return res;
  } catch (error: any) {
    console.error('requestLogout error:', error);
    throw error;
  }
};

export const uploadImage = async (
  imageUri: string,
  fileName?: string,
  onProgress?: (progress: number) => void,
): Promise<any> => {
  try {
    console.log('Starting image upload...', { imageUri, fileName });

    const formData = new FormData();

    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName || `image_${Date.now()}.jpg`,
    };

    formData.append('image', file as any);

    console.log('Sending request to server...');
    const res = await client.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes
      onUploadProgress: progressEvent => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          onProgress?.(percentCompleted);
        }
      },
    });

    console.log('Upload successful:', res.data);
    return res;
  } catch (error: any) {
    console.error('uploadImage error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

export const uploadMultipleImages = async (
  images: Array<{ uri: string; fileName?: string }>,
): Promise<any> => {
  try {
    const formData = new FormData();

    images.forEach((image, index) => {
      const file = {
        uri: image.uri,
        type: 'image/jpeg',
        name: image.fileName || `image_${Date.now()}_${index}.jpg`,
      };

      formData.append('images', file as any);
    });

    const res = await client.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res;
  } catch (error: any) {
    console.error('uploadMultipleImages error:', error);
    throw error;
  }
};

export const getUserImages = async (): Promise<any> => {
  try {
    const res = await client.get('/upload/images');
    return res;
  } catch (error: any) {
    console.error('getUserImages error:', error);
    throw error;
  }
};

export const deleteImage = async (imageId: string): Promise<any> => {
  try {
    const res = await client.delete(`/upload/image/${imageId}`);
    return res;
  } catch (error: any) {
    console.error('deleteImage error:', error);
    throw error;
  }
};

// ==================== TRANSACTION APIs ====================

/**
 * Create a new transaction (expense or income)
 */
export const createTransaction = async (
  data: CreateTransactionRequest,
): Promise<ApiResponse<Transaction>> => {
  try {
    const res = await client.post('/transactions', data);
    return res.data;
  } catch (error: any) {
    console.error('createTransaction error:', error);
    throw error;
  }
};

/**
 * Get transactions with optional filters
 */
export const getTransactions = async (
  params?: GetTransactionsParams,
): Promise<ApiResponse<Transaction[]>> => {
  try {
    const res = await client.get('/transactions', { params });
    return res.data;
  } catch (error: any) {
    console.error('getTransactions error:', error);
    throw error;
  }
};

/**
 * Get a single transaction by ID
 */
export const getTransactionById = async (
  id: string,
): Promise<ApiResponse<Transaction>> => {
  try {
    const res = await client.get(`/transactions/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('getTransactionById error:', error);
    throw error;
  }
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  id: string,
  data: UpdateTransactionRequest,
): Promise<ApiResponse<Transaction>> => {
  try {
    const res = await client.put(`/transactions/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error('updateTransaction error:', error);
    throw error;
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  id: string,
): Promise<ApiResponse<void>> => {
  try {
    const res = await client.delete(`/transactions/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('deleteTransaction error:', error);
    throw error;
  }
};

// ==================== SUMMARY APIs ====================

/**
 * Get dashboard summary including balance, monthly stats, recent transactions, and budgets
 */
export const getDashboardSummary = async (
  month?: number,
  year?: number,
): Promise<ApiResponse<DashboardSummary>> => {
  try {
    const params: any = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const res = await client.get('/summary/dashboard', { params });
    return res.data;
  } catch (error: any) {
    console.error('getDashboardSummary error:', error);
    throw error;
  }
};

/**
 * Get current total balance
 */
export const getBalance = async (): Promise<
  ApiResponse<{ balance: number }>
> => {
  try {
    const res = await client.get('/summary/balance');
    return res.data;
  } catch (error: any) {
    console.error('getBalance error:', error);
    throw error;
  }
};

/**
 * Get detailed monthly statistics
 */
export const getMonthlyStats = async (
  month: number,
  year: number,
): Promise<ApiResponse<MonthlyStats>> => {
  try {
    const res = await client.get('/summary/monthly', {
      params: { month, year },
    });
    return res.data;
  } catch (error: any) {
    console.error('getMonthlyStats error:', error);
    throw error;
  }
};

// ==================== BUDGET APIs ====================

/**
 * Create a new budget for a category
 */
export const createBudget = async (
  data: CreateBudgetRequest,
): Promise<ApiResponse<Budget>> => {
  try {
    const res = await client.post('/budgets', data);
    return res.data;
  } catch (error: any) {
    console.error('createBudget error:', error);
    throw error;
  }
};

/**
 * Get all budgets with spending progress
 */
export const getBudgets = async (
  month?: number,
  year?: number,
): Promise<ApiResponse<Budget[]>> => {
  try {
    const params: any = {};
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const res = await client.get('/budgets', { params });
    return res.data;
  } catch (error: any) {
    console.error('getBudgets error:', error);
    throw error;
  }
};

/**
 * Update a budget's limit
 */
export const updateBudget = async (
  id: string,
  data: UpdateBudgetRequest,
): Promise<ApiResponse<Budget>> => {
  try {
    const res = await client.put(`/budgets/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error('updateBudget error:', error);
    throw error;
  }
};

/**
 * Delete a budget
 */
export const deleteBudget = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const res = await client.delete(`/budgets/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('deleteBudget error:', error);
    throw error;
  }
};

// ==================== CATEGORY APIs ====================

/**
 * Get all categories, optionally filtered by type
 */
export const getCategories = async (
  type?: 'expense' | 'income',
): Promise<ApiResponse<Category[]>> => {
  try {
    const params: any = {};
    if (type) params.type = type;

    const res = await client.get('/categories', { params });
    return res.data;
  } catch (error: any) {
    console.error('getCategories error:', error);
    throw error;
  }
};

/**
 * Create a custom category
 */
export const createCategory = async (
  data: CreateCategoryRequest,
): Promise<ApiResponse<Category>> => {
  try {
    const res = await client.post('/categories', data);
    return res.data;
  } catch (error: any) {
    console.error('createCategory error:', error);
    throw error;
  }
};

// ============================================
// Deposit Request APIs
// ============================================

/**
 * Create a deposit request
 */
export const createDepositRequest = async (
  amount: number,
  description: string,
): Promise<ApiResponse<DepositRequest>> => {
  try {
    const accessToken = await getAccessToken();
    const res = await client.post(
      '/deposit-requests',
      { amount, description },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return res.data;
  } catch (error: any) {
    console.error('createDepositRequest error:', error);
    throw error;
  }
};

/**
 * Get my deposit requests
 */
export const getMyDepositRequests = async (): Promise<
  ApiResponse<DepositRequest[]>
> => {
  try {
    const accessToken = await getAccessToken();
    const res = await client.get('/deposit-requests', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  } catch (error: any) {
    console.error('getMyDepositRequests error:', error);
    throw error;
  }
};

// ==================== DEVICE TOKEN APIs ====================

/**
 * Update device FCM token
 */
export const updateDeviceToken = async (
  fcmToken: string,
): Promise<ApiResponse<void>> => {
  try {
    const res = await client.post('/device/token', { fcmToken });
    return res.data;
  } catch (error: any) {
    console.error('updateDeviceToken error:', error);
    throw error;
  }
};

// ==================== WALLET APIs ====================

/**
 * Get wallet balance — dựa trên synced flag + chuyển khoản
 */
export const getWalletBalance = async (): Promise<
  ApiResponse<{
    totalDeposited: number;
    receivedTransfers: number;
    sentTransfers: number;
    walletBalance: number;
    pendingSync: number;
    syncedTotal: number;
    canSync: boolean;
    deposits: any[];
    syncHistory: any[];
    transferHistory: any[];
  }>
> => {
  try {
    const res = await client.get('/wallet/balance');
    return res.data;
  } catch (error: any) {
    console.error('getWalletBalance error:', error);
    throw error;
  }
};

// ==================== BANK INFO APIs ====================

export interface BankInfoPayload {
  bankBin: string;
  bankShortName: string;
  accountNumber: string;
  updatedAt?: string;
}

/**
 * Lấy thông tin ngân hàng của user đang đăng nhập
 */
export const getBankInfo = async (): Promise<
  ApiResponse<BankInfoPayload | null>
> => {
  try {
    const res = await client.get('/bank-info');
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { success: true, data: null };
    }
    console.error('getBankInfo error:', error);
    throw error;
  }
};

/**
 * Lưu / cập nhật thông tin ngân hàng
 */
export const updateBankInfo = async (
  payload: Omit<BankInfoPayload, 'updatedAt'>,
): Promise<ApiResponse<BankInfoPayload>> => {
  try {
    const res = await client.put('/bank-info', payload);
    return res.data;
  } catch (error: any) {
    console.error('updateBankInfo error:', error);
    throw error;
  }
};

/**
 * Tra cứu thông tin ngân hàng theo số điện thoại
 */
export const getBankInfoByPhone = async (
  phone: string,
): Promise<ApiResponse<{ name: string } & BankInfoPayload>> => {
  try {
    const res = await client.get(`/bank-info/by-phone/${phone}`);
    return res.data;
  } catch (error: any) {
    console.error('getBankInfoByPhone error:', error);
    throw error;
  }
};

/**
 * Sync từ ví — đồng bộ toàn bộ khoản Nạp tiền chưa sync, tạo 1 income transaction
 */
export const syncFromWallet = async (data: {
  category?: string;
  description?: string;
}): Promise<
  ApiResponse<{ syncedCount: number; totalAmount: number; transaction: any }>
> => {
  try {
    const res = await client.post('/wallet/sync', data);
    return res.data;
  } catch (error: any) {
    console.error('syncFromWallet error:', error);
    throw error;
  }
};

// ==================== TRANSFER APIs ====================

/**
 * Chuyển tiền đến người nhận qua số điện thoại
 * Tạo expense cho người gửi + income cho người nhận
 */
export const requestTransfer = async (data: {
  recipientPhone: string;
  amount: number;
  note?: string;
}): Promise<ApiResponse<any>> => {
  try {
    const res = await client.post('/transfer', data);
    return res.data;
  } catch (error: any) {
    console.error('requestTransfer error:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử chuyển tiền (cả gửi và nhận)
 */
export const getTransferHistory = async (): Promise<ApiResponse<any[]>> => {
  try {
    const res = await client.get('/transfer/history');
    return res.data;
  } catch (error: any) {
    console.error('getTransferHistory error:', error);
    throw error;
  }
};

/**
 * Kiểm tra số dư ví trước khi cho quét QR chuyển tiền
 */
export const checkWalletForTransfer = async (): Promise<
  ApiResponse<{ walletBalance: number; canTransfer: boolean }>
> => {
  try {
    const res = await client.get('/transfer/wallet-check');
    return res.data;
  } catch (error: any) {
    console.error('checkWalletForTransfer error:', error);
    throw error;
  }
};

// ==================== AI ANALYSIS APIs ====================

/**
 * Phân tích tài chính bằng AI
 * @param data { type: 'expense' | 'income' | 'financial', month?, year? }
 */
export const getAIAnalysis = async (data: {
  type: 'expense' | 'income' | 'financial' | 'category';
  month?: number;
  year?: number;
}): Promise<
  ApiResponse<{
    type: string;
    month: number;
    year: number;
    analysis: string;
    summary: {
      totalIncome: number;
      totalExpense: number;
      balance: number;
      savingRate: number;
    };
    chartData?: {
      categoryBreakdown: { category: string; amount: number }[];
      incomeBreakdown: { category: string; amount: number }[];
      trend: { month: number; income: number; expense: number }[];
    };
  }>
> => {
  try {
    const res = await client.post('/ai/analyze', data);
    return res.data;
  } catch (error: any) {
    console.error('getAIAnalysis error:', error);
    throw error;
  }
};

// ============ AI Chat ============
export const sendChatMessage = async (data: {
  message: string;
  history?: { role: string; content: string }[];
}): Promise<{
  success: boolean;
  data: {
    reply: string;
    timestamp: string;
  };
}> => {
  try {
    const res = await client.post('/ai/chat', data);
    return res.data;
  } catch (error: any) {
    console.error('sendChatMessage error:', error);
    throw error;
  }
};

export const exportTransactionsExcel = async (): Promise<{
  success: boolean;
  data?: {
    fileName: string;
    downloadPath: string;
    totalTransactions: number;
    months: string[];
  };
  message?: string;
}> => {
  try {
    const res = await client.get('/export/transactions');
    return res.data;
  } catch (error: any) {
    console.error('exportTransactionsExcel error:', error);
    throw error;
  }
};

// ─── Group Fund APIs ──────────────────────────────────────────────────────────

export const createGroupFund = async (data: {
  name: string;
  description?: string;
  emoji?: string;
  targetAmount?: number;
}): Promise<any> => {
  try {
    const res = await client.post('/group-funds', data);
    return res.data;
  } catch (error: any) {
    console.error('createGroupFund error:', error);
    throw error;
  }
};

export const getGroupFunds = async (): Promise<any> => {
  try {
    const res = await client.get('/group-funds');
    return res.data;
  } catch (error: any) {
    console.error('getGroupFunds error:', error);
    throw error;
  }
};

export const getGroupFundPublic = async (id: string): Promise<any> => {
  try {
    const res = await client.get(`/group-funds/${id}/public`);
    return res.data;
  } catch (error: any) {
    console.error('getGroupFundPublic error:', error);
    throw error;
  }
};

export const getGroupFundById = async (id: string): Promise<any> => {
  try {
    const res = await client.get(`/group-funds/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('getGroupFundById error:', error);
    throw error;
  }
};

export const inviteGroupFundMember = async (
  fundId: string,
  phone: string,
): Promise<any> => {
  try {
    const res = await client.post(`/group-funds/${fundId}/invite`, { phone });
    return res.data;
  } catch (error: any) {
    console.error('inviteGroupFundMember error:', error);
    throw error;
  }
};

export const contributeToGroupFund = async (
  fundId: string,
  data: { amount: number; note?: string },
): Promise<any> => {
  try {
    const res = await client.post(`/group-funds/${fundId}/contribute`, data);
    return res.data;
  } catch (error: any) {
    console.error('contributeToGroupFund error:', error);
    throw error;
  }
};

export const deleteGroupFund = async (fundId: string): Promise<any> => {
  try {
    const res = await client.delete(`/group-funds/${fundId}`);
    return res.data;
  } catch (error: any) {
    console.error('deleteGroupFund error:', error);
    throw error;
  }
};

export const updateGroupFund = async (
  fundId: string,
  data: {
    name?: string;
    emoji?: string;
    description?: string;
    targetAmount?: number;
  },
): Promise<any> => {
  try {
    const res = await client.patch(`/group-funds/${fundId}`, data);
    return res.data;
  } catch (error: any) {
    console.error('updateGroupFund error:', error);
    throw error;
  }
};

/**
 * Chi tiền từ quỹ nhóm sang người nhận qua số điện thoại (quét QR)
 * Trừ tiền từ quỹ và tạo expense activity
 */
export const spendFromGroupFund = async (
  fundId: string,
  data: {
    recipientPhone: string;
    amount: number;
    note?: string;
  },
): Promise<any> => {
  try {
    const res = await client.post(`/group-funds/${fundId}/spend`, data);
    return res.data;
  } catch (error: any) {
    console.error('spendFromGroupFund error:', error);
    throw error;
  }
};

export const chatGroupFundAI = async (data: {
  message: string;
  history?: { role: string; content: string }[];
}): Promise<{
  success: boolean;
  data: { reply: string; timestamp: string };
}> => {
  try {
    const res = await client.post('/group-funds/ai-chat', data);
    return res.data;
  } catch (error: any) {
    console.error('chatGroupFundAI error:', error);
    throw error;
  }
};

/**
 * Update user avatar URL
 */
export const updateAvatar = async (avatarUrl: string): Promise<any> => {
  try {
    const res = await client.put('/auth/profile/avatar', { avatarUrl });
    return res.data;
  } catch (error: any) {
    console.error('updateAvatar error:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Account Management APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const createAccount = async (data: {
  name: string;
  balance: number;
  type: string;
  currency: string;
  note?: string;
  excludeFromReports?: boolean;
  icon?: string;
}): Promise<any> => {
  try {
    const res = await client.post('/accounts', data);
    return res.data;
  } catch (error: any) {
    console.error('createAccount error:', error);
    throw error;
  }
};

export const getAccounts = async (): Promise<any> => {
  try {
    const res = await client.get('/accounts');
    return res.data;
  } catch (error: any) {
    console.error('getAccounts error:', error);
    throw error;
  }
};

export const updateAccount = async (
  id: string,
  data: {
    name?: string;
    balance?: number;
    type?: string;
    currency?: string;
    note?: string;
    excludeFromReports?: boolean;
    icon?: string;
  },
): Promise<any> => {
  try {
    const res = await client.put(`/accounts/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error('updateAccount error:', error);
    throw error;
  }
};

export const deleteAccount = async (id: string): Promise<any> => {
  try {
    const res = await client.delete(`/accounts/${id}`);
    return res.data;
  } catch (error: any) {
    console.error('deleteAccount error:', error);
    throw error;
  }
};

export const getLoans = async (): Promise<ApiResponse<import('./types').Loan[]>> => {
  try {
    const res = await client.get('/loans');
    return res.data;
  } catch (error: any) {
    console.error('getLoans error:', error);
    throw error;
  }
};

export const markLoanAsPaid = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const res = await client.put(`/loans/${id}/paid`);
    return res.data;
  } catch (error: any) {
    console.error('markLoanAsPaid error:', error);
    throw error;
  }
};

export const getLoanSummary = async (): Promise<ApiResponse<{ totalDebt: number; totalLent: number; loanCount: number; lentCount: number }>> => {
  try {
    const res = await client.get('/loans/summary');
    return res.data;
  } catch (error: any) {
    console.error('getLoanSummary error:', error);
    throw error;
  }
};

export const setDefaultAccount = async (id: string): Promise<any> => {
  try {
    const res = await client.put(`/accounts/${id}/set-default`);
    return res.data;
  } catch (error: any) {
    console.error('setDefaultAccount error:', error);
    throw error;
  }
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await client.post('/auth/profile/change-password', data);
    return res.data;
  } catch (error: any) {
    console.error('changePassword error:', error);
    throw error;
  }
};

export const updateProfile = async (data: {
  name: string;
}): Promise<{ success: boolean; message: string; data?: { user: any } }> => {
  try {
    const res = await client.put('/auth/profile', data);
    return res.data;
  } catch (error: any) {
    console.error('updateProfile error:', error);
    throw error;
  }
};
