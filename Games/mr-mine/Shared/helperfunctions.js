
/**
 * Returns the current time in milliseconds
 * @returns {number} Current time in milliseconds
 */
function currentTime() {
	return new Date().getTime();
}

/**
 * Returns a random number between min and max
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {number} Random number between min and max
 */
function rand(min, max) {
	return Math.floor(min + (Math.random() * (max + 1 - min)));
}

/**
 * Picks a random number in range but can be biased to the high or low end of the range.
 * 
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {number} probabilityPower Greater than 1 will bias towards the low end, less than 1 will bias towards the high end. Default is 0.5.
 * @returns {number} Random number between min and max
 */
function biasedRand(min, max, probabilityPower = .5) {
	return Math.floor(min + ((max + 1 - min) * (Math.pow(Math.random(), probabilityPower))));
}

/**
 * Generates a random Big Number between two Big numbers
 * @param {BigNumber} min Minimum value
 * @param {BigNumber} max Maximum value
 * @returns {BigNumber} Random BigNumber between min and max
 */
function randBigNumber(min, max) {
	var difference = max.subtract(min);
	var randomValue = difference.multiply(Math.random());
	var result = min.add(randomValue);
	return result;
}

/**
 * Searches for a value in an array and returns it
 * @param {Array.<number>} numArray 
 * @returns {number} Maximum value of the array
 */
function getMaxOfArray(numArray) {
	return Math.max.apply(null, numArray);
}

/**
 * Calculates the average of an array
 * @param {Array.<number>} array Array to calculate the average of
 * @param {boolean} dontCountZeroes Boolean to determine if zeroes should be counted. Default is false
 * @returns {number} Average of the array
 */
function calculateAverageOfArray(array, dontCountZeroes = false) {
	if (array.length == 1) {
		return array[0];
	}

	var total = 0;
	var count = 0;

	for (var i = 0; i < array.length; i++) {
		let item = array[i];

		if (dontCountZeroes && item != 0 && !isNaN(item) && item != null) {
			total += item;
			count++;
		}
		else if (!dontCountZeroes) {
			total += item;
			count++;
		}
	};

	return total / count;
}

/**
 * Generates a random number centered around a mean with a standard deviation
 * @param {number} mean Velue to center around. Default is 0
 * @param {number} stddev Range around the mean. Default is 1
 * @param {number} nsamples Number of iterations to sample. Default is 3
 * @returns {number} Random number centered around the mean
 */
function gaussianRand(mean = 0, stddev = 1, nsamples = 3) {
	var run_total = 0;
	for (var i = 0; i < nsamples; i++) {
		run_total += Math.random();
	}
	return stddev * (run_total - nsamples / 2) / (nsamples / 2) + mean;
}

/**
 * Multiplies a BigNumber by a decimal number
 * @param {BigNumber} bigNumber BigNumber to multiply
 * @param {number} decimal Decimal to multiply by
 * @returns {BigNumber} Result of the multiplication
 */
function doBigNumberDecimalMultiplication(bigNumber, decimal) {
	return bigNumber.multiply(decimal);
}

/**
 * Divides a BigNumber by a decimal number
 * @param {BigNumber} bigNumber BigNumber to divide
 * @param {number} decimal Decimal to divide by
 * @param {number} decimalPlaces Number of decimal places to round to. Default is 3
 * @returns {BigNumber} Result of the division
 */
function divideBigNumberToDecimalNumber(numeratorBigNumber, denominatorBigNumber, decimalPlaces = 3) {
	return new BigNumber(numeratorBigNumber).divide(denominatorBigNumber).toFloat();
}

/**
 * Finds the minimum value in a list of BigNumbers
 * @param  {...BigNumber} args Series of Bignumber passed as arguments
 * @returns {BigNumber} Minimum BigNumber found
 */
function bigNumberMin(...args) {
	if (args.length < 1) { throw 'Min of empty list'; }
	var m = args[0];
	args.forEach(a => { if (a.lessThan(m)) { m = a } });
	return m;
}

/**
 * Finds the maximum value in a list of BigNumbers
 * @param  {...BigNumber} args Series of Bignumber passed as arguments
 * @returns {BigNumber} Maximum BigNumber found
 */
function bigNumberMax(...args) {
	if (args.length < 1) { throw 'Max of empty list'; }
	var m = args[0];
	args.forEach(a => { if (a.greaterThan(m)) { m = a } });
	return m;
}

/**
 * Shuffles the contents of an array
 * @param {Array} array Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}


/**
 * Returns an integer value rounded to the nearest integer. The decimal value is the chance of rounding up. 
 * Example: 1.4 will round up 40% of the time.
 * @param {number} float Number with decimal value.
 * @returns {number} Integer value
 */
function randRoundToInteger(float) {
	return Math.floor(float) + ((Math.random() < (float % 1)) ? 1 : 0);
}

/**
 * Oscillates between 0 and 1. Used for animations.
 * @param {*} currentTime 
 * @param {*} timeOnePass 
 * @returns {floar} Number between 0 and 1
 */
function oscillate(currentTime, timeOnePass) {
	return Math.abs(((currentTime / timeOnePass) % 2) - 1);
}

/**
 * Linerar Interpolation between two values. Estimates a value between two known values based on a parameter
 * @param {number} start Minimum value
 * @param {number} end Maximum value
 * @param {float} t Percentile value between 0 and 1
 * @returns {number} Estimated value between start and end
 */
function lerp(start, end, t) {
	return start + t * (end - start);
}

/**
 * Retuns a formatted string of a countdown timer
 * @param {number} secs Value in seconds for the countdown
 * @returns {string} Formatted countdown
 */
function formattedCountDown(secs) {
	if (secs <= 0) {
		return "00:00:00";
	}
	else if (!isFinite(secs)) {
		return secs;
	}
	else {
		var secsLeft = secs;
		if (isBigNumber(secsLeft)) {
			var hoursFormat = secsLeft.divide(3600).floor();
			secsLeft = secsLeft.subtract(hoursFormat.multiply(3600));
			var minsFormat = secsLeft.divide(60).floor();
			secsLeft = secsLeft.subtract(minsFormat.multiply(60));
			var secsFormat = secsLeft;

			hoursFormat = Math.floor(hoursFormat.toFloat());
			minsFormat = Math.floor(minsFormat.toFloat());
			secsFormat = Math.floor(secsFormat.toFloat());
		}
		else {
			var hoursFormat = Math.floor(secsLeft / 3600);
			secsLeft -= hoursFormat * 3600;
			var minsFormat = Math.floor(secsLeft / 60);
			secsLeft -= minsFormat * 60;
			var secsFormat = Math.floor(secsLeft);
		}

		if (hoursFormat < 10) { hoursFormat = "0" + hoursFormat; }
		if (minsFormat < 10) { minsFormat = "0" + minsFormat; }
		if (secsFormat < 10) { secsFormat = "0" + secsFormat; }

		return hoursFormat + ":" + minsFormat + ":" + secsFormat;
	}
}

/**
 * Returns seconds in a formatted DD:HH:MM:SS format
 * @param {number} secs Time in seconds
 * @returns {string} Formatted time
 */
function shortenedFormattedTime(secs) {
	if (secs <= 0) {
		return "0s";
	}
	else {
		var returnValue = "";
		var secsLeft = secs;
		var daysFormat = Math.floor(secsLeft / 86400);
		secsLeft -= daysFormat * 86400;
		var hoursFormat = Math.floor(secsLeft / 3600);
		secsLeft -= hoursFormat * 3600;
		var minsFormat = Math.floor(secsLeft / 60);
		secsLeft -= minsFormat * 60;
		var secsFormat = Math.floor(secsLeft);

		if (daysFormat > 1) {
			returnValue += daysFormat + _("d") + String.fromCharCode(8239);
		}
		else if (daysFormat == 1) {
			returnValue += daysFormat + _("d") + String.fromCharCode(8239);
		}

		if (hoursFormat > 1) {
			returnValue += hoursFormat + _("h") + String.fromCharCode(8239);
		}
		else if (hoursFormat == 1) {
			returnValue += hoursFormat + _("h") + String.fromCharCode(8239);
		}

		if (minsFormat > 1) {
			returnValue += minsFormat + _("m") + String.fromCharCode(8239);
		}
		else if (minsFormat == 1) {
			returnValue += minsFormat + _("m") + String.fromCharCode(8239);
		}

		if (secsFormat > 1) {
			returnValue += secsFormat + _("s");
		}
		else if (secsFormat == 1) {
			returnValue += secsFormat + _("s");
		}

		return returnValue;
	}
}

/**
 * Checks if the value is a BigNumber
 * @param {*} x Value to check
 * @returns {boolean} True if value is a BigNumber
 */
function isBigNumber(x) {
	return typeof (x) == "object" && x.constructor.name == "BigNumber";
}

function beautifynum(n) {
	if (typeof (n) != "object" || n.constructor.name != "BigNumber") {
		n = new BigNumber(n);
	}

	if (n.lessThan(new BigNumber(1, 9))) {
		return addCommasToNumber(Math.floor(n.toFloat()));
	}

	var coefficient = n.coefficient;
	var exponent = n.exponent;

	var dotShift = exponent % 3; // Number of spaces decimal must move to match named order of magnitude
	if (dotShift > 0) {
		coefficient *= Math.pow(10, dotShift);
	}

	coefficient = Math.floor(10 * coefficient) / 10;

	return coefficient.toFixed(1) + " " + getNumberName(n).full;
}

function shortenNum(n, precision = 3, shortenAfterDigits = 3) {

	if (typeof (n) != "object" || n.constructor.name != "BigNumber") {
		n = new BigNumber(n);
	}

	var coefficient = n.coefficient;
	var exponent = n.exponent;

	if (exponent + 1 < shortenAfterDigits || n.lessThan(10000)) {
		return addCommasToNumber(Math.floor(n.toFloat()));
	}

	var dotShift = exponent % 3; // Number of spaces decimal must move to match named order of magnitude
	if (dotShift > 0) {
		coefficient *= Math.pow(10, dotShift);
	}

	var str = coefficient.toFixed(precision).replace(/\.?0+$/, "");

	return str.replace(".000", "") + getNumberName(n).short;
}

const NUMBER_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O'];

function shortenAndBeautifyNum(n, precision = 1) {
	if (typeof (n) === "object" && n.constructor.name == "BigNumber") {
		return shortenNum(n, precision);
	}
	for (var index = 0; index < NUMBER_SUFFIXES.length * 3; index++) {
		if (n < Math.pow(10, index * 3 + 3)) {
			n = n / Math.pow(10, index * 3);
			return n.toFixed(precision).replace('.' + '0'.repeat(precision), '') + NUMBER_SUFFIXES[index];
		}
	}

}

function addCommasToNumber(num) {
	return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function getNumberName(number) {
	var result = { full: "", short: "" }
	if (typeof (number) != "object" || number.constructor.name != "BigNumber") {
		number = new BigNumber(number);
	}
	if (number.exponent >= 36) {
		result.full = _("UNDECILLION");
		result.short = "U";
	}
	else if (number.exponent >= 33) {
		result.full = _("DECILLION");
		result.short = "D";
	}
	else if (number.exponent >= 30) {
		result.full = _("NONILLION");
		result.short = "N";
	}
	else if (number.exponent >= 27) {
		result.full = _("OCTILLION");
		result.short = "O";
	}
	else if (number.exponent >= 24) {
		result.full = _("SEPTILLION");
		result.short = "S";
	}
	else if (number.exponent >= 21) {
		result.full = _("SEXTILLION");
		result.short = "s";
	}
	else if (number.exponent >= 18) {
		result.full = _("QUINTILLION");
		result.short = "Q";
	}
	else if (number.exponent >= 15) {
		result.full = _("QUADRILLION");
		result.short = "q";
	}
	else if (number.exponent >= 12) {
		result.full = _("TRILLION");
		result.short = "T";
	}
	else if (number.exponent >= 9) {
		result.full = _("BILLION");
		result.short = "B";
	}
	else if (number.exponent >= 6) {
		result.full = _("MILLION");
		result.short = "M";
	}
	else if (number.exponent >= 3) {
		result.full = _("THOUSAND");
		result.short = "K";
	}
	return result;
}

function isJavascriptFile(fullPath) {
	return confirmEnding(fullPath, ".js");
}

function confirmEnding(string, target) {
	return string.substr(-target.length) === target;
}

function replaceAll(str, find, replace) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function getArraySum(arrayReference) {
	return arrayReference.reduce(function (a, b) {
		return a + b;
	}, 0);
}

// Base64 encode / decode
// http://www.webtoolkit.info/
var Base64 = {
	// private property
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode: function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode: function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode: function (string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode: function (utftext) {
		var string = "";
		var i = 0;
		var c = 0;
		var c1 = 0;
		var c2 = 0;
		var c3 = 0;

		while (i < utftext.length) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if ((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i + 1);
				c3 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

}

function utf8_to_b64(str) {
	try {
		return Base64.encode(unescape(encodeURIComponent(str)));
	}
	catch (err) {
		return '';
	}
}

function b64_to_utf8(str) {
	try {
		return decodeURIComponent(escape(Base64.decode(str)));
	}
	catch (err) {
		return '';
	}
}

function getLanguageCode(language) {
	switch (language) {
		case "english":
			return "en";

		case "brazilian":
			return "pt-BR";

		case "bulgarian":
			return "bg";

		case "czech":
			return "cs";

		case "danish":
			return "da";

		case "dutch":
			return "nl";

		case "finnish":
			return "fi";

		case "french":
			return "fr";

		case "german":
			return "de";

		case "greek":
			return "el";

		case "hebrew":
			return "he";

		case "hungarian":
			return "hu";

		case "italian":
			return "it";

		case "japanese":
			return "ja";

		case "koreana":
			return "ko";

		case "koreana":
			return "ko";

		case "norwegian":
			return "no";

		case "polish":
			return "pl";

		case "portuguese":
			return "pt";

		case "romanian":
			return "ro";

		case "russian":
			return "ru";

		case "schinese":
			return "zh-Hans";

		case "spanish":
			return "es";

		case "swedish":
			return "sv";

		case "tchinese":
			return "zh-Hant";

		case "thai":
			return "th";

		case "turkish":
			return "tr";

		case "ukrainian":
			return "uk";

		case "hindi":
			return "hi";

		case "indonesian":
			return "id";

		case "vietnamese":
			return "vi";

		case "slovak":
			return "sk";

		case "filipino":
			return "tl";

		default:
			return "en";
	}
}

function getLanguageFromCode(language) {
	switch (language.substring(0, 2)) {
		case "en":
			return "english";

		case "pt":
			return "brazilian";

		case "bg":
			return "bulgarian";

		case "cs":
			return "czech";

		case "da":
			return "danish";

		case "nl":
			return "dutch";

		case "fi":
			return "finnish";

		case "fr":
			return "french";

		case "de":
			return "german";

		case "el":
			return "greek";

		case "he":
			return "hebrew";

		case "hu":
			return "hungarian";

		case "it":
			return "italian";

		case "ja":
			return "japanese";

		case "ko":
			return "koreana";

		case "ko":
			return "koreana";

		case "no":
			return "norwegian";

		case "nb":
			return "norwegian";

		case "nn":
			return "norwegian";

		case "pl":
			return "polish";

		case "pt":
			return "portuguese";

		case "ro":
			return "romanian";

		case "ru":
			return "russian";

		case "zh":
			return "schinese";

		case "es":
			return "spanish";

		case "sv":
			return "swedish";

		case "th":
			return "thai";

		case "tr":
			return "turkish";

		case "kr":
			return "turkish";

		case "uk":
			return "ukrainian";

		case "id":
			return "indonesian";

		case "in":
			return "indonesian";

		case "ar":
			return "arabic";

		case "hi":
			return "hindi";

		case "vi":
			return "vietnamese";

		case "sk":
			return "slovak";

		case "tl":
			return "filipino";

		default:
			return "english";
	}
}

function loadJS(FILE, loadedCallback, callbackScope) {
	var script = document.createElement("script");
	if (loadedCallback != null) {
		script.callbackScope = callbackScope;
		script.onload = function () { loadedCallback.call(this.callbackScope); };
	}
	script.src = FILE;
	script.type = "text/javascript";
	document.getElementsByTagName("head")[0].appendChild(script);
	return true;
}

var savedCanvasStates = {};
function saveCanvasState(canvas) {
	savedCanvasStates[canvas] = {
		"font": canvas.font,
		"fillStyle": canvas.fillStyle,
		"strokeStyle": canvas.strokeStyle
	}
}

function restoreCanvasState(canvas) {
	if (savedCanvasStates.hasOwnProperty(canvas)) {
		canvas.font = savedCanvasStates[canvas].font;
		canvas.fillStyle = savedCanvasStates[canvas].fillStyle;
		canvas.strokeStyle = savedCanvasStates[canvas].strokeStyle;
	}
}

function generateRandomCharacter() {
	var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
	return chars.substr(Math.floor(Math.random() * 62), 1);
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getInterpolatedColorArray(startColorHex, startAlpha, endColorHex, endAlpha, numStepsIncludingStartAndEnd) {
	var result = [];

	var startRgba = hexToRgb(startColorHex);
	startRgba.a = startAlpha;
	var endRgba = hexToRgb(endColorHex);
	endRgba.a = endAlpha;

	var rDifference = endRgba.r - startRgba.r;
	var gDifference = endRgba.g - startRgba.g;
	var bDifference = endRgba.b - startRgba.b;
	var aDifference = endRgba.a - startRgba.a;

	for (var i = 0; i <= numStepsIncludingStartAndEnd; i++) {
		var colorPointMultiplier = i / numStepsIncludingStartAndEnd;
		var rPoint = startRgba.r + Math.round(colorPointMultiplier * rDifference);
		var gPoint = startRgba.g + Math.round(colorPointMultiplier * gDifference);
		var bPoint = startRgba.b + Math.round(colorPointMultiplier * bDifference);
		var aPoint = Math.round((startRgba.a + (colorPointMultiplier * aDifference)) * 100) / 100;
		var colorPoint = { "r": rPoint, "g": gPoint, "b": bPoint, "a": aPoint };
		result.push(colorPoint);
	}

	return result;
}

function shortenStringAndAddEllipsis(text, charactersToShortenTo) {
	if (text.length > charactersToShortenTo) {
		return text.substr(0, charactersToShortenTo - 3) + "...";
	}
	else {
		return text;
	}
}

function getIndefiniteArticleForString(str) {
	// Naively try to determine the indefinite article for a given noun
	if (["the", "a", "an"].includes(str.split(' ')[0].toLowerCase())) {
		// Return nothing if the string begins with an article
		return "";
	}
	else if ("aeiou8".includes(str[0].toLowerCase())) {
		// Will miss some words and numbers greater than 9
		return "an ";
	}
	else {
		return "a "
	}
}

/**
 * Uses fillText to draw text on a canvas, wrapping it to fit within a specified width and height limit. Styles need to be set before calling this function.
 * @param {canvas.context} context Canvas context to draw on
 * @param {string} text String to draw
 * @param {number} x X coordinate to start drawing at
 * @param {number} y Y coordinate to start drawing at
 * @param {number} maxWidth Maximum width of the text
 * @param {number} maxHeight Maximum height of the text
 * @param {string} justify Text justification. Default is "left"
 * @param {number} lineSpacing Line spacing multiplier. Default is 0.5
 * @param {string} verticalJustify Vertical text justification. Default is "top"
 * @param {boolean} measureOnly If true, the function will only measure the text and not draw it. Default is false
 * @returns {object} Object containing the properties of the text
 */
function fillTextWrapWithHeightLimit(context, text, x, y, maxWidth, maxHeight, justify = "left", lineSpacing = 0.5, verticalJustify = "top", measureOnly) {
	const originalFont = context.font;

	if (debugShrunkText) {
		const originalFillStyle = context.fillStyle;
		const originalStrokeStyle = context.strokeStyle;

		context.fillStyle = "#CCCCCC";
		context.strokeStyle = "#000000";
		context.strokeRect(x, y, maxWidth, maxHeight);
		context.fillRect(x, y, maxWidth, maxHeight);

		context.fillStyle = originalFillStyle;
		context.strokeStyle = originalStrokeStyle;
	}

	var textCacheKey = text + "_" + x + "_" + maxWidth;
	if (!textSizeCache.exists(textCacheKey)) {
		var fontParts = context.font.split('px');
		var fontSize = parseInt(fontParts[0]);
		var fontFamily = fontParts[1];
		var estimatedLines = Math.ceil(context.measureText(text).width / maxWidth);
		var lineHeight = fontSize * (1 + lineSpacing);
		var maximumFontSizePossible = fontSize * 3 * maxHeight / (estimatedLines * lineHeight);
		if (fontSize > maximumFontSizePossible) {
			fontSize = maximumFontSizePossible;
			context.font = fontSize + "px " + fontFamily;
		}

		if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
			let minSize = 1;
			let maxSize = fontSize;

			while (minSize <= maxSize) {
				const mid = Math.floor((minSize + maxSize) / 2);
				context.font = mid + "px " + fontFamily;

				if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
					maxSize = mid - 1;
				} else {
					minSize = mid + 1;
				}
			}

			fontSize = maxSize;
			context.font = fontSize + "px " + fontFamily;
		}
		textSizeCache.set(textCacheKey, context.font);
	}
	else {
		context.font = textSizeCache.get(textCacheKey);
	}

	if (verticalJustify == "top") {
		var result = fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly);
	}
	else {
		var dimensions = fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true);
		var extraVerticalSpace = maxHeight - dimensions.height;

		if (verticalJustify == "bottom") {
			var result = fillTextWrap(context, text, x, y + extraVerticalSpace, maxWidth, justify, lineSpacing, measureOnly);
		}
		else if (verticalJustify == "center") {
			var result = fillTextWrap(context, text, x, y + (extraVerticalSpace / 2), maxWidth, justify, lineSpacing, measureOnly);
		}
	}
	result.font = context.font;
	context.font = originalFont;
	return result;
}

/**
 * Uses strokeText to draw text on a canvas, wrapping it to fit within a specified width and height limit. Styles need to be set before calling this function.
 * @param {canvas.context} context Canvas context to draw on
 * @param {string} text String to draw
 * @param {number} x X coordinate to start drawing at
 * @param {number} y Y coordinate to start drawing at
 * @param {number} maxWidth Maximum width of the text
 * @param {number} maxHeight Maximum height of the text
 * @param {string} justify Text justification. Default is "left"
 * @param {number} lineSpacing Line spacing multiplier. Default is 0.5
 * @param {string} verticalJustify Vertical text justification. Default is "top"
 * @param {boolean} measureOnly If true, the function will only measure the text and not draw it. Default is false
 * @returns {object} Object containing the properties of the text
 */
function strokeTextWrapWithHeightLimit(context, text, x, y, maxWidth, maxHeight, justify = "left", lineSpacing = 0.5, verticalJustify = "top") {
	const originalFont = context.font;

	if (debugShrunkText) {
		const originalFillStyle = context.fillStyle;
		const originalStrokeStyle = context.strokeStyle;

		context.fillStyle = "#CCCCCC";
		context.strokeStyle = "#000000";
		context.strokeRect(x, y, maxWidth, maxHeight);
		context.fillRect(x, y, maxWidth, maxHeight);

		context.fillStyle = originalFillStyle;
		context.strokeStyle = originalStrokeStyle;
	}

	var textCacheKey = text + "_" + x + "_" + maxWidth;
	if (!textSizeCache.exists(textCacheKey)) {
		var fontParts = context.font.split('px');
		var fontSize = parseInt(fontParts[0]);
		var fontFamily = fontParts[1];
		var estimatedLines = Math.ceil(context.measureText(text).width / maxWidth);
		var lineHeight = fontSize * (1 + lineSpacing);
		var maximumFontSizePossible = fontSize * 3 * maxHeight / (estimatedLines * lineHeight);
		if (fontSize > maximumFontSizePossible) {
			fontSize = maximumFontSizePossible;
			context.font = fontSize + "px " + fontFamily;
		}

		if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
			let minSize = 1;
			let maxSize = fontSize;

			while (minSize <= maxSize) {
				const mid = Math.floor((minSize + maxSize) / 2);
				context.font = mid + "px " + fontFamily;

				if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
					maxSize = mid - 1;
				} else {
					minSize = mid + 1;
				}
			}

			fontSize = maxSize;
			context.font = fontSize + "px " + fontFamily;
		}
		textSizeCache.set(textCacheKey, context.font);
	}
	else {
		context.font = textSizeCache.get(textCacheKey);
	}

	if (verticalJustify == "top") {
		var result = strokeTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, false);
	}
	else {
		var dimensions = strokeTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true);
		var extraVerticalSpace = maxHeight - dimensions.height;

		if (verticalJustify == "bottom") {
			var result = strokeTextWrap(context, text, x, y + extraVerticalSpace, maxWidth, justify, lineSpacing, false);
		}
		else if (verticalJustify == "center") {
			var result = strokeTextWrap(context, text, x, y + (extraVerticalSpace / 2), maxWidth, justify, lineSpacing, false);
		}
	}
	context.font = originalFont;
	return result;
}

/**
 * Uses stroke and fillText to draw an outlined text on a canvas, wrapping it to fit within a specified width and height limit. Styles need to be set before calling this function.
 * @param {canvas.context} context Canvas context to draw on
 * @param {string} text String to draw
 * @param {number} x X coordinate to start drawing at
 * @param {number} y Y coordinate to start drawing at
 * @param {number} maxWidth Maximum width of the text
 * @param {number} maxHeight Maximum height of the text
 * @param {string} justify Text justification. Default is "left"
 * @param {number} lineSpacing Line spacing multiplier. Default is 0.5
 * @param {string} verticalJustify Vertical text justification. Default is "top"
 * @param {boolean} measureOnly If true, the function will only measure the text and not draw it. Default is false
 * @returns {object} Object containing the properties of the text
 */
function outlineTextWrapWithHeightLimit(context, text, x, y, maxWidth, maxHeight, justify = "left", lineSpacing = 0.5, verticalJustify = "top", measureOnly) {
	const originalFont = context.font;

	if (debugShrunkText) {
		const originalFillStyle = context.fillStyle;
		const originalStrokeStyle = context.strokeStyle;

		context.fillStyle = "#CCCCCC";
		context.strokeStyle = "#000000";
		context.strokeRect(x, y, maxWidth, maxHeight);
		context.fillRect(x, y, maxWidth, maxHeight);

		context.fillStyle = originalFillStyle;
		context.strokeStyle = originalStrokeStyle;
	}

	var textCacheKey = text + "_" + x + "_" + maxWidth;
	if (!textSizeCache.exists(textCacheKey)) {
		var fontParts = context.font.split('px');
		var fontSize = parseInt(fontParts[0]);
		var fontFamily = fontParts[1];
		var estimatedLines = Math.ceil(context.measureText(text).width / maxWidth);
		var lineHeight = fontSize * (1 + lineSpacing);
		var maximumFontSizePossible = fontSize * 3 * maxHeight / (estimatedLines * lineHeight);
		if (fontSize > maximumFontSizePossible) {
			fontSize = maximumFontSizePossible;
			context.font = fontSize + "px " + fontFamily;
		}

		if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
			let minSize = 1;
			let maxSize = fontSize;

			while (minSize <= maxSize) {
				const mid = Math.floor((minSize + maxSize) / 2);
				context.font = mid + "px " + fontFamily;

				if (fillTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true).height > maxHeight) {
					maxSize = mid - 1;
				} else {
					minSize = mid + 1;
				}
			}

			fontSize = maxSize;
			context.font = fontSize + "px " + fontFamily;
		}
		textSizeCache.set(textCacheKey, context.font);
	}
	else {
		context.font = textSizeCache.get(textCacheKey);
	}

	if (verticalJustify == "top") {
		var result = outlineTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly);
	}
	else {
		var dimensions = outlineTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, true);
		var extraVerticalSpace = maxHeight - dimensions.height;

		if (verticalJustify == "bottom") {
			var result = outlineTextWrap(context, text, x, y + extraVerticalSpace, maxWidth, justify, lineSpacing, measureOnly);
		}
		else if (verticalJustify == "center") {
			var result = outlineTextWrap(context, text, x, y + (extraVerticalSpace / 2), maxWidth, justify, lineSpacing, measureOnly);
		}
	}
	result.font = context.font;
	context.font = originalFont;
	return result;
}


/**
 * Draw text to a canvas, wrapping to a new line if the width exceeds maxWidth. Most commonly used via the fillTextWrap, etc.
 * @param {canvas.context} context Canvas context to draw on
 * @param {string} text Text to draw
 * @param {number} x X coordinate to start drawing at
 * @param {number} y Y coordinate to start drawing at
 * @param {number} maxWidth Maximum width of the text
 * @param {string} justify Text justification. Default is "left"
 * @param {number} lineSpacing Line spacing multiplier. Default is 0.5
 * @param {boolean} measureOnly If true, the function will only measure the text and not draw it. Default is false
 * @param {string} mode Drawing mode, can be "fill", "stroke", or "outline". Default is "fill"
 * @param {boolean} boldText If true, the text will be drawn in bold. Default is false
 * @returns {object} Bounding box of the drawn text
 */
function drawTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly, mode, boldText) {
	if (text == "" || maxWidth <= 0)
		return {
			x1: x,
			y1: y,
			x2: x,
			y2: y,
			width: 0,
			height: 0
		};
	text = text.toString();
	text = text.replace(/<br>|\\n/g, ' \n ');
	text = text.replace(/<[^<>]+>/g, '');

	var fontParts = context.font.split('px');
	var fontSize = parseInt(fontParts[0]);
	var fontFamily = fontParts[1] || 'sans-serif';

	var words = text.split(" ");
	var renderArgs;
	var wordWidth;
	var line = [];
	var lines = [];
	var lineWidth = 0;
	var lineY = y;
	var longestLineWidth = 0;
	var spaceWidth = context.measureText(' ').width;
	context.save();
	for (var i = 0; i < words.length; ++i) {
		if (words[i] == "") {
			continue;
		}
		wordWidth = context.measureText(words[i]).width + (i > 0 ? spaceWidth : 0);
		if (wordWidth > maxWidth) {
			// Split up words that are wider than maxWidth
			var firstWordWidth = Math.floor(words[i].length * maxWidth / wordWidth);
			var newWord = words[i].slice(firstWordWidth);
			words[i] = words[i].slice(0, firstWordWidth);
			words.splice(i + 1, 0, newWord);
			wordWidth = context.measureText(words[i]).width + (i > 0 ? spaceWidth : 0);
		}

		if (words[i] == "<br>" || words[i] == "\n" || i > 0 && lineWidth + wordWidth > maxWidth) {
			switch (justify) {
				case "left":
					renderArgs = [line.join(" "), x, lineY];
					break;
				case "right":
					renderArgs = [line.join(" "), x + maxWidth - lineWidth, lineY];
					break;
				case "center":
					renderArgs = [line.join(" "), x + maxWidth / 2 - lineWidth / 2, lineY];
					break;
				default:
					renderArgs = [line.join(" "), x, lineY];
			}
			lines.push(
				{
					text: renderArgs[0],
					x: renderArgs[1],
					y: renderArgs[2]
				}
			);
			if (!measureOnly) {
				if (mode === "stroke" || mode === "outline") {
					context.lineJoin = "bevel";
				}
				switch (mode) {
					case "fill":
						context.fillText(...renderArgs);
						break;
					case "stroke":
						context.strokeText(...renderArgs);
						break;
					case "outline":
						context.strokeText(...renderArgs);
						context.fillText(...renderArgs);
						break;
					default:
						context.fillText(...renderArgs);
				}
			}
			line = [];
			lineWidth = 0;
			lineY += fontSize * (1 + lineSpacing);
			if (words[i] == "<br>" || words[i] == "\n") {
				continue;
			}
		}
		line.push(words[i]);
		lineWidth += wordWidth;

		if (wordWidth > maxWidth || boldText) {
			var newFontSize = wordWidth > maxWidth ? fontSize * maxWidth / lineWidth : fontSize;
			var newFontStyle = boldText ? "bold " : "";
			context.font = newFontStyle + newFontSize + "px " + fontFamily;
		}

		if (lineWidth > longestLineWidth) {
			longestLineWidth = lineWidth;
		}
	}
	switch (justify) {
		case "left":
			renderArgs = [line.join(" "), x, lineY];
			break;
		case "right":
			renderArgs = [line.join(" "), x + maxWidth - lineWidth, lineY];
			break;
		case "center":
			renderArgs = [line.join(" "), x + maxWidth / 2 - lineWidth / 2, lineY];
			break;
		default:
			renderArgs = [line.join(" "), x, lineY];
	}
	lines.push(
		{
			text: renderArgs[0],
			x: renderArgs[1],
			y: renderArgs[2]
		}
	);
	if (!measureOnly) {
		switch (mode) {
			case "fill":
				context.fillText(...renderArgs);
				break;
			case "stroke":
				context.lineJoin = "bevel";
				context.strokeText(...renderArgs);
				break;
			case "outline":
				context.lineJoin = "bevel";
				context.strokeText(...renderArgs);
				context.fillText(...renderArgs);
				break;
			default:
				context.fillText(...renderArgs);
		}
	}
	context.restore();
	return {
		x1: x,
		y1: y,
		x2: x + longestLineWidth,
		y2: lineY + fontSize,
		width: longestLineWidth,
		height: lineY + fontSize - y,
		lines: lines
	}
}


function fillTextWrap(context, text, x, y, maxWidth, justify = "left", lineSpacing = 0.5, measureOnly = false, boldText = false) {
	return drawTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly, "fill", boldText);
}

function strokeTextWrap(context, text, x, y, maxWidth, justify = "left", lineSpacing = 0.5, measureOnly = false, boldText = false) {
	return drawTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly, "stroke", boldText);
}

function outlineTextWrap(context, text, x, y, maxWidth, justify = "left", lineSpacing = 0.5, measureOnly = false, boldText = false) {
	return drawTextWrap(context, text, x, y, maxWidth, justify, lineSpacing, measureOnly, "outline", boldText);
}

/**
 * Extracts font size from a font string
 * @param {string} fontString - The canvas font string
 * @return {number} The font size in pixels
 */
function extractFontSize(fontString) {
	// Match any number followed by 'px'
	const match = fontString.match(/(\d+)px/);
	return match ? parseInt(match[1], 10) : 16; // Default to 16px if no match
}

/**
 * Renders debug visualization for text sizing
 * @param {CanvasRenderingContext2D} context - The canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} maxWidth - Maximum width
 * @param {number} fontSize - Current font size
 */
function renderDebugRect(context, x, y, maxWidth, fontSize) {
	// Store original styles
	const originalFillStyle = context.fillStyle;
	const originalStrokeStyle = context.strokeStyle;

	// Apply debug styles
	context.fillStyle = "#CCCCCC";
	context.strokeStyle = "#000000";
	context.strokeRect(x, y, maxWidth, fontSize);
	context.fillRect(x, y, maxWidth, fontSize);

	// Restore original styles
	context.fillStyle = originalFillStyle;
	context.strokeStyle = originalStrokeStyle;
}

var debugShrunkText = false;

// Draw text to a canvas, shrinking the text until it fits in a given box
// Returns the bounding box of the drawn text
// This is for single line text
var debugShrunkText = false;
function fillTextShrinkToFit(context, text, x, y, maxWidth, justify = "left", stretchTextAmount = 0, measureOnly = false, boldText = false) {
	if (debugShrunkText) {
		context.save();
		context.fillStyle = "#CCCCCC";
		context.strokeStyle = "#000000";
		var splitFont = context.font.split('px')[0].split(' ');
		var startingFontSize = parseInt(splitFont[splitFont.length - 1]);
		context.strokeRect(x, y, maxWidth, startingFontSize);
		context.fillRect(x, y, maxWidth, startingFontSize);
		context.restore();
	}

	context.save();
	text = text.toString();
	context.font = (boldText) ? "bold " + context.font : context.font;
	var lineWidth = context.measureText(text).width;
	var splitFont = context.font.split('px')[0].split(' ');
	var fontSize = parseInt(splitFont[splitFont.length - 1]);
	var stretchAmount = (1 - stretchTextAmount);
	if (lineWidth > maxWidth) {
		if (stretchTextAmount > 0) {
			fontSize *= maxWidth / (lineWidth * stretchAmount);
			context.font = fontSize + "px " + context.font.split('px')[1];
			context.scale(stretchAmount, 1);
			context.font = (boldText) ? "bold " + context.font : context.font;
			lineWidth = context.measureText(text).width;
			x /= stretchAmount;
			maxWidth /= stretchAmount;
		}
		else {
			fontSize *= maxWidth / lineWidth;
			context.font = fontSize + "px " + context.font.split('px')[1];
			context.font = (boldText) ? "bold " + context.font : context.font;
			lineWidth = context.measureText(text).width;
		}
	}


	if (!measureOnly) {
		switch (justify) {
			case "left":
				context.fillText(text, x, y);
				break;
			case "right":
				context.fillText(text, x + maxWidth - lineWidth, y);
				break;
			case "center":
				context.fillText(text, x + maxWidth / 2 - lineWidth / 2, y);
				break;
		}
	}
	context.restore();
	return {
		x1: x,
		y1: y,
		x2: "center" ? x + maxWidth / 2 + lineWidth / 2 : x + lineWidth,
		y2: y + fontSize,
		width: lineWidth,
		height: fontSize
	}
}

function strokeTextShrinkToFit(context, text, x, y, maxWidth, justify = "left", boldText = false) {
	context.save();
	context.lineJoin = "bevel";
	text = text.toString();
	context.font = (boldText) ? "bold " + context.font : context.font;
	var lineWidth = context.measureText(text).width;
	var fontSize = parseInt(context.font.split('px')[0]);
	if (lineWidth > maxWidth) {
		fontSize = fontSize * maxWidth / lineWidth;
		context.font = fontSize + "px " + context.font.split('px')[1];
		context.font = (boldText) ? "bold " + context.font : context.font;
		lineWidth = context.measureText(text).width;
	}
	switch (justify) {
		case "left":
			context.strokeText(text, x, y);
			break;
		case "right":
			context.strokeText(text, x + maxWidth - lineWidth, y);
			break;
		case "center":
			context.strokeText(text, x + maxWidth / 2 - lineWidth / 2, y);
			break;
	}
	context.restore();
	return {
		x1: x,
		y1: y,
		x2: x + lineWidth,
		y2: y + fontSize,
		width: lineWidth,
		height: fontSize
	}
}

/**
 * Renders text with stroke that shrinks to fit within a specified width.
 * @param {CanvasRenderingContext2D} context Canvas context where the text will be rendered
 * @param {string} text Text to render
 * @param {number} x X-Axis position
 * @param {number} y Y-Axis position
 * @param {number} maxWidth Width to fit the text within
 * @param {string} justify Text alignment: "left", "right", or "center". Default is "left".
 * @param {number} stretchTextAmount How much to stretch the text to fit the width. Default is 0.
 * @param {boolean} measureOnly If true, the function will only measure the text and not render it. Default is false.
 * @param {boolean} boldText Set to true to render text in bold. Default is false.
 * @returns {object} Properties of the rendered text
 */
function outlineTextShrinkToFit(context, text, x, y, maxWidth, justify = "left", stretchTextAmount = 0, measureOnly = false, boldText = false) {
	context.save();
	context.lineJoin = "bevel";
	text = text.toString();
	context.font = (boldText) ? "bold " + context.font : context.font;
	var lineWidth = context.measureText(text).width;
	var fontSize = parseInt(context.font.split('px')[0]);
	if (lineWidth > maxWidth) {
		fontSize = fontSize * maxWidth / lineWidth;
		context.font = fontSize + "px " + context.font.split('px')[1];
		context.font = (boldText) ? "bold " + context.font : context.font;
		lineWidth = context.measureText(text).width;
	}
	switch (justify) {
		case "left":
			context.strokeText(text, x, y);
			context.fillText(text, x, y);
			break;
		case "right":
			context.strokeText(text, x + maxWidth - lineWidth, y);
			context.fillText(text, x + maxWidth - lineWidth, y);
			break;
		case "center":
			context.strokeText(text, x + maxWidth / 2 - lineWidth / 2, y);
			context.fillText(text, x + maxWidth / 2 - lineWidth / 2, y);
			break;
	}
	context.restore();
	return {
		x1: x,
		y1: y,
		x2: x + lineWidth,
		y2: y + fontSize,
		width: lineWidth,
		height: fontSize
	}
}

function getCanvasFractionalYOffset() {
	var canvas = document.createElement("canvas");
	// document.body.appendChild(canvas);
	var context = canvas.getContext("2d");
	var canvasHeight = 20;
	canvas.height = canvasHeight;
	canvas.width = canvasHeight;
	// canvas.style.width = canvasHeight;
	// canvas.style.height = canvasHeight;
	// canvas.style.left = 0;
	// canvas.style.top = 0;
	// canvas.style.position = "absolute";
	context.font = canvasHeight + "px Verdana";
	context.fillStyle = "#FFFFFF";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#000000";
	context.textBaseline = "top";
	context.fillText("F", 0, 0);
	var imageData = context.getImageData(0, 0, canvasHeight, canvasHeight);
	var halfWidth = Math.floor(canvas.width / 2);
	for (var i = 0; i < canvas.height; ++i) {
		var j = ((i * canvas.width) + halfWidth) * 4
		if (imageData.data[j] < 255) {
			return i / canvas.height;
		}
	}
	return 0;
}

function roundRect(context, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke === 'undefined') {
		stroke = true;
	}
	if (typeof radius === 'undefined') {
		radius = 5;
	}
	if (typeof radius === 'number') {
		radius = { tl: radius, tr: radius, br: radius, bl: radius };
	} else {
		var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
		for (var side in defaultRadius) {
			radius[side] = radius[side] || defaultRadius[side];
		}
	}
	context.beginPath();
	context.moveTo(x + radius.tl, y);
	context.lineTo(x + width - radius.tr, y);
	context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	context.lineTo(x + width, y + height - radius.br);
	context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	context.lineTo(x + radius.bl, y + height);
	context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	context.lineTo(x, y + radius.tl);
	context.quadraticCurveTo(x, y, x + radius.tl, y);
	context.closePath();
	if (fill) {
		context.fill();
	}
	if (stroke) {
		context.stroke();
	}

}

function getScaledImageDimensions(image, targetWidth = -1, targetHeight = -1) {
	return getScaledDimensions(image.width, image.height, targetWidth, targetHeight);
}

function getScaledDimensions(realWidth, realHeight, targetWidth = -1, targetHeight = -1) {
	if (targetWidth == -1 && targetHeight == -1) {
		return { width: realHeight, height: realHeight };
	}
	else if (targetWidth == -1) {
		targetWidth = realWidth * targetHeight / realHeight;
	}
	else if (targetHeight == -1) {
		targetHeight = realHeight * targetWidth / realWidth;
	}
	return { width: targetWidth, height: targetHeight };
}

function fitBoxInBox(sourceWidth, sourceHeight, x, y, maxWidth, maxHeight, horizontalAlign = "center", verticalAlign = "center") {
	var scale = 1;
	var xOffset = 0;
	var yOffset = 0;
	var verticalScale = maxHeight / sourceHeight;
	if (sourceWidth * verticalScale >= maxWidth) {
		// If scaling based on height makes it too wide, use width instead
		scale = maxWidth / sourceWidth;
		yOffset = getAlignmentOffset(verticalAlign, sourceHeight * scale, maxHeight);
	}
	else {
		scale = verticalScale;
		xOffset = getAlignmentOffset(horizontalAlign, sourceWidth * scale, maxWidth);
	}

	return {
		x: x + xOffset,
		y: y + yOffset,
		width: sourceWidth * scale,
		height: sourceHeight * scale
	}
}

function getAlignmentOffset(align, objectWidth, containerWidth) {
	switch (align) {
		case "center":
			return containerWidth / 2 - objectWidth / 2;
		case "top":
		case "left":
			return 0;
		case "bottom":
		case "right":
			return containerWidth - objectWidth;
		default:
			return 0;
	}
}

function getItemCoordsInList(itemWidth, itemHeight, hPadding, vPadding, itemsPerRow, index) {
	var indexInRow = index % itemsPerRow;
	var rowNum = Math.floor(index / itemsPerRow);
	var coords = {
		x: hPadding * (indexInRow + 1) + itemWidth * indexInRow,
		y: (vPadding + itemHeight) * rowNum
	}
	return coords;
}

function openExternalLinkInDefaultBrowser(link) {
	if (getBuildTarget() == STEAM_BUILD) {
		ipcRenderer.sendSync("open-external-link", link);
	}
	else if (getBuildTarget() == MOBILE_BUILD) {
		if (typeof cordova !== 'undefined' && cordova.InAppBrowser) {
			cordova.InAppBrowser.open(link, '_system');
		} else if (typeof navigator !== 'undefined' && navigator.app && navigator.app.loadUrl) {
			navigator.app.loadUrl(link, { openExternal: true });
		} else {
			window.open(link, '_system');
		}
	}
	else {
		window.open(link, '_blank');
	}
}

function generateExternalLinkHtml(link, anchor) {
	return '<span style=\'cursor: pointer; color: #6666FF; text-decoration: underline;\' onClick=\'openExternalLinkInDefaultBrowser(\"' + link + '\")\'>' + anchor + '</span>';
}

function openDiscord() {
	trackEvent_communityButtonClicked();
	openExternalLinkInDefaultBrowser(_("https://discord.gg/C3KwWQr"));
}

function openTwitter() {
	openExternalLinkInDefaultBrowser("https://twitter.com/MrMineidle");
}

function openTikTok() {
	openExternalLinkInDefaultBrowser("https://www.tiktok.com/@mrmineidle");
}

function openInstagram() {
	openExternalLinkInDefaultBrowser("https://www.instagram.com/mrmineidle/");
}

function timeStampToDate(UNIX_timestamp) {
	var a = new Date(UNIX_timestamp);
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
	return time;
}

function getSaveDetails(save) {
	var decodedSaveData = b64_to_utf8(b64_to_utf8(save.split("|")[1])).split("|");
	var money = decodedSaveData[0];
	var depth = decodedSaveData[1];
	return {
		"money": money,
		"depth": depth
	};
}

function fallbackCopyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Fallback: Copying text command was ' + msg);
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}

	document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
	if (isMobile()) {
		cordova.plugins.clipboard.copy(text);
	}
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	navigator.clipboard.writeText(text).then(function () {
		console.log('Async: Copying to clipboard was successful!');
	}, function (err) {
		console.error('Async: Could not copy text: ', err);
	});
}

function getStandardDeviation(array) {
	const n = array.length
	const mean = array.reduce((a, b) => a + b) / n
	return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

function getPageLoadPercent() {
	var imgs = document.getElementsByTagName("img");
	var numLoaded = 0;
	for (var i = 0; i < imgs.length; i++) {
		if (imgs[i].complete && typeof imgs[i].naturalWidth != 'undefined' && imgs[i].naturalWidth != 0) {
			numLoaded++;
		}
	}
	return numLoaded / imgs.length;
}

function duplicate2dArray(array) {
	var newArray = [];
	for (var i = 0; i < array.length; i++) {
		newArray[i] = array[i].slice();
	}
	return newArray;
}

function create2dArray(width, height, valueToPopulateWith) {
	var resultArray = [];
	for (var i = 0; i < height; i++) {
		resultArray.push([]);
		for (var j = 0; j < width; j++) {
			resultArray[i].push(valueToPopulateWith);
		}
	}
	return resultArray;
}

//Don't use this unless you need to it is slow
function deepCopyObject(obj) {
	return JSON.parse(JSON.stringify(obj));
}

// ############################################################################
// ################################# LZSTRING #################################
// ############################################################################

// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
var LZString = (function () {

	// private property
	var f = String.fromCharCode;
	var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
	var baseReverseDic = {};

	function getBaseValue(alphabet, character) {
		if (!baseReverseDic[alphabet]) {
			baseReverseDic[alphabet] = {};
			for (var i = 0; i < alphabet.length; i++) {
				baseReverseDic[alphabet][alphabet.charAt(i)] = i;
			}
		}
		return baseReverseDic[alphabet][character];
	}

	var LZString = {
		compressToBase64: function (input) {
			if (input == null) return "";
			var res = LZString._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
			switch (res.length % 4) { // To produce valid Base64
				default: // When could this happen ?
				case 0: return res;
				case 1: return res + "===";
				case 2: return res + "==";
				case 3: return res + "=";
			}
		},

		decompressFromBase64: function (input) {
			if (input == null) return "";
			if (input == "") return null;
			return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
		},

		compressToUTF16: function (input) {
			if (input == null) return "";
			return LZString._compress(input, 15, function (a) { return f(a + 32); }) + " ";
		},

		decompressFromUTF16: function (compressed) {
			if (compressed == null) return "";
			if (compressed == "") return null;
			return LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; });
		},

		//compress into uint8array (UCS-2 big endian format)
		compressToUint8Array: function (uncompressed) {
			var compressed = LZString.compress(uncompressed);
			var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character

			for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
				var current_value = compressed.charCodeAt(i);
				buf[i * 2] = current_value >>> 8;
				buf[i * 2 + 1] = current_value % 256;
			}
			return buf;
		},

		//decompress from uint8array (UCS-2 big endian format)
		decompressFromUint8Array: function (compressed) {
			if (compressed === null || compressed === undefined) {
				return LZString.decompress(compressed);
			} else {
				var buf = new Array(compressed.length / 2); // 2 bytes per character
				for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
					buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
				}

				var result = [];
				buf.forEach(function (c) {
					result.push(f(c));
				});
				return LZString.decompress(result.join(''));

			}

		},


		//compress into a string that is already URI encoded
		compressToEncodedURIComponent: function (input) {
			if (input == null) return "";
			return LZString._compress(input, 6, function (a) { return keyStrUriSafe.charAt(a); });
		},

		//decompress from an output of compressToEncodedURIComponent
		decompressFromEncodedURIComponent: function (input) {
			if (input == null) return "";
			if (input == "") return null;
			input = input.replace(/ /g, "+");
			return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
		},

		compress: function (uncompressed) {
			return LZString._compress(uncompressed, 16, function (a) { return f(a); });
		},
		_compress: function (uncompressed, bitsPerChar, getCharFromInt) {
			if (uncompressed == null) return "";
			var i, value,
				context_dictionary = {},
				context_dictionaryToCreate = {},
				context_c = "",
				context_wc = "",
				context_w = "",
				context_enlargeIn = 2, // Compensate for the first entry which should not count
				context_dictSize = 3,
				context_numBits = 2,
				context_data = [],
				context_data_val = 0,
				context_data_position = 0,
				ii;

			for (ii = 0; ii < uncompressed.length; ii += 1) {
				context_c = uncompressed.charAt(ii);
				if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
					context_dictionary[context_c] = context_dictSize++;
					context_dictionaryToCreate[context_c] = true;
				}

				context_wc = context_w + context_c;
				if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
					context_w = context_wc;
				} else {
					if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
						if (context_w.charCodeAt(0) < 256) {
							for (i = 0; i < context_numBits; i++) {
								context_data_val = (context_data_val << 1);
								if (context_data_position == bitsPerChar - 1) {
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else {
									context_data_position++;
								}
							}
							value = context_w.charCodeAt(0);
							for (i = 0; i < 8; i++) {
								context_data_val = (context_data_val << 1) | (value & 1);
								if (context_data_position == bitsPerChar - 1) {
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else {
									context_data_position++;
								}
								value = value >> 1;
							}
						} else {
							value = 1;
							for (i = 0; i < context_numBits; i++) {
								context_data_val = (context_data_val << 1) | value;
								if (context_data_position == bitsPerChar - 1) {
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else {
									context_data_position++;
								}
								value = 0;
							}
							value = context_w.charCodeAt(0);
							for (i = 0; i < 16; i++) {
								context_data_val = (context_data_val << 1) | (value & 1);
								if (context_data_position == bitsPerChar - 1) {
									context_data_position = 0;
									context_data.push(getCharFromInt(context_data_val));
									context_data_val = 0;
								} else {
									context_data_position++;
								}
								value = value >> 1;
							}
						}
						context_enlargeIn--;
						if (context_enlargeIn == 0) {
							context_enlargeIn = Math.pow(2, context_numBits);
							context_numBits++;
						}
						delete context_dictionaryToCreate[context_w];
					} else {
						value = context_dictionary[context_w];
						for (i = 0; i < context_numBits; i++) {
							context_data_val = (context_data_val << 1) | (value & 1);
							if (context_data_position == bitsPerChar - 1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = value >> 1;
						}


					}
					context_enlargeIn--;
					if (context_enlargeIn == 0) {
						context_enlargeIn = Math.pow(2, context_numBits);
						context_numBits++;
					}
					// Add wc to the dictionary.
					context_dictionary[context_wc] = context_dictSize++;
					context_w = String(context_c);
				}
			}

			// Output the code for w.
			if (context_w !== "") {
				if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
					if (context_w.charCodeAt(0) < 256) {
						for (i = 0; i < context_numBits; i++) {
							context_data_val = (context_data_val << 1);
							if (context_data_position == bitsPerChar - 1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else {
								context_data_position++;
							}
						}
						value = context_w.charCodeAt(0);
						for (i = 0; i < 8; i++) {
							context_data_val = (context_data_val << 1) | (value & 1);
							if (context_data_position == bitsPerChar - 1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = value >> 1;
						}
					} else {
						value = 1;
						for (i = 0; i < context_numBits; i++) {
							context_data_val = (context_data_val << 1) | value;
							if (context_data_position == bitsPerChar - 1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = 0;
						}
						value = context_w.charCodeAt(0);
						for (i = 0; i < 16; i++) {
							context_data_val = (context_data_val << 1) | (value & 1);
							if (context_data_position == bitsPerChar - 1) {
								context_data_position = 0;
								context_data.push(getCharFromInt(context_data_val));
								context_data_val = 0;
							} else {
								context_data_position++;
							}
							value = value >> 1;
						}
					}
					context_enlargeIn--;
					if (context_enlargeIn == 0) {
						context_enlargeIn = Math.pow(2, context_numBits);
						context_numBits++;
					}
					delete context_dictionaryToCreate[context_w];
				} else {
					value = context_dictionary[context_w];
					for (i = 0; i < context_numBits; i++) {
						context_data_val = (context_data_val << 1) | (value & 1);
						if (context_data_position == bitsPerChar - 1) {
							context_data_position = 0;
							context_data.push(getCharFromInt(context_data_val));
							context_data_val = 0;
						} else {
							context_data_position++;
						}
						value = value >> 1;
					}


				}
				context_enlargeIn--;
				if (context_enlargeIn == 0) {
					context_enlargeIn = Math.pow(2, context_numBits);
					context_numBits++;
				}
			}

			// Mark the end of the stream
			value = 2;
			for (i = 0; i < context_numBits; i++) {
				context_data_val = (context_data_val << 1) | (value & 1);
				if (context_data_position == bitsPerChar - 1) {
					context_data_position = 0;
					context_data.push(getCharFromInt(context_data_val));
					context_data_val = 0;
				} else {
					context_data_position++;
				}
				value = value >> 1;
			}

			// Flush the last char
			while (true) {
				context_data_val = (context_data_val << 1);
				if (context_data_position == bitsPerChar - 1) {
					context_data.push(getCharFromInt(context_data_val));
					break;
				}
				else context_data_position++;
			}
			return context_data.join('');
		},

		decompress: function (compressed) {
			if (compressed == null) return "";
			if (compressed == "") return null;
			return LZString._decompress(compressed.length, 32768, function (index) { return compressed.charCodeAt(index); });
		},

		_decompress: function (length, resetValue, getNextValue) {
			var dictionary = [],
				next,
				enlargeIn = 4,
				dictSize = 4,
				numBits = 3,
				entry = "",
				result = [],
				i,
				w,
				bits, resb, maxpower, power,
				c,
				data = { val: getNextValue(0), position: resetValue, index: 1 };

			for (i = 0; i < 3; i += 1) {
				dictionary[i] = i;
			}

			bits = 0;
			maxpower = Math.pow(2, 2);
			power = 1;
			while (power != maxpower) {
				resb = data.val & data.position;
				data.position >>= 1;
				if (data.position == 0) {
					data.position = resetValue;
					data.val = getNextValue(data.index++);
				}
				bits |= (resb > 0 ? 1 : 0) * power;
				power <<= 1;
			}

			switch (next = bits) {
				case 0:
					bits = 0;
					maxpower = Math.pow(2, 8);
					power = 1;
					while (power != maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = resetValue;
							data.val = getNextValue(data.index++);
						}
						bits |= (resb > 0 ? 1 : 0) * power;
						power <<= 1;
					}
					c = f(bits);
					break;
				case 1:
					bits = 0;
					maxpower = Math.pow(2, 16);
					power = 1;
					while (power != maxpower) {
						resb = data.val & data.position;
						data.position >>= 1;
						if (data.position == 0) {
							data.position = resetValue;
							data.val = getNextValue(data.index++);
						}
						bits |= (resb > 0 ? 1 : 0) * power;
						power <<= 1;
					}
					c = f(bits);
					break;
				case 2:
					return "";
			}
			dictionary[3] = c;
			w = c;
			result.push(c);
			while (true) {
				if (data.index > length) {
					return "";
				}

				bits = 0;
				maxpower = Math.pow(2, numBits);
				power = 1;
				while (power != maxpower) {
					resb = data.val & data.position;
					data.position >>= 1;
					if (data.position == 0) {
						data.position = resetValue;
						data.val = getNextValue(data.index++);
					}
					bits |= (resb > 0 ? 1 : 0) * power;
					power <<= 1;
				}

				switch (c = bits) {
					case 0:
						bits = 0;
						maxpower = Math.pow(2, 8);
						power = 1;
						while (power != maxpower) {
							resb = data.val & data.position;
							data.position >>= 1;
							if (data.position == 0) {
								data.position = resetValue;
								data.val = getNextValue(data.index++);
							}
							bits |= (resb > 0 ? 1 : 0) * power;
							power <<= 1;
						}

						dictionary[dictSize++] = f(bits);
						c = dictSize - 1;
						enlargeIn--;
						break;
					case 1:
						bits = 0;
						maxpower = Math.pow(2, 16);
						power = 1;
						while (power != maxpower) {
							resb = data.val & data.position;
							data.position >>= 1;
							if (data.position == 0) {
								data.position = resetValue;
								data.val = getNextValue(data.index++);
							}
							bits |= (resb > 0 ? 1 : 0) * power;
							power <<= 1;
						}
						dictionary[dictSize++] = f(bits);
						c = dictSize - 1;
						enlargeIn--;
						break;
					case 2:
						return result.join('');
				}

				if (enlargeIn == 0) {
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}

				if (dictionary[c]) {
					entry = dictionary[c];
				} else {
					if (c === dictSize) {
						entry = w + w.charAt(0);
					} else {
						return null;
					}
				}
				result.push(entry);

				// Add w+entry[0] to the dictionary.
				dictionary[dictSize++] = w + entry.charAt(0);
				enlargeIn--;

				w = entry;

				if (enlargeIn == 0) {
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}

			}
		}
	};
	return LZString;
})();

if (typeof define === 'function' && define.amd) {
	define(function () { return LZString; });
} else if (typeof module !== 'undefined' && module != null) {
	module.exports = LZString
} else if (typeof angular !== 'undefined' && angular != null) {
	angular.module('LZString', [])
		.factory('LZString', function () {
			return LZString;
		});
}

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion failed";
	}
}

function ajax(url, params, method, callback = null) {
	var queryString;
	if (!params) {
		return
	} else if (typeof (params) == "object") {
		queryString = createQueryString(params);
	} else if (typeof (params) == "string") {
		queryString = params;
	}
	method = method.toUpperCase();
	if (method != "POST") {
		url += "?" + queryString;
		// Don't need to send the query string once it's appended to the url
		queryString = null;
	}
	var xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4 && callback != null) {
			if (typeof (xhr.responseText) !== "undefined") {
				callback(xhr.responseText, xhr);
			} else {
				callback(null, xhr);
			}
		}
	}
	xhr.send(queryString);
}

function createQueryString(obj) {
	var parts = [];
	Object.keys(obj).forEach(function (key) {
		parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
	});
	return parts.join('&');
}

var remainingLanguages = [];
var screenshotsTaken = 0;

function takeScreenshotsForAllLanguages() {
	if (!translations || typeof translations !== 'object') {
		console.error("Global 'translations' object is invalid or undefined.");
		return;
	}

	screenshotsTaken++;
	remainingLanguages = Object.keys(translations);

	if (remainingLanguages.length === 0) {
		console.warn("No languages available in 'translations' to take screenshots for.");
		return;
	}

	console.log(`Starting screenshots for ${remainingLanguages.length} languages.`);
	takeScreenshotForLanguage();
}

/**
 * Takes screenshots for all languages for mobile builds.
 * Requires var ipcRenderer and var fs to be defined.
 * @returns 
 */
function takeMobileScreenshotsForAllLanguages() {
	if (isMobile()) {
		ipcRenderer = require('electron').ipcRenderer;
		fs = require('fs');

		if (!translations || typeof translations !== 'object') {
			console.error("Global 'translations' object is invalid or undefined.");
			return;
		}

		screenshotsTaken++;
		remainingLanguages = Object.keys(translations);

		if (remainingLanguages.length === 0) {
			console.warn("No languages available in 'translations' to take screenshots for.");
			return;
		}

		console.log(`Starting screenshots for ${remainingLanguages.length} languages.`);
		takeScreenshotForLanguage();
	}
	else {
		console.warn("Function only available in mobile build.");
	}
}

function takeScreenshotForLanguage() {
	if (remainingLanguages.length === 0) {
		console.log("Finished taking screenshots.");
		return;
	}

	const currentLanguage = remainingLanguages.shift();
	localStorage['languageOverride'] = currentLanguage;
	languageOverride = currentLanguage;
	language = currentLanguage;
	console.log(`Processing language: ${currentLanguage}`);

	const folder = `../Screenshots/screenshot_${screenshotsTaken}`;
	const fileName = `${currentLanguage}_${currentTime()}.png`;
	const location = `${folder}/${fileName}`;

	ensureFolderExists(folder)
		.then(() => takeScreenshot(location))
		.then(() => {
			console.log(`Screenshot taken for language: ${currentLanguage}`);
			takeScreenshotForLanguage(); // Continue with the next language
		})
		.catch((err) => {
			console.error(`Error processing language ${currentLanguage}: ${err.message}`);
		});
}

function ensureFolderExists(folder) {
	return new Promise((resolve, reject) => {
		fs.mkdir(folder, { recursive: true }, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

function takeScreenshot(fileName) {
	return new Promise((resolve, reject) => {
		try {
			console.log(`Requesting screenshot for: ${fileName}`);
			ipcRenderer.once('screenshot-success', (event, savedFile) => {
				console.log(`Screenshot saved at: ${savedFile}`);
				resolve();
			});
			ipcRenderer.once('screenshot-error', (event, errorMessage) => {
				console.error(`Screenshot error: ${errorMessage}`);
				reject(new Error(errorMessage));
			});
			setTimeout(
				() => ipcRenderer.send('take-screenshot', fileName),
				200
			)
		} catch (err) {
			reject(err);
		}
	});
}

function getStandardDeviationPercent(std) {
	return erf(std / Math.SQRT2);
}

function cdf(x, mean, variance) {
	return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))));
}

function erf(x) {
	// save the sign of x
	var sign = (x >= 0) ? 1 : -1;
	x = Math.abs(x);

	// constants
	var a1 = 0.254829592;
	var a2 = -0.284496736;
	var a3 = 1.421413741;
	var a4 = -1.453152027;
	var a5 = 1.061405429;
	var p = 0.3275911;

	// A&S formula 7.1.26
	var t = 1.0 / (1.0 + p * x);
	var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
	return sign * y; // erf(-x) = -erf(x);
}

//Reference: http://www.independent-software.com/determining-coordinates-on-a-html-canvas-bezier-curve.html
function getBezierXY(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
	return {
		x: Math.pow(1 - t, 3) * sx + 3 * t * Math.pow(1 - t, 2) * cp1x + 3 * t * t * (1 - t) * cp2x + t * t * t * ex,
		y: Math.pow(1 - t, 3) * sy + 3 * t * Math.pow(1 - t, 2) * cp1y + 3 * t * t * (1 - t) * cp2y + t * t * t * ey
	};
}

//Reference: http://www.independent-software.com/determining-coordinates-on-a-html-canvas-bezier-curve.html
function getBezierAngle(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
	var dx = Math.pow(1 - t, 2) * (cp1x - sx) + 2 * t * (1 - t) * (cp2x - cp1x) + t * t * (ex - cp2x);
	var dy = Math.pow(1 - t, 2) * (cp1y - sy) + 2 * t * (1 - t) * (cp2y - cp1y) + t * t * (ey - cp2y);
	return -Math.atan2(dx, dy) + 0.5 * Math.PI;
}

//Rules a paid miner name has to follow. Names are drawn centred under their miner and are roughly
//one miner wide, so neighbouring miners would overlap; and the first and last miner of a row sit at
//the edge of the screen where the name gets clipped.
var MAX_PAID_NAMES_PER_ROW = 3;
var PAID_NAME_FIRST_SLOT = 1;      //never miner 0
var PAID_NAME_LAST_SLOT = 8;       //never miner 9
var MIN_PAID_NAME_SLOT_GAP = 2;    //never two names on adjacent miners
var MAX_PAID_NAME_CHARS = 12;      //agreed cap for new names; wider ones need extra clearance
var PAID_NAME_LAYOUT_WIDTH = 960;  //narrowest window the spacing is designed to survive
var PAID_NAME_CLEARANCE = 8;       //pixels we want left between two names at that width

//Rows that must keep their generated names.
var MODS_ROW_DEPTH = 200;          //hand-made discord mods row, all 10 slots
var JEB_DEPTH = 1089;              //isJeb/nearJeb in quotes.js pin miners 7-9 here for quest 90

//The deepest row the drill can actually reach. dig() only makes progress while depth < levels.length - 1,
//so Titan's last rows (up to titan.endDepth) exist but nobody ever sees them. Names must not go there
//until those floors are implemented.
function getMaxReachableDepth() {
	return levels.length - 1;
}

//Every row between startDepth and endDepth that can actually hold a name: the row itself and
//both of its neighbours need workers, so names never sit at the edge of a workerless stretch.
function getUsablePaidNameDepths(startDepth, endDepth) {
	var depths = [];
	endDepth = Math.min(endDepth, getMaxReachableDepth());
	for (var depth = startDepth; depth <= endDepth; depth++) {
		if (depth == MODS_ROW_DEPTH || depth == JEB_DEPTH) {
			continue;
		}
		if (!isDepthWithoutWorkers(depth) && !isDepthWithoutWorkers(depth - 1) && !isDepthWithoutWorkers(depth + 1)) {
			depths.push(depth);
		}
	}
	return depths;
}

//How wide a name actually draws, in the same font renderMinerName uses. A char count is not enough:
//twelve W's are roughly twice as wide as twelve i's.
var paidNameMeasureContext = null;
function measurePaidNameWidth(name) {
	if (paidNameMeasureContext == null && typeof document != "undefined") {
		paidNameMeasureContext = document.createElement("canvas").getContext("2d");
		paidNameMeasureContext.font = "12px Arial";
	}
	if (paidNameMeasureContext != null) {
		return paidNameMeasureContext.measureText(name).width;
	}
	return name.length * 7.5; //fallback for tooling that runs without a canvas
}

//Miners are PAID_NAME_LAYOUT_WIDTH * .072 apart (see renderMinerName), so how many miners two names
//need between them depends on how wide they draw.
function getRequiredPaidNameGap(nameA, nameB) {
	var minerPitch = PAID_NAME_LAYOUT_WIDTH * .072;
	var needed = (measurePaidNameWidth(nameA) + measurePaidNameWidth(nameB)) / 2 + PAID_NAME_CLEARANCE;
	return Math.max(MIN_PAID_NAME_SLOT_GAP, Math.ceil(needed / minerPitch));
}

//Worker slots a row could still take, given what is already on it and how wide the new name draws.
function getFreePaidNameSlots(depth, name, extraSlots) {
	var occupied = [];
	for (var slot = 0; slot <= 9; slot++) {
		var existing = getPremiumMinerName(depth, slot);
		if (existing != null) {
			occupied.push({ "slot": slot, "name": existing });
		}
	}
	if (extraSlots) {
		for (var e = 0; e < extraSlots.length; e++) {
			occupied.push(extraSlots[e]);
		}
	}

	var free = [];
	for (var candidate = PAID_NAME_FIRST_SLOT; candidate <= PAID_NAME_LAST_SLOT; candidate++) {
		var fits = true;
		for (var o = 0; o < occupied.length; o++) {
			if (Math.abs(candidate - occupied[o].slot) < getRequiredPaidNameGap(name, occupied[o].name)) {
				fits = false;
				break;
			}
		}
		if (fits) {
			free.push(candidate);
		}
	}
	return free;
}

//Generates paidMinerNames entries scattered at random over the whole depth range. The old version
//appended after the last existing name, which is what left Earth and the Moon at one name per row
//while Titan piled up four deep. Rows are picked at random rather than in order so a batch doesn't
//read as a regular pattern, and rows that are full or too crowded to fit the name are skipped.
function generateNameStubs(numNames, nameArray = null, startDepth = null, endDepth = null) {
	if (startDepth == null) {
		startDepth = paidMinerNames[0].depth;
	}
	if (endDepth == null) {
		endDepth = Math.min(worlds[worlds.length - 1].endDepth - 3, getMaxReachableDepth());
	}

	var usableDepths = getUsablePaidNameDepths(startDepth, endDepth);
	if (usableDepths.length == 0) {
		console.log("No usable depths between " + startDepth + " and " + endDepth);
		return "";
	}

	//Slots claimed by this batch, on top of what paidMinerNames already holds.
	var pendingSlots = {};
	var result = "";
	for (var n = 0; n < numNames; n++) {
		var name = "";
		if (nameArray != null && n < nameArray.length) {
			name = nameArray[n];
		}
		if (name.length > MAX_PAID_NAME_CHARS) {
			console.log("WARNING: \"" + name + "\" is " + name.length + " characters; " + MAX_PAID_NAME_CHARS + " is the limit, so it will need more room than usual");
		}
		//The star is part of what gets drawn, so measure it too.
		var drawnName = String.fromCharCode(9733) + name;

		//Try random rows until one has room for this name.
		var chosenDepth = -1;
		var chosenSlot = -1;
		for (var attempt = 0; attempt < 400 && chosenDepth < 0; attempt++) {
			var candidate = usableDepths[rand(0, usableDepths.length - 1)];
			var free = getFreePaidNameSlots(candidate, drawnName, pendingSlots[candidate]);
			if (free.length > 0) {
				var taken = (pendingSlots[candidate] || []).length;
				var alreadyThere = 0;
				for (var s = 0; s <= 9; s++) {
					if (getPremiumMinerName(candidate, s) != null) {
						alreadyThere++;
					}
				}
				if (alreadyThere + taken < MAX_PAID_NAMES_PER_ROW) {
					chosenDepth = candidate;
					chosenSlot = free[rand(0, free.length - 1)];
				}
			}
		}
		if (chosenDepth < 0) {
			console.log("Could not find room for " + (numNames - n) + " more name(s) between " + startDepth + " and " + endDepth);
			break;
		}

		if (!pendingSlots[chosenDepth]) {
			pendingSlots[chosenDepth] = [];
		}
		pendingSlots[chosenDepth].push({ "slot": chosenSlot, "name": drawnName });

		result += '\t{ "name": String.fromCharCode(9733) + "' + name + '", "depth": ' + chosenDepth + ', "workerIndex": ' + chosenSlot + ' },\r\n';
	}

	console.log(result);
	return result;
}

function generateNameStubsForWorld(numNames, nameArray = null, world = null) {
	if (world) {
		return generateNameStubs(numNames, nameArray, world.startDepth, world.endDepth - 3);
	}
}


function generateCharCodeStubFromString(str) {
	var charCodes = [];
	for (var i = 0; i < str.length; ++i) {
		charCodes.push(str.charCodeAt(i));
	}
	return "String.fromCharCode(" + charCodes.join(",") + ")";
}

//##############################################################
//################## VIDEO GENERATION BELOW ####################
//##############################################################

// 1) Call runScenes to generate chained eval callbacks
// 2) Run one of the following ffmpeg commands from command line:
//     Best: ffmpeg -i videoFrames/%d.png -c:v libvpx-vp9 -lossless 1 output1.webm
//     Second Best: ffmpeg -i videoFrames/%d.png -c:v ffv1 output2.avi
//     Third Best: ffmpeg -i videoFrames/%d.png -c:v huffyuv output3.avi

function runScenes() {
	buffs.activeBuffs = [];

	var scene4 = "function(){generateAnimatedSequence(360, 480, 993, 1003, 25);}";
	var scene3 = "function(){generateAnimatedSequence(240, 360, 980, 990, 25, " + scene4 + ");}";
	var scene2 = "function(){generateAnimatedSequence(120, 240, 293, 300, 25, " + scene3 + ");}";
	var scene1 = "function(){generateAnimatedSequence(0, 120, 1, 4, 25, " + scene2 + ");}";
	eval("(" + scene1 + ")();");
}

function runFadeToBlack() {
	buffs.activeBuffs = [];
	worldAtDepth(1).workersHired = 1;
	worldAtDepth(1).workerLevel = 0;

	var scene9 = "function(){generateAnimatedSequence(2000, 2250, 80, 90, 25); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 7;}";
	var scene8 = "function(){generateAnimatedSequence(1750, 2000, 70, 80, 25, " + scene9 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 6;}";
	var scene7 = "function(){generateAnimatedSequence(1500, 1750, 60, 70, 25, " + scene8 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 5;}";
	var scene6 = "function(){generateAnimatedSequence(1250, 1500, 50, 60, 25, " + scene7 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 4;}";
	var scene5 = "function(){generateAnimatedSequence(1000, 1250, 40, 50, 25, " + scene6 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 3;}";
	var scene4 = "function(){generateAnimatedSequence(750, 1000, 30, 40, 25, " + scene5 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 2;}";
	var scene3 = "function(){generateAnimatedSequence(500, 750, 20, 30, 25, " + scene4 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 1;}";
	var scene2 = "function(){generateAnimatedSequence(250, 500, 10, 20, 25, " + scene3 + "); worldAtDepth(1).workersHired = 10; worldAtDepth(1).workerLevel = 0;}";
	var scene1 = "function(){generateAnimatedSequence(0, 250, 1, 10, 25, " + scene2 + "); worldAtDepth(1).workersHired = 5; worldAtDepth(1).workerLevel = 0;}";
	eval("(" + scene1 + ")();");
}

function generateAnimatedSequence(startFrameNumber, endFrameNumber, startRenderDepth, endRenderDepth, fps, finalCallback = "function(){console.log('done');}") {
	var callbackChain = "(";
	for (var i = startFrameNumber; i < endFrameNumber; i++) {
		var renderDepthFloat = startRenderDepth + ((i - startFrameNumber) / (endFrameNumber - startFrameNumber)) * (endRenderDepth - startRenderDepth);
		callbackChain += "function(){ generateSeamlessWorldImage(" + i + ", " + fps + ", " + renderDepthFloat + ", ";
	}
	callbackChain += finalCallback;
	for (var i = startFrameNumber; i < endFrameNumber; i++) {
		callbackChain += ")}";
	}
	callbackChain += ")();";

	eval(callbackChain);
}

function generateSeamlessWorldImage(frameNumber, fps, renderDepthFloat, callback) {
	var startAnimationCounter = framesRendered2;
	var framesUntilIncrementAnimation = fps / 10;
	var currentFrameNum = Math.floor(frameNumber / framesUntilIncrementAnimation);

	currentlyViewedDepth = Math.floor(renderDepthFloat);
	framesRendered2 = currentFrameNum;
	numFramesRendered = currentFrameNum;
	animate();

	var tempCanvas = document.createElement('canvas');
	tempCanvas.width = mainw;
	tempCanvas.height = mainh * 2;

	var tempCanvasFinal = document.createElement('canvas');
	tempCanvasFinal.width = mainw;
	tempCanvasFinal.height = mainh;

	tempCanvas.getContext("2d").drawImage(main, mainw * .082, mainh * .112, mainw * .853, mainh * .888, 0, 0, mainw, mainh);
	currentlyViewedDepth = Math.min(currentlyViewedDepth + 5, depth);
	framesRendered2 = currentFrameNum;
	numFramesRendered = currentFrameNum;
	animate();
	tempCanvas.getContext("2d").drawImage(main, mainw * .082, mainh * .112, mainw * .853, mainh * .888, 0, mainh, mainw, mainh);

	tempCanvasFinal.getContext("2d").drawImage(tempCanvas, 0, mainh * (renderDepthFloat % 1 * .2), mainw, mainh, 0, 0, mainw, mainh);

	var imageUrl = tempCanvasFinal.toDataURL("image/png");
	const base64Data = imageUrl.replace(/^data:image\/png;base64,/, "");
	fs.writeFile("../Screenshots/videoFrames/" + frameNumber + ".png", base64Data, 'base64', function (err) {
		callback();
	});
}

function generateDrillCombinationAnimations(callback) {
	//generate a large canvas with all drills on it
	//render multiple frames of this and then export the frames as images

	var tempCanvases = [];
	for (var i = 0; i < 4; i++) {
		var tempCanvas = document.createElement('canvas');
		tempCanvas.width = 1920;
		tempCanvas.height = 1080;
		var tempContext = tempCanvas.getContext("2d");
		tempCanvases.push(tempCanvas);

		//loop through drills
		for (var j = 0; j < 32; j++) {
			tempContext.drawImage(window["drilltop" + j], 168 * (i % 4), 0, 168, 158, 192 * (j % 10), 216 * Math.floor(j / 10), 168, 158);
			tempContext.drawImage(window["drillbit" + j], 168 * (i % 4), 0, 168, 158, 192 * (j % 10), 216 * Math.floor(j / 10), 168, 158);
		}

		var imageUrl = tempCanvas.toDataURL("image/png");
		const base64Data = imageUrl.replace(/^data:image\/png;base64,/, "");
		fs.writeFile("../Screenshots/drillFrames/" + i + ".png", base64Data, 'base64', function (err) {
			callback();
		});
	}
}

// function isDev()
// {
// 	if(typeof process !== "undefined")
// 	{
// 		if(typeof process.env.APP_DEV !== "undefined")
// 		{
// 			return process.env.APP_DEV.includes("true");
// 		}
// 		else
// 		{
// 			return false;
// 		}
// 	}
// 	else if(window.location)
// 	{
// 		return window.location.href.split("?")[0] == "https://mrmine.com/dev/desktop/index.html";
// 	}
// 	return false;
// }

function getId(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


//##############################################################
//################### END VIDEO GENERATION #####################
//##############################################################

function unicodeToStringCode(text) {
	var result = "";
	var characterArray = text.split("&#");
	for (var i = 0; i < characterArray.length; i++) {
		var code = characterArray[i].split(";")[0];
		var remaining = characterArray[i].split(";")[1];
		if (!isNaN(code)) {
			result += String.fromCharCode(code);
		}
		else {
			result += code;
		}
		if (remaining !== undefined) {
			result += remaining;
		}
	}
	return result;
}

async function testWebmUnpack() {
	var numFrames = 30;
	let videoBlob = await fetch('Shared/Assets/Unused/output.webm').then(r => r.blob());

	let videoObjectUrl = URL.createObjectURL(videoBlob);
	let video = document.createElement("video");
	video.src = videoObjectUrl;
	video.crossOrigin = "anonymous";
	document.body.append(video);
	await video.play();
	video.addEventListener("seeked", async () => { if (seekResolve) seekResolve(); });

	while ((video.duration === Infinity || isNaN(video.duration)) && video.readyState < 2) {
		await new Promise(r => setTimeout(r, 1000));
	}

	var canvas = document.createElement('canvas');
	canvas.width = video.videoWidth * numFrames;
	canvas.height = video.videoHeight;
	var ctx = canvas.getContext("2d");

	var duration = video.duration;
	var frameTime = numFrames / duration;
	for (var i = 0; i < numFrames; i++) {
		video.currentTime = (i + 0.5) * frameTime;
		video.play();
		await new Promise(r => (seekResolve = r));
		ctx.drawImage(video, i * video.videoWidth, 0);
	}
	console.log('ended');
	testWebm.src = canvas.toDataURL('image/webp', 1);
}

/**
 * Retuns a string shortened to a specific byte length.
 * If the string is longer than the specified length, it will be truncated and an ellipsis will be added.
 * @param {string} str String to truncate 
 * @param {number} maxBytes Maximum byte length of the string
 * @returns {string} Truncated string with ellipsis if necessary
 */
function truncateByByteLength(str, maxBytes) {
	if (!str) return "";

	const ellipsis = "...";
	const ellipsisBytes = new TextEncoder().encode(ellipsis).length;

	if (maxBytes <= ellipsisBytes) {
		return ellipsis.substring(0, Math.floor(maxBytes / 3));
	}

	const maxContentBytes = maxBytes - ellipsisBytes;

	const chars = [...str];
	let byteCount = 0;
	let result = "";

	for (let i = 0; i < chars.length; i++) {
		const charBytes = new TextEncoder().encode(chars[i]).length;

		if (byteCount + charBytes > maxContentBytes) {
			break;
		}

		result += chars[i];
		byteCount += charBytes;
	}

	if (result.length < str.length) {
		return result + ellipsis;
	}

	return str;
}

function addSuperMinersByName(name = "", amount = 1, level = 1) {
	if (superMinerManager !== undefined && superMinerManager !== null) {
		var superMiner = superMinerManager.baseSuperMiners.find(miner => miner.name === name);
		if (superMiner) {
			var freeSlots = superMinerManager.slots - superMinerManager.currentSuperMiners.length;
			if (freeSlots < amount) {
				console.warn("Not enough free slots to add " + amount + " super miners. Only " + freeSlots + " slots available.");
				amount = freeSlots;
			}
			for (var i = 0; i < amount; i++) {
				superMinerManager.addSuperMiner(superMiner);
				superMinerManager.currentSuperMiners[superMinerManager.currentSuperMiners.length - 1].level = level;
			}
		}
		else {
			console.warn("Super miner with name '" + name + "' not found.");
		}
	}
}

function addBattleEquipsByName(name = "", amount = 1, level = 1) {
	if (battleEquipsManager !== undefined && battleEquipsManager !== null) {
		var battleEquip = battleEquipsManager.baseEquips.find(equip => equip.name === name);
		if (battleEquip) {
			var freeSlots = battleEquipsManager.slots - battleEquipsManager.activeEquips.length;
			if (freeSlots < amount) {
				console.warn("Not enough free slots to add " + amount + " battle equips. Only " + freeSlots + " slots available.");
				amount = freeSlots;
			}
			for (var i = 0; i < amount; i++) {
				battleEquipsManager.addActiveEquip(battleEquip.id);
				battleEquipsManager.activeEquips[battleEquipsManager.activeEquips.length - 1].level = level;
			}
		}
		else {
			console.warn("Battle equip with name '" + name + "' not found.");
		}
	}
}
{ }