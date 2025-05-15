import { StatusCodes } from 'http-status-codes';

import { ErrorPayload } from './errors';

export interface ApiResponse<T> {
    statusCode: StatusCodes;
    data: T | null;
    error: ErrorPayload | null;
}
