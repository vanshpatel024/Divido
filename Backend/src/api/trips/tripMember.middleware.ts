import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { createResponse } from '../../utils/response';

/**
 * tripMemberMiddleware — verifies the authenticated user is an active
 * participant of the trip identified by req.params.id.
 *
 * Returns 403 Forbidden if:
 *  - The trip does not exist
 *  - The user is not in trip_participants for that trip
 *
 * Must be applied AFTER authMiddleware so req.user is already populated.
 */
export const tripMemberMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.id;
    const userId = (req as any).user?.id;

    if (!tripId || !userId) {
      res.status(403).json(createResponse(false, 'Access denied'));
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      res
        .status(403)
        .json(createResponse(false, 'Access denied: you are not a member of this trip'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
