
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	request = require('request'),
	fs = require('fs'),
	xml = require('node-xml2json'),
	dnsList = JSON.parse(fs.readFileSync('config.json', 'utf-8')),
    connectionConf = JSON.parse(fs.readFileSync('port.json', 'utf-8')),
    clusters = Object.keys(dnsList),
    smallDnsList =  dnsList[Object.keys(dnsList)[0]],
	serverInterval,
    infoTime = 5000 * (Object.keys(smallDnsList).length + 1),
	infoInterval,
    port;
if (connectionConf.type === 'tcp') {
    port = connectionConf.port;
} else if (connectionConf.type === 'unix') {
    port = connectionConf.socket;
} else {
    port = 3000;
}
app.configure(function(){
  app.set('port', port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.enable('view cache');
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

fs.watchFile('config.json', function (current) {
    "use strict";
    dnsList = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    clusters = Object.keys(dnsList);
    smallDnsList =  dnsList[Object.keys(dnsList)[0]];
});

var findInform = function (hostname, data) {
	var inform = {};
	for (var i = 0; i< data.length; i++) {
		if (data[i].hostname === hostname) {
			inform = {
                username: data[i].username,
                password: data[i].password,
			    hostname: data[i].hostname,
                alias: data[i].alias,
                grid: data[i].grid
            };
		}
	}
	return inform;
};
var serverInfo = io.of('/server'),
	serverInformation;

app.get('/', function (req, res) {
    clearInterval(infoInterval);
    clearInterval(serverInformation);
    res.redirect('/cluster/' + clusters[0]);

	//res.render('index', {href: '', dnsList: Object.keys(dnsList)});
});
app.get('/cluster/:clusterName', function (req, res) {
    "use strict";
    clearInterval(infoInterval);
    clearInterval(serverInformation);
    smallDnsList = dnsList[req.params.clusterName];
    infoTime = 5000 * (Object.keys(smallDnsList).length + 1);
    res.render('index', {clusters: clusters, href: ''});
});
app.get('/inform', function (req, res) {
    clearInterval(infoInterval);
	var href = req.query.href.replace(/%2F/, '/').replace(/%3A/, ':'),
        clusterName = req.query.cluster.replace(/%2F/, '/').replace(/%3A/, ':');
    smallDnsList = dnsList[clusterName];
	serverInformation = findInform(href, smallDnsList);
	res.render('index', {clusters: clusters,
        href: serverInformation.hostname,
        alias: serverInformation.alias});
});

var refreshServer = function () {
	var url = 'http://' + serverInformation.username + ':' + serverInformation.password + '@' + serverInformation.hostname + "/_status?format=xml";
	request({url : url, timeout: 5000}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            body = xml.parser(body).monit;
            serverInfo.emit('serverInfo', {platform : body.platform, server: body.server, dns: serverInformation.hostname, alias: serverInformation.alias});
        } else {
            serverInfo.emit('serverInfo', {platform: {}, server: {}, dns: serverInformation.hostname, message: 'Your server is not available!'});
        }
	});
};

serverInfo.on('connection', function (socket) {
    clearInterval(infoInterval);
    clearInterval(serverInformation);
	var url = 'http://' + serverInformation.username + ':' + serverInformation.password + '@' + serverInformation.hostname + "/_status?format=xml";
	request({url : url, timeout: 5000}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            body = xml.parser(body).monit;
            serverInfo.emit('serverInfo', {platform : body.platform, server: body.server, dns: serverInformation.hostname, alias: serverInformation.alias});
        } else {
            serverInfo.emit('serverInfo', {platform: {}, server: {}, dns: serverInformation.hostname, message: 'Your server is not available!'});
        }
    });
    serverInterval = setInterval(refreshServer, 5000);
});


var info = io.of('/info').on('connection', function (socket) {
    clearInterval(infoInterval);
    clearInterval(serverInformation);
	socket.emit('length', {length: smallDnsList.length});
	smallDnsList.forEach(function (dns, index, list) {
		var url = 'http://' + dns.username + ':' + dns.password + '@' + dns.hostname + "/_status?format=xml";
		request({url : url, timeout: 5000}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                socket.emit('data', { body: xml.parser(body), id: index, dns: dns.hostname, alias: dns.alias});
            } else {
                socket.emit('data', { body: {monit:{service:[]}}, id: index, dns: dns.hostname,  message: 'Your server is not available!'});
            }
		});
	});
	socket.on('sendData', function (data) {
		var information = findInform(data.href.split('/')[0], smallDnsList);
		request.post({
			url: "http://" + information.username + ":" + information.password + "@" + data.href,
			headers: {'content-type' : 'application/x-www-form-urlencoded'},
			body: 'action=' + data.action
		}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                info.emit('good', {body: body});
            } else {
                info.emit('bad', {body: body});
            }
		});
	});
    infoInterval = setInterval(refresh, infoTime);
});



var refresh = function () {
	smallDnsList.forEach(function (dns, index, list) {
		var url = 'http://' + dns.username + ':' + dns.password + '@' + dns.hostname + "/_status?format=xml";
		request({url : url, timeout: 5000}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                info.emit('data', { body: xml.parser(body), id: index, dns: dns.hostname, alias: dns.alias});
            } else {
                info.emit('data', {body: {monit:{service:[]}}, id: index, dns: dns.hostname,  message: 'Your server is not available!'});
            }
		});
	});
};

server.listen( app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

