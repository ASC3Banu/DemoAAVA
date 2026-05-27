class ErrorHandler {
  handle(err, req, res, next) {
    console.error('Error occurred:', err);

    const errorResponse = {
      success: false,
      error: err.message || 'Internal server error',
      code: err.code || 'ERR_001',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        ...errorResponse,
        code: 'VAL_001',
        details: err.details
      });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        ...errorResponse,
        code: 'AUTH_001'
      });
    }

    if (err.name === 'ForbiddenError') {
      return res.status(403).json({
        ...errorResponse,
        code: 'AUTH_005'
      });
    }

    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        ...errorResponse,
        code: 'RES_001'
      });
    }

    if (err.name === 'ConflictError') {
      return res.status(409).json({
        ...errorResponse,
        code: 'RES_002'
      });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(errorResponse);
  }

  notFound(req, res) {
    res.status(404).json({
      success: false,
      error: 'Resource not found',
      code: 'RES_001',
      path: req.path,
      method: req.method
    });
  }
}

module.exports = new ErrorHandler();