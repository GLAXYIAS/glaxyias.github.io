var monsterskilled = 0;
var whackosKilled = 0;
var bossesDefeated = 0;

class BattleManager {
    battleWaiting = [];
    dealtDmg = [];
    takenDmg = [];
    monsters = [];
    bosses = [];
    eventMonsterOverrides = [];
    atkWeps = [];
    activeWeps = [];
    discardedWeps = [];
    battleActive = false;
    isBossBattleActive = false;

    userMaxHP = 1000;
    userHP = 1000;
    userShield = 0;
    userEnergy = 0;
    userMaxEnergy = 0;
    userEnergyReduction = 0;
    userWeaponDrawPerTurn = 6;
    userReflectPercentage = 0;

    bossBattleId = 0;
    absoluteCardCap = 7;

    depthOfMonster = 0;
    nextMonsterDamage = 0;
    battlesWonThisBattle = 0;
    lastBattleWonAt = 0;

    registerMonster(monster) {
        if (!monster.isBoss) {
            this.monsters.push(monster);
        }
        else {
            this.bosses.push(monster);
        }
    }

    registerEventMonster(monsterStats) {
        this.eventMonsterOverrides.push(monsterStats);
    }

    getMonstersAtDepth(depth) {
        return this.monsters.filter(monster => depth >= monster.minDepth && depth <= monster.maxDepth);
    }

    getBossLevelAsset(depth) {
        let boss = this.bosses.find(monster => monster.isBoss && monster.minDepth == depth && monster.maxDepth == depth);
        return boss.levelAsset;
    }

    isActiveBossLevel(depth) {
        for (var i = bossesDefeated; i < this.bosses.length; i++) {
            if (this.bosses[i].minDepth == depth) {
                return true;
            }
        }
        return false;
    }

    isStalledDueToBoss() {
        if (bossesDefeated < this.bosses.length) {
            if (this.bosses[bossesDefeated].minDepth <= depth) {
                return true;
            }
        }
        return false;
    }

    startBossBattle() {
        this.bossBattleId = bossesDefeated;
        this.preparebattle(true);
        this.isBossBattleActive = true;
    }

    depthOfDeepestBossReached() {
        return this.bosses[bossesDefeated].minDepth;
    }

    getMonsterToSpawn(depthToRollFor, difficulty) {
        let possibleMonsters = this.getMonstersAtDepth(depthToRollFor);
        let roll = rand(0, possibleMonsters.length - 1);
        let monster = possibleMonsters[roll];
        return monster.createInstance(difficulty, depthToRollFor);
    }

    endTurn() {
        this.monsterAttacked();
        if (this.battleActive) {
            this.drawRandomWeapon();
            let regen = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.ENERGY_REGEN).actualEffect();
            this.userEnergy = Math.min(this.userMaxEnergy, this.userEnergy + regen);
            this.userShield = 0;
            this.userReflectPercentage = 0;
            this.nextMonsterDamage = this.getMonsterAttack();
        }
    }

    atk(x) {
        if (this.battleActive && x > -1 && this.activeWeps[x].canUse()) {
            let weaponUsed = this.activeWeps[x];

            // Remove the weapon from active hand first
            this.activeWeps.splice(x, 1);

            // Use the weapon (now it can draw into the freed slot)
            weaponUsed.onUse();

            if (Math.random() > STAT.energyRecoveryMultiplier()) {
                this.userEnergy -= weaponUsed.getEnergy();
            }

            // Handle energy reduction
            this.userEnergyReduction = weaponUsed.getEnergyReduction ? this.userEnergyReduction : 0;

            // Check if we can recover the weapon AND if there's space for it
            let canRecover = Math.random() <= STAT.equipRecoveryMultiplier();
            let hasSpaceInHand = this.activeWeps.length < gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect();

            if (canRecover && hasSpaceInHand) {
                // Add back to active hand
                this.activeWeps.push(weaponUsed);
            }
            else {
                // Discard the weapon
                this.discardedWeps.push(weaponUsed);
                this.atkWeps = this.atkWeps.filter(wep => wep.uniqueId != weaponUsed.uniqueId);
            }

            if (this.activeMonster.currentHealth <= 0) {
                this.wonBattle();
            }
        }
    }

    userMaxHealth() {
        return gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.HEALTH).levelEffect() * STAT.battleHealthMultiplier();
    }

    /**
     * Determines if the user will resist the next monster attack.
     * If true, return 0.5, otherwise return 1.
     */
    getUserResistance() {
        let resistanceChance = STAT.battleReduceDamageChance();
        if (Math.random() < resistanceChance) {
            return 0.5; // User resists the attack, taking only half damage
        }
        return 1; // User does not resist, taking full damage
    }

    getMonsterAttack() {
        return Math.ceil(rand(Math.ceil(this.activeMonster.baseDamage * .5), Math.floor(this.activeMonster.baseDamage * 1.5)) * 3.5);
    }

    monsterAttacked() {
        let baseHitDamage = this.nextMonsterDamage * this.getUserResistance();
        let wasDamageReduced = baseHitDamage < this.nextMonsterDamage;
        this.userHP -= Math.max(0, baseHitDamage - this.userShield);
        this.takenDmg.push([baseHitDamage, currentTime(), wasDamageReduced]);
        if (this.userHP <= 0) {
            this.lostBattle();
        }

        if (this.battleActive) {
            this.activeMonster.currentHealth -= Math.floor(this.nextMonsterDamage * this.userReflectPercentage);
            if (this.activeMonster.currentHealth <= 0) {
                this.wonBattle();
            }
        }
    }

    getMonsterForDifficulty(difficulty) {
        if (this.battleWaiting.length > 0) {
            this.activeMonster = this.battleWaiting[difficulty - 1][2];
            if (battleManager.eventMonsterOverrides.length > 0 && Math.random() > 0.66) {
                let overrideMonster = battleManager.eventMonsterOverrides[rand(0, battleManager.eventMonsterOverrides.length - 1)];
                Object.assign(this.activeMonster, overrideMonster);
            }
        }
    }

    preparebattle(isBossBattle = false) {
        if (!this.battleActive && !this.isBossBattleActive) {
            if (this.activeMonster == null) {
                if (isBossBattle) {
                    this.activeMonster = battleManager.bosses[this.bossBattleId].createInstance(1, depth);
                }
                else {
                    this.getMonsterForDifficulty(1);
                }

                this.dealtDmg = [];
                this.takenDmg = [];
                this.userMaxHP = this.userMaxHealth();
                this.userHP = this.userMaxHP;
                this.atkWeps = battleEquipsManager.activeEquips;
                this.activeWeps = [];
                this.userEnergy = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.ENERGY).actualEffect();
                this.userMaxEnergy = this.userEnergy;
                this.userEnergyReduction = 0;
                this.userReflectPercentage = 0;
                this.discardedWeps = [];
                this.drawRandomWeapon();
                this.nextMonsterDamage = this.getMonsterAttack();
            }

            if (!isSimulating) openUi(BattleWindow, null, this.activeMonster);
            this.battleActive = true;
        }
    }

    drawRandomWeapon() {
        let weaponsToDraw = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.WEAPON_DRAW).actualEffect();
        this.drawWeapons(0, weaponsToDraw);
    }

    drawWeapons(startingAmount = 0, amount) {
        let maxWeapons = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect();

        for (var i = startingAmount; i < amount; i++) {
            if (this.activeWeps.length >= maxWeapons) {
                break;
            }

            let randomWep = this.atkWeps[rand(0, this.atkWeps.length - 1)];
            if (randomWep) {
                this.activeWeps.push(randomWep);
                this.atkWeps = this.atkWeps.filter(wep => wep.uniqueId != randomWep.uniqueId);
            }
        }
    }

    drawWeaponsFromDiscard(amount) {
        let maxWeapons = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect();

        for (var i = 0; i < amount; i++) {
            if (this.discardedWeps.length <= 0) {
                break;
            }

            let randomWep = this.discardedWeps[rand(0, this.discardedWeps.length - 1)];
            if (this.activeWeps.length < maxWeapons) {
                this.activeWeps.push(randomWep);
            }
            else {
                this.atkWeps.push(randomWep);
            }
            this.discardedWeps = this.discardedWeps.filter(wep => wep.uniqueId != randomWep.uniqueId);
        }
    }

    wonBattle() {
        this.battlesWonThisBattle++;
        monsterskilled++;
        this.lastBattleWonAt = currentTime();

        this.activeMonster.grantReward();

        if (this.isBossBattleActive) {
            trackEvent_FinishBossBattle(1);
            this.isBossBattleActive = false;
            bossesDefeated++;
            if (!mutebuttons) defeatBossAudio.play();

            this.battleActive = false;
            closeUiByName("Battle");
            this.activeMonster = null;
            if (!isSimulating) openUi(EquipsWindow, null, null, false, 1);

            hideDiv("bossLevel");
            console.log("hiding boss level");
        }
        else {
            if (this.activeMonster && this.activeMonster.name == "Whacko") {
                whackosKilled++;
            }

            if (this.activeMonster.difficulty === this.battleWaiting.length) {
                this.battleActive = false;
                if (activeLayers.Battle) {
                    activeLayers.Battle.madeAChoice = true;
                }
                closeUiByName("Battle");
                this.battleWaiting = [];
                this.activeMonster = null;

                if (!isSimulating) openUi(EquipsWindow, null, null, false, 1);
                newNews(_("You won the Battle!"), true);
            }
            else {
                this.userEnergy = this.userMaxEnergy;
                this.userEnergyReduction = 0;
                this.drawRandomWeapon();
                this.getMonsterForDifficulty(this.activeMonster.difficulty + 1);
            }
        }

    }

    lostBattle() {
        if (this.isBossBattleActive) {
            trackEvent_FinishBossBattle(0);
        }
        newNews(_("You lost the Battle"), true);
        newNews(_("Become stronger by upgrading your weapons or finding more in chests"), true);
        this.battleActive = false;
        if (activeLayers.Battle) {
            activeLayers.Battle.madeAChoice = true;
        }
        closeUiByName("Battle");
        this.isBossBattleActive = false;
        this.bossBattleId = 0;
        this.userEnergyReduction = 0;
        this.userShield = 0;
        this.userReflectPercentage = 0;
        this.battleWaiting = [];
        this.activeMonster = null;

        if (this.battlesWonThisBattle > 0 && !isSimulating) {
            openUi(EquipsWindow, null, null, false, 1);
        }
    }

    bestRoll(numrolls, rarity) {
        let rolls = [];
        for (var i = 0; i < numrolls; i++) {
            rolls.push(Math.random() * rarity);
        }
        return rolls.sort((a, b) => a - b)[0];
    }

    generateReward(difficulty) {
        const rewardTypes = Object.values(BattleRewardType).sort((a, b) => a.rarity - b.rarity)
        const totalRarity = rewardTypes.reduce((sum, reward) => sum + reward.rarity, 0);
        let random = this.bestRoll(difficulty, totalRarity);

        let closestReward = rewardTypes.basicChest;
        for (var i = 0; i < rewardTypes.length; i++) {
            random -= rewardTypes[i].rarity;
            if (random <= 0) {
                closestReward = rewardTypes[i];
                break;
            }
        }

        if (closestReward) {
            if (closestReward.type !== undefined) {
                return new closestReward.constructor(closestReward.type);
            }
            else {
                var multiplier = (10 * difficulty * depthMultiplier() * 100) / 100;
                var moneyMadeInTime = valueOfMineralsPerSecond().multiply(multiplier * 60);
                if (closestReward.id === BattleRewardType.money.id) {
                    return new closestReward.constructor(new BigNumber(moneyMadeInTime));
                }
                else if (closestReward.id === BattleRewardType.mineral.id) {
                    var indexOfHighestOre = mineralIds.indexOf(highestOreUnlocked);
                    var mineralType = mineralIds[rand(Math.max(0, indexOfHighestOre - 2), indexOfHighestOre - 1)];
                    var valuePerMineral = worldResources[mineralType].sellValue;
                    var numMineralsToReward = parseInt(moneyMadeInTime.divide(valuePerMineral));
                    return new closestReward.constructor(mineralType, numMineralsToReward);
                }
            }
        }
    }

    battlerand() {
        if (battleSpawnRoller.boolean(.07) && !this.battleActive) {
            var workersAtDepth = workersHiredAtDepth(depth);
            var spawnX = battleSpawnRoller.rand(1, workersAtDepth);
            var spawnY = battleSpawnRoller.rand(Math.max(304, Math.floor(depth * .5)), depth);
            this.spawnBattleOnFloor(spawnY, spawnX);
        }
    }

    spawnBattleOnFloor(spawnY, spawnX) {
        if (this.battleWaiting.length == 0 && depth > 303 && !isDepthWithoutWorkers(spawnY)) {
            newNews(_("Miner #{0} is being attacked at Depth {1}km!", spawnX, spawnY), true);
            var battlesForWeps = Math.ceil((battleEquipsManager.activeEquips.length / 10) ** 1.2);
            var numBattles = rand(1, Math.min(4, battlesForWeps));

            let rewards = [];
            for (var i = 0; i < numBattles; i++) {
                let reward = this.generateReward(i + 1);
                rewards.push(reward);
            }
            rewards = rewards.sort((a, b) => {
                return findBattleRewardById(b.rewardType).rarity - findBattleRewardById(a.rewardType).rarity;
            });

            for (var i = 1; i <= numBattles; i++) {
                let monster = this.getMonsterToSpawn(spawnY, i);
                monster.reward = rewards[i - 1];

                this.battleWaiting.push([spawnX, spawnY, monster]);
            }
        }
    }

    resetForAscension() {
        this.battleWaiting = [];
        this.treasure = [];
    }
}
const battleManager = new BattleManager();
