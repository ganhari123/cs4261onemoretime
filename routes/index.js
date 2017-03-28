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
  database: "heroku_486681e5e61db3b",
  multipleStatements: true
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

router.post('/login', passport.authenticate('local-signin', {
    successRedirect : '/searchRecipe',
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


router.get('/searchRecipe', isLoggedOut,  function(req, res){

	unirest.get('http://food2fork.com/api/search?key=125aec03ba4a0ffe5222a72a9783b3b6&q='.concat(req.query.query))
	.end(function(result){
		var returnObject = JSON.parse(result.body);
		res.render('recipeSearchForm', {layout: 'index', title:'shop&go', recipe: returnObject.recipes});
	});
});

router.get('/getRecipeDetails/:id', isLoggedOut, function(req, res){
	unirest.get('http://food2fork.com/api/get?key=125aec03ba4a0ffe5222a72a9783b3b6&rId='.concat(req.params.id))
	.end(function(result){
		var returnObject = JSON.parse(result.body);
		console.log(returnObject.recipe);
		console.log(returnObject.recipe.ingredients);
		res.render('recipeView', {layout: 'index', title:'shop&go', username: 'hello', recipe: returnObject.recipe, ingrediantList: returnObject.recipe.ingredients});
	});

	//res.render('recipeView', {layout: 'index', title:'shop&go', username: req.params.id});
});

//router.post()

router.get('/getShoppingList', isLoggedOut, function(req, res){
	con.query('SELECT * FROM shoppingcart', function(err, rows){
		if (err) {
			res.send(err);
		} else {
			res.render('shoppingKart', {
				title: 'list',
				shoppingList: rows
			});
		}
	});
});

router.post('/addDeleteItem', function(req, res){
	if (req.body.collected == 'Collect') {
		var i = 0;
		var query = "";
		for (i = 0; i < req.body.item.length; i++) {
			console.log(req.body.item[i]);
			query = query.concat("UPDATE shoppingcart SET isCollected = 1 WHERE ItemName = '", req.body.item[i], "'; ");
		}
		con.query(query, function(err, results){
			if (err){
				console.log(err);
			} else {
				res.redirect('/getShoppingList');
			}
		});
		
	} else {
		var i = 0;
		var query = "";
		for (i = 0; i < req.body.item.length; i++) {
			console.log(req.body.item[i]);
			query = query.concat("DELETE FROM shoppingcart WHERE ItemName = '", req.body.item[i], "'; ");
		}
		con.query(query, function(err, results){
			if (err){
				console.log(err);
			} else {
				res.redirect('/getShoppingList');
			}
		});
	}
	
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

router.get('/profile', isLoggedOut,  function(req, res){
	
	con.query('SELECT * FROM users where username = ?', req.user.username, function(err, rows){
		if (err) {
			console.log(err);
		} else {
			var storeAllerg = {layout: 'index', title:'shop&go', username: req.user.username, nut: false, veg: false, lactose: false, vegan: false, celiac: false, other: ''};
			var rowFromTable = JSON.parse(rows[0].dietrest);
			if (rowFromTable !== null) {
				var i = 0;
				for (i = 0; i < rowFromTable.diet.length; i++) {
					storeAllerg[rowFromTable.diet[i]] = true;
				}
				storeAllerg['other'] = rowFromTable.other;
				res.render('profile', storeAllerg);
			} else {
				res.render('profile', storeAllerg);
			}
		}
	});
	
});

router.post('/dietPreferences', function(req, res){
	console.log(req.body);
	
	con.query('UPDATE users SET dietrest = ? Where username = ?', [JSON.stringify(req.body), req.user.username], function(err, result){
		if (err) {
			console.log(err);
		} else {
			res.redirect('/profile');
		}
	});
});

router.post('/collectedItem/:item', function(req, res){
    console.log(req.params.item);
	con.query('UPDATE shoppingcart SET isCollected = ? WHERE username = ? AND itemName = ?', [JSON.stringify(req.body), req.user.username, req.params.item], function(err, result){
		if (err) {
			console.log(err);
		} else {
			res.redirect('/getShoppingList');
		}
	});
});


function isLoggedIn(req, res, next) {
	if (req.user) {
		res.redirect('/searchRecipe');
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
