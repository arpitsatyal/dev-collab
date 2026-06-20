import { Request } from 'express';
import { Session } from 'express-session';
import { User } from 'src/common/drizzle/schema';

export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session & {
    destroy: (callback: (err: any) => void) => void;
  };
}
