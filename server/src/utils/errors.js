export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (what) => new ApiError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (message, details) => new ApiError(409, 'CONFLICT', message, details);
