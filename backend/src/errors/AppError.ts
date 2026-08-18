export class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly expose: boolean;

    constructor(
        statusCode: number,
        message: string,
        code = "REQUEST_FAILED",
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.expose = statusCode < 500;
    }
}
