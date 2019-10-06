var lib = require('./');

lib
	.all('<username>', '<password>', require('node-fetch'), function (progress) {
		console.log(progress);
	})
	.then(function (result) {
		console.log('done', result);
	})
	.catch(function (err) {
		console.log(err);
	});
