'use strict';
const logger = require('../logger');

const NO_ERRORS = null;

function getBookmarkValidationError({ url, rating }) {
  if (rating &&
        (!Number.isInteger(rating) || rating < 0 || rating > 5)) {
    logger.error(`Invalid rating '${rating}' supplied`);
    return {
      error: {
        message: '\'rating\' must be a number between 0 and 5'
      }
    };
  }
  return NO_ERRORS;
}

module.exports ={
  getBookmarkValidationError,
};