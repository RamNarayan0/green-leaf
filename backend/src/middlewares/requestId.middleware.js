const { v4: uuidv4 } = require('uuid');

const assignRequestId = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

module.exports = { assignRequestId };