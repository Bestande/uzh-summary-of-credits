'use strict';

var co = require('co');
var scraper = require('./scraper');
var statsCalculator = require('./stats');
var personal = require('./personal');
var parser = require('./parser');

module.exports = function (username, password, fetch) {
	return new Promise((resolve, reject) => {
		co(function *() {
			if (!username) {
				throw new Error('NO_USERNAME');
			}
			if (!password) {
				throw new Error('NO_PASSWORD');
			}
			let result = yield scraper.get(username, password, fetch);
			let credits = parser.fromHTML(result.html);
			let stats = statsCalculator.calculate(credits);
			let directions = personal.getStudyDirection(result.html);
			let categories = yield listing.getCategories(credits);
			resolve({
				stats,
				directions,
				credits,
				categories,
				success: true,
				version: 2
			});
		})
		.catch(reject);
	});
};
