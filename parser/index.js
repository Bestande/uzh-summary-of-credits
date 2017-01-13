'use strict';
var cheerio = require('cheerio-without-node-native');
var _ = require('underscore');
var getShortName = require('@jonny/uzh-course-shortname');
var uzhSemesters = require('@jonny/uzh-semesters');

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
	if (d.name) {
		console.log('Unknown status', d.name);
	}
	if (d.attribs.src) {
		console.log('Unknown status', d.attribs.src);
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
		var key = credit.link + credit.status + credit.name;
		if (keys.indexOf(key) > -1) {
			return false;
		}
		keys.push(key);
		return true;
	});
	credits = credits.map((credit, index) => {
		if (credit.link) {
			credit.link += '#' + index;
		}
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

exports.formatLink = link => {
	let match = link.match(/\/details\/([0-9]{4})\/(003|004)\/SM\/([0-9]+)/);
	if (!match) {
		return link;
	}
	let [, year, semester, moduleid] = match;
	let semestercode = semester === '003' ? 'HS' : 'FS';
	year = semestercode === 'HS' ? parseInt(year.substr(2, 2), 10) : parseInt(year.substr(2, 2), 10) + 1;
	return `http://www.vorlesungen.uzh.ch/${semestercode}${year}/suche/sm-${moduleid}.modveranst.html`;
};

const getRow = row => {
	if (row.type === 'tag' &&
		row.name === 'tr' &&
		row.children[3].name &&
		cheerio(row.children[3]).text().trim() !== '' &&
		cheerio(row.children[3]).text().trim() !== 'VVZ-Nr.'
	) {
		var grade;
		try {
			grade = cheerio(row.children[9].children[0]).text().trim();
		} catch (e) {
			grade = 'BEST';
		}
		const link = getNativeLinkFromRow(row);
		if (!row.children[0] || !row.children[0].children) {
			return null;
		}
		/* eslint-disable camelcase */
		return {
			module: cheerio(row.children[0].children[0]).text().trim(),
			name: cheerio(row.children[2]).text().trim(),
			short_name: getShortName(cheerio(row.children[2]).text().trim()),
			link: link && exports.formatLink(unescape(link).trim()),
			credits_worth: parseFloat(cheerio(row.children[3].children[0]).text().trim()) || 0,
			status: getStatus(row.children[5].children[0]),
			credits_received: parseFloat(cheerio(row.children[8].children[0]).text().trim()) || 0,
			grade
		};
		/* eslint-enable camelcase */
	}
};

exports.fromHTML = function (html) {
	let $ = cheerio.load(html);
	let rows = $('table').last().find('tr');
	rows = Array.prototype.map.call(rows, getRow).filter(Boolean);
	rows = exports.filterDuplicates(rows);
	return rows;
};
