$(document).ready(function () {
    var url = document.URL.split('/');
    url.length = 3;
    url = url.join('/');
	var serverInfo = io.connect(url + '/server'),
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
        buildInform = function (data) {
            var prop,
                prop2,
                table = $('<table/>', {
                    "class": "table table-bordered table-hover"
                }),
                htr = $('<tr/>'),
                btr = $('<tr/>');
            for (prop in data) {
                if (typeof data[prop] === 'object') {
                    for (prop2 in data[prop]) {
                        htr.append('<th>' + prop2 + '</th>');
                        btr.append('<td>' + data[prop][prop2] + '</td>');
                    }
                } else {
                    if (prop === 'uptime') {
                        htr.append('<th>' + prop + '</th>');
                        btr.append('<td>' + getUptime(data[prop]) + '</td>');
                    } else {
                        htr.append('<th>' + prop + '</th>');
                        btr.append('<td>' + data[prop] + '</td>');
                    }
                }
            }
            return table.append($('<thead/>').append(htr)).append($('<tbody/>').append(btr));
		},
		buildTable = function (data) {
			div = $('<div/>');
			div.append('<h2>Paltform</h2>')
				.append(buildInform(data.platform))
				.append('<h2>Server</h2>')
				.append(buildInform(data.server));
			return div;
		};
	serverInfo.on('serverInfo', function (data) {
		content.html(buildTable(data));
	})
});