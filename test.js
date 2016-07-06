import test from 'ava';
var parser = require('./parser');

test('Should remove deselected duplicated', t => {
	var input = [
		{
			link: 'http://www.vorlesungen.uzh.ch/FS14/suche/sm-50030855.modveranst.html',
			status: 'DESELECTED'

		},
		{
			link: 'http://www.vorlesungen.uzh.ch/FS14/suche/sm-50030855.modveranst.html',
			status: 'PASSED'
		}
	];
	var output = parser.filterDuplicates(input);
	t.deepEqual(output, [{
		link: 'http://www.vorlesungen.uzh.ch/FS14/suche/sm-50030855.modveranst.html',
		status: 'PASSED'
	}]);
});
