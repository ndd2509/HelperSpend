// Transaction types
export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description?: string; // Optional — note/diễn giải
  date: string;         // YYYY-MM-DD
}

export interface UpdateTransactionRequest {
  type?: 'expense' | 'income';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}

export interface GetTransactionsParams {
  type?: 'expense' | 'income';
  startDate?: string;
  endDate?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

// Budget types
export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  limit: number;
  month: number;
  year: number;
}

export interface UpdateBudgetRequest {
  limit: number;
}

// Summary types
export interface DashboardSummary {
  balance: number;           // Tổng số dư = thu nhập nhập tay − chi tiêu (all-time)
  depositTotal?: number;     // Nguồn tiền từ ngân hàng — xử lý sau
  monthlyExpenses: number;   // Chi tiêu nhập tay tháng này
  monthlyIncome: number;     // Thu nhập nhập tay tháng này (không bao gồm nạp tiền)
  monthlyDeposit: number;    // Tiền nạp từ ngân hàng tháng này
  recentTransactions: Transaction[];
  budgets: Budget[];
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  group?: string; // Nhóm hạng mục (từ server)
}

export interface CreateCategoryRequest {
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  group?: string;
}

// Deposit Request types
export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  transactionId?: string;
}

export interface CreateDepositRequestRequest {
  amount: number;
  description: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
