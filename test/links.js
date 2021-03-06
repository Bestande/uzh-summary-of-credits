import test from 'ava';
import {formatLink} from '../parser/index';

test('Should convert 2015 / 004 to FS16', t => {
	const old = 'https://studentservices.uzh.ch/uzh/anonym/vvz?sap-client001&sap-language=EN#/details/2015/004/SM/50510833';
	const expected = `http://www.vorlesungen.uzh.ch/FS16/suche/sm-50510833.modveranst.html`;
	t.is(formatLink(old), expected);
});

test('Should convert 2014 / 003 to HS14', t => {
	const old = 'https://studentservices.uzh.ch/uzh/anonym/vvz?sap-client001&sap-language=EN#/details/2015/004/SM/50510833';
	const expected = `http://www.vorlesungen.uzh.ch/FS16/suche/sm-50510833.modveranst.html`;
	t.is(formatLink(old), expected);
});

test('Should work with a CW url', t => {
	const old = 'https://studentservices.uzh.ch/anonym/vvz?sap-client001&sap-language=DE#/details/2016/003/CW/50441681';
	const expected = `http://www.vorlesungen.uzh.ch/HS16/suche/cw-50441681.modveranst.html`;
	t.is(formatLink(old), expected);
});
