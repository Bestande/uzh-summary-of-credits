module.exports = {
	loginFailed: (html) => {
		return (html.indexOf('The password you entered was incorrect') > -1 || html.indexOf('Der Benutzername ist unbekannt') > -1);
	},
	usernameUnknown: (html) => {
		return (html.indexOf('The username you entered cannot be identified') > -1 || html.indexOf('Das Passwort ist falsch') > -1);
	}
};
