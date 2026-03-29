import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { getDevicesCollection } from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-secret-key-change-in-prod';
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'subuser';
}

// Ensure payload matches SessionPayload
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Login lasts 30 days
    .sign(key);
}

export async function decrypt(token: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyDeviceAccess(mac: string, token: string | undefined): Promise<boolean> {
  const payload = await decrypt(token);
  if (!payload?.userId) return false;
  
  // Admins can access all devices
  if (payload.role === 'admin') return true;

  // Subusers only if explicitly allowed to this MAC
  const devicesCollection = await getDevicesCollection();
  const device = await devicesCollection.findOne({ mac, allowedUsers: payload.userId });
  
  return !!device;
}
