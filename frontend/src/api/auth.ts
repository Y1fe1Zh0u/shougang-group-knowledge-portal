import { ApiRequestError } from './content';

export interface PortalUser {
  account: string;
  name: string;
  initial?: string;
  role?: string;
  loginAt?: number;
}

interface ApiEnvelope<T> {
  status_code: number;
  status_message: string;
  data: T;
  detail?: string;
}

interface PortalUserDto {
  account: string;
  name: string;
  initial?: string;
  role?: string;
  login_at?: number;
}

interface PortalAuthDataDto {
  user: PortalUserDto;
}

function mapPortalUser(dto: PortalUserDto): PortalUser {
  return {
    account: dto.account,
    name: dto.name,
    initial: dto.initial,
    role: dto.role,
    loginAt: dto.login_at,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new ApiRequestError(payload?.status_message || payload?.detail || '请求失败', response.status);
  }
  return payload.data;
}

export async function loginPortal(params: {
  account: string;
  password: string;
  remember: boolean;
}): Promise<PortalUser> {
  const data = await parseResponse<PortalAuthDataDto>(
    await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }),
  );
  return mapPortalUser(data.user);
}

export async function fetchPortalMe(): Promise<PortalUser> {
  const data = await parseResponse<PortalAuthDataDto>(
    await fetch('/api/v1/auth/me', {
      credentials: 'include',
    }),
  );
  return mapPortalUser(data.user);
}

export async function logoutPortal(): Promise<void> {
  await parseResponse<{ ok: boolean }>(
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }),
  );
}
