const mongoose = require('mongoose');

const STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const getStateCode = () => mongoose.connection.readyState;

const getStateLabel = () => STATE_LABELS[getStateCode()] || 'unknown';

const isDatabaseReady = () => getStateCode() === 1;

const databaseUnavailableResponse = () => {
  const payload = {
    error: 'Database unavailable',
    message:
      'Unable to process this request because the database connection is not ready. Please verify MongoDB is running and environment variables are set.',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.details = {
      state: getStateLabel(),
    };
  }

  return payload;
};

module.exports = {
  isDatabaseReady,
  databaseUnavailableResponse,
};
