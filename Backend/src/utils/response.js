"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = void 0;
const createResponse = (success, message, data, error) => {
    return {
        success,
        message,
        ...(data !== undefined && { data }),
        ...(error !== undefined && { error }),
    };
};
exports.createResponse = createResponse;
//# sourceMappingURL=response.js.map