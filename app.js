"use strict";
require("dotenv").config();

// eslint-disable-next-line import/no-unresolved
const express = require("express");
var cors = require("cors");
var logger = require("morgan");

const app = express();
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(logger("dev"));

var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");
// var authRouter = require("./routes/auth");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.listen(8000);

app.use("/", indexRouter);
// app.use('/users', usersRouter);
// app.use("/auth", authRouter);

module.exports = app;
