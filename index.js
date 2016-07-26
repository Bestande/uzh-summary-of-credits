'use strict';

var co = require('co');
var scraper = require('./scraper');
var statsCalculator = require('./stats');
var personal = require('./personal');
var parser = require('./parser');
var demo = require('./demo');

function all(username, password, fetch, feedback) {
	return co(function *() {
		if (!username) {
			throw new Error('NO_USERNAME');
		}
		if (!password) {
			throw new Error('NO_PASSWORD');
		}
		if (username === 'bestande' && password === 'bestande') {
			return demo;
		}
		let result = yield scraper.get(username, password, fetch, feedback);
		let credits = parser.fromHTML(result.html);
		let stats = statsCalculator.calculate(credits);
		let directions = personal.getStudyDirection(result.html);
		return {
			stats,
			directions,
			credits,
			success: true,
			version: 3
		};
	});
}

module.exports = {
	all,
	scraper,
	stats: statsCalculator,
	personal,
	parser
};
