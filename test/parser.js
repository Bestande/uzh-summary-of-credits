import {readFileSync} from 'fs';
import test from 'ava';
import {fromHTML} from '../parser';

test('It should parse a demo HTML correctly', t => {
	let demofile = readFileSync('../data/demo.html', 'utf8');
	let result = fromHTML(demofile);
	t.is(result[0].module, 'GEO361');
	t.is(result[1].module, '_Spaba1');
	t.is(result[1].link, null);
});
