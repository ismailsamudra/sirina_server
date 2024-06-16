require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const router = require('./routers');
//---------------------------------------------
app.use('/',router);
//---------------------------------------------
//******************************************** */
server.listen(port, function() {
   console.log('App running on Port : ' + port);
});
//******************************************** */