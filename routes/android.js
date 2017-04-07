var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/username/:username', function(req, res, next) {
	console.log(req.params.username);
  res.send('respond with a resource');
});

module.exports = router;
