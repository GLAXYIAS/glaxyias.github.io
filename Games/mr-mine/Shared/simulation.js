//var fs = require('fs');
var isSimulating = false;

var simDepth = 0;
var totalSims = 0;
var currentSim = -1;
var rows = [];
var drillUpgradesRows = [];
var moneyRows = [];

class GameSimulator {
    // Sim config
    minutesBetweenInteractions = 10;
    maxSteps = -1;
    chestOpenChance = 1;
    goldChestOpenChanceWithMetalDetector = 1;
    chestOpenPeriod = 10;
    autosellAll = true;
    allowSleep = false;
    csvOutput = "";
    isLoggingCsv = false;
    useDynamicInteractions = false;

    runTime = 0;
    totalTime = 0;
    lastChestOpenTime = 0;

    constructor(minutesBetweenInteractions) {
        this.minutesBetweenInteractions = minutesBetweenInteractions;
    }

    runForTime(time) {
        isSimulating = true;
        this.totalTime = time;
        //bossesDefeated = 99999;
        hasLaunched = 2;
        this.runTime = 0;
        this.csvOutput = "TIME MIN,DEPTH\r\n";
        while (this.runTime < time) {
            this.runStep();

            if (this.isLoggingCsv) {
                this.csvOutput += this.runTime + "," + depth + "\r\n";
            }
            console.log((100 * this.runTime / time).toFixed(2) + "%");
        }
        isSimulating = false;
    }

    fixStartingRows(data) {
        let tempRows = JSON.parse(localStorage.getItem(data));

        let fixedRows = tempRows.map(row => {
            return JSON.parse(row);
        })

        return fixedRows;
    }

    fixedLaterRows(data) {
        let fixedRows = data.map(row => {
            if (row) {
                for (var i = 0; i < row.length; i++) {
                    if (typeof row[i] == "undefined") {
                        row[i] == "";
                    }

                }
            }

            return JSON.stringify(row);
        })

        return fixedRows;
    }

    runUntilCondition(conditionCheckFunction) {
        rows = this.fixStartingRows("depthData");
        drillUpgradesRows = this.fixStartingRows("drillData");

        isSimulating = true;
        hasLaunched = 2;
        this.runTime = 0;
        var steps = 0;
        var simDepth = parseInt(localStorage["simDepth"]);
        var lastPrecentage = 0;

        while (!conditionCheckFunction() && (this.maxSteps < 0 || steps < this.maxSteps)) {
            ++steps;
            this.runStep();


            if (steps % 250 == 0) {
                let currentPercantage = ((depth / simDepth).toFixed(2) * 100);
                lastPrecentage = currentPercantage;
                console.log(`sim ${totalSims - currentSim}/${totalSims} - depth ${depth}/${simDepth} - ${currentPercantage}% completed - steps until failure ${steps}/${this.maxSteps}`);
            }
        }

        isSimulating = false;

        if (localStorage["numSims"] == "0") {
            //console.log("time to complete: " + shortenedFormattedTime((rows[1][rows[1].length - 1] - rows[0][0]) / 1000));
            console.log("***********************");
            console.log(`SIM COMPLETED - MET CONDITION = ${depth >= simDepth}`);
            console.log("***********************");
            console.log(this.scientistsState);
            this.downloadCsv();
        }
        else {
            rows = this.fixedLaterRows(rows);
            localStorage.setItem('depthData', JSON.stringify(rows));

            drillUpgradesRows = this.fixedLaterRows(drillUpgradesRows);
            localStorage.setItem('drillData', JSON.stringify(drillUpgradesRows));

            setTimeout(() => { reloadGame(); }, 3000);
        }
    }

    runStep() {
        var stepTime = 0;
        var isAsleep = this.runTime % 1440 > 960;
        if (this.useDynamicInteractions) {
            this.minutesBetweenInteractions = Math.max(1, Math.floor(depth ** 0.42));
        }
        if (!this.allowSleep || !isAsleep) {
            if (this.totalTime > 0) {
                var timelapseTime = Math.min(this.minutesBetweenInteractions, this.totalTime - this.runTime);
            }
            else {
                var timelapseTime = this.minutesBetweenInteractions;
            }
            while (stepTime < timelapseTime) {
                //this.initSnapshot();
                timelapse(1, false);
                //this.finishSnapshot(1);
                for (var i = 0; i < 60; i++) {
                    updateUserExperience();
                };
                simulateCavesForTime(60);
                this.simulateChestSpawns();
                this.openAnyChests();
                spawnWorldClickables();
                battleManager.battlerand();
                spawnWorldClickables();
                battleManager.battlerand();
                this.craftGems();

                for (var i = highestOreUnlocked; i < worldResources.length; i++) {
                    if (!worldResources[i].isIsotope && worldResources[i].isOnHeader && worldResources[i].numOwned > 0 && highestOreUnlocked < i) {
                        highestOreUnlocked = i;
                    }
                }
                checkForNewTrade();
                stepTime += 1;

                //changed scientist to reference this instead of current time
                savetime += 60;
            }
            this.runTime += timelapseTime;
            //console.log(`Play time: ${playtime} adding ${playtime + (timelapseTime * 60)}`)
            playtime += timelapseTime * 60;

            buffs.update();
            if (buffs.activeBuffs.length > 0) {
                buffs.activeBuffs.forEach(buff => {
                    if (buff.pausedDuringTimelapse && buff.id != 4) {
                        buff.millisecondsRemaining = 0;
                    }
                })
            }
        }
        else {
            //console.log("********************SLEEP********************");
            var sleepTime = 480; //Math.min(480, this.totalTime - this.runTime);
            timelapse(sleepTime, false);
            //console.log(`Play time: ${playtime} sleep adding ${playtime + (sleepTime * 60)}`)
            playtime += sleepTime * 60;
            this.runTime += sleepTime;
        }

        if (depth >= 50) {
            hasFoundGolem = 1;
            hasFoundGidget = 1;
            initAvailableBlueprints();
        }

        questManager.update();
        questManager.grantRewardsForCompletedQuests();

        this.cachedBlueprints = getKnownBlueprints().filter((bp) => bp.category != 6);

        if (depth > 1135) this.simulateReactor(this.minutesBetweenInteractions);
        this.clickAllClickables();
        this.updateCaves();
        this.checkTrades();
        this.updateScientists();
        this.craftAllUpgrades();
        this.purchaseAllUpgrades();
        this.checkBattles();
        this.simulateCompressor();
        this.updateSuperMiners();
        this.updateBattleChest();
        this.sellMineralsToReachCapacity();
    }

    updateSuperMiners() {
        //test impacts of super miners
        let unlocks = [
            // {
            //     depth: 1,
            //     superMinerId: 13
            // },
            // {
            //     depth: 1,
            //     superMinerId: 13
            // },
            // {
            //     depth: 1,
            //     superMinerId: 13
            // }
        ]

        if (depth >= 10 && !superMinerManager.recievedInitialSuperMiner) {
            blackChestRewards.rollForRandomReward();
            chestService.totalBlackChestsOpened++;
            superMinerManager.recievedInitialSuperMiner = true;
        }

        for (var i = superMinerManager.numSuperMiners(); i < unlocks.length; i++) {
            if (depth < unlocks[i].depth) break;

            superMinerManager.slots++;

            if (unlocks[i].superMinerId) {
                let miner = superMinerManager.getSuperMinerById(unlocks[i].superMinerId)
                superMinerManager.addSuperMiner(miner);
            }
            else if (unlocks[i].type) {
                let minersOfType = superMinerManager.baseSuperMiners.filter(miner => miner.type == unlocks[i].type && !miner.isSpecial);
                if (unlocks[i].rarity) minersOfType = minersOfType.filter(miner => miner.rarity == unlocks[i].rarity);
                let miner = minersOfType[rand(0, minersOfType.length - 1)];
                superMinerManager.addSuperMiner(miner);
            }
            else if (unlocks[i].rarity) {
                let minersOfRarity = superMinerManager.baseSuperMiners.filter(miner => miner.rarity == unlocks[i].rarity && !miner.isSpecial);
                let miner = minersOfRarity[rand(0, minersOfRarity.length - 1)];

                superMinerManager.addSuperMiner(miner);
            }
        }

        let sortedMiners = superMinerManager.currentSuperMiners.length > 2 ? superMinerManager.currentSuperMiners.sort((a, b) => a.rarity.id - b.rarity.id) : superMinerManager.currentSuperMiners;
        let filteredMiners = sortedMiners.filter(miner => miner.type != superMinerTypes.EGG && miner.id != 6);

        if (superMinerManager.pendingSuperMiner) {
            let pendingMiner = superMinerManager.getSuperMinerById(superMinerManager.pendingSuperMiner);

            if (pendingMiner.type == superMinerTypes.CHEST || pendingMiner.type == superMinerTypes.DEPOSIT) // I dont want to figure out how to simulate these chest spawns
            {
                pendingMiner.scrap();
                superMinerManager.removePendingSuperMiner();
                return;
            }
            else {

                if (superMinerManager.slots > superMinerManager.numSuperMiners()) {
                    //console.log('adding miner')
                    superMinerManager.addSuperMiner(pendingMiner);
                    superMinerManager.removePendingSuperMiner();
                }
                else if (superMinerManager.canUpgradeSlot()) {
                    //console.log('upgrading slots')
                    superMinerManager.upgradeSlots();
                    superMinerManager.addSuperMiner(pendingMiner);
                    superMinerManager.removePendingSuperMiner();
                }
                else if (filteredMiners.length > 2 && pendingMiner.rarity.id > filteredMiners[0].rarity.id) {
                    //console.log('removing lowest rarity to make room')
                    filteredMiners[0].scrap();
                    superMinerManager.addSuperMiner(pendingMiner);
                    superMinerManager.removePendingSuperMiner();
                }
                else {
                    //console.log('scrapping because theres no room')
                    pendingMiner.scrap();
                    superMinerManager.removePendingSuperMiner();
                }
            }
        }

        for (var i = superMinerManager.numSuperMiners() - 1; i >= 0; i--) {
            let miner = sortedMiners[i];
            if (Math.random() < 0.05) miner.onButtonPress();
            // if((miner.rarity != superMinerRarities.common || miner.rarity != superMinerRarities.uncommon) &&
            //     miner.canLevel() && miner.getLevelCost() < (superMinerManager.nextSlotCost() / (25 / miner.rarity.scaleFactor)) &&
            //     (miner.type != superMinerTypes.EGG || (miner.type == superMinerTypes.EGG && miner.rarity == superMinerRarities.legendary)))
            // {
            if (miner.canLevel() &&
                miner.getLevelCost() < (superMinerManager.nextSlotCost() / (25 / miner.rarity.scaleFactor)) &&
                (miner.type != superMinerTypes.EGG || (miner.type == superMinerTypes.EGG && miner.rarity == superMinerRarities.legendary))) {
                miner.levelUp();
            }

            if (miner.type == superMinerTypes.EGG && miner.level == 10) {
                miner.scrap();
            }
        }
    }

    updateBattleChest() {
        let sortedEquips = battleEquipsManager.activeEquips.length > 2 ? battleEquipsManager.activeEquips.sort((a, b) => a.rarity.id - b.rarity.id) : battleEquipsManager.activeEquips;

        if (battleEquipsManager.pendingEquip) {
            let pendingEquip = battleEquipsManager.pendingEquip;

            if (battleEquipsManager.slots > battleEquipsManager.activeEquips.length) {
                //console.log('adding equip')
                battleEquipsManager.addActiveEquip(pendingEquip);

            }
            else if (battleEquipsManager.canUpgradeSlot()) {
                //console.log('upgrading slots')
                battleEquipsManager.upgradeSlots();
                battleEquipsManager.addActiveEquip(pendingEquip);
            }
            else if (sortedEquips.length > 2 && battleEquipsManager.getBaseEquipById(pendingEquip).rarity.id > sortedEquips[0].rarity.id) {
                //console.log('removing lowest rarity to make room')
                battleEquipsManager.activeEquips[0].scrap();
                battleEquipsManager.addActiveEquip(pendingEquip);
            }
            else {
                // console.log('scrapping because theres no room')
                battleEquipsManager.getBaseEquipById(pendingEquip).scrap();
            }
            battleEquipsManager.removePendingEquip();
        }

        for (var i = battleEquipsManager.activeEquips.length - 1; i >= 0; i--) {
            let equip = sortedEquips[i];
            if (equip.canLevel() &&
                equip.getLevelCost() < (battleEquipsManager.nextSlotCost() / 4) &&
                equip.rarity != equipRarities.common) {
                equip.levelUp();
            }
        }
    }

    simulateCompressor() {
        if (depth > 100 && chestCollectorChanceStructure.level < 1) {
            chestCollectorChanceStructure.level = 1;
            chestCollectorStorageStructure.level = 1;
            learnRangeOfBlueprints(3, 8, 9);
        }

        if (chestCompressorStructure.level > 0) {
            for (var i = 0; i < 5; i++) {
                if (chestCompressor.canQueueChest(ChestType.black)) {
                    chestCompressor.addChestToQueue(ChestType.black);
                }
                else if (chestCompressor.canQueueChest(ChestType.gold)) {
                    chestCompressor.addChestToQueue(ChestType.gold);
                }
            }
        }
    }

    craftAllUpgrades() {
        var blueprints = this.cachedBlueprints.filter(bp => bp.category != 2);

        //cast thoth to improve crafting
        superMinerManager.currentSuperMiners.filter(miner => miner.id == 31).forEach(thoth => thoth.onButtonPress());

        for (var i = blueprints.length - 1; i >= 0; --i) {
            let blueprint = blueprints[i];

            if (blueprint.levels && blueprint.levels.length > 1) {

                if (blueprint.category != 3) {
                    for (var level = 0; level < blueprint.levels.length; level++) {
                        let bpLevel = blueprint.craftedItem.item.getCurrentLevel();

                        if (bpLevel < level) {
                            let discountedIngredients = getIngredientListWithDiscounts(blueprint.levels[bpLevel].ingredients);
                            craftBlueprint(blueprint.category, blueprint.id, level, discountedIngredients);
                        }
                    }
                }
                else if (blueprint.category == 3 && !blueprint.craftedItem.item.isAtMaxLevel() &&
                    canCraftBlueprint(blueprint.category, blueprint.id, blueprint.craftedItem.item.getCurrentLevel(), null, true)
                ) {
                    let discountedIngredients = getIngredientListWithDiscounts(blueprint.levels[blueprint.craftedItem.item.getCurrentLevel()].ingredients);

                    discountedIngredients.forEach(ingredient => {
                        ingredient.item.spendQuantity(ingredient.quantity);
                    });

                    blueprint.craftedItem.item.upgradeToLevel(blueprint.craftedItem.item.getCurrentLevel() + 1);
                }
            }
            else if (canCraftBlueprint(blueprint.category, blueprint.id, 0, null, true)) {
                craftBlueprint(blueprint.category, blueprint.id);
                flagBlueprintAsSeen(blueprint.category, blueprint.id);
            }
            else if (blueprint.category == 0) {
                //some blueprints require trickery that I dont want to simulate
                if (depth > 1400) {
                    let numIngredients = discountedIngredients.length;
                    let numIngredientsQuantityFor = 0;
                    let hasRequirementHigherThanCapacity = false;
                    for (var i = 0; i < numIngredients; i++) {
                        if (ingredient.item.hasQuantity(ingredient.quantity)) numIngredientsQuantityFor++;
                        if (ingredient.item instanceof MineralCraftingItem) {
                            if (worldResources[worldingredient.item.id] > maxHoldingCapacity()) {
                                hasRequirementHigherThanCapacity = true;
                            }
                        }
                    }

                    if (numIngredients - numIngredientsQuantityFor == 1 && hasRequirementHigherThanCapacity) {
                        console.log("crafted a wonk drill part that has a higher requirement than capacity")
                        for (var i in ingredients) {
                            ingredients[i].item.spendQuantity(ingredients[i].quantity);
                        }

                        blueprint.craftedItem.item.grantQuantity(blueprint.craftedItem.quantity);
                    }
                }
            }
        }
    }

    learnedMk2 = false;
    learnedMk3 = false;
    purchaseAllUpgrades() {

        if (depth >= 1257 && !this.learnedMk2) {
            learnRangeOfBlueprints(1, 79, 87); //robot MK2;
            this.learnedMk2 = true;
        }
        if (depth >= 2039 && !this.learnedMk3) {
            learnRangeOfBlueprints(1, 120, 131); //robot MK3;
            this.learnedMk3 = true;
        }

        var worldReference;
        for (var i = 0; i <= Math.floor(depth / 1032); ++i) {
            worldReference = worlds[i];
            if (worldReference.workersHired < worldReference.workerHireCosts.length - 1 && worldReference.workerHireCost()) {
                if (this.canAffordUpgradeWithMineralValue(worldReference.workerHireCost())) {
                    hireMiner(i);
                }
            }
            else if (
                worldReference.workersHired >= 10 &&
                worldReference.workerLevel + 1 <= worldReference.workerLevelCosts.length &&
                worldReference.workerUpgradeCost()
            ) {
                if (this.canAffordUpgradeWithMineralValue(worldReference.workerUpgradeCost())) {
                    upgradeMiners(i);
                }

            }
        }
        if (depth >= 303) oilrigStructure.level = 12;
    }


    //need to look into if this is working correctly
    simulateChestSpawns() {
        //optimized combination of many chest service functions
        var maxTenthOfDepth = Math.floor((depth / 5) * this.chestOpenChance); //this is normally 10, but the function is called twice normally as well. This is faster/better?

        for (var x = 1; x <= maxTenthOfDepth; x++) {
            if (chestService.rollForBasicChest()) {
                let chestType = chestService.rollForSpecialChest()

                if (!chestService.isChestCollectorFull() && chestSpawnRoller.rand(1, 100) <= chestService.getStoredChestsChance() && chestType != ChestType.battle) {
                    chestService.storeChest(chestType);
                }
                else {
                    if (chestType == ChestType.basic) {
                        basicChestRewards.rollForRandomReward();
                        chestService.totalBasicChestsOpened++;
                    }
                    else if (this.canOpenGoldenChest() && chestType == ChestType.gold) {
                        goldChestRewards.rollForRandomReward();
                        chestService.totalGoldChestsOpened++;
                    }
                    else if (chestType == ChestType.black) {
                        blackChestRewards.rollForRandomReward();
                        chestService.totalBlackChestsOpened++;
                    }
                    else if (chestType == ChestType.battle) {
                        battleChestRewards.rollForRandomReward();
                        chestService.totalBattleChestsOpened++;
                    }
                }
            }
        }

        // I guess this is why simulating chest spawns and collection seperately would be a good idea. This might be too strong
        this.sellMineralsToReachCapacity();

    }

    openChest(type) {
        if (type == ChestType.gold) {
            goldChestRewards.rollForRandomReward();
            chestService.totalGoldChestsOpened++;
            chestService.storedChests[ChestType.gold]--;
        }
        else if (type == ChestType.black) {
            blackChestRewards.rollForRandomReward();
            chestService.totalBlackChestsOpened++;
            chestService.storedChests[ChestType.black]--;
        }
        else {
            basicChestRewards.rollForRandomReward();
            chestService.totalBasicChestsOpened++;
            chestService.storedChests[ChestType.basic]--;
        }
    }

    openAnyChests() {
        if (chestService.storedChests[0] > 30) this.openChest(0);
        if (chestService.storedChests[1] > 15) this.openChest(1);
        if (chestService.storedChests[2] > 0) this.openChest(2);
    }

    canOpenGoldenChest() {
        return metalDetectorStructure.level > 0 && Math.random() < this.goldChestOpenChanceWithMetalDetector;
    }

    canOpenBasicChest() {
        return Math.random() < this.chestOpenChance;
    }

    clickAllClickables() {
        removeExpiredClickables();
        for (var i in worldClickables) {
            while (worldClickables[i]) {
                onClickedMineralDeposit(worldClickables[i]);
            }
        }
    }

    checkTrades() {
        let tradeOffers = [[earthTradeOffer1, earthTradeOffer2], [moonTradeOffer1, moonTradeOffer2]];

        tradeOffers.forEach((trade, worldTradeIndex) => {
            //this is only checking the first trade since its currently impossible to compare the values of each trade without doing string comparisons
            if (isTradeAvailable(trade[0])) {
                //trades are almost always worth it now so should just make them?
                if (canMakeTrade(trade[0]) && trade[0][TRADE_INDEX_REWARD_TYPE] != TRADE_TYPE_RELIC) {
                    if (trade[0][TRADE_INDEX_PAYMENT_TYPE] == TRADE_TYPE_ORE) {
                        if (lockedMineralAmtsToSave[trade[0][TRADE_INDEX_PAYMENT_SUBTYPE]] > 0) {
                            return;
                        }
                    }

                    totalCompletedTrades++;
                    makeTrade(worldTradeIndex, trade[0]);
                    return;
                }
            }
        })
    }

    // Check if the player can afford an upgrade, selling all minerals if necessary
    canAffordUpgradeWithMineralValue(targetPrice) {
        if (money.greaterThanOrEqualTo(targetPrice)) {
            return true;
        }
        else if (money.add(this.getValueOfMineralsExcludingLocked()).greaterThanOrEqualTo(targetPrice)) {
            this.sellMineralsToReachMoneyAmount(targetPrice);
            return true;
        }
        return false;
    }

    getValueOfMineralsExcludingLocked() {
        var value = new BigNumber(0);
        for (var i = 1; i < worldResources.length; i++) {
            let lockAmt = lockedMineralAmtsToSave[i] ? lockedMineralAmtsToSave[i] : 0;
            value = value.add(Math.max(0, parseInt(worldResources[i].numOwned - lockAmt)))
                .multiply(worldResources[i].sellValue);
        }
        return value;
    }

    getValueOfLockedMinerals() {
        var value = new BigNumber(0);
        for (var i = 1; i < worldResources.length; i++) {
            if (lockedMineralAmtsToSave[i]) {
                value = value.add(lockedMineralAmtsToSave[i].multiply(worldResources[i].sellValue));
            }
        }
        return value;
    }

    cachedLockedBlueprints = [];
    cachedForDepth = -1;
    lockMineralsForBlueprints() {
        for (var i = 0; i < lockedMineralAmtsToSave.length; i++) {
            lockedMineralAmtsToSave[i] = 0;
        }

        var blueprints;

        //dont over sell isotopes
        for (var i = 1; i < worldResources.length; i++) {
            if (worldResources[i].isIsotope) {
                lockedMineralAmtsToSave[i] = Math.floor(maxHoldingCapacity() / 125);
            }
        }

        if (depth > this.cachedForDepth) {
            blueprints = filterBlueprintsByCategoryAndLevel(this.cachedBlueprints, 1);

            //filters out blueprints where ingredients aren't owned
            blueprints = blueprints.filter(bp => {
                var hasUnlockedMineral = true;
                bp.ingredients.forEach(ingredient => {
                    if (ingredient.item instanceof MineralCraftingItem) {
                        let worldResource = worldResources[ingredient.item.id];
                        if (
                            (worldResource.isIsotope && worldResource.index > highestIsotopeUnlocked) ||
                            (!worldResource.isIsotope && worldResource.index > highestOreUnlocked)
                        ) {
                            hasUnlockedMineral = false;
                        }
                    }
                })
                return hasUnlockedMineral;
            })

            //tries to sort blueprints by most cost effective
            if (depth > 1000) {
                blueprints = blueprints
                    .filter((bp) => {
                        depth < 1000 || getDrillEquipByBlueprintId(bp.id).wattagePercentIncrease() > 40 || getDrillEquipByBlueprintId(bp.id).capacity > 0;
                    })
                    .sort((a, b) => {
                        Number(a.craftedItem.item.getCostRelativeToIncrease()) - Number(b.craftedItem.item.getCostRelativeToIncrease())
                    });


                //if the last blueprint is cargo move to the front
                if (blueprints.length > 0) {
                    if (getDrillEquipByBlueprintId(blueprints[blueprints.length - 1].id).capacity > 0) {
                        blueprints = [blueprints.pop()].concat(blueprints);
                    }
                }
            }
        }
        else {
            blueprints = this.cachedLockedBlueprints;
        }

        //limit the locked blueprints to the cheapest ones relative to performance gain
        var blueprintsToFocusOn = depth < 1300 ? blueprints.length : Math.min(3, blueprints.length)
        for (var i = 0; i < blueprintsToFocusOn; i++) {
            var totalIngredients = new BigNumber(0);
            var startingIndex = blueprints[0].ingredients[0].item instanceof MoneyCraftingItem ? 1 : 0;
            var ingredientsLength = blueprints[i].ingredients.length;

            for (var j = startingIndex; j < ingredientsLength; j++) {
                if (blueprints[i].ingredients[j].quantity) {
                    totalIngredients = totalIngredients.add(blueprints[i].ingredients[j].quantity);
                }
            }

            if (totalIngredients.lessThan(maxHoldingCapacity())) {
                for (var j = startingIndex; j < blueprints[i].ingredients.length; j++) {
                    let id = blueprints[i].ingredients[j].item.id;
                    let canLock = true;

                    if (id) {
                        if (money.lessThan(blueprints[0].ingredients[0].quantity) && !worldResources[id].isIsotope) {
                            if (worldResources[id].totalValue() > doBigNumberDecimalMultiplication(blueprints[0].ingredients[0].quantity, .1)) {
                                canLock = false;
                            }


                        }
                    }

                    if (canLock) {
                        if (worldResources[id]) {
                            let amount = Math.max(Number(blueprints[i].ingredients[j].quantity), lockedMineralAmtsToSave[id]);
                            //console.log(`locking ${worldResources[id]?.name} for ${amount}`);
                            lockedMineralAmtsToSave[id] = amount;
                        }
                    }
                }
                break;
            }

        }
    }

    //not really simulating, just giving the player power since it's need for blueprints.
    simulateReactor(time) {
        reactorStructure.level = 5;

        //make reactor grid all batteries
        if (reactor.grid.cachedMaxBatteryCapacity == 0) {
            reactor.learnReactorBlueprintsForLevel();
            getKnownBlueprints(6)[12].craftedItem.item.grantQuantity(81)

            reactor.grid.grid = [
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13],
                [13, 13, 13, 13, 13, 13, 13, 13, 13]
            ];

            reactor.grid.cachedMaxBatteryCapacity = reactor.grid.maxBatteryCapacity();
        }

        //fill up reactor with energy
        worldResources[NUCLEAR_ENERGY_INDEX].numOwned += (100000 * time);

        //have a chance to grant isotopes
        if (depth > 1320) {
            let roller = Math.random();

            if (roller > .96) einsteinium1.numOwned += 10;
            if (roller > .97) einsteinium2.numOwned += 10;

            if (depth > 1400 && roller > .98) {
                einsteinium3.numOwned += 10;
                fermium1.numOwned++;

                if (depth > 1550) {
                    fermium2.numOwned++;
                    if (depth > 1600 && roller > .99) fermium3.numOwned++;
                }
            }
        }


        let possibleBuffs = buffsPurchaseOptions.filter(buff => buff.buffId == 0 || buff.buffId == 4 || buff.buffId == 5 && buff.energyCost >= 700000);
        while (worldResources[NUCLEAR_ENERGY_INDEX].numOwned > 10000000 && possibleBuffs.length > 0) {
            let buff = possibleBuffs[rand(0, possibleBuffs.length - 1)];
            if (buff.canPurchase()) {
                buff.purchase();
            }
        }

    }

    sellMineralsToReachMoneyAmount(targetAmount) {
        if (this.autosellAll) {
            this.sellAllMinerals();
        }
        else {
            this.lockMineralsForBlueprints();
            var i = 1;
            while (money.lessThan(targetAmount) && i < worldResources.length) {
                if (worldResources[i].sellValue.greaterThan(0)) {
                    sellMineral(i);
                }
                ++i;
            }
        }
    }

    sellMineralsToReachCapacity() {
        if (depth < 10) for (var i in worldResources) sellMineral(i);
        if (this.autosellAll) {
            if (maxHoldingCapacity() <= capacity) this.sellAllMinerals();
        }
        else {
            this.lockMineralsForBlueprints();
            var i = 1;
            while (maxHoldingCapacity() <= capacity && i < worldResources.length) {
                if (worldResources[i].sellValue.greaterThan(0)) {
                    sellMineral(i);
                }
                ++i;
            }
        }
    }

    sellAllMinerals() {
        this.lockMineralsForBlueprints();
        for (var i in worldResources) sellMineral(i);
    }

    has15Relics = false;
    divinedRelics = 0;

    isTrashRelic(relicid) {
        //most of these are situationally good, but sim too dumb. I should've made this 'isGoodRelic', but this list started out small and kept growing
        var trashRelics = [3, 10, 12, 13, 21, 22, 23, 25, 26, 27, 28, 31, 33, 35, 36, 37, 38, 39, 45, 47, 48, 49, 50, 51, 52, 135, 138];
        return trashRelics.includes(relicid);
    }

    claimReward(scientistIndex) {
        if (currentScientists.excavations[scientistIndex][0] == 4) {
            basicChestRewards.rollForRandomReward();
            chestService.totalBasicChestsOpened++;
            currentScientists.excavations[scientistIndex] = [];
            generateExcavationChoices(scientistIndex);
            return;
        }
        else if (currentScientists.excavations[scientistIndex][0] == 5) {
            goldChestRewards.rollForRandomReward();
            chestService.totalGoldChestsOpened++;
            currentScientists.excavations[scientistIndex] = [];
            generateExcavationChoices(scientistIndex);
            return;
        }
        else if (currentScientists.excavations[scientistIndex][0] == 32 || currentScientists.excavations[scientistIndex][0] == 53) {
            battleChestRewards.rollForRandomReward();
            chestService.totalBattleChestsOpened++;
            currentScientists.excavations[scientistIndex] = [];
            generateExcavationChoices(scientistIndex);
            return;
        }

        let activeExcavation = currentScientists.excavations[scientistIndex][0];
        let excavationReward = excavationRewards[activeExcavation];
        if (excavationReward.id == 123 || excavationReward.id == 124 || excavationReward.id == 125) {
            STAT.dirtyFuelCache = true;
        }
        else if (excavationReward.id == 2 || excavationReward.id == 56 || excavationReward.id == 89) {
            STAT.dirtyChestSpawnMultiplierCache = true;
        }

        claimRewardForFinishedExcavation(scientistIndex);

    }

    scientistsState = [];

    updateScientists() {
        let deletedScientists = false;

        if (depth > 1000 && equippedRelics[0] != 95) {
            for (var i = 0; i < 4; i++) {
                equippedRelics[i] = 95;
            }
        }

        if (depth > 2000) {
            if (equippedRelics[4] != 20) {
                for (var i = 4; i < 9; i++) {
                    equippedRelics[i] = 20;
                }
            }

            currentScientists.scientists.forEach((scientist, index) => {
                if (scientist[0] != scientists[scientist[0]].warpedId) {
                    scientist[0] = scientists[scientist[0]].warpedId;
                }
            })
        }

        for (var scientistIndex = 0; scientistIndex < numActiveScientists(); scientistIndex++) {
            if (isOnActiveExcavation(scientistIndex)) {
                if (isScientistDead(scientistIndex)) {
                    let costToResurrect = getCostToResurrect(scientistIndex);
                    if (
                        depth > 2000 &&
                        (currentScientists.scientists[scientistIndex][0] == 31 || currentScientists.scientists[scientistIndex][0] == 36) &&
                        tickets > costToResurrect
                    ) {
                        tickets -= costToResurrect;
                        forfeitRewardForFinishedExcavation(scientistIndex, false);
                    }
                    else {
                        deadScientists++;
                        var chanceOfResurrection = STAT.percentChanceScientistResurrection();
                        if (scientistRoller.rand(1, 100) > chanceOfResurrection) {
                            deleteScientistAtIndex(scientistIndex);
                            deletedScientists = true;
                        }
                        else {
                            forfeitRewardForFinishedExcavation(scientistIndex, false);
                        }
                    }
                }
                else if (isExcavationDone(scientistIndex)) {
                    if (excavationRewards[currentScientists.excavations[scientistIndex][0]].isRelic) {
                        let relicid = excavationRewards[currentScientists.excavations[scientistIndex][0]].id;
                        if (isRelicInventoryFull() || getNumOfEquippedRelicsWithId(relicid) >= 5 || this.isTrashRelic(relicid)) {
                            forfeitRewardForFinishedExcavation(scientistIndex, true);
                        }
                        else {

                            this.claimReward(scientistIndex);
                        }

                    }
                    else {
                        this.claimReward(scientistIndex);
                    }

                    numExcavationsCompleted++;
                }
            }
            else {
                let maxDifficulty = isRelicInventoryFull() ? 25 : 85;
                if (currentScientists.choices[scientistIndex][1][2] > maxDifficulty) {
                    startExcavation(scientistIndex, 0);
                }
                else {
                    startExcavation(scientistIndex, rand(0, 1));
                }
            }
        }

        //should actually simulate Book of secrets to do this right
        if (depth > 500 && isRelicInventoryFull()) {
            let numDivinesShouldHave = Math.min(20, Math.floor((depth - 1000) / (100 / (depth / 1000))));
            let numDivinesHave = equippedRelics.filter(relicid => excavationRewards[relicid] && relicid == excavationRewards[relicid].divineId).length;

            if (numDivinesHave < numDivinesShouldHave) {
                for (var i = 0; i < maxRelicSlots; i++) {
                    let relicId = equippedRelics[i];
                    if (excavationRewards[relicId].divineId && relicId != excavationRewards[relicId].divineId) {
                        equippedRelics[i] = excavationRewards[relicId].divineId;
                        numDivinesHave++;
                    }

                    if (numDivinesHave >= numDivinesShouldHave) break;
                }
            }
        }

        if (tickets >= getRelicSlotCost()) {
            expandRelicInventory();
        }

        let currentState = JSON.stringify(currentScientists);
        this.scientistsState.push(currentState);

        let lastState = this.scientistsState[this.scientistsState.length - 1];

        if (lastState != undefined && !deletedScientists) {
            let lastNumScientists = JSON.parse(lastState).scientists.length;
            let currentNumScientists = currentScientists.scientists.length;

            if (currentNumScientists !== lastNumScientists) {
                console.error("Scientists deleted some how");
                console.log("Current state")
                console.log(currentState);
                console.log("Last state")
                console.log(lastState);
            }
        }
    }

    caveRewards = 0;
    updateCaves() {
        if (!dronesReturnOnFull && tickets > 50) {
            dronesReturnOnFull = true;
            tickets -= 50;
        }

        let caves = getActiveCaves();

        for (var i = 0; i < caves.length; i++) {
            let cave = caves[i];

            //filters and sorts nodes that have rewards based on distance
            let nodes = cave.getAllChildNodesFromRoot()
                .filter(node => cave.getIndexOfRewardsOnNode(node).length > 0)
                .sort((a, b) => a.depth - b.depth)

            while (cave.currentFuel >= 200 && nodes.length > 0) {
                var blueprints = [droneBlueprints[0], droneBlueprints[2]];
                var drone = getDroneById(blueprints[rand(0, 1)].craftedItem.item.id);
                var speed = drone.speedMultiplierLevels[drone.level];
                var fuel = drone.totalFuel;
                var fuelUse = drone.fuelUseLevels[drone.level];
                var maxTravelDistance = ((fuel / fuelUse) / CAVE_SYSTEM_DURATION_PER_NODE_SECONDS) * speed;

                //checks whether the stats of the drone are high enough to make it to the node and back;
                var nodesWithinRange = nodes.filter(node => Math.floor(node.depth / 2) < maxTravelDistance);

                //if there are no nodes within the distance just pick any reward node
                var firstChoice = nodesWithinRange[Math.max(0, rand(0, nodesWithinRange.length - 1))];
                var backupnode = nodes[Math.max(0, rand(0, nodes.length - 1))];
                var selectedNode = firstChoice ? firstChoice : backupnode;

                var selectedPath = cave.getPathToNode(selectedNode);
                cave.startDroneOnPath(drone, selectedPath);
                nodes = nodes.filter(node => node != selectedNode);
            }
        }

        treasureStorage.treasure.forEach((treasure, index) => {
            if (treasure instanceof CaveBasicChest) {
                basicChestRewards.rollForRandomReward();
                chestService.totalBasicChestsOpened++;
                treasureStorage.treasure.splice(index, 1);
            }
            else if (treasure instanceof CaveGoldChest) {
                goldChestRewards.rollForRandomReward();
                chestService.totalGoldChestsOpened++;
                treasureStorage.treasure.splice(index, 1);
            }
            else {
                treasureStorage.grantAndRemove(index);
            }
            this.caveRewards++
        })
    }

    checkBattles() {
        if (battleManager.battleWaiting.length > 0) {
            battleManager.preparebattle();
            let turns = 0;
            while (battleManager.battleActive) {
                turns++;
                let atkChanceBasedOnEnergy = battleManager.userEnergy / battleManager.userMaxEnergy;

                if (Math.random() < atkChanceBasedOnEnergy) {
                    battleManager.activeWeps.forEach((wep, index) => {
                        if (wep.canUse()) {
                            battleManager.atk(index);
                        }
                    })
                }
                else {
                    battleManager.endTurn()
                }

                if ((battleManager.activeWeps.length == 0 && battleManager.atkWeps.length == 0) || turns > 100) {
                    battleManager.lostBattle();
                }
            }

            battleStorage.treasure.forEach((treasure, index) => { battleStorage.grantAndRemove(index); })
        }
    }

    upgradeGems = true;
    craftGems() {


        if (depth < 304) return;
        let oil = worldResources[OIL_INDEX].numOwned;

        if (this.upgradeGems && oil < 10000 && (
            (depth > 1340 && depth < 1380) ||
            (depth > 1500 && depth < 1800))) {
            // if(this.upgradeGems)
            // {
            //     console.log("stopping gem upgrades for oil");
            // }
            this.upgradeGems = false;
        }
        else if (!this.upgradeGems && oil > 11000 && ((depth > 1340 && depth < 1380) || depth > 1500)) {
            // if(!this.upgradeGems)
            // {
            //     console.log("restarting gem upgrades");
            // }
            this.upgradeGems = true;
        }
        if (!this.upgradeGems) return;



        GemForger.balanceLoad();

        [...gemUpgradesManager.upgrades].sort((a, b) => b.id - a.id).forEach(upgrade => {
            if (upgrade.id == 0) {

            }

            if (upgrade.canPurchase()) {
                upgrade.purchase();
            }
        })
    }

    initSnapshot() {
        getUsedMineralCapacity();
        this.mineralsBeforeMine = new BigNumber(capacity);
        if (!isCapacityFull()) {
            isTakingSnapshot = true;
            valueBefore = getValueOfMineralsExcludingHe3();
        }
    }

    finishSnapshot(snapshotLengthInMinutes) {
        getUsedMineralCapacity();
        mineralsMined.shift();
        mineralsMined.push(new BigNumber(capacity).subtract(this.mineralsBeforeMine).divide(snapshotLengthInMinutes * 600));
        var valueDelta = getValueOfMineralsExcludingHe3().subtract(valueBefore).divide(snapshotLengthInMinutes * 600);
        singleMiningLoopValueSnapshot.push(valueDelta);
        if (singleMiningLoopValueSnapshot.length > 10) {
            singleMiningLoopValueSnapshot.splice(0, 1);
        }
        timesSinceSnapshot = 0;
        valueBefore = new BigNumber(0);
        isTakingSnapshot = false;
    }

    fixRows(rows) {
        let fixedRows = [];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i]) {
                fixedRows[i] = rows[i];
            }
            else {
                fixedRows[i] = [];
            }
        }
        return fixedRows;
    }

    downloadCsv() {
        //fixedRows.push([exportgametext()]);
        let fixedDepthCSV = this.fixRows(rows).map(e => e.join(",")).join("\n");
        let fixedDrillUpgradeCSV = this.fixRows(drillUpgradesRows).map(e => e.join(",")).join("\n");
        //let fixedMoneyCSV = this.fixRows(moneyRows).map(e => e.join(",")).join("\n");
        let time = Math.floor(currentTime() / 1000 / 60);
        let folder = `D${simDepth}-S${totalSims}-T${time}`;

        fs.mkdirSync(`dist/${folder}`, { recursive: true });

        saveContentToFile(`dist/${folder}/depth-T${time}.csv`, fixedDepthCSV);
        saveContentToFile(`dist/${folder}/drillUpgrades-T${time}.csv`, fixedDrillUpgradeCSV);
        //saveContentToFile(`dist/D${simDepth}-S${totalSims}-T${Math.floor(currentTime() / 1000 / 60)}/money.csv`, fixedMoneyCSV);
    }
}

function prepareSaveForSim(save) {
    return saves[0] = b64_to_utf8(b64_to_utf8(save)).split("|")
}

function runDepthSim(toDepth, numSims, useSave = false) {
    if (typeof localStorage["numSims"] == "undefined" || localStorage["numSims"] == 0) {
        localStorage["totalSims"] = numSims;
        localStorage["numSims"] = numSims;
        localStorage["simDepth"] = toDepth;
        localStorage["depthData"] = JSON.stringify(new Array(toDepth + 4).fill(JSON.stringify(new Array(numSims + 3).fill("0"))));
        localStorage["drillData"] = JSON.stringify(new Array(200).fill(JSON.stringify(new Array(numSims + 5).fill(""))));
        //localStorage["moneyData"] = JSON.stringify(new Array(toDepth + 4).fill(JSON.stringify(new Array(numSims).fill("0"))));

    }

    if (numSims > 0) {
        simDepth = toDepth
        totalSims = parseInt(localStorage["totalSims"]);
        currentSim = parseInt(numSims - 1);
        localStorage["numSims"] = currentSim;
        deleteGame(0);
        if (useSave) {
            RSc = 1;
            chosen = 0;
            prepareSaveForSim("TXprME16VXlNREU0TVRnME16RXpNekF3TURCOE1UZ3hOSHcxTmpNd05UTTFNRFE1T1RrNU9UazVNREF3TURBd01EQXdNREF3TURBd01EQXdNREF3TURCOE56WTFOakV4T1Rnd05qRXhOVEF6TnpCOE1URXlmREV4TTN3eE1UQjhNVEV4ZkRFd2ZERTBOWHd4TWpFNE9UWXpPVEEzTWpNMk5qRTROREF3TUh3ek56YzRNREkwTnpBMU5USXdPREUyTmpBd2ZESTNOelU0TnpBd01UVTJPREU0TVRRd01EQjhOVEEyTkRFMU56YzNNalkyTmpZNE1EQXdmRFF4TlRNMk9EQXhNRFEwTVRZek5qQXdNSHd4TmpNMk5qSTFNVFkxT1RVek5qZ3lOakI4TXpnd09UVTNNakUwT1RrNE56azROREI4TVRVNU5UZzNOekV5TmpFeU1qWXdNRFI4TnpVeE9UWTJOalEzTVRNeU1USTRObnd5TlRJME1EVTVPVGcxT1RFNE1ERTBmREU1TWpFNE5EVXdNemd4TlRReU1qWjhORGMwTXpNek5EUXlOek01TVRJd2ZERTFNVE00TnpJd01EUXhOek0xT0h3MU1qQTNORFEwTmpNMk1EUXdOWHd5TmpVNU1UVTBORFUzTURjNE1Yd3hOalUwTmpRek5qY3hPVFV3TTN3eE5UTXdOREEzTVRRMU1URjhUbUZPZkU1aFRueE9ZVTU4VG1GT2ZERTVOREUzTlRBek1Id3hPRFEwTmpjNU5Id3hPVFEwTURFNWZFNWhUbnd4TnpjMU56QTBOREo4TVRjeU56a3hOemQ4TVRjM056RTNOM3hPWVU1OE1UWTFPREl4TkRFNGZERTJOREExTXpNM2ZERTVPRE00TlRGOExURWhMVEVoTFRFaExURWhMVEVoTFRFaExURWhMVEVoTFRGOExURWhMVEVoTFRFaExURWhMVEVoTFRFaExURWhMVEVoTFRGOExURWhMVEVoTFRFaExURWhMVEVoTFRFaExURWhMVEVoTFRGOExURWhMVEVoTFRFaExURWhMVEVoTFRFaExURWhMVEVoTFRGOExURWhMVEVoTFRFaExURWhMVEVoTFRFaExURWhMVEVoTFRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHc0TVRNME56YzBmREFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZERXdmREFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEI4TXprMWZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eE56TXhOVFkwTXpRd2ZEQjhNVEV5TVRWOE1UQXhNRGg4TUNFeklUSXdNREFoTVNFd0lUQWhNSHg4Zkh4OGZIeDhmSHg4Zkh4OGZERXlmRFF3ZkRGOE1qQjhPVFVoT1RVaE9UVWhPVFVoT0RraE9UWWhPVFFoTVRBMElUZzNJVEV5T0NFeE5ETWhPVFVoT1RRaE9EZ2hNekFoTWlFeE5ERWhNVEkySVRFME1TRXhPWHg4Zkh4OGZIeDhmSHg4Zkh3ME0zd3pNVFY4T1RJME5IdzVPVGs1T1h3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVFF3TURBd01EQWhOREF3TURBd01DRTBNREF3TURBd0lUUXdNREF3TURBaE5EQXdNREF3TUNFME1EQXdNREF3SVRRd01EQXdNREFoTkRBd01EQXdNQ0UwTURBd01EQXdJVFF3TURBd01EQWhOREF3TURBd01DRTBNREF3TURBd0lUUXdNREF3TURBaE5EQXdNREF3TUNFME1EQXdNREF3SVRBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE1DRXdJVFF3TURBd01EQWhOREF3TURBd01DRTBNREF3TURBd0lUQWhOREF3TURBd01DRTBNREF3TURBd0lUUXdNREF3TURBaE1DRXdJVEFoTUNFd0lUQWhNQ0V3SVRBaE5EQXdNREF3TUNFME1EQXdNREF3SVRRd01EQXdNREFoTkRBd01EQXdNQ0UwTURBd01EQXdJVFF3TURBd01EQWhNQ0V3SVRBaE1IeDhOVEo4TlRGOE1EQXdNREF3TURBd01Id3hORGsyTVh3eE56TXhOVFkwTWpnMkxqazRJVFF3TlRBaE1TRXdJVEkzTkRreE9ETXhOREUwTkRFNU16TXdNQ0V3SVRFd0lUVXdNVE0wTkRBNU1qTXlNVEk0SVRSOE1qY3hPVGMzTnpJNU1qSTNNQ0V5TXpNNU5EVXdPRFUxTWpVNUlUSTROall6TXpZMU1ERTBPRE1oTWpNd09UUXpNekE0T1RJd09Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3hOek14TlRZME1qZzJMams0TVNFME1EVXdJVEVoTUNFeU56UTVNVGd6TVRReE5EUXhPVE16TURBaE1DRTBJVFkwTnpVNE5UTTJNakl3TmpNeU1UZ3dJVFI4T0RFME1ESXpNWHd3ZkMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQWhMVEVoTUNFdE1TRXdJUzB4SVRBaExURWhNQ0V0TVNFd0lTMHhJVEFoTFRFaE1DRXRNU0V3SVMweElUQjhPUzR3SVRrdU1TRTVMakloTVRBdU1DRXhNQzR4SVRFd0xqSWhOQzR3SVRRdU1TRTBMakloTkM0eklUUXVOQ0UwTGpVaE1TNHdJVEV1TVNFeExqSWhNUzR6SVRFdU5DRXhMalVoTVM0MklURXVOeUV4TGpnaE1TNDVJVEV1TVRBaE1TNHhNU0V4TGpFeUlURXVNVE1oTVM0eE5DRXhMakUxSVRZdU1DRTJMak1oTmk0MklUWXVPU0UyTGpFd0lUWXVNVE1oTmk0eU1TRTJMakkwSVRZdU1UZ2hNeTR3SVRNdU1TRXpMakloTnk0d0lUY3VNU0UzTGpJaE9DNHdJVGd1TVNFNExqSWhNeTR4TUNFekxqRXhJVEV1TVRZaE1TNHhOeUV4TGpFNElURXVNVGtoTVM0eU1DRXhMakl4SVRFdU1qSWhNUzR5TXlFeExqSTBJVEV1TWpVaE1TNHlOaUV4TGpJM0lURXVNamdoTVM0eU9TRXhMak13SVRFdU16RWhNeTQ0SVRNdU9TRXhMak15SVRFdU16TWhNUzR6TkNFeExqTTFJVEV1TXpZaE1TNHpOeUV4TGpNNElURXVNemtoTVM0ME1DRXhMalF4SVRFdU5ESWhNUzQwTXlFeExqUTBJVEV1TkRVaE1TNDBOaUV4TGpRM0lUTXVNeUV6TGpRaE55NHpJVGd1TXlFekxqRXlJVE11TVRNaE15NHhOQ0V4TGpVeElURXVOVEFoTVM0ME9TRXhMalUwSVRFdU5UTWhNUzQwT0NFeExqVXlJVEV1TlRjaE1TNDFOaUV4TGpVMUlURXVOVGdoTVM0Mk1DRXhMalU1SVRFdU5qRWhNUzQyTWlFeExqWXpJVEV1TmpRaE1TNDJOU0V4TGpZMklURXVOamNoTVM0Mk9DRXhMalk1SVRNdU5TRXhMamN5SVRNdU55RXpMalloTmk0eE55RTJMakkxSVRZdU1qWWhOaTR5TnlFMkxqRTFJVFl1TVRZaE5pNHlJVFl1TlNFMkxqZ2hOaTR4TWlFMkxqSXpJVFl1TWpBaE5pNHhOQ0UyTGpFaE5pNDBJVFl1TnlFMkxqRXhJVFl1TWpJaE5pNHhPU0V4TGpjeElURXVOekFoTVM0M015RXhMamMxSVRFdU56UWhNUzQzTmlFeExqYzNJVEV1TnpnaE1TNDNPU0V4TGpnd0lURXVPREVoTVM0NE1pRXhMamd6SVRFdU9EUWhNUzQ0TlNFeExqZzJJVEV1T0RjaE1TNDRPQ0V4TGpFd05pRXhMamc1SVRFdU9UQWhNUzQ1TXlFeExqa3hJVEV1T1RJaE1TNDVOQ0V4TGprMUlURXVPVFloTVM0NU9DRXhMams1SVRFdU9UY2hNUzR4TURFaE1TNHhNREFoTVM0eE1EVWhNUzR4TURJaE1TNHhNRE1oTVM0eE1EUWhNUzR4TURjaE1TNHhNRGdoTVM0eE1Ea2hNUzR4TVRBaE1TNHhNVEVoTVM0eE1USWhNUzR4TVRNaE1TNHhNVFFoTVM0eE1UVWhNUzR4TVRZaE1TNHhNVGNoTVM0eE1UZ2hNUzR4TVRraE1pNHdmREV3ZkRFd2ZDRXlMakI4Tmk0d0lUWXVNeUUyTGpZaE5pNDVJVFl1TVRBaE5pNHhNeUUyTGpJeElUWXVNalFoTmk0eE9DRXpMak1oTXk0MElUZ3VNeUV6TGpFeUlUTXVNVE1oTXk0eE5DRXpMalVoTXk0M0lUTXVOaUUyTGpFM0lUWXVNalVoTmk0eU5pRTJMakkzSVRZdU1UVWhOaTR4TmlFMkxqSWhOaTQxSVRZdU9DRTJMakV5SVRZdU1qTWhOaTR5TUNFMkxqRTBJVFl1TVNFMkxqUWhOaTQzSVRZdU1URWhOaTR5TWlFMkxqRTVJVEl1TUh3eWZERjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNSHd5TmpnMU1ESTFOVFo4TVRNME9EY3dPRFF5ZkRZM01qazVOalV4ZkRrM01qRTVPVGN5ZkRrM01UYzVOVFo4TWpNM01UTTRmREo4ZkRCOE1Id3hmQzB4ZkRneE5EUTVOVFo4TVRjek1UVTJOREk0Tmk0NU9TRTROemMxSVRBaE16WWhOVEEyTVRjek55RXdJVE0zSVRFeU1qSTVNamd6SVRCOE1UY3pNVFUyTkRJNE5pNDVPVE1oT0RjM05TRXdJVE0zSVRNMk5ETXlOaUV5SVRBaE1TRXdmREV5TVRNeU5EY3lOelUwTXpkOE1UUTNNRE16TlRNeE1Ea3pmRFU1TVRJNE1EZzBPRGsxZkRjM05EVXlPRGszTnpkOE5Ea3hNVFI4TVRVNU5qTjhNVGg4TkRBeWZETjhNSHcyZkh3eGZEQjhNSHc1TWpJMk5UQXdmREI4TUh3MWZEVjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTWhNVE1oTVRNaE1UTjhXMTE4TW53eGZEQjhNSHd3ZkRCOE1Id3dmREI4TUh3eWZEQjhPREY4TUh3d2ZEQjhNSHd3ZkRRek1IdzRPVEI4TnpjMWZEQjhNSHd3ZkRFM09UTTVPWHd5TVRNNWZEVXlNakU1TkRNd01EUTFOSHd3ZkRGOE1Id3hmREI4TVh3d2ZERjhNSHd4ZkRCOE1Yd3dmREY4TUh3eGZEQjhNWHd4TkRnM016ZzFmREI4TUh3d2ZEQjhOQ0UxTUNFeE16UTRPREF3SVRFek5ERTNNamt3TURBaFEyaGxjM1FoTUNvMElUVXdJVE0yTmpBd0lUTXdOelkzTURBd0lYUnlZV1JsSVRBcU5DRXhNREFoTWpBME5EUTVOREFoTWpBME16azFNemN3TURBaFFuVm1aa3hoWWlFeEtqVWhNVEF3SVRFNE5qRTRNREF3TUNFeE1ERTFNRE00T0Rrd01EQWhRblZtWmt4aFlpRXhLakFoTVRBd0lURXdNRFUzTkRFd01DRXhOVGsxT0Rjek9EQXdNQ0ZDZFdabVRHRmlJVEY4TVRBNE1ud3dmREUzTmpreWZESTFOREExTURjNE9Id3hNemg4Tlh3emZEVjhOSHc0TkRjd05Ua3hOWHczZkRkOE1Id3dmREY4TnpCOE1qWjhPSHd3ZkRCOE1IdzVOSHd4TURBNE5ERjhNSHd5TURjMU9ETTNPVGMwZkRFeE1EUXhNVEExTjN3ME56WXdNREUyTVRWOE1Ua3pPREF3TXpjeWZESXpORFkxTWpJNU1YdzJNakl4T1Rjd01UWjhPRGt3T1RFM09EWXdmREUwTVRVM01ERTNOVEI4TkRrMU1EZ3dOVGw4T1RFNE16STJOamt6ZkRnMU5qZ3hOell6TVh3eGZHWmhiSE5sSVRBaE1DRXhOVEF3SVRFMU1EQWhOalV3SVdaaGJITmxJVU5oZG1WT2IyUmxMREFzTUM0MUxEQXNNQzR4TERBc0xIUnlkV1VoSVh4bVlXeHpaU0V3SVRBaE1UVXdNQ0V4TlRBd0lUWTFNQ0ZtWVd4elpTRkRZWFpsVG05a1pTd3dMREF1TlN3d0xEQXVNU3d3TEN4MGNuVmxJU0Y4ZEhKMVpTRTBOaUUxSVRFek1USWhNVFV3TUNFMk5UQWhabUZzYzJVaFEyRjJaVTV2WkdVc01Dd3dMalVzTUN3d0xqRXNNQ3dzZEhKMVpTeERZWFpsUW14dlkydGxjbEp2WTJzc01DNHlMREF1TWpnM01ETTNNRE0zTURNM01ETTNNRE1zTVN3eExEQXdMREV3TUN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TkRFMk5qWTJOalkyTmpZMk5qWTJOeXd3TGpJeE1qazJNamsyTWprMk1qazJNamszTERJc01DNHhMREF3TUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpZeE5qWTJOalkyTmpZMk5qWTJOamNzTUM0MU5UVTFOVFUxTlRVMU5UVTFOVFUyTERNc01DNHhMREF3TURBc0xDeERZWFpsU0dGNllYSmtVbUZrYVdGMGFXOXVMREF1Tnpnek16TXpNek16TXpNek16TXpNeXd3TGpVMU5UVTFOVFUxTlRVMU5UVTFOVFlzTkN3ekxEQXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDVPRE16TXpNek16TXpNek16TXpNekxEQXVNVEkxTERVc01DNHhMREF3TURBd01Dd3NMRU5oZG1WT2IyUmxMREF1T1Rnek16TXpNek16TXpNek16TXpNeXd3TGpRek1UWTJOalkyTmpZMk5qWTJOalkwTERVc01DNHhMREF3TURBd01Td3NMRU5oZG1WT2IyUmxMREV1TURFMk5qWTJOalkyTmpZMk5qWTJOaXd3TGpjMk5TdzFMREF1TVN3d01EQXdNRElzTEN4RFlYWmxWR1Z5Y21GcGJrMTFaQ3d3TGpFNE16TXpNek16TXpNek16TXpNek0xTERBdU56ZzNNRE0zTURNM01ETTNNRE0zTERFc01DNHpMREF4TEN4MGNuVmxMRU5oZG1WSVlYcGhjbVJTWVdScFlYUnBiMjRzTUM0ek9ETXpNek16TXpNek16TXpNek16Tml3d0xqYzFMRElzTXl3d01UQXNMSFJ5ZFdVaFEyRjJaVUpoYzJsalEyaGxjM1FzTURBd0xERXNMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TURBd01EQXNPVFkzTnpFeU5EWTFOemczTlRZd05EQXdMQ3htWVd4elpTeERZWFpsUW1GemFXTkRhR1Z6ZEN3d01EQXdNREVzTVN3c1ptRnNjMlVzUTJGMlpVMXZibVY1UW1GbkxEQXdNREF3TWl3NE9UUTBNREE1TVRVek5Ea3hNRGc0TURBc0xHWmhiSE5sSVh4MGNuVmxJVEV3TUNFNElURXpNVEloTVRVd01DRTJOVEFoWm1Gc2MyVWhRMkYyWlU1dlpHVXNNQ3d3TGpVc01Dd3dMakVzTUN3c2RISjFaU3hEWVhabFZHVnljbUZwYmsxMVpDd3dMakV5TlN3d0xqUTBORFEwTkRRME5EUTBORFEwTkRRc01Td3dMak1zTURBc0xIUnlkV1VzUTJGMlpWUmxjbkpoYVc1TmRXUXNNQzR5TmpBME1UWTJOalkyTmpZMk5qWTNMREF1TkRRME5EUTBORFEwTkRRME5EUTBOQ3d5TERBdU15d3dNREFzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzR6TmpRMU9ETXpNek16TXpNek16TXpMREF1TkRRME5EUTBORFEwTkRRME5EUTBOQ3d6TERBdU1Td3dNREF3TEN3c1EyRjJaVTV2WkdVc01DNDBPRGsxT0RNek16TXpNek16TXpNekxEQXVOU3cwTERBdU1Td3dNREF3TUN3c0xFTmhkbVZDYkc5amEyVnlVbTlqYXl3d0xqWXhORFU0TXpNek16TXpNek16TXpRc01DNHhOVEUyTmpZMk5qWTJOalkyTmpZMk55dzFMREVzTURBd01EQXdMREV3TUN3c1EyRjJaVTV2WkdVc01DNDNNemsxT0RNek16TXpNek16TXpNMExEQXVNamczTURNM01ETTNNRE0zTURNM01ETXNOaXd3TGpFc01EQXdNREF3TUN3c0xFTmhkbVZPYjJSbExEQXVPRFkwTlRnek16TXpNek16TXpNek5Dd3dMakkxTERjc01DNHhMREF3TURBd01EQXdMQ3dzUTJGMlpVNXZaR1VzTUM0NU9EazFPRE16TXpNek16TXpNek0wTERBdU1UVXhOalkyTmpZMk5qWTJOalkyTmpjc09Dd3dMakVzTURBd01EQXdNREF3TEN3c1EyRjJaVUpzYjJOclpYSlNiMk5yTERBdU5qRTBOVGd6TXpNek16TXpNek16TkN3d0xqUXpNVFkyTmpZMk5qWTJOalkyTmpZMExEVXNNU3d3TURBd01ERXNNVEF3TEN4RFlYWmxUbTlrWlN3d0xqY3pPVFU0TXpNek16TXpNek16TXpRc01DNDNOU3cyTERBdU1Td3dNREF3TURFd0xDd3NRMkYyWlU1dlpHVXNNQzQ0TnpVc01DNDNOU3czTERBdU1Td3dNREF3TURFd01Dd3NMRU5oZG1WSVlYcGhjbVJTWVdScFlYUnBiMjRzTVM0d01UQTBNVFkyTmpZMk5qWTJOalkzTERBdU5ETXhOalkyTmpZMk5qWTJOalkyTmpRc09Dd3pMREF3TURBd01UQXdNQ3dzTEVOaGRtVlVaWEp5WVdsdVRYVmtMREF1T1RnNU5UZ3pNek16TXpNek16TXpOQ3d3TGpneE9ETXpNek16TXpNek16TXpNeklzT0N3d0xqTXNNREF3TURBeE1EQXhMQ3dzUTJGMlpVNXZaR1VzTUM0Mk1qVXNNQzQ0TVRnek16TXpNek16TXpNek16TXlMRFVzTUM0eExEQXdNREF3TWl3c0lVTmhkbVZDWVhOcFkwTm9aWE4wTERBd01EQXNNU3dzWm1Gc2MyVXNRMkYyWlVKaGMybGpRMmhsYzNRc01EQXdNREFzTVN3c1ptRnNjMlVzUTJGMlpVSjFabVlzTURBd01EQXdNREFzTVN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNREF3TURBd01EQXNNVEFzTEdaaGJITmxMRU5oZG1WQ2RXbHNaR2x1WjAxaGRHVnlhV0ZzY3l3d01EQXdNREV3TERJc0xHWmhiSE5sTEVOaGRtVkNkV2xzWkdsdVowMWhkR1Z5YVdGc2N5d3dNREF3TURFd01Dd3hMQ3htWVd4elpTeERZWFpsUW5WbVppd3dNREF3TURJc01Td3NabUZzYzJVaGZIUnlkV1VoTVRJek9DRXlOQ0V6TlRZMUlUWXpOVGtoTVRBd0lYUnlkV1VoUTJGMlpVNXZaR1VzTUN3d0xqVXNNQ3d3TGpFc01Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqQTBNVFkyTmpZMk5qWTJOalkyTmpZMk5Dd3dMakEyTWpVc01Td3dMakVzTURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0d09ETXpNek16TXpNek16TXpNek16TXl3d0xqRXlOU3d5TERBdU1Td3dNREFzTEhSeWRXVXNRMkYyWlVKc2IyTnJaWEpTYjJOckxEQXVNVEl4TlRJM056YzNOemMzTnpjM056Z3NNQzR3T0RNd01USTRNakExTVRJNE1qQTFNU3d6TERFc01EQXdNQ3d4TURBc2RISjFaU3hEWVhabFRtOWtaU3d3TGpBME1UWTJOalkyTmpZMk5qWTJOalkyTkN3d0xqTXpNekF4TWpneU1EVXhNamd5TURVc01Td3dMakVzTURFc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0d09EWTRNRFUxTlRVMU5UVTFOVFUxTlN3d0xqUTFPRE16TXpNek16TXpNek16TXpNc01pd3dMakVzTURFd0xDeDBjblZsTEVOaGRtVk9iMlJsTERBdU1USXhOVEkzTnpjM056YzNOemMzTnpnc01DNHpNek13TVRJNE1qQTFNVEk0TWpBMUxETXNNQzR4TERBeE1EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHhNakUxTWpjM056YzNOemMzTnpjM09Dd3dMalU0TXpBeE1qZ3lNRFV4TWpneU1EWXNNeXd3TGpFc01ERXdNU3dzZEhKMVpTeERZWFpsU0dGNllYSmtVbUZrYVdGMGFXOXVMREF1TVRZMk5qWTJOalkyTmpZMk5qWTJOallzTUM0eU5TdzBMRE1zTURFd01UQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHlNVEU0TURVMU5UVTFOVFUxTlRVMU5Td3dMalUxTlRVMU5UVTFOVFUxTlRVMU5UWXNOU3d3TGpFc01ERXdNVEF3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TWpVc01DNDFMRFlzTUM0eExEQXhNREV3TURBc0xIUnlkV1VzUTJGMlpVaGhlbUZ5WkV4aGRtRXNNQzR5T0RneE9UUTBORFEwTkRRME5EUTFMREF1TURNeE1qVXNOeXcxTERBeE1ERXdNREF3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TWpnNE1UazBORFEwTkRRME5EUTBOU3d3TGpJME56Z3hNekUwTmprNU56a3lPVFlzTnl3d0xqRXNNREV3TVRBd01ERXNMSFJ5ZFdVc1EyRjJaVWhoZW1GeVpGSmhaR2xoZEdsdmJpd3dMakk1TVRZMk5qWTJOalkyTmpZMk5qY3NNQzQwTXpFeU5TdzNMRE1zTURFd01UQXdNRElzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzR5T1RFMk5qWTJOalkyTmpZMk5qWTNMREF1TmpRM09ERXpNVFEyT1RrM09USTVOaXczTERBdU1Td3dNVEF4TURBd015d3NkSEoxWlN4RFlYWmxTR0Y2WVhKa1VtRmthV0YwYVc5dUxEQXVNek0yT0RBMU5UVTFOVFUxTlRVMU5Td3dMakEyTWpVc09Dd3pMREF4TURFd01EQXpNQ3dzZEhKMVpTeERZWFpsU0dGNllYSmtUR0YyWVN3d0xqTTNNVFV5TnpjM056YzNOemMzTnpnc01DNHdOREU1T0RjeE56azBPRGN4TnprME9TdzVMRFVzTURFd01UQXdNRE13TUN3c2RISjFaU3hEWVhabFZHVnljbUZwYmsxMVpDd3dMalF4TmpZMk5qWTJOalkyTmpZMk5qY3NNQzR3T0RNd01USTRNakExTVRJNE1qQTFNU3d4TUN3d0xqTXNNREV3TVRBd01ETXdNREFzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQwTVRZMk5qWTJOalkyTmpZMk5qWTNMREF1TWpreE9UZzNNVGM1TkRnM01UYzVOU3d4TUN3d0xqRXNNREV3TVRBd01ETXdNREVzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQwTlRnek16TXpNek16TXpNek16TXpMREF1TURFME5qZzJPRFV6TURBeU1EY3dNemsyTERFeExEQXVNU3d3TVRBeE1EQXdNekF3TVRBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ek56ZzBOekl5TWpJeU1qSXlNakl5TERBdU16RXlOU3c1TERBdU1Td3dNVEF4TURBd016QXhMQ3gwY25WbExFTmhkbVZVWlhKeVlXbHVUWFZrTERBdU5ERXpNVGswTkRRME5EUTBORFEwTlN3d0xqVTRNekF4TWpneU1EVXhNamd5TURZc01UQXNNQzR6TERBeE1ERXdNREF6TURFd0xDeDBjblZsTEVOaGRtVk9iMlJsTERBdU5EVTBPRFl4TVRFeE1URXhNVEV4TVN3d0xqSTBOemd4TXpFME5qazVOemt5T1RZc01URXNNQzR4TERBeE1ERXdNREF6TURFd01Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqVXNNQzR4TWpVc01USXNNQzR4TERBeE1ERXdNREF6TURFd01EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNDFOREUyTmpZMk5qWTJOalkyTmpZMkxEQXVNRFl5TlN3eE15d3RNaTQ1TERBeE1ERXdNREF6TURFd01EQXdMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVOVGM1T0RZeE1URXhNVEV4TVRFeE1pd3dMakUxTVRZMk5qWTJOalkyTmpZMk5qWTNMREUwTERBdU1Td3dNVEF4TURBd016QXhNREF3TURBc0xIUnlkV1VzUTJGMlpVaGhlbUZ5WkZKaFpHbGhkR2x2Yml3d0xqVTRNek16TXpNek16TXpNek16TXpRc01DNDBPRFVzTVRRc015d3dNVEF4TURBd016QXhNREF3TURFc0xIUnlkV1VzUTJGMlpVaGhlbUZ5WkZKaFpHbGhkR2x2Yml3d0xqWXlPRFEzTWpJeU1qSXlNakl5TWpJc01DNHdORGM0TVRNeE5EWTVPVGM1TWprMkxERTFMRE1zTURFd01UQXdNRE13TVRBd01EQXhNQ3dzZEhKMVpTeERZWFpsVG05a1pTd3dMall5TVRVeU56YzNOemMzTnpjM056Z3NNQzR5TXpFeU5Td3hOU3d3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TVN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpZMk16RTVORFEwTkRRME5EUTBORFFzTUM0d09UZ3pNek16TXpNek16TXpNek16TXl3eE5pd3RNaTQ1TERBeE1ERXdNREF6TURFd01EQXdNVEV3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TmpJMUxEQXVORFEzT0RFek1UUTJPVGszT1RJNU5pd3hOU3d3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TWl3c2RISjFaU3hEWVhabFNHRjZZWEprVW1Ga2FXRjBhVzl1TERBdU5qY3dNVE00T0RnNE9EZzRPRGc0T0N3d0xqUXpNVFkyTmpZMk5qWTJOalkyTmpZMExERTJMRE1zTURFd01UQXdNRE13TVRBd01EQXhNakFzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQzTURRNE5qRXhNVEV4TVRFeE1URXlMREF1TVRJMUxERTNMREF1TVN3d01UQXhNREF3TXpBeE1EQXdNREV5TURBc0xIUnlkV1VzUTJGMlpVaGhlbUZ5WkZKaFpHbGhkR2x2Yml3d0xqY3hNVGd3TlRVMU5UVTFOVFUxTlRZc01DNDBOVGd6TXpNek16TXpNek16TXpNekxERTNMRE1zTURFd01UQXdNRE13TVRBd01EQXhNakF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TnpVc01DNHlOU3d4T0N3d0xqRXNNREV3TVRBd01ETXdNVEF3TURBeE1qQXhNQ3dzTEVOaGRtVk9iMlJsTERBdU56a3hOalkyTmpZMk5qWTJOalkyTml3d0xqRTFNVFkyTmpZMk5qWTJOalkyTmpZM0xERTVMREF1TVN3d01UQXhNREF3TXpBeE1EQXdNREV5TURFd01Dd3NMRU5oZG1WT2IyUmxMREF1T0RNMk9EQTFOVFUxTlRVMU5UVTFOaXd3TGpJMUxESXdMREF1TVN3d01UQXhNREF3TXpBeE1EQXdNREV5TURFd01EQXNMQ3hEWVhabFNHRjZZWEprVW1Ga2FXRjBhVzl1TERBdU9EYzFMREF1TWpFeU9UWXlPVFl5T1RZeU9UWXlPVGNzTWpFc015d3dNVEF4TURBd016QXhNREF3TURFeU1ERXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDVNVFkyTmpZMk5qWTJOalkyTmpZMkxEQXVNRFF4T1RnM01UYzVORGczTVRjNU5Ea3NNaklzTUM0eExEQXhNREV3TURBek1ERXdNREF3TVRJd01UQXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDVNVFkyTmpZMk5qWTJOalkyTmpZMkxEQXVNamt4T1RnM01UYzVORGczTVRjNU5Td3lNaXd3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TWpBeE1EQXdNREVzTEN4RFlYWmxUbTlrWlN3d0xqYzRPREU1TkRRME5EUTBORFEwTkRRc01DNDBOVGd6TXpNek16TXpNek16TXpNekxERTVMREF1TVN3d01UQXhNREF3TXpBeE1EQXdNREV5TURFd01Td3NMRU5oZG1WT2IyUmxMREF1TnpBME9EWXhNVEV4TVRFeE1URXhNaXd3TGpjNU1UWTJOalkyTmpZMk5qWTJOallzTVRjc01DNHhMREF4TURFd01EQXpNREV3TURBd01USXdNaXdzZEhKMVpTeERZWFpsVG05a1pTd3dMamMwTmpVeU56YzNOemMzTnpjM056Z3NNQzQzTlN3eE9Dd3dMakVzTURFd01UQXdNRE13TVRBd01EQXhNakF5TUN3c0xFTmhkbVZJWVhwaGNtUk1ZWFpoTERBdU56ZzRNVGswTkRRME5EUTBORFEwTkN3d0xqYzJOU3d4T1N3MUxEQXhNREV3TURBek1ERXdNREF3TVRJd01qQXdMQ3dzUTJGMlpVaGhlbUZ5WkV4aGRtRXNNQzQ0TXpZNE1EVTFOVFUxTlRVMU5UVTJMREF1TnpFeU9UWXlPVFl5T1RZeU9UWXpMREl3TERVc01ERXdNVEF3TURNd01UQXdNREF4TWpBeU1EQXdMQ3dzUTJGMlpVaGhlbUZ5WkZKaFpHbGhkR2x2Yml3d0xqZzNPRFEzTWpJeU1qSXlNakl5TWpJc01DNDNPRGN3TXpjd016Y3dNemN3TXpjc01qRXNNeXd3TVRBeE1EQXdNekF4TURBd01ERXlNREl3TURBd0xDd3NRMkYyWlU1dlpHVXNNQzQ1TVRNeE9UUTBORFEwTkRRME5EUTBMREF1TlRZeU5Td3lNaXd3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TWpBeU1EQXdNREFzTEN4RFlYWmxUbTlrWlN3d0xqazFPRE16TXpNek16TXpNek16TXpRc01DNHdPRE13TVRJNE1qQTFNVEk0TWpBMU1Td3lNeXd3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TWpBeU1EQXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDVOakU0TURVMU5UVTFOVFUxTlRVMkxEQXVNek16TURFeU9ESXdOVEV5T0RJd05Td3lNeXd3TGpFc01ERXdNVEF3TURNd01UQXdNREF4TWpBeU1EQXdNREF4TEN3c1EyRjJaVlJsY25KaGFXNU5kV1FzTUM0NU5UUTROakV4TVRFeE1URXhNVEV5TERBdU5UWXlOU3d5TXl3d0xqTXNNREV3TVRBd01ETXdNVEF3TURBeE1qQXlNREF3TURBeUxDd3NRMkYyWlU1dlpHVXNNUzR3TURNME56SXlNakl5TWpJeU1qSXpMREF1TURnek1ERXlPREl3TlRFeU9ESXdOVEVzTWpRc01DNHhMREF4TURFd01EQXpNREV3TURBd01USXdNakF3TURBd01qQXNMQ3hEWVhabFRtOWtaU3d4TGpBd016UTNNakl5TWpJeU1qSXlNak1zTUM0ek16TXdNVEk0TWpBMU1USTRNakExTERJMExEQXVNU3d3TVRBeE1EQXdNekF4TURBd01ERXlNREl3TURBd01ESXhMQ3dzUTJGMlpVSnNiMk5yWlhKU2IyTnJMREVzTUM0MU9ETXdNVEk0TWpBMU1USTRNakEyTERJMExERXNNREV3TVRBd01ETXdNVEF3TURBeE1qQXlNREF3TURBeU1pd3hNREFzTEVOaGRtVlVaWEp5WVdsdVRYVmtMREV1TURBek5EY3lNakl5TWpJeU1qSXlNeXd3TGpjNU1UazROekUzT1RRNE56RTNPVFFzTWpRc01DNHpMREF4TURFd01EQXpNREV3TURBd01USXdNakF3TURBd01qTXNMQ3hEWVhabFRtOWtaU3d3TGprMk1UZ3dOVFUxTlRVMU5UVTFOVFlzTUM0NE1USTFMREl6TERBdU1Td3dNVEF4TURBd016QXhNREF3TURFeU1ESXdNREF3TURNc0xDeERZWFpsVG05a1pTd3dMamt5TURFek9EZzRPRGc0T0RnNE9EZ3NNQzQ0TXpNd01USTRNakExTVRJNE1qQTJMREl5TEMweUxqa3NNREV3TVRBd01ETXdNVEF3TURBeE1qQXlNREF3TURFc0xDeERZWFpsVG05a1pTd3dMall5T0RRM01qSXlNakl5TWpJeU1qSXNNQzQyTVRRMk9EWTROVE13TURJd056QTBMREUxTERBdU1Td3dNVEF4TURBd016QXhNREF3TURFekxDeDBjblZsTEVOaGRtVk9iMlJsTERBdU5qSXhOVEkzTnpjM056YzNOemMzT0N3d0xqZ3hORFk0TmpnMU16QXdNakEzTURRc01UVXNNQzR4TERBeE1ERXdNREF6TURFd01EQXdNVFFzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQyTmpNeE9UUTBORFEwTkRRME5EUTBMREF1TnpZMUxERTJMREF1TVN3d01UQXhNREF3TXpBeE1EQXdNREUwTUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpVME5URXpPRGc0T0RnNE9EZzRPRGdzTUM0ek16TXdNVEk0TWpBMU1USTRNakExTERFekxEQXVNU3d3TVRBeE1EQXdNekF4TURBd01Td3NkSEoxWlN4RFlYWmxWR1Z5Y21GcGJrMTFaQ3d3TGpVd016UTNNakl5TWpJeU1qSXlNaklzTUM0ME9EVXNNVElzTUM0ekxEQXhNREV3TURBek1ERXdNREVzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQxTXpneE9UUTBORFEwTkRRME5EUTBMREF1TlRnek1ERXlPREl3TlRFeU9ESXdOaXd4TXl3d0xqRXNNREV3TVRBd01ETXdNVEF3TVRBc0xIUnlkV1VzUTJGMlpWUmxjbkpoYVc1TmRXUXNNQzQwTlRnek16TXpNek16TXpNek16TXpMREF1TkRRM09ERXpNVFEyT1RrM09USTVOaXd4TVN3d0xqTXNNREV3TVRBd01ETXdNVEF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TkRZeE9EQTFOVFUxTlRVMU5UVTFOU3d3TGpZME56Z3hNekUwTmprNU56a3lPVFlzTVRFc01DNHhMREF4TURFd01EQXpNREV3TWl3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpVc01DNDNOalVzTVRJc01DNHhMREF4TURFd01EQXpNREV3TWpBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0MU16Z3hPVFEwTkRRME5EUTBORFEwTERBdU9ETXpNREV5T0RJd05URXlPREl3Tml3eE15d3dMakVzTURFd01UQXdNRE13TVRBeU1EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNDFOems0TmpFeE1URXhNVEV4TVRFeUxEQXVOelkxTERFMExEQXVNU3d3TVRBeE1EQXdNekF4TURJd01EQXNMQ3hEWVhabFRtOWtaU3d3TGpRMk1UZ3dOVFUxTlRVMU5UVTFOVFVzTUM0NE5EYzRNVE14TkRZNU9UYzVNamsyTERFeExEQXVNU3d3TVRBeE1EQXdNekF4TURNc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ME1qQXhNemc0T0RnNE9EZzRPRGc1TERBdU9ETXpNREV5T0RJd05URXlPREl3Tml3eE1Dd3dMakVzTURFd01UQXdNRE13TVRFc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ek16TXpNek16TXpNek16TXpNek16TERBdU1qa3hPVGczTVRjNU5EZzNNVGM1TlN3NExEQXVNU3d3TVRBeE1EQXdNekVzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzR5T1RFMk5qWTJOalkyTmpZMk5qWTNMREF1T0RNeE1qVXNOeXd3TGpFc01ERXdNVEF3TURRc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ek1qazROakV4TVRFeE1URXhNVEV4TERBdU5UWXlOU3c0TERBdU1Td3dNVEF4TURBd05EQXNMSFJ5ZFdVc1EyRjJaVUpzYjJOclpYSlNiMk5yTERBdU16TXpNek16TXpNek16TXpNek16TXl3d0xqZ3pNekF4TWpneU1EVXhNamd5TURZc09Dd3hMREF4TURFd01EQTBNU3c1T0M0d01EQXdNREF3TURBd01EQXhNU3gwY25WbExFTmhkbVZPYjJSbExEQXVNemM0TkRjeU1qSXlNakl5TWpJeU1pd3dMalUwTVRrNE56RTNPVFE0TnpFM09UUXNPU3d3TGpFc01ERXdNVEF3TURReE1Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqTTNOU3d3TGpnek16QXhNamd5TURVeE1qZ3lNRFlzT1N3d0xqRXNNREV3TVRBd01EUXhNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMakEwTlRFek9EZzRPRGc0T0RnNE9EZzVMREF1TlRZeU5Td3hMREF1TVN3d01pd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqQTNPVGcyTVRFeE1URXhNVEV4TVRFc01DNDRNVGd6TXpNek16TXpNek16TXpNeUxESXNNQzR4TERBeU1Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqRXlPRFEzTWpJeU1qSXlNakl5TWpJc01DNDRNek13TVRJNE1qQTFNVEk0TWpBMkxETXNNQzR4TERBeU1EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHhOekF4TXpnNE9EZzRPRGc0T0RnNE55d3dMamM0TnpBek56QXpOekF6TnpBek55dzBMREF1TVN3d01qQXdNQ3dzTEVOaGRtVk9iMlJsTERBdU1ETTRNVGswTkRRME5EUTBORFEwTkRRc01DNDNPVEU1T0RjeE56azBPRGN4TnprMExERXNNQzR4TERBekxDeDBjblZsSVVOaGRtVk5hVzVsY21Gc1VHbHNaU3dzTXpRME1qTXhOekF4TVRNNE9UTTBNQ3d4TWpNNExHWmhiSE5sTEVOaGRtVkNZWE5wWTBOb1pYTjBMQ3d4TEN4bVlXeHpaU3hEWVhabFFtRnphV05EYUdWemRDd3NNU3dzWm1Gc2MyVXNRMkYyWlZScGJXVnNZWEJ6WlN3c01UTXNMR1poYkhObExFTmhkbVZDZFdabUxDd3hMQ3htWVd4elpTeERZWFpsUW5WcGJHUnBibWROWVhSbGNtbGhiSE1zTERNc0xHWmhiSE5sTEVOaGRtVkNZWE5wWTBOb1pYTjBMREF4TURFd01EQXhMREVzTEdaaGJITmxMRU5oZG1WQ2RXbHNaR2x1WjAxaGRHVnlhV0ZzY3l3c01pd3NabUZzYzJVc1EyRjJaVlJwYldWc1lYQnpaU3d3TVRBeE1EQXdNekF3TVN3eE9Dd3NabUZzYzJVc1EyRjJaVTFwYm1WeVlXeFFhV3hsTERBeE1ERXdNREF6TURFc05UZzNORGN5TmpBNE9ETXhNRFV4TXpBd0xERXlNemdzWm1Gc2MyVXNRMkYyWlVobFlXeDBhRkJoWTJzc01ERXdNVEF3TURNd01UQXdNREFzTVRVc0xHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF4TURBd016QXhNREF3TURBc01qVTFPVGt5TURJMU5qTTFOekUwTXpBd01Dd3NabUZzYzJVc1EyRjJaVWhsWVd4MGFGQmhZMnNzTURFd01UQXdNRE13TVRBd01EQXhNVEFzTVRVc0xHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF4TURBd016QXhNREF3TURFeUxESTFORFEwTURVMU9EZ3hNelkzT1RZd01EQXNMR1poYkhObExFTmhkbVZUWTJsbGJuUnBjM1FzTURFd01UQXdNRE13TVRBd01EQXhNakF3TERBc0xHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF4TURBd016QXhNREF3TURFeU1ERXdMREV6TkRNMU56QXlOamM0T0RFNU9URXdNREF3TEN4bVlXeHpaU3hEWVhabFFuVnBiR1JwYm1kTllYUmxjbWxoYkhNc01ERXdNVEF3TURNd01UQXdNREF4TWpBeE1EQXdNREVzTlN3c1ptRnNjMlVzUTJGMlpVMXBibVZ5WVd4UWFXeGxMREF4TURFd01EQXpNREV3TURBd01USXdNakF3TURBd01DdzBPVFUxTnpJME5ERXlPVFExT1RNMU1EQXdMREV5TXpnc1ptRnNjMlVzUTJGMlpVMXBibVZ5WVd4UWFXeGxMREF4TURFd01EQXpNREV3TURBd01USXdNakF3TURBd01TdzBPVFUxTnpJME5ERXlPVFExT1RNMU1EQXdMREV5TXpnc1ptRnNjMlVzUTJGMlpVZHZiR1JEYUdWemRDd3dNVEF4TURBd016QXhNREF3TURFeU1ESXdNREF3TURJd0xERXNMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TVRBeE1EQXdNekF4TURBd01ERXlNREl3TURBd01ESXhMRE16TkRRNU5qSTBOamd6TURZMk5qWXdNREF3TEN4bVlXeHpaU3hEWVhabFFuVm1aaXd3TVRBeE1EQXdNekF4TURBd01ERXlNREl3TURBd01ETXNNU3dzWm1Gc2MyVXNRMkYyWlVobFlXeDBhRkJoWTJzc01ERXdNVEF3TURNd01UQXdNREF4TWpBeU1EQXdNREVzTWpBc0xHWmhiSE5sTEVOaGRtVkNkV2xzWkdsdVowMWhkR1Z5YVdGc2N5d3dNVEF4TURBd016QXhNREF3TURFekxETXNMR1poYkhObExFTmhkbVZVYVcxbGJHRndjMlVzTURFd01UQXdNRE13TVRBd01EQXhOQ3d4TkN3c1ptRnNjMlVzUTJGMlpVSjFhV3hrYVc1blRXRjBaWEpwWVd4ekxEQXhNREV3TURBek1ERXdNREF3TVRRd0xEWXNMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TVRBeE1EQXdNekF4TURBd01TdzBOakl6TXpjeE1USTVOall6TWpBek1EQXdMQ3htWVd4elpTeERZWFpsVkdsdFpXeGhjSE5sTERBeE1ERXdNREF6TURFd01ERXdMREV4TEN4bVlXeHpaU3hEWVhabFRXbHVaWEpoYkZCcGJHVXNNREV3TVRBd01ETXdNVEF5TUN3NE1UazVNREUzTXpJeE1EY3hNVFEyTURBc01USXpPQ3htWVd4elpTeERZWFpsVFc5dVpYbENZV2NzTURFd01UQXdNRE13TVRBeU1EQXdMRFUxTlRReU5URXlNakk0T0RNNU9ESXdNREFzTEdaaGJITmxMRU5oZG1WQ2RXWm1MREF4TURFd01EQXpNREV3TXl3eExDeG1ZV3h6WlN4RFlYWmxUV2x1WlhKaGJGQnBiR1VzTURFd01UQXdNRE14TERJNU5UUTFOelEyTWpreU1USXlNREl3TUN3eE1qTTRMR1poYkhObExFTmhkbVZVYVcxbGJHRndjMlVzTERFd0xDeG1ZV3h6WlN4RFlYWmxRbUZ6YVdORGFHVnpkQ3d3TVRBeE1EQXdOREFzTVN3c1ptRnNjMlVzUTJGMlpVSjFhV3hrYVc1blRXRjBaWEpwWVd4ekxDd3hMQ3htWVd4elpTeERZWFpsVkdsdFpXeGhjSE5sTERBeE1ERXdNREEwTVRFc01URXNMR1poYkhObExFTmhkbVZDZFdabUxDd3hMQ3htWVd4elpTeERZWFpsUW5WbVppd3NNU3dzWm1Gc2MyVXNRMkYyWlVKaGMybGpRMmhsYzNRc01ESXdNREFzTVN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNeXd4TVN3c1ptRnNjMlVoTWl3d01UQXhNREF3TXpBeE1EQXdNREV6TERjc01DNHhPVEl3TURBd01EQXdNREF3TURBeE5DeDBjblZsTERFNU1Dd3hOREl1TWpjNU9UazVPVGs1T1Rnd055d3dMREU0T0M0MU9UazVPVGs1T1RrNU9UTTFOeXcxTEN3c01Dd3dNVEF4TURBd016RXNOQ3d3TGpVd05UQXdNREF3TURBd01EQXdNRElzZEhKMVpTd3pNelVzTVRFd0xqVTNNREF3TURBd01EQXdPRFU0TERBc01UZzRMalU1T1RrNU9UazVPVGs1TXpVM0xEVXNMQ3d3TERBeE1ERXdNREF4TERRc01DNDFNRFV3TURBd01EQXdNREF3TURBeUxIUnlkV1VzTXpNMUxERXhNQzQxTnpBd01EQXdNREF3TURnMU9Dd3dMREU0T0M0MU9UazVPVGs1T1RrNU9UTTFOeXcxTEN3c01Dd3dNakFzTVN3d0xqTXlOelV3TURBd01EQXdNREF3TURJMExHWmhiSE5sTERNMU1Dd3hNVEF1TlRjd01EQXdNREF3TURBNE5UZ3NNQ3d4T0RndU5UazVPVGs1T1RrNU9Ua3pOVGNzTlN3ek5pb3pOeXdzTWl3d01UQXhNREF3TXpBeE1EQXdNREV5TURJd01EQXdNREl3TERjc01DNHhPVEl3TURBd01EQXdNREF3TURBeE5DeDBjblZsTERFNU1Dd3hOREl1TWpjNU9UazVPVGs1T1Rnd055d3dMREU0T0M0MU9UazVPVGs1T1RrNU9UTTFOeXcxTEN4OGRISjFaU0V4TmpreklUSTNJVFE0TkRjaE5qZ3pOaUV5TURBaGRISjFaU0ZEWVhabFRtOWtaU3d3TERBdU5Td3dMREF1TVN3d0xDeDBjblZsTEVOaGRtVk9iMlJsTERBdU1EUXdNVEl6TkRVMk56a3dNVEl6TkRVMUxEQXVOVFUxTlRVMU5UVTFOVFUxTlRVMU5pd3hMREF1TVN3d01Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqQTNOREEzTkRBM05EQTNOREEzTkRBM0xEQXVOVFUxTlRVMU5UVTFOVFUxTlRVMU5pd3lMREF1TVN3d01EQXNMSFJ5ZFdVc1EyRjJaVlJsY25KaGFXNU5kV1FzTUM0eE1EZ3dNalEyT1RFek5UZ3dNalEyT1N3d0xqQTVPRE16TXpNek16TXpNek16TXpNekxETXNNQzR6TERBd01EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHhOVEV5TXpRMU5qYzVNREV5TXpRMU55d3dMakE1T0RNek16TXpNek16TXpNek16TXpMRFFzTUM0eExEQXdNREF3TEN4MGNuVmxMRU5oZG1WVVpYSnlZV2x1VFhWa0xEQXVNVEUwTVRrM05UTXdPRFkwTVRrM05USXNNQzQwTXpFMk5qWTJOalkyTmpZMk5qWTJOQ3d6TERBdU15d3dNREF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TVRRNE1UUTRNVFE0TVRRNE1UUTRNVFFzTUM0ME16RTJOalkyTmpZMk5qWTJOalkyTkN3MExEQXVNU3d3TURBeE1Dd3NkSEoxWlN4RFlYWmxWR1Z5Y21GcGJrMTFaQ3d3TGpFNE9ESTNNVFl3TkRrek9ESTNNVFlzTUM0d09ETXdNVEk0TWpBMU1USTRNakExTVN3MUxEQXVNeXd3TURBeE1EQXNMSFJ5ZFdVc1EyRjJaVlJsY25KaGFXNU5kV1FzTUM0eU1Ua3hNelU0TURJME5qa3hNelUzT0N3d0xqSXhNamsyTWprMk1qazJNamsyTWprM0xEWXNNQzR6TERBd01ERXdNREFzTEhSeWRXVXNRMkYyWlZSbGNuSmhhVzVOZFdRc01DNHlOVFl4TnpJNE16azFNRFl4TnpJNExEQXVNRGs0TXpNek16TXpNek16TXpNek16TXNOeXd3TGpNc01EQXdNVEF3TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0eU9Ua3pPREkzTVRZd05Ea3pPREkzTERBdU1EQXhOemN5TVRnMk1UUTNNVGcyTVRRM01pdzRMREF1TVN3d01EQXhNREF3TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0eU9UWXlPVFl5T1RZeU9UWXlPVFl6TERBdU1UazJNVFEwTkRnd05URTVORGd3TlRJc09Dd3dMakVzTURBd01UQXdNREF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TXpNMk5ERTVOelV6TURnMk5ERTVOelVzTUM0d01UUTJPRFk0TlRNd01ESXdOekF6T1RZc09Td3dMakVzTURBd01UQXdNREF4TUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpJMU5qRTNNamd6T1RVd05qRTNNamdzTUM0ME16RTJOalkyTmpZMk5qWTJOalkyTkN3M0xEQXVNU3d3TURBeE1EQXdNU3dzZEhKMVpTeERZWFpsUW14dlkydGxjbEp2WTJzc01DNHlPVFl5T1RZeU9UWXlPVFl5T1RZekxEQXVNek0xTVRBMU5URTVORGd3TlRFNU5TdzRMREVzTURBd01UQXdNREV3TEMweUxqazVPVGs1T1RrNU9UazVPRFU1Tnl4MGNuVmxMRU5oZG1WQ2JHOWphMlZ5VW05amF5d3dMak16TURJME5qa3hNelU0TURJME5qa3NNQzR5TkRjNE1UTXhORFk1T1RjNU1qazJMRGtzTVN3d01EQXhNREF3TVRBd0xDMHlMams1T1RrNU9UazVPVGs1T0RVNU55eDBjblZsTEVOaGRtVk9iMlJsTERBdU16Y3dNemN3TXpjd016Y3dNemN3TXpVc01DNHlOU3d4TUN3d0xqRXNNREF3TVRBd01ERXdNREFzTEhSeWRXVXNRMkYyWlVKc2IyTnJaWEpTYjJOckxEQXVOREV3TkRrek9ESTNNVFl3TkRrek9Dd3dMakF4TkRZNE5qZzFNekF3TWpBM01ETTVOaXd4TVN3eExEQXdNREV3TURBeE1EQXdNQ3d0TWk0NU9UazVPVGs1T1RrNU9UZzFPVGNzZEhKMVpTeERZWFpsVG05a1pTd3dMalEwTnpVek1EZzJOREU1TnpVek1EZzFMREF1TVRJMUxERXlMREF1TVN3d01EQXhNREF3TVRBd01EQXdMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVORGd4TkRneE5EZ3hORGd4TkRneE5EVXNNQzR5TlN3eE15d3dMakVzTURBd01UQXdNREV3TURBd01EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNDFNVGcxTVRnMU1UZzFNVGcxTVRnMUxEQXVORFEwTkRRME5EUTBORFEwTkRRME5Dd3hOQ3d3TGpFc01EQXdNVEF3TURFd01EQXdNREF3TEN4MGNuVmxMRU5oZG1WVVpYSnlZV2x1VFhWa0xEQXVOVFV5TkRZNU1UTTFPREF5TkRZNU1Td3dMalVzTVRVc01DNHpMREF3TURFd01EQXhNREF3TURBd01EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNDFPRGsxTURZeE56STRNemsxTURZeExEQXVNRFEzT0RFek1UUTJPVGszT1RJNU5pd3hOaXd3TGpFc01EQXdNVEF3TURFd01EQXdNREF3TURBc0xIUnlkV1VzUTJGMlpVaGhlbUZ5WkZKaFpHbGhkR2x2Yml3d0xqWXlOalUwTXpJd09UZzNOalUwTXpJc01DNHdPRE13TVRJNE1qQTFNVEk0TWpBMU1Td3hOeXd6TERBd01ERXdNREF4TURBd01EQXdNREF3TUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpVNU1qVTVNalU1TWpVNU1qVTVNallzTUM0eU1UUTJPRFk0TlRNd01ESXdOekEwTERFMkxEQXVNU3d3TURBeE1EQXdNVEF3TURBd01EQXdNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMall5TmpVME16SXdPVGczTmpVME16SXNNQzR5T1RFNU9EY3hOemswT0RjeE56azFMREUzTEMweUxqa3NNREF3TVRBd01ERXdNREF3TURBd01ERXdMQ3gwY25WbExFTmhkbVZDYkc5amEyVnlVbTlqYXl3d0xqWTJNelU0TURJME5qa3hNelU0TURJc01DNHhOVEUyTmpZMk5qWTJOalkyTmpZMk55d3hPQ3d4TERBd01ERXdNREF4TURBd01EQXdNREF4TURBc01UQXdMSFJ5ZFdVc1EyRjJaVWhoZW1GeVpGSmhaR2xoZEdsdmJpd3dMall6TWpjeE5qQTBPVE00TWpjeE5qRXNNQzQxTkRFNU9EY3hOemswT0RjeE56azBMREUzTERNc01EQXdNVEF3TURFd01EQXdNREF3TURFeExDeDBjblZsTEVOaGRtVklZWHBoY21SU1lXUnBZWFJwYjI0c01DNDJNalkxTkRNeU1EazROelkxTkRNeUxEQXVPREV5TlN3eE55d3pMREF3TURFd01EQXhNREF3TURBd01EQXhNaXdzZEhKMVpTeERZWFpsVG05a1pTd3dMalkyT1RjMU16QTROalF4T1RjMU16RXNNQzQwTlRnek16TXpNek16TXpNek16TXpMREU0TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVOekF6TnpBek56QXpOekF6TnpBek55d3dMakUxTVRZMk5qWTJOalkyTmpZMk5qWTNMREU1TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNQ3dzZEhKMVpTeERZWFpsVG05a1pTd3dMamN6TnpZMU5ETXlNRGs0TnpZMU5ETXNNQzR3T0RNd01USTRNakExTVRJNE1qQTFNU3d5TUN3d0xqRXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNREF3TEN4MGNuVmxMRU5oZG1WVVpYSnlZV2x1VFhWa0xEQXVOemd3T0RZME1UazNOVE13T0RZME1pd3dMakk0TnpBek56QXpOekF6TnpBek56QXpMREl4TERBdU15d3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1T0RFM09UQXhNak0wTlRZM09UQXhNaXd3TGpBNU9ETXpNek16TXpNek16TXpNek16TERJeUxEQXVNU3d3TURBeE1EQXdNVEF3TURBd01EQXdNVEl3TURBd01Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqZzBPRGMyTlRRek1qQTVPRGMyTlRRc01DNHlNVEk1TmpJNU5qSTVOakk1TmpJNU55d3lNeXd3TGpFc01EQXdNVEF3TURFd01EQXdNREF3TURFeU1EQXdNREF3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1T0RnMU9EQXlORFk1TVRNMU9EQXlOQ3d3TGpBNE16QXhNamd5TURVeE1qZ3lNRFV4TERJMExDMHlMamtzTURBd01UQXdNREV3TURBd01EQXdNREV5TURBd01EQXdNQ3dzZEhKMVpTeERZWFpsVG05a1pTd3dMamc0TlRnd01qUTJPVEV6TlRnd01qUXNNQzR5T1RFNU9EY3hOemswT0RjeE56azFMREkwTERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TURBeExDeDBjblZsTEVOaGRtVkNiRzlqYTJWeVVtOWpheXd3TGpneE56a3dNVEl6TkRVMk56a3dNVElzTUM0ME16RTJOalkyTmpZMk5qWTJOalkyTkN3eU1pd3hMREF3TURFd01EQXhNREF3TURBd01EQXhNakF3TURBeExDMHlMams1T1RrNU9UazVPVGs1T0RVNU55eDBjblZsTEVOaGRtVk9iMlJsTERBdU9EVTBPVE00TWpjeE5qQTBPVE00TXl3d0xqYzROekF6TnpBek56QXpOekF6Tnl3eU15d3dMakVzTURBd01UQXdNREV3TURBd01EQXdNREV5TURBd01ERXdMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVPRGt4T1RjMU16QTROalF4T1RjMU15d3dMalUwTVRrNE56RTNPVFE0TnpFM09UUXNNalFzTUM0eExEQXdNREV3TURBeE1EQXdNREF3TURBeE1qQXdNREF4TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0NU1qVTVNalU1TWpVNU1qVTVNalU1TERBdU1ETXhNalVzTWpVc01DNHhMREF3TURFd01EQXhNREF3TURBd01EQXhNakF3TURBeE1EQXdMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVPVFkyTURRNU16Z3lOekUyTURRNU15d3dMakF4TkRZNE5qZzFNekF3TWpBM01ETTVOaXd5Tml3d0xqRXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNREF3TURFd01EQXdMQ3gwY25WbExFTmhkbVZPYjJSbExERXNNQzR4TlRFMk5qWTJOalkyTmpZMk5qWTJOeXd5Tnl3d0xqRXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNREF3TURFd01EQXdNQ3dzZEhKMVpTeERZWFpsVkdWeWNtRnBiazExWkN3d0xqazJNamsyTWprMk1qazJNamsyTWprc01DNHlNekV5TlN3eU5pd3dMak1zTURBd01UQXdNREV3TURBd01EQXdNREV5TURBd01ERXdNREF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREVzTUM0ME9EVXNNamNzTUM0eExEQXdNREV3TURBeE1EQXdNREF3TURBeE1qQXdNREF4TURBd01UQXNMSFJ5ZFdVc1EyRjJaVWhoZW1GeVpFeGhkbUVzTUM0NU1qa3dNVEl6TkRVMk56a3dNVEkwTERBdU1qTXhNalVzTWpVc05Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBd01Td3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqazFPVGczTmpVME16SXdPVGczTmpVc01DNDBNekV5TlN3eU5pd3dMakVzTURBd01UQXdNREV3TURBd01EQXdNREV5TURBd01ERXdNREV3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1T1RZeU9UWXlPVFl5T1RZeU9UWXlPU3d3TGpZME56Z3hNekUwTmprNU56a3lPVFlzTWpZc01DNHhMREF3TURFd01EQXhNREF3TURBd01EQXhNakF3TURBeE1EQXhNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMamc0TlRnd01qUTJPVEV6TlRnd01qUXNNQzQzT1RFNU9EY3hOemswT0RjeE56azBMREkwTERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBeExDeDBjblZsTEVOaGRtVklZWHBoY21SU1lXUnBZWFJwYjI0c01DNDVNamt3TVRJek5EVTJOemt3TVRJMExEQXVORFEzT0RFek1UUTJPVGszT1RJNU5pd3lOU3d6TERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXhNREV3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1T1RJMU9USTFPVEkxT1RJMU9USTFPU3d3TGpZek1USTFMREkxTERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBeE1Td3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqazJOakEwT1RNNE1qY3hOakEwT1RNc01DNDRNekV5TlN3eU5pd3RNaTQ1TERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXhNREV4TUN3c2RISjFaU3hEWVhabFZHVnljbUZwYmsxMVpDd3dMams1TmpreE16VTRNREkwTmpreE16WXNNQzQzTmpVc01qY3NNQzR6TERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXhNREV4TURBc0xDeERZWFpsVG05a1pTd3dMamt5T1RBeE1qTTBOVFkzT1RBeE1qUXNNQzQ0TXpFeU5Td3lOU3d3TGpFc01EQXdNVEF3TURFd01EQXdNREF3TURFeU1EQXdNREV3TVRJc0xIUnlkV1VzUTJGMlpVSnNiMk5yWlhKU2IyTnJMREF1TnpBek56QXpOekF6TnpBek56QXpOeXd3TGpRMU9ETXpNek16TXpNek16TXpNek1zTVRrc01Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNU3d4TURBc2RISjFaU3hEWVhabFRtOWtaU3d3TGpjek56WTFORE15TURrNE56WTFORE1zTUM0ek1USTFMREl3TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNVEFzTEhSeWRXVXNRMkYyWlZSbGNuSmhhVzVOZFdRc01DNDNOelEyT1RFek5UZ3dNalEyT1RFMExEQXVOelVzTWpFc01DNHpMREF3TURFd01EQXhNREF3TURBd01EQXhNakF4TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0NE1UYzVNREV5TXpRMU5qYzVNREV5TERBdU56WTFMREl5TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXdNVEF3TUN3c0xFTmhkbVZVWlhKeVlXbHVUWFZrTERBdU5qWXpOVGd3TWpRMk9URXpOVGd3TWl3d0xqYzJOU3d4T0N3d0xqTXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMamN3TURZeE56STRNemsxTURZeE56TXNNQzQ0TVRnek16TXpNek16TXpNek16TXlMREU1TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXhNQ3dzZEhKMVpTeERZWFpsVG05a1pTd3dMamMwTURjME1EYzBNRGMwTURjME1EY3NNQzQxT0RNd01USTRNakExTVRJNE1qQTJMREl3TERBdU1Td3dNREF4TURBd01UQXdNREF3TURBd01USXhNREFzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQzTXpjMk5UUXpNakE1T0RjMk5UUXpMREF1TnpreE9UZzNNVGM1TkRnM01UYzVOQ3d5TUN3d0xqRXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNVEF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TlRrMU5qYzVNREV5TXpRMU5qYzVMREF1TkRNeE1qVXNNVFlzTUM0eExEQXdNREV3TURBeE1EQXdNREF3TURBeUxDeDBjblZsTEVOaGRtVklZWHBoY21SU1lXUnBZWFJwYjI0c01DNDFPVEkxT1RJMU9USTFPVEkxT1RJMkxEQXVOakUwTmpnMk9EVXpNREF5TURjd05Dd3hOaXd6TERBd01ERXdNREF4TURBd01EQXdNREF6TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TlRreU5Ua3lOVGt5TlRreU5Ua3lOaXd3TGpneE5EWTROamcxTXpBd01qQTNNRFFzTVRZc01DNHhMREF3TURFd01EQXhNREF3TURBd01EQTBMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVOREEwTXpJd09UZzNOalUwTXpJd09UVXNNQzR5TkRjNE1UTXhORFk1T1RjNU1qazJMREV4TERBdU1Td3dNREF4TURBd01UQXdNREVzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzQwTkRRME5EUTBORFEwTkRRME5EUTBMREF1TkRNeE5qWTJOalkyTmpZMk5qWTJOalFzTVRJc01DNHhMREF3TURFd01EQXhNREF3TVRBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ME56Z3pPVFV3TmpFM01qZ3pPVFVzTUM0M05Td3hNeXd3TGpFc01EQXdNVEF3TURFd01EQXhNREFzTEhSeWRXVXNRMkYyWlVoaGVtRnlaRkpoWkdsaGRHbHZiaXd3TGpRd056UXdOelF3TnpRd056UXdOelFzTUM0ME5EYzRNVE14TkRZNU9UYzVNamsyTERFeExETXNNREF3TVRBd01ERXdNREF5TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TkRRM05UTXdPRFkwTVRrM05UTXdPRFVzTUM0M09URTJOalkyTmpZMk5qWTJOalkyTERFeUxEQXVNU3d3TURBeE1EQXdNVEF3TURJd0xDeDBjblZsTEVOaGRtVlVaWEp5WVdsdVRYVmtMREF1TWprMk1qazJNamsyTWprMk1qazJNeXd3TGpVeE5UWXlOU3c0TERBdU15d3dNREF4TURBd01URXNMSFJ5ZFdVc1EyRjJaVUpzYjJOclpYSlNiMk5yTERBdU1qWXlNelExTmpjNU1ERXlNelExTnl3d0xqZ3hPRE16TXpNek16TXpNek16TXpJc055d3hMREF3TURFd01EQXlMREV3TUN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TWprNU16Z3lOekUyTURRNU16Z3lOeXd3TGpZNE1qSTVNVFkyTmpZMk5qWTJOallzT0N3d0xqRXNNREF3TVRBd01ESXdMQ3gwY25WbExFTmhkbVZVWlhKeVlXbHVUWFZrTERBdU16TXpNek16TXpNek16TXpNek16TXl3d0xqUXhORFk0TmpnMU16QXdNakEzTURRc09Td3dMak1zTURBd01UQXdNREl3TUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpNek1ESTBOamt4TXpVNE1ESTBOamtzTUM0Mk5EYzRNVE14TkRZNU9UYzVNamsyTERrc01DNHhMREF3TURFd01EQXlNREVzTEhSeWRXVXNRMkYyWlVoaGVtRnlaRXhoZG1Fc01DNHpOek0wTlRZM09UQXhNak0wTlRZNExEQXVOemczTURNM01ETTNNRE0zTURNM0xERXdMRFVzTURBd01UQXdNREl3TVRBc0xDeERZWFpsVG05a1pTd3dMalF4TURRNU16Z3lOekUyTURRNU16Z3NNQzQyTVRRMk9EWTROVE13TURJd056QTBMREV4TERBdU1Td3dNREF4TURBd01qQXhNREFzTEN4RFlYWmxUbTlrWlN3d0xqUXdORE15TURrNE56WTFORE15TURrMUxEQXVPREUwTmpnMk9EVXpNREF5TURjd05Dd3hNU3d3TGpFc01EQXdNVEF3TURJd01UQXhMQ3dzUTJGMlpVNXZaR1VzTUM0ek16QXlORFk1TVRNMU9EQXlORFk1TERBdU9EUTNPREV6TVRRMk9UazNPVEk1Tml3NUxEQXVNU3d3TURBeE1EQXdNakF5TEN4MGNuVmxMRU5oZG1WSVlYcGhjbVJTWVdScFlYUnBiMjRzTUM0eU9UTXlNRGs0TnpZMU5ETXlNRGs0TlN3d0xqZzBPRGsxT0RNek16TXpNek16TXpRc09Dd3pMREF3TURFd01EQXlNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMakU0TlRFNE5URTROVEU0TlRFNE5URTNMREF1TXpNek1ERXlPREl3TlRFeU9ESXdOU3cxTERBdU1Td3dNREF4TURFc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0eE9EVXhPRFV4T0RVeE9EVXhPRFV4Tnl3d0xqVTJNalVzTlN3d0xqRXNNREF3TVRBeUxDeDBjblZsTEVOaGRtVk9iMlJsTERBdU1UVXhNak0wTlRZM09UQXhNak0wTlRjc01DNDRNVGd6TXpNek16TXpNek16TXpNeUxEUXNNQzR4TERBd01ERXhMQ3gwY25WbExFTmhkbVZPYjJSbExEQXVNVGd5TURrNE56WTFORE15TURrNE56UXNNQzQzT1RFNU9EY3hOemswT0RjeE56azBMRFVzTUM0eExEQXdNREV4TUN3c2RISjFaU3hEWVhabFRtOWtaU3d3TGpJeE9URXpOVGd3TWpRMk9URXpOVGM0TERBdU56ZzNNRE0zTURNM01ETTNNRE0zTERZc01DNHhMREF3TURFeE1EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHhNVFF4T1RjMU16QTROalF4T1RjMU1pd3dMamd4T0RNek16TXpNek16TXpNek16SXNNeXd3TGpFc01EQXdNaXdzZEhKMVpTRkRZWFpsUW5WbVppd3NNU3dzWm1Gc2MyVXNRMkYyWlZScGJXVnNZWEJ6WlN3d01EQXdNQ3d4TUN3c1ptRnNjMlVzUTJGMlpVMXBibVZ5WVd4UWFXeGxMQ3d4TXpJeE5qVTFOems1TURJd056VXlNREFzTVRZNU15eG1ZV3h6WlN4RFlYWmxRbUZ6YVdORGFHVnpkQ3dzTVN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNREF4TURBd01ERXdMREV6TEN4bVlXeHpaU3hEWVhabFZHbHRaV3hoY0hObExDd3hNeXdzWm1Gc2MyVXNRMkYyWlZScGJXVnNZWEJ6WlN3c01USXNMR1poYkhObExFTmhkbVZJWldGc2RHaFFZV05yTERBd01ERXdNREF4TURBd01EQXdNREF4TUN3eE5Td3NabUZzYzJVc1EyRjJaVUoxYVd4a2FXNW5UV0YwWlhKcFlXeHpMQ3c1TEN4bVlXeHpaU3hEWVhabFRXOXVaWGxDWVdjc01EQXdNVEF3TURFd01EQXdNREF3TURFeU1EQXdNREFzTlRVeU16SXlNVGc0TmpRME16STVNREF3TUN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TURBc01UUXNMR1poYkhObExFTmhkbVZJWldGc2RHaFFZV05yTERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXdNREFzTWpBc0xHWmhiSE5sTEVOaGRtVlRZMmxsYm5ScGMzUXNMREFzTEdaaGJITmxMRU5oZG1WTmFXNWxjbUZzVUdsc1pTd3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBd01Dd3lNalk0TnpjM09ERXdOVE0wTnpBMk1EQXdMREUyT1RNc2RISjFaU3hEWVhabFRXbHVaWEpoYkZCcGJHVXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNREF3TURFd01EQXdMREl6Tnprek5qZ3pNRFE1TkRJNE5qSXdNREFzTVRZNU15eG1ZV3h6WlN4RFlYWmxUV2x1WlhKaGJGQnBiR1VzTURBd01UQXdNREV3TURBd01EQXdNREV5TURBd01ERXdNREF3TUN3eU5Ea3hOalUxTnpFMk1UZzNOakU0TURBd0xERTJPVE1zWm1Gc2MyVXNRMkYyWlVKMVptWXNNREF3TVRBd01ERXdNREF3TURBd01ERXlNREF3TURFd01ERXdMREVzTEdaaGJITmxMRU5oZG1WTmFXNWxjbUZzVUdsc1pTd3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBd01URXNNelV5TWpReE1UUTROakEzTmpnM09EQXdNQ3d4TmprekxHWmhiSE5sTEVOaGRtVkNkV2xzWkdsdVowMWhkR1Z5YVdGc2N5d3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TVRBeExEWXNMR1poYkhObExFTmhkbVZJWldGc2RHaFFZV05yTERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXhNREV4TUN3eU1Dd3NabUZzYzJVc1EyRjJaVTF2Ym1WNVFtRm5MREF3TURFd01EQXhNREF3TURBd01EQXhNakF3TURBeE1ERXlMREUwTnpNNE9UTTBPREE1TXpJNU1EQXdNREFzTEdaaGJITmxMRU5oZG1WQ2RXWm1MREF3TURFd01EQXhNREF3TURBd01EQXhNakF4TUN3eExDeG1ZV3h6WlN4RFlYWmxWR2x0Wld4aGNITmxMREF3TURFd01EQXhNREF3TURBd01EQXhNakF4TURBd0xERTFMQ3htWVd4elpTeERZWFpsVkdsdFpXeGhjSE5sTERBd01ERXdNREF4TURBd01EQXdNREF4TWpFd0xERTJMQ3htWVd4elpTeERZWFpsVFc5dVpYbENZV2NzTURBd01UQXdNREV3TURBd01EQXdNREV5TVRBd0xEUXlPREl3TkRnME1qZzRNVFUxT0RRd01EQXNMR1poYkhObExFTmhkbVZDZFdabUxEQXdNREV3TURBeE1EQXdNREF3TURBeUxERXNMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TURBeE1EQXdNVEF3TURBd01EQXdOQ3d6TlRnek9EZzRNelU0T1RBd01EQXdNREF3TEN4bVlXeHpaU3hEWVhabFRXbHVaWEpoYkZCcGJHVXNNREF3TVRBd01ERXdNREF4TERNM016SXlORGN6TnpNM05UY3dOakl3TUN3eE5qa3pMR1poYkhObExFTmhkbVZDZFdabUxEQXdNREV3TURBeE1EQXdNVEFzTVN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNREF4TURBd01UQXdNREV3TUN3eE1pd3NabUZzYzJVc1EyRjJaVUoxYVd4a2FXNW5UV0YwWlhKcFlXeHpMREF3TURFd01EQXlNREV3TVN3eUxDeG1ZV3h6WlN4RFlYWmxRblZtWml3c01Td3NabUZzYzJVc1EyRjJaVUoxWm1Zc01EQXdNVEVzTVN3c1ptRnNjMlVzUTJGMlpVSjFabVlzTURBd01URXdMREVzTEdaaGJITmxMRU5oZG1WVWFXMWxiR0Z3YzJVc01EQXdNVEV3TUN3eE15d3NabUZzYzJVc1EyRjJaVTFwYm1WeVlXeFFhV3hsTERBd01ESXNNVE00TVRjM05URXpPRE0zTkRVNU5EQXNNVFk1TXl4bVlXeHpaU0V3TERBd01ERXdNREF4TURBd01EQXdNREF4TWpBd01EQXhNREF3TURBc01qVXNNQ3gwY25WbExETXpOU3cwTVM0MU56QXdNREF3TURBd016azBOaXcwTGpRNU9UazVPVGs1T1RrNU9Ua3dNRFVzTVRVMk9DNDFPVGs1T1RrNU9UazJOamc1TERVc09DbzJLalVxTVRJc01UTXNNQ3d3TURBeE1EQXdNVEF3TURBd01EQXdNVEl3TURBd01UQXdNQ3cwTERBdU5EYzFNREF3TURBd01EQXdNREF3TXpjc2RISjFaU3d6TlRBc01URXdMalUzTURBd01EQXdNREF3T0RVNExEQXNNVGc0TGpVNU9UazVPVGs1T1RrNU16VTNMRFVzTEN3d0xEQXdNREV3TURBeE1EQXdNREF3TURBeE1qQXdNREF4TURFeE1DdzBMREF1TkRjMU1EQXdNREF3TURBd01EQXdNemNzZEhKMVpTd3pOVEFzTVRFd0xqVTNNREF3TURBd01EQXdPRFU0TERBc01UZzRMalU1T1RrNU9UazVPVGs1TXpVM0xEVXNMQ3d5TERBd01ERXdNU3cwTERBdU5qSTRNREF3TURBd01EQXdNREF3TkN4bVlXeHpaU3d5TURBc01UUXlMakkzT1RrNU9UazVPVGs0TURjc01Dd3hPRGd1TlRrNU9UazVPVGs1T1Rrek5UY3NOU3d6TVN3c01pd3dNREF4TURBd01UQXdNREF3TURBd01USXdNREF3TURBc055d3dMakU1TWpBd01EQXdNREF3TURBd01ERTBMSFJ5ZFdVc01qQXdMREUwTWk0eU56azVPVGs1T1RrNU9EQTNMREFzTVRnNExqVTVPVGs1T1RrNU9UazVNelUzTERVc0xIeDBjblZsSVRFMk9UUWhNamNoTmpNM01pRTNOekV3SVRJd01DRjBjblZsSVVOaGRtVk9iMlJsTERBc01DNDFMREFzTUM0eExEQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHdNek01TlRBMk1UY3lPRE01TlRBMk1UVXNNQzR5TVRJNU5qSTVOakk1TmpJNU5qSTVOeXd4TERBdU1Td3dNQ3dzZEhKMVpTeERZWFpsVkdWeWNtRnBiazExWkN3d0xqQXpOekF6TnpBek56QXpOekF6TnpBek5Td3dMamM0TnpBek56QXpOekF6TnpBek55d3hMREF1TXl3d01Td3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqQTNOekUyTURRNU16Z3lOekUyTURRNUxEQXVOVFUxTlRVMU5UVTFOVFUxTlRVMU5pd3lMREF1TVN3d01UQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHhNRGd3TWpRMk9URXpOVGd3TWpRMk9Td3dMalUxTlRVMU5UVTFOVFUxTlRVMU5UWXNNeXd3TGpFc01ERXdNQ3dzZEhKMVpTeERZWFpsVkdWeWNtRnBiazExWkN3d0xqRTBPREUwT0RFME9ERTBPREUwT0RFMExEQXVNalVzTkN3d0xqTXNNREV3TURBc0xIUnlkV1VzUTJGMlpVSnNiMk5yWlhKU2IyTnJMREF1TVRRMU1EWXhOekk0TXprMU1EWXhOeXd3TGpjMUxEUXNNU3d3TVRBd01TdzFOaTQ0TURBd01EQXdNREF3TURFNU5EUXNkSEoxWlN4RFlYWmxWR1Z5Y21GcGJrMTFaQ3d3TGpFNE5URTROVEU0TlRFNE5URTROVEUzTERBdU5UVTFOVFUxTlRVMU5UVTFOVFUxTml3MUxEQXVNeXd3TVRBd01UQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHlNalV6TURnMk5ERTVOelV6TURnMk5Dd3dMakEwTVRrNE56RTNPVFE0TnpFM09UUTVMRFlzTUM0eExEQXhNREF4TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0eU1Ua3hNelU0TURJME5qa3hNelUzT0N3d0xqSTVNVGs0TnpFM09UUTROekUzT1RVc05pd3dMakVzTURFd01ERXdNU3dzZEhKMVpTeERZWFpsVG05a1pTd3dMakl5TlRNd09EWTBNVGszTlRNd09EWTBMREF1TlRZeU5TdzJMREF1TVN3d01UQXdNVEF5TEN4MGNuVmxMRU5oZG1WSVlYcGhjbVJTWVdScFlYUnBiMjRzTUM0eU5UWXhOekk0TXprMU1EWXhOekk0TERBdU1ERTFOakkxTERjc015d3dNVEF3TVRBeU1Dd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqSTVPVE00TWpjeE5qQTBPVE00TWpjc01DNHlOU3c0TERBdU1Td3dNVEF3TVRBeU1EQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHpNelkwTVRrM05UTXdPRFkwTVRrM05Td3dMakEyTWpVc09Td3dMakVzTURFd01ERXdNakF3TUN3c2RISjFaU3hEWVhabFZHVnljbUZwYmsxMVpDd3dMak0zTURNM01ETTNNRE0zTURNM01ETTFMREF1TURBeE56Y3lNVGcyTVRRM01UZzJNVFEzTWl3eE1Dd3dMak1zTURFd01ERXdNakF3TURBc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0ek16QXlORFk1TVRNMU9EQXlORFk1TERBdU16TXpNREV5T0RJd05URXlPREl3TlN3NUxEQXVNU3d3TVRBd01UQXlNREF4TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TXpZM01qZ3pPVFV3TmpFM01qZ3pPU3d3TGpFNU5qRTBORFE0TURVeE9UUTRNRFV5TERFd0xEQXVNU3d3TVRBd01UQXlNREF4TUN3c2RISjFaU3hEWVhabFZHVnljbUZwYmsxMVpDd3dMalF3TnpRd056UXdOelF3TnpRd056UXNNQzR4TWpVc01URXNNQzR6TERBeE1EQXhNREl3TURFd01Dd3NMRU5oZG1WT2IyUmxMREF1TkRReE16VTRNREkwTmpreE16VTRMREF1TURNeE1qVXNNVElzTUM0eExEQXhNREF4TURJd01ERXdNREFzTEN4RFlYWmxRbXh2WTJ0bGNsSnZZMnNzTUM0ME9EUTFOamM1TURFeU16UTFOamM1TERBdU1ETXhNalVzTVRNc01Td3dNVEF3TVRBeU1EQXhNREF3TUN3eE1EQXNMRU5oZG1WT2IyUmxMREF1TlRJeE5qQTBPVE00TWpjeE5qQTBPU3d3TGpFeU5Td3hOQ3d3TGpFc01ERXdNREV3TWpBd01UQXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDFOVFUxTlRVMU5UVTFOVFUxTlRVMkxEQXVNakV5T1RZeU9UWXlPVFl5T1RZeU9UY3NNVFVzTUM0eExEQXhNREF4TURJd01ERXdNREF3TURBc0xDeERZWFpsVG05a1pTd3dMalU0T1RVd05qRTNNamd6T1RVd05qRXNNQzQxTERFMkxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNQ3dzTEVOaGRtVlVaWEp5WVdsdVRYVmtMREF1TmpJNU5qSTVOakk1TmpJNU5qSTVOeXd3TGpBd01UYzNNakU0TmpFME56RTROakUwTnpJc01UY3NNQzR6TERBeE1EQXhNREl3TURFd01EQXdNREF3TUN3c0xFTmhkbVZPYjJSbExEQXVOall6TlRnd01qUTJPVEV6TlRnd01pd3dMakEyTWpVc01UZ3NNQzR4TERBeE1EQXhNREl3TURFd01EQXdNREF3TURBc0xDeERZWFpsVG05a1pTd3dMamN3TmpjNU1ERXlNelExTmpjNU1ESXNNQzR4TlRFMk5qWTJOalkyTmpZMk5qWTJOeXd4T1N3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXdNREFzTEN4RFlYWmxUbTlrWlN3d0xqWTJNelU0TURJME5qa3hNelU0TURJc01DNHpNVEkxTERFNExEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREF4TEN3c1EyRjJaVWhoZW1GeVpGSmhaR2xoZEdsdmJpd3dMamN3TmpjNU1ERXlNelExTmpjNU1ESXNNQzQwT0RVc01Ua3NNeXd3TVRBd01UQXlNREF4TURBd01EQXdNREF4TUN3c0xFTmhkbVZPYjJSbExEQXVOek0zTmpVME16SXdPVGczTmpVME15d3dMakF4TlRZeU5Td3lNQ3d3TGpFc01ERXdNREV3TWpBd01UQXdNREF3TURBd01UQXdMQ3dzUTJGMlpVNXZaR1VzTUM0M05EQTNOREEzTkRBM05EQTNOREEzTERBdU1UWTRORE00T0RVeU9ERXpPRFV5T0N3eU1Dd3dMakVzTURFd01ERXdNakF3TVRBd01EQXdNREF3TVRBeExDd3NRMkYyWlU1dlpHVXNNQzQzTkRNNE1qY3hOakEwT1RNNE1qY3hMREF1TXpNMU1UQTFOVEU1TkRnd05URTVOU3d5TUN3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXdNVEF5TEN3c1EyRjJaVTV2WkdVc01DNDNOemMzTnpjM056YzNOemMzTnpjNExEQXVNRFEzT0RFek1UUTJPVGszT1RJNU5pd3lNU3d3TGpFc01ERXdNREV3TWpBd01UQXdNREF3TURBd01UQXlNQ3dzTEVOaGRtVlVaWEp5WVdsdVRYVmtMREF1T0RFeE56STRNemsxTURZeE56STRNeXd3TGpBeU9UUTNOemd4TXpnMU1qZ3hNemcxTXl3eU1pd3dMak1zTURFd01ERXdNakF3TVRBd01EQXdNREF3TVRBeU1EQXNMQ3hEWVhabFFteHZZMnRsY2xKdlkyc3NNQzQzT0RBNE5qUXhPVGMxTXpBNE5qUXlMREF1TWpRM09ERXpNVFEyT1RrM09USTVOaXd5TVN3eExEQXhNREF4TURJd01ERXdNREF3TURBd01ERXdNakVzTVRBd0xDeERZWFpsVkdWeWNtRnBiazExWkN3d0xqWXlOalUwTXpJd09UZzNOalUwTXpJc01DNHhPVFl4TkRRME9EQTFNVGswT0RBMU1pd3hOeXd3TGpNc01ERXdNREV3TWpBd01UQXdNREF3TURBeExDd3NRMkYyWlU1dlpHVXNNQzQyTXpJM01UWXdORGt6T0RJM01UWXhMREF1TXpRNE9UVTRNek16TXpNek16TXpNeXd4Tnl3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlMQ3dzUTJGMlpVNXZaR1VzTUM0Mk5qWTJOalkyTmpZMk5qWTJOalkyTERBdU5UWXlOU3d4T0N3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNQ3dzTEVOaGRtVk9iMlJsTERBdU56QXpOekF6TnpBek56QXpOekF6Tnl3d0xqYzJOU3d4T1N3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREFzTEN4RFlYWmxUbTlrWlN3d0xqYzBNRGMwTURjME1EYzBNRGMwTURjc01DNDFNREUzTnpJeE9EWXhORGN4T0RZeExESXdMREF1TVN3d01UQXdNVEF5TURBeE1EQXdNREF3TURJd01EQXNMQ3hEWVhabFRtOWtaU3d3TGpjek56WTFORE15TURrNE56WTFORE1zTUM0Mk5qZzBNemc0TlRJNE1UTTROVEkzTERJd0xEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURFc0xDeERZWFpsVG05a1pTd3dMamMwTXpneU56RTJNRFE1TXpneU56RXNNQzQ0TkRnNU5UZ3pNek16TXpNek16TTBMREl3TERBdU1Td3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNRElzTEN4RFlYWmxUbTlrWlN3d0xqYzNOemMzTnpjM056YzNOemMzTnpnc01DNDBNVFEyT0RZNE5UTXdNREl3TnpBMExESXhMREF1TVN3d01UQXdNVEF5TURBeE1EQXdNREF3TURJd01ESXdMQ3dzUTJGMlpVNXZaR1VzTUM0M056UTJPVEV6TlRnd01qUTJPVEUwTERBdU5qTXhNalVzTWpFc01DNHhMREF4TURBeE1ESXdNREV3TURBd01EQXdNakF3TWpFc0xDeERZWFpsVG05a1pTd3dMamd4Tnprd01USXpORFUyTnprd01USXNNQzR4T1RZeE5EUTBPREExTVRrME9EQTFNaXd5TWl3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TVRBc0xDeERZWFpsVkdWeWNtRnBiazExWkN3d0xqYzRNRGcyTkRFNU56VXpNRGcyTkRJc01DNDRORGM0TVRNeE5EWTVPVGM1TWprMkxESXhMREF1TXl3d01UQXdNVEF5TURBeE1EQXdNREF3TURJd01ESXlMQ3dzUTJGMlpVNXZaR1VzTUM0NE1UYzVNREV5TXpRMU5qYzVNREV5TERBdU16WXlPREV4TVRRM01UZzJNVFEzTVRVc01qSXNNQzR4TERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXdMQ3dzUTJGMlpVNXZaR1VzTUM0NE1UYzVNREV5TXpRMU5qYzVNREV5TERBdU5URTFOakkxTERJeUxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeU1Td3NMRU5oZG1WT2IyUmxMREF1T0RVeE9EVXhPRFV4T0RVeE9EVXhPU3d3TGpBME1UazROekUzT1RRNE56RTNPVFE1TERJekxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeU1UQXNMQ3hEWVhabFRtOWtaU3d3TGpnNU1UazNOVE13T0RZME1UazNOVE1zTUM0eE5URTJOalkyTmpZMk5qWTJOalkyTnl3eU5Dd3dMakVzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1qRXdNQ3dzTEVOaGRtVk9iMlJsTERBdU9EZzRPRGc0T0RnNE9EZzRPRGc0T0N3d0xqUTFPRE16TXpNek16TXpNek16TXpNc01qUXNNQzR4TERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXhNREVzTEN4RFlYWmxUbTlrWlN3d0xqZzFORGt6T0RJM01UWXdORGt6T0RNc01DNHpNVEkxTERJekxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeU1URXNMQ3hEWVhabFRtOWtaU3d3TGpnMU1UZzFNVGcxTVRnMU1UZzFNVGtzTUM0MU5ERTVPRGN4TnprME9EY3hOemswTERJekxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeU1USXNMQ3hEWVhabFZHVnljbUZwYmsxMVpDd3dMamd4TVRjeU9ETTVOVEEyTVRjeU9ETXNNQzQyTmpnME16ZzROVEk0TVRNNE5USTNMREl5TERBdU15d3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWl3c0xFTmhkbVZPYjJSbExEQXVPRFV4T0RVeE9EVXhPRFV4T0RVeE9Td3dMamM1TVRrNE56RTNPVFE0TnpFM09UUXNNak1zTFRJdU9Td3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWpBc0xDeERZWFpsVG05a1pTd3dMamc1TVRrM05UTXdPRFkwTVRrM05UTXNNQzQ0TVRnek16TXpNek16TXpNek16TXlMREkwTERBdU1Td3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWpBd0xDd3NRMkYyWlVKc2IyTnJaWEpTYjJOckxEQXVPVEkxT1RJMU9USTFPVEkxT1RJMU9Td3dMakk0TnpBek56QXpOekF6TnpBek56QXpMREkxTERFc01ERXdNREV3TWpBd01UQXdNREF3TURBeU1EQXlNakl3TURBc01UQXdMQ3hEWVhabFRtOWtaU3d3TGprMk5qQTBPVE00TWpjeE5qQTBPVE1zTUM0d09ETXdNVEk0TWpBMU1USTRNakExTVN3eU5pd3dMakVzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1qSXdNREF3TEN3c1EyRjJaVTV2WkdVc01DNDVNalU1TWpVNU1qVTVNalU1TWpVNUxEQXVOekV5T1RZeU9UWXlPVFl5T1RZekxESTFMREF1TVN3d01UQXdNVEF5TURBeE1EQXdNREF3TURJd01ESXlNakF3TVN3c0xFTmhkbVZJWVhwaGNtUk1ZWFpoTERBdU9UVTVPRGMyTlRRek1qQTVPRGMyTlN3d0xqTXhNalVzTWpZc05Td3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWpBd01UQXNMQ3hEWVhabFRtOWtaU3d3TGprNU5qa3hNelU0TURJME5qa3hNellzTUM0d016RXlOU3d5Tnl3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TWpJd01ERXdNQ3dzTEVOaGRtVk9iMlJsTERFc01DNHlNekV5TlN3eU55d3dMakVzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1qSXdNREV3TVN3c0xFTmhkbVZPYjJSbExEQXVPVGsyT1RFek5UZ3dNalEyT1RFek5pd3dMalEwTnpneE16RTBOams1TnpreU9UWXNNamNzTUM0eExEQXhNREF4TURJd01ERXdNREF3TURBd01qQXdNakl5TURBeE1ESXNMQ3hEWVhabFRtOWtaU3d3TGprNU5qa3hNelU0TURJME5qa3hNellzTUM0Mk16RXlOU3d5Tnl3d0xqRXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TWpJd01ERXdNeXdzTEVOaGRtVklZWHBoY21SU1lXUnBZWFJwYjI0c01DNDVOakk1TmpJNU5qSTVOakk1TmpJNUxEQXVOVFl5TlN3eU5pd3pMREF4TURBeE1ESXdNREV3TURBd01EQXdNakF3TWpJeU1EQXhNU3dzTEVOaGRtVk9iMlJsTERFdU1EQXpNRGcyTkRFNU56VXpNRGcyTkN3d0xqZ3hORFk0TmpnMU16QXdNakEzTURRc01qY3NNQzR4TERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXlNREF4TVRBc0xDeERZWFpsVG05a1pTd3dMamsxT1RnM05qVTBNekl3T1RnM05qVXNNQzQzT1RFNU9EY3hOemswT0RjeE56azBMREkyTERBdU1Td3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWpBd01USXNMQ3hEWVhabFRtOWtaU3d3TGpneE56a3dNVEl6TkRVMk56a3dNVElzTUM0NE16VXhNRFUxTVRrME9EQTFNVGsxTERJeUxEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeU15d3NMRU5oZG1WT2IyUmxMREF1TmpJNU5qSTVOakk1TmpJNU5qSTVOeXd3TGpVeU9UUTNOemd4TXpnMU1qZ3hNemtzTVRjc01DNHhMREF4TURBeE1ESXdNREV3TURBd01EQXdNeXdzTEVOaGRtVk9iMlJsTERBdU5qTXlOekUyTURRNU16Z3lOekUyTVN3d0xqWTRNakk1TVRZMk5qWTJOalkyTmpZc01UY3NMVEl1T1N3d01UQXdNVEF5TURBeE1EQXdNREF3TURRc0xDeERZWFpsU0dGNllYSmtVbUZrYVdGMGFXOXVMREF1TmpJNU5qSTVOakk1TmpJNU5qSTVOeXd3TGpnME9EazFPRE16TXpNek16TXpNelFzTVRjc015d3dNVEF3TVRBeU1EQXhNREF3TURBd01EVXNMQ3hEWVhabFRtOWtaU3d3TGpZMk9UYzFNekE0TmpReE9UYzFNekVzTUM0NE16TXdNVEk0TWpBMU1USTRNakEyTERFNExEQXVNU3d3TVRBd01UQXlNREF4TURBd01EQXdNRFV3TEN3c1EyRjJaVTV2WkdVc01DNDBOemd6T1RVd05qRTNNamd6T1RVc01DNHlNVFEyT0RZNE5UTXdNREl3TnpBMExERXpMREF1TVN3d01UQXdNVEF5TURBeE1EQXdNU3dzTEVOaGRtVk9iMlJsTERBdU5URTROVEU0TlRFNE5URTROVEU0TlN3d0xqUXpNVFkyTmpZMk5qWTJOalkyTmpZMExERTBMREF1TVN3d01UQXdNVEF5TURBeE1EQXdNVEFzTEN4RFlYWmxUbTlrWlN3d0xqVTFPRFkwTVRrM05UTXdPRFkwTWl3d0xqYzROekF6TnpBek56QXpOekF6Tnl3eE5Td3dMakVzTURFd01ERXdNakF3TVRBd01ERXdNQ3dzTEVOaGRtVk9iMlJsTERBdU5EZzBOVFkzT1RBeE1qTTBOVFkzT1N3d0xqUXhORFk0TmpnMU16QXdNakEzTURRc01UTXNNQzR4TERBeE1EQXhNREl3TURFd01EQXlMQ3dzUTJGMlpVNXZaR1VzTUM0ME56Z3pPVFV3TmpFM01qZ3pPVFVzTUM0Mk16RXlOU3d4TXl3d0xqRXNNREV3TURFd01qQXdNVEF3TURNc0xDeERZWFpsVG05a1pTd3dMalV5TVRZd05Ea3pPREkzTVRZd05Ea3NNQzQzT1RFMk5qWTJOalkyTmpZMk5qWTJMREUwTERBdU1Td3dNVEF3TVRBeU1EQXhNREF3TXpBc0xDeERZWFpsU0dGNllYSmtVbUZrYVdGMGFXOXVMREF1TkRRM05UTXdPRFkwTVRrM05UTXdPRFVzTUM0eU1UUTJPRFk0TlRNd01ESXdOekEwTERFeUxETXNNREV3TURFd01qQXdNVEF3TVN3c0xFTmhkbVZPYjJSbExEQXVORGd4TkRneE5EZ3hORGd4TkRneE5EVXNNQzQ0TkRjNE1UTXhORFk1T1RjNU1qazJMREV6TERBdU1Td3dNVEF3TVRBeU1EQXhNREF4TUN3c0xFTmhkbVZPYjJSbExEQXVORFEzTlRNd09EWTBNVGszTlRNd09EVXNNQzQwTXpFeU5Td3hNaXd3TGpFc01ERXdNREV3TWpBd01UQXdNaXdzTEVOaGRtVk9iMlJsTERBdU5EUTBORFEwTkRRME5EUTBORFEwTkN3d0xqWXpNVEkxTERFeUxEQXVNU3d3TVRBd01UQXlNREF4TURBekxDd3NRMkYyWlVKc2IyTnJaWEpTYjJOckxEQXVOREV3TkRrek9ESTNNVFl3TkRrek9Dd3dMalE0TlN3eE1Td3hMREF4TURBeE1ESXdNREV3TVN3eE1EQXNMRU5oZG1WT2IyUmxMREF1TXpNd01qUTJPVEV6TlRnd01qUTJPU3d3TGpVMk1qVXNPU3d3TGpFc01ERXdNREV3TWpBd01pd3NkSEoxWlN4RFlYWmxUbTlrWlN3d0xqTTNNRE0zTURNM01ETTNNRE0zTURNMUxEQXVNek0xTVRBMU5URTVORGd3TlRFNU5Td3hNQ3d3TGpFc01ERXdNREV3TWpBd01qQXNMSFJ5ZFdVc1EyRjJaVTV2WkdVc01DNHlOakl6TkRVMk56a3dNVEl6TkRVM0xEQXVNVGsyTVRRME5EZ3dOVEU1TkRnd05USXNOeXd3TGpFc01ERXdNREV3TWpFc0xIUnlkV1VzUTJGMlpVNXZaR1VzTUM0eU5UWXhOekk0TXprMU1EWXhOekk0TERBdU16WXlPREV4TVRRM01UZzJNVFEzTVRVc055d3dMakVzTURFd01ERXdNaklzTEhSeWRXVXNRMkYyWlU1dlpHVXNNQzR5TlRZeE56STRNemsxTURZeE56STRMREF1TlRFMU5qSTFMRGNzTUM0eExEQXhNREF4TURJekxDeDBjblZsTEVOaGRtVk9iMlJsTERBdU1qa3pNakE1T0RjMk5UUXpNakE1T0RVc01DNDNOU3c0TERBdU1Td3dNVEF3TVRBeU16QXNMSFJ5ZFdVc1EyRjJaVlJsY25KaGFXNU5kV1FzTUM0ek16TXpNek16TXpNek16TXpNek16TERBdU56a3hPVGczTVRjNU5EZzNNVGM1TkN3NUxEQXVNeXd3TVRBd01UQXlNekF3TEN4MGNuVmxMRU5oZG1WT2IyUmxMREF1TXpZM01qZ3pPVFV3TmpFM01qZ3pPU3d3TGpVd01UYzNNakU0TmpFME56RTROakVzTVRBc01DNHhMREF4TURBeE1ESXpNREF3TEN3c1EyRjJaVTV2WkdVc01DNDBNRGMwTURjME1EYzBNRGMwTURjMExEQXVOemt4TmpZMk5qWTJOalkyTmpZMk5pd3hNU3d3TGpFc01ERXdNREV3TWpNd01EQXdMQ3dzUTJGMlpVNXZaR1VzTUM0ME5EUTBORFEwTkRRME5EUTBORFEwTERBdU9ERTBOamcyT0RVek1EQXlNRGN3TkN3eE1pd3dMakVzTURFd01ERXdNak13TURBd01Dd3NMRU5oZG1WSVlYcGhjbVJNWVhaaExEQXVNemN6TkRVMk56a3dNVEl6TkRVMk9Dd3dMalk1TmpFME5EUTRNRFV4T1RRNE1EVXNNVEFzTlN3d01UQXdNVEF5TXpBd01Td3NMRU5oZG1WT2IyUmxMREF1TXpZM01qZ3pPVFV3TmpFM01qZ3pPU3d3TGpnek5URXdOVFV4T1RRNE1EVXhPVFVzTVRBc01DNHhMREF4TURBeE1ESXpNREF5TEN3c1EyRjJaVlJsY25KaGFXNU5kV1FzTUM0eU1Ua3hNelU0TURJME5qa3hNelUzT0N3d0xqZ3pNekF4TWpneU1EVXhNamd5TURZc05pd3dMak1zTURFd01ERXdNeXdzZEhKMVpTeERZWFpsVG05a1pTd3dMakkyTWpNME5UWTNPVEF4TWpNME5UY3NNQzQyTmpnME16ZzROVEk0TVRNNE5USTNMRGNzTUM0eExEQXhNREF4TURNd0xDeDBjblZsTEVOaGRtVk9iMlJsTERBdU1qWXlNelExTmpjNU1ERXlNelExTnl3d0xqZzBPRGsxT0RNek16TXpNek16TXpRc055d3dMakVzTURFd01ERXdNekVzTEhSeWRXVWhRMkYyWlVKMVptWXNMREVzTEdaaGJITmxMRU5oZG1WVWFXMWxiR0Z3YzJVc01ERXdNREV3TUN3eE1pd3NabUZzYzJVc1EyRjJaVk5qYVdWdWRHbHpkQ3d3TVRBd01UQXlNREF4TERBc0xHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF3TVRBeU1EQXhNREF3TURBc01qVTNOVFF6TkRreU5EVTNOelE0T1RBd01Dd3NabUZzYzJVc1EyRjJaVUpoYzJsalEyaGxjM1FzTURFd01ERXdNakF3TVRBd01EQXdNREF3TUN3eExDeG1ZV3h6WlN4RFlYWmxRbUZ6YVdORGFHVnpkQ3d3TVRBd01UQXlNREF4TURBd01EQXdNREF3TUN3eExDeG1ZV3h6WlN4RFlYWmxRblZwYkdScGJtZE5ZWFJsY21saGJITXNNREV3TURFd01qQXdNVEF3TURBd01EQXdNVEF3TERjc0xHWmhiSE5sTEVOaGRtVkhiMnhrUTJobGMzUXNNREV3TURFd01qQXdNVEF3TURBd01EQXdNVEF4TERFc0xHWmhiSE5sTEVOaGRtVk5hVzVsY21Gc1VHbHNaU3d3TVRBd01UQXlNREF4TURBd01EQXdNREF4TURJc01Ua3dOVEExTlRnd056UTBNemsyTWpBd01Dd3hOamswTEdaaGJITmxMRU5oZG1WQ1lYTnBZME5vWlhOMExEQXhNREF4TURJd01ERXdNREF3TURBd01ERXdNakFzTVN3c1ptRnNjMlVzUTJGMlpVMXBibVZ5WVd4UWFXeGxMREF4TURBeE1ESXdNREV3TURBd01EQXdNakFzTVRFNE1UZzNPRE16TlRBeU16QTJPREF3TUN3eE5qazBMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURBc01qRTBNVEF5TkRJeE5EUXdOemM1TWpBd01Dd3NabUZzYzJVc1EyRjJaVUoxYVd4a2FXNW5UV0YwWlhKcFlXeHpMREF4TURBeE1ESXdNREV3TURBd01EQXdNakF3TVN3ekxDeG1ZV3h6WlN4RFlYWmxWR2x0Wld4aGNITmxMREF4TURBeE1ESXdNREV3TURBd01EQXdNakF3TWpBc01URXNMR1poYkhObExFTmhkbVZOYjI1bGVVSmhaeXd3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeExEYzJPVFV5TnpVME16Y3lPVEUzTnpRd01EQXNMR1poYkhObExFTmhkbVZDZFdsc1pHbHVaMDFoZEdWeWFXRnNjeXd3TVRBd01UQXlNREF4TURBd01EQXdNREl3TURJeE1DdzJMQ3htWVd4elpTeERZWFpsVkdsdFpXeGhjSE5sTERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXdMREUxTEN4bVlXeHpaU3hEWVhabFFtRnphV05EYUdWemRDd3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TVRBc01Td3NabUZzYzJVc1EyRjJaVUoxWm1Zc01ERXdNREV3TWpBd01UQXdNREF3TURBeU1EQXlNakV3TUN3eExDeG1ZV3h6WlN4RFlYWmxRblZwYkdScGJtZE5ZWFJsY21saGJITXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TWpFd01Td3pMQ3htWVd4elpTeERZWFpsVFc5dVpYbENZV2NzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1qRXhMRFkyTlRVM09USTJOalkxTWpnMU56TXdNREFzTEdaaGJITmxMRU5oZG1WTmIyNWxlVUpoWnl3d01UQXdNVEF5TURBeE1EQXdNREF3TURJd01ESXlNVElzTlRJeE1qa3lPRFV5TWpBek5qTTJNekF3TUN3c1ptRnNjMlVzUTJGMlpVaGxZV3gwYUZCaFkyc3NNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TWpJd0xESXdMQ3htWVd4elpTeERZWFpsVFc5dVpYbENZV2NzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1qSXdNREF3TERNeE5qUTVPVEl6TVRZNU5UQTJORGd3TURBc0xHWmhiSE5sTEVOaGRtVkNkV1ptTERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXlNREF4TERFc0xHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF3TVRBeU1EQXhNREF3TURBd01ESXdNREl5TWpBd01UQXdMRFkzT1RVME1qUTJPREExTVRFMk9EZ3dNREFzTEdaaGJITmxMRU5oZG1WQ1lYTnBZME5vWlhOMExEQXhNREF4TURJd01ERXdNREF3TURBd01qQXdNakl5TURBeE1ERXNNU3dzWm1Gc2MyVXNRMkYyWlVKMWFXeGthVzVuVFdGMFpYSnBZV3h6TERBeE1EQXhNREl3TURFd01EQXdNREF3TWpBd01qSXlNREF4TURJc055d3NabUZzYzJVc1EyRjJaVUoxYVd4a2FXNW5UV0YwWlhKcFlXeHpMREF4TURBeE1ESXdNREV3TURBd01EQXdNakF3TWpJeU1EQXhNRE1zTXl3c1ptRnNjMlVzUTJGMlpVSmhjMmxqUTJobGMzUXNNREV3TURFd01qQXdNVEF3TURBd01EQXlNREF5TWpJd01ERXhNQ3d4TEN4bVlXeHpaU3hEWVhabFFuVnBiR1JwYm1kTllYUmxjbWxoYkhNc01ERXdNREV3TWpBd01UQXdNREF3TURBeU1EQXlNakl3TURFeUxESXNMR1poYkhObExFTmhkbVZJWldGc2RHaFFZV05yTERBeE1EQXhNREl3TURFd01EQXdNREF3TkN3eE5Td3NabUZzYzJVc1EyRjJaVTFwYm1WeVlXeFFhV3hsTERBeE1EQXhNREl3TURFd01EQXlMRGN3TVRVd05UUXlNREkxTURVNU5qZ3dNQ3d4TmprMExHWmhiSE5sTEVOaGRtVk5iMjVsZVVKaFp5d3dNVEF3TVRBeU1EQXhNREF3TXl3eE5EUXlPRFkwTVRRME5Ea3lNakE0TURBd0xDeG1ZV3h6WlN4RFlYWmxUVzl1WlhsQ1lXY3NNREV3TURFd01qQXdNVEF3TWl3ek5USXhPREk1TmpnMk1ERTROakUwTURBd0xDeG1ZV3h6WlN4RFlYWmxRblZtWml3d01UQXdNVEF5TURBeE1EQXpMREVzTEdaaGJITmxMRU5oZG1WTmFXNWxjbUZzVUdsc1pTd3dNVEF3TVRBeU1EQXlMRFEwT1RJME5qWXhNVFkxTlRRd016QXdNQ3d4TmprMExHWmhiSE5sTEVOaGRtVkNkV2xzWkdsdVowMWhkR1Z5YVdGc2N5d3dNVEF3TVRBeU1Td3hMQ3htWVd4elpTeERZWFpsUW5WcGJHUnBibWROWVhSbGNtbGhiSE1zTURFd01ERXdNaklzTVN3c1ptRnNjMlVzUTJGMlpWUnBiV1ZzWVhCelpTd3dNVEF3TVRBeU15d3hNeXdzWm1Gc2MyVXNRMkYyWlUxcGJtVnlZV3hRYVd4bExEQXhNREF4TURJek1Dd3hOekV3TkRreU1UY3hNamt6TVRneU1EQXNNVFk1TkN4bVlXeHpaU3hEWVhabFRXbHVaWEpoYkZCcGJHVXNNREV3TURFd01qTXdNREFzTWpRM01EY3hNRGt4TkRBNU1ERTFNVEF3TERFMk9UUXNabUZzYzJVc1EyRjJaVlJwYldWc1lYQnpaU3d3TVRBd01UQXlNekF3TURBd0xERXpMQ3htWVd4elpTeERZWFpsUW1GemFXTkRhR1Z6ZEN3d01UQXdNVEF5TXpBd01pd3hMQ3htWVd4elpTeERZWFpsUW5WbVppd3dNVEF3TVRBek1Dd3hMQ3htWVd4elpTeERZWFpsUW5WbVppd3dNVEF3TVRBek1Td3hMQ3htWVd4elpTRXdMREF4TURBeE1ESXdNREV3TURBd01EQXdNREF3TERRc01DeDBjblZsTERNMU1Dd3hNVEF1TlRjd01EQXdNREF3TURBNE5UZ3NTVzVtYVc1cGRIa3NNVGc0TGpVNU9UazVPVGs1T1RrNU16VTNMRFVzTEN3eUxEQXhNREF4TURJd01ERXdNRElzTnl3d0xqRTVNakF3TURBd01EQXdNREF3TURFMExIUnlkV1VzTVRrd0xERTBNaTR5TnprNU9UazVPVGs1T0RBM0xEQXNNVGc0TGpVNU9UazVPVGs1T1RrNU16VTNMRFVzTEN3eUxEQXhNREF4TURJd01ERXdNREF3TURBd05DdzJMREF1TmpJNE1EQXdNREF3TURBd01EQXdOQ3gwY25WbExESXdNQ3d4TkRJdU1qYzVPVGs1T1RrNU9UZ3dOeXd3TERFNE9DNDFPVGs1T1RrNU9UazVPVE0xTnl3MUxEQXNMREFzTURFd01ERXdNakF3TVRBd01EQXdNREF5TURBeU1UQXNOQ3d3TEhSeWRXVXNNelV3TERFeE1DNDFOekF3TURBd01EQXdNRGcxT0N4SmJtWnBibWwwZVN3eE9EZ3VOVGs1T1RrNU9UazVPVGt6TlRjc05Td3NmRTVoVG54T1lVNThUbUZPZkU1aFRueERZWFpsUW1GemFXTkRhR1Z6ZEN3eExDeERZWFpsUW5WbVppd3hMQ3hEWVhabFZHbHRaV3hoY0hObExERXpMQ3hEWVhabFFuVnBiR1JwYm1kTllYUmxjbWxoYkhNc01Td3NRMkYyWlVKaGMybGpRMmhsYzNRc01Td3NRMkYyWlVKMWFXeGthVzVuVFdGMFpYSnBZV3h6TERJc2ZEZDhOM3cxSVRVaE5TRXpmREY4TkRJME1qaDhNakUxTlh3eGZERXlmREUwTlh3eE56TXhOVFkwTWpReWZERjhNbnd5ZkRsOE1Yd3hmREI4TUh3d2ZEQjhNSHd3ZkRCOE1Id3dmREI4TUh3eU56UXhNM3d3ZkRCOE1Id3dmREI4TUh3d2ZEQjhOSHd3ZkRCOE1Id3dmREI4TUh3d2ZEQjhNekFoTVNFd2ZEUjhOM3d3ZkRFaE1TRXdJVEFoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRBaE1DRXhJVEVoTUNFd0lURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXdJVEFoTVNFeElURWhNU0V4SVRFaE1DRXdJVEVoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1DRXhJVEVoTVNFeElURWhNU0V4SVRFaE1DRXdJVEVoTVNFeElURWhNU0V4SVRFaE1TRXdJVEFoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNU0V4SVRBaE1TRXhJVEVoTVNFeElURWhNU0V4SVRFaE1TRXdJVEFoTUNFd0lURWhNU0V4SVRFaE1TRXhJVEVoTVNFeElURWhNQ0V3SVRBaE1DRXdJVEFoTVNFeElUQWhNQ0V4SVRFaE1DRXdJVEVoTVNFeElURWhNQ0V3SVRBaE1DRXdJVEFoTVNFeElUQWhNQ0V3SVRBaE1DRXdJVEVoTVNFeElURWhNU0V4SVRFaE1Yd3dmSHg4Zkh4OGZIeDhmSHdoSVNFaElTRWhJU0Y4TVRNd01qRXdOako4T0RFd09EWXpPRGd5ZkRSOE9YdzFmREV3ZkRaOE4zeHpkR1ZoYlh3eGZESXpLalloTmkweE56TXhOVFkwTWpVME9URTBJVFFoTmpNaE1UYzJNU0UxTnprM09DRXhOelUwS2pJMElUSTBMVEUzTXpFMU5qUXlOVFU0TXpZaE5DRXdLakl6SVRJekxURTNNekUxTmpReU5UYzBOekloTkNFd0tqUTJJVFEyTFRFM016RTFOalF5TlRjMk5USWhOQ0UyTXlFeE5qazRJVEUyT1RJcU1qTWhNak10TVRjek1UVTJOREkxT0RVd01TRTBJVEFxTkRZaE5EWXRNVGN6TVRVMk5ESTJNVEV5TXlFMElUWXpJVEUzTmpJaE1UYzNOQ295TXlFeU15MHhOek14TlRZME1qWXhPVEF3SVRRaE1DbzBNeUUwTXkweE56TXhOVFkwTWpZM09UYzJJVFFoTmpNaE1UYzFNQ0V4TnpVektqY2hOeTB4TnpNeE5UWTBNalk0TXpFd0lUUWhOak1oTVRjek1pRXhOekl5S2pZaE5pMHhOek14TlRZME1qY3dNRE14SVRRaE5qTWhNVGMxTUNFeU1UVXlNekloTVRjME15bzNJVGN0TVRjek1UVTJOREkzTWpBek5pRTBJVFl6SVRFM01qZ2hNVGN4TXlveE9TRXhPUzB4TnpNeE5UWTBNamN5TlRBeElUUWhOak1oTVRjd01DRXhOamszS2pReklUUXpMVEUzTXpFMU5qUXlOelV6T1RjaE5DRTJNeUV4TmpZMklURTJOREFxT0NFNExURTNNekUxTmpReU5UTTFOREloTmlFMk15RXhOamMySVRFMk5UTXFNakFoTWpBdE1UY3pNVFUyTkRJMU5EQTJOQ0UySVRBcU9DRTRMVEUzTXpFMU5qUXlOVFE0T1RRaE5pRTJNeUV4TnpjeElURTNOekVxTXpjaE16Y3RNVGN6TVRVMk5ESTJNRFUzT1NFMklUWXpJVEUzTVRraE1UY3dOQ295T0NFeU9DMHhOek14TlRZME1qWXlNRGMySVRZaE5qTWhNVGMyT1NFeE56Z3lLamdoT0MweE56TXhOVFkwTWpZM01UazJJVFloTmpNaE1UY3pPQ0V4TnpNMUtqTTRJVE00TFRFM016RTFOalF5TnpVME1Ua2hOaUUyTXlFeE56STVJVEUzTVRjcU16Z2hNemd0TVRjek1UVTJOREkzTnpnMk5DRTJJVFl6SVRFM016QWhNVGN6TUNvek5pRXpOaTB4TnpNeE5UWTBNamd6T1RNeklUUWhOak1oTVRZMU5pRXpOelloTVRZMk55b3pOQ0V6TkMweE56TXhOVFkwTWpnME5UTTVJVFVoTmpNaE1UYzNNU0V4TnpZMGZFNWhUbnd4TXpnd2ZESTRObnd3ZkU1aFRudzBmRFI4TWlFME1EWTBLakloT0RNMk16QXFNU0U0TURNd0tqRWhPREF6TUh3ME9UVTBNRFV5T1RKOE1UUTBNVEk0TWpNeU4zd3dmREI4TVh3d2ZEQjhNSHd3TGlvdUxpb3VMaW91V0M0cUxqRTNNekUxTmpRNE9EY3VLaTVtWVd4elpTNHFMbVpoYkhObGZEQjhNWHd3ZkRCOE1Id3dmREI4TUh3d2ZEQjhNSHd3ZkRCOE1Id3dmRmN4TUQxOE15cE9ZVTRxTVRjek1UUTNOemcwTWpRM09IeGxlVWwzU1dwdmQweERTWGhKYW05M1RFTkplVWxxYjNkbVVUMDlmRGt6T0h3eElUZzJNemszTXpBNE5qVXlNRFV6TlRnd2ZERXpLakVxTmpBd0lURTJLakVxTWpBNU5pRXlNQ294S2pRME9EQWhNaW94S2pFMk5EYzNOaUUwS2pFcU9UQXpORFkwZkRFd055RXpJVE13SVRVaE0zd3hmREI4TUh3d2ZGdGJNVFV1TWpReE5Td3hORGczTXpnMUxqY3dNREF3TURZME1qTmRYWHcyTnpNeGZERjhNakVxT0NFNExURTJPREkwTWpFek9ERTFPU0V3SVRVcU5TRTFMVFl5TkRJeU9UUTFPREl6TUNFd0lUVXFOU0UxTFRFME9Ea3lNREEyT0RJek9URWhNQ0UxS2pnaE9DMDNPRGM1TXpNeE1qYzBOekFoTUNFMUtqZ2hPQzAyTnpRMU9EQTVOVFU1TnpJaE1DRTFLalVoTlMweE5USXpNems0TlRrNE9EZ3pJVEFoTlNvNElUZ3RPRGN6TVRrMU56VTBOelEwSVRBaE5TbzFJVFV0TVRFNE56RTRPVGMyTlRrM05pRXdJVFVxTlNFMUxUY3pPVEkzT0RjMU56Y3pNU0V3SVRVcU5TRTFMVEUwTmpNNE1EVTJOVFV6TWpraE1DRTFLamtoT1Mwek1qazFOalF3TlRNMk5ERWhNQ0UxS2pFeUlURXlMVGsyTmpJNU9ETTFNRFloTUNFMUtqa2hPUzA0TlRJME9UWTNPVGN6TVRNaE1DRTFLamtoT1MweU9EYzVOVFEzTXpFMk9Ua2hNQ0UxS2praE9TMHhNamc1TlRnNU5qWTBNamszSVRBaE5Tb3hNaUV4TWkwM09UazFOalExT1RBek1URWhNQ0UxS2pFeUlURXlMVGszT1RJeU1EQXhPREl6T0NFd0lUVXFNVEloTVRJdE1UWXhORGczTnpJeU1ESXdOaUV3SVRVcU55RTNMVEV3TmpVM01qYzFPRFl6TlRJaE1DRTFLamtoT1MweE1ETXlOamMyTkRJd01EVXpJVEFoTlNvM0lUY3RNVEF6T0RBNU5qTXlOakkyTlNFd0lUUjhNSHd6TnpsOEppWjhOVEUxTnpNd09EYzBmRE44TUh3dw==");
            loadGame(0);
        }
        else {
            createNewGame("sim");
        }


        var sim = new GameSimulator()
        sim.autosellAll = false;
        sim.isLoggingCsv = true;
        sim.allowSleep = false;
        sim.maxSteps = Math.floor(toDepth ** 1.35);
        sim.useDynamicInteractions = true;
        sim.chestOpenChance = 1;
        sim.runUntilCondition(() => {
            if (depth >= toDepth) {
                return true;
            }

            let bossesToKill = battleManager.bosses.map(boss => boss.minDepth).filter(bossDepth => bossDepth < toDepth).length;
            bossesDefeated = bossesToKill;
        })
    }
}
