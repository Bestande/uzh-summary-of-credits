# uzh-summary-of-credits [![Build Status](https://travis-ci.org/JonnyBurger/uzh-summary-of-credits.svg?branch=master)](https://travis-ci.org/JonnyBurger/uzh-summary-of-credits)

> My incredible module


## Install

```
$ npm install --save uzh-summary-of-credits
```


## Usage

```js
const uzhSummaryOfCredits = require('uzh-summary-of-credits');

uzhSummaryOfCredits.all('joburg', '<password>', require('node-fetch'), progress => { console.log(progress) })
.then(result => {
   console.log(result)
})
.catch(err => {
   console.log(err)
})
```


## License

MIT © [Jonny Burger](http://jonny.io)
