class PaginationHelper {
  paginate(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
      limit: parseInt(limit),
      offset: parseInt(offset),
      page: parseInt(page)
    };
  }

  formatResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  validatePaginationParams(page, limit) {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 20;

    return {
      page: Math.max(1, parsedPage),
      limit: Math.min(100, Math.max(1, parsedLimit))
    };
  }
}

module.exports = new PaginationHelper();