// ##################################################################
// ##################### GLOBAL VARIABLES ###########################
// ##################################################################
const CHARACTER_BLINK_PERIOD = 36;

var isHoveringOverGarage = 0;
var flickerinventory = false;
var flickercraft = false;
var windowState = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var saveButtons = [0, 0, 0, 0, 0, 0, 0];
var hasAnimatedThisFrame = 0;
var isArrowOnTopLevel = false;

var minerImages = [miner, miner1, miner2, miner3, miner4, miner5, miner6, miner7, miner8, miner9, miner10];
var lunarMinerImages = [lunarminer1, lunarminer2, lunarminer3, lunarminer4, lunarminer5, lunarminer6, lunarminer7, lunarminer8, lunarminer9, lunarminer10, lunarminer11];
var titanMinerImages = [titanminer1, titanminer2, titanminer3, titanminer4, titanminer5, titanminer6, titanminer7, titanminer8, titanminer9, titanminer10, titanminer11];
var minerHatImages = [bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock, bigtransblock];
//var upgradeMinerImages = [0, upgrade1, upgrade2, upgrade3, upgrade4, upgrade5, upgrade6, upgrade7, upgrade8, upgrade9, upgrade10];

var uiScaleX = 1;
var uiScaleY = 1;

var limitFramerate = false;
var maxFramerate = 60;
var isWaitingForRender = false;
var lastRenderTime = 0;
var renderTimeout = 1000; // Time until game gives up on rendering current frame

//what was found per miner per deapth viewable
var found = [
    [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
]; //clear top or bottom when currentlyViewedDepth is moved up or down

var backpackRenderLoop;

// ##################################################################
// ##################### ANIMATE DISPLAYS ###########################
// ##################################################################

var animationFrameRequest;
var renderDeltaTime = 1;

function animate()
{
    if(isSimulating) return;
    if(!isWaitingForRender || performance.now() > lastRenderTime + renderTimeout)
    {
        if(animationFrameRequest)
        {
            cancelAnimationFrame(animationFrameRequest);
            animationFrameRequest = null;
        }
        isWaitingForRender = true;
        animationFrameRequest = requestAnimationFrame(_animate);
    }
}

function _animate()
{
    if(isSimulating || (isMobile() && limitFramerate && performance.now() < lastRenderTime + 1000 / maxFramerate))
    {
        return;
    }

    renderDeltaTime = performance.now() - lastRenderTime;

    if(isGameLoaded)
    {
        renderUi();
    }

    if(isSaveFileLoaded() && !isTimelapseOn)
    {
        renderDialogues();
        drawEffects();
    }
    else if(!isMobile())
    {
        renderLoadingScreen();
    }



    lastRenderTime = performance.now();
    isWaitingForRender = false;
    animationFrameRequest = null;
}

// ###################################################
// ##################### MAIN UI #####################
// ###################################################

function renderUi()
{
    for(var key in activeLayers)
    {
        let layer = activeLayers[key];

        if(!layer.overrideRendering)
        {
            layer.render();
        }
        if(key.substring(0, 17) == "confirmationLayer" && layer.context.canvas.width == 0)
        {
            // Confirmation prompts are bad and don't always close properly
            // so we just clean them up if they're hidden but still open
            // Not ideal but if it breaks the whole game is unresponsive so whatever
            delete activeLayers[key];
        }
    }
}

function updateUi(deltaTime)
{
    for(var key in activeLayers)
    {
        activeLayers[key].update(deltaTime);
    }
}

function renderUiOnSubinterval(layerName, uiFunction, subinterval, uiRenderLoop, ...params)
{
    if(subinterval < interval)
    {
        clearInterval(uiRenderLoop);
        uiRenderLoop = setInterval(
            function ()
            {
                if(activeLayers[layerName])
                {
                    uiFunction(...params);
                }
                else
                {
                    clearInterval(uiRenderLoop);
                }
            },
            subinterval
        );
    }
    else
    {
        uiFunction(...params);
    }
}

// ##################################################
// ##################### HEADER #####################
// ##################################################



// ##################################################
// ##################### HINTS ######################
// ##################################################

var showHintArrows = true;
var showDrillHighlights = true;
var showSuperMinerHitboxes = true;
var showTradeWarnings = true;
function renderHintArrows()
{
    if(isMobile() || !showHintArrows) return;

    var arrowOnTopLevel = false;
    // ### Top City Hints ###
    if(depth < 100)
    {
        if((!activeLayers.hasOwnProperty("SELL") && !activeLayers.hasOwnProperty("Hire") && !activeLayers.hasOwnProperty("crafting")) &&
            (
                (getEarth().workersHired == 0 && getValueOfMinerals().greaterThanOrEqualTo(getEarth().workerHireCost())) || // Can hire first worker
                (!hasCraftedABlueprint && getValueOfMinerals().greaterThanOrEqualTo(150)) ||     // Can craft first blueprint
                (drillState.drill().level == 1 && getValueOfMinerals().greaterThanOrEqualTo(250)) || // Can craft second blueprint
                (isCapacityFull() &&                                            // Capacity is full and has crafted <= 2 blueprints
                    drillState.engine().level + drillState.drill().level + drillState.fan().level + drillState.cargo().level <= 6 // Sum of drill part levels <= 6
                ) ||
                (drillState.engine().level == 1 && drillBlueprints[0].ingredients[0].item.getName() == _("Money") &&
                    getValueOfMineralsExcludingHe3().greaterThanOrEqualTo(drillBlueprints[0].ingredients[0].quantity)
                )
            ))
        {
            //arrow on sell center
            arrowOnTopLevel = true;
            MAIN.drawImage(arrow, 0, 0, arrow.width, arrow.height, Math.ceil(mainw * .21), Math.ceil(mainh * (.33 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .05), Math.floor(mainh * .12));
        }
        if(getEarth().workersHired == 0 && !activeLayers.hasOwnProperty("Hire") && money.greaterThanOrEqualTo(getEarth().workerHireCost()))
        {
            //arrow on hire center
            arrowOnTopLevel = true;
            MAIN.drawImage(arrow, 0, 0, arrow.width, arrow.height, Math.ceil(mainw * .41), Math.ceil(mainh * (.37 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .05), Math.floor(mainh * .12));
        }
        if(numExcavationsCompleted == 0 && hasUnlockedScientists != 0 && !activeLayers.hasOwnProperty("Arch") && numActiveScientists() > 0 && !isOnActiveExcavation(0))
        {
            //arrow on scientist building
            arrowOnTopLevel = true;
            if(currentlyViewedDepth == 0)
            {
                MAIN.drawImage(arrow, 0, 0, arrow.width, arrow.height, Math.ceil(mainw * .31), Math.ceil(mainh * (.20 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .05), Math.floor(mainh * .12));
            }
        }
        // if(numCoalOwned() < 30 && getEarth().workersHired == 0 && worldClickables.length > 0 && money.lessThan(30)) //DEPRECATED
        // {
        //     //arrow on mineral deposit
        //     var yCoordinateOfLevelTop = mainh * .111 + ((4 - (currentlyViewedDepth - worldClickables[0].depth)) * .178 * mainh);
        //     MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, mainw * (.135 + ((worldClickables[0].spawnLocation - 1) * .072)) + (oscillate(numFramesRendered, 8) * mainh * .018), yCoordinateOfLevelTop + (mainh * .075), Math.floor(mainw * .075), Math.floor(mainh * .08));
        // }
        if(currentlyViewedDepth == 0 && depth >= 1 && !hasBranchTriggered(0) && depth < 10)
        {
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .90), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
        if((getBlueprintCount() > 0 &&
            (!hasCraftedABlueprint && canCraftAnyBlueprint(1)) ||
            (drillState.drill().level == 1 && canCraftBlueprint(1, 1))) || playerNeedsHelpCraftingManager())
        {
            // Player owns blueprints but hasn't crafted any
            if(!activeLayers.crafting)
            {
                //arrow on drill center
                arrowOnTopLevel = true;
                MAIN.drawImage(arrow, Math.ceil(mainw * .65), Math.ceil(mainh * (.34 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .05), Math.floor(mainh * .12));
            }
            else
            {
                if(playerNeedsHelpCraftingManager() && activeLayers.crafting.currentTabIndex != 1)
                {
                    MAIN.drawImage(arrow, Math.ceil(mainw * .38), Math.ceil(mainh * (.11 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .03), Math.floor(mainh * .075));
                }

                if((!hasCraftedABlueprint && activeLayers.crafting.currentTabIndex == 0) || (playerNeedsHelpCraftingManager() && activeLayers.crafting.currentTabIndex == 1))
                {

                    if(!activeLayers.crafting.selectedBlueprint)
                    {
                        if(activeLayers.crafting.blueprintListHitboxes[0].isCollapsed)
                        {
                            MAIN.drawImage(
                                arrowright,
                                Math.floor(mainw * 0.165) + (oscillate(numFramesRendered, 8) * mainw * .013),
                                Math.ceil(mainh * 0.26),
                                Math.floor(mainw * 0.075),
                                Math.floor(mainh * 0.08)
                            );
                        }
                        else if(activeLayers.crafting.currentTabIndex == 0)
                        {
                            MAIN.drawImage(
                                arrowright,
                                Math.floor(mainw * 0.165) + (oscillate(numFramesRendered, 8) * mainw * .013),
                                Math.ceil(mainh * 0.35),
                                Math.floor(mainw * 0.075),
                                Math.floor(mainh * 0.08)
                            );
                        }
                        else if(activeLayers.crafting.currentTabIndex == 1)
                        {
                            activeLayers.crafting.openTab(1);
                            activeLayers.crafting.selectedBlueprint = getBlueprintById(3, 2);
                            activeLayers.crafting.initializeCraftingPane();
                        }

                    }
                    else
                    {
                        MAIN.drawImage(
                            arrowleft,
                            Math.floor(mainw * 0.75) + (oscillate(numFramesRendered, 8) * mainw * .013),
                            Math.ceil(mainh * 0.68),
                            Math.floor(mainw * 0.075),
                            Math.floor(mainh * 0.08)
                        );
                    }
                }
            }
        }

        // ### Minerl Deposit Hint ###
        if(depth < 10 && depth >= 5 && isClickableAtDepth(5) && getClickableAtDepth(5).spawnLocation == 10)
        {
            if(currentlyViewedDepth >= 5)
            {
                for(var i = 0; i < 5; i++)
                {
                    if((currentlyViewedDepth - i) == 5)
                    {
                        MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.80)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.175 + (.178 * (4 - i)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                    }
                }
            }
        }

        // ### Trading Post Hint ### 
        for(var i in tradeConfig.tradingPosts)
        {
            var trades = getTradesForWorld(i);
            if(isTradeAvailable(trades[0]) && !tradeConfig.tradingPosts[i].playerHasSeenNewTrade)
            {
                if(depth >= tradeConfig.tradingPosts[i].depth && currentlyViewedDepth >= tradeConfig.tradingPosts[i].depth)
                {
                    for(var j = 0; j < 5; j++)
                    {
                        if((currentlyViewedDepth - j) == tradeConfig.tradingPosts[i].depth)
                        {
                            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.5)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.15 + (.178 * (4 - j)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                        }
                    }
                }
            }
        }

        if(playerNeedsHelpCraftingTradingPost())
        {
            if(currentlyViewedDepth < tradeConfig.tradingPosts[0].depth - 1)
            {
                //down arrow
                MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .9), Math.floor(mainw * .075), Math.floor(mainh * .08));
            }
            else if(currentlyViewedDepth > tradeConfig.tradingPosts[0].depth + 4)
            {
                //up arrow
                MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
            }

            if(depth >= tradeConfig.tradingPosts[0].depth && currentlyViewedDepth >= tradeConfig.tradingPosts[0].depth)
            {
                for(var j = 0; j < 5; j++)
                {
                    if((currentlyViewedDepth - j) == tradeConfig.tradingPosts[0].depth)
                    {
                        MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.5)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.15 + (.178 * (4 - j)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                    }
                }
            }
        }

        // ### Golem Hint ###
        if(playerNeedsHelpFindingGolem())
        {

            if(currentlyViewedDepth < 49)
            {
                //down arrow
                MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .9), Math.floor(mainw * .075), Math.floor(mainh * .08));
            }
            else if(currentlyViewedDepth > 54)
            {
                //up arrow
                MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
            }

            if(depth > 49 && currentlyViewedDepth >= 50)
            {
                for(var i = 0; i < 5; i++)
                {
                    if((currentlyViewedDepth - i) == 50)
                    {
                        MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.16)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.15 + (.178 * (4 - i)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                    }
                }
            }
        }
    }

    for(var i = 0; i < questManager.quests.length; i++)
    {
        if(questManager.getQuest(i).isCollectable())
        {
            //arrow on the quest guy since a quest was completed
            arrowOnTopLevel = true;
            MAIN.drawImage(arrow, 0, 0, arrow.width, arrow.height, Math.ceil(mainw * .63), Math.ceil(mainh * (.19 - (.179 * currentlyViewedDepth) + (oscillate(numFramesRendered, 8) * .018))), Math.floor(mainw * .05), Math.floor(mainh * .12));
            break;
        }
    }

    if(chestService.totalBlackChestsOpened == 0 && depth >= SUPER_MINER_DEPTH)
    {
        if(currentlyViewedDepth < SUPER_MINER_DEPTH)
        {
            //down arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .9), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
        else if(currentlyViewedDepth > SUPER_MINER_DEPTH + 4)
        {
            //up arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
        else if(currentlyViewedDepth >= SUPER_MINER_DEPTH && currentlyViewedDepth <= SUPER_MINER_DEPTH + 4)
        {
            var yCoordinateOfLevelTop = mainh * .111 + ((4.25 - (currentlyViewedDepth - SUPER_MINER_DEPTH)) * .178 * mainh);
            MAIN.drawImage(arrowright, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.275)) + (oscillate(numFramesRendered, 8) * mainw * .013), yCoordinateOfLevelTop, Math.floor(mainw * .075), Math.floor(mainh * .08));
        }

    }

    // ### Cave Hint ###
    var activeCaves;
    if(numberOfCavesExplored == 0 && depth >= MIN_CAVE_SYSTEM_SPAWN_DEPTH && (activeCaves = getActiveCaves()).length > 0)
    {
        // MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.80)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.175 + (.178 * (4 - i)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
        var clickable = getClickableAtDepth(activeCaves[0].kmDepth);
        if(clickable)
        {
            var yCoordinateOfLevelTop = mainh * .111 + ((4 - (currentlyViewedDepth - activeCaves[0].kmDepth)) * .178 * mainh);
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, mainw * (.135 + ((clickable.spawnLocation - 1) * .072)) + (oscillate(numFramesRendered, 8) * mainh * .018), yCoordinateOfLevelTop + (mainh * .075), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
    }
    else if(!hasCollectedTreasure && treasureStorage.treasure.length > 0)
    {
        if(!activeLayers.caveManagement)
        {
            if(currentlyViewedDepth >= CAVE_BUILDING_DEPTH && currentlyViewedDepth < CAVE_BUILDING_DEPTH + 5)
            {
                var yCoordinateOfLevelTop = mainh * .111 + ((4 - (currentlyViewedDepth - CAVE_BUILDING_DEPTH)) * .178 * mainh);
                MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.5)) + (oscillate(numFramesRendered, 8) * mainw * .013), yCoordinateOfLevelTop + (mainh * .075), Math.floor(mainw * .075), Math.floor(mainh * .08));
            }
            else
            {
                MAIN.drawImage(arrowright, 0, 0, arrowright.width, arrowright.height, Math.floor(mainw * (.84)) + (oscillate(numFramesRendered, 8) * mainw * .013), mainh * .32, Math.floor(mainw * .075), Math.floor(mainh * .08));
            }
        }
        else
        {
            MAIN.drawImage(arrowright, 0, 0, arrowright.width, arrowright.height, Math.floor(mainw * (.1)) + (oscillate(numFramesRendered, 8) * mainw * .013), mainh * .824, Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
    }

    // ### Arrow to get to the top level to see other arrows ###
    if(currentlyViewedDepth > 2 && arrowOnTopLevel)
    {
        MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
    }



    if(playerNeedsHelpFindingBrokenRobot())
    {
        if(currentlyViewedDepth < 224)
        {
            //down arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .9), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
        else if(currentlyViewedDepth > 229)
        {
            //up arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }

        if(depth > 224 && currentlyViewedDepth >= 225)
        {
            for(var i = 0; i < 5; i++)
            {
                if((currentlyViewedDepth - i) == 225)
                {
                    MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.16)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.15 + (.178 * (4 - i)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                }
            }
        }
    }

    if(playerNeedsHelpFindingChestCollector())
    {
        if(currentlyViewedDepth < 99)
        {
            //down arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .9), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }
        else if(currentlyViewedDepth > 104)
        {
            //up arrow
            MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.08)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * .15), Math.floor(mainw * .075), Math.floor(mainh * .08));
        }

        if(depth > 99 && currentlyViewedDepth >= 100)
        {
            for(var i = 0; i < 5; i++)
            {
                if((currentlyViewedDepth - i) == 100)
                {
                    MAIN.drawImage(arrowleft, 0, 0, arrowleft.width, arrowleft.height, Math.floor(mainw * (.73)) + (oscillate(numFramesRendered, 8) * mainw * .013), Math.ceil(mainh * (.15 + (.178 * (4 - i)))), Math.floor(mainw * .075), Math.floor(mainh * .08));
                }
            }
        }
    }
}

function playerNeedsHelpCraftingManager()
{
    return (managerStructure.level == 0 && canCraftBlueprint(3, 2))
}

function playerNeedsHelpCraftingTradingPost()
{
    return (tradingPostStructure.level == 0 && drillState.equippedDrillEquips[0] >= 9 && canCraftBlueprint(3, 0))
}

function playerNeedsHelpFindingChestCollector()
{
    return (depth > 200 && chestCollectorChanceStructure.level < 1)
}

function playerNeedsHelpFindingGolem()
{
    return (depth > 52 && depth < 70 && hasFoundGolem == 0 && afk >= 14);
}

function playerNeedsHelpFindingBrokenRobot()
{
    return (depth > 227 && depth < 250 && hasFoundGidget == 0)
}

// ##################################################
// ############### TUTORIAL DIALOGUES ###############
// ##################################################

function renderDialogues()
{
    if(oneTimeDialogue.isActive)
    {
        document.getElementById("TUTORIALD").style.visibility = "visible";
        document.getElementById("TUTORIALD").style.zIndex = 999;
        if(!isMobile())
        {
            TUT.clearRect(0, 0, tutw, tuth);
            TUT.fillStyle = "#a5a5a5";
            TUT.strokeStyle = "#000000";
            TUT.fillRect(tutw * .25, tuth * .13, tutw * .5, tuth * .27);
            TUT.strokeRect(tutw * .25, tuth * .13, tutw * .5, tuth * .27);
            TUT.fillStyle = "#000000";
            TUT.drawImage(oneTimeDialogue.image, 0, 0, oneTimeDialogue.image.width, oneTimeDialogue.image.height, tutw * .25, tuth * .13, tutw * .125, tuth * .27);
            TUT.strokeRect(tutw * .25, tuth * .13, tutw * .125, tuth * .27);
            document.getElementById("tutorialTextContent").innerHTML = _(oneTimeDialogue.text);
            document.getElementById("tutorialNextText").innerHTML = _("Tap to Continue");
            document.getElementById("personTalkingNameText").innerHTML = _(oneTimeDialogue.name);
        }
        else
        {
            TUT.clearRect(0, 0, tutw, tuth);
            TUT.fillStyle = "#a5a5a5";
            TUT.strokeStyle = "#000000";
            TUT.fillRect(tutw * .1, tuth * .13, tutw * .8, tuth * .432);
            TUT.strokeRect(tutw * .1, tuth * .13, tutw * .8, tuth * .432);
            TUT.fillStyle = "#000000";
            TUT.drawImage(oneTimeDialogue.image, 0, 0, oneTimeDialogue.image.width, oneTimeDialogue.image.height, tutw * .1, tuth * .13, tutw * .2, tuth * .432);
            TUT.strokeRect(tutw * .1, tuth * .13, tutw * .2, tuth * .432);
            document.getElementById("tutorialTextContent").innerHTML = _(oneTimeDialogue.text);
            document.getElementById("tutorialNextText").innerHTML = _("Tap to Continue");
            document.getElementById("personTalkingNameText").innerHTML = _(oneTimeDialogue.name);
            document.getElementById("tutorialNextText").style.top = "50%";
            document.getElementById("tutorialNextText").style.left = "45%";
            document.getElementById("personTalkingNameText").style.left = "22%";
        }
    }
}

// ##################################################
// ################ PREMIUM CURRENCY ################
// ##################################################

function renderPurchaseUi()
{
    PU.fillStyle = "#FFFFFF";
    PU.drawImage(sellbg, 0, 0, 640, 405, 0, 0, purchasedw, purchasedh);
    var fontToUse = "14px Verdana"
    if(language == "french") {fontToUse = "12px Verdana";}
    if(windowState[7] == 1)
    {
        if(typeof (isPaypalWindowVisible) != 'undefined' && !isPaypalWindowVisible)
        {
            showDiv("paypalPopup", 4);
        }
        renderButton(PU, tab_blank, _("GET TICKETS"), 0, 0, purchasedw * .2, purchasedh * .05, fontToUse, "#FFFFFF");
        renderButton(PU, tab_dark_blank, _("USE TICKETS"), purchasedw * .2, 0, purchasedw * .2, purchasedh * .05, fontToUse, "#FFFFFF");

        PU.drawImage(ticketicon, 0, 0, 25, 25, purchasedw * .45, purchasedh * .9, purchasedw * .05, purchasedh * .05);
        PU.fillText("x" + tickets, purchasedw * .5, purchasedh * .933);
    }
    else
    {
        if(typeof (isPaypalWindowVisible) != 'undefined' && isPaypalWindowVisible)
        {
            hideDiv("paypalPopup");
        }
        renderButton(PU, tab_dark_blank, _("GET TICKETS"), 0, 0, purchasedw * .2, purchasedh * .05, fontToUse, "#FFFFFF");
        renderButton(PU, tab_blank, _("USE TICKETS"), purchasedw * .2, 0, purchasedw * .2, purchasedh * .05, fontToUse, "#FFFFFF");
        PU.fillText("x" + tickets, purchasedw * .5, purchasedh * .933);
        PU.drawImage(chest1, 0, 0, 100, 120, purchasedw * .15, purchasedh * .2, purchasedw * .3, purchasedh * .48);
        PU.drawImage(chest2, 0, 0, 100, 120, purchasedw * .55, purchasedh * .2, purchasedw * .3, purchasedh * .48);
        PU.font = "24px KanitM";
        PU.fillStyle = "#1798c7";
        PU.fillText(_("BUY"), purchasedw * .15 + (purchasedw * .3 / 2) - (PU.measureText(_("BUY")).width / 2), purchasedh * .2 + purchasedh * .43);
        PU.fillText(_("BUY"), purchasedw * .55 + (purchasedw * .3 / 2) - (PU.measureText(_("BUY")).width / 2), purchasedh * .2 + purchasedh * .43);
        PU.drawImage(ticketicon, 0, 0, 25, 25, purchasedw * .45, purchasedh * .9, purchasedw * .05, purchasedh * .05);
        renderButton(PU, craftb, _("REDEEM"), purchasedw * .75, purchasedh * .90, purchasedw * .20, purchasedh * .04, fontToUse, "#000000");
    }
    PU.drawImage(closei, 0, 0, closei.width, closei.height, purchasedw * .94, purchasedh * .01, purchasedw * .05, purchasedh * .05);
}

// ##################################################
// ################## START SCREEN ##################
// ##################################################

function renderLoadingScreen()
{
    //If not yet chosen game to load
    TI.clearRect(0, 0, titlecw, titlech);
    TI.drawImage(title4, 0, 0, title4.width, title4.height, 0, 0, titlecw, titlech);
    //TI.drawImage(testWebm, Math.floor(testWebm.width / 30) * (numFramesRendered % 30), 0, Math.floor(testWebm.width / 30), testWebm.height, 0, 0, testWebm.width / 30, testWebm.height);

    // Bottom button row: Account | Language | Steam Cloud
    var accountRestricted = typeof platform !== 'undefined' && platform.isAccountRestricted();
    if(accountRestricted)
    {
        TI.globalAlpha = 0.35;
    }
    // Account button position/size must match #playsaurusAccountBtn CSS
    var btnX = titlecw * .005;
    var btnY = titlech * .925;
    var btnW = titlecw * .13;
    var btnH = titlech * .07;
    TI.drawImage(accountsButton, 0, 0, accountsButton.width, accountsButton.height, btnX, btnY, btnW, btnH);

    var prevStyle = TI.fillStyle;
    var prevFont = TI.font;

    TI.save();
    TI.font = Math.round(btnH * 0.40) + "px KanitM";
    TI.textBaseline = "middle";
    TI.fillStyle = "#FFFFFF";
    TI.shadowColor = "rgba(0, 0, 0, 0.75)";
    TI.shadowBlur = 2;
    TI.shadowOffsetX = 0;
    TI.shadowOffsetY = 2;

    // "Account" text centered between the baked-in icon (left ~29%) and the pill right edge (~97%)
    var iconEndRatio = 0.20;
    var rightEdgeRatio = 0.92;
    var textAreaX = btnX + btnW * iconEndRatio;
    var textAreaW = btnW * (rightEdgeRatio - iconEndRatio);
    var btnCenterY = btnY + btnH / 2;
    fillTextShrinkToFit(TI, _("Account"), textAreaX, btnCenterY, textAreaW, "center");

    TI.restore();

    if(accountRestricted)
    {
        TI.globalAlpha = 1.0;
    }

    // Language/Steam button positions must match #languageSelection / #steamCloudBackup CSS.
    // Sized to match the account button height so the three sit in a visually consistent row.
    var sideBtnW = titlecw * .04;
    var sideBtnH = titlech * .07;
    var sideBtnY = titlech * .925;
    TI.drawImage(languageOptionsIcon, titlecw * .14, sideBtnY, sideBtnW, sideBtnH);
    if(isSteam() || isWeb())
    {
        TI.drawImage(steamBackup, 0, 0, steamBackup.width, steamBackup.height, titlecw * .185, sideBtnY, sideBtnW, sideBtnH);
    }

    TI.textBaseline = "bottom";

    TI.fillStyle = prevStyle;
    TI.font = prevFont;

    if(limitedTimeEventManager.isHalloween())
    {
        TI.drawImage(jackolantern, 0, 0, jackolantern.width, jackolantern.height, titlecw * .435, titlech * .12, titlecw * .0533, titlech * .1);
    }
    if(limitedTimeEventManager.isXmas())
    {
        TI.drawImage(xmasTree, 0, 0, xmasTree.width, xmasTree.height, titlecw * .41, titlech * .03, titlecw * .075, titlech * .18);
    }
    TI.fillStyle = "#FFFFFF";
    var versionText = "v" + ((version - 100) / 100).toFixed(2) + buildLetter;
    TI.fillText(versionText, titlecw - TI.measureText(versionText).width, titlech - 2);

    if(checks[6] != 0)
    {
        TI.fillStyle = "#FFFFFF";
        if(lgame != 0)
        {
            TI.fillText(_("Please Refresh the Game!"), titlecw * .36, titlech * .46);
        }
        document.getElementById("Gi").style.visibility = "visible";
    }

    TI.drawImage(Logo, 0, 0, Logo.width, Logo.height, titlecw * .55, titlech * .02, titlecw * .5, titlech * .5)

    for(var t = 0; t < 50; t++)
    {
        if(Math.random() < 0.5)
        {
            if(lights[t + 1] > lights[t]) {lights[t]++} else {lights[t]--;}
            if(lights[t] < 10 && Math.floor(Math.random() * 30) > 10) {lights[t] += 2;}
            if(t < 10 || t > 40) {if(Math.floor(Math.random() * 30) > 10) {lights[t] += 2;} }
            lights[t] = lights[t] + lightlogic[Math.floor(Math.random() * 38)];
            if(lights[t] > 28) {lights[t] = 28;} else if(lights[t] < 1) {lights[t] = 1;} else { }
        }
        TI.drawImage(titlelight, 0, 0, 3, 10, titlecw * (.718 + (.003 * t)), titlech * (-.11 + (lights[t] / 100)), titlecw * .003, titlech * (.29 - (lights[t] / 100)));
    }

    TI.drawImage(homeFrame, 0, 0, homeFrame.width, homeFrame.height, titlecw * .631, titlech * .5, titlecw * (.38 * .85), titlech * (.44 * .85))

    for(var s = 0; s < 3; s++)
    {
        // Save options button: manage save icon for filled slots, import icon for empty slots
        var slotIcon = (s < RSc) ? manageSaveb : importb;
        TI.drawImage(slotIcon, 0, 0, slotIcon.width, slotIcon.height, Math.floor(titlecw * .50), (Math.floor(titlech * .22) + (s * Math.floor(titlech * .175))) + s + Math.floor(titlech * .13), 35, 35);
    }

    for(var l = 0; l < RSc; l++)
    {
        addl = 0;

        TI.font = "17px Verdana";
        if(saveButtons[l] > 0)
        {
            TI.fillStyle = "#FFDF00";
        }
        TI.fillText(sids[l], titlecw * (.05 + addl), titlech * (.325 + (l * .175)));
        TI.fillText(beautifynum(parseInt(saves[l][1])) + " Km", titlecw * (.05 + addl), titlech * (.35 + (l * .175)));
        TI.fillText("$" + beautifynum(saves[l][0]), titlecw * (.05 + addl), titlech * (.375 + (l * .175)));
        TI.fillText(beautifynum(Math.ceil(saves[l][81] / 60)) + " " + _("mins"), titlecw * (.05 + addl), titlech * (.4 + (l * .175)));
        TI.fillStyle = "#FFFFFF";

        try
        {
            if(saveButtons[l] > 0) //animate on hover
            {
                TI.drawImage(getDrillEquipById(parseInt(saves[l][5])).worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, titlecw * (.3 + addl), titlech * (.3 + (l * .175)), titlecw * .09, titlech * .125);
                TI.drawImage(getDrillEquipById(parseInt(saves[l][4])).worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, titlecw * (.3 + addl), titlech * (.3 + (l * .175)), titlecw * .09, titlech * .125);
            }
            else
            {
                TI.drawImage(getDrillEquipById(parseInt(saves[l][5])).worldAsset, 0, 0, 168, 158, titlecw * (.3 + addl), titlech * (.3 + (l * .175)), titlecw * .09, titlech * .125);
                TI.drawImage(getDrillEquipById(parseInt(saves[l][4])).worldAsset, 0, 0, 168, 158, titlecw * (.3 + addl), titlech * (.3 + (l * .175)), titlecw * .09, titlech * .125);
            }
        }
        catch(e)
        {
            console.error(e);
        }
    }

    // Render empty slots with "Click to create new game" text
    for(var e = RSc; e < 3; e++)
    {
        TI.font = "18px Verdana";
        TI.fillStyle = "#888888";
        TI.textBaseline = "top";
        TI.textAlign = "left";
        TI.fillText(_("Click to create new game"), titlecw * .05, titlech * (.35 + (e * .175)));
        TI.fillStyle = "#FFFFFF";
    }

    TI.font = "18px Verdana";
}

function initFoundArray(numberOfDepthsVisible)
{
    found = [];
    for(var i = 0; i < numberOfDepthsVisible; ++i)
    {
        found.push([[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])
    }
}