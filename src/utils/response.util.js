/**
 * Response Utility
 * Standardized API response formatting
 */

class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message, statusCode = 500, errorCode = 'ERROR', details = null) {
    return {
      success: false,
      statusCode,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { ApiResponse };
