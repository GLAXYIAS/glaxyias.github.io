if (!String.format) {
	String.format = function (format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
				;
		});
	};
}

//##############################################
//############# LANGUAGE OVERRIDE ##############
//##############################################
var languageOverride = "";
if (localStorage['languageOverride']) {
	languageOverride = localStorage['languageOverride'];
}

function setNewLanguageOverride(newLanguage) {
	hideLanguageSelection();
	if (languageOverride != newLanguage) {
		var languageName = "undefined";
		var languageStringElement = document.querySelector("[data-language='" + newLanguage + "']");
		if (languageStringElement) {
			languageName = languageStringElement.innerHTML;
		}
		var oldLanguageOverride = languageOverride;
		languageOverride = newLanguage;
		var confirmationMessage = _("Change language to {0}?", languageName);
		var yesText = _("Yes");
		var noText = _("No");
		if (languageName != "English") {
			var newLanguageUpper = newLanguage[0].toUpperCase() + newLanguage.slice(1);
			confirmationMessage += " \n (Change language to " + newLanguageUpper + "?)";
			yesText += " (Yes)";
			noText += " (No)";
		}
		showConfirmationPrompt(
			confirmationMessage,
			yesText,
			function () {
				localStorage['languageOverride'] = newLanguage;
				ensureLanguageLoaded();
				offerManager.updateOfferLanguage(getLanguageCode(newLanguage));
				if (typeof (playsaurusSdk) != "undefined") {
					playsaurusSdk.updateLocale(getLanguageCode(newLanguage));
				}

				if (chosen == -1) {
					//refresh game
					reloadGame();
				}
				else if (isMobile()) {
					savegame("language_set");
					reloadGame();
				}
				else {
					alert(_("Reload the game to fully apply changes"));
				}
			},
			noText,
			function () {
				languageOverride = oldLanguageOverride;
			},
		);
	}
}
//##############################################
//############# LOADING LANGUAGE ###############
//##############################################

var language = "english";
function loadLanguage(steamApi = null) {
	if (!steamApi) {
		steamApi = platform.steamApi;
	}
	if (steamApi.getCurrentGameLanguage() != "") {
		return steamApi.getCurrentGameLanguage();
	}
	else {
		return "english";
	}
}

var listOfAllTranslationsNeeded = [];

function _(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	return String.format.apply(null, [translate(format)].concat(args));
}

function actuallyUsedLanguage() {
	if (languageOverride) {
		return languageOverride;
	}
	else {
		return language;
	}
}

//Locale code for analytics/the SDK: the language the player is ACTUALLY reading, not only the one
//they picked by hand. languageOverride is empty for everyone who never opened the language picker,
//so reporting it alone made every auto-detected player look like an English player.
//A language with no translation file still renders in English, so it reports as "en".
function actuallyUsedLocaleCode() {
	var lang = actuallyUsedLanguage();
	if (!lang || !isLanguageAvailable(lang)) {
		return "en";
	}
	return getLanguageCode(lang);
}

//On PC/Web only english.js and empty.js are loaded via <script> tags; every other language
//is fetched on demand by ensureLanguageLoaded() so players only download the language they use.
//(Mobile still loads every language up front, which makes ensureLanguageLoaded a no-op there.)
var availableLanguages = ["arabic", "brazilian", "portuguese", "czech", "danish", "dutch", "english",
	"filipino", "finnish", "french", "german", "hebrew", "hindi", "hungarian", "indonesian", "italian",
	"japanese", "koreana", "norwegian", "polish", "russian", "schinese", "slovak", "spanish", "latam",
	"swedish", "tchinese", "thai", "turkish", "ukrainian", "vietnamese"];

//Languages whose .js file just aliases another language's translations
var languageFileAliases = { "latam": "spanish", "portuguese": "brazilian" };

function isLanguageAvailable(lang) {
	return availableLanguages.indexOf(lang) != -1;
}

function ensureLanguageLoaded() {
	var lang = actuallyUsedLanguage();
	if (lang == "english" || translations[lang] || !isLanguageAvailable(lang)) {
		return;
	}
	var fileName = languageFileAliases[lang] || lang;
	var src = "Shared/src/translations/languages/" + fileName + ".js?t=" + revisionNumber;
	if (document.readyState == "loading") {
		//Still parsing index.html: write a blocking <script> so the translations exist before the
		//rest of the game scripts run. Several files translate strings at parse time (stat
		//descriptions in PlayerStats.js, shop item names in shop.js, quotes.js), and those values
		//are only computed once - loading the language asynchronously leaves them stuck in English.
		document.write('<script charset="utf-8" src="' + src + '"><\/script>');
		if (languageFileAliases[lang]) {
			document.write('<script>translations["' + lang + '"] = translations["' + fileName + '"];<\/script>');
		}
		return;
	}
	//Language picked at runtime (setNewLanguageOverride) - the game reloads afterwards anyway
	var script = document.createElement("script");
	script.charset = "utf-8";
	script.src = src;
	if (languageFileAliases[lang]) {
		script.onload = function () {
			translations[lang] = translations[fileName];
		};
	}
	document.head.appendChild(script);
}

function translate(format, toLanguage = "") {
	if (toLanguage === "") {
		if (languageOverride) {
			toLanguage = languageOverride;
		}
		else {
			toLanguage = language;
		}
	}
	if (toLanguage == "english") {
		return format;
	}
	else {
		if (translations[toLanguage]) {
			if (translations[toLanguage]()[format]) {
				return translations[toLanguage]()[format];
			}
			else {
				if (listOfAllTranslationsNeeded.indexOf(format) == -1) {
					listOfAllTranslationsNeeded.push(format);
				}
			}
		}
		return format;
	}
}

//################### CHANGE HELPERS ##################
function patchTranslations(inputString, find, replace) {
	for (var language in translations) {
		for (var sourceText in translations[language]) {
			if (sourceText == inputString) {
				translations[language][sourceText] = translations[language][sourceText].replace(find, replace);
				translations[language][sourceText.replace(find, replace)] = translations[language][sourceText];
				delete translations[language][sourceText];
			}
		}
	}
}

function getFormattedTranslations() {
	var outputString = "";
	for (var language in translations) {
		outputString += 'translations["' + language + '"] = {\r\n';
		for (var sourceText in translations[language]) {
			outputString += '\t"' + sourceText + '": "' + translations[language][sourceText] + '",\r\n';
		}
		outputString += '};\r\n\r\n';
	}
	console.log(outputString);
}

function getUntranslatedForEachLanguage() {
	var instructions = "(1) Please place the translated text on the right hand side in the quotes provided.\r\n" +
		"   For example:\r\n" +
		'       "Some text": "" would become "Some text": "Translated text in your language"\r\n' +
		'   Spanish example:\r\n' +
		'       "You gained $100": "Ganaste $100"\r\n' +
		'\r\n' +
		"(2) When the source has a {0} and a {1} these must be included in the translated results. They will be replaced with some text or values when rendered in the game.\r\n" +
		"   For example:\r\n" +
		'       "{0} minute timelapse": "{0} translated text"\r\n' +
		'   Spanish example:\r\n' +
		'       "You gained ${0}": "Ganaste ${0}"\r\n' +
		"\r\n" +
		"(3) Please provide the results back as a .txt file (NOT an excel or word file)\r\n" +
		"\r\n" +
		"(4) For game context please see the game being translated located here and just do your best:\r\n" +
		"    https://store.steampowered.com/app/1397920/MrMine/\r\n" +
		"    https://mrmine.com\r\n" +
		"    Youtube video of game: https://www.youtube.com/watch?v=j3252zzpWkE\r\n\r\n" +
		"(5) Following ALL these instructions will result in a nice tip.";

	// Languages we never want to hand to translators:
	//  - "empty" is the source list itself (every value is "" -> would export everything)
	//  - "english" is the source language ({} placeholder)
	var skipLanguages = ["empty", "english"];
	// Some languages are plain aliases of another (e.g. translations["latam"] =
	// translations["spanish"]). They share the exact same function reference, so
	// exporting them again just produces a duplicate file. Track the references we
	// have already exported and skip anything pointing at the same one.
	var exportedRefs = [];   // function refs already exported (to detect aliases)
	var exportedNames = [];  // language name behind each ref, same index as exportedRefs

	var sourceStringCount = Object.keys(translations['empty']()).length;
	var filesCreated = 0;
	var totalWordsToTranslate = 0;
	var totalEntriesToTranslate = 0;
	var languagesNeedingWork = [];               // names of languages with > 0 entries left
	var skippedLanguages = [];                   // {name, reason} for anything not exported
	var untranslatedStrings = {};                // distinct source strings still missing anywhere

	for (language in translations) {
		if (skipLanguages.indexOf(language) !== -1) {
			skippedLanguages.push(language + " (source list)");
			continue;
		}
		if (!(translations[language] instanceof Function)) {
			skippedLanguages.push(language + " (not a translation function)");
			continue;
		}
		var aliasIndex = exportedRefs.indexOf(translations[language]);
		if (aliasIndex !== -1) {
			skippedLanguages.push(language + " (alias of " + exportedNames[aliasIndex] + ")");
			continue;
		}
		exportedRefs.push(translations[language]);
		exportedNames.push(language);

		var outputString = "";
		var wordsToTranslate = 0;
		var entriesToTranslate = 0;
		for (var key in translations['empty']()) {
			if (!translations[language]()[key]) {
				wordsToTranslate += key.split(" ").length;
				entriesToTranslate++;
				untranslatedStrings[key] = true;
				outputString += '"' + key + '": "",\r\n';
			}
		}
		outputString = "############## Words To Translate: " + wordsToTranslate + ' ##############\r\n########## Translate Everything Below This ###########\r\n######################################################\r\n\r\n' + outputString;
		outputString = "######################################################\r\n#################### Instructions ####################\r\n######################################################\r\n\r\n" + instructions + "\r\n\r\n######################################################\r\n" + outputString;
		saveContentToFile("../LanguageExports/" + language + ".txt", outputString)

		filesCreated++;
		totalWordsToTranslate += wordsToTranslate;
		totalEntriesToTranslate += entriesToTranslate;
		if (entriesToTranslate > 0) {
			languagesNeedingWork.push(language);
		}
		console.log("saved " + language + ".txt - " + entriesToTranslate + " entries / " + wordsToTranslate + " words to translate");
	}

	var completeCount = filesCreated - languagesNeedingWork.length;
	var averageWordsAll = filesCreated > 0 ? (totalWordsToTranslate / filesCreated) : 0;
	var averageWordsNeeding = languagesNeedingWork.length > 0 ? (totalWordsToTranslate / languagesNeedingWork.length) : 0;
	var distinctStrings = Object.keys(untranslatedStrings);

	console.log("====================================================");
	console.log("Done generating translation .txt files");
	console.log("Source list: " + sourceStringCount + " strings (from empty.js)");
	console.log("Files created: " + filesCreated + "  ->  saved to ../LanguageExports/");
	console.log("  - Needing translation: " + languagesNeedingWork.length + (languagesNeedingWork.length ? " (" + languagesNeedingWork.join(", ") + ")" : ""));
	console.log("  - Fully translated: " + completeCount);
	console.log("Total entries to translate (all files): " + totalEntriesToTranslate);
	console.log("Total words to translate (all files): " + totalWordsToTranslate);
	console.log("Average words per file (all): " + averageWordsAll.toFixed(2));
	console.log("Average words per file (needing translation): " + averageWordsNeeding.toFixed(2));
	// Show exactly which strings are still missing when the list is short enough to be useful.
	if (distinctStrings.length === 0) {
		console.log("Distinct strings still untranslated: none - everything is translated!");
	} else if (distinctStrings.length <= 25) {
		console.log("Distinct strings still untranslated (" + distinctStrings.length + "): " + distinctStrings.map(function (s) { return '"' + s + '"'; }).join(", "));
	} else {
		console.log("Distinct strings still untranslated: " + distinctStrings.length);
	}
	if (skippedLanguages.length) {
		console.log("Skipped (not exported): " + skippedLanguages.join(", "));
	}
	console.log("====================================================");
}

function findTranslationMistakes() {
	for (language in translations) {
		if (language != 'empty') {
			for (var key in translations[language]) {
				if (translations[language].hasOwnProperty(key)) {
					for (var i = 0; i < 3; i++) {
						if (key.includes("{" + i + "}") && !translations[language][key].includes("{" + i + "}")) {
							console.log(language + " missing {" + i + "} for '" + key + "'");
						}
					}
					if (translations[language][key] == "") {
						console.log(language + " missing translation for '" + key + "'");
					}
				}
			}
		}
	}
}

//Source: https://stackoverflow.com/a/63520666
function characterIsSupported(character, font = getComputedStyle(document.body).fontFamily) {
	//Create the canvases
	let testCanvas = document.createElement("canvas");
	let referenceCanvas = document.createElement("canvas");
	testCanvas.width = referenceCanvas.width = testCanvas.height = referenceCanvas.height = 150;

	//Render the characters
	let testContext = testCanvas.getContext("2d");
	let referenceContext = referenceCanvas.getContext("2d");
	testContext.font = referenceContext.font = "20px " + font;
	testContext.fillStyle = referenceContext.fillStyle = "black";
	testContext.fillText(character, 0, 100);
	referenceContext.fillText('\uffff', 0, 100);

	//Check if the canvases are identical
	var reducer = (previousValue, currentValue) => previousValue + currentValue;
	var testValue = testContext.getImageData(0, 0, 150, 150).data.reduce(reducer);
	var errorValue = referenceContext.getImageData(0, 0, 150, 150).data.reduce(reducer);
	if (testValue == 0) {
		console.log("zero: " + character);
	}
	return testValue != errorValue;
}

function checkLanguageFontCompatibility(language, font) {
	var supported = 0;
	var checked = 0;
	var characterCached = [];

	for (var key in translations[language]) {
		if (translations[language].hasOwnProperty(key)) {
			for (var i = 0; i < translations[language][key].length; i++) {
				if (!characterCached.hasOwnProperty(translations[language][key][i])) {
					checked++;
					var isSupported = characterIsSupported(translations[language][key][i], font);
					characterCached[translations[language][key][i]] = isSupported;
					if (isSupported) {
						supported++;
					}
					else {
						console.log("error: " + translations[language][key][i]);
					}
				}
			}
		}
	}
	console.log(supported / checked);
}

function getTranslatedForEachLanguage(key) {
	var logValue = key + "\r\n";
	for (var language in translations) {
		if (translations[language].hasOwnProperty(key)) {
			logValue += language + "\t" + translations[language][key] + "\r\n";
		}
	}
	console.log(logValue);
}

function getTranslatedForEachLanguageMultiple(keys) {
	var logValue = "";
	for (var language in translations) {
		logValue += language + "\r\n";
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (translations[language].hasOwnProperty(key)) {
				logValue += '"' + key + '": "' + translations[language][key] + '",\r\n';
			}
		}
	}
	console.log(logValue);
}
var translationsCache = [];
var translations = [];


