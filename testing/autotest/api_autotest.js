/**
 * modified api.js for automatic testing, uses native code
 */
var aes = require("../../server/api/aes_gibberish");
var najax = require("najax");
var path = require("path");
var ursa = require("ursa");
var fs = require("fs");


/** The server address and port for the API server - edit this if you need to! **/
var APISERVER = "api.saeu";
var APIPORT = 1230;

/** Ping / Query Timeouts: Abort request if server doesn't answer within given time **/
var TIMEOUT_INTRANET = 1500;
var TIMEOUT_INTERNET = 4000;
var TIMEOUT_QUERY = 5000;

var APIURL = "http://" + APISERVER + ":" + APIPORT + "/";

/**
 * Encryption utilities
 * RSA: Encryption of the symmetric AES password that is generated by the client.
 *      Only the server has the private key, the public keys are distributed to all clients!
 * AES: Encryption of the actual JSON-stringified payload string.
 */

/**
 * Load RSA Public Key
 */
var pubkey = ursa.createPublicKey(fs.readFileSync(path.join(__dirname, "pubkey.pem")));

function encrypt_passphrase (passphrase) {
	return pubkey.encrypt(passphrase, "utf8", "base64", ursa.RSA_PKCS1_PADDING);
}

function randomString(length) {
	var s = "";
	for (var i = 0; i < length; i++)
		s += String.fromCharCode(32 + Math.floor(Math.random() * 94));
	return s;
}

function encrypt_query(passphrase, query) {
	return aes.encrypt(JSON.stringify(query), passphrase);
}

function decrypt_answer(passphrase, answer) {
	try {
		var plain = aes.decrypt(answer, passphrase);
		return JSON.parse(plain.toString());
	} catch(e) {
		console.log("catch (decrypt_query): " + e);
	}
}

/**
 * send_query
 * This function takes care of generating a random passphrase, encrypting the payload string
 * as AES and then encrypting the random passphrase with the RSA public key.
 */
function send_query(name, query, cb) {
	// Generate AES passphrase
	var passphrase = randomString(32);
	var passphrase_encrypted = encrypt_passphrase(passphrase);

	var query_encrypted = encrypt_query(passphrase, query);

	var post = JSON.stringify({
		passphrase : passphrase_encrypted,
		encrypted : query_encrypted
	});

	var begin = Date.now();
	najax({
		type : "POST",
		contentType : "application/json",
		url : APIURL + "action/" + name,
		data : post,
		timeout : TIMEOUT_QUERY,
		success : function (res) {
			var servertime_ms = Date.now() - begin;
			cb(decrypt_answer(passphrase, res), servertime_ms);
		},
		error : function () {
			console.log("[!] AJAX error");
			cb(null, 0);
		}
	});
}

function action(name, payload, cb) {
	send_query(name, { payload : payload }, cb);
}

function action_cert(name, payload, certname, cb) {
	var cert = fs.readFileSync(path.join(__dirname, "cert", certname));
	send_query(name, { payload : payload, cert : cert.toString() }, cb);
}

module.exports = {
	action : action,
	action_cert : action_cert
};
