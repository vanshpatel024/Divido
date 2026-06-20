export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
}
export declare const createResponse: <T>(success: boolean, message: string, data?: T, error?: any) => ApiResponse<T>;
//# sourceMappingURL=response.d.ts.map