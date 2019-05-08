'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const {NODE_ENV} = require('./config');
const bookmarkRouter = require('./bookmarkRouter/bookmarkRouter');
const {errorHandler} = require('./errorHandler');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.apiToken;
  const authToken = req.get('Authorization');
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});
app.use(bookmarkRouter);
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});



module.exports = app;



