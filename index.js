'use strict';

var co = require('co');
var scraper = require('./scraper');
var statsCalculator = require('./stats');
var personal = require('./personal');
var parser = require('./parser');
var listing = require('./listing');

module.exports = function (username, password) {
	return new Promise((resolve, reject) => {
		co(function *() {
			if (!username) {
				throw new Error('NO_USERNAME');
			}
			if (!password) {
				throw new Error('NO_PASSWORD');
			}
			let result = yield scraper.get(username, password);
			let credits = parser.fromHTML(result.html);
			let stats = statsCalculator.calculate(credits);
			let directions = personal.getStudyDirection(result.html);
			credits = yield listing.addPaths(credits, directions);
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
