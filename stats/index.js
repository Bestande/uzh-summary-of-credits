var _ = require('underscore');

exports.calculate = function (credits) {
	var obj = {
		total_credits: exports.getTotalCredits(credits)
	};
	obj.weighted_average = exports.getWeightedAverage(credits, obj.total_credits);
	return obj;
};

exports.getTotalCredits = function (credits) {
	return _.reduce(credits, ((a, b) => a + b.credits_received), 0);
};

exports.parseGrade = function (grade) {
	if (grade === 'BEST') return 6;
	var parsed = parseFloat(grade);
	if (_.isNaN(parsed)) return 1;
	return parsed;
};

exports.getWeightedAverage = function (credits, total_credits) {
	if (!credits.length) return 0;
	var avg = _.reduce(credits, (a, b) => {
		return b.credits_received * exports.parseGrade(b.grade) + a;
	}, 0) / total_credits;
	return Math.round(avg * 100) / 100;
};
