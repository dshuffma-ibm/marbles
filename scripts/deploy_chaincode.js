// ============================================================================================================================
// 													Deploy Chaincode
// This file shows how to install and instantiate chaincode onto a Hyperledger Fabric Peer via the SDK + FC Wrangler
// ============================================================================================================================
var winston = require('winston');								//logger module
var path = require('path');
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
		new (winston.transports.Console)({ colorize: true }),
	]
});

// --- Set Details Here --- //
const config_file = 'marbles_tc.json';							//set config file name
const chaincode_id = 'marbles';									//set desired chaincode id to identify this chaincode
const chaincode_ver = String(Date.now());						//unique-ish chaincode version
const chaincode_args = ['12345'];								//any random number will do for Marbles

var helper = require(path.join(__dirname, '../utils/helper.js'))(config_file, logger);			//set the config file name here
var fcw = require(path.join(__dirname, '../utils/fc_wrangler/index.js'))({ block_delay: helper.getBlockDelay() }, logger);
const channel = helper.getFirstChannelId();						//set the name of the channel here, or use the first channel

console.log('---------------------------------------');
logger.info('Lets install some chaincode -', chaincode_id, chaincode_ver);
console.log('---------------------------------------');

logger.info('First we enroll');
fcw.enrollWithAdminCert(helper.makeEnrollmentOptionsUsingCert(), function (enrollErr, enrollResp) {
	if (enrollErr != null) {
		logger.error('error enrolling', enrollErr, enrollResp);
	} else {
		console.log('---------------------------------------');
		logger.info('Now we install');
		console.log('---------------------------------------');

		const first_peer = helper.getFirstPeerName(channel);
		var opts = {
			peer_urls: [helper.getPeersUrl(first_peer)],
			path_2_chaincode: 'marbles',				//path to chaincode from <marbles root>/chaincode/src/
			chaincode_id: chaincode_id,
			chaincode_version: chaincode_ver,
			peer_tls_opts: helper.getPeerTlsCertOpts(first_peer)
		};
		fcw.install_chaincode(enrollResp, opts, function (err, resp) {
			console.log('---------------------------------------');
			logger.info('Install done. Errors:', (!err) ? 'nope' : err);
			console.log('---------------------------------------');
			var opts2 = {
				peer_urls: [helper.getPeersUrl(first_peer)],
				channel_id: helper.getFirstChannelId(),
				chaincode_id: chaincode_id,
				chaincode_version: chaincode_ver,
				cc_args: chaincode_args,
				peer_tls_opts: helper.getPeerTlsCertOpts(first_peer)
			};
			fcw.instantiate_chaincode(enrollResp, opts2, function (err2, resp2) {
				console.log('---------------------------------------');
				logger.info('Instantiate done. Errors:', (!err2) ? 'nope' : err2);
				console.log('---------------------------------------');
				if (err2) {
					fcw.upgrade_chaincode(enrollResp, opts2, function (err3, resp3) {
						console.log('---------------------------------------');
						logger.info('Upgrade done. Errors:', (!err) ? 'nope' : err);
						console.log('---------------------------------------');
					});
				}
			});
		});
	}
});
