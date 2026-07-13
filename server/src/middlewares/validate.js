import { AppError } from "../errors/AppError.js";

/**
 * validate({ body, params, query }) — each value is an optional zod schema.
 * On success, replaces req.body/params/query with the parsed (typed, coerced) data.
 * On failure, forwards a 400 AppError with field-level details.
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const key of ["params", "query", "body"]) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(AppError.badRequest("Invalid request", details));
      }
      req[key] = result.data;
    }
    next();
  };
}

export default validate;
