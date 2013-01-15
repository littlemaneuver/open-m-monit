
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  //, information = require('./routes/information')
  , http = require('http')
  , path = require('path');

var app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	request = require('request'),
	fs = require('fs'),
	xml = require('node-xml2json'),
	dnsList = JSON.parse(fs.readFileSync('config.json', 'utf-8')),
	serverInterval,
	infoInterval;

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

//app.configure('development', function(){
//  app.use(express.errorHandler());
//});

var findInform = function (hostname, data) {
	var inform = {};
	for (var i = 0; i< data.length; i++) {
		if (data[i].hostname === hostname) {
			inform.username = data[i].username;
			inform.password = data[i].password;
			inform.hostname = data[i].hostname;
		}
	}
	return inform;
};
var serverInfo = io.of('/server'),
	serverInformation;

app.get('/', function (req, res) {
	clearInterval(serverInterval);
	console.log(serverInterval);
	res.render('index', {href: ''});
});
app.get('/inform', function (req, res) {
	var href = req.query.href.replace(/%2F/, '/').replace(/%3A/, ':');
	clearInterval(infoInterval);
	console.log(infoInterval);
	serverInformation = findInform(href, dnsList);
	res.render('index', {href: href});
});

var refreshServer = function () {
	var url = 'http://' + serverInformation.username + ':' + serverInformation.password + '@' + serverInformation.hostname + "/_status?format=xml";
	request({url : url}, function (error, response, body) {
		body = xml.parser(body).monit;
		serverInfo.emit('serverInfo', {platform : body.platform, server: body.server, dns: serverInformation.hostname});
	});
};

serverInfo.on('connection', function (socket) {
	var url = 'http://' + serverInformation.username + ':' + serverInformation.password + '@' + serverInformation.hostname + "/_status?format=xml";
	request({url : url}, function (error, response, body) {
		body = xml.parser(body).monit;
		socket.emit('serverInfo', {platform : body.platform, server: body.server, dns: serverInformation.hostname});
	});
	serverInterval = setInterval(refreshServer, 5000);
});

var info = io.of('/info').on('connection', function (socket) {
	socket.emit('length', {length: dnsList.length});
	dnsList.forEach(function (dns, index, list) {
		var url = 'http://' + dns.username + ':' + dns.password + '@' + dns.hostname + "/_status?format=xml";
		request({url : url}, function (error, response, body) {
			socket.emit('data', { body: xml.parser(body), id: index, dns: dns.hostname});
		});
	});
	socket.on('sendData', function (data) {
		var information = findInform(data.href.split('/')[0], dnsList);
		request.post({
			url: "http://" + information.username + ":" + information.password + "@" + data.href,
			headers: {'content-type' : 'application/x-www-form-urlencoded'},
			body: 'action=' + data.action
		}, function (error, response, body) {
			info.emit('good', {body: body});
		});
	});
	infoInterval = setInterval(refresh, 5000);
});

var refresh = function () {
	dnsList.forEach(function (dns, index, list) {
		var url = 'http://' + dns.username + ':' + dns.password + '@' + dns.hostname + "/_status?format=xml";
		request({url : url}, function (error, response, body) {
			info.emit('data', { body: xml.parser(body), id: index, dns: dns.hostname});
		});
	});
};

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
