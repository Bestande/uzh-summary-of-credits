var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./data/info.db');
var async = require('async');
var _ = require('underscore')

var semester_to_import = process.argv[2];

var semester = require('./data/' + semester_to_import + '-map.json');
var categories = _.flatten(_.values(semester));

async.eachSeries(categories, (category, cb) => {
	db.run(`insert into categories values (?, ?)`, [category.id, category.text], (err, resp) => {
		if (err) {
			if (err.errno == 19) err = null;
		}
		console.log('insert', category)
		cb(err, resp)
	});
}, () => {
	var finalmap = [];
	_.each(semester, (maps, module) => _.each(maps, (_map) => finalmap.push({module, category: _.pluck(_map, 'id').join(',')})));
	async.eachSeries(finalmap, (map, cb) => {
		db.run(`insert into maps values(?, ?)`, [map.module, map.category], (err, resp) => {
			console.log('insert', map)
			cb(err, resp)
		});
	});
});

