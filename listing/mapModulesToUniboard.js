"use strict";

var fs = require('fs');
var neatCsv = require('neat-csv');
var querydb = require('./querydb');
var getShortName = require('@jonny/uzh-course-shortname');
var _ = require('underscore');
var async = require('async');

var uniboard_modules = [];
var matches = [];
var i = 0;

const notAModule = [
	'FAPS (Fachverein Psychologie)',
	'Universität Zürich',
	'Oec Talk UZH',
	'Assessmentstufe Wirtschaftswissenschaften UZH',
	'Assessmentstufe Wirtschaftsinformatik UZH',
	'UZH Talk',
	'Jus Talk UZH',
	'BWL I', // duplicate
	'BWL II', // duplicate
	'Doktorat  Fachstudium Biologie UZH',
	'Archiv: Formen und Methoden (FuM)',
	'Advanced Probability Theory and Modern Statistical Inference', // does not exis
	'Banking: Entwicklung von Bankprodukten',
	'Banking: Finanzintermediation - Geld- und Kapitalmarktgeschäfte',
	'Banking: Finanzintermediation - Kredit- und Einlagengeschäft',
	'Banking: Regulation und Supervision',
	'Banking: Structured Products',
	'Grundlagen des Banking',
	'External Auditing', // merged into Auditing
	'Entscheidungsprozesse in ordentlichen und ausserordentlichen Lagen',
	'Energieökonomik',
	'Finanzmathematik',
	'Versicherungsökonomik II',
	'Versicherungsökonomik I',
	'ASVZ',
	'Öffentliches Recht I', // using parent
	'Öffentliches Recht II', // using parent
	'Öffentliches Recht III', // using parent
	'IFRS und Controlling',
	'Angewandte Ökonometrie',
	'Angewandte Ökonometrie II',
	'Öffentliches Recht - Allgemeines Staatsrecht',

];

function readUniboardCSV() {
	let contents = fs.readFileSync(__dirname + '/data/uniboard-forums.csv', 'utf-8');
	return neatCsv(contents);
}
function remapUniboardName (name) {
	if (name == 'BWL I') return 'Betriebswirtschaftslehre I';
	if (name == 'BWL II') return 'Betriebswirtschaftslehre II';
	if (name == 'Mathematik III - Analysis für Ökonomen') return 'Mathematik III für Wirtschaftswissenschaftler';
	if (name == 'Mathematik III - Lineare Algebra für Ökonomen') return 'Mathematik III für Wirtschaftswissenschaftler';
	if (name == 'Marketing I') return 'Marketing Management I';
	if (name == 'Marketing II') return 'Marketing Management II';
	if (name == 'Unternehmensberatung (Blockvorlesung)') return 'Unternehmensberatung';
	if (name == 'Time Series Analysis of Financial Asset Returns') return 'Time Series Analysis';
	if (name == 'Corporate Finance II (Finanz- und Investitionsmanagement II)') return 'Corporate Finance II';
	if (name == 'HRM: Principles of HRM') return 'Principles in HRM';
	if (name == 'Haftpflichtrecht') return 'Haftpflicht- und Versicherungsrecht';
	if (name == 'Informatik II: Modellierung, Algorithmen und Datenstrukturen') return 'Informatik II';
	if (name == 'IT-Projektmanagement - Grundlagen und systemische Führung') return 'IT-Projektmanagement';
	if (name == 'BIO121 Biodiversität der Wirbeltiere, Wirbellose, Pilze') return 'BIO121 Biodiversität der Wirbeltiere, Wirbellose, Pilze';
	if (name == 'BIO122 Verhalten') return 'Verhaltensbiologie';
	if (name == 'BIO123 Biodiversität Pflanzen') return 'Evolution und Biodiversität: Pflanzen';
	if (name == 'CHE172 Organische Chemie') return 'Organische Chemie für die Biologie';
	if (name == 'CHE173 Chemie-Praktikum') return 'Praktikum zu Organische Chemie für die Biologie';
	if (name == 'MAT183 Stochastik') return 'Stochastik für die Naturwissenschaften';
	if (name == 'BIO131 Pflanzenphysiologie') return 'Form und Funktion der Pflanzen';
	if (name == 'BIO132 Mikrobiologie, Molekularbiologie') return 'Molekularbiologie, Mikrobiologie';
	if (name == 'BIO133 Anthropologie') return 'Anthropologie';
	if (name == 'BCH204 Biochemie Praktikum I') return 'Biochemisches Praktikum für die Biologie, Teil 1';
	if (name == 'BCH205 Biochemie Praktikum II') return 'Biochemisches Praktikum für die Biologie, Teil 2';
	if (name == 'PHY127 Physik II') return 'Physik II';
	if (name == 'ME4: Organisationsökonomik / Organizational Economics') return 'Organizational Economics';
	name = name.replace('Gemeinsames Pflichtprogramm:', '').trim();
	name = name.replace(/(Wahlvorlesung|Vertiefung|KK|Wahlpflichtmodul|Spezialisierung|Forschungsseminar):/, '').trim();
	name = name.replace(/\(.*\)/g, '');
	return name;
}

function remapShortname (name) {
	if (name.indexOf('Öffentliches Recht') > -1) return 'Öffentliches Recht';
	if (name.indexOf('Unternehmensberatung') > -1) return 'Unternehmensberatung';
	if (name.indexOf('Sinologie') > -1) return 'Sinologie';
	if (name.indexOf('Banking') > -1 && name != 'Private Banking') return 'Banking';
	if (name.indexOf('SPSS') > -1) return 'SPSS';
	if (name.indexOf('Grundlagen der Personal- und Organisationsökonomik') > -1) return 'Personal- und Organisationsökonomik';
	if (name.indexOf('Betriebswirtschaftliche Steuerlehre') > -1) return 'Betriebswirtschaftliche Steuerlehre';
	if (name.indexOf('Behavioral Finance and Private Banking') > -1) return 'Private Banking';
	if (name == 'Advanced Microeconomics 2') return 'Fortgeschrittene Mikroökonomik, Teil 2';
	if (name.indexOf('Advanced Microeconomics') > -1) return 'Fortgeschrittene Mikroökonomik, Teil 1';
	if (name.indexOf('HRM') > -1) return 'Human Resource Management I';
	if (name.indexOf('Personal- und Organisationsökonomik') > -1) return 'Personalökonomik / Personnel Economics';
	if (name.indexOf('Ökonomie und Politik der Innovation') > -1) return 'Innovationsökonomik / The Economics of Innovation';
	if (name.indexOf('Spezialisierung Internationale Beziehungen') > -1) return 'Internationale Beziehungen';
	return name.trim();
}

exports.findMatch = function(name) {
	var match = _.find(uniboard_modules, entry => remapUniboardName(entry.clean) === remapShortname(getShortName(name)))
	return match;
}
if (process.env.UNIBOARD) {
	readUniboardCSV()
	.then(json => {
		uniboard_modules = json;
	});
}
