const express = require('express');
const downloadRoute = require('./routes/download');
const compressRoute = require('./routes/compress');
const adminRoute = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(downloadRoute);
app.use(compressRoute);
app.use(adminRoute);

app.use(errorHandler);

module.exports = app;
