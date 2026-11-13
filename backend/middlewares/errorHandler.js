import { AppError } from "../utils/allUtilities.js";

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = 500;
    let message = "Something went wrong.";

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err.code === 11000) {
        statusCode = 409;
        message = "A person with these unique details already exists.";
    } else if (err.name === "ValidationError" || err.name === "CastError") {
        statusCode = 400;
        message = "Invalid data provided.";
    } else if (err.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Invalid JSON body.";
    } else if (err.type === "entity.too.large") {
        statusCode = 413;
        message = "Request body is too large.";
    }

    if (statusCode === 500) {
        console.error("Error:", err);
    }

    return res.status(statusCode).json({ success: false, message });
};

export default errorHandler;