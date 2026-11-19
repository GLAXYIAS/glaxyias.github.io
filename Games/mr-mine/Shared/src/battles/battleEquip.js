const battleEquipTypes = {
    BASE: 0,
    DAMAGE: 1,
    HEAL: 2,
    ENERGYREDUCTION: 3,
    WEAPONDRAW: 4,
    DISCARDDRAW: 5,
    BLOCK: 6,
    REFLECT: 7
};

const equipRarities = {
    common: {
        id: 0,
        name: _("Common"),
        scaleFactor: 1,
        mediumFrame: equipCommonMediumFrame,
        largeFrame: equipCommonLargeFrame,
        popupFrame: equipCommonPopupFrame,
        mobileFrame: bcHorizontalCommon
    },
    uncommon: {
        id: 1,
        name: _("Uncommon"),
        scaleFactor: 1.33,
        mediumFrame: equipUncommonMediumFrame,
        largeFrame: equipUncommonLargeFrame,
        popupFrame: equipUncommonPopupFrame,
        mobileFrame: bcHorizontalUncommon
    },
    rare: {
        id: 2,
        name: _("Rare"),
        scaleFactor: 1.83,
        mediumFrame: equipRareMediumFrame,
        largeFrame: equipRareLargeFrame,
        popupFrame: equipRarePopupFrame,
        mobileFrame: bcHorizontalRare
    },
    legendary: {
        id: 3,
        name: _("Legendary"),
        scaleFactor: 2.5,
        mediumFrame: equipEpicMediumFrame,
        largeFrame: equipEpicLargeFrame,
        popupFrame: equipLegendaryPopupFrame,
        mobileFrame: bcHorizontalEpic
    }
};


class BattleEquipsManager {
    baseEquips = [];
    activeEquips = [];
    slots = 6;
    pendingEquip = null;

    addBaseEquip(equip) {
        this.baseEquips.push(equip);
    }

    addActiveEquip(equipId, ignoreCap = false) {
        let equip = this.baseEquips.find(e => e.id === equipId).clone();

        if ((!this.isFull() || ignoreCap) && equip) {
            equip.init();
            this.activeEquips.push(equip);
            return equip;
        }

        return null;
    }

    nextSlotCost() {
        let slotNum = this.slots - 6;
        return Math.round((((slotNum ** 1.5) * Math.log10(slotNum)) * 35) / 5) * 5;
    }

    canUpgradeSlot() {
        return worldResources[WEAPON_SCRAP_INDEX].numOwned >= this.nextSlotCost();
    }

    upgradeSlots() {
        worldResources[WEAPON_SCRAP_INDEX].numOwned -= this.nextSlotCost();
        this.slots++;
    }

    removePendingEquip() {
        if (this.pendingEquip != null) {
            this.pendingEquip = null;
            return true;
        }
        return false;
    }

    getRandomBaseEquip(rarity) {
        var equips = this.baseEquips.filter(e => e.rarity === rarity);
        return equips[rand(0, equips.length - 1)];
    }


    getBaseEquipById(id) {
        return this.baseEquips.find(e => e.id === id);
    }

    getActiveEquipById(id) {
        return this.activeEquips.find(e => e.id === id);
    }

    getActiveEquipByUid(uniqueId) {
        return this.activeEquips.find(e => e.uniqueId === uniqueId);
    }

    notOwnedEquips() {
        return this.baseEquips.filter(e => this.activeEquips.find(a => a.id === e.id) === undefined);
    }

    isFull() {
        return this.activeEquips.length >= this.slots;
    }

    removeActiveEquip(uniqueId) {
        this.activeEquips = this.activeEquips.filter(e => e.uniqueId !== uniqueId);
    }

    get saveState() {
        var saveArray = [this.slots];
        for (var i = 0; i < this.activeEquips.length; i++) {
            saveArray.push(this.activeEquips[i].getSaveString());
        }
        return saveArray.join("*");
    }

    set saveState(value) {
        if (value != "") {
            var saveArray = value.split("*");
            this.slots = parseInt(saveArray[0]);
            for (var i = 1; i < saveArray.length; i++) {

                var equipStats = saveArray[i].split("!");
                var equip = this.addActiveEquip(parseInt(equipStats[0]));

                if (equip) {
                    equip.restore(equipStats);
                }
                else {
                    console.log("Failed to restore equip with id " + equipStats[0]);
                }
            }
        }
    }
}
const battleEquipsManager = new BattleEquipsManager();

class BattleEquip {
    id;
    uniqueId;
    icon;
    name;
    actionName;
    rarity;
    experience = 0;
    level = 1;
    maxLevel = 0;
    stats = {};
    energy = 0;
    animation;
    mobileAnimation;

    type = battleEquipTypes.BASE;
    baseCost = 35;

    saveDataMap = {
        id: { index: 0 },
        uniqueId: { index: 1 },
        experience: { index: 2, parseFunction: parseInt },
        level: { index: 3, parseFunction: parseInt }
    };

    get translatedName() {
        return _(this.name);
    }

    get translatedActionName() {
        return _(this.actionName);
    }

    init() {
        this.uniqueId = this.id + "-" + Math.floor(currentTime() * Math.random());
        this.level = 1;
    }

    update(dt) {
        this.dtSinceLastUse += dt;
    }

    canUse() {
        return battleManager.userEnergy >= this.getEnergy();
    }

    getEnergyForLevel(level) {
        return this.energy;
    }

    getEnergy() {
        return Math.max(0, this.energy - battleManager.userEnergyReduction);
    }

    getIncreaseInEnergyForNextLevel() {
        return this.energy;
    }

    scrapAmount() {
        let rarityMultiplier = 1 + Math.log10(this.rarity.scaleFactor);
        let levelMultiplier = ((this.level * (this.level + 1)) / 2) ** 1.1; // increases the effect level plays
        return Math.floor(rarityMultiplier * this.baseCost * levelMultiplier)
    }

    getLevelCost() {
        return Math.round(((this.baseCost * (this.level + 1)) ** 1.2) / 5) * 5;
    }

    canLevel() {
        return worldResources[WEAPON_SCRAP_INDEX].numOwned >= this.getLevelCost() && !this.isMaxLevel();
    }

    isMaxLevel() {
        return this.level >= this.maxLevel;
    }

    levelUp() {
        worldResources[WEAPON_SCRAP_INDEX].numOwned -= this.getLevelCost();
        this.level++;
    }

    getStatsForLevel(level) {
        return this.stats[level];
    }

    clone() {
        var clone = new this.constructor();
        Object.assign(clone, this);
        return clone;
    }

    getSaveString() {
        var saveArray = [this.id];
        for (var key in this.saveDataMap) {
            saveArray[this.saveDataMap[key].index] = this[key];
        }
        return saveArray.join("!")
    }

    grantScrapFromScrap() {
        worldResources[WEAPON_SCRAP_INDEX].numOwned += this.scrapAmount();
    }

    scrap() {
        this.grantScrapFromScrap();
        battleEquipsManager.removeActiveEquip(this.uniqueId);
    }

    drawCard(context, x, y, width, height, isBattle = false) {
        context.save();

        if (this.animation) {
            this.animation.loopFrames(context, x, y, width, height, false, 0, 15);
        }
        else {
            context.drawImage(this.rarity.mediumFrame, x, y, width, height);
        }

        context.fillStyle = "black";
        context.font = "bold " + (height * .1) + "px Verdana";
        fillTextShrinkToFit(context, this.translatedName, x + (width * .16), y + (height * .1), width * .83, "center");
        context.drawImage(this.icon, x + width * .035, y + height * .135, width * .93, height * .625);
        var levelTextArgs = [
            context,
            _("LVL. {0}", this.level),
            x,
            y + (height * 0.75),
            width,
            "center"
        ];

        context.font = "bold " + (height * .07) + "px Verdana";
        context.lineWidth = 4;
        context.strokeStyle = "#000000";
        context.fillStyle = "#FFFFFF";
        outlineTextShrinkToFit(...levelTextArgs);

        this.drawShortDescription(
            context,
            x + (width * .035),
            y + (height * .85),
            width * .93,
            height * .15
        );

        if (!this.canUse() && isBattle) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(x, y, width, height);
        }

        context.drawImage(energyDiamondSmallCard, x - (width * .075), y - (height * .025), width * .28, width * .28);
        context.fillStyle = !isBattle || (isBattle && battleManager.userEnergy >= this.getEnergy()) ? "#FFFFFF" : "#FF0000";

        outlineTextShrinkToFit(context, this.getEnergy(), x - (width * .075), y + (height * .1), width * .28, "center");

        context.restore();
    }

    drawMobileCardBackground(context, x, y, width, height, isBattle = false) {
        if (this.mobileAnimation) {
            this.mobileAnimation.loopFrames(context, x, y, width, height, false, 0, 15);
        }
        else {
            context.drawImage(this.rarity.mobileFrame, x, y, width, height);
        }
    }

    drawMobileCard(context, x, y, width, height, isBattle = false) {
        context.save();

        context.fillStyle = "black";
        context.font = "bold " + (height * .2) + "px Verdana";
        fillTextShrinkToFit(context, this.name, x + (width * .25), y + (height * .25), width * .5, "left");
        context.drawImage(this.icon, x + width * .05, y + height * .08, height * .9, height * .9);
        var levelTextArgs = [
            context,
            _("LVL. {0}", this.level),
            x,
            y + (height * .25),
            width * .85,
            "right"
        ];

        context.font = "bold " + (height * .2) + "px Verdana";
        context.lineWidth = 4;
        context.strokeStyle = "#000000";
        context.fillStyle = "#FFFFFF";

        outlineTextShrinkToFit(...levelTextArgs);

        this.drawShortDescription(
            context,
            x + (width * .25),
            y + (height * .7),
            width * .7,
            height * .15,
        );

        if (this.type == battleEquipTypes.DAMAGE) {
            context.drawImage(attackSmall, x + width * .775, y + height * .45, height * .4, height * .4);
        }

        if (!this.canUse() && isBattle) {
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(x, y, width, height);
        }

        context.drawImage(energyDiamondOriginal, x - (height * .45), y + (height * .2) / 2, height * .8, height * .8);
        context.strokeStyle = "#000000";
        context.lineWidth = 6;
        context.fillStyle = !isBattle || (isBattle && battleManager.userEnergy >= this.getEnergy()) ? "#FFFFFF" : "#FF0000";
        context.font = "bold " + (height * .4) + "px Verdana";

        outlineTextShrinkToFit(context, this.getEnergy(), x - (height * .45), y + (height * .65), height * .8, "center");

        context.restore();
    }

    restore(saveData) {
        this.init();
        for (var key in this.saveDataMap) {
            this[key] = saveData[this.saveDataMap[key].index];
            if (this.saveDataMap[key].parseFunction) {
                this[key] = this.saveDataMap[key].parseFunction(this[key]);
            }
        }
    }
}

class BasicDamageEquip extends BattleEquip {
    type = battleEquipTypes.DAMAGE;
    init() {
        super.init();
    }

    //should probably refactor this damage code back into the battleManager instead of modifying the monsterHP here
    onUse() {
        var damageToDeal = this.getDamage();
        var critChance = STAT.battleCritChance();
        var isCrit = rand(0, 100) < critChance;
        if (isCrit) {
            damageToDeal *= 2;
        }

        battleManager.activeMonster.currentHealth -= damageToDeal;
        if (damageToDeal > 0) {
            battleManager.dealtDmg.push([damageToDeal, currentTime(), isCrit]);
        }
    }

    getDamageForLevel(level) {
        return Math.round(this.stats[level].attack * STAT.battleDamageMultiplier());
    }

    getDamage() {
        return this.getDamageForLevel(this.level);
    }

    getIncreaseInAttackForNextLevel() {
        return this.getDamageForLevel(this.level + 1) - this.getDamageForLevel(this.level);
    }

    getDPS() {
        return this.getDamage() / this.getEnergy();
    }


    getDescription() {
        return _("Attack: {0}", beautifynum(this.getDamage()));
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        fillTextShrinkToFit(
            context,
            _("Attack: {0}", beautifynum(this.getDamageForLevel(level))),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

}

class HealEquip extends BattleEquip {
    type = battleEquipTypes.HEAL;
    init() {
        super.init();
    }

    onUse() {
        var healAmount = this.getHeal();
        var newHP = Math.min(battleManager.userMaxHP, battleManager.userHP + battleManager.userMaxHP * healAmount);
        healAmount = newHP - battleManager.userHP;

        battleManager.userHP += healAmount;
        this.dtSinceLastUse = 0;
    }

    getHealForLevel(level) {
        return this.stats[level].heal;
    }

    getHeal() {
        return this.getHealForLevel(this.level);
    }

    getIncreaseInHealForNextLevel() {
        return this.getHealForLevel(this.level + 1) - this.getHealForLevel(this.level);
    }


    getDescription() {
        return _("Heal: {0}", beautifynum(this.getHeal() * 100) + "%");
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        fillTextShrinkToFit(
            context,
            _("Heal: {0}", beautifynum(this.getHealForLevel(level) * 100) + "%"),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

}

class ReflectEquip extends BattleEquip {
    type = battleEquipTypes.REFLECT;
    init() {
        super.init();
    }

    onUse() {
        battleManager.userReflectPercentage += this.getReflect();
        this.dtSinceLastUse = 0;
    }

    getReflectForLevel(level) {
        return this.stats[level].reflect;
    }

    getReflect() {
        return this.getReflectForLevel(this.level);
    }

    getIncreaseInReflectForNextLevel() {
        return this.getReflectForLevel(this.level + 1) - this.getReflectForLevel(this.level);
    }

    getDescription() {
        return _("Reflect: {0}", beautifynum(this.getReflect() * 100) + "%");
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        fillTextShrinkToFit(
            context,
            _("Reflect: {0}", beautifynum(this.getReflectForLevel(level) * 100) + "%"),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

}

class BlockEquip extends BattleEquip {
    type = battleEquipTypes.BLOCK;
    init() {
        super.init();
    }

    onUse() {
        battleManager.userShield = Math.min(battleManager.userMaxHP, battleManager.userShield + this.getBlock());
        this.dtSinceLastUse = 0;
    }

    getBlockForLevel(level) {
        return this.stats[level].block;
    }

    getBlock() {
        return Math.floor(this.getBlockForLevel(this.level) * battleManager.userMaxHP);
    }

    getIncreaseInBlockForNextLevel() {
        return this.getBlockForLevel(this.level + 1) - this.getBlockForLevel(this.level);
    }

    getDescription() {
        return _("Blocks {0} damage points", beautifynum(this.getBlock()));
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        fillTextShrinkToFit(
            context,
            _("Blocks {0} damage points", beautifynum(Math.floor(this.getBlockForLevel(level) * battleManager.userMaxHP))),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

}

class energyReductionEquip extends BattleEquip {
    type = battleEquipTypes.ENERGYREDUCTION;
    init() {
        super.init();
    }

    onUse() {
        battleManager.userEnergyReduction = this.getEnergyReduction();
    }

    getEnergyReductionForLevel(level) {
        return this.stats[level].EnergyReduction;
    }

    getEnergyReduction() {
        return this.getEnergyReductionForLevel(this.level);
    }

    getIncreaseInEnergyReductionForNextLevel() {
        return this.getEnergyReductionForLevel(this.level + 1) - this.getEnergyReductionForLevel(this.level);
    }

    getDescription() {
        return _("Energy Reduction: {0}", beautifynum(this.getEnergyReduction()));
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        fillTextShrinkToFit(
            context,
            _("Energy Reduction: {0}", beautifynum(this.getEnergyReductionForLevel(level))),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

}

class weaponDrawEquip extends BattleEquip {
    type = battleEquipTypes.WEAPONDRAW;
    init() {
        super.init();
    }

    onUse() {
        let extraChance = this.getCardDraw() % 1;
        if (rand(0, 1) < extraChance) {
            battleManager.drawWeapons(0, Math.floor(this.getCardDraw()) + 1);
        }
        else {
            battleManager.drawWeapons(0, Math.floor(this.getCardDraw()));
        }
    }

    canUse() {
        return super.canUse() && battleManager.atkWeps.length > 0 &&
            battleManager.activeWeps.length <= gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect();
    }

    getCardDrawForLevel(level) {
        return this.stats[level].DrawEquips;
    }

    getCardDraw() {
        if (battleManager.battleActive) {
            // Account for the fact that this weapon will be removed from hand when used
            let cardsAllowedToDraw = gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect() - (battleManager.activeWeps.length - 1);
            return Math.min(cardsAllowedToDraw, this.getCardDrawForLevel(this.level));
        }
        else {
            return this.getCardDrawForLevel(this.level);
        }
    }

    getIncreaseInCardDrawForNextLevel() {
        return this.getCardDrawForLevel(this.level + 1) - this.getCardDrawForLevel(this.level);
    }

    getDescription() {
        let extraChance = this.getCardDraw() % 1;
        if (extraChance > 0) {
            return _("Card Draw: {0}", beautifynum(Math.floor(this.getCardDraw()))) + ", " + beautifynum(extraChance * 100) + "% +1";
        }
        return _("Card Draw: {0}", beautifynum(Math.floor(this.getCardDraw())));;
    }

    drawShortDescription(context, x, y, maxWidth, maxHeight) {
        context.save();
        context.fillStyle = "white";
        fillTextShrinkToFit(
            context,
            this.getDescription(),
            x,
            y,
            maxWidth
        );
        context.restore();
    }

    drawDescriptionForLevel(context, x, y, maxWidth, level) {
        context.save();
        let amount = this.getCardDrawForLevel(level);
        let extraChance = amount % 1;
        if (extraChance > 0) {
            fillTextShrinkToFit(
                context,
                _("Card Draw: {0}", beautifynum(Math.floor(amount))) + ", " + beautifynum(extraChance * 100) + "% +1",
                x,
                y,
                maxWidth
            );
        }
        else {
            fillTextShrinkToFit(
                context,
                _("Card Draw: {0}", beautifynum(Math.floor(amount))),
                x,
                y,
                maxWidth
            );
        }
        context.restore();
    }

}


(function () {
    var equip = new BasicDamageEquip();
    equip.id = 0;
    equip.icon = Icons_Fist;
    equip.name = "Fist";
    equip.actionName = "Punch";
    equip.maxLevel = 10;
    equip.energy = 1;
    equip.rarity = equipRarities.common;
    equip.stats = {
        "1": { "attack": 15 },
        "2": { "attack": 20 },
        "3": { "attack": 25 },
        "4": { "attack": 30 },
        "5": { "attack": 40 },
        "6": { "attack": 50 },
        "7": { "attack": 60 },
        "8": { "attack": 75 },
        "9": { "attack": 95 },
        "10": { "attack": 110 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 1;
    equip.icon = Icons_Rock;
    equip.name = "Rock";
    equip.actionName = "Throw Rock";
    equip.maxLevel = 10;
    equip.energy = 1;
    equip.rarity = equipRarities.common;
    equip.stats = {
        "1": { "attack": 16 },
        "2": { "attack": 22 },
        "3": { "attack": 30 },
        "4": { "attack": 40 },
        "5": { "attack": 55 },
        "6": { "attack": 70 },
        "7": { "attack": 90 },
        "8": { "attack": 110 },
        "9": { "attack": 135 },
        "10": { "attack": 170 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 2;
    equip.icon = Icons_Mallet;
    equip.name = "Mallet";
    equip.actionName = "Smack";
    equip.maxLevel = 10;
    equip.energy = 2;
    equip.rarity = equipRarities.common;
    equip.stats = {
        "1": { "attack": 35 },
        "2": { "attack": 50 },
        "3": { "attack": 70 },
        "4": { "attack": 90 },
        "5": { "attack": 110 },
        "6": { "attack": 140 },
        "7": { "attack": 170 },
        "8": { "attack": 210 },
        "9": { "attack": 250 },
        "10": { "attack": 310 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 3;
    equip.icon = Icons_BowArrow;
    equip.name = "Bow and Arrow";
    equip.actionName = "Fire Arrow";
    equip.maxLevel = 10;
    equip.energy = 2;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "attack": 45 },
        "2": { "attack": 70 },
        "3": { "attack": 100 },
        "4": { "attack": 140 },
        "5": { "attack": 190 },
        "6": { "attack": 260 },
        "7": { "attack": 340 },
        "8": { "attack": 460 },
        "9": { "attack": 580 },
        "10": { "attack": 710 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 4;
    equip.icon = Icons_PickAxe;
    equip.name = "Pickaxe";
    equip.actionName = "Swing Pickaxe";
    equip.maxLevel = 10;
    equip.energy = 2;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "attack": 50 },
        "2": { "attack": 80 },
        "3": { "attack": 110 },
        "4": { "attack": 150 },
        "5": { "attack": 190 },
        "6": { "attack": 230 },
        "7": { "attack": 280 },
        "8": { "attack": 340 },
        "9": { "attack": 420 },
        "10": { "attack": 520 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 5;
    equip.icon = Icons_RegBomb;
    equip.name = "Small Bomb";
    equip.actionName = "Explode Bomb";
    equip.maxLevel = 10;
    equip.energy = 3;
    equip.rarity = equipRarities.rare;
    equip.animation = new SpritesheetAnimation(equipRareMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalRareSheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "attack": 105 },
        "2": { "attack": 165 },
        "3": { "attack": 240 },
        "4": { "attack": 345 },
        "5": { "attack": 480 },
        "6": { "attack": 645 },
        "7": { "attack": 840 },
        "8": { "attack": 1050 },
        "9": { "attack": 1260 },
        "10": { "attack": 1500 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 6;
    equip.icon = Icons_Sword;
    equip.name = "Sword";
    equip.actionName = "Stab";
    equip.maxLevel = 10;
    equip.energy = 2;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "attack": 50 },
        "2": { "attack": 80 },
        "3": { "attack": 110 },
        "4": { "attack": 150 },
        "5": { "attack": 190 },
        "6": { "attack": 230 },
        "7": { "attack": 280 },
        "8": { "attack": 340 },
        "9": { "attack": 420 },
        "10": { "attack": 520 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 7;
    equip.icon = Icons_HolyGrenade;
    equip.name = "Holy Hand Grenade";
    equip.actionName = "Explode Bomb";
    equip.maxLevel = 10;
    equip.energy = 3;
    equip.rarity = equipRarities.legendary;
    equip.animation = new SpritesheetAnimation(equipLegendaryMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalLegendarySheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "attack": 120 },
        "2": { "attack": 180 },
        "3": { "attack": 255 },
        "4": { "attack": 360 },
        "5": { "attack": 495 },
        "6": { "attack": 660 },
        "7": { "attack": 900 },
        "8": { "attack": 1200 },
        "9": { "attack": 1500 },
        "10": { "attack": 1800 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 8;
    equip.icon = Icons_Gun;
    equip.name = "Gun";
    equip.actionName = "Shoot";
    equip.maxLevel = 7;
    equip.energy = 2;
    equip.rarity = equipRarities.rare;
    equip.animation = new SpritesheetAnimation(equipRareMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalRareSheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "attack": 80 },
        "2": { "attack": 120 },
        "3": { "attack": 180 },
        "4": { "attack": 260 },
        "5": { "attack": 360 },
        "6": { "attack": 500 },
        "7": { "attack": 600 },
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BasicDamageEquip();
    equip.id = 9;
    equip.icon = Icons_PlasmaGun;
    equip.name = "Plasma Gun";
    equip.actionName = "Shoot";
    equip.maxLevel = 10;
    equip.energy = 3;
    equip.rarity = equipRarities.legendary;
    equip.animation = new SpritesheetAnimation(equipLegendaryMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalLegendarySheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "attack": 120 },
        "2": { "attack": 180 },
        "3": { "attack": 255 },
        "4": { "attack": 360 },
        "5": { "attack": 495 },
        "6": { "attack": 660 },
        "7": { "attack": 900 },
        "8": { "attack": 1200 },
        "9": { "attack": 1500 },
        "10": { "attack": 1750 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new HealEquip();
    equip.id = 10;
    equip.icon = Icons_Heal;
    equip.name = "Heal HP";
    equip.actionName = "Heal";
    equip.maxLevel = 7;
    equip.energy = 3;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "heal": .050 },
        "2": { "heal": .075 },
        "3": { "heal": .10 },
        "4": { "heal": .125 },
        "5": { "heal": .15 },
        "6": { "heal": .175 },
        "7": { "heal": .20 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new energyReductionEquip();
    equip.id = 11;
    equip.icon = Icons_Saver;
    equip.name = "Energy Reduction";
    equip.actionName = "Energy Reduction";
    equip.maxLevel = 9;
    equip.energy = 1;
    equip.rarity = equipRarities.legendary;
    equip.animation = new SpritesheetAnimation(equipLegendaryMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalLegendarySheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "EnergyReduction": 2 },
        "2": { "EnergyReduction": 3 },
        "3": { "EnergyReduction": 4 },
        "4": { "EnergyReduction": 5 },
        "5": { "EnergyReduction": 6 },
        "6": { "EnergyReduction": 7 },
        "7": { "EnergyReduction": 8 },
        "8": { "EnergyReduction": 9 },
        "9": { "EnergyReduction": 10 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new weaponDrawEquip();
    equip.id = 12;
    equip.icon = Icons_Dispenser;
    equip.name = "Draw Equips";
    equip.actionName = "Equips Drawn";
    equip.maxLevel = 9;
    equip.energy = 1;
    equip.rarity = equipRarities.legendary;
    equip.animation = new SpritesheetAnimation(equipLegendaryMediumSheet, 15, 10);
    equip.mobileAnimation = new SpritesheetAnimation(bcHorizontalLegendarySheet, 15, 10, 0, 0, [], "vertical");
    equip.stats = {
        "1": { "DrawEquips": 1 },
        "2": { "DrawEquips": 2 },
        "3": { "DrawEquips": 2.5 },
        "4": { "DrawEquips": 3 },
        "5": { "DrawEquips": 4 },
        "6": { "DrawEquips": 4.5 },
        "7": { "DrawEquips": 5 },
        "8": { "DrawEquips": 6 },
        "9": { "DrawEquips": 7 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new BlockEquip();
    equip.id = 13;
    equip.icon = Icons_Shield;
    equip.name = "Shield";
    equip.actionName = "Block";
    equip.maxLevel = 10;
    equip.energy = 3;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "block": .050 },
        "2": { "block": .075 },
        "3": { "block": .10 },
        "4": { "block": .125 },
        "5": { "block": .15 },
        "6": { "block": .175 },
        "7": { "block": .20 },
        "8": { "block": .225 },
        "9": { "block": .25 },
        "10": { "block": .275 }
    };
    battleEquipsManager.addBaseEquip(equip);

    equip = new ReflectEquip();
    equip.id = 14;
    equip.icon = Icons_Reflector;
    equip.name = "Reflect";
    equip.actionName = "Parried";
    equip.maxLevel = 10;
    equip.energy = 3;
    equip.rarity = equipRarities.uncommon;
    equip.stats = {
        "1": { "reflect": .10 },
        "2": { "reflect": .15 },
        "3": { "reflect": .2 },
        "4": { "reflect": .25 },
        "5": { "reflect": .3 },
        "6": { "reflect": .35 },
        "7": { "reflect": .40 },
        "8": { "reflect": .45 },
        "9": { "reflect": .50 },
        "10": { "reflect": .55 }
    };
    battleEquipsManager.addBaseEquip(equip);



})();

function grantDefaultEquips() {
    //give the player some equips
    for (var i = 0; i < 5; i++) {
        battleEquipsManager.addActiveEquip(0, true);
    }

    battleEquipsManager.slots = battleEquipsManager.activeEquips.length + 3;
}