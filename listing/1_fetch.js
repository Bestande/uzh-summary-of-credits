"use strict";

var request = require('request');
var Promise = require('bluebird');
var cheerio = require('cheerio-without-node-native');
var _ = require('underscore');
var url = require('url');
var async = require('async');
var fs = require('fs');

let semester = process.argv[2];
let base = `http://www.vorlesungen.uzh.ch/${semester}`
let entryPoint = `${base}/lehrangebot.html`;

let fetched = [];
let progress = 0;

exports.fetchUrl = (_url, recursive) => {
    return new Promise(function (resolve, reject) {
        request(_url, (err, response, body) => {
            fetched.push(_url);
            var $ = cheerio.load(body);
            var links = recursive ? $('#col1 li a.active').parent().find('ul').find('li a') : $('#col1 li a');
            var results = [];
            _.each(links, (link) => {
                results.push({
                    link: url.resolve(_url, $(link).attr('href')),
                    text: $(link).text(),
                    active: $(link).hasClass('active'),
                    children: []
                });
            });
            async.mapSeries(results, (result, cb) => {
                progress++;
                if (result.active || _.contains(fetched, result.link)) { cb(null, null) }
                else {
                    var log = "";
                    var indent = result.link.match(/\//g).length - 4;
                    for (var i = 0; i < indent; i++) {
                        log += "  ";
                    }
                    console.log(progress + log + result.text.replace(/(\r\n|\n|\r)/gm,""))
                    exports.fetchUrl(result.link, true)
                    .then((_results) => {
                        result.children.push(_results);
                        cb(null, result);
                    });
                }
            }, () => {
                resolve(results)
            });
        });
    });
}

exports.fetchUrl(entryPoint)
.then((results) => {
    fs.writeFileSync(`data/${semester}.json`, JSON.stringify(results, null, 4));
});
