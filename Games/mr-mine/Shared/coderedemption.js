// ############################################################
// ###################### CODE REDEMPTION #####################
// ############################################################
var redeemedCodes = [];
var maxCodeRetries = 3;

// All reward types supported by this game version (used for SDK v12+ compatibility)
var supportedRewardTypes = [
	"tickets",
	"money",
	"normal_chest",
	"golden_chest",
	"ethereal_chest",
	"timelapse_mins",
	"depth_kms",
	"building_materials",
	"oil",
	"miner_speed_potion_buff",
	"key_of_luck_buff",
	"midas_touch_buff",
	"elemental_pike_buff",
	"nugget_of_attraction_buff",
	"drill_speed_potion_buff",
	"raining_chests_buff",
	"cargo_expansion_buff",
	"endless_gem_speed_potion_buff",
	"relic_effectiveness_buff",
	"miner_speed_potion_buff_custom",
	"key_of_luck_buff_custom",
	"midas_touch_buff_custom",
	"elemental_pike_buff_custom",
	"nugget_of_attraction_buff_custom",
	"drill_speed_potion_buff_custom",
	"cargo_expansion_buff_custom",
	"endless_gem_speed_potion_buff_custom",
	"relic_effectiveness_buff_custom",
	"super_miner_souls",
	"super_miner",
	"weapon_scrap",
	"relic_scrap",
	"cheats"
];

function getIconImageForRewardType(type)
{
	// Maps reward type → assetLoader variable name (registered via assetLoader.loadAsset)
	var varMap = {
		"tickets":                      "smallShopTicketGold",
		"money":                        "moneyicon",
		"normal_chest":                 "basicchesticon",
		"golden_chest":                 "goldchesticon",
		"ethereal_chest":               "blackChestIconClosed",
		"timelapse_mins":               "caveIconTimelapse",
		"depth_kms":                    "basicChestIconClosed_xmas",
		"building_materials":           "buildingMaterialsIcon",
		"oil":                          "OIL_icon",
		"super_miner_souls":            "superMinerSoulHD",
		"super_miner":                  "blackChestIconClosed",
		"weapon_scrap":                 "weaponScrapHD",
		"relic_scrap":                  "relicScrapHD",
		"miner_speed_potion_buff":      "caveIconBuff",
		"key_of_luck_buff":             "caveIconBuff",
		"midas_touch_buff":             "caveIconBuff",
		"elemental_pike_buff":          "caveIconBuff",
		"nugget_of_attraction_buff":    "caveIconBuff",
		"drill_speed_potion_buff":      "caveIconBuff",
		"raining_chests_buff":          "caveIconBuff",
		"cargo_expansion_buff":         "caveIconBuff",
		"endless_gem_speed_potion_buff":"caveIconBuff",
		"relic_effectiveness_buff":     "caveIconBuff",
		"miner_speed_potion_buff_custom":      "caveIconBuff",
		"key_of_luck_buff_custom":             "caveIconBuff",
		"midas_touch_buff_custom":             "caveIconBuff",
		"elemental_pike_buff_custom":          "caveIconBuff",
		"nugget_of_attraction_buff_custom":    "caveIconBuff",
		"drill_speed_potion_buff_custom":      "caveIconBuff",
		"cargo_expansion_buff_custom":         "caveIconBuff",
		"endless_gem_speed_potion_buff_custom":"caveIconBuff",
		"relic_effectiveness_buff_custom":     "caveIconBuff"
	};
	var varName = varMap[type];
	return (varName && window[varName]) || window["basicChestIconClosed_xmas"];
}

function getRewardIconImage(rewardItems)
{
	if(rewardItems && rewardItems.length > 0)
	{
		var firstType = rewardItems[0].type;
		var allSameType = rewardItems.every(function(r) { return r.type === firstType; });
		if(allSameType)
		{
			return getIconImageForRewardType(firstType);
		}
	}
	return window["basicChestIconClosed_xmas"];
}

function showRedeemPrompt()
{
	showSimpleInput(_("Enter the code to redeem."), _("Redeem Code"), "", redeemCode, "Cancel");
	showRedeemCodeHint();
}

function showRedeemCodeHint()
{
	var hint = document.getElementById("redeemCodeHint");
	if(!hint) return;

	var tooltip = document.getElementById("redeemCodeHintTooltip");
	if(tooltip)
	{
		tooltip.textContent = _("You can get codes from our Discord announcements and from the Points Shop!");
	}

	hint.style.display = "";
	hint.classList.remove("active");

	// Hover shows the tooltip on PC (CSS); tap toggles it on touch devices
	hint.onclick = function ()
	{
		hint.classList.toggle("active");
	};
}

function redeemCode()
{
	var redeemCode = getSafeCode();
	if(redeemedCodes.indexOf(redeemCode) == -1)
	{
		redeemCouponThroughSdk(redeemCode);
	}
	else
	{
		alert(_("Code already redeemed"));
	}
}

function getSafeCode()
{
	var rawCode = document.getElementById("simpleInputFieldText").value;
	var redeemCode = replaceAll(rawCode, " ", "");
	return redeemCode;
}

//code ticket redemption
function redeemTicketOnServer(ticketId)
{
	var xmlhttp;
	if(window.XMLHttpRequest)
	{
		xmlhttp = new XMLHttpRequest();
	}
	else
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function ()
	{
		console.log(xmlhttp.responseText);
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			var result = JSON.parse(xmlhttp.responseText);
			console.log(result);
			var isSuccess = result.success.toString();
			if(isSuccess == "success")
			{
				var redeemCode = getSafeCode();
				var endQuantityIndex = redeemCode.length - 1;
				var rewardQuantity = parseInt(redeemCode.slice(11, endQuantityIndex));
				var rewardQuantityBigNumber = new BigNumber(redeemCode.slice(11, endQuantityIndex));
				var rewardType = redeemCode.slice(endQuantityIndex);

				if(rewardType == "T" && rewardQuantity > 0)
				{
					//tickets
					addTickets(rewardQuantity, "coupon_redemption");
					newNews(_("You gained {0} tickets", rewardQuantity), true);
				}
				else if(rewardType == "M" && rewardQuantity > 0)
				{
					//money
					addMoney(rewardQuantityBigNumber);
					newNews(_("You gained money ${0}", rewardQuantity), true);
				}
				else if(rewardType == "C")
				{
					//normal chest
					openBasicChest();
				}
				else if(rewardType == "G")
				{
					//golden chest
					openGoldChest();
				}
				else if(rewardType == "E")
				{
					//Ethereal chest
					openEtherealChest();
				}
				else if(rewardType == "L" && rewardQuantity > 0)
				{
					//timelapse minutes
					timelapse(rewardQuantity);
					newNews(_("You gained timelapse {0}mins", parseFloat((rewardQuantity * STAT.timelapseDurationMultiplier()).toFixed(2))), true);
				}
				else if(rewardType == "D" && rewardQuantity > 0)
				{
					addDepth(rewardQuantity);
					newNews(_("You gained {0}km depth", rewardQuantity), true);
				}
				else if(rewardType == "S" && rewardQuantity > 0)
				{
					worldResources[BUILDING_MATERIALS_INDEX] += rewardQuantity;
					newNews(_("You gained {0} x Building Materials", rewardQuantity), true);
				}
				else if(rewardType == "A" && rewardQuantity > 0)
				{
					worldResources[BUILDING_MATERIALS_INDEX] += rewardQuantity;
					newNews(_("You gained {0} x Building Materials", rewardQuantity), true);
				}
				else if(rewardType == "O" && rewardQuantity > 0)
				{
					//oil
					worldResources[OIL_INDEX].numOwned += rewardQuantity;
					newNews(_("You gained {0} oil", rewardQuantity), true);
				}
				else if(rewardType == "B" && rewardQuantity > 0)
				{
					//standard buff
					if(rewardQuantity != 6)
					{
						buffs.startBuff(rewardQuantity, 600, "code");
					}
					else
					{
						buffs.startBuff(rewardQuantity, 30, "code");
					}
					newNews(_("You gained a buff!"), true);
				}
				else if(rewardType == "X")
				{
					CHEATS_ENABLED = !CHEATS_ENABLED;
					newNews("Cheats enabled: " + CHEATS_ENABLED);
					hideSimpleInput();
					return;
				}
				if(redeemedCodes.length == 0)
				{
					logInfluencer(redeemCode);
				}
				redeemedCodes.push(redeemCode);
				document.getElementById("simpleInputFieldText").value = "";
				trackEvent_redeemCode();
				hideSimpleInput();
			}
			else
			{
				alert(_("Error code doesn't exist or is invalid"));
			}
		}
	}

	xmlhttp.open("POST", CODE_REDEMPTION_ENDPOINT, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("r=" + ticketId);
}

function redeemCouponThroughSdk(code, suppressErrors = false, retryAttempt = 0)
{
	Playsaurus.coupons.redeem({
		code: code,
		supportedRewardTypes: supportedRewardTypes
	})
		.then(coupon => onCouponSuccess(coupon))
		.catch(error => onCouponError(error, suppressErrors, code, retryAttempt));
}

// Coupons carry a single int: the buff duration in seconds. The strength is fixed
// on our side, matching what the other free sources of each buff grant (chests,
// trades and super miners all use 50; the Buff Lab uses 20 for the gem speed
// potion, whose stat is capped at 75% anyway).
var couponBuffStrengths = {
	0: 50,  // Miner Speed Potion
	1: 50,  // Key of Luck
	2: 50,  // Midas Touch
	3: 50,  // Elemental Pike
	4: 50,  // Nugget of Attraction
	5: 50,  // Drill Speed Potion
	6: 0,   // Raining Chests - has no stat, its effect comes from its updateFunction
	7: 50,  // Cargo Expansion
	8: 20,  // Endless Gem Speed Potion
	9: 50   // Relic Effectiveness
};

// Raining Chests spawns a chest every tick and despawns them all when it ends, so
// every other source in the game grants it as a short burst instead of by duration.
var RAINING_CHESTS_BUFF_DURATION_SECONDS = 30;

function grantCouponBuff(buffId, value)
{
	var durationSeconds = (buffId == 6) ? RAINING_CHESTS_BUFF_DURATION_SECONDS : parseInt(value);
	buffs.startBuff(buffId, durationSeconds, "code", couponBuffStrengths[buffId]);
	return _("You gained a buff!");
}

// Fallback duration for a custom buff coupon whose value could not be read. The
// coupon is already used up by the time we get here, so we grant the standard
// buff rather than leaving the player with nothing.
var DEFAULT_COUPON_BUFF_DURATION_SECONDS = 600;

// The _custom buff coupons carry a JSON object instead of a plain int:
// {"duration": 600, "strength": 75}. Nexus only allows an object as the JSON
// root, so that is the shape coupons are authored in; a [duration, strength]
// array is read as well in case one ever arrives that way. The plain reward
// types above keep taking a bare int, since older clients do not know the
// _custom types (the SDK rejects those coupons for them without using them up).
// Raining Chests has no custom variant: its strength is fixed because the buff
// has no stat behind it.
function parseCustomBuffValue(buffId, value)
{
	var duration = null;
	var strength = null;

	try
	{
		var parsed = (typeof value === "string") ? JSON.parse(value) : value;
		if(Array.isArray(parsed))
		{
			duration = parsed[0];
			strength = parsed[1];
		}
		else if(parsed && typeof parsed === "object")
		{
			duration = parsed.duration;
			strength = parsed.strength;
		}
	}
	catch(e)
	{
		console.error('Could not parse custom buff coupon value:', value, e);
	}

	duration = parseInt(duration);
	strength = parseInt(strength);

	if(isNaN(duration) || duration <= 0)
	{
		// Tolerate a bare int being sent to a _custom reward type.
		duration = parseInt(value);
	}
	if(isNaN(duration) || duration <= 0)
	{
		duration = DEFAULT_COUPON_BUFF_DURATION_SECONDS;
	}
	if(isNaN(strength) || strength < 0)
	{
		strength = couponBuffStrengths[buffId];
	}

	return {duration: duration, strength: strength};
}

// The strength doubles as the tier so that buffs of different strengths do not
// merge into each other: startBuff only extends the duration of a matching buff
// and keeps the strength it already had, which would silently drop the custom
// value whenever the player already had this buff running from another coupon.
function grantCustomCouponBuff(buffId, value)
{
	var reward = parseCustomBuffValue(buffId, value);
	buffs.startBuff(buffId, reward.duration, "code", reward.strength, reward.strength);
	return _("You gained a buff!");
}

function grantRewardByType(type, value)
{
	var rewardValue;
	switch(type)
	{
		case "tickets":
			rewardValue = parseInt(value);
			addTickets(rewardValue, "coupon");
			return _("You gained {0} tickets", rewardValue);
		case "money":
			rewardValue = new BigNumber(value);
			addMoney(rewardValue);
			return _("You gained money ${0}", rewardValue);
		case "normal_chest":
			rewardValue = parseInt(value);
			rewardedChestStorage.storeChests(0, rewardValue);
			return _("You gained {0} x Basic Chest", rewardValue);
		case "golden_chest":
			rewardValue = parseInt(value);
			rewardedChestStorage.storeChests(1, rewardValue);
			return _("You gained {0} x Gold Chest", rewardValue);
		case "ethereal_chest":
			rewardValue = parseInt(value);
			rewardedChestStorage.storeChests(2, rewardValue);
			return _("You gained {0} x Ethereal Chest", rewardValue);
		case "timelapse_mins":
			rewardValue = parseInt(value);
			timelapse(rewardValue);
			return _("You gained timelapse {0}mins", parseFloat((rewardValue * STAT.timelapseDurationMultiplier()).toFixed(2)));
		case "depth_kms":
			rewardValue = parseInt(value);
			addDepth(rewardValue);
			defeatBossesUpToDepth(depth);
			return _("You gained {0}km depth", rewardValue);
		case "building_materials":
			rewardValue = parseInt(value);
			worldResources[BUILDING_MATERIALS_INDEX].numOwned += rewardValue;
			return _("You gained {0} x Building Materials", rewardValue);
		case "oil":
			rewardValue = parseFloat(value);
			worldResources[OIL_INDEX].numOwned += rewardValue;
			return _("You gained {0} oil", rewardValue);
		case "miner_speed_potion_buff":
			return grantCouponBuff(0, value);
		case "miner_speed_potion_buff_custom":
			return grantCustomCouponBuff(0, value);
		case "key_of_luck_buff":
			return grantCouponBuff(1, value);
		case "key_of_luck_buff_custom":
			return grantCustomCouponBuff(1, value);
		case "midas_touch_buff":
			return grantCouponBuff(2, value);
		case "midas_touch_buff_custom":
			return grantCustomCouponBuff(2, value);
		case "elemental_pike_buff":
			return grantCouponBuff(3, value);
		case "elemental_pike_buff_custom":
			return grantCustomCouponBuff(3, value);
		case "nugget_of_attraction_buff":
			return grantCouponBuff(4, value);
		case "nugget_of_attraction_buff_custom":
			return grantCustomCouponBuff(4, value);
		case "drill_speed_potion_buff":
			return grantCouponBuff(5, value);
		case "drill_speed_potion_buff_custom":
			return grantCustomCouponBuff(5, value);
		case "raining_chests_buff":
			return grantCouponBuff(6, value);
		case "cargo_expansion_buff":
			return grantCouponBuff(7, value);
		case "cargo_expansion_buff_custom":
			return grantCustomCouponBuff(7, value);
		case "endless_gem_speed_potion_buff":
			return grantCouponBuff(8, value);
		case "endless_gem_speed_potion_buff_custom":
			return grantCustomCouponBuff(8, value);
		case "relic_effectiveness_buff":
			return grantCouponBuff(9, value);
		case "relic_effectiveness_buff_custom":
			return grantCustomCouponBuff(9, value);
		case "super_miner_souls":
			rewardValue = parseInt(value);
			worldResources[SUPER_MINER_SOULS_INDEX].numOwned += rewardValue;
			return _("You gained {0} Super Miner Souls", rewardValue);
		case "super_miner":
			var baseMiner = superMinerManager.getSuperMinerBySlug(value);
			if(!baseMiner)
			{
				console.error('Unknown super miner slug:', value);
				return "";
			}
			superMinerManager.pendingSuperMiner = baseMiner.id;
			openUi(SuperMinerBlackWindow, null, baseMiner);
			return _("You received {0}!", baseMiner.name);
		case "weapon_scrap":
			rewardValue = parseInt(value);
			addWeaponScrap(rewardValue);
			return _("You gained {0} Weapon Scrap", rewardValue);
		case "relic_scrap":
			rewardValue = parseInt(value);
			addRelicScrap(rewardValue);
			return _("You gained {0} Relic Scrap", rewardValue);
		case "cheats":
			return "";
		default:
			console.error('Unknown reward type:', type);
			return "";
	}
}

function onCouponSuccess(coupon)
{
	trackEvent_redeemCode(coupon.code);
	var rewardMessage = grantRewardByType(coupon.reward.type, coupon.reward.value);
	if(rewardMessage.length > 0)
	{
		showCouponMessage(coupon.message, rewardMessage);
	}

	redeemedCodes.push(coupon.code);
}

function showCouponMessage(couponMessage, rewardMessage)
{
	const message = couponMessage
		? `${couponMessage}\n\n${rewardMessage}`
		: rewardMessage;

	window.alert(message);
}

function onCouponError(error, suppressErrors = false, code = "", retryAttempt = 0)
{
	if(maxCodeRetries > retryAttempt &&
		(error instanceof Playsaurus.PlaysaurusTooManyRequestsError ||
			error instanceof Playsaurus.PlaysaurusNetworkError ||
			error instanceof Playsaurus.PlaysaurusMaintenanceError))
	{
		var timeBetweenAttempts = 60000;
		window.setTimeout(
			() => redeemCouponThroughSdk(code, true, ++retryAttempt),
			timeBetweenAttempts
		)
	}
	if(suppressErrors)
	{
		return;
	}
	if(error instanceof Playsaurus.PlaysaurusRewardIncompatibleError)
	{ // Reward type not supported by this game version (coupon NOT consumed)
		window.alert(error.localizedDisplayMessage || _("This coupon contains a reward for a newer game feature. Please update the game and try again."));
	} else if(error instanceof Playsaurus.PlaysaurusClientOutdatedError)
	{ // Game version too old to redeem coupons
		window.alert(error.localizedDisplayMessage || _("Your game version is too old to redeem coupons. Please update the game and try again."));
	} else if(error instanceof Playsaurus.CouponRedeemError)
	{ // Redemption logic error
		window.alert(error.localizedDisplayMessage);
	} else if(error instanceof Playsaurus.PlaysaurusNetworkError)
	{ // Network error
		console.error('Network error redeeming coupon:', error);

		window.alert({
			503: 'Sorry, our servers are currently down for maintenance. Please try again in a few seconds.',
			429: 'You are trying to redeem coupons too fast. Please wait a minute and try again.',
			500: 'Oops! Something went wrong on our side. Please try again later. If the problem persists, please contact support.'
		}[error.status] || 'An error occurred while redeeming the coupon. Please try again later.');

	} else
	{ // Other unknown JavaScript error
		console.error('Error redeeming coupon:', error);
		window.alert('An error occurred while redeeming the coupon. Please try again later.');
	}
}