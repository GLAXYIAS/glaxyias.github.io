function handle(delta)
{
    if(windowState[14] < 2)
    {
        var magnitude = (keysPressed.hasOwnProperty("Control")) ? 5 : 1;
        if(delta < 0)
        {
            changeViewedDepth(magnitude);
        }
        else
        {
            changeViewedDepth((-1 * magnitude));
        }
    }
    else
    {
        if(delta < 0)
        {
            eventlogScroll++;
        }
        else
        {
            eventlogScroll--;
        }
        if(windowState[14] == 2)
        {
            if(eventlogScroll > eventlog.length - MAX_EVENT_LOG_SIZE)
            {
                eventlogScroll = eventlog.length - MAX_EVENT_LOG_SIZE;
            }
        }
        else if(windowState[14] == 3)
        {
            if(eventlogScroll > consoleLog.length - MAX_EVENT_LOG_SIZE)
            {
                eventlogScroll = consoleLog.length - MAX_EVENT_LOG_SIZE;
            }
        }
        if(eventlogScroll < 0)
        {
            eventlogScroll = 0;
        }
    }
    afk = 15;
}

function wheel(event)
{
    var delta = 0;
    if(!event)
    {
        event = window.event;
    }
    if(event.wheelDelta)
    {
        delta = event.wheelDelta / 120;
    } else if(event.detail)
    {
        delta = -event.detail / 3;
    }
    if(delta)
    {
        handle(delta);
    }
    if(event.preventDefault)
    {
        event.preventDefault();
    }
    event.returnValue = false;
}

if(window.addEventListener)
{
    window.addEventListener('DOMMouseScroll', wheel, false);
}
// window.onmousewheel = document.onmousewheel = wheel;

document.onclick = function ()
{
    afk = 15;
    isWindowInFocus = 1;
}

window.onblur = function ()
{
    isWindowInFocus = 0;
    if(typeof (isSaveFileLoaded) != "undefined" && isSaveFileLoaded())
    {
        document.title = "Capacity: " + Math.floor(capacity * 100 / maxHoldingCapacity()) + "%";
    }
}

window.onisWindowInFocus = function ()
{
    isWindowInFocus = 1;
    document.title = "Mr.Mine";
}

function hideEquipInfo()
{
    hideDiv("INFOD");
}


function getMineralUpdateLockFunction(mineralNum)
{
    var functionToReturn = function ()
    {
        var amtToLock = document.getElementById("simpleInputFieldText").value;
        document.getElementById("simpleInputFieldText").value = "";

        var value = amtToLock.replace(/,/g, '');

        if(value.toLowerCase().includes("k")) value = amtToLock.replace(/k/gi, '000')
        else if(value.toLowerCase().includes("m")) value = amtToLock.replace(/m/gi, '000000')
        else if(value.toLowerCase().includes("b")) value = amtToLock.replace(/b/gi, '000000000')
        else if(value.toLowerCase().includes("t")) value = amtToLock.replace(/t/gi, '000000000000')
        else if(value.includes("q")) value = amtToLock.replace(/q/gi, '000000000000000')
        else if(value.includes("Q")) value = amtToLock.replace(/Q/gi, '000000000000000000')
        else if(value.includes("s")) value = amtToLock.replace(/s/gi, '000000000000000000000')
        else if(value.includes("S")) value = amtToLock.replace(/S/gi, '000000000000000000000000')

        value = parseInt(value);

        if(!isNaN(value) && value >= 0)
        {
            lockedMineralAmtsToSave[mineralNum] = value;
        } else
        {
            newNews(_("Error value entered is invalid"));
        }
        hideSimpleInput();
    };
    return functionToReturn;
}

if(!isMobile())
{
    document.getElementById('METALDETECTORPLACE').onmouseenter = function ()
    {
        var description = "";
        var header = "";
        if(metalDetectorStructure.level > 0)
        {
            header = _("Metal Detector Lvl.{0}", metalDetectorStructure.level);

            if(metalDetectorStructure.level == 1)
            {
                description = _("Blinks when a chest is detected");
            }
            else if(metalDetectorStructure.level == 2)
            {
                description = metalDetectorStructure.structureDescription[1];
            }
            else if(metalDetectorStructure.level == 3)
            {
                description = metalDetectorStructure.structureDescription[2];
            }
            else if(metalDetectorStructure.level == 4)
            {
                description = metalDetectorStructure.structureDescription[3];
            }
            else if(metalDetectorStructure.level == 5)
            {
                description = metalDetectorStructure.structureDescription[4];
            }
            else if(metalDetectorStructure.level == 6)
            {
                description = metalDetectorStructure.structureDescription[5];
            }
        }

        if(metalDetectorStructure.level > 0 && chestCollectorChanceStructure.level > 0)
        {
            description += "<br><br>" + "<b><center>" + _("Chest Collection Chance Lvl.{0}", chestCollectorChanceStructure.level) + "</center></b>";
            description += "<br>" + _("{0}% of chest spawns will be collected", chestCollectorChanceStructure.statValueForCurrentLevel());
        }
        else if(chestCollectorChanceStructure.level > 0 && metalDetectorStructure.level == 0)
        {
            header = _("Chest Collection Chance Lvl.{0}", chestCollectorChanceStructure.level)
            description = _("{0}% of chest spawns will be collected", chestCollectorChanceStructure.statValueForCurrentLevel());
        }

        if(chestCompressorStructure.level > 0)
        {
            description += "<br><br>" + "<b><center>" + _("Chest Compressor Lvl.{0}", chestCompressorStructure.level) + "</center></b>";
            description += "<br>" + _("Compresses {0} basic chests into one gold chest when used", chestCompressorStructure.statValueForCurrentLevel());
        }

        if(header != "")
        {
            showTooltip(header, description);
        }
    }

    document.getElementById('METALDETECTORPLACE').onmouseleave = function () {hideTooltip();}

    document.getElementById('METALDETECTORPLACE').onclick = function ()
    {
        if(chestCollectorStorageStructure.level > 0)
        {
            openUi(ChestCollectorWindow);
        }
    }

    document.getElementById('PLACE1').onclick = function () {if(!isMobile()) openUi(SellWindow, null, EARTH_INDEX);}
    document.getElementById('PLACE2').onclick = function () {if(!isMobile()) openUi(HireWindow, null, EARTH_INDEX);}

    document.getElementById('PLACE3').onclick = function () {if(!isMobile()) openUi(CraftingWindow);}
    document.getElementById('CLOSEb').onclick = function ()
    {
        buyui(0);
        editmode = 0;
    }

    document.getElementById('PLACE4').onclick = function () {if(!isMobile()) openUi(QuestWindow);}

    document.getElementById('ARCHPLACE').onclick = function () {if(!isMobile() && hasUnlockedScientists) {openUi(ScientistsWindow);} }
    document.getElementById('drillHitbox').onmouseover = function ()
    {
        if(battleManager.isStalledDueToBoss()) {showTooltip(_("Drill Stalled"), _("Defeat the boss at {0}km to progress.", battleManager.depthOfDeepestBossReached()), "82%", "70%");}
        if(isWaitingForLiftoff()) {showTooltip(_("Drill"), _("Your drill is waiting for your command to lift off."), "82%", "75%");}
        if(depth < 20) {showTooltip(_("Drill"), _("Upgrade your drill by crafting blueprints. Upgrading your drill increases its digging speed."), "82%", "75%");}
    }
    document.getElementById('drillHitbox').onmouseout = function ()
    {
        hideTooltip();
    }
    document.getElementById('drillHitbox').onmousedown = function ()
    {
        if(!isMobile()) openUi(CraftingWindow, null, EARTH_INDEX);
    }
    document.getElementById('bossLevel').onclick = function ()
    {
        if(!battleManager.isBossBattleActive && !battleManager.battleActive)
        {
            battleManager.startBossBattle();
        }
    }

    document.getElementById('LOGGERTAB1').onclick = function () {windowState[11] = 1;}
    document.getElementById('LOGGERTAB2').onclick = function () {windowState[11] = 2;}
}

function confirmRerollTrade(worldIndex)
{
    if(tickets > 0)
    {
        showConfirmationPrompt(
            _("Are you sure you want to pay 1 ticket to refresh your trade options?"),
            _("Yes"),
            function ()
            {
                if(tickets <= 0) return;
                generateTrade(worldIndex);
                hideSimpleInput();
                subtractTickets(1, ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.TRADE_REROLL);
            },
            _("Cancel"),
            null,
            null,
            false
        );
    }
    else
    {
        showConfirmationPrompt(
            _("Not enough tickets. You need 1 ticket."),
            _("BUY TICKETS"),
            function ()
            {
                openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                hideSimpleInput();
            },
            _("Cancel"));
    }
}

function confirmExtendTrade(worldIndex)
{
    if(tickets > 0)
    {
        showConfirmationPrompt(
            _("Are you sure you want to pay 1 ticket to extend the trade duration by 1 hour?"),
            _("Yes"),
            function ()
            {
                if(tickets <= 0) return;
                extendTradeDuration(worldIndex, 3600);
                hideSimpleInput();
                subtractTickets(1, ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.TRADE_EXTENSION);
            },
            _("Cancel"),
            null,
            null,
            false
        );
    }
    else
    {
        showConfirmationPrompt(
            _("Not enough tickets. You need 1 ticket."),
            _("BUY TICKETS"),
            function ()
            {
                openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                hideSimpleInput();
            },
            _("Cancel"),
            null,
            null,
            false
        );
    }
}

var tempConfirmRerollIndex = -1;

function confirmRerollExcavations(scientistIndex)
{
    if(tickets > 0)
    {
        tempConfirmRerollIndex = scientistIndex;
        showConfirmationPrompt(_("Are you sure you want to pay 1 ticket to refresh your excavation options?"), _("Yes"), function ()
        {
            if(tickets <= 0) return;
            rerollExcavations();
            hideSimpleInput();
        }, _("Cancel"),
            null,
            null,
            false
        );
    }
    else
    {
        showConfirmationPrompt(
            _("Not enough tickets. You need 1 ticket."),
            _("BUY TICKETS"),
            function ()
            {
                openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                hideSimpleInput();
            },
            _("Cancel"),
            null,
            null,
            false
        );
    }
}

function rerollExcavations()
{
    if(tickets > 0 && tempConfirmRerollIndex > -1)
    {
        var scientistIndex = tempConfirmRerollIndex;
        var activeScientist = currentScientists.scientists[scientistIndex];
        if(!isOnActiveExcavation(scientistIndex) && !isScientistDead(scientistIndex))
        {
            subtractTickets(1, ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.EXCAVATION_REROLL);
            generateExcavationChoices(scientistIndex);
            tempConfirmRerollIndex = -1;
        }
    }
}

var tempConfirmForfeitIndex = -1;

function confirmForfeitExcavation(scientistIndex)
{
    tempConfirmForfeitIndex = scientistIndex;
    onConfirmedForfeitExcavation();

}

function onConfirmedForfeitExcavation()
{
    if(tempConfirmForfeitIndex > -1)
    {
        forfeitRewardForFinishedExcavation(tempConfirmForfeitIndex, true);
        tempConfirmForfeitIndex = -1;
    }
}

function showTooltipForRelic(relicIndex)
{
    var rewardId = equippedRelics[relicIndex];
    if(rewardId != -1)
    {
        var rewardInfo = excavationRewards[rewardId];
        showTooltip(rewardInfo.name, getRewardDescription(rewardId));
    }
}

function showTooltipForUnequippedRelic(relicIndex, x = 0, y = 0)
{
    var rewardInfo = excavationRewards[relicIndex];
    var description = "";
    if(rewardInfo.hasOwnProperty("description"))
    {
        description = rewardInfo.description;
    }
    else
    {
        description = rewardInfo.statType.getTooltip(rewardInfo.amount);
    }
    showTooltip(rewardInfo.name, description, x, y);
}

if(!isMobile())
{
    document.getElementById('GARAGE').onmouseover = function () {isHoveringOverGarage = 1;}
    document.getElementById('GARAGE').onmouseout = function () {isHoveringOverGarage = 0;}
    document.getElementById('GARAGE').onclick = function ()
    {
        if(!isMobile()) openUi(PurchaseWindow);

        if(document.getElementById('buyoptions') != null)
        {
            document.getElementById('buyoptions').innerHTML = paypalhtml;
            document.getElementById("BTC1").style.visibility = "hidden";
            document.getElementById("BTC1").style.zIndex = -2;
            document.getElementById("BTC2").style.visibility = "hidden";
            document.getElementById("BTC2").style.zIndex = -2;
            document.getElementById("REDEEM").style.visibility = "hidden";
            document.getElementById("REDEEM").style.zIndex = -2;
        }
    }

    if(document.getElementById('BTC1') != null)
    {
        document.getElementById('BTC1').onclick = function ()
        {
            if(tickets > 0)
            {
                if(depth < 40)
                {
                    var depthu = 40;
                } else
                {
                    var depthu = depth;
                }
                chestService.grantChest(0, Chest.purchased);
                subtractTickets(1, ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.BASIC_CHEST_PURCHASE);
            }
            else
            {
                showConfirmationPrompt(
                    _("Not enough tickets. You need 1 ticket."),
                    _("BUY TICKETS"),
                    function ()
                    {
                        openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                        hideSimpleInput();
                    },
                    _("Cancel"));
            }
        }
        document.getElementById('BTC2').onclick = function ()
        {
            if(tickets > 9)
            {
                chestService.grantChest(0, Chest.purchased, ChestType.gold);
                subtractTickets(10, ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.GOLD_CHEST_PURCHASE);
            }
            else
            {
                showConfirmationPrompt(
                    _("Not enough tickets. You need 10 tickets. You have {0} tickets.", tickets),
                    _("BUY TICKETS"),
                    function ()
                    {
                        openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                        hideSimpleInput();
                    },
                    _("Cancel"));
            }
        }
    }

    if(document.getElementById('REDEEM') != null)
    {
        document.getElementById('REDEEM').onclick = function ()
        {
            showRedeemPrompt();
        }
    }

    document.getElementById('CLOSEl2').onclick = function () {logui(0);}

    document.getElementById('steamCloudBackup').onclick = function () {displayCloudBackups();}
    document.getElementById('steamCloudBackup').onmouseover = function () {showTooltipForDiv(_("Access Steam Backups"), "", "steamCloudBackup");}
    document.getElementById('steamCloudBackup').onmouseout = function () {hideTooltip();}
    document.getElementById('languageSelection').onclick = function () {showLanguageSelection();}
    document.getElementById('languageSelection').onmouseover = function () {showTooltipForDiv(_("Select Language") + " (Select Language)", "", "languageSelection");}
    document.getElementById('languageSelection').onmouseout = function () {hideTooltip();}
    document.getElementById('CLOSEhe').onclick = function () {helpui(0);}

    document.getElementById('PAGES1').onclick = function () {drillPurchasePage = 0;}
    document.getElementById('PAGES2').onclick = function () {drillPurchasePage = 1;}
    document.getElementById('PAGES3').onclick = function () {drillPurchasePage = 2;}
    document.getElementById('PAGES4').onclick = function () {drillPurchasePage = 3;}
    document.getElementById('PAGES5').onclick = function () {drillPurchasePage = 4;}
    document.getElementById('PAGES6').onclick = function () {drillPurchasePage = 5;}

    document.getElementById('L5a').onclick = function () {onWorkerClicked(5, 1);}
    document.getElementById('L5b').onclick = function () {onWorkerClicked(5, 2);}
    document.getElementById('L5c').onclick = function () {onWorkerClicked(5, 3);}
    document.getElementById('L5d').onclick = function () {onWorkerClicked(5, 4);}
    document.getElementById('L5e').onclick = function () {onWorkerClicked(5, 5);}
    document.getElementById('L5f').onclick = function () {onWorkerClicked(5, 6);}
    document.getElementById('L5g').onclick = function () {onWorkerClicked(5, 7);}
    document.getElementById('L5h').onclick = function () {onWorkerClicked(5, 8);}
    document.getElementById('L5i').onclick = function () {onWorkerClicked(5, 9);}
    document.getElementById('L5j').onclick = function () {onWorkerClicked(5, 10);}
    document.getElementById('L4a').onclick = function () {onWorkerClicked(4, 1);}
    document.getElementById('L4b').onclick = function () {onWorkerClicked(4, 2);}
    document.getElementById('L4c').onclick = function () {onWorkerClicked(4, 3);}
    document.getElementById('L4d').onclick = function () {onWorkerClicked(4, 4);}
    document.getElementById('L4e').onclick = function () {onWorkerClicked(4, 5);}
    document.getElementById('L4f').onclick = function () {onWorkerClicked(4, 6);}
    document.getElementById('L4g').onclick = function () {onWorkerClicked(4, 7);}
    document.getElementById('L4h').onclick = function () {onWorkerClicked(4, 8);}
    document.getElementById('L4i').onclick = function () {onWorkerClicked(4, 9);}
    document.getElementById('L4j').onclick = function () {onWorkerClicked(4, 10);}
    document.getElementById('L3a').onclick = function () {onWorkerClicked(3, 1);}
    document.getElementById('L3b').onclick = function () {onWorkerClicked(3, 2);}
    document.getElementById('L3c').onclick = function () {onWorkerClicked(3, 3);}
    document.getElementById('L3d').onclick = function () {onWorkerClicked(3, 4);}
    document.getElementById('L3e').onclick = function () {onWorkerClicked(3, 5);}
    document.getElementById('L3f').onclick = function () {onWorkerClicked(3, 6);}
    document.getElementById('L3g').onclick = function () {onWorkerClicked(3, 7);}
    document.getElementById('L3h').onclick = function () {onWorkerClicked(3, 8);}
    document.getElementById('L3i').onclick = function () {onWorkerClicked(3, 9);}
    document.getElementById('L3j').onclick = function () {onWorkerClicked(3, 10);}
    document.getElementById('L2a').onclick = function () {onWorkerClicked(2, 1);}
    document.getElementById('L2b').onclick = function () {onWorkerClicked(2, 2);}
    document.getElementById('L2c').onclick = function () {onWorkerClicked(2, 3);}
    document.getElementById('L2d').onclick = function () {onWorkerClicked(2, 4);}
    document.getElementById('L2e').onclick = function () {onWorkerClicked(2, 5);}
    document.getElementById('L2f').onclick = function () {onWorkerClicked(2, 6);}
    document.getElementById('L2g').onclick = function () {onWorkerClicked(2, 7);}
    document.getElementById('L2h').onclick = function () {onWorkerClicked(2, 8);}
    document.getElementById('L2i').onclick = function () {onWorkerClicked(2, 9);}
    document.getElementById('L2j').onclick = function () {onWorkerClicked(2, 10);}
    document.getElementById('L1a').onclick = function () {onWorkerClicked(1, 1);}
    document.getElementById('L1b').onclick = function () {onWorkerClicked(1, 2);}
    document.getElementById('L1c').onclick = function () {onWorkerClicked(1, 3);}
    document.getElementById('L1d').onclick = function () {onWorkerClicked(1, 4);}
    document.getElementById('L1e').onclick = function () {onWorkerClicked(1, 5);}
    document.getElementById('L1f').onclick = function () {onWorkerClicked(1, 6);}
    document.getElementById('L1g').onclick = function () {onWorkerClicked(1, 7);}
    document.getElementById('L1h').onclick = function () {onWorkerClicked(1, 8);}
    document.getElementById('L1i').onclick = function () {onWorkerClicked(1, 9);}
    document.getElementById('L1j').onclick = function () {onWorkerClicked(1, 10);}
    document.getElementById('L5gap1').onclick = function () {clickedGap(5, 1);}
    document.getElementById('L5gap2').onclick = function () {clickedGap(5, 2);}
    document.getElementById('L5gap3').onclick = function () {clickedGap(5, 3);}
    document.getElementById('L5gap4').onclick = function () {clickedGap(5, 4);}
    document.getElementById('L5gap5').onclick = function () {clickedGap(5, 5);}
    document.getElementById('L5gap6').onclick = function () {clickedGap(5, 6);}
    document.getElementById('L5gap7').onclick = function () {clickedGap(5, 7);}
    document.getElementById('L5gap8').onclick = function () {clickedGap(5, 8);}
    document.getElementById('L5gap9').onclick = function () {clickedGap(5, 9);}
    document.getElementById('L5gap10').onclick = function () {clickedGap(5, 10);}
    document.getElementById('L5gap11').onclick = function () {clickedGap(5, 11);}
    document.getElementById('L4gap1').onclick = function () {clickedGap(4, 1);}
    document.getElementById('L4gap2').onclick = function () {clickedGap(4, 2);}
    document.getElementById('L4gap3').onclick = function () {clickedGap(4, 3);}
    document.getElementById('L4gap4').onclick = function () {clickedGap(4, 4);}
    document.getElementById('L4gap5').onclick = function () {clickedGap(4, 5);}
    document.getElementById('L4gap6').onclick = function () {clickedGap(4, 6);}
    document.getElementById('L4gap7').onclick = function () {clickedGap(4, 7);}
    document.getElementById('L4gap8').onclick = function () {clickedGap(4, 8);}
    document.getElementById('L4gap9').onclick = function () {clickedGap(4, 9);}
    document.getElementById('L4gap10').onclick = function () {clickedGap(4, 10);}
    document.getElementById('L4gap11').onclick = function () {clickedGap(4, 11);}
    document.getElementById('L3gap1').onclick = function () {clickedGap(3, 1);}
    document.getElementById('L3gap2').onclick = function () {clickedGap(3, 2);}
    document.getElementById('L3gap3').onclick = function () {clickedGap(3, 3);}
    document.getElementById('L3gap4').onclick = function () {clickedGap(3, 4);}
    document.getElementById('L3gap5').onclick = function () {clickedGap(3, 5);}
    document.getElementById('L3gap6').onclick = function () {clickedGap(3, 6);}
    document.getElementById('L3gap7').onclick = function () {clickedGap(3, 7);}
    document.getElementById('L3gap8').onclick = function () {clickedGap(3, 8);}
    document.getElementById('L3gap9').onclick = function () {clickedGap(3, 9);}
    document.getElementById('L3gap10').onclick = function () {clickedGap(3, 10);}
    document.getElementById('L3gap11').onclick = function () {clickedGap(3, 11);}
    document.getElementById('L2gap1').onclick = function () {clickedGap(2, 1);}
    document.getElementById('L2gap2').onclick = function () {clickedGap(2, 2);}
    document.getElementById('L2gap3').onclick = function () {clickedGap(2, 3);}
    document.getElementById('L2gap4').onclick = function () {clickedGap(2, 4);}
    document.getElementById('L2gap5').onclick = function () {clickedGap(2, 5);}
    document.getElementById('L2gap6').onclick = function () {clickedGap(2, 6);}
    document.getElementById('L2gap7').onclick = function () {clickedGap(2, 7);}
    document.getElementById('L2gap8').onclick = function () {clickedGap(2, 8);}
    document.getElementById('L2gap9').onclick = function () {clickedGap(2, 9);}
    document.getElementById('L2gap10').onclick = function () {clickedGap(2, 10);}
    document.getElementById('L2gap11').onclick = function () {clickedGap(2, 11);}
    document.getElementById('L1gap1').onclick = function () {clickedGap(1, 1);}
    document.getElementById('L1gap2').onclick = function () {clickedGap(1, 2);}
    document.getElementById('L1gap3').onclick = function () {clickedGap(1, 3);}
    document.getElementById('L1gap4').onclick = function () {clickedGap(1, 4);}
    document.getElementById('L1gap5').onclick = function () {clickedGap(1, 5);}
    document.getElementById('L1gap6').onclick = function () {clickedGap(1, 6);}
    document.getElementById('L1gap7').onclick = function () {clickedGap(1, 7);}
    document.getElementById('L1gap8').onclick = function () {clickedGap(1, 8);}
    document.getElementById('L1gap9').onclick = function () {clickedGap(1, 9);}
    document.getElementById('L1gap10').onclick = function () {clickedGap(1, 10);}
    document.getElementById('L1gap11').onclick = function () {clickedGap(1, 11);}

    document.getElementById('L5a').ondblclick = function () {onWorkerDoubleClicked(5, 1);}
    document.getElementById('L5b').ondblclick = function () {onWorkerDoubleClicked(5, 2);}
    document.getElementById('L5c').ondblclick = function () {onWorkerDoubleClicked(5, 3);}
    document.getElementById('L5d').ondblclick = function () {onWorkerDoubleClicked(5, 4);}
    document.getElementById('L5e').ondblclick = function () {onWorkerDoubleClicked(5, 5);}
    document.getElementById('L5f').ondblclick = function () {onWorkerDoubleClicked(5, 6);}
    document.getElementById('L5g').ondblclick = function () {onWorkerDoubleClicked(5, 7);}
    document.getElementById('L5h').ondblclick = function () {onWorkerDoubleClicked(5, 8);}
    document.getElementById('L5i').ondblclick = function () {onWorkerDoubleClicked(5, 9);}
    document.getElementById('L5j').ondblclick = function () {onWorkerDoubleClicked(5, 10);}
    document.getElementById('L4a').ondblclick = function () {onWorkerDoubleClicked(4, 1);}
    document.getElementById('L4b').ondblclick = function () {onWorkerDoubleClicked(4, 2);}
    document.getElementById('L4c').ondblclick = function () {onWorkerDoubleClicked(4, 3);}
    document.getElementById('L4d').ondblclick = function () {onWorkerDoubleClicked(4, 4);}
    document.getElementById('L4e').ondblclick = function () {onWorkerDoubleClicked(4, 5);}
    document.getElementById('L4f').ondblclick = function () {onWorkerDoubleClicked(4, 6);}
    document.getElementById('L4g').ondblclick = function () {onWorkerDoubleClicked(4, 7);}
    document.getElementById('L4h').ondblclick = function () {onWorkerDoubleClicked(4, 8);}
    document.getElementById('L4i').ondblclick = function () {onWorkerDoubleClicked(4, 9);}
    document.getElementById('L4j').ondblclick = function () {onWorkerDoubleClicked(4, 10);}
    document.getElementById('L3a').ondblclick = function () {onWorkerDoubleClicked(3, 1);}
    document.getElementById('L3b').ondblclick = function () {onWorkerDoubleClicked(3, 2);}
    document.getElementById('L3c').ondblclick = function () {onWorkerDoubleClicked(3, 3);}
    document.getElementById('L3d').ondblclick = function () {onWorkerDoubleClicked(3, 4);}
    document.getElementById('L3e').ondblclick = function () {onWorkerDoubleClicked(3, 5);}
    document.getElementById('L3f').ondblclick = function () {onWorkerDoubleClicked(3, 6);}
    document.getElementById('L3g').ondblclick = function () {onWorkerDoubleClicked(3, 7);}
    document.getElementById('L3h').ondblclick = function () {onWorkerDoubleClicked(3, 8);}
    document.getElementById('L3i').ondblclick = function () {onWorkerDoubleClicked(3, 9);}
    document.getElementById('L3j').ondblclick = function () {onWorkerDoubleClicked(3, 10);}
    document.getElementById('L2a').ondblclick = function () {onWorkerDoubleClicked(2, 1);}
    document.getElementById('L2b').ondblclick = function () {onWorkerDoubleClicked(2, 2);}
    document.getElementById('L2c').ondblclick = function () {onWorkerDoubleClicked(2, 3);}
    document.getElementById('L2d').ondblclick = function () {onWorkerDoubleClicked(2, 4);}
    document.getElementById('L2e').ondblclick = function () {onWorkerDoubleClicked(2, 5);}
    document.getElementById('L2f').ondblclick = function () {onWorkerDoubleClicked(2, 6);}
    document.getElementById('L2g').ondblclick = function () {onWorkerDoubleClicked(2, 7);}
    document.getElementById('L2h').ondblclick = function () {onWorkerDoubleClicked(2, 8);}
    document.getElementById('L2i').ondblclick = function () {onWorkerDoubleClicked(2, 9);}
    document.getElementById('L2j').ondblclick = function () {onWorkerDoubleClicked(2, 10);}
    document.getElementById('L1a').ondblclick = function () {onWorkerDoubleClicked(1, 1);}
    document.getElementById('L1b').ondblclick = function () {onWorkerDoubleClicked(1, 2);}
    document.getElementById('L1c').ondblclick = function () {onWorkerDoubleClicked(1, 3);}
    document.getElementById('L1d').ondblclick = function () {onWorkerDoubleClicked(1, 4);}
    document.getElementById('L1e').ondblclick = function () {onWorkerDoubleClicked(1, 5);}
    document.getElementById('L1f').ondblclick = function () {onWorkerDoubleClicked(1, 6);}
    document.getElementById('L1g').ondblclick = function () {onWorkerDoubleClicked(1, 7);}
    document.getElementById('L1h').ondblclick = function () {onWorkerDoubleClicked(1, 8);}
    document.getElementById('L1i').ondblclick = function () {onWorkerDoubleClicked(1, 9);}
    document.getElementById('L1j').ondblclick = function () {onWorkerDoubleClicked(1, 10);}
}

function hidedebug()
{
    hideDiv("DebugH");
}

// Upper bound for account button text. Caps the height-derived size so short English
// labels don't balloon and so every screen lands on the same size (a screen full of short
// words won't render larger than one with long words) — keeps the account UI consistent.
var ACCOUNT_BUTTON_MAX_FONT_SIZE = 20;

// Size all .account-btn text in a screen to a single shared font size so every button
// reads at the same size. Starts from a height-based cap (text nearly as tall as the
// button, clamped to maxFontSize) and shrinks until the widest button's text fits its
// content width, then applies that one size to every button. Measures against the content
// box (client size minus padding) so the text stays clear of the button's beveled edges.
// maxFontSize (optional) overrides the default cap for a given screen.
function fitAccountButtonsText(container, maxFontSize)
{
    if(!container) return;
    var fontCap = (typeof maxFontSize === 'number' && maxFontSize > 0)
        ? maxFontSize
        : ACCOUNT_BUTTON_MAX_FONT_SIZE;
    // Defer so the menu can render first; never block the open path on this work.
    var run = function ()
    {
        try
        {
            var buttons = container.querySelectorAll('.account-btn');
            if(!buttons.length) return;
            var measureCanvas = document.createElement('canvas');
            var measureCtx = measureCanvas.getContext('2d');

            // Read phase: gather sizing/font info up front to minimize layout thrashing.
            var plans = [];
            for(var i = 0; i < buttons.length; i++)
            {
                var btn = buttons[i];
                btn.style.whiteSpace = 'nowrap';
                btn.style.lineHeight = '';
                btn.style.fontSize = '';
                var cs = window.getComputedStyle(btn);
                var paddingX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
                var availableWidth = btn.clientWidth - paddingX;
                // Base the height cap on the FULL button height, not the content box.
                // These buttons use a thick border-image whose layout border-width leaves
                // an almost-zero-height content box, so clientHeight would force a tiny
                // font. Text isn't clipped, so sizing to the whole button (and letting it
                // overflow the tiny content box) renders correctly and centered. The
                // width-shrink loop below pulls the font back down for longer localized
                // strings so they never overflow horizontally.
                var buttonHeight = btn.offsetHeight;
                if(availableWidth <= 0 || buttonHeight <= 0) continue;
                var maxFontSize = Math.max(7, Math.min(fontCap, Math.round(buttonHeight * 0.55)));
                plans.push({
                    btn: btn,
                    maxFontSize: maxFontSize,
                    availableWidth: availableWidth,
                    fontWeight: cs.fontWeight || 'normal',
                    fontFamily: cs.fontFamily || 'sans-serif',
                    text: btn.textContent || ''
                });
            }

            if(!plans.length) return;

            // Measure phase: find one shared font size for the whole screen so every
            // button reads at the same size (the largest that fits them all). Start from
            // the smallest height-based cap in the group, then shrink until the widest
            // button's text fits its content width on a single line.
            var minFontSize = 7;
            var uniformSize = plans[0].maxFontSize;
            for(var m = 1; m < plans.length; m++)
            {
                if(plans[m].maxFontSize < uniformSize) uniformSize = plans[m].maxFontSize;
            }
            while(uniformSize > minFontSize)
            {
                var allFit = true;
                for(var j = 0; j < plans.length; j++)
                {
                    var p = plans[j];
                    measureCtx.font = p.fontWeight + ' ' + uniformSize + 'px ' + p.fontFamily;
                    if(measureCtx.measureText(p.text).width > p.availableWidth)
                    {
                        allFit = false;
                        break;
                    }
                }
                if(allFit) break;
                uniformSize -= 1;
            }

            // Write phase: apply the shared size to every button. If a button's text
            // still overflows at the floor size (extreme translation), let just that
            // button wrap to two lines — the font size stays uniform across the screen.
            for(var w = 0; w < plans.length; w++)
            {
                var pl = plans[w];
                pl.btn.style.fontSize = uniformSize + 'px';
                measureCtx.font = pl.fontWeight + ' ' + uniformSize + 'px ' + pl.fontFamily;
                if(measureCtx.measureText(pl.text).width > pl.availableWidth)
                {
                    pl.btn.style.whiteSpace = 'normal';
                    pl.btn.style.lineHeight = '1';
                }
            }
        }
        catch(err)
        {
            console.warn('fitAccountButtonsText failed:', err);
        }
    };
    if(typeof requestAnimationFrame === 'function')
    {
        requestAnimationFrame(run);
    }
    else
    {
        run();
    }
}
window.fitAccountButtonsText = fitAccountButtonsText;

// Fit a SINGLE account button's text to its own width (shrinking from the same
// height-based cap as the shared fit). Used when one button's label changes at
// runtime (e.g. "Sign In" -> "Signing in...") so only that button resizes to keep
// the longer text in bounds, leaving the other buttons at their shared size.
function fitAccountButtonText(btn, maxFontSize)
{
    if(!btn) return;
    var fontCap = (typeof maxFontSize === 'number' && maxFontSize > 0)
        ? maxFontSize
        : ACCOUNT_BUTTON_MAX_FONT_SIZE;
    var run = function ()
    {
        try
        {
            btn.style.whiteSpace = 'nowrap';
            btn.style.lineHeight = '';
            btn.style.fontSize = '';
            var cs = window.getComputedStyle(btn);
            var paddingX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
            var availableWidth = btn.clientWidth - paddingX;
            var buttonHeight = btn.offsetHeight;
            if(availableWidth <= 0 || buttonHeight <= 0) return;
            var measureCanvas = document.createElement('canvas');
            var measureCtx = measureCanvas.getContext('2d');
            var fontWeight = cs.fontWeight || 'normal';
            var fontFamily = cs.fontFamily || 'sans-serif';
            var text = btn.textContent || '';
            var minFontSize = 7;
            var size = Math.max(minFontSize, Math.min(fontCap, Math.round(buttonHeight * 0.55)));
            while(size > minFontSize)
            {
                measureCtx.font = fontWeight + ' ' + size + 'px ' + fontFamily;
                if(measureCtx.measureText(text).width <= availableWidth) break;
                size -= 1;
            }
            btn.style.fontSize = size + 'px';
            measureCtx.font = fontWeight + ' ' + size + 'px ' + fontFamily;
            if(measureCtx.measureText(text).width > availableWidth)
            {
                btn.style.whiteSpace = 'normal';
                btn.style.lineHeight = '1';
            }
        }
        catch(err)
        {
            console.warn('fitAccountButtonText failed:', err);
        }
    };
    if(typeof requestAnimationFrame === 'function')
    {
        requestAnimationFrame(run);
    }
    else
    {
        run();
    }
}
window.fitAccountButtonText = fitAccountButtonText;

// Scale the account points value down for large amounts so a long number
// (e.g. 9,999,999) doesn't stretch the points box. Small values keep the design
// font size and it shrinks gradually as the text gets wider. Canvas-measured, so
// it works even before the screen is laid out / visible.
function fitPointsValueText()
{
    try
    {
        var el = document.getElementById('accountPointsValue');
        if(!el) return;
        var cs = window.getComputedStyle(el);
        // Cache the CSS design size the first time, before any inline shrink, so
        // repeated opens always re-fit from the original size (not a shrunk one).
        var baseSize = parseFloat(el.dataset.baseFontSize || '');
        if(!baseSize)
        {
            baseSize = parseFloat(cs.fontSize) || 44;
            el.dataset.baseFontSize = baseSize;
        }
        var maxWidth = isMobile() ? 120 : 150; // glyph-advance budget beside the points icon
        var canvas = fitPointsValueText._canvas || (fitPointsValueText._canvas = document.createElement('canvas'));
        var ctx = canvas.getContext('2d');
        ctx.font = (cs.fontWeight || '900') + ' ' + baseSize + 'px ' + (cs.fontFamily || 'Matiz');
        var w = ctx.measureText(el.textContent || '').width;
        var size = (w > maxWidth) ? Math.max(20, Math.floor(baseSize * maxWidth / w)) : baseSize;
        el.style.fontSize = size + 'px';
    }
    catch(err)
    {
        console.warn('fitPointsValueText failed:', err);
    }
}
window.fitPointsValueText = fitPointsValueText;

if(!isMobile())
{
    document.getElementById('H2').onclick = function ()
    {
        windowState[5] = 1;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H3').onclick = function ()
    {
        windowState[5] = 2;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H4').onclick = function ()
    {
        windowState[5] = 3;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H5').onclick = function ()
    {
        windowState[5] = 4;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H6').onclick = function ()
    {
        windowState[5] = 5;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H7').onclick = function ()
    {
        windowState[5] = 6;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H8').onclick = function ()
    {
        windowState[5] = 7;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H9').onclick = function ()
    {
        windowState[5] = 8;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        hidedebug();
    }
    document.getElementById('H10').onclick = function ()
    {
        windowState[5] = 9;
        document.getElementById('H17').innerHTML = helphtml[0][7];
        hidedebug();
    }
    document.getElementById('H11').onclick = function ()
    {
        windowState[5] = 10;
        document.getElementById('H17').innerHTML = helphtml[0][6];
        hidedebug();
    }
    document.getElementById('H12').onclick = function ()
    {
        windowState[5] = 11;
        document.getElementById('H17').innerHTML = helphtml[0][0];
        document.getElementById("DebugH").style.visibility = "visible";
        document.getElementById("DebugH").style.zIndex = 2;
    }
    document.getElementById('H13').onclick = function ()
    {
        windowState[5] = 12;
        document.getElementById('H17').innerHTML = helphtml[0][5];
        hidedebug();
    }
    document.getElementById('H14').onclick = function ()
    {
        windowState[5] = 13;
        document.getElementById('H17').innerHTML = "<font size='2'>" + document.getElementById('Gi').innerHTML + "</font>";
        hidedebug();
    }
    document.getElementById('H15').onclick = function ()
    {
        windowState[5] = 14;
        document.getElementById('H17').innerHTML = helphtml[0][3];
        hidedebug();
    }
    document.getElementById('H16').onclick = function ()
    {
        windowState[5] = 15;
        document.getElementById('H17').innerHTML = helphtml[0][2];
        hidedebug();
    }

    document.getElementById('G1').onclick = function ()
    {
        if(checks[6] > 0 && lgame == 0 && isGameReady)
        {
            if(0 >= RSc)
            {
                // Empty slot - create new game
                openNewGamePrompt();
            }
            else
            {
                // Load existing save
                document.getElementById('WRAPPERD').style.background = 'url("gui2.png")';
                document.getElementById('WRAPPERD').style.backgroundSize = '100% 100%';
                loadGame(0);
            }
            saveButtons[0] = 0;
        }
    }
    document.getElementById('G2').onclick = function ()
    {
        if(checks[6] > 0 && lgame == 0 && isGameReady)
        {
            if(1 >= RSc)
            {
                // Empty slot - create new game
                openNewGamePrompt();
            }
            else
            {
                // Load existing save
                document.getElementById('WRAPPERD').style.background = 'url("gui2.png")';
                document.getElementById('WRAPPERD').style.backgroundSize = '100% 100%';
                loadGame(1);
            }
            saveButtons[1] = 0;
        }
    }
    document.getElementById('G3').onclick = function ()
    {
        if(checks[6] > 0 && lgame == 0 && isGameReady)
        {
            if(2 >= RSc)
            {
                // Empty slot - create new game
                openNewGamePrompt();
            }
            else
            {
                // Load existing save
                document.getElementById('WRAPPERD').style.background = 'url("gui2.png")';
                document.getElementById('WRAPPERD').style.backgroundSize = '100% 100%';
                loadGame(2);
            }
            saveButtons[2] = 0;
        }
    }

    // Initialize account button state based on platform restrictions
    if(typeof platform !== 'undefined' && platform.isAccountRestricted())
    {
        const accountBtn = document.getElementById('playsaurusAccountBtn');
        if(accountBtn)
        {
            accountBtn.classList.add('account-restricted');
        }
    }

    document.getElementById('playsaurusAccountBtn').onclick = function ()
    {
        // Check if account is restricted on this platform
        if(typeof platform !== 'undefined' && platform.isAccountRestricted && platform.isAccountRestricted())
        {
            return;
        }

        // Check if user is already logged in
        const isLoggedIn = typeof (playsaurusSdk) !== 'undefined' && playsaurusSdk.isLoggedIn();

        // Main menu (HTML/CSS based)
        if(lgame == 0 && isGameReady)
        {
            if(isLoggedIn)
            {
                showAccountScreen();
            }
            else if(typeof playsaurusSdk !== 'undefined')
            {
                playsaurusSdk.startLogin(showAccountScreen);
            }
            else
            {
                console.error('Playsaurus SDK not available');
            }
            saveButtons[7] = 0;
        }
        // In-game (canvas based) - use AccountWindow
        else if(lgame != 0)
        {
            if(isLoggedIn)
            {
                // If logged in, open Account Window
                openUi(AccountWindow);
            }
            else if(typeof playsaurusSdk !== 'undefined')
            {
                playsaurusSdk.startLogin(function ()
                {
                    openUi(AccountWindow);
                });
            }
            else
            {
                console.error('Playsaurus SDK not available');
            }
        }
    }

    // Shrink .account-btn font-size to fit when localized text overflows the fixed-width buttons.
    // Measures against the content box (clientWidth minus horizontal padding) so the text stays
    // clear of the button's beveled edges instead of running into the padding zone.

    async function showAccountScreen()
    {
        try
        {
            const userInfo = await playsaurusSdk.getUserProfile();
            // Update cached email verification status
            if(userInfo)
            {
                playsaurusSdk._emailVerified = userInfo.isEmailVerified;
            }
            const accountScreen = document.getElementById('ACCOUNTSCREEN');
            const verifyNotice = document.getElementById('accountVerifyNotice');
            const accountButtons = document.querySelector('#ACCOUNTSCREEN .account-buttons');

            // Get display name - prefer displayName, then firstName, then extract from username
            var displayName = userInfo.displayName || userInfo.firstName || userInfo.username.split(/[-_]/)[0];

            // Populate avatar and username (always visible)
            document.getElementById('accountAvatar').src = userInfo.avatarUrl;
            document.getElementById('accountWelcome').textContent = _("Welcome!");
            document.getElementById('accountUsername').textContent = displayName;

            var pointsBox = document.querySelector('#ACCOUNTSCREEN .account-points-box');
            var memberSince = document.getElementById('accountMemberSince');

            if(!userInfo.isEmailVerified)
            {
                // Unverified: show verification notice, hide normal buttons and extra info
                accountButtons.style.display = 'none';
                pointsBox.style.display = 'none';
                memberSince.style.display = 'none';
                verifyNotice.style.display = 'block';

                document.getElementById('accountVerifyMessage').textContent =
                    _("Please verify your email address to access your account features.");
                document.getElementById('resendEmailBtn').textContent = _("Resend Email");
                document.getElementById('verifyLogoutBtn').textContent = _("Logout");
                document.getElementById('verifyCloseBtn').textContent = _("Close");

                document.getElementById('resendEmailBtn').onclick = async function ()
                {
                    this.disabled = true;
                    this.textContent = _("Sending...");
                    var result = await playsaurusSdk.resendEmailVerification();
                    if(result)
                    {
                        newNews(_("Verification email sent!"));
                    }
                    this.textContent = _("Resend Email");
                    this.disabled = false;
                };

                document.getElementById('verifyLogoutBtn').onclick = async function ()
                {
                    await playsaurusSdk.logout();
                    accountScreen.style.display = 'none';
                };

                document.getElementById('verifyCloseBtn').onclick = function ()
                {
                    accountScreen.style.display = 'none';
                };
            }
            else
            {
                // Verified: show normal buttons and info, hide verification notice
                accountButtons.style.display = '';
                verifyNotice.style.display = 'none';
                pointsBox.style.display = '';
                memberSince.style.display = '';

                // Populate verified-only info
                document.getElementById('accountMemberSince').textContent = _("Playsaurus Account holder since {0}", userInfo.createdAt.getFullYear());
                document.getElementById('accountPointsValue').textContent = userInfo.pointsBalance;
                document.querySelector('#ACCOUNTSCREEN .points-unit-label').textContent = _("Points");
                fitPointsValueText();

                // Localize buttons
                document.getElementById('editProfileBtn').textContent = _("Edit Profile");
                document.getElementById('cloudSavesBtn').textContent = _("Cloud Saves");
                document.getElementById('rewardsBtn').childNodes[0].textContent = _("Rewards");
                document.getElementById('logoutBtn').textContent = _("Logout");
                document.getElementById('accountCloseBtn').textContent = _("Close");

                // Setup close button
                document.getElementById('accountCloseBtn').onclick = function ()
                {
                    accountScreen.style.display = 'none';
                };

                // Setup edit profile button
                document.getElementById('editProfileBtn').onclick = function ()
                {
                    playsaurusSdk.editUserProfile();
                };

                // Setup cloud saves button
                document.getElementById('cloudSavesBtn').onclick = function ()
                {
                    accountScreen.style.display = 'none';
                    showCloudSavesScreen(accountScreen);
                };

                // Setup rewards button
                document.getElementById('rewardsBtn').onclick = function ()
                {
                    accountScreen.style.display = 'none';
                    showRewardsScreen(accountScreen);
                };

                // Setup points box click to open points page
                document.querySelector('#ACCOUNTSCREEN .account-points-box').onclick = function ()
                {
                    playsaurusSdk.openPointsShop();
                };

                // Setup logout button
                document.getElementById('logoutBtn').onclick = async function ()
                {
                    await playsaurusSdk.logout();
                    accountScreen.style.display = 'none';
                };
            }

            // Show the account screen
            accountScreen.style.display = 'flex';
            fitAccountButtonsText(accountScreen);

            // Close on background click
            accountScreen.onclick = function (e)
            {
                if(e.target === accountScreen)
                {
                    accountScreen.style.display = 'none';
                }
            };
        }
        catch(error)
        {
            console.error('Failed to load account screen:', error);
        }
    }

    async function showRewardsScreen(accountScreen)
    {
        var rewardsScreen = document.getElementById('REWARDSSCREEN');
        var listEl = document.getElementById('rewardsList');
        var loadingEl = document.getElementById('rewardsLoading');
        var emptyEl = document.getElementById('rewardsEmpty');
        var unsupportedEl = document.getElementById('rewardsUnsupported');
        var claimAllBtn = document.getElementById('rewardsClaimAllBtn');

        var saveLoaded = isSaveFileLoaded();
        var noteEl = document.querySelector('.rewards-note');

        // Localize static text
        document.querySelector('.rewards-title-text').textContent = _("Rewards");
        noteEl.textContent = _("Claim pending rewards in-game");
        noteEl.style.display = 'none';
        document.getElementById('rewardsBackBtn').textContent = saveLoaded ? _("Close") : _("Back");
        claimAllBtn.textContent = _("Claim All");

        // Populate the header (avatar / name / points) from the signed-in profile.
        populateRewardsHeader();

        // Points Shop button
        var pointsShopBtn = document.getElementById('rewardsPointsShopBtn');
        pointsShopBtn.textContent = _("Points Shop");
        pointsShopBtn.onclick = function ()
        {
            playsaurusSdk.openPointsShop();
        };

        // Reset state
        listEl.innerHTML = '';
        loadingEl.textContent = _("Loading...");
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        unsupportedEl.style.display = 'none';
        claimAllBtn.style.display = 'none';
        rewardsScreen.style.display = 'flex';
        fitAccountButtonsText(rewardsScreen);

        function closeScreen()
        {
            rewardsScreen.style.display = 'none';
            if(accountScreen)
            {
                accountScreen.style.display = 'flex';
            }
        }

        // Setup back button
        document.getElementById('rewardsBackBtn').onclick = function ()
        {
            closeScreen();
        };

        // Close on background click
        rewardsScreen.onclick = function (e)
        {
            if(e.target === rewardsScreen)
            {
                closeScreen();
            }
        };

        function buildRewardItem(reward)
        {
            var itemEl = document.createElement('div');
            itemEl.className = 'reward-item';

            var iconEl = document.createElement('img');
            iconEl.className = 'reward-icon';
            var iconImage = getRewardIconImage(reward.rewards);
            if(iconImage) iconEl.src = iconImage.src;
            iconEl.alt = '';
            itemEl.appendChild(iconEl);

            var infoEl = document.createElement('div');
            infoEl.className = 'reward-info';

            // Build display label from reward items
            var labels = [];
            for(var j = 0; j < reward.rewards.length; j++)
            {
                var rewardItem = reward.rewards[j];
                if(rewardItem.displayLabel)
                {
                    labels.push(rewardItem.displayLabel);
                }
                else
                {
                    labels.push(rewardItem.type + ": " + rewardItem.value);
                }
            }

            var labelEl = document.createElement('div');
            labelEl.className = 'reward-label';
            labelEl.textContent = labels.join(', ');
            infoEl.appendChild(labelEl);

            // Pending since timestamp
            if(reward.createdAt)
            {
                var timeEl = document.createElement('div');
                timeEl.className = 'reward-time';
                timeEl.textContent = _("Pending since: {0}", formatTimeAgo(reward.createdAt));
                infoEl.appendChild(timeEl);
            }

            // Optional message
            if(reward.message)
            {
                var msgEl = document.createElement('div');
                msgEl.className = 'reward-message';
                msgEl.textContent = reward.message;
                infoEl.appendChild(msgEl);
            }

            itemEl.appendChild(infoEl);

            if(saveLoaded)
            {
                // Claim button
                var claimBtn = document.createElement('button');
                claimBtn.className = 'reward-claim-btn';
                claimBtn.textContent = _("Claim");
                claimBtn.onclick = async function()
                {
                    if(playsaurusSdk.isClaimInProgress()) return;
                    claimBtn.disabled = true;
                    try
                    {
                        var hasSuperMiner = reward.rewards && reward.rewards.some(function(r) { return r.type === "super_miner"; });
                        var result = await playsaurusSdk.claimSingleReward(reward);
                        await playsaurusSdk.fetchPendingRewards();
                        itemEl.remove();
                        if(result.label)
                        {
                            newNews(_("You got {0}!", result.label), true);
                        }
                        if(result.message)
                        {
                            newNews(result.message, true);
                        }
                        if(listEl.children.length === 0)
                        {
                            emptyEl.textContent = _("No pending rewards");
                            emptyEl.style.display = 'block';
                            claimAllBtn.style.display = 'none';
                        }
                        if(hasSuperMiner)
                        {
                            closeScreen();
                        }
                    }
                    catch(e)
                    {
                        console.error('Failed to claim reward:', reward.id, e);
                        if(e instanceof Playsaurus.PlaysaurusConflictError)
                        {
                            itemEl.remove();
                            if(listEl.children.length === 0)
                            {
                                noteEl.textContent = _("No pending rewards");
                                noteEl.style.display = '';
                                claimAllBtn.style.display = 'none';
                            }
                        }
                        else if(e instanceof UnsupportedRewardError)
                        {
                            claimBtn.disabled = false;
                            closeScreen();
                            window.alert(_("Update the game to the latest version to receive {0} more reward(s)!", 1));
                        }
                        else if(e instanceof SuperMinerNotUnlockedError)
                        {
                            claimBtn.disabled = false;
                            closeScreen();
                            window.alert(_("Progress further in the game to claim this reward."));
                        }
                        else if(e instanceof SuperMinerSlotsFullError)
                        {
                            claimBtn.disabled = false;
                            closeScreen();
                            window.alert(_("You don't have enough Super Miner slots to claim this reward. Free up a slot and try again."));
                        }
                        else
                        {
                            claimBtn.disabled = false;
                        }
                    }
                };
                itemEl.appendChild(claimBtn);
            }

            return itemEl;
        }

        // Fetch and display rewards
        try
        {
            var result = await playsaurusSdk.fetchPendingRewards();
            loadingEl.style.display = 'none';

            if(!result || result.rewards.length === 0)
            {
                emptyEl.textContent = _("No pending rewards");
                emptyEl.style.display = 'block';
            }
            else
            {
                if(!saveLoaded)
                {
                    noteEl.style.display = '';
                }
                for(var i = 0; i < result.rewards.length; i++)
                {
                    listEl.appendChild(buildRewardItem(result.rewards[i]));
                }

                if(saveLoaded)
                {
                    claimAllBtn.style.display = '';

                    claimAllBtn.onclick = async function()
                    {
                        if(playsaurusSdk.isClaimInProgress()) return;
                        claimAllBtn.disabled = true;
                        var claimBtns = listEl.querySelectorAll('.reward-claim-btn');
                        claimBtns.forEach(function(b) { b.disabled = true; });

                        var remainingRewards = result.rewards.slice();
                        var hasSuperMiner = remainingRewards.some(function(r) { return r.rewards && r.rewards.some(function(it) { return it.type === "super_miner"; }); });
                        var messages = await playsaurusSdk.claimRewards(remainingRewards);

                        listEl.innerHTML = '';
                        emptyEl.textContent = _("No pending rewards");
                        emptyEl.style.display = 'block';
                        claimAllBtn.style.display = 'none';
                        claimAllBtn.disabled = false;

                        if(messages.skippedUnsupported > 0)
                        {
                            closeScreen();
                            window.alert(_("Update the game to the latest version to receive {0} more reward(s)!", messages.skippedUnsupported));
                        }
                        else if(messages.skippedNotUnlocked > 0)
                        {
                            closeScreen();
                            window.alert(_("Progress further in the game to claim {0} of your rewards.", messages.skippedNotUnlocked));
                        }
                        else if(messages.skippedSlotsFull > 0)
                        {
                            closeScreen();
                            window.alert(_("You don't have enough Super Miner slots to claim {0} of your rewards. Free up a slot and check Pending Rewards again.", messages.skippedSlotsFull));
                        }
                        else if(hasSuperMiner)
                        {
                            closeScreen();
                        }

                        for(var k = 0; k < messages.length; k++)
                        {
                            if(messages[k].label)
                            {
                                newNews(_("You got {0}!", messages[k].label), true);
                            }
                            if(messages[k].message)
                            {
                                newNews(messages[k].message, true);
                            }
                        }
                    };
                }
            }

            if(result && result.unsupportedRewardsCount > 0)
            {
                unsupportedEl.textContent = _("Update the game to the latest version to receive {0} more reward(s)!", result.unsupportedRewardsCount);
                unsupportedEl.style.display = 'block';
            }
        }
        catch(error)
        {
            console.error('Failed to load rewards:', error);
            loadingEl.style.display = 'none';
            emptyEl.textContent = _("Failed to load rewards. Please try again later.");
            emptyEl.style.display = 'block';
        }
    }

    window.showPendingRewardsScreen = function()
    {
        showRewardsScreen(null);
    };

    // Fill the rewards-screen header (avatar / name / points) from the signed-in
    // Playsaurus profile. Best-effort: leaves the header blank if unavailable.
    async function populateRewardsHeader()
    {
        try
        {
            var profile = await playsaurusSdk.getUserProfile();
            if(!profile) return;

            var headerName = profile.displayName || profile.firstName
                || (profile.username ? profile.username.split(/[-_]/)[0] : "");

            var avatarEl = document.getElementById('rewardsAvatar');
            if(avatarEl && profile.avatarUrl) avatarEl.src = profile.avatarUrl;

            var nameEl = document.getElementById('rewardsUsername');
            if(nameEl) nameEl.textContent = headerName;

            var pointsEl = document.getElementById('rewardsPointsValue');
            if(pointsEl && typeof profile.pointsBalance !== 'undefined') pointsEl.textContent = profile.pointsBalance;
        }
        catch(e)
        {
            // Not signed in / profile unavailable — leave header blank.
        }
    }

    function formatTimeAgo(date)
    {
        var now = new Date();
        var diffMs = now - new Date(date);
        var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if(diffDays === 0)
        {
            var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if(diffHours === 0)
            {
                return _("just now");
            }
            return _("{0} hour(s) ago", diffHours);
        }
        if(diffDays === 1)
        {
            return _("1 day ago");
        }
        return _("{0} days ago", diffDays);
    }

    async function showCloudSavesScreen(accountScreen)
    {
        var cloudSavesScreen = document.getElementById('CLOUDSAVESSCREEN');
        var listEl = document.getElementById('cloudSavesList');
        document.getElementById('cloudSavesBackBtn').textContent = _("Back");

        listEl.innerHTML = '<div class="cloud-saves-loading">' + _("Loading...") + '</div>';
        cloudSavesScreen.onclick = null;
        cloudSavesScreen.style.display = 'flex';
        fitAccountButtonsText(cloudSavesScreen);

        document.getElementById('cloudSavesBackBtn').onclick = function()
        {
            cloudSavesScreen.style.display = 'none';
            if(accountScreen)
            {
                accountScreen.style.display = 'flex';
            }
        };

        cloudSavesScreen.onclick = function(e)
        {
            if(e.target === cloudSavesScreen)
            {
                e.stopPropagation();
                cloudSavesScreen.style.display = 'none';
                if(accountScreen)
                {
                    accountScreen.style.display = 'flex';
                }
            }
        };

        try
        {
            var saves = await cloudSaveManager.getCloudSavesForDisplay();

            if(!saves || saves.length === 0)
            {
                listEl.innerHTML = '<div class="cloud-saves-empty">' + _("No cloud saves found.") + '</div>';
                return;
            }

            listEl.innerHTML = '';
            saves.forEach(function(save)
            {
                var item = document.createElement('div');
                item.className = 'cloud-save-item';

                var info = document.createElement('div');
                info.className = 'cloud-save-info';
                info.innerHTML =
                    '<div class="cloud-save-name">' + save.saveName + ' &middot; ' + save.platformFormatted + '</div>' +
                    '<div class="cloud-save-details">' + save.depthFormatted + ' &middot; ' + save.money + ' &middot; ' + save.playTimeFormatted + '</div>' +
                    '<div class="cloud-save-time">' + save.timeAgo + '</div>';

                var deleteBtn = document.createElement('button');
                deleteBtn.className = 'cloud-save-delete-btn';
                deleteBtn.textContent = _("Delete");
                deleteBtn.onclick = function()
                {
                    cloudSavesScreen.style.display = 'none';
                    showConfirmationPrompt(
                        _("Delete cloud save \"{0}\"? This cannot be undone.", save.saveName),
                        _("Delete"),
                        async function()
                        {
                            var allDeleteBtns = listEl.querySelectorAll('.cloud-save-delete-btn');
                            allDeleteBtns.forEach(function(b) { b.disabled = true; });

                            var result = await cloudSaveManager.removeCloudSave(save.id);

                            cloudSavesScreen.style.display = 'flex';

                            if(result.success)
                            {
                                item.remove();
                                if(listEl.querySelectorAll('.cloud-save-item').length === 0)
                                {
                                    listEl.innerHTML = '<div class="cloud-saves-empty">' + _("No cloud saves found.") + '</div>';
                                }
                                else
                                {
                                    listEl.querySelectorAll('.cloud-save-delete-btn').forEach(function(b) { b.disabled = false; });
                                }
                            }
                            else
                            {
                                allDeleteBtns.forEach(function(b) { b.disabled = false; });
                                listEl.insertAdjacentHTML('afterbegin',
                                    '<div class="cloud-saves-empty" style="color:#ff6b6b">' + (result.error || _("Failed to delete save.")) + '</div>');
                            }
                        },
                        _("Cancel"),
                        function()
                        {
                            cloudSavesScreen.style.display = 'flex';
                        }
                    );
                };

                item.appendChild(info);
                item.appendChild(deleteBtn);
                listEl.appendChild(item);
            });
        }
        catch(error)
        {
            listEl.innerHTML = '<div class="cloud-saves-empty" style="color:#ff6b6b">' + _("Failed to load cloud saves.") + '</div>';
            console.error('Failed to load cloud saves:', error);
        }
    }

    document.getElementById('G1i').onclick = function ()
    {
        showCloudBackupPrompt(0);
    }
    document.getElementById('G2i').onclick = function ()
    {
        showCloudBackupPrompt(1);
    }
    document.getElementById('G3i').onclick = function ()
    {
        showCloudBackupPrompt(2);
    }

    document.getElementById('G1').onmouseover = function ()
    {
        saveButtons[0] = 1;
    }
    document.getElementById('G2').onmouseover = function ()
    {
        saveButtons[1] = 1;
    }
    document.getElementById('G3').onmouseover = function ()
    {
        saveButtons[2] = 1;
    }
    document.getElementById('G1').onmouseout = function () {saveButtons[0] = 0;}
    document.getElementById('G2').onmouseout = function () {saveButtons[1] = 0;}
    document.getElementById('G3').onmouseout = function () {saveButtons[2] = 0;}
    document.getElementById('playsaurusAccountBtn').onmouseover = function ()
    {
        saveButtons[7] = 1;
        var tooltip = document.getElementById('accountBtnTooltip');
        if(!tooltip) return;

        function showTooltip(text)
        {
            if(saveButtons[7] === 0) return;
            tooltip.textContent = text;
            tooltip.style.transform = 'none';
            tooltip.style.left = '50%';
            tooltip.style.display = 'block';
            var btnRect = document.getElementById('playsaurusAccountBtn').getBoundingClientRect();
            var tw = tooltip.offsetWidth;
            var ideal = (btnRect.width - tw) / 2;
            var clamped = Math.max(-btnRect.left + 5, Math.min(ideal, window.innerWidth - btnRect.left - tw - 5));
            tooltip.style.left = clamped + 'px';
        }

        // Check if account is restricted on this platform
        if(typeof platform !== 'undefined' && platform.isAccountRestricted && platform.isAccountRestricted())
        {
            showTooltip(_("Playsaurus Accounts not supported on this platform"));
            return;
        }

        if(typeof playsaurusSdk === 'undefined') return;

        if(playsaurusSdk.isLoggedIn())
        {
            playsaurusSdk.getUserProfile().then(function(userInfo)
            {
                if(userInfo && !userInfo.isEmailVerified)
                {
                    showTooltip('\u26A0 ' + _("Email verification required"));
                    return;
                }
                var name = userInfo && (userInfo.displayName || userInfo.firstName || userInfo.username);
                showTooltip(name ? '\u2713 ' + _("Logged in as {0}", name) : '\u2713 ' + _("Logged in"));
            }).catch(function()
            {
                showTooltip('\u2713 ' + _("Logged in"));
            });
        }
        else
        {
            showTooltip(_("Log in to your Playsaurus Account"));
        }
    }
    document.getElementById('playsaurusAccountBtn').onmouseout = function ()
    {
        saveButtons[7] = 0;
        var tooltip = document.getElementById('accountBtnTooltip');
        if(tooltip)
        {
            tooltip.style.display = 'none';
        }
    }

    document.getElementById('cng').onclick = function ()
    {
        createNewGame(document.getElementById("gname").value);
    }
    document.getElementById('cngc').onclick = function ()
    {
        cancelNewGame();
    }

    document.getElementById('tutorialTextContent').onclick = function ()
    {
        onProgressTutorial();
    }
    document.getElementById('TUTORIALDI').onclick = function ()
    {
        onProgressTutorial();
    }
    document.getElementById('TUTORIALD').onclick = function ()
    {
        onProgressTutorial();
    }
    document.getElementById('tutorialTextContent').touchstart = function ()
    {
        onProgressTutorial();
    }
    document.getElementById('TUTORIALDI').touchstart = function ()
    {
        onProgressTutorial();
    }
    document.getElementById('TUTORIALD').touchstart = function ()
    {
        onProgressTutorial();
    }
}

function onProgressTutorial()
{
    if(oneTimeDialogue.isActive)
    {
        if(oneTimeDialogue.callback != null)
        {
            oneTimeDialogue.callback();
        }
        endOneTimeDialogue();
    }
}

document.oncontextmenu = function (e)
{
    var el = window.event.srcElement || e.target;
    var tp = el.tagName || '';
    if(tp.toLowerCase() !== 'input' && tp.toLowerCase() !== 'select' && tp.toLowerCase() !== 'textarea')
    {
        console.log("Right click disabled");
        return false;
    }
};

function onNewGameTextEntered(e)
{
    if(e.keyCode == 13)
    {
        createNewGame(document.getElementById("gname").value);
        return false;
    }
    else if(e.keyCode == 32)
    {
        e.preventDefault();
        return false;
    }

    var regex = new RegExp("^[a-zA-Z0-9 ]+$");
    var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if(regex.test(str))
    {
        return true;
    }
    e.preventDefault();
    return false;
}