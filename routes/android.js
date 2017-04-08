var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/login', function(req, res, next) {
	console.log(req.query);
	res.send("Hello I am a response");
});

module.exports = router;
