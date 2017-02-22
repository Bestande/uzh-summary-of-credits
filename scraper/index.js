'use strict';

var qs = require('qs');
let _ = require('underscore');
let cheerio = require('cheerio-without-node-native');
let IsomorphicFetch = require('real-isomorphic-fetch');

const config = require('./const.js');
var status = require('./status.js');

const makeShibbolethUrl = server => {
	return `https://${server}/Shibboleth.sso/DS?providerId=https%3A%2F%2Faai-idp.uzh.ch%2Fidp%2Fshibboleth&target=https%3A%2F%2F${server}%2Fuzh%2Fworld%2Fcm%2Fstudium%2Fzcm_svmb1a%2Fmb101.do`;
};

const getRandomServer = () => {
	const servers = ['idaps1.uzh.ch', 'idaps2.uzh.ch'];
	return servers[Math.floor(Math.random() * servers.length)];
};

let zerothRequest = function (fetch) {
	return new Promise(function (resolve) {
		fetch('http://idagreen.uzh.ch/re/')
		.then(response => response.text())
		.then(body => {
			const match = body.match(/var\sserver\s=\s\"([0-9a-zA-Z\.]+)"/);
			if (match) {
				return resolve(makeShibbolethUrl(match[1]));
			}
			return resolve(makeShibbolethUrl(getRandomServer()));
		})
		.catch(() => resolve(makeShibbolethUrl(getRandomServer())));
	});
};

let firstRequest = function (url, fetch) {
	return new Promise(function (resolve, reject) {
		fetch(url, {
			credentials: 'include'
		})
		.then(response => response.text())
		.then(body => {
			if (body.indexOf('You don\'t have permission to access the requested object') > -1) {
				return reject(new Error('Anfrage wurde blockiert'));
			}
			var url = body.match(/action="(.*?)"/);
			if (!url) {
				throw new Error(`URL has no action: ${url}`);
			}
			resolve(url[1]);
		})
		.catch(reject);
	});
};

let secondRequest = function (fetch, username, password, url) {
	return new Promise(function (resolve, reject) {
		fetch('https://aai-idp.uzh.ch' + url, {
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: qs.stringify({
				/* eslint-disable camelcase */
				j_username: username,
				j_password: password,
				_eventId_proceed: '',
				_shib_idp_revokeConsent: 'true'
				/* eslint-enable camelcase */
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

let thirdRequest = function (body, fetch) {
	return new Promise(function (resolve, reject) {
		let _$ = cheerio.load(body);
		let _action = _$('form')[0].attribs.action;
		let _data = {};
		_.each(_$('form input'), function (_input) {
			if (!_input.attribs.name) {
				return;
			}
			if (_input.attribs.name === '_eventId_AttributeReleaseRejected') {
				return;
			}
			if (_input.attribs.value === '_shib_idp_rememberConsent') {
				return;
			}
			if (_.isString(_data[_input.attribs.name])) {
				_data[_input.attribs.name] = [_data[_input.attribs.name], _input.attribs.value];
			} else if (_.isArray(_data[_input.attribs.name])) {
				_data[_input.attribs.name].push(_input.attribs.value);
			} else {
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

let fourthRequest = function (body, fetch) {
	let $ = cheerio.load(body);
	return new Promise(function (resolve, reject) {
		var data = {};
		_.map($('form input'), function (input) {
			if (!input.attribs.name) {
				return;
			}
			data[input.attribs.name] = input.attribs.value;
		});
		try {
			let a = $('form')[0].attribs.action; // eslint-disable-line no-unused-vars
		} catch (err) {
			return reject(new Error('Der UZH-Server hat eine unbekannte Antwort gegeben. Du kannst uns unter info@bestande.ch kontaktieren.'));
		}
		fetch($('form')[0].attribs.action, {
			method: 'POST',
			body: qs.stringify(data),
			headers: {
				'User-Agent': config.USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			redirect: 'manual',
			credentials: 'include'
		})
		.then(response => response.text())
		.then(resolve)
		.catch(reject);
	});
};

exports.get = (username, password, fetch, feedback) => {
	fetch = new IsomorphicFetch(fetch);
	return new Promise(function (resolve, reject) {
		feedback('Rufe uzh.ch auf...');
		zerothRequest(fetch)
		.then(url => firstRequest(url, fetch))
		.then(function (url) {
			feedback('Einloggen...');
			return secondRequest(fetch, username, password, url);
		})
		.then(function (body) {
			feedback('Eingeloggt...');
			if (status.loginFailed(body)) {
				return reject(new Error('USERNAME_PW_WRONG'));
			}
			if (status.usernameUnknown(body)) {
				return reject(new Error('USERNAME_UNKNOWN'));
			}
			if (status.isStale(body)) {
				return reject(new Error('STALE_REQUEST'));
			}
			return thirdRequest(body, fetch);
		})
		.then(function (html) {
			feedback('Lade Module...');
			return fourthRequest(html, fetch);
		})
		.then(html => resolve({success: true, html}))
		.catch(reject);
	});
};
