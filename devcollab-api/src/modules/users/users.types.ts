export interface CreateUserRequest {
  email: string;
  name?: string;
  image?: string;
  externalId?: string;
  provider: 'GOOGLE' | 'GITHUB' | 'LOCAL';
}
