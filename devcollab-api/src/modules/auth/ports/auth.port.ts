import { ValidateSocialUserRequest } from '../types/auth.types';

export abstract class AuthPort {
  abstract validateSocialUser(profileData: ValidateSocialUserRequest): Promise<any>;
}
