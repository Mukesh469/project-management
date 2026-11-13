export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}

export const asyncHandler = (fn) => {

    return (req, res, next) => {

        return Promise
            .resolve()
            .then(() => fn(req, res, next))
            .catch(next);

    };

};