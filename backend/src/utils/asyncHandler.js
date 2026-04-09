/**
 * Async Handler Utility
 * 
 * Wraps async Express routes to automatically catch errors and pass them to the `next` function.
 * Drastically reduces boilerplate `try/catch` blocks in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
