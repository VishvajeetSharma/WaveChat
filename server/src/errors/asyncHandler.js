// Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
// Removes the need for try/catch boilerplate in every controller.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
