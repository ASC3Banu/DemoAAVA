class ApiResponse {
  static success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message, statusCode = 500, details = null) {
    return {
      success: false,
      error: {
        message,
        statusCode,
        details
      },
      timestamp: new Date().toISOString()
    };
  }

  static paginated(data, pagination) {
    return {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages
      },
      timestamp: new Date().toISOString()
    };
  }

  static created(data, message = 'Resource created successfully') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static noContent() {
    return {
      success: true,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;
