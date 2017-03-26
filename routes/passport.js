var LocalStrategy   = require('passport-local').Strategy;

// expose this function to our app using module.exports
module.exports = function(passport, con) {

    passport.serializeUser(function(user, done) {
	    done(null, user.username);
	});

	// used to deserialize the user
	passport.deserializeUser(function(username, done) {
	    con.query('SELECT * FROM users WHERE username = ? LIMIT 1', username, function(err, user){
            done(err, user[0]);
        });
	});

    passport.use('local-signin', new LocalStrategy({
        passReqToCallback : true 
	},
	  function(req, username, password, done) {
	  	con.query('SELECT * FROM users WHERE username = ?', username, function(err, rows){
            if (err) {
                return done(err);
            } else {
                if (rows.length === 0) {
                    return done(null, false);
                } else if (rows[0].password !== password) {
                    return done(null, false);
                }
                return done(null, rows[0]);
            }
        });
	  }
	));

};