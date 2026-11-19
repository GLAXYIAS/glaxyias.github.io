class Reward
{
    constructor(configuration)
    {
        this.configuration = configuration;
    }

    rollForRandomReward()
    {
        let rangePosition = 0;
        if(this.configuration.type == ChestType.basic)
        {
            rangePosition = basicChestRewardRoller.rand(0, this.configuration.rangeMax - 1);
        }
        else if(this.configuration.type == ChestType.gold)
        {
            rangePosition = goldenChestRewardRoller.rand(0, this.configuration.rangeMax - 1);
        }
        else if(this.configuration.type == ChestType.battle)
        {
            rangePosition = battleChestRewardRoller.rand(0, this.configuration.rangeMax - 1);
        }
        else
        {
            rangePosition = blackChestRewardRoller.rand(0, this.configuration.rangeMax - 1);
        }

        return this.grantReward(this.configuration, rangePosition);
    }

    grantReward(configuration, rangePosition)
    {
        let rewardText = this.getRewardText(configuration, rangePosition);

        if(rewardText !== undefined)
        {
            return rewardText;
        }
        else if(configuration.defaultReward)
        {
            return configuration.defaultReward();
        }
    }

    getRewardText(configuration, rangePosition)
    {
        if(configuration.rewards)
        {
            let rewards = this.getQualifyingRewards(configuration, rangePosition);

            if(rewards.length)
            {
                return this.grantReward(rewards[0], rangePosition);
            }
        }
        else if(configuration.grantFunction)
        {
            return configuration.grantFunction();
        }
    }

    getQualifyingRewards(configuration, rangePosition)
    {
        return configuration
            .rewards
            .filter(reward => !reward.threshold || rangePosition < reward.threshold)
            .filter(reward => !reward.condition || reward.condition())
            .sort(rewardSort);
    }
}

function depthMultiplier()
{
    return Math.max(1000, depth) / 1000;
}

function rewardSort(a, b)
{
    var difference = 0;

    if(a.threshold && b.threshold)
    {
        difference = a.threshold - b.threshold;
    }
    if(difference == 0 && (a.condition || b.condition))
    {
        difference = a.condition ? b.condition ? 0 : -1 : 1;
    }

    return difference;
}

function grantTimelapse(minutes)
{
    var duration = minutes;

    if(isSimulating)
    {
        timelapse(duration);
    }
    else
    {
        setTimeout(() => timelapse(duration), 120);

        if(duration < 60)
        {
            return _("{0} minute timelapse", parseFloat((duration * STAT.timelapseDurationMultiplier()).toFixed(2)));
        }
        else
        {
            return _("{0} hour", parseFloat((duration * STAT.timelapseDurationMultiplier()).toFixed(2)) / 60) + " " + _("timelapse") + " !!!!!!!";
        }
    }
}

function grantWeaponScrap(amount)
{
    worldResources[WEAPON_SCRAP_INDEX].numOwned += amount;
    // trackEvent_OpenedBlackChest(
    //     null,
    //     null,
    //     amount
    // );
    return _("+{0} Weapon Scrap", amount);
}

function grantWeapon(rarity)
{
    let equip = battleEquipsManager.getRandomBaseEquip(rarity);
    battleEquipsManager.pendingEquip = equip.id;
    if(!isSimulating) openUi(EquipBlackWindow, null, equip);

    return equip.translatedName;
}

function grantSuperMinerSouls(amount)
{
    worldResources[SUPER_MINER_SOULS_INDEX].numOwned += amount;
    trackEvent_OpenedBlackChest(
        null,
        null,
        amount
    );
    return _("+{0} Super Miner Souls", amount);
}

function grantSuperMiner(rarity)
{
    let excludeEggs = superMinerManager.currentSuperMiners.filter(miner => miner.type == superMinerTypes.EGG).length >= 4;
    let miner;

    // First chest only grants common mining super miners
    if(chestService.totalBlackChestsOpened == 0)
    {
        miner = superMinerManager.getRandomBaseSuperMiner({rarity: superMinerRarities.common, type: superMinerTypes.MINER}, {isSpecial: true});
    }
    else if(!excludeEggs)
    {
        miner = superMinerManager.getRandomBaseSuperMiner({rarity: rarity}, {isSpecial: true});
    }
    else
    {
        miner = superMinerManager.getRandomBaseSuperMiner({rarity: rarity}, {type: superMinerTypes.EGG, isSpecial: true});
    }
    superMinerManager.pendingSuperMiner = miner.id;
    if(!isSimulating) openUi(SuperMinerBlackWindow, null, miner);

    //Reroll to not lock all players to the same sequence from limited split test pool
    if(chestService.totalBlackChestsOpened == 0)
    {
        blackChestRewardRoller.srand(rand(0, 9999999));
    }

    trackEvent_OpenedBlackChest(
        miner.id,
        miner.rarity.id,
        0
    );

    return miner.name;
}

function grantMoney(minimumMultiplier, maximumMultiplier, useMineralSpeedMultiplier = true, source)
{
    let multiplier = basicChestRewardRoller.rand(minimumMultiplier, maximumMultiplier);
    var moneyAmount = valueOfMineralsPerSecond(true, useMineralSpeedMultiplier)
        .multiply(STAT.chestMoneyMultiplier())
        .multiply(multiplier * 60);


    if(moneyAmount > 0)
    {
        addMoney(moneyAmount);
        trackEvent_GainedMoney(moneyAmount, source);
        chestService.totalMoneyFromChests = chestService.totalMoneyFromChests.add(moneyAmount);
        return "$" + beautifynum(moneyAmount);
    }
}

function grantBlueprint(minimumId, maximumId)
{
    let blueprints = getUnownedBlueprints(1).filter(blueprint => blueprint.id >= minimumId && blueprint.id <= maximumId);

    if(blueprints.length)
    {
        let blueprint = blueprints[goldenChestRewardRoller.rand(0, blueprints.length - 1)];

        learnBlueprint(1, blueprint.id);

        return _("Blueprint For {0}", blueprint.name);
    }
}

function grantMineral(mineralId, hours)
{
    let mineralReward = grantMineralsForHour(mineralId, hours, false);

    if(mineralReward.amount > 0)
    {
        return mineralReward.name + " x " + beautifynum(mineralReward.amount);
    }
}

function grantKmDepth(km)
{
    addDepth(km);

    return _("+{0}km", km) + " " + _("Depth");
}

function grantOil(amount)
{
    if(depth > 303)
    {
        worldResources[OIL_INDEX].numOwned += amount;

        return amount + " " + _("oil") + "!!";
    }
}

function grantRareScientist()
{
    if(!isActiveScientistsFull())
    {
        let newScientist = unlockUncommonOrRarerScientist();

        if(newScientist.success)
        {
            hasUnlockedScientists = 1;

            return _("Rare Scientist: {0}", newScientist.reason);
        }
    }
}

function grantRandomScientist()
{
    let newScientist = unlockRandomScientist();

    if(newScientist.success)
    {
        hasUnlockedScientists = 1;

        savegame("scientist_added");

        return _("Scientist: {0}", newScientist.reason);
    }
}

function grantSingleBuildingMaterial()
{
    worldResources[BUILDING_MATERIALS_INDEX].add(1, "chest");
    return _("{0} x Building Materials!", 1);
}

function grantTenBuildingMaterials()
{
    worldResources[BUILDING_MATERIALS_INDEX].add(10, "chest");
    return _("{0} x Building Materials!", 10);
}

function grantTwentyBuildingMaterials()
{
    worldResources[BUILDING_MATERIALS_INDEX].add(20, "chest");
    return _("{0} x Building Materials!", 20);
}

function grantFiftyBuildingMaterials()
{
    worldResources[BUILDING_MATERIALS_INDEX].add(50, "chest");
    return _("{0} x Building Materials!", 50);
}

function grantSingleCaveConsumable()
{
    var value = Math.random();
    if(value <= 0.5)
    {
        revealCaveConsumable.addCaveReveal(1);
        return _("{0} x Beacon!", 1);
    } else
    {
        droneFleetConsumable.addDroneFleet(1);
        return _("{0} x Fleet Manager!", 1);
    }
}

function grantTickets(amount)
{
    addTickets(amount, "chest");

    return amount + " " + _("tickets") + "!!!!";
}

function grantStaticBuff()
{
    let buffIdToStart = buffs.getChestAndTradeBuffs()[basicChestRewardRoller.rand(0, buffs.getChestAndTradeBuffs().length - 1)].id;
    let rewardedBuff = buffs.getStaticBuffById(buffIdToStart);

    var attempts = 0;
    while(!rewardedBuff.canStartFunction() && attempts < 20)
    {
        buffIdToStart = buffs.getChestAndTradeBuffs()[basicChestRewardRoller.rand(0, buffs.getChestAndTradeBuffs().length - 1)].id;
        rewardedBuff = buffs.getStaticBuffById(buffIdToStart);
        attempts++;
    }
    if(attempts >= 20)
    {
        console.warn("Buff run was not a buff that was supposed to be usable: BuffIndex " + buffIdToStart);
    }

    if(buffIdToStart != 6)
    {
        buffs.startBuff(buffIdToStart, 1200, "Chest", 50);
    }
    else
    {
        buffs.startBuff(buffIdToStart, 30, "Chest");
    }
    return _("a buff: {0}!", rewardedBuff.name);
}

function getRelativeRollChanceBasedOnLevelDifference(levelDifference)
{
    if(levelDifference < 1)
    {
        return 2 + Math.pow(Math.abs(levelDifference), 2);
    }
    return 1 - getStandardDeviationPercent(levelDifference);
}

function getAverageOfTwoHighestLevelEquips()
{
    var drillLevels = [drillState.drill().level, drillState.engine().level, drillState.fan().level, drillState.cargo().level];
    drillLevels.sort(function (a, b) {return b - a});
    return (drillLevels[0] + drillLevels[1]) / 2;
}

function rollForDrillBlueprint()
{
    var overallChanceOfRolling = 500 / (depth + 1);
    if(goldenChestRewardRoller.randFloat() > overallChanceOfRolling)
    {
        return false;
    }

    var sortedBlueprints = sortBlueprintsByEquipLevelInAscendingOrder(getDiscoverableBlueprintsAboveLevelEquippedForEachType());
    var chanceOfGettingABlueprint = 0;
    for(var i = 0; i < sortedBlueprints.length; i++)
    {
        var blueprintEquip = getDrillEquipById(sortedBlueprints[i].craftedItem.item.id);
        var levelDifference = blueprintEquip.level - getAverageOfTwoHighestLevelEquips();
        chanceOfGettingABlueprint += getRelativeRollChanceBasedOnLevelDifference(levelDifference);
    }
    return goldenChestRewardRoller.randFloat() <= chanceOfGettingABlueprint;
}

function grantAcceptableDrillBlueprint()
{
    var sortedBlueprints = sortBlueprintsByEquipLevelInAscendingOrder(getDiscoverableBlueprintsAboveLevelEquippedForEachType());
    var chancesOfBlueprints = [];
    var sumOfChances = 0;
    for(var i = 0; i < sortedBlueprints.length; i++)
    {
        var blueprintEquip = getDrillEquipById(sortedBlueprints[i].craftedItem.item.id);
        var levelDifference = blueprintEquip.level - getAverageOfTwoHighestLevelEquips();
        var chanceOfGettingThisBlueprint = getRelativeRollChanceBasedOnLevelDifference(levelDifference);
        sumOfChances += chanceOfGettingThisBlueprint;
        chancesOfBlueprints.push(chanceOfGettingThisBlueprint);
    }
    var normalizedRoll = goldenChestRewardRoller.randFloat() * sumOfChances;
    for(var i = 0; i < chancesOfBlueprints.length; i++)
    {
        normalizedRoll -= chancesOfBlueprints[i];
        if(normalizedRoll <= 0)
        {
            learnBlueprint(1, sortedBlueprints[i].id);
            return _("Blueprint For {0}", sortedBlueprints[i].name);
        }
    }
    console.log("Couldn't find blueprint. Roll: " + normalizedRoll + " Chances: " + chancesOfBlueprints.toString());
}

function isCandidateForFirstChestBlueprint()
{
    var isAtRequiredTier = Math.max(drillState.drill().level, drillState.engine().level, drillState.fan().level, drillState.cargo().level) == 13;

    var blueprintsInCategory = filterBlueprintsByCategory(getKnownBlueprints(), 1);
    blueprintsInCategory = filterBlueprints(blueprintsInCategory, function (blueprint) {return blueprint.shopSubcategory == _("Discovered");});
    var hasDiscoveredADiscoveredBlueprint = blueprintsInCategory.length > 0;

    return isAtRequiredTier && !hasDiscoveredADiscoveredBlueprint;
}

function needsBuildingMaterials()
{
    return getTotalBuildingMaterialsNeeded() > worldResources[BUILDING_MATERIALS_INDEX].numOwned;
}

function getTotalBuildingMaterialsNeeded()
{
    var buildingMaterialsNeeded = 0;

    structures.forEach((structure) =>
    {
        buildingMaterialsNeeded += getBuildingMaterialsNeededForStructure(structure);
    });
    return buildingMaterialsNeeded;
}

function getBuildingMaterialsNeededForOneUpgrade()
{
    var minBuildingMaterialsNeeded = 0;

    structures.forEach((structure) =>
    {
        var buildingMaterialsNeededForStructure = getBuildingMaterialsNeededForStructure(structure);
        if(buildingMaterialsNeededForStructure > 0
            && (buildingMaterialsNeededForStructure < minBuildingMaterialsNeeded
                || minBuildingMaterialsNeeded == 0))
        {
            minBuildingMaterialsNeeded = buildingMaterialsNeededForStructure
        }
    });
    return minBuildingMaterialsNeeded;
}

function getBuildingMaterialsNeededForStructure(structure)
{
    var structureBlueprint = getBlueprintById(3, structure.id);
    if(structure.level != structure.maxLevel && structureBlueprint.levels[structure.level].ingredients != null)
    {
        for(var ingredient of structureBlueprint.levels[structure.level].ingredients)
        {
            if(ingredient.item.id == BUILDING_MATERIALS_INDEX
                && worldResources[BUILDING_MATERIALS_INDEX].numOwned < ingredient.quantity) 
            {
                return ingredient.quantity;
            }
        };
    }
    return 0;
}

function cavesStartedSpawning()
{
    return hasFirstCaveSpawned;
}