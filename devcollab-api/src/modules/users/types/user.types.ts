export type Provider = 'GOOGLE' | 'GITHUB' | 'LOCAL';

export interface CreateUserRequest {
  email: string;
  name?: string;
  image?: string;
  provider: Provider;
  providerId: string;
}
