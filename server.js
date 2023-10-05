const express = require('express');
const app = express();
const port = 3000;


app.use('/api',require('./Routes/apis/blogs'));

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
