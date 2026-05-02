export interface CreateUserRequest {
  email: string;
  name?: string;
  image?: string;
  provider: 'GOOGLE' | 'GITHUB' | 'LOCAL';
  providerId: string;
}
