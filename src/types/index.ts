export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAccount {
  id: string;
  userId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  scope: string;
  allowedEmailAccountIds: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  apiKeyId: string | null;
  emailAccountId: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: Date;
}

export interface SmtpAuthLog {
  id: string;
  apiKeyId: string | null;
  userId: string | null;
  username: string;
  success: boolean;
  error: string | null;
  remoteIp: string;
  createdAt: Date;
}

export type ApiKeyScope = "ALL" | "SPECIFIC";

export type EmailStatus = "pending" | "sent" | "failed";
