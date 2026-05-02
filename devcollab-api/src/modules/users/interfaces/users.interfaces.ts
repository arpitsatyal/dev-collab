export interface CreateUserRequest {
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'GOOGLE' | 'GITHUB' | 'LOCAL';
  providerId: string;
}
