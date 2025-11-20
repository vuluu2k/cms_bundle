require('dotenv').config();
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
