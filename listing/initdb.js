var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('./data/info.db');

db.serialize(function () {
	db.run(`
		create table categories (
			id int primary key,
			text varchar(140)
		);
	`);
	db.run(`
		create table maps (
			module int,
			category varchar(255),
			constraint uniquemap (module, category)
		);
	`);
	db.run(`
		create index moduleindex
		on maps (module)
	`);
});

db.close()