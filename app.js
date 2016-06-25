
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
    , cache = require('./routes/cache');

var app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	request = require('request'),
	fs = require('fs'),
	xml = require('node-xml2json'),
	dnsList = JSON.parse(fs.readFileSync('config.json', 'utf-8')),
    connectionConf = JSON.parse(fs.readFileSync('port.json', 'utf-8')),
    clusters = Object.keys(dnsList),
    cluster = clusters[0],
    smallDnsList =  dnsList[cluster],
	serverInterval,
    infoTime = 5000 * (smallDnsList.length + 1),
	infoInterval,
    port,
    totalArray = [],
    firstTimeUse = {};

clusters.forEach(function (name) {
    "use strict";
    firstTimeUse[name] = false;
});

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
  //app.use(express.logger('dev'));
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
    cluster = clusters[0];
    smallDnsList =  dnsList[cluster];
});

var findInform = function (hostname, data) {
	var inform = {};
	for (var i = 0; i< data.length; i++) {
		if (data[i].hostname === hostname) {
			inform = {
                username: data[i].username,
                password: data[i].password,
			    hostname: data[i].hostname,
                alias: data[i].alias
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
    res.redirect('/cluster/' + cluster);

	//res.render('index', {href: '', dnsList: Object.keys(dnsList)});
});
app.get('/cluster/:clusterName', function (req, res) {
    "use strict";
    cluster = req.params.clusterName;
    firstTimeUse[cluster] = true;
    clearInterval(infoInterval);
    clearInterval(serverInformation);
    smallDnsList = dnsList[cluster];
    infoTime = 5000 * (smallDnsList.length + 1);
    res.render('index', {clusters: clusters, href: ''});
});
app.get('/inform', function (req, res) {
    clearInterval(infoInterval);
	var href = req.query.href.replace(/%2F/, '/').replace(/%3A/, ':');
    cluster = req.query.cluster.replace(/%2F/, '/').replace(/%3A/, ':');
    smallDnsList = dnsList[cluster];
	serverInformation = findInform(href, smallDnsList);
	res.render('index', {clusters: clusters,
        href: serverInformation.hostname,
        alias: serverInformation.alias});
});

var getProtocol = function (config) {
  return (config.protocol || 'http') + '://';
};

var buildBaseUrl = function (config) {
  return getProtocol(config) + config.username + ':' + config.password + '@' + config.hostname + "/_status?format=xml";
}

var refreshServer = function () {
	var url =  buildBaseUrl(serverInformation);
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
	var url = buildBaseUrl(serverInformation) + "/_status?format=xml";
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
    totalArray = cache.use(cluster);
    if (firstTimeUse[cluster] && totalArray) {
        socket.emit('data', {data: totalArray});
        cache.remove(cluster);
        firstTimeUse[cluster] = false;
    } else {
        totalArray = [];
        smallDnsList.forEach(function (dns, index, list) {
            var url = buildBaseUrl(dns) + ;
            request({url : url, timeout: 5000}, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    totalArray.push({ body: xml.parser(body), id: index, dns: dns.hostname, alias: dns.alias});
                } else {
                    totalArray.push({ body: {monit:{service:[]}}, id: index, dns: dns.hostname,  message: 'Your server is not available!'});
                }
                if (totalArray.length === list.length) {
                    socket.emit('data', {data: totalArray});
                    cache.add(cluster, totalArray);
                    totalArray = [];
                }
            });
        });
    }
	socket.on('sendData', function (data) {
		var information = findInform(data.href.split('/')[0], smallDnsList);

		request.post({
			url: getProtocol(information) + information.username + ":" + information.password + "@" + data.href,
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
    totalArray = cache.use(cluster);
    if (firstTimeUse[cluster] && totalArray) {
        info.emit('data', {data: totalArray});
        cache.remove(cluster);
        firstTimeUse[cluster] = false;
    } else {
        totalArray = [];
        smallDnsList.forEach(function (dns, index, list) {
            var url = buildBaseUrl(dns);
            request({url : url, timeout: 5000}, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    totalArray.push({ body: xml.parser(body), id: index, dns: dns.hostname, alias: dns.alias});
                } else {
                    totalArray.push({ body: {monit:{service:[]}}, id: index, dns: dns.hostname,  message: 'Your server is not available!'});
                }
                if (totalArray.length === list.length) {
                    info.emit('data', {data: totalArray});
                    totalArray = [];
                }
            });
        });
    }
};

server.listen( app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

