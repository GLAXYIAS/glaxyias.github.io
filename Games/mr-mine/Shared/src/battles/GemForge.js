const FORGE_MAX_LEVEL = 10;
const FORGE_LEVEL_STATS = [
    {},
    {
        "level": 1,
        "load": 6
    },
    {
        "level": 2,
        "load": 10
    },
    {
        "level": 3,
        "load": 20
    },
    {
        "level": 4,
        "load": 30
    },
    {
        "level": 5,
        "load": 40
    },
    {
        "level": 6,
        "load": 55
    },
    {
        "level": 7,
        "load": 70
    },
    {
        "level": 8,
        "load": 85
    },
    {
        "level": 9,
        "load": 100
    },
    {
        "level": 10,
        "load": 120
    }
];

class GemForge {
    gems = [];
    workUnits = 0;
    structure = gemForgeStructure;
    blueprint = getBlueprintById(3, 3);

    addGem(gem) {
        this.gems.push(gem);
    }

    update(dt) {
        for (var i = 0; i < this.gems.length; i++) {
            this.gems[i].update(dt);
        }
    }

    currentLoad() {
        return this.gems.reduce((acc, gem) => acc + gem.workload, 0);
    }

    currentMaxLoad() {
        return FORGE_LEVEL_STATS.find(level => level.level == this.structure.level).load;
    }

    atMaxLoad() {
        return this.currentLoad() >= this.currentMaxLoad();
    }

    addLoadToGem(gemId, workload = 1) {
        if ((this.atMaxLoad() && workload > 0)) {
            return;
        }
        let gem = this.getGemById(gemId);
        gem.addWorkload(workload);
        this.workUnits = Math.max(0, this.workUnits + workload);
    }

    getGemById(gemId) {
        return this.gems.find(gem => gem.id == gemId);;
    }

    canQueueGem(gemid) {
        return this.atMaxLoad() ? false : this.getGemById(gemid).canQueue();
    }

    clearWorkload() {
        for (var i = 0; i < this.gems.length; i++) {
            this.addLoadToGem(this.gems[i].id, -this.gems[i].workload);
        }
    }

    balanceLoad() {
        this.clearWorkload();

        let weights = [3, 4, 5, .5, 1];
        let weightSum = weights.reduce((a, b) => a + b, 0);
        let totalPoints = this.currentMaxLoad();

        // Ensure each gem gets at least 1 point
        let basePoints = this.gems.length; // Each gem will get 1 point
        if (totalPoints <= basePoints) {
            this.gems.forEach(gem => this.addLoadToGem(gem.id, 1));
            return; // If total points are less than or equal to the number of gems, we're done
        }

        // Subtract the base points
        totalPoints -= basePoints;

        // Distribute points based on weight distribution
        for (let i = 0; i < this.gems.length; i++) {
            let gem = this.gems[i];
            this.addLoadToGem(gem.id, 1 + Math.floor((weights[i] / weightSum) * totalPoints)); // Each gem starts with 1
        }

        // Calculate how many points have been assigned
        let assignedPoints = this.gems.map(gem => gem.workload).reduce((a, b) => a + b, 0);

        // Distribute any remaining points
        let remainingPoints = this.currentMaxLoad() - assignedPoints;
        for (let i = 0; remainingPoints > 0; i = (i + 1) % this.gems.length) {
            this.addLoadToGem(this.gems[i].id, 1);
            remainingPoints--;
        }
    }



    get saveString() {
        return this.gems.map(gem => gem.saveString).join("!");
    }

    set saveString(value) {
        if (value != "") {
            value = value.split("!");
            for (var i = 0; i < value.length; i++) {
                this.gems[i].saveString = value[i];
            }
        }
    }

    grantGems() {
        for (var i = 0; i < this.gems.length; i++) {
            worldResources[this.gems[i].id].numOwned += 10000;
        }
    }
}
var GemForger = new GemForge();

class Gem {
    id;
    blueprint;
    workload = 0;
    ticksPerCraft = 0;
    ticksRemaining = 0;
    crafted = false;
    missingIngredients = false;

    craftTime = 0; // only used for UI;
    estimatedCraftTime = 0; // only used for UI;

    constructor(id, blueprint) {
        this.id = id;
        this.blueprint = blueprint;
        this.ticksPerCraft = blueprint.forgeTimeSeconds * blueprint.forgeCost;
        this.ticksRemaining = this.ticksPerCraft;
        GemForger.addGem(this);
    }

    lastWorkload = 0;
    lastTicksCompleted = 0;

    update(dt) {
        if (this.workload > 0) {
            if (this.crafted) {
                let amountToReduce = dt * this.workload * STAT.gemSpeedMultiplier();
                this.ticksRemaining = Math.max(0, this.ticksRemaining - amountToReduce);

                if (this.ticksRemaining <= 0) {
                    worldResources[this.id].numOwned++;
                    this.ticksRemaining = this.ticksPerCraft;
                    this.crafted = false;
                }

                this.estimatedCraftTime = currentTime() + ((this.ticksRemaining * (2 - STAT.gemSpeedMultiplier()) / this.workload) * 1000);
            }

            if (!this.crafted && this.ticksRemaining == this.ticksPerCraft) {
                this.craft();
            }
        }
    }

    getIcon() {
        return worldResources[this.id].largeIcon;
    }

    addWorkload(workload) {
        if (this.workload > 0 || this.ticksRemaining < this.ticksPerCraft) {
            this.workload = Math.max(0, this.workload + workload);
        }
        else if (workload > 0 && this.workload == 0 && this.ticksRemaining == this.ticksPerCraft) {
            this.craft()
            this.workload = Math.max(0, this.workload + workload);
        }
    }

    craft() {
        if (canCraftBlueprint(this.blueprint.category, this.blueprint.id)) {
            let ingredients = getBlueprintIngredients(this.blueprint.category, this.blueprint.id);

            for (var i in ingredients) {
                ingredients[i].item.spendQuantity(ingredients[i].quantity);
            }

            this.crafted = true;
            this.missingIngredients = false;
            this.craftTime = currentTime();

            return true;
        }
        this.missingIngredients = true;
        return false;
    }

    numOwned() {
        return worldResources[this.id].numOwned;
    }

    spendQuantity(quantity) {
        worldResources[this.id].numOwned -= quantity;
    }

    canAddWork() {
        return this.workload > 0 ? true : canCraftBlueprint(this.blueprint.category, this.blueprint.id);
    }

    getTotalTicksIncludingIngredients() {
        let ingredients = this.blueprint.ingredients;
        let totalTicks = this.ticksPerCraft;
        for (var i in ingredients) {
            let ingredient = ingredients[i];
            let gem = GemForger.getGemById(ingredient.item.id);
            if (gem) {
                totalTicks += gem.ticksPerCraft * ingredient.quantity;
            }

        }
        return totalTicks;
    }

    get saveString() {
        let crafted = this.crafted ? 1 : 0;
        return [this.workload, crafted, this.ticksRemaining].join("*");
    }

    set saveString(value) {
        value = value.split("*");
        this.workload = parseInt(value[0]);
        this.crafted = parseInt(value[1]) === 1;
        this.ticksRemaining = parseInt(value[1]) === 1 ? parseInt(value[2]) : this.ticksPerCraft;
    }
}


new Gem(RED_FORGED_GEM_INDEX, getBlueprintById(4, 0));
new Gem(BLUE_FORGED_GEM_INDEX, getBlueprintById(4, 1));
new Gem(GREEN_FORGED_GEM_INDEX, getBlueprintById(4, 2));
new Gem(PURPLE_FORGED_GEM_INDEX, getBlueprintById(4, 3));
new Gem(YELLOW_FORGED_GEM_INDEX, getBlueprintById(4, 4));