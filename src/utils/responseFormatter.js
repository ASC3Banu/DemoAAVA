class ResponseFormatter {
  success(data, message = 'Success', metadata = {}) {
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  error(message, code = 'ERR_001', details = null) {
    const response = {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    };

    if (details) {
      response.details = details;
    }

    return response;
  }

  created(data, message = 'Resource created successfully') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  updated(data, message = 'Resource updated successfully') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  deleted(message = 'Resource deleted successfully') {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };
  }

  notFound(resource = 'Resource') {
    return {
      success: false,
      error: `${resource} not found`,
      code: 'RES_001',
      timestamp: new Date().toISOString()
    };
  }

  unauthorized(message = 'Unauthorized access') {
    return {
      success: false,
      error: message,
      code: 'AUTH_001',
      timestamp: new Date().toISOString()
    };
  }

  forbidden(message = 'Access forbidden') {
    return {
      success: false,
      error: message,
      code: 'AUTH_005',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ResponseFormatter();