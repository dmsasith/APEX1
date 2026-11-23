import { TenantSubscription, User } from '../types';
import { getApiSessionToken, issueWorkspaceSessionToken } from './securityUtils';

export interface PaymentsLkGatewayStatus {
  configured: boolean;
  webhookConfigured: boolean;
  mode: 'test' | 'live' | 'unconfigured';
  usdToLkrRate: number;
  isLiveFxRate: boolean;
  backendAvailable: boolean;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  customerId: string;
  status: string;
  mode: 'test' | 'live';
  checkoutUrl: string | null;
  lkrAmountCents: number;
  lkrAmount: number;
  usdAmount: number;
  usdToLkrRate: number;
  isLiveFxRate: boolean;
  billingCycle: 'monthly' | 'annual';
  extraSiteSlots: number;
  subscriptionPatch: Partial<TenantSubscription>;
}

export interface VerifySubscriptionResponse {
  verified: boolean;
  status: string;
  subscriptionPatch?: Partial<TenantSubscription>;
  updatedSubscription?: TenantSubscription | null;
  checkoutUrl?: string | null;
  message: string;
}

async function resolveBearerToken(
  currentUser: Pick<User, 'id' | 'username'> | null | undefined,
  tenantId: string
): Promise<string | null> {
  const existing = getApiSessionToken();
  if (existing) return existing;

  if (
    currentUser?.id &&
    currentUser.id !== 'usr-admin-1' &&
    currentUser.username !== 'admin' &&
    tenantId
  ) {
    return issueWorkspaceSessionToken(currentUser.id, tenantId);
  }
  return null;
}

async function parseApiJson<T>(res: Response): Promise<T & { error?: string; code?: string }> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Payment backend API (/api/payments/*) is not running on this host. Run on a Node/Server deployment with PAYMENTS_LK_SECRET_KEY configured.'
    );
  }
  const data = (await res.json()) as T & { error?: string; code?: string };
  if (!res.ok) {
    throw new Error(data?.error || `Payment gateway request failed (HTTP ${res.status}).`);
  }
  return data;
}

export async function fetchPaymentsLkGatewayStatus(): Promise<PaymentsLkGatewayStatus> {
  try {
    const res = await fetch('/api/payments/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        configured: false,
        webhookConfigured: false,
        mode: 'unconfigured',
        usdToLkrRate: 300,
        isLiveFxRate: false,
        backendAvailable: false,
      };
    }
    const data = await res.json();
    return {
      configured: Boolean(data?.configured),
      webhookConfigured: Boolean(data?.webhookConfigured),
      mode: data?.mode === 'live' ? 'live' : data?.mode === 'test' ? 'test' : 'unconfigured',
      usdToLkrRate: Number(data?.usdToLkrRate) || 300,
      isLiveFxRate: Boolean(data?.isLiveFxRate),
      backendAvailable: true,
    };
  } catch {
    return {
      configured: false,
      webhookConfigured: false,
      mode: 'unconfigured',
      usdToLkrRate: 300,
      isLiveFxRate: false,
      backendAvailable: false,
    };
  }
}

export async function startPaymentsLkAutoSubscription(params: {
  billingCycle: 'monthly' | 'annual';
  tenantId: string;
  extraSiteSlots?: number;
  customerEmail?: string;
  customerName?: string;
  currentUser?: Pick<User, 'id' | 'username'> | null;
}): Promise<CreateSubscriptionResponse> {
  const token = await resolveBearerToken(params.currentUser, params.tenantId);
  if (!token) {
    throw new Error(
      'Authenticated server session required to initiate payment. Please log in again if your session expired.'
    );
  }

  const res = await fetch('/api/payments/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      billingCycle: params.billingCycle,
      tenantId: params.tenantId,
      extraSiteSlots: params.extraSiteSlots,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
    }),
  });

  return parseApiJson<CreateSubscriptionResponse>(res);
}

export async function verifyPaymentsLkSubscription(params: {
  tenantId: string;
  subscriptionId?: string;
  currentUser?: Pick<User, 'id' | 'username'> | null;
}): Promise<VerifySubscriptionResponse> {
  const token = await resolveBearerToken(params.currentUser, params.tenantId);
  if (!token) {
    throw new Error('Authentication session required to verify subscription.');
  }

  const res = await fetch('/api/payments/verify-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      tenantId: params.tenantId,
      subscriptionId: params.subscriptionId,
    }),
  });

  return parseApiJson<VerifySubscriptionResponse>(res);
}

export async function openPaymentsLkBillingPortal(params: {
  tenantId: string;
  currentUser?: Pick<User, 'id' | 'username'> | null;
}): Promise<{ url: string }> {
  const token = await resolveBearerToken(params.currentUser, params.tenantId);
  if (!token) {
    throw new Error('Authentication session required to open Billing Portal.');
  }

  const res = await fetch('/api/payments/billing-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ tenantId: params.tenantId }),
  });

  return parseApiJson<{ url: string }>(res);
}

export async function togglePaymentsLkAutoRenew(params: {
  tenantId: string;
  action: 'cancel' | 'resume';
  currentUser?: Pick<User, 'id' | 'username'> | null;
}): Promise<{
  status: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  subscriptionPatch: Partial<TenantSubscription>;
}> {
  const token = await resolveBearerToken(params.currentUser, params.tenantId);
  if (!token) {
    throw new Error('Authentication session required to update auto-renewal.');
  }

  const res = await fetch('/api/payments/auto-renew', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      tenantId: params.tenantId,
      action: params.action,
    }),
  });

  return parseApiJson<{
    status: string;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    subscriptionPatch: Partial<TenantSubscription>;
  }>(res);
}
