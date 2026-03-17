import { api } from "@/services/api";
import { User } from "@/types/auth";

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

interface LivreurAuthRecord {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  tokenAuth?: string;
}

const MOCK_USERS: MockAuthRecord[] = [
  {
    id: "user-driver-1",
    name: "Alex Martin",
    email: "driver@trackgo.app",
    password: "password",
  },
];

export async function login(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  try {
    const payload: LoginPayload = { email, password };
    await api.post("/auth/login", payload);
  } catch {}

  try {
    const records = await api
      .get<LivreurAuthRecord[]>("/livreurs", {
        params: { email: normalizedEmail },
      })
      .then((response) => response.data);

    const matched = records.find(
      (record) =>
        record.email.trim().toLowerCase() === normalizedEmail &&
        (record.tokenAuth ?? "") === normalizedPassword,
    );

    if (matched) {
      return {
        id: matched.id,
        nom: `${matched.prenom} ${matched.nom}`.trim(),
        email: matched.email,
        token: matched.tokenAuth || `trackgo-token-${matched.id}`,
      };
    }
  } catch {}

  const matchedUser = MOCK_USERS.find(
    (user) =>
      user.email.toLowerCase() === normalizedEmail &&
      user.password === normalizedPassword,
  );

  if (!matchedUser) {
    throw new Error("Identifiants invalides.");
  }

  return {
    id: matchedUser.id,
    nom: matchedUser.name,
    email: matchedUser.email,
    token: `trackgo-token-${matchedUser.id}`,
  };
}
