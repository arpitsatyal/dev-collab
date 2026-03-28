import { Session } from 'express-session';

export interface AuthenticatedRequest extends Request {
  logout: (callback: (err: any) => void) => void;
  session: Session & {
    destroy: (callback: (err: any) => void) => void;
  };
  isAuthenticated: () => boolean;
}
