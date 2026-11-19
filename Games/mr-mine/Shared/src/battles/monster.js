class monster {
    name;
    animation;
    levelAsset;
    isBoss = false;
    minDepth;
    maxDepth;
    baseDamage;
    baseHealth;
    possibleEquipId;
    bonusReward;
    reward;
    level = 1;

    currentHealth;
    difficulty = 1;
    monsterNumber = 1;

    createInstance(difficulty, depth) {
        var clone = new this.constructor();
        Object.assign(clone, this);
        clone.difficulty = difficulty;
        clone.level = clone.rollLevel(depth);
        clone.baseDamage = Math.floor(clone.baseDamage * Math.pow(1.05, clone.level));
        clone.baseHealth = Math.floor(clone.baseHealth * Math.pow(1.05, clone.level));
        clone.currentHealth = clone.baseHealth;
        return clone;
    }

    grantReward() {
        if (this.isBoss) {
            let battleChest = new BattleChestReward(ChestType.battle)
            battleStorage.store(battleChest);
            newNews(_("You gained a {0} reward from defeating {1}!", battleChest.name, this.name), true);
        }
        if (this.bonusReward) this.bonusReward();

        if (this.reward) {
            battleStorage.store(this.reward);
            newNews(_("You gained a {0} reward from defeating {1}!", this.reward.name, this.name), true);
        }
    }

    rollLevel(depthToRollFor) {
        let percentTowardsMaxDepth = depthToRollFor / this.maxDepth;
        let extraLevels = Math.floor(Math.random() * percentTowardsMaxDepth * 3);

        return 1 + extraLevels;
    }
}
