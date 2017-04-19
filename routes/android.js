var express = require('express');
var router = express.Router();
var mysql = require("mysql");
var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shopandgo-1478981969236.firebaseio.com"
});


// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "us-cdbr-iron-east-03.cleardb.net",
  user: "b2fcba8e2a2458",
  password: "aceb39dabff4f8c",
  database: "heroku_486681e5e61db3b",
  multipleStatements: true
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

/* GET users listing. */
router.get('/login', function(req, res, next) {
	console.log(req.query);
	con.query('SELECT * FROM users WHERE username = ?', req.query.username, function(err, rows){
            if (err) {
                console.log('error');
            } else {
                if (rows.length === 0) {
                    res.send('either username or password is wrong');
                } else if (rows[0].password !== req.query.password) {
                    res.send('either username or password is wrong');
                } else {
                  admin.auth().createCustomToken(req.query.username).then(function(customToken) {
                    // Send token back to client
                    res.send(customToken);
                  }).catch(function(error) {
                    console.log("Error creating custom token:", error);
                  });
                }
                
            }
        });
});

router.get('/profile', function(req, res){
  
  con.query('SELECT * FROM users where username = ?', req.query.username, function(err, rows){
    if (err) {
      console.log(err);
    } else {
      console.log(rows);
      res.send(rows);
    }
  });
  
});

router.post('/updateProfile', function(req, res) {
  con.query('UPDATE users SET dietrest = ? Where username = ?', [req.body.profile, req.body.username], function(err, result){
    if (err) {
      console.log('err');
    } else {
      res.send('update success');
    }
  });
});

router.get('/searchRecipe', function(req, res){
  console.log('IN SEARCH ROUTE');
	unirest.get('http://food2fork.com/api/search?key=125aec03ba4a0ffe5222a72a9783b3b6&q='.concat(req.query.recipe))
	.end(function(result){
    console.log(result);
		var returnObject = JSON.parse(result.body);
    console.log(result.body);
		res.send(result.body);
	});
});

router.get('/getShoppingCart', function(req, res) {
  con.query('SELECT * FROM shoppingcart WHERE username = ?', req.query.username, function(err, rows){
    if (err) {
      res.send(err);
    } else {
      res.send(rows);
    }
  });
});

router.post('/addToShoppingCart', function(req, res){
    console.log(req.body);
    con.query('INSERT INTO shoppingcart SET ?', req.body, function(err, result){
      if (err) {
        console.log(err);
      } else {
        res.send('finished adding');
      }
    });
});

router.post('/deleteItems', function(req, res){
  console.log(req.body);
    var i = 0;
    var query = "";
    if (typeof req.body.item === 'string') {
      query = "DELETE FROM shoppingcart WHERE ItemName = '".concat(req.body.item, "'");
    } else {
      console.log('in many');
      for (i = 0; i < req.body.item.length; i++) {
        console.log(req.body.item[i]);
        query = query.concat("DELETE FROM shoppingcart WHERE ItemName = '", req.body.item[i], "'; ");

      }
    }
    res.send(query);
    // console.log(query);
    // con.query(query, function(err, results){
    //   if (err){
    //     console.log(err);
    //   } else {
    //     res.redirect('/getShoppingList');
    //   }
    // });
  
});

module.exports = router;
