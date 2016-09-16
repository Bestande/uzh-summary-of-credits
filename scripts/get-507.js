import got from 'got';
import {load} from 'cheerio';
import resolve from 'url-resolve';

// Modules that do not belong to a faculty (prefix 507)
// are not linked in the summary of credits.
// This script fetches all of these modules so they can be remapped.

// npm install url-resolve cheerio got

const links = [
	'http://www.vorlesungen.uzh.ch/HS16/lehrangebot/fak-50044345/sc-50017764/cga-50017764090.html',
	'http://www.vorlesungen.uzh.ch/HS16/lehrangebot/fak-50044345/sc-50018974/cga-50018974090.html',
	'http://www.vorlesungen.uzh.ch/HS16/lehrangebot/fak-50044345/sc-50516334/cga-50516334090.html'
];

const getHTML = async function (url) {
	let listingurls = [];
	let result = await got(url);
	let $ = load(result.body);
	let subsections = $('li li li li');
	subsections.each((key, ss) => {
		let href = $(ss).find('a').attr('href');
		let absoluteHref = resolve(url, href);
		listingurls.push(absoluteHref);
	});
	return listingurls;
};

const fetchModuleUrls = async function (url) {
	let links = [];
	let page = 0;
	while (true) {
		page++;
		let {body} = await got(`${url}?page=${page}`);
		if (body.match(/Keine Lehrveranstaltungen/)) {
			return links;
		}
		let $ = load(body);
		let trs = $('.ornate tr a.internal');
		trs.each((key, a) => {
			let href = $(a).attr('href');
			if (href.match(/e-([0-9]+).details/)) {
				links.push(resolve(url, href));
			}
		});
	}
};

const start = async () => {
	for (let i = 0; i < links.length; i++) {
		let urls = await getHTML(links[i]);
		for (let j = 0; j < urls.length; j++) {
			let links = await fetchModuleUrls(urls[j]);
			console.log(links);
		}
	}
};

start()
.catch(err => console.error(err));
