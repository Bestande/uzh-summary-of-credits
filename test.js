import test from 'ava';
import parser from './parser';

test('It should sort modules correctly', t => {
	const modules = [
		{
			short_name: 'BWL III',
			status: 'FAILED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018688.modveranst.html'
		},
		{
			short_name: 'Asset Pricing',
			status: 'PASSED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018689.modveranst.html'
		}
	];

	const output = [
		{
			short_name: 'Asset Pricing',
			status: 'PASSED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018689.modveranst.html#0'
		},
		{
			short_name: 'BWL III',
			status: 'FAILED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018688.modveranst.html#1'
		}
	];

	t.deepEqual(output, parser.filterDuplicates(modules));
});
