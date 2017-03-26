var express = require('express');
var router = express.Router();
var mysql = require("mysql");
var passport = require('passport');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var unirest = require('unirest');


router.use(session({
    secret            : 'shopandgo',
    resave            : false,
    saveUninitialized : false
})); // session secret
router.use(passport.initialize());
router.use(passport.session());



// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "us-cdbr-iron-east-03.cleardb.net",
  user: "b2fcba8e2a2458",
  password: "aceb39dabff4f8c",
  database: "heroku_486681e5e61db3b"
});

require('./passport')(passport, con);

/**
 *Code to make the connection to the database
 *
 **/
con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

/**
 *Code to Ping the database and keep connection awake
 *
 **/
setInterval(function () {
    con.query('SELECT 1');
}, 5000);


router.get('/', function(req, res){
	res.redirect('/login');
});
/* GET home page. */
router.get('/login', isLoggedIn, function(req, res) {
  res.render('login', {layout: 'loginRegister', title: 'shop&go'});
});

router.get('/register', function(req, res){
	res.render('register', {layout: 'loginRegister', title: 'shop&go', registrationStatus: ""});
});

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

router.get('/searchRecipe', function(req, res){
	//console.log(req);
	// var searchString = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/autocomplete?number=10&query=".concat(req.query.query);
	// console.log(searchString);
	// unirest.get(searchString)
	// .header("X-Mashape-Key", "D3LVqy2Brxmshqi8QMHzqlfYgK92p1kkx7Jjsn7kCzkCzClGPn")
	// .header("Accept", "application/json")
	// .end(function (result) {
	//   res.render('recipeSearchForm', {layout: 'index', title: 'shop&go', recipe: result.body});
	// });

	unirest.get('http://food2fork.com/api/search?key=125aec03ba4a0ffe5222a72a9783b3b6&q='.concat(req.query.query))
	.end(function(result){
		//var json = JSON.stringify(eval("(" + result.body + ")"));
		var returnObject = JSON.parse(result.body);
		res.render('recipeSearchForm', {layout: 'index', title:'shop&go', recipe: returnObject.recipes});
	});
});

router.post('/login', passport.authenticate('local-signin', {
    successRedirect : '/home',
    failureRedirect : '/login',
    failureFlash    : true
}));

router.post('/register', function(req, res){
	console.log(req.body);
	if (req.body.password === req.body.confPass) {
		con.query('SELECT * FROM users WHERE username = ?', req.body.username, function(err, rows){
			if (err) {
				console.log('error');
			} else {
				if (rows.length === 0) {
					var user = {username: req.body.username, password: req.body.password};
					con.query('INSERT INTO users SET ?', user, function(err, rows){
				        if (err) {
				            console.log('err');
				        } else {
				            res.redirect('/login');
				        }
				    });
				} else {
					res.render('register', {layout: 'loginRegister', title: 'shop&go', registrationStatus: "User already exists"});
				}
			}
		});
	} else {
		res.render('register', {layout: 'loginRegister', title: 'shop&go', registrationStatus: "Passwords dont match"});
	}
});

router.get('/home', isLoggedOut, function(req, res){
	console.log(req.user);
	var recipeList = [];
	res.render('recipeSearchForm', {layout: 'index', title: 'shop&go', recipe: recipeList});
});

router.get('/getShoppingList', function(req, res){
	con.query('SELECT * FROM shoppingcart', function(err, rows){
		if (err) {
			res.send(err);
		} else {
			console.log(rows);
			res.render('shoppingKart', {
				title: 'list',
				shoppingList: rows
			});
		}
	});
});

router.post('/deleteItem/:item', function(req, res){
	console.log(req.params.item);
	con.query('DELETE FROM shoppingcart WHERE ItemName = ?', req.params.item, function(err, result){
		if (err) {
			console.log(err);
		} else {
			res.redirect('/getShoppingList');
		}
	});
});

router.post('/addItem', function(req, res){
	console.log(req.body);
	con.query('INSERT INTO shoppingcart SET ?', req.body, function(err, result){
		if (err) {
			console.log(err);
		} else {
			res.redirect('/getShoppingList');
		}
	});
});

function isLoggedIn(req, res, next) {
	if (req.user) {
		res.redirect('/home');
	} else {
		next();
	}
}

function isLoggedOut(req, res, next) {
	if (!req.user) {
		res.redirect('/login');
	} else {
		next();
	}
}

module.exports = router;
