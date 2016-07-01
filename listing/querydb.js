var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(process.cwd() + '/listing/data/info.db');
var Promise = require('bluebird');

exports.getSequencesForIds = (ids) => {
	var results = [];
	return new Promise((resolve, reject) => {
		db.each(`
			select distinct *
			from maps
			where module in (${ids.join()})
		`, (err, maps) => {
			if (err) {
				reject(err);
			}
			else {
				results.push(maps);
			}
		}, (err) => {
			if (err) { reject(err); }
			else {
				resolve(results);
			}
		});
	});
};

exports.getCategoriesForIds = (ids) => {
	var results = {};
	return new Promise((resolve, reject) => {
		db.each(`
			select distinct *
			from categories
			where id in (${ids.join()})
		`, (err, category) => {
			if (err) {
				reject(err);
			}
			else {
				results[category.id] = category.text;
			}
		}, (err) => {
			if (err) { reject(err); }
			else {
				resolve(results);
			}
		});
	});
};
