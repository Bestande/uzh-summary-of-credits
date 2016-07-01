'use strict';
var fs = require('fs');
var cheerio = require('cheerio');
var _ = require('underscore');
var getShortName = require('@jonny/uzh-course-shortname');

var getStatus = function (d) {
	if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_s_okay.gif') {
		return 'PASSED';
	}
	else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_ston.gif') {
		return 'DESELECTED';
	}
	else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_canc.gif') {
		return 'FAILED';
	}
	else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_bokd.gif') {
		return 'BOOKED';
	}
	else {
		return 'UNKNOWN';
	}
};

exports.groupBySemester = function (rows) {
	rows = _.groupBy(rows, (row) => {
		var ay = row.link.match(/.ch\/((HS|FS)[0-9]+)/);
		return ay[1];
	});
	rows = _.map(rows, (row, key) => {
		return {
			semester: key,
			credits: row
		};
	});
	return _.sortBy(rows, (row) => (0 - parseInt(row.semester.replace(/[^\d.]/g, '')) + row.semester)).reverse();
};

exports.fromHTML = function (html) {
	let $ = cheerio.load(html);
	let rows = $('table').last().find('tr');
	rows = _.map(rows, function (row) {
		if (row.type === 'tag' && row.name === 'tr' && row.children[0].name && row.children[2].children[0].children) {
			var grade;
			try {
				grade = $(row.children[9].children[0]).text().trim();
			}
			catch (e) {
				grade = 'BEST';
			}
			return {
				module: $(row.children[0].children[0]).text().trim(),
				name: $(row.children[2].children[0].children[0]).text().trim(),
				short_name: getShortName($(row.children[2].children[0].children[0]).text().trim()),
				link: unescape(row.children[2].children[0].attribs.href).trim(),
				credits_worth: parseFloat($(row.children[3].children[0]).text().trim()) || 0,
				status: getStatus(row.children[5].children[0]),
				credits_received: parseFloat($(row.children[8].children[0]).text().trim()) || 0,
				grade: grade
			};
		}
	});
	rows = _.compact(rows);
	return rows;
};
