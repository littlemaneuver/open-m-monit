
/*
 * GET users listing.
 */
var request = require('request'),
	fs = require('fs'),
	xml = require('xmlparser'),
	data = JSON.parse(fs.readFileSync('config.json', 'utf-8')),
	findInform = function (hostname, data) {
		var inform = {};
		for (var i = 0; i< data.length; i++) {
			if (data[i].hostname === hostname) {
				inform.username = data[i].username;
				inform.password = data[i].password;
			}
		}
		return inform;
	};
exports.view = function(req, res){
	var host = req.query.host.replace(/%2F/, '/').replace(/%3A/, ':'),
		url,
		information = findInform(host, data);
	url = "http://" + information.username + ":" + information.password + "@" + host + "/_status?format=xml";
	request({url : url}, function (error, response, body) {
		console.dir(xml.parser(body));
	});
};
exports.sendData = function(req,res){
	var name = req.query.name,
		url = req.query.host.replace(/%2F/, '/').replace(/%3A/, ':').substr(1),
		body = 'action=' + req.query.action,
		information = findInform(url, data);
	console.log(url);
	request.post({
		url: "http://" + information.username + ":" + information.password + "@" + url,
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		body: body
	}, function (error, response, body) {

	});
};