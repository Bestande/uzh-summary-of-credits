"use strict";

const config = require('./const.js');
var status = require('./status.js');
var qs = require('qs');


let request = require('request');
let cheerio = require('cheerio');


let _ = require('underscore');

let first_request = function (jar) {
	return new Promise(function (resolve, reject) {
		request({
			url: config.AUTH_URL,
			jar: jar
		}, function (err, response, body) {
			if (body.indexOf("You don't have permission to access the requested object") > -1) {
				return reject(new Error('Status 1. Juli: Wir haben Probleme, uns mit dem UZH-Server zu verbinden. Wir versuchen das Problem so schnell wie möglich zu beheben.'))
			}
			var url = body.match(/action=\"(.*?)\"/);
			if (!err) { resolve(url[1]); }
			else {
				reject(err);
			}
		});
	});
}

let second_request = function (jar, username, password, url) {
	return new Promise(function (resolve, reject) {
		request.post({
			url: 'https://aai-idp.uzh.ch' + url,
			headers: {
				'User-Agent': config.USER_AGENT
			},
			form: {
				'j_username': username,
				'j_password': password,
				'_eventId_proceed': '',
				'_shib_idp_revokeConsent': 'true'
			},
			jar: jar,
			followAllRedirects: true
		}, function (err, response, body) {
			if (!err) {
				resolve(body);
			}
			else { reject(err); }
		});
	});
}

let third_request = function (body, jar) {
	return new Promise(function (resolve, reject) {
		let _$ = cheerio.load(body)
		let _action = _$('form')[0].attribs.action
		let _data = {}
		_.each(_$('form input'), function (_input) {
			if (!_input.attribs.name) return;
			if (_input.attribs.name == '_eventId_AttributeReleaseRejected') return;
			if (_input.attribs.value == '_shib_idp_rememberConsent') return;
			if (_.isString(_data[_input.attribs.name])) {
				_data[_input.attribs.name] = [_data[_input.attribs.name], _input.attribs.value];
			}
			else if (_.isArray(_data[_input.attribs.name])) {
				_data[_input.attribs.name].push(_input.attribs.value)
			}
			else {
				_data[_input.attribs.name] = _input.attribs.value
			}
		});
		request.post({
			url: "https://aai-idp.uzh.ch" + _action,
			form: qs.stringify(_data, {indices: false}),
			jar: jar,
			followAllRedirects: true,
			headers: {
				'User-Agent': config.USER_AGENT
			}
		}, function (err, response, body) {
			if (err) { reject(err) }
			else {
				resolve(body);
			}
		});
	})
}

let fourth_request = function (body, jar) {
	let $ = cheerio.load(body);
	let form = $('form');
	return new Promise(function (resolve, reject) {
		var data = {};
		_.map($('form input'), function (input) {
			if (!input.attribs.name) return;
			data[input.attribs.name] = input.attribs.value
		});
		request.post({
			url: $('form')[0].attribs.action,
			form: data,
			jar: jar,
			followAllRedirects: true,
			headers: {
				'User-Agent': config.USER_AGENT
			}
		}, function (err, result, body) {
			if (err) { reject(err); }
			else {
				resolve(body);
			}
		});
	});
}

exports.get = (username, password) => {
	return new Promise(function (resolve, reject) {
		let j = request.jar();
		first_request(j)
		.then(function (url) {
			return second_request(j, username, password, url);
		})
		.then(function (body) {
			if (status.loginFailed(body)) {
				reject(new Error('USERNAME_PW_WRONG'))
			}
			if (status.usernameUnknown(body)) {
				reject(new Error('USERNAME_UNKNOWN'))
			}
			return third_request(body, j);
		})
		.then(function (html) {
			return fourth_request(html, j);
		})
		.then(function (html) {
			resolve({
				success: true,
				html
			});
		})
		.catch(function (err) {
			reject(err);
		});
	})
}
