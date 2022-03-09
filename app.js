'use strict';
require('dotenv').config()

// eslint-disable-next-line import/no-unresolved
const express = require('express');
var cors = require('cors')
var logger = require("morgan");

const app = express();
app.use(cors())
app.use(logger("dev"));

var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");
// var authRouter = require("./routes/auth");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.listen(8000, '127.0.0.1');


app.use("/", indexRouter);
// app.use('/users', usersRouter);
// app.use("/auth", authRouter);


module.exports = app;
