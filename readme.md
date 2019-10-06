# uzh-summary-of-credits

> Protocol for interacting with the UZH summary of credits

This is a library that can authenticate against the University of Zurich summary of credits page. It is able to extract courses, grades, matriculate number and name from the page and convert it into a JSON format.

This code was used in Bestande 1.0 - 3.4 for enabling a feature which would allow users to see an overview of their courses and grades as well as their timetable.

Please note that we have since removed this feature at the request of UZH. We have not looked further into the legal situation of what can be done with this code. We are releasing this code for personal, educational and research purposes and do not suggest that you should build and app which accepts UZH credentials. This also means that we are not anymore using this code and that it can break in the future, and that we can not guarantee support for this library.

## Installation

The code is not published in any registry, you have to clone this repo.

Run

```
npm install
```

to install the dependencies. The entry point is `index.js` which exposes multiple methods, which allow to get partial information or a function called `all` which gets all information. This function accepts 4 arguments:

- Shortname
- Password
- Fetch function, on the server pass `require('node-fetch')`, on the React Native you can pass the global `fetch`.
- Progress function, for example `progress => console.log(progress)`

## Example
There is an example included in `example.js` which allows you to put crednetialy and which will print the response into the terminal. We suggest you put your username and password in there and run `node example.js` to start tinkering with the library.

## See also

- [ethz-summary-of-credits](https://github.com/Bestande/ethz-summary-of-credits) - The ETHZ version of this library

## License

MIT
