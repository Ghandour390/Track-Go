import { api } from '@/services/api';
import { User } from '@/types/auth';

interface LoginPayload {
  email: string;
  password: string;
}

interface MockAuthRecord {
  id: string;
  name: string;
  email: string;
  password: string;
}

const MOCK_USERS: MockAuthRecord[] = [
  {
    id: 'user-driver-1',
    name: 'Alex Martin',
    email: 'driver@trackgo.app',
    password: 'password',
  },
];

export async function login(email: string, password: string): Promise<User> {
  try {
    const payload: LoginPayload = { email, password };
    await api.post('/auth/login', payload);
  } catch {
    
  }

  const matchedUser = MOCK_USERS.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
  );

  if (!matchedUser) {
    throw new Error('Identifiants invalides.');
  }

  return {
    id: matchedUser.id,
    nom: matchedUser.name,
    email: matchedUser.email,
    token: `trackgo-token-${matchedUser.id}`,
  };
}
