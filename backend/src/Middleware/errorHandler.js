const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      message: 'A record with this information already exists' 
    });
  }

  // Prisma not found error
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      message: 'Record not found' 
    });
  }

  // Validation error
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({ 
      message: err.message || 'Validation error' 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired' 
    });
  }

  // Default error
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error' 
  });
};

module.exports = errorHandler;

