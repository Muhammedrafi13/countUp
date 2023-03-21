require('dotenv').config()

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayout = require('express-ejs-layouts');
const connectDB = require('./server/config/db');
const userRouter = require('./server/routes/user');
const adminRouter = require('./server/routes/admin');
const multer  = require('multer');
const session = require('express-session');
const nocahe = require('nocache');


const app = express();




app.use(session
   ({secret:"Key",
  resave: false,
  saveUninitialized: true,
  cookie:{maxAge:86400000} //24 hours
}));
app.use(nocahe())

//Connect to Database
connectDB();
app.use(expressLayout);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout','./layouts/layout')


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'))

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
