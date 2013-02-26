$(document).ready(function () {
    var url = document.URL.split('/');
    url.length = 3;
    url = url.join('/');
	var socketInfo = io.connect(url + '/info');
	var total = [],
		len,
		table = $('<table/>', {
		    "class": "table table-bordered table-hover"
		}),
		content = $('.content');
	var getUptime = function (seconds) {
			var kof = Math.floor(seconds/86400),
				div = seconds - kof*86400,
				days = (kof > 0) ? kof : 0,
				hours,
				minutes;
			kof = Math.floor(div/3600);
			hours = (kof > 0) ? kof : 0;
			div -= kof*3600;
			kof = Math.floor(div/60);
			minutes = (kof > 0) ? kof : 0;
			minutes = Math.floor(minutes);
			return "" + days + "d :" + hours + "h :" + minutes + "m";
		},
		buildActionMenu = function (href) {
			var block = $('<td/>');
			block.append($('<a/>', {
                "class": "tooltips",
                "data-original-title": "Start process",
                "data-placement": "top",
                "data-delay": {show: 300, hide: 200},
                "href": "#"
            }).append($('<i/>', {
				"class": "border icon-play",
				"data-href": href,
				"data-action": "start"
			}))).append($('<a/>', {
                "class": "tooltips",
                "data-original-title": "Stop process",
                "data-placement": "top",
                "data-delay": {show: 300, hide: 200},
                "href": "#"
            }).append($('<i/>', {
				"class": "border icon-stop",
				"data-href": href,
				"data-action": "stop"
			}))).append($('<a/>', {
                "class": "tooltips",
                "data-original-title": "Restart process",
                "data-placement": "top",
                "data-delay": {show: 300, hide: 200},
                "href": "#"
            }).append($('<i/>', {
				"class": "border icon-refresh",
				"data-href": href,
				"data-action": "restart"
			}))).append($('<a/>', {
                "class": "tooltips",
                "data-original-title": "Unwatch process",
                "data-placement": "top",
                "data-delay": {show: 300, hide: 200},
                "href": "#"
            }).append($('<i/>', {
				"class": "border icon-eye-close",
				"data-href": href,
				"data-action": "unmonitor"
			})));
			return block;
		},
		buildTable = function (data, table) {
			var dns = data.dns,
                alias = data.alias || dns,
                id = data.id,
                processes = data.body.monit.service,
                length = processes.length,
				row,
                count = 0;
			row = table.find('#' + id);
            if (data.message !== undefined) {
                row.append($('<td/>',
                    {
                    "colspan": 4,
                    "text": dns
                    })).append($('<td/>',
                    {
                    "colspan": 4,
                    "text": data.message
                }));
                row.addClass('error');
            } else {
                $('<td/>').append($('<a/>', {"class": "inform",
                                             "href": dns,
                                             "text": alias})).appendTo(row);
                for (var i = 0; i < length; i += 1) {
                    if (processes[i].type == 3) {
                        $('<td/>', {text: processes[i].name}).appendTo(row);
                        if (processes[i].uptime !== undefined) {
                            $('<td/>', {text: processes[i].pid}).appendTo(row);
                            $('<td/>', {text: 'running'}).appendTo(row);
                            $('<td/>', {text: getUptime(parseInt(processes[i].uptime, 10))}).appendTo(row);
                            $('<td/>', {text: processes[i].cpu.percenttotal + '%'}).appendTo(row);
                            $('<td/>', {text: processes[i].memory.percenttotal + '% [' + processes[i].memory.kilobytetotal + 'kb]'}).appendTo(row);
                            $(buildActionMenu(dns + '/' + processes[i].name)).appendTo(row);
                        } else {
                            row.addClass('error');
                            $('<td/>').appendTo(row);
                            $('<td/>', {text: 'stopped'}).appendTo(row);
                            $('<td/>', {text: '0'}).appendTo(row);
                            $('<td/>', {text: '0'}).appendTo(row);
                            $('<td/>', {text: '0'}).appendTo(row);
                            $('<td/>').append($('<a/>', {
                                "class": "tooltips",
                                "data-original-title": "Watch process",
                                "data-placement": "top",
                                "data-delay": {show: 300, hide: 200},
                                "href": "#"
                            }).append($('<i/>', {"class": "center icon-eye-open",
                                                "data-href": dns + '/' + processes[i].name,
                                                "data-action": "monitor"}))).appendTo(row);
                        }
                        row.after($('<tr/>'));
                        row = row.next();
                    } else {
                        count += 1;
                    }
                }
                    table.find('#' + id + ' td:first-child').attr('rowspan', length - count);
            }
        };
	socketInfo.on('data', function (data) {
		var tbody,
			i;
		total.push(data);
		if (total.length === len) {
			table.html('<thead><th>Hostname</th><th>Processes</th><th>PID</th><th>Status</th><th>Uptime</th><th>Total CPU usage</th><th>Total memory usage</th><th>Actions</th></thead>');
			tbody = $('<tbody/>').appendTo(table);
			for (i = 0; i <= len; i++) {
				tbody.append($('<tr/>', {
					'id': i
				}));
			}
			$(total).each(function (i, data) {
				buildTable(data, table);
			}).promise().done(function () {
					console.log(total);
                    $('.tooltip').detach();
					content.html(table);
				});
			total = [];
		}
	});
	socketInfo.on('good', function (data) {
		console.log(data);
	});
	socketInfo.on('length', function (data) {
		len = data.length;
	});
    content.delegate('.tooltips', 'mouseover', function () {
        "use strict";
        $(this).tooltip('show');
    });
    content.delegate('.tooltips', 'mouseout', function () {
        "use strict";
        $(this).tooltip('hide');
    });
	content.delegate('i', 'mousedown', function () {
		var self = $(this),
			selfClass = self.attr('class').split(' ');
		selfClass = selfClass.pop();
		self.removeClass(selfClass).addClass(selfClass + '-white');
	});
	content.delegate('i', 'mouseup', function () {
		var self = $(this),
			selfClass = self.attr('class').split(' ');
		selfClass = selfClass.pop();
		self.removeClass(selfClass).addClass(selfClass.substring(0,selfClass.indexOf('-white')));
	});
	content.delegate('i', 'click', function () {
		var self = $(this),
			href = self.data('href'),
			action = self.data('action');
		console.log(href, action);
		socketInfo.emit('sendData', {href: href, action: action});
	});
	content.delegate('.inform', 'click', function (e) {
		e.preventDefault();
		window.location.href = '/inform?href=' + $(this).attr('href') + '&cluster=' + document.URL.split('/')[4];
	});
});