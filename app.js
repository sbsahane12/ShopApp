const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const setUser = require('./middleware/setUser');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
  }),
);

app.use(flash());
app.use(setUser);

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.set('view engine', 'ejs');


app.use('/', require('./routes/auth'));
app.use('/', require('./routes/user'));
app.use('/admin', require('./routes/admin'));

app.get('/terms-and-conditions', (req, res) => {
  res.render('terms-and-conditions');
});

app.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy');
});

app.get('/refund-policy', (req, res) => {
  res.render('refund-policy');
});

app.get('/shipping-policy', (req, res) => {
  res.render('shipping-policy');
});

app.get('/contact-us', (req, res) => {
  res.render('contact-us');
});


app.get('*', (req, res) => {
  res.status(404).render('error', { message: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = 'Something went wrong' } = err;
  res.status(statusCode).render('error', { message });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
