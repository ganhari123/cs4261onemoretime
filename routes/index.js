var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/code', function(req, res){
	res.send('Hello code');
});

module.exports = router;
