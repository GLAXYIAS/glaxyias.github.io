class BattleStorage {
    treasure = []; // Array of battleReward
    maxTreasure = 6;

    store(battleReward) {
        if (!this.isFull()) {
            this.treasure.push(battleReward);
            ++numberOfRewardsCollected;
        }
        else {
            newNews(_("You could not collect a reward because your battle storage is full!"), true);
        }
    }

    grantAndRemove(rewardIndex) {
        if (this.treasure.length > rewardIndex) {
            this.treasure[rewardIndex].grant();
            this.treasure.splice(rewardIndex, 1);
        }
    }

    isFull() {
        return this.treasure.length >= this.maxTreasure;
    }

    get saveState() {
        var saveArray = [];
        for (var i = 0; i < this.treasure.length; i++) {
            saveArray.push(this.treasure[i].getSaveString());
        }
        return saveArray.join("*");
    }

    set saveState(value) {
        if (value != "") {
            var saveArray = value.split("*");
            for (var i = 0; i < saveArray.length; i++) {
                var rewardStats = saveArray[i].split("!");
                var baseReward = findBattleRewardById(parseInt(rewardStats[0]));
                var reward = new baseReward.constructor();
                reward.restore(rewardStats);
                this.store(reward);
            }
        }
    }

    generateTestTreasures() {
        for (var i = 0; i < 10; i++) {
            let reward = findBattleRewardById(rand(0, 2));
            let randomReward = new reward.constructor();
            randomReward.testFunction();
            this.store(randomReward);
        }
    }
}

const battleStorage = new BattleStorage();