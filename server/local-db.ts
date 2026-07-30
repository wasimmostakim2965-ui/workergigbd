/**
 * Local Demo Database for Development/Testing
 * Returns demo data without actual database connection
 */

console.log("📦 Using LOCAL demo database (no external database needed)");

// Demo data storage (in-memory)
let users: any[] = [
  { id: 1, userId: '1000000001', openId: 'admin_openid_001', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', phone: '01710000000', paymentMethod: 'bkash', rating: '4.8', totalRatings: 15, createdAt: new Date().toISOString(), lastSignedIn: new Date().toISOString() },
  { id: 2, userId: '1000000002', openId: 'openid_1000000002', name: 'Rahim Ahmed', email: 'rahim@example.com', role: 'user', status: 'active', phone: '01810000001', paymentMethod: 'bkash', rating: '4.5', totalRatings: 8, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastSignedIn: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 3, userId: '1000000003', openId: 'openid_1000000003', name: 'Fatema Begum', email: 'fatema@example.com', role: 'user', status: 'active', phone: '01810000002', paymentMethod: 'nagad', rating: '4.2', totalRatings: 5, createdAt: new Date(Date.now() - 86400000 * 25).toISOString(), lastSignedIn: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 4, userId: '1000000004', openId: 'openid_1000000004', name: 'Kamal Hossain', email: 'kamal@example.com', role: 'user', status: 'banned', phone: '01810000003', paymentMethod: 'bkash', rating: '3.8', totalRatings: 3, createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), lastSignedIn: new Date(Date.now() - 86400000 * 10).toISOString(), banReason: 'Fraudulent activity detected' },
  { id: 5, userId: '1000000005', openId: 'openid_1000000005', name: 'Nusrat Jahan', email: 'nusrat@example.com', role: 'user', status: 'suspended', phone: '01810000004', paymentMethod: 'bank', rating: '4.6', totalRatings: 12, createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), lastSignedIn: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 6, userId: '1000000006', openId: 'openid_1000000006', name: 'Sorif Miya', email: 'sorif@example.com', role: 'user', status: 'active', phone: '01810000005', paymentMethod: 'rocket', rating: '4.1', totalRatings: 6, createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), lastSignedIn: new Date(Date.now() - 86400000 * 3).toISOString() },
];

let jobs: any[] = [
  { id: 1, title: 'Facebook Like & Share', description: 'Like and share Facebook pages to earn money', category: 'Social Media', pay: '15', timeRequired: 5, totalSlots: 50, slotsRemaining: 35, workersCompleted: 15, rating: '4.5', status: 'active', isPinned: 1, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 2, title: 'YouTube Subscribe', description: 'Subscribe to YouTube channels', category: 'Social Media', pay: '25', timeRequired: 10, totalSlots: 30, slotsRemaining: 22, workersCompleted: 8, rating: '4.7', status: 'active', isPinned: 1, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 3, title: 'Data Entry Work', description: 'Enter data from images to text', category: 'Freelancing', pay: '50', timeRequired: 30, totalSlots: 100, slotsRemaining: 80, workersCompleted: 20, rating: '4.3', status: 'active', isPinned: 0, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 4, title: 'App Download & Install', description: 'Download and install apps, take screenshots', category: 'App Testing', pay: '35', timeRequired: 15, totalSlots: 200, slotsRemaining: 150, workersCompleted: 50, rating: '4.6', status: 'active', isPinned: 0, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 5, title: 'Survey Completion', description: 'Complete online surveys and share results', category: 'Research', pay: '40', timeRequired: 20, totalSlots: 75, slotsRemaining: 60, workersCompleted: 15, rating: '4.4', status: 'paused', isPinned: 0, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
];

let withdrawals: any[] = [
  { id: 1, userId: 2, amount: '500', paymentMethod: 'bkash', paymentNumber: '01710000001', status: 'pending', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 2, userId: 3, amount: '1000', paymentMethod: 'nagad', paymentNumber: '01810000002', status: 'pending', createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString() },
  { id: 3, userId: 4, amount: '750', paymentMethod: 'bkash', paymentNumber: '01710000003', status: 'approved', adminNote: 'Approved manually', processedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 4, userId: 5, amount: '2000', paymentMethod: 'bank', paymentNumber: '1234567890', status: 'pending', createdAt: new Date(Date.now() - 86400000 * 0.3).toISOString() },
  { id: 5, userId: 6, amount: '350', paymentMethod: 'rocket', paymentNumber: '01910000005', status: 'rejected', adminNote: 'Insufficient balance', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

let notifications: any[] = [];
let activityLogs: any[] = [
  { id: 1, userId: 2, action: 'User Login', details: 'Logged in successfully', ipAddress: '192.168.1.100', createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString() },
  { id: 2, userId: 3, action: 'Job Completed', details: 'Completed: Facebook Like & Share', ipAddress: '192.168.1.101', createdAt: new Date(Date.now() - 86400000 * 0.4).toISOString() },
  { id: 3, userId: 5, action: 'Withdrawal Request', details: 'Requested ৳2000 withdrawal', ipAddress: '192.168.1.102', createdAt: new Date(Date.now() - 86400000 * 0.3).toISOString() },
  { id: 4, userId: 1, action: 'Status changed to banned', details: 'Reason: Fraudulent activity detected', ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 5, userId: 4, action: 'User Login', details: 'Logged in successfully', ipAddress: '192.168.1.103', createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString() },
];

let deposits: any[] = [
  { id: 1, userId: 2, amount: '1000', paymentMethod: 'bkash', transactionId: 'TXN123456', note: 'Welcome bonus', addedBy: 1, status: 'approved', createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
  { id: 2, userId: 3, amount: '500', paymentMethod: 'nagad', transactionId: 'TXN789012', note: 'Initial deposit', addedBy: 1, status: 'approved', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

export default {
  // Users
  getAllUsers: () => users,
  
  getUserById: (id: number) => users.find(u => u.id === id),
  
  getUserByUserId: (userId: string) => users.find(u => u.userId === userId),
  
  searchUsers: (query: string) => {
    // Try exact userId first
    let results = users.filter(u => u.userId === query);
    if (results.length > 0) return results;
    // Then search by name or email
    const q = query.toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    );
  },
  
  updateUserStatus: (userId: number, status: string, banReason?: string, suspendedUntil?: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      user.banReason = banReason || undefined;
      user.suspendedUntil = suspendedUntil || undefined;
      user.updatedAt = new Date().toISOString();
    }
  },
  
  // Jobs
  getJobs: () => jobs,
  
  updateJob: (id: number, data: Record<string, any>) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      Object.assign(job, data);
      job.updatedAt = new Date().toISOString();
    }
  },
  
  deleteJob: (id: number) => {
    const idx = jobs.findIndex(j => j.id === id);
    if (idx !== -1) jobs.splice(idx, 1);
  },
  
  // Withdrawals
  getWithdrawalRequests: () => withdrawals,
  
  updateWithdrawalStatus: (id: number, status: string, adminNote?: string) => {
    const w = withdrawals.find(w => w.id === id);
    if (w) {
      w.status = status;
      w.adminNote = adminNote;
      w.processedAt = new Date().toISOString();
      w.updatedAt = new Date().toISOString();
    }
  },
  
  // Notifications
  createNotification: (data: { userId: number; title: string; message?: string; type?: string }) => {
    notifications.push({
      id: notifications.length + 1,
      ...data,
      isRead: 0,
      type: data.type || 'info',
      createdAt: new Date().toISOString()
    });
  },
  
  // Logs
  getActivityLogs: (limit = 100) => activityLogs.slice(0, limit),
  
  logActivity: (data: { userId?: number; action: string; details?: string; ipAddress?: string }) => {
    activityLogs.push({
      id: activityLogs.length + 1,
      ...data,
      createdAt: new Date().toISOString()
    });
  },
  
  // Deposits
  getAllDeposits: () => deposits,
  
  addUserDeposit: (data: { userId: number; amount: number; paymentMethod: string; transactionId?: string; note?: string; addedBy: number }) => {
    deposits.push({
      id: deposits.length + 1,
      ...data,
      amount: String(data.amount),
      status: 'approved',
      createdAt: new Date().toISOString()
    });
  },
  
  // User Balance
  getUserBalance: (userId: number) => {
    return {
      id: userId,
      userId,
      earning: '1250.000',
      deposit: '500.000',
      totalWithdrawn: '750.000'
    };
  },
  
  // Stats
  getAdminStats: () => {
    const activeUsers = users.filter(u => u.status === 'active').length;
    const bannedUsers = users.filter(u => u.status === 'banned').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
    
    return {
      totalUsers: users.length,
      activeUsers,
      bannedUsers,
      suspendedUsers,
      totalJobs: jobs.length,
      activeJobs,
      totalWithdrawals: withdrawals.length,
      pendingWithdrawals,
      todayWithdrawals: 2,
      todayWithdrawalAmount: 1500,
      totalWithdrawn,
      totalDeposits,
      todayDeposits: 1,
      todayDepositAmount: 500,
      totalEarnings: 12500,
    };
  },
  
  // Detailed user info
  getUserDetailedInfo: (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    return {
      user,
      balance: {
        id: userId,
        userId,
        earning: '1250.000',
        deposit: '500.000',
        totalWithdrawn: '750.000'
      },
      reviews: [],
      recentEarnings: [],
      recentWithdrawals: withdrawals.filter(w => w.userId === userId),
      recentDeposits: deposits.filter(d => d.userId === userId),
      totalEarnings: 1250,
      totalWithdrawals: withdrawals.filter(w => w.userId === userId).reduce((sum, w) => sum + Number(w.amount), 0),
      totalDeposits: deposits.filter(d => d.userId === userId).reduce((sum, d) => sum + Number(d.amount), 0),
    };
  },
};
