const STAT_OPERATION_DECIMAL_ADD = 1;
const STAT_OPERATION_DECIMAL_SUBTRACT = 2;
const STAT_OPERATION_INTEGER_ADD = 3;

class stat {
    id;
    description;
    operation;
    maximumImpact;

    constructor(id, description, operation, maximumImpact = Number.MAX_SAFE_INTEGER) {
        this.id = id;
        this.description = description;
        this.operation = operation;
        this.maximumImpact = maximumImpact;
    }

    getTooltip(amount) {
        return _(this.description, amount);
    }

    getStatInfo() {
        let desc = '';

        if (this.operation == STAT_OPERATION_DECIMAL_ADD || this.operation == STAT_OPERATION_DECIMAL_SUBTRACT) {
            let value = Math.floor(Math.abs(STAT.totalValue(this)) * 100)
            desc = _("Current Amount: {0}%", value)

            if (this.maximumImpact != Number.MAX_SAFE_INTEGER) {
                desc += _("<br>Maximum Amount: {0}%", Math.floor(this.maximumImpact * 100))
            }
        }
        else {
            let value = Math.floor(Math.abs(STAT.totalValue(this)))
            desc = _("Current Amount: {0}", value)

            if (this.maximumImpact != Number.MAX_SAFE_INTEGER) {
                desc += _("<br>Maximum Amount: {0}", this.maximumImpact)
            }
        }

        return desc;
    }
}

var MINER_SPEED_MULTIPLIER = new stat(0, _("Increases miner speed by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var SELL_PRICE_MULTIPLIER = new stat(1, _("Increases sell price of all minerals and isotopes by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var CHEST_SPAWN_FREQUENCY = new stat(2, _("Increases chest spawn frequency by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var BATTLE_DAMAGE_MULTIPLIER = new stat(3, _("Increases all battle damage by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var PIKE_HOURS = new stat(4, _("Each new KM depth reached grants {0}hrs worth of your highest mineral unlocked"), STAT_OPERATION_INTEGER_ADD, 48);
var SCIENTIST_EXPERIENCE_MULTIPLIER = new stat(5, _("Increases the experience gain of scientist excavations by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var GOLD_CHEST_SPAWN_FREQUENCY_MULTIPLIER = new stat(6, _("Increases the current spawn rate of golden chests by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, .8);
var DRILL_SPEED_MULTIPLIER = new stat(7, _("Increases drill speed by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var BLUEPRINT_PRICE_MULTIPLIER = new stat(8, _("Decreases blueprint purchase price by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, 0.8);

var INCREASED_EXCAVATION_SUCCESS_RATE_PERCENT = new stat(9, _("Increases all excavation success rates by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, .75);

var BATTLE_HEALTH_MULTIPLIER = new stat(10, _("Increases battle max health by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var EQUIP_RECOVERY_CHANCE = new stat(11, _("{0}% chance for an equip to be returned to your remaining cards after use"), STAT_OPERATION_DECIMAL_ADD, 0.3);
var ENERGY_RECOVERY_CHANCE = new stat(12, _("{0}% chance for an equip to cost 0 Energy"), STAT_OPERATION_DECIMAL_ADD, 0.3);
var SCIENTIST_RESURRECTION_PERCENT_CHANCE = new stat(13, _("Increases chance a scientist will immediately resurrect when killed by {0}%"), STAT_OPERATION_INTEGER_ADD, 80);
var GEM_SPEED_MULTIPLIER = new stat(14, _("Decrease gem crafting time by {0}%"), STAT_OPERATION_DECIMAL_ADD, 0.75);
var BUILDING_MATERIAL_CHANCE_MULTIPLIER = new stat(15, _("Increases the chance of finding building materials in basic chests by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var PERCENT_CHANCE_OF_SELLING_FOR_DOUBLE = new stat(16, _("Increases chance of selling for 2x the price when selling minerals and isotopes by {0}%"), STAT_OPERATION_INTEGER_ADD);
var ISOTOPE_DISCOVERY_CHANCE_MULTIPLIER = new stat(17, _("Increases the chance of finding isotopes by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var CHEST_MONEY_MULTIPLIER = new stat(18, _("Increases money from treasure chests by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var TIMELAPSE_DURATION_MULTIPLIER = new stat(19, _("Increases all timelapse durations by {0}%"), STAT_OPERATION_DECIMAL_ADD, 1);
var OIL_GENERATION_MULTIPLIER = new stat(20, _("Increases the rate of oil generation by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, 0.8);
var MINER_UPGRADE_AND_HIRE_COST_MULTIPLIER = new stat(21, _("Decreases miner upgrade and hire costs by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, 0.8);
var BUFF_DURATION_MULTIPLIER = new stat(22, _("Increase the duration of buffs by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var CARGO_CAPACITY_MULTIPLIER = new stat(23, _("Increases cargo capacity by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var BATTLE_CRIT_CHANCE_PERCENT = new stat(24, _("Increase chance of a critical hit (2x damage) during battle by {0}%"), STAT_OPERATION_INTEGER_ADD, 100);
var OFFLINE_PROGRESS_DURATION_MULTIPLIER = new stat(25, _("Increases maximum duration of offline progress by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var MINERAL_DEPOSIT_CHANCE = new stat(26, _("Increases Mineral Deposit spawn chance by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var ADDITIONAL_MINERAL_DEPOSITS = new stat(27, _("Increases the maximum number of mineral deposits can be in the world by {0}"), STAT_OPERATION_INTEGER_ADD);
var RELIC_MULTIPLIER = new stat(28, _("Increases the effectiveness of your relics by {0}%"), STAT_OPERATION_DECIMAL_ADD);

var DRONE_FUEL_REGEN_MULTIPLIER = new stat(29, _("Increases the speed that caves regen fuel by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var DRONE_STARTING_FUEL_MULTIPLIER = new stat(30, _("Increases drones starting fuel by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var DRONE_MOVEMENT_SPEED_MULTIPLIER = new stat(31, _("Increases drones movement speed by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var SUPER_MINER_SPEED = new stat(32, _("Increases super miner performance by {0}%"), STAT_OPERATION_DECIMAL_ADD, 1);
var MINERAL_DEPOSIT_AMOUNT_MULTIPLIER = new stat(33, _("Increases the maximum number of minerals from a mineral deposit by {0}%"), STAT_OPERATION_DECIMAL_ADD);
var ETHEREAL_CHEST_SPAWN_FREQUENCY_MULTIPLIER = new stat(34, _("Increases the current spawn rate of Ethereal chests by {0}%"), STAT_OPERATION_DECIMAL_SUBTRACT, .85);

var DRONE_OBSTACLE_SPEED_MULTIPLIER = new stat(35, _("Increases the speed at which drones can break through obstacles by {0}%"), STAT_OPERATION_DECIMAL_ADD, 1);
var BATTLE_REDUCE_DAMAGE_CHANCE_PERCENT = new stat(36, _("Increases the chance of reducing damage by half from an attack taken in battle by {0}%"), STAT_OPERATION_DECIMAL_ADD, .2);
var ISOTOPE_ONE_DECAY_CHANCE_PERCENT = new stat(37, _("Increases the chance of an isotope type 1 decaying into an isotope type 2 by {0}%"), STAT_OPERATION_DECIMAL_ADD, .1);
var ISOTOPE_TWO_DECAY_CHANCE_PERCENT = new stat(38, _("Increases the chance of an isotope type 2 decaying into an isotope type 3 by {0}%"), STAT_OPERATION_DECIMAL_ADD, .05);

var UNUSED_STAT = new stat(900, "", STAT_OPERATION_DECIMAL_ADD);

class stats {
    //Get Relics Value
    relicValue(type) {
        if (type == 28) return 0; //no recursion with relic multiplier
        var result = 0;
        for (var i = 0; i < maxRelicSlots; i++) {
            var relicId = equippedRelics[i];
            if (relicId > -1) {
                if (excavationRewards[relicId].statType.id == type) {
                    result += excavationRewards[relicId].amount;
                }
            }
        }
        return result * STAT.relicMultitiplier();
    }

    //Get Buffs Value
    buffValue(type) {
        return buffs.getBuffValue(type);
    }

    //Get Super Miner Value
    superMinerValue(type) {
        return superMinerManager.getStatBonus(type);
    }

    //Get Buff and Relic Value
    totalValue(stat) {

        var value = this.relicValue(stat.id) + this.buffValue(stat.id) + this.superMinerValue(stat.id);

        if (stat.operation == STAT_OPERATION_DECIMAL_ADD || stat.operation == STAT_OPERATION_DECIMAL_SUBTRACT) {
            value /= 100;
        }
        value = Math.min(stat.maximumImpact, value);

        if (stat.operation == STAT_OPERATION_DECIMAL_SUBTRACT) {
            value *= -1;
        }
        return value;
    }

    //###################### STAT GETTERS ######################

    minerSpeedMultiplier() {
        return 1 + this.totalValue(MINER_SPEED_MULTIPLIER);
    }

    sellPriceMultiplier() {
        return 1 + this.totalValue(SELL_PRICE_MULTIPLIER);
    }

    //for simulator
    cachedChestSpawnMultiplier = 1;
    dirtyChestSpawnMultiplierCache = true;

    chestSpawnFrequencyMultiplier() {
        if (isSimulating) {
            if (this.dirtyChestSpawnMultiplierCache) {
                this.cachedChestSpawnMultiplier = 1 + this.totalValue(CHEST_SPAWN_FREQUENCY);
                this.dirtyChestSpawnMultiplierCache = false;
            }
            return this.cachedChestSpawnMultiplier;
        }

        return 1 + this.totalValue(CHEST_SPAWN_FREQUENCY);

    }

    battleDamageMultiplier() {
        return 1 + this.totalValue(BATTLE_DAMAGE_MULTIPLIER);
    }

    getPikeHours() {
        return this.totalValue(PIKE_HOURS);
    }

    scientistExperienceMultiplier() {
        return 1 + this.totalValue(SCIENTIST_EXPERIENCE_MULTIPLIER);
    }

    goldChestSpawnFrequencyMultiplier() {
        return 1 + this.totalValue(GOLD_CHEST_SPAWN_FREQUENCY_MULTIPLIER);
    }

    etherealChestSpawnFrequencyMultiplier() {
        return 1 + this.totalValue(ETHEREAL_CHEST_SPAWN_FREQUENCY_MULTIPLIER);
    }

    drillSpeedMultiplier() {
        return 1 + this.totalValue(DRILL_SPEED_MULTIPLIER);
    }

    blueprintPriceMultiplier() {
        return 1 + this.totalValue(BLUEPRINT_PRICE_MULTIPLIER);
    }

    increasedExcavationSuccessRatePercent() {
        return 1 + this.totalValue(INCREASED_EXCAVATION_SUCCESS_RATE_PERCENT);
    }

    battleHealthMultiplier() {
        return 1 + this.totalValue(BATTLE_HEALTH_MULTIPLIER);
    }

    equipRecoveryMultiplier() {
        return this.totalValue(EQUIP_RECOVERY_CHANCE);
    }

    energyRecoveryMultiplier() {
        return this.totalValue(ENERGY_RECOVERY_CHANCE);
    }

    percentChanceScientistResurrection() {
        return 1 + this.totalValue(SCIENTIST_RESURRECTION_PERCENT_CHANCE);
    }

    gemSpeedMultiplier() {
        return 1 + this.totalValue(GEM_SPEED_MULTIPLIER);
    }

    increasedRateOfFindingBuildingMaterials() {
        return 1 + this.totalValue(BUILDING_MATERIAL_CHANCE_MULTIPLIER);
    }

    percentChanceOfSellingFor2x() {
        return this.totalValue(PERCENT_CHANCE_OF_SELLING_FOR_DOUBLE);
    }

    isotopeFindChanceMultiplier() {
        return 1 + this.totalValue(ISOTOPE_DISCOVERY_CHANCE_MULTIPLIER);
    }

    isotopeOneDecayChancePercent() {
        return this.totalValue(ISOTOPE_ONE_DECAY_CHANCE_PERCENT);
    }

    isotopeTwoDecayChancePercent() {
        return this.totalValue(ISOTOPE_TWO_DECAY_CHANCE_PERCENT);
    }

    chestMoneyMultiplier() {
        return 1 + this.totalValue(CHEST_MONEY_MULTIPLIER);
    }

    timelapseDurationMultiplier() {
        return 1 + this.totalValue(TIMELAPSE_DURATION_MULTIPLIER);
    }

    oilGenerationMultiplier() {
        return 1 + this.totalValue(OIL_GENERATION_MULTIPLIER);
    }

    minerUpgradeAndHireCostMultiplier() {
        return 1 + this.totalValue(MINER_UPGRADE_AND_HIRE_COST_MULTIPLIER);
    }

    buffDurationMultiplier() {
        return 1 + this.totalValue(BUFF_DURATION_MULTIPLIER);
    }

    cargoCapacityMultiplier() {
        return 1 + this.totalValue(CARGO_CAPACITY_MULTIPLIER);
    }

    battleCritChance() {
        return this.totalValue(BATTLE_CRIT_CHANCE_PERCENT);
    }

    battleReduceDamageChance() {
        return this.totalValue(BATTLE_REDUCE_DAMAGE_CHANCE_PERCENT);
    }

    offlineProgressMaxDurationMultiplier() {
        return 1 + this.totalValue(OFFLINE_PROGRESS_DURATION_MULTIPLIER);
    }

    additionalMineralDeposits() {
        return this.totalValue(ADDITIONAL_MINERAL_DEPOSITS);
    }

    mineralDepositMultiplier() {
        return 1 + this.totalValue(MINERAL_DEPOSIT_CHANCE);
    }

    relicMultitiplier() {
        return 1 + this.totalValue(RELIC_MULTIPLIER);
    }

    //for simulator
    cachedFuelRegenMultiplier = 1;
    dirtyFuelCache = true;

    fuelRegenMultiplier() {
        if (isSimulating) {
            if (this.dirtyChestSpawnMultiplierCache) {
                this.cachedFuelRegenMultiplier = 1 + this.totalValue(DRONE_FUEL_REGEN_MULTIPLIER);
                this.dirtyFuelCache = false;
            }
            return this.cachedFuelRegenMultiplier;
        }

        return 1 + this.totalValue(DRONE_FUEL_REGEN_MULTIPLIER);
    }

    startingFuelMultiplier() {
        return 1 + this.totalValue(DRONE_STARTING_FUEL_MULTIPLIER);
    }

    droneSpeedMultiplier() {
        return 1 + this.totalValue(DRONE_MOVEMENT_SPEED_MULTIPLIER);
    }

    superMinerSpeedMultiplier() {
        return 1 + this.totalValue(SUPER_MINER_SPEED);
    }

    mineralDepositMineralMultiplier() {
        return 1 + this.totalValue(MINERAL_DEPOSIT_AMOUNT_MULTIPLIER);
    }

    droneObstacleSpeedMultiplier() {
        return 1 + this.totalValue(DRONE_OBSTACLE_SPEED_MULTIPLIER);
    }
}
var STAT = new stats();