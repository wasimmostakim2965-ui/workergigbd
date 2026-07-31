// API Type definitions for WorkerGigBD
// This matches the deployed Vercel API

import { z } from "zod";

// ─── Shared Types ───
export interface User {
  id: number;
  openId?: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  phone?: string;
  emailVerified?: number;
}

// ─── Router Input Types ───
export const zodSchemas = {
  number: z.number(),
  string: z.string(),
  email: z.string().email(),
  optionalString: z.string().optional(),
};

// ─── App Router Type Definition ───
// This is a type-only representation - the actual router is on the server
export type AppRouter = {
  health: {
    query: () => Promise<{
      status: string;
      timestamp: string;
      version: string;
      message: string;
    }>;
  };
  stats: {
    public: {
      query: () => Promise<{ totalUsers: number; totalJobs: number }>;
    };
  };
  jobs: {
    list: {
      query: () => Promise<any[]>;
    };
    getById: {
      input: { id: number };
      query: (input: { id: number }) => Promise<any | null>;
    };
    categories: {
      query: () => Promise<string[]>;
    };
    create: {
      input: {
        title: string;
        category: string;
        pay: number | string;
      };
      mutation: (input: any) => Promise<{ success: boolean; job?: any }>;
    };
  };
  auth: {
    me: {
      query: () => Promise<User | null>;
    };
    logout: {
      mutation: () => Promise<{ success: boolean }>;
    };
    register: {
      input: { name: string; email: string; password: string };
      mutation: (input: { name: string; email: string; password: string }) => Promise<{ success: boolean; user?: User }>;
    };
    login: {
      input: { email: string; password: string };
      mutation: (input: { email: string; password: string }) => Promise<{ success: boolean; user?: User }>;
    };
    verifyEmail: {
      input: { token: string };
      mutation: (input: { token: string }) => Promise<{ success: boolean }>;
    };
    resendVerification: {
      mutation: () => Promise<{ success: boolean }>;
    };
  };
  admin: {
    users: {
      query: () => Promise<any[]>;
    };
    withdrawals: {
      query: () => Promise<any[]>;
    };
    deposits: {
      query: () => Promise<any[]>;
    };
    stats: {
      query: () => Promise<{
        totalUsers: number;
        activeUsers: number;
        totalJobs: number;
        activeJobs: number;
        pendingWithdrawals: number;
        totalWithdrawn: number;
        totalDeposits: number;
      }>;
    };
    updateWithdrawal: {
      input: { id: number; status: string };
      mutation: (input: any) => Promise<{ success: boolean }>;
    };
    updateDeposit: {
      input: { id: number; status: string };
      mutation: (input: any) => Promise<{ success: boolean }>;
    };
  };
  earnings: {
    list: {
      query: () => Promise<any[]>;
    };
    balance: {
      query: () => Promise<{ earning: string; deposit: string; totalWithdrawn: string }>;
    };
    completeJob: {
      input: { jobId: number };
      mutation: (input: { jobId: number }) => Promise<{ success: boolean }>;
    };
    withdraw: {
      input: { amount: number | string; paymentMethod: string; paymentNumber: string };
      mutation: (input: any) => Promise<{ success: boolean }>;
    };
    userWithdrawals: {
      query: () => Promise<any[]>;
    };
    userDeposits: {
      query: () => Promise<any[]>;
    };
    requestDeposit: {
      input: { amount: number | string; paymentMethod: string; paymentNumber: string; transactionId: string };
      mutation: (input: any) => Promise<{ success: boolean }>;
    };
  };
  support: {
    create: {
      input: { subject?: string; message: string };
      mutation: (input: any) => Promise<{ success: boolean }>;
    };
    list: {
      query: () => Promise<any[]>;
    };
  };
  notifications: {
    list: {
      query: () => Promise<any[]>;
    };
    unreadCount: {
      query: () => Promise<{ count: number }>;
    };
    markRead: {
      input: { id: number };
      mutation: (input: { id: number }) => Promise<{ success: boolean }>;
    };
  };
  system: {
    health: {
      query: () => Promise<{ status: string; timestamp: string; version: string; environment: string }>;
    };
  };
  ai: {
    chat: {
      input: { messages: { role: string; content: string }[] };
      mutation: (input: any) => Promise<{ choices: { message: { content: string } }[] }>;
    };
  };
};
