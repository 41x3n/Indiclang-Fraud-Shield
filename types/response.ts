import { ErrorPayload } from './errors';

export interface ApiResponse<T> {
    statusCode: number;
    data: T | null;
    error: ErrorPayload | null;
}
