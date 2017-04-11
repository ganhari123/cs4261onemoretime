var express = require('express');
var router = express.Router();
var mysql = require("mysql");
var passport = require('passport');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var unirest = require('unirest');
var parser = require('xml2json');



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
//		console.log(returnObject.recipe);
//		console.log(returnObject.recipe.ingredients);
		res.render('recipeView', {layout: 'index', title:'shop&go', username: 'hello', recipe: returnObject.recipe, ingrediantList: returnObject.recipe.ingredients});
	});

	//res.render('recipeView', {layout: 'index', title:'shop&go', username: req.params.id});
});

//router.post()

router.get('/addRecipetoCart', isLoggedOut, function(req, res) {
    console.log(typeof req.query.query);
    console.log(req.user.username);
    con.query('INSERT INTO recipe (recipe, username) VALUES (?, ?)', [req.query.query, req.user.username], function(err, result){
		if (err) {
			console.log(err);
		} else {
			res.redirect('/getShoppingList');
		}
	});
});

router.get('/getShoppingList', isLoggedOut, function(req, res){
//    con.query('SELECT * FROM shoppingcart INNER JOIN recipe ON shoppingcart.username=recipe.username WHERE shoppingcart.username = ?', req.user.username, function(err, rows){
//        console.log(rows);
//		if (err) {
//			res.send(err);
//		} else {
//            console.log(rows.title);
//			res.render('shoppingKart', {
//				title: 'list',
//				shoppingList: rows
//			});
//		}
//	});
	con.query('SELECT * FROM shoppingcart WHERE username = ?', req.user.username, function(err, rows){
        console.log(rows);
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

router.get('/getCartRecipes', isLoggedOut, function(req, res) {
    console.log("HERE");
    con.query('SELECT * FROM recipe WHERE username = ?', req.user.username, function(err, rows){
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
})
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

router.get('/aisleFinderSearchStore', isLoggedOut, function(req, res) {
  res.render('aisleFinderSearchStore', {layout: 'index', title: 'shop&go'});
});

router.get('/searchForStore', isLoggedOut,  function(req, res){
    //Sara's API key: 930e39d252
    console.log(req.query.query);
    if (!isNaN(req.query.query)) {
        unirest.get('http://www.SupermarketAPI.com/api.asmx/StoresByZip?APIKEY=930e39d252&ZipCode='.concat(req.query.query))
        .end(function(result){
            var json = parser.toJson(result.body);
            var returnObject = JSON.parse(json);
            if (returnObject.ArrayOfStore.Store != null) {
               if (isNaN(returnObject.ArrayOfStore.Store.length)) {
                    returnObject = [returnObject.ArrayOfStore.Store];
                    console.log(returnObject);
                    res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: returnObject});
                } else {
                    res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: returnObject.ArrayOfStore.Store});
                }
            } else {
                res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: null});
            }
	});
    } else {
        var split = req.query.query.split(", ");
        var city = split[0];
        var state = split[1];
        unirest.get('http://www.SupermarketAPI.com/api.asmx/StoresByCityState?APIKEY=930e39d252&SelectedCity='.concat(city).concat('&SelectedState=').concat(state))
        .end(function(result){
            var json = parser.toJson(result.body);
            var returnObject = JSON.parse(json);
//            console.log(returnObject.ArrayOfStore.Store);
//            console.log(isNaN(returnObject.ArrayOfStore.Store.length));
            if (returnObject.ArrayOfStore.Store != null) {
                if (isNaN(returnObject.ArrayOfStore.Store.length)) {
                    returnObject = [returnObject.ArrayOfStore.Store];
                    console.log(returnObject);
                    res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: returnObject});
                } else {
                    res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: returnObject.ArrayOfStore.Store});
                }
            } else {
                res.render('aisleFinderSearchStore', {layout: 'index', title:'shop&go', Store: null});
            }
        });
    }
});

router.get('/getDirections', function(req, res) {
    var origin = req.query.origin.split(' ').join('+');
    var dest = req.query.dest.split(' ').join('+');
    var returnObject = "https://www.google.com/maps/embed/v1/directions?key=AIzaSyDLCwy7f4hNJsUCTZLi4z2O5hx685KgONQ&origin="+ origin + "&destination=" + dest;
    console.log(returnObject);
   res.render('map', {layout: 'index', title: 'shop&go', src: returnObject}); 
});

router.get('/getLocation/:destination', function(req, res) {
    unirest.post('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDLCwy7f4hNJsUCTZLi4z2O5hx685KgONQ')
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    .send({"considerIp": "true"})
    .end(function(result) {
        var location = result.body.location.lat + "," + result.body.location.lng;
        var returnObject = "https://www.google.com/maps/embed/v1/directions?key=AIzaSyDLCwy7f4hNJsUCTZLi4z2O5hx685KgONQ&origin="+ location + "&destination=" + req.params.destination;
        console.log(returnObject);
        res.render('map', {layout: 'index', title: 'shop&go', src: returnObject}); 
    });
});

router.get('/getStore/:storeID/:storename', function(req, res) {
   res.render('aisleFinderSearchItem', {layout: 'index', title:'shop&go', storeID: req.params.storeID, storename: req.params.storename});
});
router.get('/searchForItem/:storeID/:storename', function(req, res) {
    unirest.get("http://www.SupermarketAPI.com/api.asmx/SearchForItem?APIKEY=930e39d252&StoreId=".concat(req.params.storeID).concat("&ItemName=").concat(req.query.query))
        .end(function(result){
            var json = parser.toJson(result.body);
            var returnObject = JSON.parse(json);
//            console.log(returnObject.ArrayOfStore.Store);
//            console.log(isNaN(returnObject.ArrayOfStore.Store.length));
            if (returnObject.ArrayOfProduct.Product != null) {
                if (isNaN(returnObject.ArrayOfProduct.Product.length)) {
                    returnObject = [returnObject.ArrayOfProduct.Product];
                    console.log(returnObject);
                    res.render('aisleFinderSearchItem', {layout: 'index', title:'shop&go', item: returnObject, storeID: req.params.storeID, storename: req.params.storename});
                } else {
                    res.render('aisleFinderSearchItem', {layout: 'index', title:'shop&go', item: returnObject.ArrayOfProduct.Product, storeID: req.params.storeID, storename: req.params.storename});
                }
            } else {
                res.render('aisleFinderSearchItem', {layout: 'index', title:'shop&go', item: null, storeID: req.params.storeID, storename: req.params.storename});
            }
        });
});

router.get('/nutrition', function(req, res) {
    res.render('nutrition', {layout: 'index', title:'shop&go'});
});

router.get('/getNutritionalInfo', function(req, res) {
    //app ID: f8bc10a1
    //App key: 53faf70a55610e2eacf09ee25b80195f
//    console.log(req.query);
    unirest.post('https://api.nutritionix.com/v1_1/search')
    .headers({'Content-Type': 'application/json'})
    .send({
        "appId":"f8bc10a1",
        "appKey":"53faf70a55610e2eacf09ee25b80195f",
        "query": req.query.query,
        "fields":["brand_name", "item_name", "nf_calories", "nf_calories_from_fat",
                 "nf_total_fat", "nf_saturated_fat", "nf_monounsaturated_fat", "nf_trans_fatty_acid", "nf_cholesterol", "nf_sodium", "nf_total_carbohydrate", "nf_dietary_fiber", "nf_sugars", "nf_protein", "nf_servings_per_container", "nf_serving_size_qty", "nf_serving_size_unit"],
        "filters": {
           "nf_calories": {
              "from": 0,
              "to": 500000
            }
        }
    })
    .end(function(result) {
        console.log(result.body.hits[0].fields);
        console.log(result.body.hits.length)
        var returnObject = [result.body.hits[0].fields];
        for (i = 1; i < result.body.hits.length; i++) {
            returnObject = returnObject.concat([result.body.hits[i].fields]);
        }
//        console.log(JSON.stringify(returnObject));
        res.render('nutrition', {layout: 'index', title:'shop&go', fields: returnObject});
        
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
