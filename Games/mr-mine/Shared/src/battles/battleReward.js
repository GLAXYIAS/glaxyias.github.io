

class BattleReward {
    name;
    icon;
    rewardType;

    grant() { }
    getName() { return _(this.name); }
    init() { }

    getSaveString() {
        var saveArray = [this.rewardType];
        for (var key in this.saveDataMap) {
            saveArray[this.saveDataMap[key].index] = this[key];
        }
        return saveArray.join("!")
    }

    restore(saveData) {
        for (var key in this.saveDataMap) {
            this[key] = saveData[this.saveDataMap[key].index];
            if (this.saveDataMap[key].parseFunction) {
                this[key] = this.saveDataMap[key].parseFunction(this[key]);
            }
        }
        this.init();
    }
}


class BattleChestReward extends BattleReward {
    chestType;

    saveDataMap = {
        chestType: { index: 1, parseFunction: parseInt }
    };

    //use reward amount to determine which chest to give
    constructor(chestType) {
        super();
        this.chestType = chestType;
        this.init();
    }

    init() {
        if (this.chestType === undefined) return;

        if (this.chestType == ChestType.basic) {
            this.rewardType = BattleRewardType.basicChest.id;
            this.name = "Basic Chest";
            this.icon = basicChestIconClosed;
        }
        else if (this.chestType == ChestType.gold) {
            this.rewardType = BattleRewardType.goldChest.id;
            this.name = "Gold Chest";
            this.icon = goldChestIconClosed;
        }
        else if (this.chestType == ChestType.black) {
            this.rewardType = BattleRewardType.blackChest.id;
            this.name = "Ethereal Chest";
            this.icon = blackChestIconClosed;
        }
        else if (this.chestType == ChestType.battle) {
            this.rewardType = BattleRewardType.battleChest.id;
            this.name = "Battle Chest";
            this.icon = battleChestIconClosed;
        }

    }

    grant() {
        chestService.grantChest(0, Chest.cave, this.chestType);
    }

    testFunction() {
        this.chestType = rand(0, 2);
        this.init();
    }
}

class BattleMineralReward extends BattleReward {
    rewardType = BattleRewardType.mineral.id;

    saveDataMap = {
        mineralType: { index: 1, parseFunction: parseInt },
        rewardAmount: { index: 2, parseFunction: parseInt }
    };

    constructor(mineralType, rewardAmount) {
        super();

        this.mineralType = mineralType;
        this.rewardAmount = rewardAmount;
        this.init();
    }

    grant() {
        worldResources[this.mineralType].numOwned += this.rewardAmount;
        newNews(_("You gained x{0} {1}!", beautifynum(this.rewardAmount), worldResources[this.mineralType].name), true);
    }

    init() {
        if (this.mineralType === undefined || this.rewardAmount === undefined) return;
        this.name = worldResources[this.mineralType].name;
        this.icon = worldResources[this.mineralType].smallIcon;
    }

    testFunction() {
        let indexOfHighestMineral = mineralIds.indexOf(highestOreUnlocked);
        this.mineralType = mineralIds[rand(0, indexOfHighestMineral - 1)];
        this.rewardAmount = new BigNumber(rand(1, 100000));
        this.init();
    }
}

class BattleMoneyReward extends BattleReward {
    rewardType = BattleRewardType.money.id;
    name = "Money";
    icon = caveIconMoneyBag;

    saveDataMap = {
        rewardAmount: { index: 1, parseFunction: createBattleMoneyReward }
    };

    constructor(rewardAmount) {
        super();
        this.rewardAmount = rewardAmount;
    }

    grant() {
        addMoney(this.rewardAmount);
        newNews(_("You gained ${0}!", beautifynum(this.rewardAmount)), true);
    }

    testFunction() {
        this.rewardAmount = new BigNumber(rand(1, 100000));
    }
}

function createBattleMoneyReward(rewardAmount) {
    return new BigNumber(rewardAmount);
}

const BattleRewardType = {
    basicChest: {
        id: 0,
        constructor: BattleChestReward,
        type: ChestType.basic,
        rarity: .6 * .75,
    },
    goldChest: {
        id: 1,
        constructor: BattleChestReward,
        type: ChestType.gold,
        rarity: .6 * .1,
    },
    blackChest: {
        id: 2,
        constructor: BattleChestReward,
        type: ChestType.black,
        rarity: .6 * .01,
    },
    battleChest: {
        id: 3,
        constructor: BattleChestReward,
        type: ChestType.battle,
        rarity: .6 * .14,
    },
    money: {
        id: 4,
        constructor: BattleMoneyReward,
        rarity: .20
    },
    mineral: {
        id: 5,
        constructor: BattleMineralReward,
        rarity: .20
    }
};

function findBattleRewardById(id) {
    return Object.values(BattleRewardType).find(reward => reward.id === id);
}