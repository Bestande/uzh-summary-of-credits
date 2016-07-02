"use strict";

const START_INDICATOR_DIRECTION = '!-- [               Studiengang';
const END_INDICATOR_DIRECTION = '] -->';

const START_INDICATOR_NAME = '<!-- [               Name Vorname';
const END_INDICATOR_NAME = '<!-- [               Matrikelnummer';

const START_INDICATOR_MATRICULATE_NO = '<!-- [               Matrikelnummer';
const END_INDICATOR_MATRICULATE_NO = '<!-- [               END INCLUDE';

var cheerio = require('cheerio-without-node-native');
var _ = require('underscore');

exports.getStudyDirection = function (html) {
    let start = html.indexOf(START_INDICATOR_DIRECTION);
    let trimmed = html.substr(start + START_INDICATOR_DIRECTION.length);
    let end = trimmed.indexOf(END_INDICATOR_DIRECTION);

    let form = trimmed.substr(0, end);

    let $ = cheerio.load(form);
    let options = _.map($('select option'), (option) => { return {code: $(option).attr('value'), name: $(option).text()}});
    return options;
}

exports.getName = function (html) {
	let start = html.indexOf(START_INDICATOR_NAME);
	let trimmed = html.substr(start + START_INDICATOR_NAME.length);
	let end = trimmed.indexOf(END_INDICATOR_NAME);

	let tr = trimmed.substr(0, end);
	let $ = cheerio.load(tr);
	let name = $('td.datenwert').text();
	let split = name.split(',').map(n => n.trim());
	let last = split[0];
	let first = split[1];
	return {
		last,
		first
	};
}

exports.getMatriculateNumber = function (html) {
	let start = html.indexOf(START_INDICATOR_MATRICULATE_NO);
	let trimmed = html.substr(start + START_INDICATOR_MATRICULATE_NO.length);
	let end = trimmed.indexOf(END_INDICATOR_MATRICULATE_NO);

	let tr = trimmed.substr(0, end);
	let $ = cheerio.load(tr);
	let matriculate_no = $('td.datenwert').text();
	return matriculate_no;
}
