"use strict";
require('loud-rejection/register');

var async = require('async');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');
var cheerio = require('cheerio');
var url = require('url');
let query = process.argv[2];

let semester = require('./data/'+query+'.json');
let result = {};


exports.getModules = (modules, tree) => {
    return new Promise((resolve, reject) => {
        async.eachSeries(modules, function (module, callback) {
            var _tree = tree.slice(0);
            if (_.flatten(module.children).length == 0 && module.link.indexOf('.module') > -1) {
                exports.makeRequest(module.link)
                .then(function (numbers) {
                    _.each(numbers, (number) => {
                        if (!result[number]) result[number] = [];
                        result[number].push(_tree)
                    });
                    callback(null);
                });
            }
            else {
                console.log(_tree.map(_ => ' ').join('') + module.text)
                _tree.push({
                    text: module.text,
                    id: module.link.match(/([0-9]+)\./)[1]
                });
                exports.getModules(_.flatten(module.children), _tree)
                .then(function () {
                    callback();
                });
            }
        }, () => {
            resolve();
        });
    });
}

exports.parseBody = (body) => {
    var $ = cheerio.load(body);
    var trs = $('table.vvzDetails tbody tr');
    return _.map(trs, (tr) => $(tr).find('a').attr('href'));
}

exports.makeRequest = (link) => {
    return new Promise((resolve, reject) => {
        request(link, function (error, response, body) {
            var $ = cheerio.load(body);
            var pages = $('.pages a');
            var pageLinks = _.map(pages, (page) => $(page).attr('href'));
            var modules = exports.parseBody(body);
            pageLinks = _.map(pageLinks, (page) => url.resolve(link, page));
            pageLinks = _.uniq(pageLinks);
            async.mapSeries(pageLinks, (link, cb) => {
                request(link, (error, response, body) => {
                    cb(null, exports.parseBody(body));
                });
            }, (err, response) => {
                var numbers = _.flatten(response).concat(modules).map((link) => link.match(/sm-([0-9]+)/)[1]);
                resolve(numbers);
            });
        });
    });
}

exports.getModules(semester, [])
.then(() => {
    fs.writeFileSync('data/' + query + '-map.json', JSON.stringify(result, null, 4));
});
