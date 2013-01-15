$(document).ready(function () {
	var serverInfo = io.connect('http://localhost:3000/server'),
		content = $('.content');
	var buildInform = function (data) {
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
				htr.append('<th>' + prop + '</th>');
				btr.append('<td>' + data[prop] + '</td>');
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