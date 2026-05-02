import { Response } from 'express';
import { AuthenticatedRequest } from 'src/common/interfaces/AuthenticatedRequest';
import { ValidateSocialUserRequest } from '../interfaces/auth.interfaces';

export abstract class AuthPort {
  abstract validateSocialUser(profileData: ValidateSocialUserRequest): Promise<any>;
  abstract handleSocialLogin(req: AuthenticatedRequest): Promise<void>;
  abstract logout(req: AuthenticatedRequest, res: Response): Promise<void>;
}
