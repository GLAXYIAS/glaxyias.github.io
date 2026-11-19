const GEM_UPGRADE_TYPES = {
    HEALTH: 0,
    ENERGY: 1,
    ENERGY_REGEN: 2,
    WEAPON_DRAW: 3,
    MAX_WEAPONS: 4
};

class GemUpgradesManager {
    upgrades = [];

    addGemUpgrade(gemUpgrade) {
        this.upgrades.push(gemUpgrade);
    }

    getGemUpgradeById(id) {
        return this.upgrades.find(gemUpgrade => gemUpgrade.id == id);
    }

    getWorkloadPerGemCost() {
        let workload = [0, 0, 0, 0, 0];
        for (var i = 0; i < this.upgrades.length; i++) {
            for (var g = 0; g < workload.length; g++) {
                workload[g] += this.upgrades[i].getWorkloadPerGemCost()[g];
            }
        }

        return workload;
    }

    get saveString() {
        return this.upgrades.map(upgrade => upgrade.level).join("!");
    }

    set saveString(value) {
        if (value != "") {
            var levels = value.split("!");
            for (var i = 0; i < levels.length; i++) {
                this.upgrades[i].level = parseInt(levels[i]);
            }
        }
    }

}
const gemUpgradesManager = new GemUpgradesManager();

class GemUpgrade {
    id = -1;
    name = "";
    icon = null;
    level = 1;
    bonusPerLevel = 1;
    baseDifficulty = 1;
    difficultyScale = 1.1;
    difficultyRoller = gemUpgradeRoller;
    maxLevel = 1000;

    levelDifficulty(level = this.level) {
        return Math.floor(this.baseDifficulty * this.difficultyScale * level);
    }

    getCost(level = this.level) {
        if (level <= this.maxLevel) {
            var base = GemForger.getGemById(RED_FORGED_GEM_INDEX).ticksPerCraft;
            var cost = this.levelDifficulty(level) * base;
            var gemCost = [];
            var sortedGems = [...GemForger.gems].sort((a, b) => b.getTotalTicksIncludingIngredients() - a.getTotalTicksIncludingIngredients());
            for (var i = 0; i < sortedGems.length; i++) {
                var gem = sortedGems[i];
                let amountToConvertToThisGem = 1;
                let gemNum = sortedGems.length - i - 1;
                if (i !== sortedGems.length - 1) {

                    amountToConvertToThisGem = (gemNum / sortedGems.length);
                }
                var gemCosts = Math.floor((cost / gem.ticksPerCraft) * amountToConvertToThisGem);
                gemCost.push({ gem: gem, cost: gemCosts });
                cost -= gemCosts * gem.ticksPerCraft;
                if (cost <= 0) {
                    break;
                }
            }

            return gemCost;
        }
        return [];
    }

    getWorkloadPerGemCost(level = this.level) {
        var cost = this.getCost(level);
        var workload = [];
        for (var i = 0; i < cost.length; i++) {
            workload.push(cost[i].gem.ticksPerCraft * cost[i].cost);
        }
        return workload;
    }

    getIngredients(level = this.level) {
        let cost = this.getCost(level).sort((a, b) => a.gem.id - b.gem.id);
        let ingredients = [];
        for (var i = 0; i < cost.length; i++) {
            ingredients.push({ item: new GemCraftingItem(cost[i].gem.id), quantity: cost[i].cost });
        }
        return ingredients;
    }

    levelEffect() { }
    actualEffect() { return this.levelEffect() }

    isMaxLevel() {
        return this.level >= this.maxLevel;
    }
    canPurchase() {
        if (this.isMaxLevel()) {
            return false;
        }

        let cost = this.getCost(this.level + 1);

        for (var i = 0; i < cost.length; i++) {
            if (cost[i].gem.numOwned() < cost[i].cost) {
                return false;
            }
        }

        return true;
    }

    purchase() {
        let cost = this.getCost(this.level + 1);

        for (var i = 0; i < cost.length; i++) {
            cost[i].gem.spendQuantity(cost[i].cost);
        }

        this.level++;
    }

    get translatedName() { return _(this.name); }

}

class HealthGemUpgrade extends GemUpgrade {
    id = GEM_UPGRADE_TYPES.HEALTH;
    name = _("HP");
    icon = iconHp;
    bonusPerLevel = 1.02;
    baseEffect = 1000;
    baseDifficulty = 5;
    difficultyScale = 20;

    levelEffect(level = this.level) {
        let effect = 0;
        //first 100 levels 
        effect += Math.floor(this.baseEffect * (this.bonusPerLevel ** (Math.min(100, level) - 1)));
        //after 100 levels
        if (level > 100) {
            effect += Math.floor(this.baseEffect * (this.bonusPerLevel - .01) * (this.bonusPerLevel ** Math.max(0, (level - 100))));
        }
        return effect;
    }

    getDescription(level = this.level) {
        return _("{0} Health", this.levelEffect(level));
    }
}

class EnergyGemUpgrade extends GemUpgrade {
    id = GEM_UPGRADE_TYPES.ENERGY;
    name = _("Energy");
    icon = iconEnergy;
    bonusPerLevel = 1;
    baseDifficulty = 25;
    difficultyScale = 2.2;
    baseEffect = 5;

    levelDifficulty(level = this.level) {
        return Math.floor((this.baseDifficulty * level) ** this.difficultyScale);
    }

    levelEffect(level = this.level) {
        return this.baseEffect + (this.bonusPerLevel * (level - 1));
    }

    getDescription(level = this.level) {
        return _("{0} Max Energy", this.levelEffect(level));
    }
}

class EnergyRegenGemUpgrade extends GemUpgrade {
    id = GEM_UPGRADE_TYPES.ENERGY_REGEN;
    name = _("Energy Regen Per Turn");
    icon = iconEnergyRegen;
    bonusPerLevel = 0.25;
    baseDifficulty = 15;
    difficultyScale = 1.55;
    baseEffect = 2;

    levelDifficulty(level = this.level) {
        return Math.floor((this.baseDifficulty * level) ** this.difficultyScale);
    }

    levelEffect(level = this.level) {
        return this.baseEffect + (this.bonusPerLevel * (level - 1));
    }

    getDescription(level = this.level) {
        let energy = this.levelEffect(level);
        let actualEnergy = Math.floor(energy);
        let additionalEnergyChance = energy - actualEnergy;

        let description = _("+{0} Energy per turn.", actualEnergy);

        if (additionalEnergyChance > 0) {
            description = _("+{0} Energy per turn +{1}% chance for an additional.", actualEnergy, (additionalEnergyChance * 100).toFixed(0));
        }

        return description;
    }

    actualEffect() {
        let energy = this.levelEffect();
        let actualEnergy = Math.floor(energy);
        let additionalEnergyChance = energy - actualEnergy;

        if (Math.random() < additionalEnergyChance) {
            actualEnergy++;
        }

        return actualEnergy;
    }
}

class WeaponDrawGemUpgrade extends GemUpgrade {
    id = GEM_UPGRADE_TYPES.WEAPON_DRAW;
    name = _("Cards Drawn Per Turn");
    icon = iconWeaponDraw;
    bonusPerLevel = 0.2;
    baseDifficulty = 5;
    difficultyScale = 3;
    baseEffect = 2;
    maxLevel = 25;

    levelDifficulty(level = this.level) {
        return Math.floor((this.baseDifficulty * level) ** this.difficultyScale);
    }

    levelEffect(level = this.level) {
        if (level > 21) {
            return this.baseEffect + (this.bonusPerLevel * 20) + (0.25 * (level - 21));
        }
        return this.baseEffect + (this.bonusPerLevel * (level - 1));
    }

    getDescription(level = this.level) {
        let draws = this.levelEffect(level);
        let actualDraws = Math.floor(draws);
        let additionalDrawChance = draws - actualDraws;

        let description = _("+{0} cards per turn.", actualDraws);

        if (additionalDrawChance > 0) {
            description = _("+{0} cards per turn +{1}% chance to draw an additional.", actualDraws, (additionalDrawChance * 100).toFixed(0));
        }

        return description;
    }

    actualEffect() {
        let draws = this.levelEffect();
        let actualDraws = Math.floor(draws);
        let additionalDrawChance = draws - actualDraws;

        if (Math.random() < additionalDrawChance) {
            actualDraws++;
        }

        return actualDraws;
    }
}

class MaxWeaponsAvailableGemUpgrade extends GemUpgrade {
    id = GEM_UPGRADE_TYPES.MAX_WEAPONS;
    name = _("Max Cards In Hand");
    icon = iconWeaponsMax;
    bonusPerLevel = 1;
    baseDifficulty = 2;
    difficultyScale = 5;
    baseEffect = 1.8;
    maxLevel = 7;

    levelDifficulty(level = this.level) {
        return Math.floor((this.baseDifficulty * level) ** this.difficultyScale);
    }

    levelEffect(level = this.level) {
        return Math.floor(this.baseEffect + (this.bonusPerLevel * (level - 1)));
    }

    getDescription(level = this.level) {
        return _("Max cards in hand: {0}", this.levelEffect(level));
    }
}


gemUpgradesManager.addGemUpgrade(new HealthGemUpgrade());
gemUpgradesManager.addGemUpgrade(new EnergyGemUpgrade());
gemUpgradesManager.addGemUpgrade(new EnergyRegenGemUpgrade());
gemUpgradesManager.addGemUpgrade(new WeaponDrawGemUpgrade());
gemUpgradesManager.addGemUpgrade(new MaxWeaponsAvailableGemUpgrade());
