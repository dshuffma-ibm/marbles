var fs = require('fs');
var path = require('path');

module.exports = function (logger) {
	var misc = {};
	let creds_path = null;

	// See if marbles is running within IBM Cloud or not - return connection profile if so, null if not
	misc.detectingIbmCloud = function () {
		if (process.env.VCAP_SERVICES) {											// if we are in bluemix, use vcap
			logger.info('Detecting that we are in IBM Cloud');
			let VCAP = null;
			try {
				VCAP = JSON.parse(process.env.VCAP_SERVICES);
			} catch (e) {
				logger.error('VCAP from IBM Cloud is not JSON... this is bad');
			}
			//console.log('testing vcap', typeof VCAP, JSON.stringify(VCAP));

			for (let plan_name in VCAP) {
				console.log('looking at plan', plan_name);
				if (plan_name.indexOf('blockchain') >= 0) {
					logger.info('pretty sure this is the IBM Blockchain Platform service:', plan_name);
					console.log('test 1', VCAP[plan_name][0]);
					console.log('test 2', VCAP[plan_name][0].credentials);
					console.log('test 3', VCAP[plan_name][0].credentials.credentials);
					console.log('test 4', VCAP[plan_name][0].credentials.credentials[0]);
					if (VCAP[plan_name][0].credentials && VCAP[plan_name][0].credentials.credentials) {	//pull the first one
						return VCAP[plan_name][0].credentials.credentials[0];		// this should be our connection profile
					}
				}
			}
			logger.error('uh oh, we are using IBM Cloud but I could not find VCAP');
		}
		return null;
	};

	// Check if blockchain creds files are okay
	misc.check_creds_for_valid_json = function (cb) {
		if (!misc.detectingIbmCloud()) {
			if (!process.env.creds_filename) {
				process.env.creds_filename = 'marbles_tls.json';				//default to a file
			}

			var config_path = path.join(__dirname, '../config/' + process.env.creds_filename);
			try {
				let configFile = require(config_path);
				creds_path = path.join(__dirname, '../config/' + configFile.cred_filename);
				let creds = require(creds_path);
				if (creds.name) {
					logger.info('Checking credentials file is done');
					return null;
				} else {
					throw 'missing network id';
				}
			} catch (e) {
				logger.error('---------------------------------------------------------------');
				logger.error('----------------------------- Bah -----------------------------');
				logger.error('------------- The credentials file is malformed ---------------');
				logger.error('---------------------------------------------------------------');
				logger.error('Fix this file: ' + creds_path);
				logger.warn('It must be valid JSON.  You may have dropped a comma or added one too many.');
				logger.warn('----------------------------------------------------------------------');
				logger.error(e);
				process.exit();									//all stop
			}
		}
	};

	// Create Random integer between and including min-max
	misc.getRandomInt = function (min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	};

	// Create a Random string of x length
	misc.randStr = function (length) {
		var text = '';
		var possible = 'abcdefghijkmnpqrstuvwxyz0123456789';
		for (var i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	};

	// Real simple hash
	misc.simple_hash = function (a_string) {
		var hash = 0;
		for (var i in a_string) hash ^= a_string.charCodeAt(i);
		return hash;
	};

	// Sanitize marble owner names
	misc.saferNames = function (usernames) {
		var ret = [];
		for (var i in usernames) {
			var name = usernames[i].replace(/\W+/g, '');					//names should not contain many things...
			if (name !== '') ret.push(name.toLowerCase());
		}
		return ret;
	};

	// Delete a folder
	misc.rmdir = function (dir_path) {
		if (fs.existsSync(dir_path)) {
			fs.readdirSync(dir_path).forEach(function (entry) {
				var entry_path = path.join(dir_path, entry);
				if (fs.lstatSync(entry_path).isDirectory()) {
					misc.rmdir(entry_path);
				}
				else {
					fs.unlinkSync(entry_path);
				}
			});
			fs.rmdirSync(dir_path);
		}
	};

	return misc;
};
