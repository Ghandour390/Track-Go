export interface User {
  id: string;
  nom: string;
  email: string;
  token: string;
}

export interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
}
