import test from 'ava';
import parser from '../parser';

test('It should sort modules correctly', t => {
	const modules = [
		{
			status: 'FAILED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018688.modveranst.html'
		},
		{
			status: 'PASSED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018689.modveranst.html'
		}
	];

	const output = [
		{
			status: 'PASSED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018689.modveranst.html#0'
		},
		{
			status: 'FAILED',
			link: 'www.vorlesungen.uzh.ch/HS16/suche/sm-50018688.modveranst.html#1'
		}
	];

	t.deepEqual(output, parser.filterDuplicates(modules));
});

test('It should sort semesters reverse-chronologically', t => {
	const older = {
		link: 'http://www.vorlesungen.uzh.ch/FS09/lehrangebot/fak-50000003/sc-50427948/cga-50427948010/cg-50427949/sm-50345595/person-1092257.details.html'
	};
	const newer = {
		link: 'http://www.vorlesungen.uzh.ch/FS16/lehrangebot/fak-50000003/sc-50427948/cga-50427948010/cg-50427949/sm-50345595/person-1092257.details.html'
	};

	t.deepEqual(parser.groupBySemester([newer, older]), [{semester: 'FS16', credits: [newer]}, {semester: 'FS09', credits: [older]}]);
});
