export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      message: error.message || "An unknown error occurred!",
      success: false,
    });
  }
};

// export const asyncHandler = (fn) => async (req, res, next) => {
//     return Promise.resolve(fn(req, res, next)).catch((error) => next(error));
// }
