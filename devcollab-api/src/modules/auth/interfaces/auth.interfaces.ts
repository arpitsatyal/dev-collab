export interface ValidateSocialUserRequest {
  email: string;
  name: string;
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  avatarUrl?: string;
}
