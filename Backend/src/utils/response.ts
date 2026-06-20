export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const createResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  error?: any
): ApiResponse<T> => {
  return {
    success,
    message,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  };
};
