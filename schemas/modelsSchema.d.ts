export interface User {
  email: string;
  password: string;
}

export interface Url {
  originalUrl: string;
  disposable: boolean;
  expiresAt: number;
}

export interface Deactivate {
  linkToDeactivate: string;
}

export interface SignUpResponse {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponse {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  userId: string;
  userEmail: string;
  userUrls: [];
}

export interface TokenResponse {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export interface UrlResponse {
  fullUrl: string;
  urlId: string;
}

export interface DeactivateUrlResponse {
  id: string;
}
