'use strict';
var cheerio = require('cheerio-without-node-native');
var _ = require('underscore');
var getShortName = require('@jonny/uzh-course-shortname');
var uzhSemesters = require('@jonny/uzh-semesters');
var uzhCoursesWithoutModule = require('uzh-courses-with-no-module');

var getStatus = function (d) {
	if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_s_okay.gif') {
		return 'PASSED';
	} else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_ston.gif') {
		return 'DESELECTED';
	} else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_canc.gif') {
		return 'FAILED';
	} else if (d.name === 'img' && d.attribs.src === '/sap/bc/bsp/sap/PUBLIC/z_studium/imgs/s_b_bokd.gif') {
		return 'BOOKED';
	}
	return 'UNKNOWN';
};

exports.groupBySemester = function (rows) {
	rows = _.groupBy(rows, row => row.link.match(/.ch\/((HS|FS)[0-9]+)/)[1]);
	rows = _.map(rows, (row, key) => {
		return {
			semester: key,
			credits: row
		};
	});
	return _.sortBy(rows, row => uzhSemesters.all.indexOf(row.semester)).reverse();
};

exports.filterDuplicates = function (credits) {
	var keys = [];
	credits = _.sortBy(credits, credit => {
		if (credit.status === 'BOOKED') {
			return 0;
		}
		if (credit.status === 'PASSED') {
			return 1;
		}
		if (credit.status === 'FAILED') {
			return 2;
		}
		if (credit.status === 'DESELECTED') {
			return 3;
		}
		return 4;
	});
	credits = credits.filter(credit => {
		var key = credit.link + credit.status;
		if (keys.indexOf(key) > -1) {
			return false;
		}
		keys.push(key);
		return true;
	});
	credits = credits.map((credit, index) => {
		credit.link += '#' + index;
		return credit;
	});
	return credits;
};

const getNativeLinkFromRow = row => {
	if (!row.children[2].children) {
		return null;
	}
	if (!row.children[2].children[0].attribs) {
		return null;
	}
	return row.children[2].children[0].attribs.href;
};
const getSemesterForRow = row => {
	if (!row) {
		return 'HS16';
	}
	let match = cheerio(row).html().match(uzhSemesters.regex);
	if (!match) {
		return 'HS16';
	}
	return match[1];
};

const getLinkFromRow = (row, nextrow) => {
	const nativeLink = getNativeLinkFromRow(row);
	if (nativeLink) {
		return nativeLink;
	}
	const identifier = cheerio(row.children[0]).text().trim();
	const semester = getSemesterForRow(nextrow);
	const dataset = uzhCoursesWithoutModule.data[semester];
	if (!dataset) {
		return null;
	}
	if (!dataset[identifier]) {
		return null;
	}
	return `http://www.vorlesungen.uzh.ch/${semester}/suche/e-${dataset[identifier][0]}.details.html`;
};

exports.fromHTML = function (html) {
	let $ = cheerio.load(html);
	let rows = $('table').last().find('tr');
	rows = _.map(rows, function (row, i) {
		if (row.type === 'tag' && row.name === 'tr' && row.children[3].name && $(row.children[3]).text().trim() !== '' && $(row.children[3]).text().trim() !== 'VVZ-Nr.') {
			var grade;
			try {
				grade = $(row.children[9].children[0]).text().trim();
			} catch (e) {
				grade = 'BEST';
			}
			/* eslint-disable camelcase */
			const link = getLinkFromRow(row, rows[i + 1]);
			return {
				module: $(row.children[0].children[0]).text().trim(),
				name: $(row.children[2].children[0]).text().trim(),
				short_name: getShortName($(row.children[2].children[0]).text().trim()),
				link: link && unescape(link).trim(),
				credits_worth: parseFloat($(row.children[3].children[0]).text().trim()) || 0,
				status: getStatus(row.children[5].children[0]),
				credits_received: parseFloat($(row.children[8].children[0]).text().trim()) || 0,
				grade: grade
			};
			/* eslint-enable camelcase */
		}
	});
	rows = _.compact(rows);
	rows = _.filter(rows, r => r.link);
	rows = exports.filterDuplicates(rows);
	return rows;
};
