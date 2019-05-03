'use strict';

const app = require('./app');

const {PORT} = require('./config');

app.listen(PORT,()=>{
  console.log(`Server listing at Http://localhost:${PORT}`);
});