var mineralAndMoneyLog = [];
var totalValueLog = [];
var singleMiningLoopValueSnapshot = [];
var useragent = "";
var camefrom = "0";
var userIdSetInSession = false;
var lastTimeDataWasLogged = 0;
var timesLoggedAtSameTime = 0;
var wasInitialized = false;

function initializeTrackers() {
	if (!platform.allowTracking) {
		console.error("[STATS TRACKING] Attempting to initialize trackers when tracking has been disabled");
		return;
	}
}

//-- End Setup --

var tier = isDevUser ? 'development' : 'production';

var firstSessionVersion = version;
var firstSessionTime = new Date().getTime();
var firstTestVersion = latestTestNumber;
if (localStorage["firstSessionVersion"] == undefined) {
	localStorage["firstSessionVersion"] = version;
}
else {
	firstSessionVersion = parseInt(localStorage["firstSessionVersion"]);
	if (isNaN(localStorage["firstSessionVersion"])) {
		firstSessionVersion = version;
	}
}

if (localStorage["firstSessionTime"] == undefined) {
	localStorage["firstSessionTime"] = new Date().getTime();
}
else {
	firstSessionTime = parseInt(localStorage["firstSessionTime"]);
	if (isNaN(localStorage["firstSessionTime"])) {
		firstSessionTime = new Date().getTime();
	}
}

if (localStorage["firstTestVersion"] == undefined) {
	localStorage["firstTestVersion"] = new Date().getTime();
}
else {
	firstTestVersion = parseInt(localStorage["firstTestVersion"]);
	if (isNaN(localStorage["firstTestVersion"])) {
		firstTestVersion = latestTestNumber;
	}
}

async function updateUserProperties() {
	if (!platform.allowTracking) {
		return;
	}

	var isSpender = centsSpent > 0;
	var userProperties = {
		"splitTestSeed": uxSeed,
		"gameVersion": version,
		"earliestVersion": earliestVersion,
		"firstTimePlayed": firstTimePlayed,
		"isSpender": isSpender,
		"splitTestValue1": splitTestValue1,
		"isDev": isDevUser,
		"saveFiles": (localStorage["R"] !== undefined ? localStorage["R"].split("|").length - 1 : 0),
		"activePlayTimeMinutes": activePlayTimeMinutes,
		"totalPlayMinutes": totalPlayMinutes,
		"depth": depth,
		"hasImported": hasImported,
		"testNumber": testNumber,
		"basicChestRewardRollerSeed": basicChestRewardRollerSeed,
		"goldenChestRewardRollerSeed": goldenChestRewardRollerSeed,
		"tradeRollerSeed": tradeRollerSeed,
		"caveRollerSeed": caveRollerSeed,
		"clickableRollerSeed": clickableRollerSeed,
		"chestSpawnRollerSeed": chestSpawnRollerSeed,
		"languageOverride": languageOverride,
		"systemLanguage": platform.getSystemLanguage(),
		"platform": platformName(),
		"isFirstSession": (localStorage["R"] !== undefined ? false : true),
		"numGameLaunches": numGameLaunches,
		"firstSessionVersion": firstSessionVersion,
		"firstSessionTime": firstSessionTime,
		"firstTestVersion": firstTestVersion,
		"environment": tier,
		"UID": UID
	};
}

async function logToAppsFlyer(key, value, additionalData = {}) {
	if (!platform.allowTracking || typeof (appsFlyer) == "undefined") {
		return;
	}

	return appsFlyer.logEvent(key, { value: value, additionalData: additionalData });
}

function logValuationStats() {
	mineralAndMoneyLog.push([getValueOfMinerals(), money]);
	totalValueLog.push(getValueOfMinerals().add(money));
	if (mineralAndMoneyLog.length > 60) {
		mineralAndMoneyLog.splice(0, 1);
	}
	if (totalValueLog.length > 60) {
		totalValueLog.splice(0, 1);
	}
}

function lastMinuteChangeInValues() {
	if (singleMiningLoopValueSnapshot.length <= 1) return 0;

	var totIncreaseInValue = 0;
	var numIncreases = 0;
	for (var i = 0; i < singleMiningLoopValueSnapshot.length; i++) {
		if (singleMiningLoopValueSnapshot[i] > 0) {
			totIncreaseInValue += parseInt(singleMiningLoopValueSnapshot[i]);
			numIncreases++;
		}
	}
	if (numIncreases <= 0 || totIncreaseInValue <= 0) return 0;
	return Math.floor(totIncreaseInValue / numIncreases) * 10 * 60;
}

// #####################################################
// ############### REMOTE EVENT TRACKING ###############
// #####################################################

async function trackGenericEvent(key, value, labels = {}) {
	if (!platform.allowTracking) {
		return;
	}
	if (typeof isSimulating !== "undefined" && isSimulating) {
		return;
	}

	const updateUserVal = await updateUserProperties();

	key = encodeURIComponent(key);
	value = encodeURIComponent(value);

	if (lastTimeDataWasLogged < currentTime() + 1000) {
		timesLoggedAtSameTime = 0;
		lastTimeDataWasLogged = currentTime();
	}
	else {
		timesLoggedAtSameTime++;
		if (timesLoggedAtSameTime > 2) {
			console.log("Event throttled: " + key);
			return;
		}
	}

	logToAppsFlyer(key, value, labels);
}

function trackEvent_DepthIncrease(newDepth) {
	if (isSimulating) {
		if (rows[0][0] != "Depth") {
			rows[0] = ["Depth", "Time to Complete", "Avg Time", "Time"];
		}

		if (rows[depth + 1]) {
			if (rows[depth + 1][0] == "0") {
				rows[depth + 1][0] = newDepth;
			}

			if (rows[depth + 1][(totalSims + 3) - currentSim - 1]) {
				if (rows[depth + 1][(totalSims + 3) - currentSim - 1] == "0") {
					rows[depth + 1][(totalSims + 3) - currentSim - 1] = playtime;

					//put a value in the previous cell if it was empty
					if (rows[depth][(totalSims + 3) - currentSim - 1] == "0") {
						rows[depth][(totalSims + 3) - currentSim - 1] = playtime;
					}
				}
			}

			if (currentSim == 0) {
				for (var i = 1; i < simDepth + 1; i++) {
					if (rows[i][2] == "0") {
						let avg = calculateAverageOfArray(rows[i].slice(3, totalSims + 3), true);
						rows[i][2] = !isNaN(avg) && avg > 0 ? avg : 0;
					}

					if (rows[i][1] == "0" && i > 1) {
						rows[i][1] = rows[i][2] - rows[i - 1][2];
					}
				}

			}

		}
	}
	else {

		if (newDepth % 5 == 0) {
			playsaurusSdk.logDepthReached(newDepth);
		}
		if (newDepth <= 20 || newDepth % 10 == 0) {
			var key = "depthIncrease";
			var value = newDepth;
			trackGenericEvent(key, value);
		}
	}
}

function trackEvent_StartTutorial() {
	var key = "startTutorial";
	var value = 1;
	trackGenericEvent(key, value);
}

function trackEvent_FinishTutorial() {
	var key = "finishTutorial";
	var value = 1;
	trackGenericEvent(key, value);
}

function trackEvent_CraftUpgrade(upgradeId) {
	return; //disable this
	var key = "craftedUpgrade";
	var value = upgradeId;
	trackGenericEvent(key, value);
}

function trackEvent_FoundChest(isGold) {
	return; //disable this
	if (isGold) {
		var key = "foundGoldChest";
		trackGenericEvent(key, 1);
	}
}

function trackEvent_OpenedBlackChest(superMinerId, superMinerRarity, superMinerSoulsGained) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logBlackChestOpened(
			superMinerId,
			superMinerRarity,
			superMinerSoulsGained
		);
	}
}

function trackEvent_FinishBossBattle(wasFightWon) {
	var key = "finishBossBattle";
	var value = wasFightWon;
	trackGenericEvent(key, value, { "depth": depth });
}

function trackEvent_StartExcavation(scientistRarity, scientistLevel, deathChance, rewardId, duration) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logExcavationStarted(
			scientistRarity,
			scientistLevel,
			deathChance,
			rewardId,
			duration
		);
	}
}

function trackEvent_FinishExcavation(wasExcavationSuccessful) {
	return; //disable this
	var key = "finishExcavation";
	var value = wasExcavationSuccessful;
	//trackGenericEvent(key, value);
}

function trackEvent_StartCave(caveDepth) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logCaveStarted(
			caveDepth
		);
	}
}

function trackEvent_PurchasedTickets(ticketQuantity, cents = 0) {
	var key = "purchasedTickets";
	var value = ticketQuantity;
	trackGenericEvent(key, value, { "depth": depth, "cents": cents });
}

function trackEvent_MadePurchase(sku, amount = 0, currency = null, usdAmount = 0, usdAmountCents = 0) {
	var key = "madePurchase";
	var value = sku;
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logInAppPurchase(sku, amount, currency, usdAmount);
	}
	// trackGenericEvent(key, value, {"depth": depth, "cents": cents});
	if (centsSpent == usdAmountCents) {
		// Assumes that centsSpent was incremented before the event was tracked
		trackEvent_MadeFirstPurchase(sku, amount, currency, usdAmount);
	}
}

function trackEvent_MadeFirstPurchase(sku, amount = 0, currency = null, usdAmount = 0) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logFirstPurchase(sku, amount, currency, usdAmount);
	}
}

function trackEvent_ViewedPurchaseWindow() {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logPurchaseWindowViewed();
	}
}

function trackEvent_ViewedOffer(sku) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logViewedOffer(sku)
	}
}

function trackEvent_StartedPurchase(sku) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logStartedPurchase(sku);
	}
}

function trackEvent_CanceledPurchase(sku) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logCanceledPurchase(sku);
	}
}

function trackEvent_HireMiner(world, newMinerCount, newMinerLevel) {
	var key = "hireMiner";
	var value = newMinerCount;
	trackGenericEvent(key, value);
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logMinerPurchase(
			world,
			newMinerCount,
			newMinerLevel
		);
	}
}

function trackEvent_UpgradeMiners(world, newMinerCount, newMinerLevel) {
	var key = "upgradeMiners";
	var value = level;
	trackGenericEvent(key, value);
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logMinerPurchase(
			world,
			newMinerCount,
			newMinerLevel
		);
	}
}

function trackEvent_PurchaseBlueprint(blueprintId) {
	var key = "purchaseBlueprint";
	var value = blueprintId;
	trackGenericEvent(key, value);
}

function trackEvent_SpentTickets(amountSpent, category, subtype) {
	playsaurusSdk.logPremiumCurrencySpent(amountSpent, category, subtype);
}

function trackEvent_CompletedCave(caveDepth) {
	return; //disable this
	var key = "completedCaveAtDepth";
	var value = caveDepth;
	trackGenericEvent(key, value);
}

function trackEvent_LoadedGame() {
	var key = "loadedGameNumLaunches";
	var value = numGameLaunches;
	trackGenericEvent(key, value);
}

function trackEvent_exitedGame() {
	var key = "exitedGameSessionDuration";
	var value = performance.now() / 60000;
	trackGenericEvent(key, value, { "activePlayTime": activePlayTimeMinutesInSession });

	if (isFirstSession) {
		trackGenericEvent("exitedFirstGameSessionDuration", value, { "activePlayTime": activePlayTimeMinutesInSession });
	}
}

function trackEvent_redeemCode(code = "") {
	var key = "redeemCode";
	var value = depth;
	if (redeemedCodes.length > 0) {
		trackGenericEvent(key, value, { "code": redeemedCodes[redeemedCodes.length - 1] });

		if (typeof (playsaurusSdk) != "undefined") {
			playsaurusSdk.logRedeemedCode(code);
		}
	}
}

function trackEvent_GainedMoney(amount, source, isMineral = false) {
	if (isSimulating) {
		let headers = ["scientists", "basic chest", "gold chest", "caves", "trades", "battles", "selling", "super miner"];
		let columnNum = 0;

		if (!moneyRows[0] != "scientists") {
			for (var i = 0; i < headers.length; i++) {
				moneyRows[0 + i] = headers[i];
				moneyRows[0 + i].length = totalSims + 4;
			}
		}


		if (!isNaN(Number(amount))) {
			moneyRows[1 + (totalSims - currentSim)][columnNum + source] += Number(amount);

			if (isMineral) {
				moneyRows[1 + (totalSims - currentSim)][columnNum + 6] -= Number(amount);
			}
		}
		else {
			console.log("received nan value from: " + headers[source])
		}
	}
}

function trackEvent_upgradeDrill(drillPartLevel, drillPartIndex, drillWattageChangePercent, cargoPercentIncrease) {
	var key = "upgradeDrill";
	var value = drillPartLevel;

	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logDrillUpgrade(
			drillPartIndex,
			drillPartLevel,
			drillWattageChangePercent,
			cargoPercentIncrease
		);
	}

	trackGenericEvent(key, value);

	if (isSimulating) {
		let rowNum = 2;

		if (drillUpgradesRows[rowNum - 2][0] != "Drill ID") {
			console.log("Creating new row for drill upgrade");
			drillUpgradesRows[rowNum - 2] = ["Drill ID", "Type", "Level", "Avg Depth", "Depth"];

			for (var i = 0; i < 200; i++) {
				let equip = getDrillEquipById(i + 4);
				if (!equip) continue;
				drillUpgradesRows[(rowNum - 1) + i] = [i + 4, equip.getPartTypeName(), equip.level];
				drillUpgradesRows[(rowNum - 1) + i].length = totalSims + 5;
			}
		}

		drillUpgradesRows[(rowNum - 5) + getDrillEquipByLevel(drillPartIndex, drillPartLevel).id][currentSim + 4] = depth;

		if (currentSim == 0) {
			drillUpgradesRows[(rowNum - 5) + getDrillEquipByLevel(drillPartIndex, drillPartLevel).id][currentSim + 3] = calculateAverageOfArray(drillUpgradesRows[(rowNum - 5) + getDrillEquipByLevel(drillPartIndex, drillPartLevel).id].slice(3, totalSims + 3), true);
		}
	}
}

function trackEvent_completedQuest(questId) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logQuestCompleted(questId);
	}
}

function trackEvent_ClickedOrangeFish(atDepth) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logOrangeFishCollected(atDepth);
	}
}

function trackEvent_UpgradedStructure(structureId, level) {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logStructureUpgrade(
			structureId,
			level
		);
	}
}

function trackEvent_logConfusionLevel(confusionLevel) {
	var key = "confusion";
	var value = confusionLevel;
	trackGenericEvent(key, value);
}

function trackEvent_logPurchaseWindowOpen() {
	if (!hasOpenedPurchaseWindow) {
		hasOpenedPurchaseWindow = true;
		var key = "purchaseWindowOpen";
		trackGenericEvent(key, 1);
	}
}

function trackEvent_communityButtonClicked() {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logClickedCommunityButton();
	}
}

function trackEvent_saveImported() {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logImportedSaveFile();
		return playsaurusSdk.flushEvents();
	}
	return Promise.resolve();
}

function trackEvent_saveExported() {
	if (typeof (playsaurusSdk) != "undefined") {
		playsaurusSdk.logExportedSaveFile();
	}
}

//#################  ATTRIBUTION TRACKING  #################
function logInstall() {
	if (!platform.allowTracking) {
		return;
	}
	var url = "https://playsaurusstats.com/p.png?cmd=gameInstall&gameUid=" + UID + "&gameName=MrMine_" + platformName();

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (typeof (xhr.responseText) !== "undefined") {
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();
}

function logRevenue(cents, purchaseLabel = "") {
	if (!platform.allowTracking) {
		return;
	}

	var url = "https://playsaurusstats.com/p.png?cmd=gameRevenue&gameName=MrMine_" + platformName() + "&gameUid=" + UID + "&revenueCents=" + cents + "&language=" + actuallyUsedLanguage() + "&label1=" + depth + "&label2=" + totalPlayMinutes + "&label3=" + purchaseLabel;

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (typeof (xhr.responseText) !== "undefined") {
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();
}

function logInfluencer(influencer) {
	if (!platform.allowTracking) {
		return;
	}
	var url = "https://playsaurusstats.com/p.png?cmd=setInfluencerId&gameUid=" + UID + "&influencer=" + influencer;

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			if (typeof (xhr.responseText) !== "undefined") {
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();
}

function trackEvent_logSentiment(sentiment) {
	var key = "sentiment";
	var value = sentiment;
	trackGenericEvent(key, value);
}

// Automatically initialize tracking for platforms that allow it
if (platform.allowTracking) {
	initializeTrackers();
}

setFinishedTestValues();