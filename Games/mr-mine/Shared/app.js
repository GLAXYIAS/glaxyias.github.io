buildTarget = WEB_BUILD;
 //MrMine.com  Copyright Playsaurus - 2013-2024 All Rights Reserved

// ####################################################################
// ######################### GLOBAL VARIABLES #########################
// ####################################################################

var CHEATS_ENABLED = false;

var version = 147;
var patchLetter = "K";
var mobileVersion = 10;
var buildLetter = patchLetter + (isDev() ? "." + revisionNumber : "");
var savedPatchLetter = patchLetter;
var savedMobileVersion = mobileVersion;
var latestTestNumber = 9;
var UID = platform.getUserId();
var money = new BigNumber(0);
var totalMoneyEarnedSession = new BigNumber(0);
var tickets = 0;
var oldversion = version;
var earliestVersion = version;
var firstTimePlayed = Math.floor(new Date().getTime() / 1000);
var specialUpgrades = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var quality = 1;
var hasFoundGolem = 0;
var hasFoundGidget = 0;
var hasFoundUfo = 0;
var playtime = 0;
var sessionstarttime = Math.round(new Date().getTime() / 1000);
var servertime = Math.round(new Date().getTime() / 1000);
var savetime = Math.round(new Date().getTime() / 1000);
var numGameLaunches = 1;
var centsSpent = 0;
var lastLocationIsEarth = [true, true, true, true]; //Sell, Hire, Drill, Quests
var isDevUser = isDev();
var activePlayTimeMinutes = 0;
var activePlayTimeMinutesInSession = 0;
var timelapseMinutesInSession = 0;
var totalPlayMinutes = 0;
var hasImported = (localStorage.getItem("importedList") !== null);
var hasTakenSurvey = false;
function hasTakenSurveyCheck() {return hasTakenSurvey || localStorage["hasTakenSurvey"] == true || localStorage["hasTakenSurvey"] == "true";}
var testNumber = 0;
var sessionId = Math.round(new Date().getTime() / 1000) + "_" + Math.round(Number.MAX_SAFE_INTEGER * Math.random());
var lastPlatform = platformName();
var previousPlatform = platformName();
var timelapsePerSession = {
    logs: [], //stores last 10 sessions of timelapse minutes
    createdSessionInstance: false,
    addTimelapseMinutesToSession: function (minutes)
    {
        let session = this.logs[this.logs.length - 1];
        if(!session || !this.createdSessionInstance)
        {
            session = [0, minutes];
            this.logs.push(session);
            this.createdSessionInstance = true;

            if(this.logs.length > 10)
            {
                this.logs.shift();
            }
        }
        else
        {
            session[1] += minutes;
        }
    },
    averageTimeLapsePerMinute: function ()
    {
        let totalMinutes = 0;
        let sessionDurationsMins = 0;
        for(let i = 0; i < this.logs.length; i++)
        {
            sessionDurationsMins += this.logs[i][0] / 60;
            totalMinutes += this.logs[i][1];
        }
        return totalMinutes / sessionDurationsMins;
    },
    get saveString()
    {
        let session = this.logs[this.logs.length - 1];
        if(session)
        {
            session[0] = performance.now() / 1000;
        }

        return JSON.stringify(this.logs);
    },
    set saveString(value)
    {
        this.logs = JSON.parse(value);
    }
};



var checks = [1, 1, 0, 0, 0, 0, 0];
var drillPurchasePage = 0;
var numFramesRendered = 0;
var framesRendered2 = 0;
var currentlyViewedDepth = 0;
var partialDepthOffset = 0;
var afk = 15;
var lgame = 0;
var isWindowInFocus = 1;
var isTimelapseOn = false;
var totalTimeLapsedMinutes = 0;
var paypalhtml;
var editmode = 0;
var relicEditMode = 0;
var customMinerDatabaseIndex = -1;
var musicFadeInVolume = 0;
var paidForMinerName;
var hasOpenedPurchaseWindow = false;
var lastFlashQuestionPromptClickTime = 0;

if(window.TrackJS)
{
    TrackJS.addMetadata("userId", UID);
    TrackJS.addMetadata("version", version + "_" + buildLetter + revisionNumber);
    TrackJS.addMetadata("isDev", isDevUser);
    TrackJS.addMetadata("platform", platformName());
}

async function localizePurchasePackPrices()
{
    var basePrices = [];
    for(var i = 1; i < purchasePacks.length; ++i)
    {
        basePrices.push((purchasePacks[i].basePriceCents / 100).toFixed(2));
    }
    var localizedPrices = await playsaurusSdk.localizePrices(basePrices);
    for(var i = 1; i < purchasePacks.length; ++i)
    {
        purchasePacks[i].setLocalizedPrice(localizedPrices[i - 1]);
    }

    if(platform.registerProducts)
    {
        platform.registerProducts();
    }
}

var updatePerPoint1Second = new EventHook();
var updatePerSecond = new EventHook();
var updatePer30Seconds = new EventHook();
var updatePerMinute = new EventHook();
var updatePer5Minutes = new EventHook();

/*
Can accept 1/60th increments to timelapse in seconds
*/
function timelapse(timeMinutes, useMultiplier = true)
{
    if(useMultiplier && !isOfflineProgressActive)
    {
        timeMinutes *= STAT.timelapseDurationMultiplier();
    }

    var tempWindowInFocus = isWindowInFocus;
    isWindowInFocus = 0;
    isTimelapseOn = true;
    for(var i = Math.floor(timeMinutes * 60), time = i; i > 0; i--)
    {
        if(!isSimulating)
        {
            dig(1);
            superMinerManager.update(1);
            chestCompressor.update(1);
            GemForger.update(1);
            oilLogic(1);
            progressScientistExcavations(1);
        }
        else if(i == time)
        {
            dig(time);
            superMinerManager.update(time);
            chestCompressor.update(time);
            GemForger.update(time);
            oilLogic(1);
            progressScientistExcavations(time);
        }

        buffs.update();
        reactor.update();

        /*Run optimized mining every 60 seconds
        run on the 30th second to get a closer estimate*/
        if(i % 60 == 30)
        {
            runOptimizedMiningForOneMinute();
        }
    }
    handleTradeTimelapse(timeMinutes);
    isTimelapseOn = false;
    isWindowInFocus = tempWindowInFocus;

    if(!isOfflineProgressActive && (!isSimulating || useMultiplier))
    {
        //Track total time lapsed
        totalTimeLapsedMinutes += timeMinutes;
        timelapseMinutesInSession += timeMinutes;
        timelapsePerSession.addTimelapseMinutesToSession(timeMinutes);
    }
}

// ##############################################################
// ######################### MAIN LOOPS #########################
// ##############################################################

// ################### START UP ###################
var isGameLoaded = false;
if(platform.frameRefreshForSteamOverlay)
{
    platform.frameRefreshForSteamOverlay(); //setup animation for steam overlay
}
window.onload = function ()
{
    console.log("loaded");
    checkUserCanSave();
    if(platform.setWindowSize)
    {
        platform.setWindowSize();
    }
    setVolume();
    setupButtons();
    updateBackup();
    downloadBackup();
    console.log("Version: " + ((version / 100) - 1).toFixed(2) + " build " + buildLetter);
    isGameLoaded = true;
    if(CHEATS_ENABLED && localStorage['debug_loadTinyAssets'] == 'true')
    {
        localStorage['debug_loadTinyAssets'] = false;
    }
    if(isSteam())
    {
        document.getElementById("steamCloudBackup").style.visibility = "visible";
    }
    else if(isWeb())
    {
        document.getElementById("steamCloudBackup").style.visibility = "visible";
        document.getElementById('steamCloudBackup').onclick = null;
        document.getElementById('steamCloudBackup').onmouseover = function () {showTooltipForDiv(_("Cloud backups are only available on the Steam version"), "", "steamCloudBackup");}
    }
    // Reactor component icons need to be created after all images have been loaded
    generateReactorComponents();
    if(languageOverride == "" && RSc == 0)
    {
        var languageName = "undefined";
        var languageNameInEnglish = platform.getSystemLanguage();
        var languageStringElement = document.querySelector("[data-language='" + languageNameInEnglish + "']");
        if(languageStringElement)
        {
            languageName = languageStringElement.innerHTML;
        }
        var confirmationMessage = _("Starting with language set to {0}", languageName);
        if(languageName != "English")
        {
            languageNameInEnglish = languageNameInEnglish[0].toUpperCase() + languageNameInEnglish.slice(1);
            confirmationMessage += " \n (Starting with language set to " + languageNameInEnglish + ")";
        }
    }
    setTimeout(handleWindowResizeEvent, 1000);
    setTimeout(setGameToReady, 1050);
};
window.onbeforeunload = function ()
{
    trackEvent_exitedGame();
};

var isGameReady = false;

function setGameToReady()
{
    isGameReady = true;
    hideDiv("loadingOverlay");
    if(isSteam())
    {
        platform.registerCallbacks();
    }
    if(isMobile())
    {
        showMobileMainMenu();
    }
    else if(RSc == 0)
    {
        setTimeout(openNewGamePrompt, 50);
    }
    if(typeof (cordova) !== "undefined" && navigator.splashscreen)
    {
        navigator.splashscreen.hide();
    }

    if(parseInt(localStorage["numSims"]) > 0)
    {
        console.log("sims remaining:" + localStorage["numSims"]);
        setTimeout(() => {runDepthSim(parseInt(localStorage["simDepth"]), parseInt(localStorage["numSims"]))}, 2000)
    }

    if(isDevUser) runTestLogic();

}

function runTestLogic()
{
    //### Add test logic here ###

    //if(!isMobile()) loadGame(0);
    //activeLayers.MainUILayer.header.onmousedown()
    //panToViewDepth(527);
    //openUi(SuperMinersWindow);
    //spawnTestCaves();
    // activeLayers.gemforge.currentTabIndex = 0;
    // activeLayers.gemforge.onTabChange();
    //showHitboxDebug(-1,false)
    //battleManager.spawnBattleOnFloor(527, 5);
    //battleManager.preparebattle(false);

    //chestService.grantChest(100, Chest.purchased, ChestType.black);

    //### Pause Drill ###
    //battleManager._originalStall = battleManager.isStalledDueToBoss; battleManager.isStalledDueToBoss = () => true;
}

function getBuildTarget()
{
    if(typeof (buildTarget) !== "undefined")
    {
        return buildTarget;
    }
    else
    {
        return STEAM_BUILD;
    }
}

function isDesktop()
{
    return isSteam() || isWeb();
}

function isWeb()
{
    return getBuildTarget() == WEB_BUILD;
}

function isSteam()
{
    return getBuildTarget() == STEAM_BUILD;
}

function isMobile()
{
    if(typeof isMobile.cachedValue === 'undefined')
    {
        isMobile.cachedValue = getBuildTarget() == MOBILE_BUILD;
    }
    return isMobile.cachedValue;
}

function platformName()
{
    if(isWeb())
    {
        return "web";
    }
    else if(isSteam())
    {
        return "steam";
    }
    else if(isMobile())
    {
        if(platform.isIOs())
        {
            return "ios";
        }
        return "android";
    }
    else
    {
        return "unknown";
    }
}


// ################# EVERY 1 SECOND #################
setInterval(function ()
{
    if(typeof chosen !== "undefined" && isSaveFileLoaded() && (!isMobile() || (typeof (platform.pauseTime) !== "undefined" && platform.pauseTime < 0)))
    {
        playtime += 1;
        dig(1);
        getUsedMineralCapacity();
        oilLogic(1);
        superMinerManager.update(1);
        chestCompressor.update(1);
        buffs.update();
        updateUserExperience();
        checkForNewTrade();
        checkForCompletedExcavations();
        GemForger.update(1);
        updateQuotes(1);
        reactor.update();
        updatePerSecond.fire();
        secondsSinceOrangeFishSpawn++;
        questManager.update();
        if(isMobile()) notificationManager.update();
    }
    servertime++;
    savetime++;
    if(!isWindowInFocus && typeof chosen !== "undefined" && isSaveFileLoaded())
    {
        document.title = _("Capacity") + ": " + Math.floor(capacity * 100 / maxHoldingCapacity()) + "%";
    }
    if(musicFadeInVolume < 0.08 && typeof chosen !== "undefined" && isSaveFileLoaded() && mute == 0)
    {
        musicFadeInVolume += 0.01
        if(platform.setVolume)
        {
            platform.setVolume(musicFadeInVolume);
        }
        else if(platform.music)
        {
            platform.music.volume = Math.min(1, platform.music.volume + musicFadeInVolume);
        }
    }

    if(typeof chosen !== "undefined" && isSaveFileLoaded() && !hasTakenSurveyCheck() && (localStorage["isSurveyPending"] == "true" || localStorage["isSurveyPending"] == true) && performance.now() > 4000)
    {
        hasTakenSurvey = true;
        localStorage["hasTakenSurvey"] = true;
        localStorage["isSurveyPending"] = false;
        var firstSurveyTicketReward = 5 * surveyRewardMultiplier();
        addTickets(firstSurveyTicketReward, "survey");

        if(typeof localStorage["q1"] != "undefined")
        {
            var sentimentOutOf100 = (parseInt(localStorage["q1"]) - 1) * 25;
            trackEvent_logSentiment(sentimentOutOf100);
        }

        if(typeof localStorage["q9"] != "undefined")
        {
            var confusionOutOf100 = (parseInt(localStorage["q9"]) - 1) * 25;
            trackEvent_logConfusionLevel(confusionOutOf100);
        }

        alert(_("You gained {0} tickets", firstSurveyTicketReward));
        newNews(_("You gained {0} tickets", firstSurveyTicketReward), true);
        savegame("survey_completed");
    }

    if(typeof chosen !== "undefined" && isSaveFileLoaded() && hasTakenSurveyCheck() && (localStorage["isServerSurveyPending"] == "true" || localStorage["isServerSurveyPending"] == true) && performance.now() > 4000)
    {
        localStorage["isServerSurveyPending"] = false;
        var rewardTicketAmount = parseInt(localStorage["serverSurveyRewardAmount"]);
        if(!isNaN(rewardTicketAmount))
        {
            addTickets(rewardTicketAmount, "survey");

            alert(_("You gained {0} tickets", rewardTicketAmount));
            newNews(_("You gained {0} tickets", rewardTicketAmount), true);
            savegame("survey_completed");
        }
        localStorage["serverSurveyRewardAmount"] = 0;
    }

    if(typeof (offerManager) !== "undefined" && chosen >= 0)
    {
        offerManager.update();
    }

}, 1000);

// ############### EVERY 30 SECONDS ###############
setInterval(function ()
{
    if(isSaveFileLoaded() && (!isMobile() || (typeof (platform.pauseTime) !== "undefined" && platform.pauseTime < 0)))
    {
        savegame("30s_autosave");
        afk--;

        chestService.spawnRandomChests();
        spawnWorldClickables();
        battleManager.battlerand();
        updatePer30Seconds.fire();

        if(isSteam())
        {
            updateDiscordRichPresence();
        }
    }

}, 30000);

// ############### EVERY 60 SECONDS ###############

var mouseMoved = false;
setInterval(function ()
{
    if(isSaveFileLoaded() && (!isMobile() || (typeof (platform.pauseTime) !== "undefined" && platform.pauseTime < 0)))
    {
        pinnedBlueprintsManager.update();
        logValuationStats();
        updatePerMinute.fire();
        if(mouseMoved)
        {
            activePlayTimeMinutesInSession += 1;
            activePlayTimeMinutes += 1;
            mouseMoved = false;
        }
        totalPlayMinutes += 1;
    }
}, 60000);

// ############### EVERY 5 MINUTES ###############
setInterval(function ()
{
    if(isSaveFileLoaded() && (!isMobile() || (typeof (platform.pauseTime) !== "undefined" && platform.pauseTime < 0)))
    {
        //Steam Cloud Backup
        backupSavesToCloud();
        // Playsaurus Accounts Cloud Save
        if(typeof cloudSaveManager !== 'undefined' && cloudSaveManager.isEnabled)
        {
            cloudSaveManager.queueUpload(sids[chosen]);
        }
        updatePer5Minutes.fire();
    }
    if(isSaveFileLoaded() && !isMobile())
    {
        loadAmountOfFlashQuestions();
    }
    if(typeof (playsaurusSdk) != "undefined")
    {
        playsaurusSdk.fetchAnnouncementsIfDue();
    }


}, 300000);

// EVERY 6 HOURS
setInterval(function ()
{
    main.width = main.offsetWidth;
    main.height = main.offsetHeight;
    mainw = main.width;
    mainh = main.height;
}, 21600000);

function requiresUpdate(frequencyMsec, dtMsec)
{
    return (dtMsec >= frequencyMsec || ((currentTime() % frequencyMsec) < dtMsec));
}

// ################# EVERY 17MSEC #################
var previousTime = 0;
var expectedNextRepaintTime = 0;
var animationInterval = 1000 / IDLE_FRAMERATE;
var miningInterval = 100;
setInterval(function ()
{
    var timeElapsed = currentTime() - previousTime;
    previousTime = currentTime();

    if(typeof activeLayers != 'undefined')
    {
        updateUi(animationInterval);
    }

    if(typeof activeLayers != 'undefined' && typeof activeLayers.Stage !== 'undefined')
    {
        if(activeLayers.Stage.isRendered && activeLayers.Stage.hitboxes.length > 0)
        {
            activeLayers.Stage.render();
        }

        // The mouse delta buffer is only written to on mouse move, so stopping
        // movement doesn't naturally write zeroes to the buffer, meaning momentum
        // can remain high without movement. We write zeroes to it every frame to
        // compensate.
        // AO: May want to check actual DT and loop over this the amt of times necessary to handle lag spikes.
        writeToMouseDeltaBuffer(0, 0);
    }

    if(requiresUpdate(34, timeElapsed))
    {
        if(typeof activeLayers != 'undefined' && typeof activeLayers.Particles !== 'undefined')
        {
            if(activeLayers.Particles.isRendered)
            {
                activeLayers.Particles.render();
            }
        }
    }

    if(requiresUpdate(animationInterval, timeElapsed))
    {
        if(isGameLoaded && (isSimulating || !isTimelapseOn) && !isOfflineProgressActive)
        {
            numFramesRendered++;
            animate();
            expectedNextRepaintTime = currentTime() + animationInterval;
            updateUpdatingTooltip();
        }
        else if(!isGameLoaded)
        {
            document.getElementById("LoadingText").innerHTML = _("Loading...");
            document.getElementById("LoadingPercent").innerHTML = Math.floor(getPageLoadPercent() * 100) + "%";
            document.getElementById("LoadingBar").style.width = Math.floor(getPageLoadPercent() * 100) + "%";
        }
    }
}, 17);

function expectedTimeUntilNextRepaintMsec()
{
    return currentTime() - expectedNextRepaintTime;
}

// ############### EVERY .1 SECONDS ###############
runDtMiningAndCaveLogic();
var lastUpdateTime = currentTime();
var residualTime = 0;
var numMinings = 0;

function runDtMiningAndCaveLogic()
{
    if(isGameLoaded &&
        (!isSimulating || !isTimelapseOn) &&
        !isOfflineProgressActive &&
        (!isMobile() || (typeof (platform.pauseTime) !== "undefined" && platform.pauseTime < 0))
    )
    {
        var deltaTime = currentTime() - lastUpdateTime;
        lastUpdateTime = currentTime();
        var timeToProcess = deltaTime + residualTime;

        //We want to allow it to run a little fast or slow: +/- interval/2
        //Otherwise we could end up thrashing processing two frames one frame and only one the next
        while(timeToProcess >= (miningInterval * .5))
        {
            mine();
            caveUpdate(CAVE_UPDATE_DELTA_TIME_SECONDS);
            timeToProcess -= miningInterval;
            numMinings++;
        }
        residualTime = timeToProcess;
    }

    setTimeout(runDtMiningAndCaveLogic, miningInterval - residualTime);
}
//##########################################################

var numFlashQuestions = 0;
var hasVisitedFlashQuestionSurveyDuringCurrentSession = false;
var millisecondsBetweenQuestionQueryTime = 1000 * 60 * 60 * 4; //4hrs
var lastFlashQuestionQueryTime = 0; //always work on startup
function loadAmountOfFlashQuestions()
{
    if((currentTime() - lastFlashQuestionQueryTime) >= millisecondsBetweenQuestionQueryTime && !hasVisitedFlashQuestionSurveyDuringCurrentSession && isWindowInFocus == 1 && numFlashQuestions == 0 && (lastFlashQuestionPromptClickTime < currentTime() - (1000 * 60 * 60 * 24)))
    {
        lastFlashQuestionQueryTime = currentTime();

        var url = "https://playsaurusstats.com/SurveyFlashQuestionManager.php?cmd=getSurveyHTMLForUnansweredLiveQuestions&gameName=MrMine&gameUid=" + UID;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function ()
        {
            if(xhr.readyState == 4)
            {
                if(typeof (xhr.responseText) !== "undefined")
                {
                    numFlashQuestions = parseInt(xhr.responseText.split('appendQuestion').length - 1);
                }
            }
        }
        xhr.send();
    }
}

function isFlashQuestionSurveyPromptVisible()
{
    return hasTakenSurveyCheck() && numFlashQuestions > 0 && !hasVisitedFlashQuestionSurveyDuringCurrentSession && lastFlashQuestionPromptClickTime < currentTime() - (1000 * 60 * 60 * 24) && localStorage["isServerSurveyPending"] != "true" && localStorage["isServerSurveyPending"] != true;
}

function openFlashQuestionPrompt()
{
    if(isFlashQuestionSurveyPromptVisible())
    {
        var surveyDiv = document.createElement('div');
        surveyDiv.id = "surveyDiv";
        surveyDiv.style.cssText = 'position:absolute;left:10%;top:10%;width:80%;height:80%;z-index:100;background:#000;border: 1px solid black;';
        surveyDiv.innerHTML = '<iframe src="./Shared/ServerSurvey.html?UID=' + UID + '&version=' + version + '&depth=' + depth + '&reward=' + numFlashQuestions + '" frameBorder="0" style="width: 100%; height: 100%; boder:0;"></iframe>';

        var surveyExitButton = document.createElement("div");
        surveyExitButton.id = "surveyExitButton";
        surveyExitButton.style.position = "absolute";
        surveyExitButton.style.top = "0px";
        surveyExitButton.style.right = "0px";
        surveyExitButton.style.width = "25px";
        surveyExitButton.style.height = "25px";
        surveyExitButton.style.zIndex = 4;
        surveyExitButton.style.background = "url('Shared/Assets/UI/closei.png') no-repeat center";
        surveyExitButton.style.backgroundSize = "contain";
        surveyExitButton.style.color = "white";
        surveyExitButton.style.display = "block";
        surveyExitButton.style.padding = "0px";
        surveyExitButton.style.cursor = "pointer";
        surveyExitButton.onclick = function () {document.getElementById("surveyDiv").visibility = "hidden"; document.body.removeChild(document.getElementById("surveyDiv"));};
        surveyDiv.appendChild(surveyExitButton);

        document.body.appendChild(surveyDiv);

        lastFlashQuestionPromptClickTime = currentTime();
        hasVisitedFlashQuestionSurveyDuringCurrentSession = true;
    }
}


// ##########################################################
// #################### ERROR HANDLING ######################
// ##########################################################

var consoleLog = [];

function patchConsole()
{
    if(typeof (console) !== "undefined")
    {
        function _patchLog(logName, nativeLogFunction)
        {
            window.console[logName] = function (...args)
            {
                consoleLog.push(args.join(", "));
                if(consoleLog.length > 100)
                {
                    consoleLog.shift();
                }
                return nativeLogFunction(...args);
            }
        }

        _patchLog("log", console.log);
        _patchLog("info", console.info);
        _patchLog("warn", console.warn);
        _patchLog("error", console.error);
        _patchLog("debug", console.debug);
    }
}
patchConsole();

function patchDrawImage()
{
    var nativeDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args)
    {
        try
        {
            nativeDrawImage.call(this, ...args);
        }
        catch(e)
        {
            console.error(e);
            if(args.length == 5)
            {
                args = args.slice(1);
            }
            else if(args.length == 9)
            {
                args = args.slice(5);
            }
            else
            {
                // Not enough parameters to safely draw placeholder
                return;
            }
            this.save();
            this.fillStyle = "#666666";
            this.globalAlpha = 0.5;
            this.fillRect(...args);
            this.restore();
        }
    }
}
patchDrawImage();

var throttle = 0;

function addMoney(amt)
{
    if(Number.isNaN(amt))
    {
        // var caller = (addMoney.caller == null) ? "top" : addMoney.caller.name;
        // console.log("Add money as nan: " + caller);
        return;
    }
    if(typeof amt == "number")
    {
        // var caller = (addMoney.caller == null) ? "top" : addMoney.caller.name;
        // console.log("Add money as Number: " + caller);
    }
    money = money.add(amt);
    totalMoneyEarnedSession = totalMoneyEarnedSession.add(amt);
}

function subtractMoney(amt)
{
    if(Number.isNaN(amt))
    {
        // console.log("Sub money as nan: " + caller);
        return;
    }
    // var caller = (addMoney.caller == null) ? "top" : addMoney.caller.name;
    // console.log("Sub money as Number: " + caller);
    money = money.subtract(amt);
}

function addTickets(amount, source = null)
{
    var parsedAmount = parseInt(amount);
    if(isNaN(parsedAmount))
    {
        console.error("Invalid ticket amount '" + amount + "' from " + source);
        return;
    }
    tickets += parsedAmount;
    if(typeof (playsaurusSdk) != "undefined")
    {
        playsaurusSdk.logPremiumCurrencyGained(parsedAmount, source);
    }
}

function subtractTickets(amount, category = null, subtype = null)
{
    var parsedAmount = parseInt(amount);
    if(isNaN(parsedAmount))
    {
        console.error("Invalid ticket amount '" + amount + "' from category:" + category + " subtype:" + subtype);
        return;
    }
    tickets -= parsedAmount;
    if(typeof (playsaurusSdk) != "undefined")
    {
        playsaurusSdk.logPremiumCurrencySpent(parsedAmount, category, subtype);
    }
}

function addDepth(amt)
{
    if(isNaN(amt))
    {
        return;
    }
    if(battleManager.isStalledDueToBoss())
    {
        return;
    }
    depth += amt;
    if(activeLayers.WorldLayer.updateLevels)
    {
        // Add new levels on platforms where levels are rendered as hitboxes
        activeLayers.WorldLayer.updateLevels()
    }
    newNews(_("You dug to {0}km!", depth), true);
    trackEvent_DepthIncrease(depth);

    // Set flag to show golden highlight when drill reaches new depth
    hasReachedNewDepthUnseen = true;

    handleNewDepth();
}

function handleNewDepth()
{
    for(var i = 0; i < tradeConfig.tradingPosts.length; ++i)
    {
        if(depth == tradeConfig.tradingPosts[i].depth)
        {
            newNews(_("You have discovered a broken trading post at {0}km!", tradeConfig.tradingPosts[i].depth));
        }
    }
    if(depth == 10)
    {
        if(typeof startSuperMinerTutorial !== 'undefined')
        {
            startSuperMinerTutorial();
        }
    }
    if(depth == 12 && workersHiredAtDepth(12) > 0 && unlockScientistsEarly)
    {
        chestService.spawnChest(12, Chest.natural, ChestType.basic, 1);
    }
    if(depth == 50)
    {
        newNews(_("Check out 50km to purchase from the golem"), true);
    }
    if(battleManager.isStalledDueToBoss())
    {
        newNews(_("Your drill is stalled, defeat the boss to continue digging deeper!"), true);
    }
    var hoursToGrant = STAT.getPikeHours();
    if(hoursToGrant > 0)
    {
        if(highestOreUnlocked > 0)
        {
            var numMineralsPerMinute = estimateTotalMineralsMinedPerSecond()[highestOreUnlocked] * 60;
            var numMineralsToGrant = Math.floor(numMineralsPerMinute * hoursToGrant * 60);
            if(!isNaN(numMineralsToGrant))
            {
                worldResources[highestOreUnlocked].numOwned += numMineralsToGrant;
                newNews(_("Your pike relics gained you {0}x {1}", beautifynum(numMineralsToGrant), worldResources[highestOreUnlocked].name));
            }
        }
    }

    if(depth >= 303 && story == 0 && !isSimulating)
    {
        for(var i = 0; i < battleEquipsManager.activeEquips.length; i++)
        {
            if(battleEquipsManager.activeEquips[i])
            {
                var weaponType = battleEquipsManager.activeEquips[i].id;
                //makeBlueprintAvailable(2, weaponType);
                //learnBlueprint(2, weaponType);

            }
        }
        startUndergroundCityStory();
    }

    learnReachedBlueprints();
}

function getPurchasePackIndexBySku(sku)
{
    for(var i in purchasePacks)
    {
        if(purchasePacks[i].agSku == sku) return i;
    }
    return -1;
}

function surveyRewardMultiplier()
{
    if(centsSpent == 0)
    {
        if(depth < 500)
        {
            return 1;
        }
        else
        {
            return 2;
        }
    }
    else if(centsSpent <= 2000)
    {
        return 2;
    }
    else if(centsSpent <= 10000)
    {
        return 5;
    }
    else
    {
        return 10;
    }
}

function countHitboxes(args = {})
{
    var count = 0;
    var layerNames = Array.from(Object.keys(activeLayers));

    function _countNestedHitboxes(hitbox, args = {})
    {
        var count = 0;
        if(hitbox.hitboxes.length > 0)
        {
            for(var i = 0; i < hitbox.hitboxes.length; ++i)
            {
                var childHitbox = hitbox.hitboxes[i];
                if((args.isEnabled == undefined || args.isEnabled === childHitbox.isEnabled())
                    && (args.isVisible == undefined || args.isVisible === childHitbox.isVisible()))
                {
                    count += _countNestedHitboxes(childHitbox, args)
                }
            }
        }
        return count + hitbox.hitboxes.length;
    }

    for(var i = 0; i < layerNames.length; ++i)
    {
        var layer = activeLayers[layerNames[i]];
        if((args.isEnabled == undefined || args.isEnabled === layer.isEnabled())
            && (args.isVisible == undefined || args.isVisible === layer.isVisible()))
        {
            var subtotal = _countNestedHitboxes(layer, args);
            console.log(layerNames[i] + ": " + subtotal);
            count += subtotal;
        }
    }
    console.log("Total: " + count);
    return count;
}

function reloadGame()
{
    if(isMobile() && platform.isAndroid() && typeof (cordova) !== "undefined")
    {
        cordova.plugins.diagnostic.restart(null, false);
    }
    else
    {
        location.reload();
    }
}