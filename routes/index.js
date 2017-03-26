var express = require('express');
var router = express.Router();
var mysql = require("mysql");


// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "us-cdbr-iron-east-03.cleardb.net",
  user: "b2fcba8e2a2458",
  password: "aceb39dabff4f8c",
  database: "heroku_486681e5e61db3b"
});

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

/* GET home page. */
router.get('/', function(req, res) {
  res.render('login', {layout: 'loginRegister', title: 'baba'});
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

router.get('/getResults', function(req, res) {
	res.render('searchResults');
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

module.exports = router;
