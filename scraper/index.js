'use strict';

const config = require('./const.js');
var status = require('./status.js');
var qs = require('qs');

if (!fetch) {
	var fetch = require('node-fetch');
}
let fetchCookie = require('fetch-cookie');
let cheerio = require('cheerio');
let FormData = require('form-data');


let _ = require('underscore');

let first_request = function (fetchInstance) {
	return new Promise(function (resolve, reject) {
		fetchInstance(config.AUTH_URL, {
			redirect: 'manual'
		})
		.then(response => response.headers.get('location'))
		.then(location => fetchInstance(location, {redirect: 'manual'}))
		.then(response => response.headers.get('location'))
		.then(location => fetchInstance(location))
		.then(response => response.text())
		.then(body => {
			if (body.indexOf('You don\'t have permission to access the requested object') > -1) {
				return reject(new Error('Anfrage wurde blockiert'));
			}
			var url = body.match(/action=\"(.*?)\"/);
			resolve(url[1]);
		})
		.catch(reject);
	});
};


let second_request = function (fetchInstance, username, password, url) {
	return new Promise(function (resolve, reject) {
		console.log('https://aai-idp.uzh.ch' + url)
		console.log(qs.stringify({
				'j_username': username,
				'j_password': password,
				'_eventId_proceed': '',
				'_shib_idp_revokeConsent': 'true'
			}))
		fetchInstance('https://aai-idp.uzh.ch' + url, {
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: qs.stringify({
				'j_username': username,
				'j_password': password,
				'_eventId_proceed': '',
				'_shib_idp_revokeConsent': 'true'
			}),
			method: 'POST',
			redirect: 'manual'
		})
		.then(response => response.headers.get('location'))
		.then(location => fetchInstance(location))
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

let third_request = function (body, fetchInstance) {
	return new Promise(function (resolve, reject) {
		let _$ = cheerio.load(body);
		let _action = _$('form')[0].attribs.action;
		let _data = {};
		_.each(_$('form input'), function (_input) {
			if (!_input.attribs.name) return;
			if (_input.attribs.name == '_eventId_AttributeReleaseRejected') return;
			if (_input.attribs.value == '_shib_idp_rememberConsent') return;
			if (_.isString(_data[_input.attribs.name])) {
				_data[_input.attribs.name] = [_data[_input.attribs.name], _input.attribs.value];
			}
			else if (_.isArray(_data[_input.attribs.name])) {
				_data[_input.attribs.name].push(_input.attribs.value);
			}
			else {
				_data[_input.attribs.name] = _input.attribs.value;
			}
		});
		fetchInstance('https://aai-idp.uzh.ch' + _action, {
			body: qs.stringify(_data, {indices: false}),
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			method: 'POST',
			redirect: 'manual'
		})
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

let fourth_request = function (body, fetchInstance) {
	let $ = cheerio.load(body);
	let form = $('form');
	return new Promise(function (resolve, reject) {
		var data = {};
		_.map($('form input'), function (input) {
			if (!input.attribs.name) return;
			data[input.attribs.name] = input.attribs.value;
		});
		fetchInstance($('form')[0].attribs.action, {
			method: 'POST',
			body: qs.stringify(data),
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			redirect: 'manual'
		})
		.then(response => response.headers.get('location'))
		.then(location => {
			console.log(location)
			return fetchInstance(location, {
				'User-Agent': config.USER_AGENT,
				redirect: 'manual'
			})
		})
		.then(response => response.headers.get('location'))
		.then(location => {
			console.log(location)
			return fetchInstance(location, {
				'User-Agent': config.USER_AGENT,
				redirect: 'manual'
			})
		})
		.then(response => response.headers.get('location'))
		.then(location => {
			console.log(location)
			return fetchInstance(location, {
				'User-Agent': config.USER_AGENT,
				redirect: 'manual'
			})
		})
		.then(response => response.headers.get('location'))
		.then(location => {
			console.log(location)
			return fetchInstance(location, {
				'User-Agent': config.USER_AGENT,
				redirect: 'manual'
			})
		})
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

exports.get = (username, password) => {
	return new Promise(function (resolve, reject) {
		let fetchInstance = fetchCookie(fetch);
		first_request(fetchInstance)
		.then(function (url) {
			return second_request(fetchInstance, username, password, url);
		})
		.then(function (body) {
			if (status.loginFailed(body)) {
				reject(new Error('USERNAME_PW_WRONG'));
			}
			if (status.usernameUnknown(body)) {
				reject(new Error('USERNAME_UNKNOWN'));
			}
			return third_request(body, fetchInstance);
		})
		.then(function (html) {
			return fourth_request(html, fetchInstance);
		})
		.then(function (html) {
			console.log(html)
			resolve({
				success: true,
				html
			});
		})
		.catch(reject);
	});
};
