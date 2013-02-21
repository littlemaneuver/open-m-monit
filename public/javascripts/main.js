$(document).ready(function () {
    var url = document.URL.split('/');
    url.length = 3;
    url = url.join('/');
	var socketInfo = io.connect(url + '/info');
	var total = [],
		len,
		count = 0,
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
			block.append($('<i/>', {
				"class": "border icon-play",
				"data-href": href,
				"data-action": "start"
			})).append($('<i/>', {
				"class": "border icon-stop",
				"data-href": href,
				"data-action": "stop"
			})).append($('<i/>', {
				"class": "border icon-refresh",
				"data-href": href,
				"data-action": "restart"
			})).append($('<i/>', {
				"class": "border icon-eye-close",
				"data-href": href,
				"data-action": "unmonitor"
			}));
			return block;
		},
		buildTable = function (data, table) {
			var dns = data.dns,
                alias = data.alias || dns,
                id = data.id,
                processes = data.body.monit.service,
                length = processes.length,
				row;
			row = table.find('#' + id);
            if (data.message !== undefined) {
                $('<td colspan="4">' + dns + '</td><td colspan="4">' + data.message + '</td>').appendTo(row);
                row.addClass('error');
            } else {
                $('<td><a class="inform" href="' + dns + '">' + alias + '</a></td>').appendTo(row);
                for (var i = 0; i < length - 1; i += 1) {
                    $('<td>' + processes[i].name + '</td>').appendTo(row);
                    if (processes[i].uptime) {
                        $('<td>' + processes[i].pid + '</td>').appendTo(row);
                        $('<td>running</td>').appendTo(row);
                        $('<td>' + getUptime(parseInt(processes[i].uptime, 10)) + '</td>').appendTo(row);
                        $('<td>' + processes[i].cpu.percenttotal + '%</td>').appendTo(row);
                        $('<td>' + processes[i].memory.percenttotal + '% [' + processes[i].memory.kilobytetotal + 'kb]</td>').appendTo(row);
                        $(buildActionMenu(dns + '/' + processes[i].name)).appendTo(row);
                    } else {
                        row.addClass('error');
                        row.append('<td></td>');
                        row.append('<td>stopped</td>');
                        row.append('<td>0</td>');
                        row.append('<td>0</td>');
                        row.append('<td>0</td>');
                        row.append('<td><i class="center icon-eye-open" data-href="' + dns + '/' + processes[i].name + '" data-action="monitor")</i></td>');
                    }
                    row.after('<tr></tr>');
                    row = row.next();
                    }
                    table.find('#' + id + ' td:first-child').attr('rowspan', length);
            }
        };
	socketInfo.on('data', function (data) {
		var tbody,
			i;
		total.push(data);
		if (total.length === len) {
			table.html('<thead><th>Hostname</th><th>Processes</th><th>PID</th><th>Status</th><th>Uptime</th><th>Total CPU usage</th><th>Total memory usage</th><th>Actions</th></thead><tbody></tbody>');
			tbody = table.find('tbody');
			for (i = 0; i <= len; i++) {
				tbody.append($('<tr/>', {
					'id': i
				}));
			}
			$(total).each(function (i, data) {
				buildTable(data, table);
			}).promise().done(function () {
					console.log(total);
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