const MINERAL_DEPOSIT_ID = 1;
const ORANGE_FISH_ID = 2;
const CAVE_SYSTEM_ID = 3;
const EVENT_PROMO_CLICKABLE_ID = 4;

const DEFAULT_CLICKABLE_LIFESPAN_MSEC = 1000 * 60 * 60; //one hour
const UNSPAWNABLE_DEPTHS = [20, 50, 225, 300, 301, 302, 303, 304];
const MAX_SPAWNED_MINERAL_DEPOSITS = 3;

const MIN_ORANGE_FISH_SPAWN_TIME_SECONDS = 60 * 60 * 24;
const MAX_ORANGE_FISH_SPAWN_TIME_SECONDS = 60 * 60 * 48;
const MAX_SPAWNED_ORANGE_FISH = 1;
const MAX_ORANGE_FISH_SPAWN_TIME_REDUCTION = 60 * 60 * 4;
const MIN_ORANGE_FISH_SPAWN_DEPTH = 25;

// Event Promo Clickable constants
const MAX_EVENT_PROMO_CLICKABLE_SPAWN_DEPTH = 100;
const EVENT_PROMO_CLICKABLE_COOLDOWN_HOURS = 24;
const EVENT_PROMO_CLICKABLE_COOLDOWN_MSEC = 24 * 60 * 60 * 1000;
const MAX_SPAWNED_EVENT_PROMO_CLICKABLES = 1;

//####################################################################
//########################## SAVED VALUES ############################
//####################################################################

var reducedOrangeFishLevels = 0;
var secondsSinceOrangeFishSpawn = 0;
var secondsUntilNextOrangeFishSpawn = clickableRoller.rand(MIN_ORANGE_FISH_SPAWN_TIME_SECONDS - (MAX_ORANGE_FISH_SPAWN_TIME_REDUCTION * reducedOrangeFishLevels), MAX_ORANGE_FISH_SPAWN_TIME_SECONDS - (MAX_ORANGE_FISH_SPAWN_TIME_REDUCTION * reducedOrangeFishLevels));
var orangeFishCollected = 0;
var hasSpawnedFirstOrangeFish = false;

// Event Promo Clickable saved values
var lastEventPromoClickableClaimTime = 0;

//####################################################################
//################### HANDLE GAP CLICKABLE CLICKS ####################
//####################################################################

function clickedGap(relativeDepth, gapNumber)
{
    var depthClicked = (currentlyViewedDepth - (5 - relativeDepth));

    for(var i = 0; i < tradeConfig.tradingPosts.length; ++i)
    {
        if(depthClicked == tradeConfig.tradingPosts[i].depth && gapNumber == 11) //clicked trading post
        {
            // openUi(TradeWindow, null, i);
            return;
        }
    }
    if(gapNumber == 11)
    {
        //AO: I don't like how this is, gotta fix this when we redo all hitbox processing
        onWorkerClicked(relativeDepth, 6);
        clickedGap(relativeDepth, 5);
    }

    if(depthClicked == 50 && gapNumber == 1) //clicked golem
    {
        if(hasFoundGolem == 0)
        {
            // Make golem blueprints available in the shop
            hasFoundGolem = 1;
            learnRangeOfBlueprints(1, 16, 31);
            startFoundGolemDialogue();
        }
        else
        {
            //Later have more dialogue
            openUi(CraftingWindow);
        }
    }

    if(depthClicked == 100)
    {
        if(chestCollectorChanceStructure.level == 0 && chestCollectorStorageStructure.level == 0)
        {
            chestCollectorChanceStructure.level = 1;
            chestCollectorStorageStructure.level = 1;
            learnRangeOfBlueprints(3, 8, 9);
            newNews(_("Discovered the Chest Collector!"));
        }
    }

    if(depthClicked == 112 && gapNumber == 2) //clicked mime
    {
        questManager.getQuest(94).markComplete();
    }

    if(depthClicked == 225 && gapNumber == 1) //clicked robot
    {
        if(hasFoundGidget == 0)
        {
            hasFoundGidget = 1;
            learnRangeOfBlueprints(1, 32, 47);
            startFoundGidgetDialogue();
        }
        else
        {
            //Later have more dialogue
            openUi(CraftingWindow);
        }
    }

    if(depthClicked == 1257 && gapNumber == 1) //clicked robot MK2
    {
        learnRangeOfBlueprints(1, 79, 87);
        openUi(CraftingWindow);
    }

    if(depthClicked == 2039 && gapNumber == 1) //clicked robot MK3
    {
        learnRangeOfBlueprints(1, 120, 131);
        openUi(CraftingWindow);
    }

    if(metalDetectorStructure.level >= 5 && chestService.chestExistsAtDepth(depthClicked) && !isClickableAtDepth(depthClicked))
    {
        chestService.presentChest(depthClicked);
    }
}

//####################################################################
//############################ CLICKABLES ############################
//####################################################################

var clickableData = {};
clickableData[MINERAL_DEPOSIT_ID] = {
    "name": "Mineral Deposit",
    "onSpawn": onSpawnMineralDeposit,
    "onClick": onClickedMineralDeposit, //args: self
    "rollForSpawn": rollForMineralDepositSpawn
};
clickableData[ORANGE_FISH_ID] = {
    "name": "Orange Fish",
    "onSpawn": onSpawnOrangeFish,
    "onClick": onClickedOrangeFish, //args: self
    "rollForSpawn": rollForOrangeFishSpawn
};
clickableData[CAVE_SYSTEM_ID] = {
    "name": "Cave System",
    "onSpawn": function () { },
    "onClick": onClickedCaveSystem, //args: self
    "rollForSpawn": function () { }
};
clickableData[EVENT_PROMO_CLICKABLE_ID] = {
    "name": "Event Promo Clickable",
    "onSpawn": onSpawnEventPromoClickable,
    "onClick": onClickedEventPromoClickable, //args: self
    "rollForSpawn": rollForEventPromoClickableSpawn
};

var clickablesSpawned = 0; //used for uids
var worldClickables = [];

//Runs every 30 seconds
function spawnWorldClickables()
{
    removeExpiredClickables();
    updateCaveSystemSpawns();
    for(var key in clickableData)
    {
        clickableData[key].rollForSpawn();
    }
}

function disposeWorldClickable(clickable)
{
    for(var i = worldClickables.length - 1; i >= 0; i--)
    {
        if(worldClickables[i].uid == clickable.uid)
        {
            if(worldClickables[i].hitbox)
            {
                worldClickables[i].hitbox.parent.deleteHitboxWithId(worldClickables[i].hitbox.id);
            }
            worldClickables.splice(i, 1);
            return;
        }
    }
}

function removeClickablesOfType(clickableType)
{
    for(var i = worldClickables.length - 1; i >= 0; i--)
    {
        if(worldClickables[i].type == clickableType)
        {
            disposeWorldClickable(worldClickables[i]);
        }
    }
}

function removeExpiredClickables()
{
    var currentGameTime = currentTime();
    for(var i = worldClickables.length - 1; i >= 0; i--)
    {
        if(worldClickables[i].expireTime < currentGameTime)
        {
            disposeWorldClickable(worldClickables[i]);
        }
    }
}

function numClickablesOfType(type)
{
    var result = 0;
    for(var i = 0; i < worldClickables.length; i++)
    {
        if(worldClickables[i].type == type) result++;
    }
    return result;
}

function isClickableAtDepth(depthToCheck)
{
    for(var i = 0; i < worldClickables.length; i++)
    {
        if(worldClickables[i].depth == depthToCheck) return true;
    }
    return false;
}

function getClickableAtDepth(depthToCheck)
{
    for(var i = 0; i < worldClickables.length; i++)
    {
        if(worldClickables[i].depth == depthToCheck) return worldClickables[i];
    }
    return null;
}

function isSpawnableAtDepth(depthToCheck)
{
    return !isDepthWithoutWorkers(depthToCheck);
}

//####################################################
//################# MINERAL DEPOSITS #################
//####################################################

function getMineralDepositType(depthToCheck)
{
    //get most popular mineral type on the level, filtering out the isotopes
    var typesAtDepth = levels[depthToCheck].filter((typeData) => !worldResources[typeData[0]].isIsotope);
    var maxValue = 0;
    var maxValueType = 1;
    for(var i = 0; i < typesAtDepth.length; i++)
    {
        if(typesAtDepth[i][1] > maxValue)
        {
            maxValue = typesAtDepth[i][1];
            maxValueType = typesAtDepth[i][0];
        }
    }
    return maxValueType;
}

function rollForMineralDepositSpawn()
{
    if(depth > 100 && !isCapacityFull())
    {
        let possibleSpawns = MAX_SPAWNED_MINERAL_DEPOSITS * (Math.floor(STAT.mineralDepositMultiplier()) + (STAT.mineralDepositMultiplier() % 1 > Math.random()));
        for(var i = 0; i <= possibleSpawns; i++)
        {
            if(clickableRoller.rand(0, 30) == 30 && numClickablesOfType(MINERAL_DEPOSIT_ID) < MAX_SPAWNED_MINERAL_DEPOSITS + STAT.additionalMineralDeposits())
            {
                onSpawnMineralDeposit();
            }
        }
    }
}

function onSpawnMineralDeposit()
{
    var minDepthToSpawn = Math.max(0, depth - 100);
    var depthToSpawn = clickableRoller.rand(minDepthToSpawn, depth);
    if(!isClickableAtDepth(depthToSpawn) && isSpawnableAtDepth(depthToSpawn))
    {
        var mineralTypeToSpawn = getMineralDepositType(depthToSpawn);

        var numMineralsPerMinute = estimatedMineralsPerMinuteAtLevel(depthToSpawn);
        var minimumMinutesWorthOfMineral = 10;
        var maximumMinutesWorthOfMineral = Math.max(10, depth / 2);
        var numMineralsToSpawnCandidate1 = clickableRoller.rand(minimumMinutesWorthOfMineral, maximumMinutesWorthOfMineral) * numMineralsPerMinute[mineralTypeToSpawn];

        var moneyGeneratedPerMinute = valueOfMineralsPerSecond().multiply(60);
        var minutesOfMoneyInMineralAwarded = clickableRoller.rand(10, 20);
        var moneyInMineralAwarded = moneyGeneratedPerMinute.multiply(minutesOfMoneyInMineralAwarded);
        var numMineralsToSpawnCandidate2 = moneyInMineralAwarded.divide(worldResources[mineralTypeToSpawn].sellValue);

        var numMineralsToSpawn = bigNumberMin(new BigNumber(500000000), bigNumberMax(new BigNumber(parseInt(numMineralsToSpawnCandidate1)), new BigNumber(numMineralsToSpawnCandidate2))).multiply(STAT.mineralDepositMineralMultiplier() * depthMultiplier());
        var numMineralPerClick = numMineralsToSpawn.divide(5).toFloat();

        if(!Number.isNaN(numMineralPerClick))
        {
            var newClickable = getNewMineralDeposit(++clickablesSpawned, mineralTypeToSpawn, numMineralPerClick, depthToSpawn, rand(1, 9));
            worldClickables.push(newClickable);
        }
    }
}

function getNewMineralDeposit(uid, mineralType, valuePerClick, depthToSpawn, spawnLocation)
{
    var newClickable = {
        "uid": uid,
        "type": MINERAL_DEPOSIT_ID,
        "subType": mineralType,
        "valuePerClick": valuePerClick,
        "depth": depthToSpawn,
        "spawnLocation": spawnLocation,
        "clicks": 0,
        "maxClicks": 5,
        "renderAssetFunction": renderMineralDeposit(mineralType),
        "expireTime": currentTime() + DEFAULT_CLICKABLE_LIFESPAN_MSEC,
        "spawnTime": currentTime(),
        "highlighted": false
    };
    newClickable.hitbox = createClickableHitbox(newClickable);

    return newClickable;
}

function renderMineralDeposit(mineralType)
{
    return function (x, y, clickableObject)
    {
        var oreDepositAsset = window["ore" + mineralType + "deposit"];

        var timeSinceSpawn = currentTime() - clickableObject.spawnTime;
        var sizeMultiplier = Math.min(1, (timeSinceSpawn / 500));
        var renderWidth = mainw * .045 * sizeMultiplier;
        var maxRenderWidth = mainw * .045;
        var renderHeight = mainh * .09 * sizeMultiplier;
        var maxRenderHeight = mainh * .09;

        if(oreDepositAsset)
        {
            MAIN.save();

            if(clickableObject.highlighted)
            {
                MAIN.shadowBlur = 8;
                MAIN.shadowColor = "rgba(255, 255, 64, .5)";
            }
            MAIN.drawImage(oreDepositAsset, (oreDepositAsset.width / 4) * Math.min(clickableObject.clicks, 3), 0, oreDepositAsset.width / 4, oreDepositAsset.height, x + ((maxRenderWidth - renderWidth) / 2), y + (maxRenderHeight - renderHeight), renderWidth, renderHeight);
            MAIN.restore();
        }
    };
}

function renderMineralDepositMobile(mineralType)
{
    return function (clickableObject)
    {
        var hitbox = clickableObject.hitbox;
        var coords = hitbox.getGlobalCoordinates(0, 0);
        var oreDepositAsset = window["ore" + mineralType + "deposit"];
        var timeSinceSpawn = currentTime() - clickableObject.spawnTime;
        var sizeMultiplier = Math.min(1, (timeSinceSpawn / 500));
        var maxRenderWidth = hitbox.boundingBox.width;
        var renderWidth = maxRenderWidth * sizeMultiplier;
        var maxRenderHeight = hitbox.boundingBox.height;
        var renderHeight = maxRenderHeight * sizeMultiplier;
        MAIN.drawImage(
            oreDepositAsset,
            (oreDepositAsset.width / 4) * Math.min(clickableObject.clicks, 3),
            0,
            oreDepositAsset.width / 4,
            oreDepositAsset.height,
            coords.x + ((maxRenderWidth - renderWidth) / 2),
            coords.y + (maxRenderHeight - renderHeight),
            renderWidth,
            renderHeight
        );
        hitbox.renderChildren();
    };
}

function onClickedMineralDeposit(clickableObject)
{
    if(clickableObject.clicks < clickableObject.maxClicks)
    {
        if(!mutebuttons) clickMineral[rand(0, clickMineral.length - 1)].play();
        clickableObject.clicks++;
        if(!isNaN(clickableObject.valuePerClick))
        {
            showFloatingText("+" + beautifynum(clickableObject.valuePerClick) + "x " + worldResources[clickableObject.subType].name, "16px Verdana", "#FFFFFF", (mouseX / uiScaleX) + rand(-10, 10), (mouseY / uiScaleY) - rand(10, 25), 1200, true, sinSquared, getFunctionYMovementOnly(easeInPowerFunction(2), -30));
            worldResources[clickableObject.subType].numOwned += clickableObject.valuePerClick;
        }
        else
        {
            clickableObject.clicks = clickableObject.maxClicks;
        }
    }
    if(clickableObject.clicks >= clickableObject.maxClicks)
    {
        disposeWorldClickable(clickableObject);
    }
}

//####################################################
//################### ORANGE FISH ####################
//####################################################

function rollForOrangeFishSpawn()
{
    if(depth > MIN_ORANGE_FISH_SPAWN_DEPTH && secondsSinceOrangeFishSpawn >= secondsUntilNextOrangeFishSpawn && numClickablesOfType(ORANGE_FISH_ID) < MAX_SPAWNED_ORANGE_FISH)
    {
        onSpawnOrangeFish();
    }
}

function onSpawnOrangeFish()
{
    var depthToSpawn;
    if(!hasSpawnedFirstOrangeFish)
    {
        depthToSpawn = MIN_ORANGE_FISH_SPAWN_DEPTH;
    }
    else
    {
        depthToSpawn = clickableRoller.rand(MIN_ORANGE_FISH_SPAWN_DEPTH, depth);
    }
    if(!isClickableAtDepth(depthToSpawn) && isSpawnableAtDepth(depthToSpawn))
    {
        if(!hasSpawnedFirstOrangeFish)
        {
            hasSpawnedFirstOrangeFish = true;
        }
        var newClickable = getNewOrangeFishClickable(++clickablesSpawned, depthToSpawn, clickableRoller.rand(1, 9));
        worldClickables.push(newClickable);
    }
}

function getNewOrangeFishClickable(uid, depthToSpawn, spawnLocation)
{
    var newClickable = {
        "uid": uid,
        "type": ORANGE_FISH_ID,
        "depth": depthToSpawn,
        "spawnLocation": spawnLocation,
        "clicks": 0,
        "maxClicks": 5,
        "renderAssetFunction": renderOrangeFish(),
        "expireTime": Number.MAX_SAFE_INTEGER, //don't expire
        "spawnTime": currentTime(),
        "highlighted": false
    };
    newClickable.hitbox = createClickableHitbox(newClickable);

    return newClickable;
}

function renderOrangeFish()
{
    return function (x, y, clickableObject)
    {
        MAIN.save();

        if(clickableObject.highlighted)
        {
            MAIN.shadowBlur = 8;
            MAIN.shadowColor = "rgba(255, 255, 64, .5)";
        }
        MAIN.drawImage(orangeFish, (orangeFish.width / 4) * Math.min(clickableObject.clicks, 3), 0, orangeFish.width / 4, orangeFish.height, x, y, mainw * .045, mainh * .09);
        MAIN.restore();
    };
}

function renderOrangeFishMobile()
{
    return function (clickableObject)
    {
        var hitbox = clickableObject.hitbox;
        var coords = hitbox.getGlobalCoordinates(0, 0);
        MAIN.drawImage(
            orangeFish,
            (orangeFish.width / 4) * Math.min(clickableObject.clicks, 3),
            0,
            orangeFish.width / 4,
            orangeFish.height,
            coords.x,
            coords.y,
            hitbox.boundingBox.width,
            hitbox.boundingBox.height
        );
    };
}


function onClickedOrangeFish(clickableObject)
{
    secondsSinceOrangeFishSpawn = 0;
    secondsUntilNextOrangeFishSpawn = clickableRoller.rand(MIN_ORANGE_FISH_SPAWN_TIME_SECONDS - (MAX_ORANGE_FISH_SPAWN_TIME_REDUCTION * reducedOrangeFishLevels), MAX_ORANGE_FISH_SPAWN_TIME_SECONDS - (MAX_ORANGE_FISH_SPAWN_TIME_REDUCTION * reducedOrangeFishLevels));

    if(clickableObject.clicks < clickableObject.maxClicks)
    {
        if(!mutebuttons) clickMineral[rand(0, clickMineral.length - 1)].play();
        clickableObject.clicks++;

        var grantedText = "";
        var hoursOfValue = Math.max(0.5, depth / 200);
        var minutesOfValue = 60 * hoursOfValue;
        switch(clickableRoller.rand(0, 4))
        {
            case 0:
                //money
                var moneyGranted = valueOfMineralsPerSecond().multiply(60 * parseInt(minutesOfValue));
                addMoney(moneyGranted);
                grantedText = "$" + beautifynum(moneyGranted);
                break;
            case 1:
                //1 ticket
                tickets++;
                grantedText = _("1x ticket");
                break;
            case 2:
                //ores
                grantedText = grantMineral(getMineralDepositType(clickableRoller.rand(Math.floor(depth / 2), depth)), hoursOfValue);
                break;
            case 3:
                //building materials
                var buildingMaterialsGained = Math.floor(Math.max(1, hoursOfValue));
                worldResources[BUILDING_MATERIALS_INDEX].add(buildingMaterialsGained, "clickable");
                grantedText = _("{0}x building materials", buildingMaterialsGained);
                break;
            case 4:
                //building materials (double)
                var buildingMaterialsGained = Math.floor(Math.max(1, hoursOfValue * 2));
                worldResources[BUILDING_MATERIALS_INDEX].add(buildingMaterialsGained, "clickable");
                grantedText = _("{0}x building materials", buildingMaterialsGained);
                break;
        }
        showFloatingText("+" + grantedText, "16px Verdana", "#FFFFFF", (mouseX / uiScaleX) + rand(-10, 10), (mouseY / uiScaleY) - rand(10, 25), 1200, true, sinSquared, getFunctionYMovementOnly(easeInPowerFunction(2), -30));
    }
    if(clickableObject.clicks >= clickableObject.maxClicks)
    {
        disposeWorldClickable(clickableObject);
        orangeFishCollected++;
        trackEvent_ClickedOrangeFish(clickableObject.depth);
    }

}


//####################################################
//############## EVENT PROMO CLICKABLE ###############
//####################################################

function rollForEventPromoClickableSpawn()
{
    var isAnyEventActive = limitedTimeEventManager.isEventActive;
    var isPromoEventActive = isAnyEventActive && limitedTimeEventManager.isPromoEvent();

    if(!isPromoEventActive)
    {
        return;
    }

    var currentTimeMs = new Date().getTime();
    if(currentTimeMs - lastEventPromoClickableClaimTime < EVENT_PROMO_CLICKABLE_COOLDOWN_MSEC)
    {
        return;
    }

    if(numClickablesOfType(EVENT_PROMO_CLICKABLE_ID) >= MAX_SPAWNED_EVENT_PROMO_CLICKABLES)
    {
        return;
    }

    if(depth < 1)
    {
        return;
    }

    if(Math.random() < 0.2)
    {
        onSpawnEventPromoClickable();
    }
}

function onSpawnEventPromoClickable()
{
    var maxDepthToSpawn = Math.min(MAX_EVENT_PROMO_CLICKABLE_SPAWN_DEPTH, depth);
    var depthToSpawn = clickableRoller.rand(1, maxDepthToSpawn);

    if(!isClickableAtDepth(depthToSpawn) && isSpawnableAtDepth(depthToSpawn))
    {
        var newClickable = getNewEventPromoClickable(++clickablesSpawned, depthToSpawn, clickableRoller.rand(1, 9));
        worldClickables.push(newClickable);
    }
}

function getNewEventPromoClickable(uid, depthToSpawn, spawnLocation)
{
    var newClickable = {
        "uid": uid,
        "type": EVENT_PROMO_CLICKABLE_ID,
        "depth": depthToSpawn,
        "spawnLocation": spawnLocation,
        "clicks": 0,
        "maxClicks": 4,
        "renderAssetFunction": renderEventPromoClickable(),
        "expireTime": Number.MAX_SAFE_INTEGER,
        "spawnTime": currentTime(),
        "highlighted": false
    };
    newClickable.hitbox = createClickableHitbox(newClickable);

    return newClickable;
}

function renderEventPromoClickable()
{
    return function (x, y, clickableObject)
    {
        MAIN.save();

        if(clickableObject.highlighted)
        {
            MAIN.shadowBlur = 8;
            MAIN.shadowColor = "rgba(208, 208, 208, 0.8)";
        }

        var spriteSection = Math.min(clickableObject.clicks, 3);
        var sectionWidth = promoClickable.width / 4;
        MAIN.drawImage(promoClickable, sectionWidth * spriteSection, 0, sectionWidth, promoClickable.height, x, y, mainw * .045, mainh * .09);

        MAIN.restore();
    };
}

function renderEventPromoClickableMobile()
{
    return function (clickableObject)
    {
        var hitbox = clickableObject.hitbox;
        var coords = hitbox.getGlobalCoordinates(0, 0);

        MAIN.save();

        var spriteSection = Math.min(clickableObject.clicks, 3);
        var sectionWidth = promoClickable.width / 4;
        MAIN.drawImage(
            promoClickable,
            sectionWidth * spriteSection,
            0,
            sectionWidth,
            promoClickable.height,
            coords.x,
            coords.y,
            hitbox.boundingBox.width,
            hitbox.boundingBox.height
        );

        MAIN.restore();
    };
}

function onClickedEventPromoClickable(clickableObject)
{
    if(!mutebuttons) promoClickableAudio[rand(0, promoClickableAudio.length - 1)].play();

    if(clickableObject.clicks < clickableObject.maxClicks)
    {
        clickableObject.clicks++;
    }

    if(clickableObject.clicks >= clickableObject.maxClicks)
    {
        tickets++;
        showFloatingText("+1 Ticket", "16px Verdana", "#FFFFFF", (mouseX / uiScaleX) + rand(-10, 10), (mouseY / uiScaleY) - rand(10, 25), 1200, true, sinSquared, getFunctionYMovementOnly(easeInPowerFunction(2), -30));
        newNews(_("You gained {0} tickets", 1), true);

        lastEventPromoClickableClaimTime = new Date().getTime();

        disposeWorldClickable(clickableObject);

        var promoAnnouncement = {
            title: "Check Orc Incremental on Steam!",
            body: "Keep searching for more Grubs each day!",
            image: {
                url: promoClickableAsset.src || null
            },
            button: "Play Now!",
            link: "https://store.steampowered.com/app/4736550/Orc_Incremental_Demo/"
        };

        openUiWithoutClosing(AnnouncementPopup, null, promoAnnouncement);
    }
}


function createClickableHitbox(clickable)
{
    if(isMobile()) return createMobileClickableHitbox(clickable);

    var worldLayer = activeLayers.WorldLayer;
    if(worldLayer)
    {
        var xPos = (mainw * (.109 + ((clickable.spawnLocation - 1) * .072)));
        var yPos = 8 + mainh * .09 / 2
        var hitbox = new WorldEntityHitbox(
            clickable.depth,
            {
                x: xPos / uiScaleX,
                y: yPos / uiScaleY,
                width: mainw * .045 / uiScaleX,
                height: mainh * .09 / uiScaleY
            },
            {
                onmousedown: function (clickable)
                {
                    if(clickable)
                    {
                        clickableData[clickable.type].onClick(clickable)
                    }
                    else
                    {
                        this.parent.deleteHitboxWithId(this.id);
                    }
                }.bind(hitbox, clickable),
                onmouseenter: function (clickable)
                {
                    clickable.highlighted = true;
                }.bind(hitbox, clickable),
                onmouseexit: function (clickable)
                {
                    clickable.highlighted = false;
                }.bind(hitbox, clickable)
            },
            "pointer",
            "clickable_" + clickable.uid
        )

        switch(clickable.type)
        {
            case MINERAL_DEPOSIT_ID:
                hitbox.addHitbox(new EasyHintArrow(
                    "down",
                    function ()
                    {
                        return numCoalOwned() < 30 && getEarth().workersHired == 0 && money.lessThan(30)
                    },
                    -0.45
                ));
                break;
            case CAVE_SYSTEM_ID:
                hitbox.addHitbox(new EasyHintArrow(
                    "down",
                    function ()
                    {
                        return numberOfCavesExplored == 0;
                    },
                    -0.45
                ));
                break;
        }
        worldLayer.addHitbox(hitbox);
        return hitbox;
    }
    return null;
}

function createMobileClickableHitbox(clickable)
{
    var worldLayer = activeLayers.WorldLayer;
    if(worldLayer)
    {
        var level = worldLayer.getHitboxById("level_" + clickable.depth);
        if(level)
        {
            var xPos = worldConfig.levelClickableWidth * (clickable.spawnLocation - 0.5) + worldConfig.levelClickableSpacing * (clickable.spawnLocation - 1);
            var hitbox = new Hitbox(
                {
                    x: xPos,
                    y: level.boundingBox.height * 0.2,
                    width: worldConfig.levelClickableWidth * 1.3,
                    height: worldConfig.levelClickableHeight * 1.3
                },
                {
                    onmousedown: function (clickable)
                    {
                        if(clickable)
                        {
                            clickableData[clickable.type].onClick(clickable)
                        }
                        else
                        {
                            this.parent.deleteHitboxWithId(this.id);
                        }
                    }.bind(hitbox, clickable)
                },
                "pointer",
                "clickable_" + clickable.uid
            )
            switch(clickable.type)
            {
                case MINERAL_DEPOSIT_ID:
                    hitbox.render = renderMineralDepositMobile(clickable.subType).bind(hitbox, clickable);
                    hitbox.addHitbox(new EasyHintArrow(
                        "down",
                        function ()
                        {
                            return numCoalOwned() < 30 && getEarth().workersHired == 0 && money.lessThan(30)
                        },
                        -0.45
                    ));
                    break;
                case ORANGE_FISH_ID:
                    hitbox.render = renderOrangeFishMobile(clickable.subType).bind(hitbox, clickable);
                    break;
                case EVENT_PROMO_CLICKABLE_ID:
                    hitbox.render = renderEventPromoClickableMobile(clickable.subType).bind(hitbox, clickable);
                    break;
                case CAVE_SYSTEM_ID:
                    hitbox.render = renderCaveSystemMobile(clickable.subType).bind(hitbox, clickable);
                    hitbox.addHitbox(new EasyHintArrow(
                        "down",
                        function ()
                        {
                            return numberOfCavesExplored == 0;
                        },
                        -0.45
                    ));
                    break;
            }
            level.addHitbox(hitbox);
            return hitbox;
        }
    }
    return null;
}

//####################################################
//################### CAVE SYSTEM ####################
//####################################################

function updateCaveSystemSpawns()
{
    //Check cave systems and see if one of the systems is not listed
    //Check km depth and use this to determine spawn depth and whether it works there
    var activeCaves = getActiveCaves();
    for(var i = 0; i < activeCaves.length; i++)
    {
        if(getClickableAtDepth(activeCaves[i].kmDepth) == null)
        {
            let spawnLocation = (activeCaves[i].kmDepth == 225) ? 3 : 1 + activeCaves[i].kmDepth % 9;
            var newClickable = getNewCaveSystemClickable(++clickablesSpawned, activeCaves[i].kmDepth, spawnLocation);
            worldClickables.push(newClickable);
        }
    }

    //Check if there are cave system clickables on a depth that there is no system
    for(var i = worldClickables.length - 1; i >= 0; i--)
    {
        if(worldClickables[i].type == CAVE_SYSTEM_ID)
        {
            if(getCaveAtDepth(worldClickables[i].depth) == null)
            {
                disposeWorldClickable(worldClickables[i]);
            }
        }
    }
}

function getNewCaveSystemClickable(uid, depthToSpawn, spawnLocation)
{
    var newClickable = {
        "uid": uid,
        "type": CAVE_SYSTEM_ID,
        "depth": depthToSpawn,
        "spawnLocation": spawnLocation,
        "clicks": 0,
        "maxClicks": Number.MAX_SAFE_INTEGER,
        "renderAssetFunction": renderCaveSystem(),
        "expireTime": Number.MAX_SAFE_INTEGER, //don't expire
        "spawnTime": currentTime(),
        "highlighted": false
    };
    newClickable.hitbox = createClickableHitbox(newClickable);

    return newClickable;
}

function renderCaveSystem()
{
    return function (x, y, clickableObject)
    {
        if(getCaveAtDepth(clickableObject.depth) != null)
        {
            var caveTimeRemaining = getCaveAtDepth(clickableObject.depth).remainingSeconds;
            if(caveTimeRemaining > 0)
            {
                var caveAsset = earthCave1;
                if(worldAtDepth(clickableObject.depth).name == "Earth")
                {
                    if(clickableObject.depth < 500)
                    {
                        caveAsset = earthCave1;
                    }
                    else
                    {
                        caveAsset = earthCave2;
                    }
                }
                else
                {
                    if(clickableObject.depth < 1500)
                    {
                        caveAsset = moonCave1;
                    }
                    else
                    {
                        caveAsset = moonCave2;
                    }
                }
                MAIN.save();

                if(clickableObject.highlighted)
                {
                    MAIN.shadowBlur = 8;
                    MAIN.shadowColor = "rgba(255, 255, 64, .5)";
                }
                drawImageFitInBox(MAIN, caveAsset, x, y - mainh * .03, mainw * .06, mainh * .12, "center", "bottom");
                MAIN.restore()
                //MAIN.drawImage(caveAsset, 0, 0, caveAsset.width, caveAsset.height, x, y, mainw * .045, mainh * .09);
                MAIN.save();
                MAIN.font = "10px Verdana";
                MAIN.fillStyle = "#FFFFFF";
                MAIN.strokeStyle = "#000000";
                MAIN.lineWidth = 3;
                var xCoordinateOfText = ((mainw * .06) - MAIN.measureText(formattedCountDown(caveTimeRemaining)).width) / 2;
                MAIN.strokeText(formattedCountDown(caveTimeRemaining), x + xCoordinateOfText, y + (mainh * .12) - (mainh * .03));
                MAIN.fillText(formattedCountDown(caveTimeRemaining), x + xCoordinateOfText, y + (mainh * .12) - (mainh * .03));
                MAIN.restore();
            }
        }
    };
}

function renderCaveSystemMobile()
{
    return function (clickableObject)
    {
        var hitbox = clickableObject.hitbox;
        var coords = hitbox.getGlobalCoordinates(0, 0);
        if(getCaveAtDepth(clickableObject.depth) != null)
        {
            var caveTimeRemaining = getCaveAtDepth(clickableObject.depth).remainingSeconds;
            if(caveTimeRemaining > 0)
            {
                var caveAsset = earthCave1;
                if(worldAtDepth(clickableObject.depth).name == "Earth")
                {
                    if(clickableObject.depth < 500)
                    {
                        caveAsset = earthCave1;
                    }
                    else
                    {
                        caveAsset = earthCave2;
                    }
                }
                else
                {
                    if(clickableObject.depth < 1500)
                    {
                        caveAsset = moonCave1;
                    }
                    else
                    {
                        caveAsset = moonCave2;
                    }
                }

                var maxWidth = hitbox.boundingBox.width * 2;

                drawImageFitInBox(
                    MAIN,
                    caveAsset,
                    coords.x - (maxWidth - hitbox.boundingBox.width) / 2,
                    coords.y,
                    maxWidth,
                    hitbox.boundingBox.height,
                    "center",
                    "bottom"
                );
                //MAIN.drawImage(caveAsset, coords.x, coords.y, hitbox.boundingBox.width, hitbox.boundingBox.height);
                MAIN.save();
                MAIN.font = "14px Verdana";
                MAIN.fillStyle = "#FFFFFF";
                MAIN.strokeStyle = "#000000";
                MAIN.lineWidth = 3;
                MAIN.textBaseline = "top";

                var textWidth = this.boundingBox.width * 1.5;

                outlineTextShrinkToFit(
                    MAIN,
                    formattedCountDown(caveTimeRemaining),
                    coords.x + (hitbox.boundingBox.width - textWidth) / 2,
                    coords.y + hitbox.boundingBox.height - 13,
                    textWidth,
                    "center"
                );
                MAIN.restore();
            }
        }
        hitbox.renderChildren();
    };
}

function onClickedCaveSystem(clickableObject)
{
    //open the UI for the cave system at the given depth
    if(getCaveAtDepth(clickableObject.depth) != null)
    {
        if(!mutebuttons) clickMineral[rand(0, clickMineral.length - 1)].play();
        openUi(CaveWindow, null, clickableObject.depth);
    }
}

function isUfoVisible()
{
    return hasFoundUfo == 0 && depth > 1000 && ((currentTime() / 60000) % 600) <= 15;
}