require('dotenv').config();
const express = require('express');
const compression = require('compression');
const errorhandler = require('errorhandler');
const morgan = require('morgan');

const router = require('./routers');

const app = express();


const port = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan(isDev ? 'dev' : 'combined'));

app.use('/api/v1', router);

app.use(errorhandler());

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port http://localhost:${port}`);
});
