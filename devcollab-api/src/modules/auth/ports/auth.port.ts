import { ValidateSocialUserRequest } from '../interfaces/auth.interfaces';

export abstract class AuthPort {
  abstract validateSocialUser(profileData: ValidateSocialUserRequest): Promise<any>;
}
