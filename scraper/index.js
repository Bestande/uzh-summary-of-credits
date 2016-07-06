'use strict';

const config = require('./const.js');
var status = require('./status.js');
var qs = require('qs');

let cheerio = require('cheerio-without-node-native');
let FormData = require('form-data');
let IsomorphicFetch = require('real-isomorphic-fetch');


let _ = require('underscore');

let first_request = function (fetch) {
	return new Promise(function (resolve, reject) {
		fetch(config.AUTH_URL, {
			redirect: 'manual',
			credentials: 'include'
		})
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


let second_request = function (fetch, username, password, url) {
	return new Promise(function (resolve, reject) {
		fetch('https://aai-idp.uzh.ch' + url, {
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
			redirect: 'manual',
			credentials: 'include'
		})
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

let third_request = function (body, fetch) {
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
		fetch('https://aai-idp.uzh.ch' + _action, {
			body: qs.stringify(_data, {indices: false}),
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			method: 'POST',
			redirect: 'manual',
			credentials: 'include'
		})
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

let fourth_request = function (body, fetch) {
	let $ = cheerio.load(body);
	let form = $('form');
	return new Promise(function (resolve, reject) {
		var data = {};
		const redirect_config = {
			headers: {
				'User-Agent': config.USER_AGENT
			},
			redirect: 'manual',
		};
		_.map($('form input'), function (input) {
			if (!input.attribs.name) return;
			data[input.attribs.name] = input.attribs.value;
		});
		fetch($('form')[0].attribs.action, {
			method: 'POST',
			body: qs.stringify(data),
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			redirect: 'manual',
			credentials: 'include'
		})
		.then(response => response.text())
		.then(response => {
			console.log(response)
			resolve(response);
		})
		.catch(reject);
	});
};

exports.get = (username, password, fetch, feedback) => {
	fetch = new IsomorphicFetch(fetch);
	return new Promise(function (resolve, reject) {
		feedback('Rufe uzh.ch auf...')
		first_request(fetch)
		.then(function (url) {
			feedback('Einloggen...')
			return second_request(fetch, username, password, url);
		})
		.then(function (body) {
			feedback('Eingeloggt.')
			if (status.loginFailed(body)) {
				reject(new Error('USERNAME_PW_WRONG'));
			}
			if (status.usernameUnknown(body)) {
				reject(new Error('USERNAME_UNKNOWN'));
			}
			return third_request(body, fetch);
		})
		.then(function (html) {
			feedback('Lade Module...')
			return fourth_request(html, fetch);
		})
		.then(html => resolve({success: true, html}))
		.catch(reject);
	});
};
