// ##################################################
// ################### QUEST DATA ###################
// ##################################################

const REWARD_TYPE_BASIC_CHEST = 1;
const REWARD_TYPE_GOLD_CHEST = 2;
const REWARD_TYPE_TICKETS = 3;
const REWARD_TYPE_BUILDING_MATERIALS = 4;
const REWARD_TYPE_BATTLE_CHEST = 5;
const REWARD_TYPE_ETHEREAL_CHEST = 6;
const REWARD_TYPE_BEACON = 7;
const REWARD_TYPE_RODS = 8;
const REWARD_TYPE_BASIC_CHEST_AND_TICKETS = 9;
const REWARD_TYPE_GOLD_CHEST_AND_TICKETS = 10;
const REWARD_TYPE_ETHEREAL_CHEST_AND_TICKETS = 11;

//quest is deprecated for questManager.quests
var quest = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//Quest status: 0 - Unachieved, 1 - Achieved But Unrewarded, 2 - Achieved And Rewarded

//To do:
//Balance the rewards

class QuestManager
{
    quests = [];
    hasPushedStatusToSteam = false;

    // Display order array - controls the order quests appear in the UI
    // Organized by progression and grouping similar achievements together
    displayOrder = [
        // Early game basics
        36,   // Upgrade your drill
        104,  // Craft 50 drill upgrades
        105,  // Craft 100 drill upgrades

        // Minerals
        0,    // 100 Gold Ores
        37,   // Find Diamond
        57,   // Find Uranium-3
        58,   // Find Polonium-3
        60,   // Mine Californium

        // Moon minerals
        61,   // Find Titanium
        62,   // Mine Promethium
        63,   // Mine Ytterbium
        59,   // Get Einsteinium-3

        // Depth progression
        3,    // 20km
        4,    // 40km
        11,   // 70km
        13,   // 100km
        15,   // Underground city (303km)
        65,   // Reach core (501km)
        66,   // 750km
        30,   // Reach moon (1032km)
        67,   // Reach Titan (1814km)

        // Workers
        9,    // 10 workers
        42,   // Upgrade earth workers to level 5
        87,   // 10 workers on moon

        //Upgrades
        43,   // Unlock metal detector
        44,   // Unlock manager
        71,   // Upgrade manager to level 3

        // Super Miners
        96,   // First super miner
        97,   // Legendary super miner
        99,   // Max level super miner

        //Characters
        6,    // Talk to golem
        64,   // Talk to broken robot (250km)
        90,   // Talk to jeb
        94,   // Find the mime
        95,    // Find a UFO

        // Playtime
        2,    // 2 hours
        8,    // 24 hours
        68,   // 7 days

        // Money progression
        10,   // Billion
        53,   // Trillion
        56,   // Quintillion
        54,   // Earn 1 Quadrillion in session
        55,   // Sell $100 Quadrillion minerals

        // Drill power
        7,    // 10K watts
        12,   // 10M watts
        83,   // 10 Trillion watts



        // Trading
        106,  // Find trading post (hidden)
        38,   // First trade
        39,   // 5 trades
        40,   // 50 trades
        41,   // 250 trades

        // Chests
        5,    // Golden chest
        70,   // Upgrade chest collector to level 3
        72,   // Use chest compressor
        103,  // Compress 100 chests
        75,   // Open 1,000 basic chests
        76,   // Collect 100 gold chests
        98,   // Open 100 Ethereal Chests

        // Caves
        107,  // Discover underground cave
        48,   // Fully complete a cave
        50,   // Complete 10 caves
        51,   // Complete cave of 15 depth
        49,   // Cave drone to level 3
        52,   // Drone survive with <5% health

        // Scientists
        22,   // Legendary scientist
        29,   // Level 30 scientist
        100,  // 100 levels across scientists
        88,   // Bury 10 scientists
        24,   // Bury 30 scientists

        // Relics & Excavations
        46,   // Find a relic
        47,   // Complete nightmare excavation
        73,   // Complete excavation with 90%+ failure
        101,  // Spend 1000 Relic Scrap


        // Combat & Battle
        18,   // Fists to Level 3
        23,   // 4 non-fist battle equips
        27,   // 10 or more equips
        80,   // Battle equip to max level
        79,   // Kill a monster
        16,   // Kill 100 monsters
        102,  // Win 300 battles
        31,   // Kill a Whacko
        21,   // Defeat third boss
        109,  // Defeat all Earth Bosses
        110,  // Defeat all Moon Bosses
        111,  // Defeat all Titan Bosses

        // Gems & Crafting
        25,   // Craft purple gem
        26,   // Craft yellow gem

        // Core
        28,   // Sacrifice 50 billion minerals
        89,   // Sacrifice scientist to core
        91,   // Sacrifice book of secrets
        92,   // Get divine relic
        93,   // Get warped scientist

        // Oil & Resources
        17,   // Hold 4 oil
        19,   // Oil Rig to Level 6
        81,   // Oil pump to level 14

        // Reactor
        108,  // Find the reactor
        32,   // Power up reactor
        33,   // Reactor level 5
        84,   // Generate 300 energy/sec
        85,   // 5 million energy
        86,   // 10 million energy

        // Buff Lab
        34,   // Cast a buff
        35,   // Stay buffed 24 hours


        // Structures & Utilities
        82,   // 1,000 building materials

        // Timelapse
        69,   // Timelapse 3 days in session
        77,   // Total timelapse 1 week
        78,   // Total timelapse 1 year

        // Meta achievements
        14,   // Complete 20 Quests
        74,   // Click orange fish
        45,   // Return to game (hidden)

        // Sharing achievements
        1,    // Share with friend
        20,   // Help MrMine grow
        112,  // Join Playsarus Accounts
    ];

    get saveState()
    {
        //Provide serialize value for save manager
        let toSave = [];

        for(var i = 0; i < this.quests.length; i++)
        {
            toSave.push((this.quests[i].isComplete) ? 1 : 0);
            toSave.push((this.quests[i].isCollected) ? 1 : 0);
        }

        return toSave.join("!");
    }

    set saveState(value)
    {

        //parse
        var values = (value === '') ? [] : value.split("!");
        var index = 0;
        for(var i = 0; i < values.length; i += 2)
        {
            if (index >= this.quests.length) break;
            this.quests[index].isComplete = (values[i] == 1);
            this.quests[index].isCollected = (values[i + 1] == 1);
            index++;
        }
    }

    constructor()
    {

    }

    registerQuest(questInstance)
    {
        console.log("adding quest" + questInstance.id);
        this.quests[questInstance.id] = questInstance;
    }

    getQuest(questId)
    {
        return this.quests[questId];
    }

    getQuestsInDisplayOrder()
    {
        // Returns quests in the order specified by displayOrder array
        return this.displayOrder
            .map(id => this.quests[id])
            .filter(quest => quest != null);
    }

    //Call every 100msec
    update()
    {
        //update every one second when in focus and when there is activity, every 5 seconds if no activity
        if(isWindowInFocus && afk == 15)
        {
            this.checkQuestCompletion();
        }
        else
        {
            if(requiresUpdate(5000, 1000))
            {
                this.checkQuestCompletion();
                updateHighestLevelScientist(); // this probably shouldn't go here, but not sure where else to put it.
            }
        }

        if(!this.hasPushedStatusToSteam)
        {
            this.pushQuestCompletionStatusToSteam();
            this.hasPushedStatusToSteam = true;
        }
    }

    //Call this every so often
    checkQuestCompletion()
    {
        for(var i = 0; i < this.quests.length; i++)
        {
            var questToCheck = this.quests[i];
            if(!questToCheck.isComplete && questToCheck.completionCheck != null)
            {
                if(questToCheck.completionCheck())
                {
                    questToCheck.markComplete();
                    if(!mutebuttons) questCompleteAudio.play();

                    if(questToCheck.onComplete != null)
                    {
                        questToCheck.onComplete();
                    }

                    if(isSteam() && questToCheck.steamAchievementId != "")
                    {
                        platform.grantAchievement(questToCheck.steamAchievementId);
                    }

                    trackEvent_completedQuest(questToCheck.id);
                }
            }
        }
    }

    pushQuestCompletionStatusToSteam()
    {
        if(isSteam())
        {
            for(var i = 0; i < this.quests.length; i++)
            {
                var questToCheck = this.quests[i];
                if(questToCheck.isComplete)
                {
                    platform.grantAchievement(questToCheck.steamAchievementId);
                }
            }
        }
    }

    isQuestComplete(questId)
    {
        return this.getQuest(questId).isComplete;
    }

    getCompletedQuestCount()
    {
        var count = 0;
        for(var i in this.quests)
        {
            if(this.quests[i].isComplete)
            {
                ++count;
            }
        }
        return count;
    }

    grantMoneyRewardsForCompletedQuests()
    {
        for(var i in this.quests)
        {
            if(this.quests[i].isComplete && this.quests[i].isCollected)
            {
                this.quests[i].isCollected = true;
                this.quests[i].grantMoneyReward();
            }
        }
    }

    grantRewardsForCompletedQuests()
    {
        for(var i in this.quests)
        {
            if(this.quests[i].isComplete && !this.quests[i].isCollected)
            {
                this.quests[i].isCollected = true;
                this.quests[i].collect;
            }
        }
    }

    resetAllQuests()
    {
        for(var i in this.quests)
        {
            this.quests[i].isComplete = false;
            this.quests[i].isCollected = false;
        }
        this.update();
    }

    resetQuestsForAscension()
    {
        this.quests.forEach(quest =>
        {
            if(quest.resetsWithAscension)
            {
                quest.isCollected = false;
                quest.isComplete = false;
            }
        })
    }
}
var questManager = new QuestManager();

class Quest
{
    id;
    isSteamAchievement;
    steamAchievementId = "";

    //State (will need to migrate from quest array above)
    isComplete = false;
    isCollected = false;

    name = "";
    description = "";
    rewardType = null;
    rewardAmount = 0;
    moneyReward = new BigNumber(0);
    additionalOnClick = null; //for popups
    completionCheck = null; //function to check for completion (not all will have this)
    completionPercentFunction = null; //function to check for percent completion (not all will have this)
    isVisible = null; //function to check for visibility
    onComplete = null;
    resetsWithAscension = true;

    constructor()
    {
        this.isVisible = function () {return false;};
    }

    collect()
    {
        if(this.isCollectable())
        {
            //give reward
            let collected = this.grantReward();
            if(collected)
            {
                this.isCollected = true;
                if(!mutebuttons) questCollectAudio.play();
            }
        }
    }

    grantReward()
    {
        let rewardGranted = true;
        switch(this.rewardType)
        {
            case REWARD_TYPE_TICKETS:
                newNews(_("You got {0} Tickets!", this.rewardAmount));
                addTickets(this.rewardAmount, "achievement");
                break;
            case REWARD_TYPE_BASIC_CHEST:
                rewardGranted = openBasicChest();
                break;
            case REWARD_TYPE_GOLD_CHEST:
                rewardGranted = openGoldChest();
                break;
            case REWARD_TYPE_BATTLE_CHEST:
                rewardGranted = openBattleChest();
                break;
            case REWARD_TYPE_ETHEREAL_CHEST:
                rewardGranted = openEtherealChest();
                break;
            case REWARD_TYPE_BASIC_CHEST_AND_TICKETS:
                rewardGranted = openBasicChest();
                if(rewardGranted)
                {
                    newNews(_("You got {0} Tickets!", this.rewardAmount));
                    addTickets(this.rewardAmount, "achievement");
                }
                break;
            case REWARD_TYPE_GOLD_CHEST_AND_TICKETS:
                rewardGranted = openGoldChest();
                if(rewardGranted)
                {
                    newNews(_("You got {0} Tickets!", this.rewardAmount));
                    addTickets(this.rewardAmount, "achievement");
                }
                break;
            case REWARD_TYPE_ETHEREAL_CHEST_AND_TICKETS:
                rewardGranted = openEtherealChest();
                if(rewardGranted)
                {
                    newNews(_("You got {0} Tickets!", this.rewardAmount));
                    addTickets(this.rewardAmount, "achievement");
                }
                break;
            case REWARD_TYPE_BUILDING_MATERIALS:
                newNews(_("You got {0} Building Materials!", this.rewardAmount));
                worldResources[BUILDING_MATERIALS_INDEX].add(this.rewardAmount, "quest");
                break;
            case REWARD_TYPE_BEACON:
                newNews(_("You got {0} Beacon!", this.rewardAmount));
                revealCaveConsumable.caveReveals += this.rewardAmount;
                break;
            case REWARD_TYPE_RODS:
                newNews(_("You got {0} Fuel Rods!", this.rewardAmount));
                reactorComponents[FUEL_ROD_TYPE_1].numOwned += this.rewardAmount;
                break;
            default:
                console.log("no reward entry for id: " + this.id + "- " + this.rewardType);
                break;
        }
        if(rewardGranted)
        {
            this.grantMoneyReward();
            return true;
        }
        else
        {
            showAlertPrompt(_("Unlock more miners to collect chests"))
            return false;
        }
    }

    grantMoneyReward()
    {
        if(this.moneyReward.greaterThan(0))
        {
            addMoney(this.moneyReward);
            newNews(_("You got ${0} from a quest!", beautifynum(this.moneyReward)));
        }
    }

    markComplete()
    {
        if(!this.isComplete)
        {
            this.isComplete = true;
            newNews(_("You Completed The Quest") + ": " + _(this.name), true);
        }
    }

    isCollectable()
    {
        return !this.isCollected && this.isComplete;
    }

    requiresInteraction()
    {
        return this.isVisible() && !this.isComplete && this.additionalOnClick;
    }

    getFormattedTooltip()
    {
        if(!this.isVisible() && !this.isComplete)
        {
            return {header: "???", body: ""}
        }
        var body = this.description;
        if(!this.isComplete)
        {
            if(this.additionalOnClick)
            {
                body += "<br><b>" + _("(Click to complete)") + "</b>";
            }
            body += "<br><br>" + _("Reward: {0}", this.getRewardString());
            if(this.completionPercentFunction && !this.isCollected)
            {
                body += "<br><div class='quest-progress-container'><progress class='quest-progress' value='" + this.completionPercentFunction() + "' max='1'></progress></div>";
            }
        }
        else if(this.isCollectable())
        {
            body += "<br><br>" + _("Reward: {0}", this.getRewardString());
            body += "<br><br>" + _("(Click to collect)");
        }
        return {
            header: this.name,
            body: body
        };
    }

    getIcon()
    {
        if(this.isComplete)
        {
            return window["a" + this.id];
        }
        else if(this.isVisible())
        {
            return window["a" + this.id + "g"];
        }
        else
        {
            return hiddenQuestIcon;
        }
    }

    getRewardString()
    {
        var rewardString;
        switch(this.rewardType)
        {
            case REWARD_TYPE_TICKETS:
                rewardString = _("{0}x Tickets", this.rewardAmount);
                break;
            case REWARD_TYPE_BASIC_CHEST:
                rewardString = _("Basic Chest");
                break;
            case REWARD_TYPE_GOLD_CHEST:
                rewardString = _("Gold Chest");
                break;
            case REWARD_TYPE_ETHEREAL_CHEST:
                rewardString = _("Ethereal Chest");
                break;
            case REWARD_TYPE_BATTLE_CHEST:
                rewardString = _("Battle Chest");
                break;
            case REWARD_TYPE_BASIC_CHEST_AND_TICKETS:
                rewardString = _("Basic Chest and {0}x Tickets", this.rewardAmount);
                break;
            case REWARD_TYPE_GOLD_CHEST_AND_TICKETS:
                rewardString = _("Gold Chest and {0}x Tickets", this.rewardAmount);
                break;
            case REWARD_TYPE_ETHEREAL_CHEST_AND_TICKETS:
                rewardString = _("Ethereal Chest and {0}x Tickets", this.rewardAmount);
                break;
            case REWARD_TYPE_BUILDING_MATERIALS:
                rewardString = _("{0}x Building Materials", this.rewardAmount);
                break;
            case REWARD_TYPE_BEACON:
                rewardString = _("{0}x Beacon", this.rewardAmount);
                break;
            case REWARD_TYPE_RODS:
                rewardString = _("{0}x Fuel Rods", this.rewardAmount);
                break;
            default:
                break;
        }
        if(this.moneyReward.greaterThan(0))
        {
            var moneyString = "$" + beautifynum(this.moneyReward);
            if(rewardString)
            {
                return _("{0} and {1}", rewardString, moneyString);
            }
            else
            {
                return moneyString;
            }
        }
        else
        {
            return rewardString;
        }
    }
}

(function initializeQuests()
{
    var quest1 = new Quest();
    quest1.id = 0;
    quest1.isSteamAchievement = true;
    quest1.steamAchievementId = "QUEST_2";
    quest1.name = _("100 GOLD ORE");
    quest1.description = _("Have 100 Gold Ores in your inventory at once");
    quest1.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest1.moneyReward = new BigNumber(5000);
    quest1.completionCheck = function () {return numGoldOwned() >= 100;};
    quest1.completionPercentFunction = function () {return worldResources[GOLD_INDEX].numOwned / 100;};
    quest1.isVisible = function () {return true;};
    questManager.registerQuest(quest1);

    var quest2 = new Quest();
    quest2.id = 1;
    quest2.isSteamAchievement = false;
    quest2.name = _("SHARE MRMINE WITH A FRIEND");
    quest2.description = _("Share MrMine with a friend") + " <br><br> " + _("* Please allow up to 30min for this to complete after sharing");
    quest2.rewardType = REWARD_TYPE_TICKETS;
    quest2.rewardAmount = 5;
    quest2.moneyReward = new BigNumber(50000);
    quest2.isVisible = function () {return true;};
    quest2.resetsWithAscension = false;
    quest2.additionalOnClick = function () {showSimpleInput(_("Send this message to a friend to share the game with them!") + " <br> <br> " + _("* Please allow up to 30min for this to complete after sharing"), _("Copy Message"), generateShareText(), () => {copyShareText(); shareMouseDown(true);}, _("Cancel"), 0, () => {shareMouseDown(false);});};
    questManager.registerQuest(quest2);

    var quest3 = new Quest();
    quest3.id = 2;
    quest3.isSteamAchievement = true;
    quest3.steamAchievementId = "QUEST_3";
    quest3.name = _("PLAY FOR 2HRS");
    quest3.description = _("Play MrMine for 2HRS");
    quest3.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest3.moneyReward = new BigNumber(20000);
    quest3.completionCheck = function () {return playtime >= 7200;};
    quest3.completionPercentFunction = function () {return playtime / 7200;};
    quest3.isVisible = function () {return true;};
    questManager.registerQuest(quest3);

    var quest4 = new Quest();
    quest4.id = 3;
    quest4.isSteamAchievement = true;
    quest4.steamAchievementId = "QUEST_4";
    quest4.name = _("20 DEPTH");
    quest4.description = _("Dig down to 20km");
    quest4.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest4.moneyReward = new BigNumber(5000);
    quest4.completionCheck = function () {return depth >= 20;};
    quest4.completionPercentFunction = function () {return depth / 20;};
    quest4.isVisible = function () {return true;};
    quest4.onComplete = function ()
    {
        newNews(_("Chests can be found at depth 20 and below, check depth 20 now!"), true);
        chestService.spawnChest(20, Chest.quest);
    };
    questManager.registerQuest(quest4);

    var quest5 = new Quest();
    quest5.id = 4;
    quest5.isSteamAchievement = true;
    quest5.steamAchievementId = "QUEST_5";
    quest5.name = _("40 DEPTH");
    quest5.description = _("Dig down to 40km");
    quest5.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest5.moneyReward = new BigNumber(12500);
    quest5.completionCheck = function () {return depth >= 40;};
    quest5.completionPercentFunction = function () {return depth / 40;};
    quest5.isVisible = function () {return questManager.isQuestComplete(3);};
    questManager.registerQuest(quest5);

    var quest6 = new Quest();
    quest6.id = 5;
    quest6.isSteamAchievement = true;
    quest6.steamAchievementId = "QUEST_6";
    quest6.name = _("GOLDEN CHEST");
    quest6.description = _("Find a golden chest");
    quest6.rewardType = REWARD_TYPE_TICKETS;
    quest6.rewardAmount = 3;
    quest6.moneyReward = new BigNumber(1250000);
    quest6.completionCheck = function () {return chestService.userHasFoundGoldenChest();};
    quest6.isVisible = function () {return true;};
    questManager.registerQuest(quest6);

    var quest7 = new Quest();
    quest7.id = 6;
    quest7.isSteamAchievement = true;
    quest7.steamAchievementId = "QUEST_7";
    quest7.name = _("GOLEM");
    quest7.description = _("Talk to the golem");
    quest7.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest7.moneyReward = new BigNumber(1250000);
    quest7.completionCheck = function () {return hasFoundGolem == 1 && depth >= 50;};
    quest7.isVisible = function () {return true;};
    questManager.registerQuest(quest7);

    var quest8 = new Quest();
    quest8.id = 7;
    quest8.isSteamAchievement = true;
    quest8.steamAchievementId = "QUEST_8";
    quest8.name = _("10K WATTS");
    quest8.description = _("Have 10,000 watts on your drill");
    quest8.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest8.moneyReward = new BigNumber(1250000);
    quest8.completionCheck = function () {return drillWattage().greaterThan(10000);};
    quest8.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(drillWattage(), 10000);};
    quest8.isVisible = function () {return true;};
    questManager.registerQuest(quest8);

    var quest9 = new Quest();
    quest9.id = 8;
    quest9.isSteamAchievement = true;
    quest9.steamAchievementId = "QUEST_9";
    quest9.name = _("PLAY 24HRS");
    quest9.description = _("Play MrMine for 24HRS");
    quest9.rewardType = REWARD_TYPE_ETHEREAL_CHEST;
    quest9.completionCheck = function () {return playtime > 86400;};
    quest9.completionPercentFunction = function () {return playtime / 86400;};
    quest9.isVisible = function () {return questManager.isQuestComplete(2);};
    questManager.registerQuest(quest9);

    var quest10 = new Quest();
    quest10.id = 9;
    quest10.isSteamAchievement = true;
    quest10.steamAchievementId = "QUEST_10";
    quest10.name = _("10 WORKERS");
    quest10.description = _("Hire 10 workers");
    quest10.rewardType = REWARD_TYPE_TICKETS;
    quest10.rewardAmount = 3;
    quest10.moneyReward = new BigNumber(2000000);
    quest10.completionCheck = function () {return getEarth().workersHired >= 10;};
    quest10.completionPercentFunction = function () {return getEarth().workersHired / 10;};
    quest10.isVisible = function () {return true;};
    questManager.registerQuest(quest10);

    var quest11 = new Quest();
    quest11.id = 10;
    quest11.isSteamAchievement = true;
    quest11.steamAchievementId = "QUEST_11";
    quest11.name = _("BILLIONAIRE");
    quest11.description = _("Have a billion dollars at one time");
    quest11.rewardType = REWARD_TYPE_TICKETS;
    quest11.rewardAmount = 3;
    quest11.moneyReward = new BigNumber(100000000);
    quest11.completionCheck = function () {return money.greaterThanOrEqualTo(1000000000);};
    quest11.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(money, 1000000000);}
    quest11.isVisible = function () {return true;};
    questManager.registerQuest(quest11);

    var quest12 = new Quest();
    quest12.id = 11;
    quest12.isSteamAchievement = true;
    quest12.steamAchievementId = "QUEST_12";
    quest12.name = _("70 DEPTH");
    quest12.description = _("Dig down to 70km");
    quest12.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest12.moneyReward = new BigNumber(125000000);
    quest12.completionCheck = function () {return depth >= 70;};
    quest12.completionPercentFunction = function () {return depth / 70;};
    quest12.isVisible = function () {return questManager.isQuestComplete(4);};
    questManager.registerQuest(quest12);

    var quest13 = new Quest();
    quest13.id = 12;
    quest13.isSteamAchievement = true;
    quest13.steamAchievementId = "QUEST_13";
    quest13.name = _("10M WATTS");
    quest13.description = _("Have 10,000,000 watts on your drill");
    quest13.rewardType = REWARD_TYPE_TICKETS;
    quest13.rewardAmount = 3;
    quest13.moneyReward = new BigNumber(150000000);
    quest13.completionCheck = function () {return drillWattage().greaterThan(10000000) || drillWattage().equals(10000000);};
    quest13.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(drillWattage(), 10000000);};
    quest13.isVisible = function () {return questManager.isQuestComplete(7);};
    questManager.registerQuest(quest13);

    var quest14 = new Quest();
    quest14.id = 13;
    quest14.isSteamAchievement = true;
    quest14.steamAchievementId = "QUEST_14";
    quest14.name = _("100 DEPTH");
    quest14.description = _("Dig down to 100km");
    quest14.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest14.moneyReward = new BigNumber(500000000);
    quest14.isMilestone = true;
    quest14.milestoneDepth = 100;
    quest14.completionCheck = function () {return depth >= 100;};
    quest14.completionPercentFunction = function () {return depth / 100;};
    quest14.isVisible = function () {return questManager.isQuestComplete(11);};
    questManager.registerQuest(quest14);

    var quest15 = new Quest();
    quest15.id = 14;
    quest15.isSteamAchievement = true;
    quest15.steamAchievementId = "QUEST_15";
    quest15.name = _("THE QUEST QUEST");
    quest15.description = _("Complete 20 Quests");
    quest15.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest15.moneyReward = new BigNumber(500000000);
    quest15.completionCheck = function () {return numQuestsCompleted() >= 20;};
    quest15.completionPercentFunction = function () {return numQuestsCompleted() / 20;};
    quest15.isVisible = function () {return true;};
    questManager.registerQuest(quest15);

    var quest16 = new Quest();
    quest16.id = 15;
    quest16.isSteamAchievement = true;
    quest16.steamAchievementId = "QUEST_16";
    quest16.name = _("REACH THE UNDERGROUND");
    quest16.description = _("Reach the underground city");
    quest16.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest16.rewardAmount = 1;
    quest16.moneyReward = new BigNumber(100000000000);
    quest16.isMilestone = true;
    quest16.milestoneDepth = 304;
    quest16.completionCheck = function () {return depth >= 303;};
    quest16.completionPercentFunction = function () {return depth / 303;};
    quest16.isVisible = function () {return depth >= 60;}; //Need to consider when this quest shows up as visible
    quest16.onComplete = function ()
    {
        grantDefaultEquips();
    }
    questManager.registerQuest(quest16);

    var quest17 = new Quest();
    quest17.id = 16;
    quest17.isSteamAchievement = true;
    quest17.steamAchievementId = "QUEST_17";
    quest17.name = _("BRUTAL KILLER");
    quest17.description = _("Kill 100 monsters");
    quest17.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest17.rewardAmount = 20;
    quest17.moneyReward = new BigNumber(500000000000);
    quest17.completionCheck = function () {return monsterskilled >= 100;};
    quest17.completionPercentFunction = function () {return monsterskilled / 100;};
    quest17.isVisible = function () {return questManager.isQuestComplete(15);}; //should this and other quests unlock when they reach the underground or when they collect the reached underground achievement?
    questManager.registerQuest(quest17);

    var quest18 = new Quest();
    quest18.id = 17;
    quest18.isSteamAchievement = true;
    quest18.steamAchievementId = "QUEST_18";
    quest18.name = _("OIL TAP");
    quest18.description = _("Hold 4 oil at one time");
    quest18.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest18.moneyReward = new BigNumber(500000000000);
    quest18.completionCheck = function () {return numOilOwned() >= 4;};
    quest18.completionPercentFunction = function () {return numOilOwned() / 4;};
    quest18.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest18);

    var quest19 = new Quest();
    quest19.id = 18;
    quest19.isSteamAchievement = true;
    quest19.steamAchievementId = "QUEST_19";
    quest19.name = _("FISTS OF FURY");
    quest19.description = _("Get Fists to Level 3");
    quest19.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest19.moneyReward = new BigNumber(250000000000);
    quest19.completionCheck = function ()
    {
        if(battleEquipsManager && questManager.isQuestComplete(15))
        {
            return battleEquipsManager.activeEquips.some(equip => equip.name === "Fist" && equip.level >= 3);
        }
        return false;
    };
    quest19.completionPercentFunction = function ()
    {
        if(battleEquipsManager && questManager.isQuestComplete(15))
        {
            let maxLevel = 0;
            const equips = battleEquipsManager.activeEquips.filter(equip => equip.id === "Fist");
            for(let equip of equips)
            {
                if(equip.level > maxLevel)
                {
                    maxLevel = equip.level;
                }
            }
            return maxLevel / 3;
        }
        return 0;
    }
    quest19.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest19);

    var quest20 = new Quest();
    quest20.id = 19;
    quest20.isSteamAchievement = true;
    quest20.steamAchievementId = "QUEST_20";
    quest20.name = _("DEEP PUMPING");
    quest20.description = _("Get Oil Rig to Level 6");
    quest20.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest20.rewardAmount = 5;
    quest20.moneyReward = new BigNumber(500000000000);
    quest20.completionCheck = function () {return oilrigStructure.level >= 6;};
    quest20.completionPercentFunction = function () {return oilrigStructure.level / 6;};
    quest20.isVisible = function () {return questManager.isQuestComplete(17);};
    questManager.registerQuest(quest20);

    var quest21 = new Quest();
    quest21.id = 20;
    quest21.isSteamAchievement = false;
    quest21.name = _("HELP MRMINE GROW");
    quest21.description = _("Small developers like us rely on players like YOU to grow our games. If you enjoy it, please do what you can to promote our game!");
    quest21.additionalOnClick = function () {reviewMouseDown(); checkReview();};
    quest21.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest21.moneyReward = new BigNumber(100000000000);
    quest21.isVisible = function () {return questManager.isQuestComplete(15);};
    quest21.resetsWithAscension = false;
    questManager.registerQuest(quest21);

    var quest22 = new Quest();
    quest22.id = 21;
    quest22.isSteamAchievement = true;
    quest22.steamAchievementId = "QUEST_22";
    quest22.name = _("BOSS DESTROYER");
    quest22.description = _("Defeat the third boss");
    quest22.rewardType = REWARD_TYPE_TICKETS;
    quest22.rewardAmount = 5;
    quest22.moneyReward = new BigNumber(500000000000);
    quest22.completionCheck = function () {return bossesDefeated >= 3;};
    quest22.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest22);

    var quest23 = new Quest();
    quest23.id = 22;
    quest23.isSteamAchievement = true;
    quest23.steamAchievementId = "QUEST_23";
    quest23.name = _("FANCY PANTS");
    quest23.description = _("Get a Legendary scientist");
    quest23.rewardType = REWARD_TYPE_TICKETS;
    quest23.rewardAmount = 3;
    quest23.completionCheck = function () {return hasLegendaryScientist();};
    quest23.isVisible = function () {return hasUnlockedScientists > 0;};
    questManager.registerQuest(quest23);

    var quest24 = new Quest();
    quest24.id = 23;
    quest24.isSteamAchievement = true;
    quest24.steamAchievementId = "QUEST_24";
    quest24.name = _("ONE FOR EACH LIMB");
    quest24.description = _("Have 4 battle non-fist battle equips");
    quest24.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest24.rewardAmount = 1;
    quest24.moneyReward = new BigNumber(500000000000);
    quest24.completionCheck = function () {return has4Weapons();};
    quest24.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest24);

    var quest25 = new Quest();
    quest25.id = 24;
    quest25.isSteamAchievement = true;
    quest25.steamAchievementId = "QUEST_25";
    quest25.name = _("THE REAPER");
    quest25.description = _("Bury 30 scientists");
    quest25.rewardType = REWARD_TYPE_TICKETS;
    quest25.rewardAmount = 15;
    quest25.moneyReward = new BigNumber(750000000000);
    quest25.completionCheck = function () {return deadScientists >= 30;};
    quest25.completionPercentFunction = function () {return deadScientists / 30;};
    quest25.isVisible = function () {return deadScientists > 0;};
    questManager.registerQuest(quest25);

    var quest26 = new Quest();
    quest26.id = 25;
    quest26.isSteamAchievement = true;
    quest26.steamAchievementId = "QUEST_26";
    quest26.name = _("GEM ENTHUSIAST");
    quest26.description = _("Craft a purple gem");
    quest26.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest26.rewardAmount = 1;
    quest26.moneyReward = new BigNumber(750000000000);
    quest26.completionCheck = function () {return purpleForgedGem.numOwned > 0;};
    quest26.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest26);

    var quest27 = new Quest();
    quest27.id = 26;
    quest27.isSteamAchievement = true;
    quest27.steamAchievementId = "QUEST_27";
    quest27.name = _("GEM AFICIONADO");
    quest27.description = _("Craft a yellow gem");
    quest27.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest27.moneyReward = new BigNumber(2000000000000);
    quest27.completionCheck = function () {return yellowForgedGem.numOwned > 0;};
    quest27.isVisible = function () {return questManager.isQuestComplete(25);};
    questManager.registerQuest(quest27);

    var quest28 = new Quest();
    quest28.id = 27;
    quest28.isSteamAchievement = true;
    quest28.steamAchievementId = "QUEST_28";
    quest28.name = _("DAMAGE OVERLOAD");
    quest28.description = _("Have 10 or more equips");
    quest28.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest28.rewardAmount = 15;
    quest28.moneyReward = new BigNumber(2000000000000);
    quest28.completionCheck = function ()
    {
        if(battleEquipsManager)
        {
            return battleEquipsManager.activeEquips.length >= 10;
        }
        return false;
    };
    quest28.completionPercentFunction = function ()
    {
        if(battleEquipsManager)
        {
            return battleEquipsManager.activeEquips.length / 10;
        }
        return 0;
    };
    quest28.isVisible = function () {return questManager.isQuestComplete(18);};
    questManager.registerQuest(quest28);

    var quest29 = new Quest();
    quest29.id = 28;
    quest29.isSteamAchievement = true;
    quest29.steamAchievementId = "QUEST_29";
    quest29.name = _("HIGH ROLLER");
    quest29.description = _("Sacrifice a total of 50 billion minerals to the core");
    quest29.rewardType = REWARD_TYPE_TICKETS;
    quest29.rewardAmount = 2;
    quest29.moneyReward = new BigNumber(2000000000000);
    quest29.completionCheck = function () {return mineralsSacrificed >= 50000000000;};
    quest29.completionPercentFunction = function () {return mineralsSacrificed / 50000000000;};
    quest29.isVisible = function () {return questManager.isQuestComplete(15) && depth >= 500;};
    questManager.registerQuest(quest29);

    var quest30 = new Quest();
    quest30.id = 29;
    quest30.isSteamAchievement = true;
    quest30.steamAchievementId = "QUEST_30";
    quest30.name = _("UNSTOPPABLE FOR NOW...");
    quest30.description = _("Reach level 30 on a scientist");
    quest30.rewardType = REWARD_TYPE_TICKETS;
    quest30.rewardAmount = 30;
    quest30.moneyReward = new BigNumber(5000000000000);
    quest30.completionCheck = function () {return hasLevel30Scientists() && questManager.isQuestComplete(15);};
    quest30.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest30);

    var quest31 = new Quest();
    quest31.id = 30;
    quest31.isSteamAchievement = true;
    quest31.steamAchievementId = "QUEST_31";
    quest31.name = _("REACH FOR THE STARS");
    quest31.description = _("Reach the moon.");
    quest31.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest31.moneyReward = new BigNumber(50000000000000);
    quest31.isMilestone = true;
    quest31.milestoneDepth = 1032;
    quest31.completionCheck = function () {return depth >= 1032;};
    quest31.completionPercentFunction = function () {return depth / 1032;};
    quest31.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest31);

    var quest32 = new Quest();
    quest32.id = 31;
    quest32.isSteamAchievement = true;
    quest32.steamAchievementId = "QUEST_32";
    quest32.name = _("WHACK'O'MOLE");
    quest32.description = _("Kill a Whacko. He probably deserved it anyways...");
    quest32.rewardType = REWARD_TYPE_TICKETS;
    quest32.rewardAmount = 5;
    quest32.moneyReward = new BigNumber(500000000000000);
    quest32.completionCheck = function () {return whackosKilled > 0;};
    quest32.isVisible = function () {return questManager.isQuestComplete(30);};
    questManager.registerQuest(quest32);

    var quest33 = new Quest();
    quest33.id = 32;
    quest33.isSteamAchievement = true;
    quest33.steamAchievementId = "QUEST_33";
    quest33.name = _("POWERED ON");
    quest33.description = _("Power up the reactor for the first time.");
    quest33.rewardType = REWARD_TYPE_TICKETS;
    quest33.rewardAmount = 5;
    quest33.moneyReward = new BigNumber(500000000000000);
    quest33.isMilestone = true;
    quest33.milestoneDepth = 1133;
    quest33.completionCheck = function () {return reactor.totalRuntimeSecs > 0;};
    quest33.isVisible = function () {return questManager.isQuestComplete(30);};
    questManager.registerQuest(quest33);

    var quest34 = new Quest();
    quest34.id = 33;
    quest34.isSteamAchievement = true;
    quest34.steamAchievementId = "QUEST_34";
    quest34.name = _("WE NEED MORE POWER!");
    quest34.description = _("Reach level 5 on the reactor.");
    quest34.rewardType = REWARD_TYPE_TICKETS;
    quest34.rewardAmount = 5;
    quest34.moneyReward = new BigNumber(250000000000000000);
    quest34.completionCheck = function () {return reactorStructure.level >= 5;};
    quest34.completionPercentFunction = function () {return reactorStructure.level / 5;};
    quest34.isVisible = function () {return questManager.isQuestComplete(32);};
    questManager.registerQuest(quest34);

    var quest35 = new Quest();
    quest35.id = 34;
    quest35.isSteamAchievement = true;
    quest35.steamAchievementId = "QUEST_35";
    quest35.name = _("BEEFCAKE");
    quest35.description = _("Cast a buff from the buff lab.");
    quest35.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest35.moneyReward = new BigNumber(12500000000000000);
    quest35.completionCheck = function () {return bufflab.totalBuffsCasted > 0;};
    quest35.isVisible = function () {return questManager.isQuestComplete(32);};
    questManager.registerQuest(quest35);

    var quest36 = new Quest();
    quest36.id = 35;
    quest36.isSteamAchievement = true;
    quest36.steamAchievementId = "QUEST_36";
    quest36.name = _("BUFFINGTON VON BUFFERSON");
    quest36.description = _("Stay buffed for over 24 hours (bufflab buffs only).");
    quest36.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest36.rewardAmount = 10;
    quest36.moneyReward = new BigNumber(25000000000000000);
    quest36.completionCheck = function () {return ((bufflab.totalSecsBuffed / 60.0) / 60.0) > 24.0;};
    quest36.completionPercentFunction = function () {return bufflab.totalSecsBuffed / (60 * 60 * 24);};
    quest36.isVisible = function () {return questManager.isQuestComplete(34);};
    questManager.registerQuest(quest36);

    //############################# END OF OLD QUESTS #############################

    var quest88 = new Quest();
    quest88.id = 36;
    quest88.isSteamAchievement = true;
    quest88.steamAchievementId = "QUEST_37";
    quest88.name = _("FASTER DRILL");
    quest88.description = _("Upgrade your drill - You're on your way kid!");
    quest88.rewardType = REWARD_TYPE_TICKETS;
    quest88.rewardAmount = 1;
    quest88.isVisible = function () {return true;};
    questManager.registerQuest(quest88);

    var quest37 = new Quest();
    quest37.id = 37;
    quest37.isSteamAchievement = true;
    quest37.steamAchievementId = "QUEST_38";
    quest37.name = _("UNCUT GEMS");
    quest37.description = _("Find Diamond.");
    quest37.rewardType = REWARD_TYPE_TICKETS;
    quest37.rewardAmount = 1;
    quest37.completionCheck = function () {return numDiamondOwned() > 0;};
    quest37.isVisible = function () {return true;};
    questManager.registerQuest(quest37);

    var quest38 = new Quest();
    quest38.id = 38;
    quest38.isSteamAchievement = true;
    quest38.steamAchievementId = "QUEST_39";
    quest38.name = _("BACK ALLEY TRADES AREN'T SO BAD");
    quest38.description = _("Make your first trade.");
    quest38.rewardType = REWARD_TYPE_TICKETS;
    quest38.rewardAmount = 2;
    quest38.completionCheck = function () {return totalCompletedTrades > 0;};
    quest38.isVisible = function () {return questManager.isQuestComplete(106);};
    questManager.registerQuest(quest38);

    var quest57 = new Quest();
    quest57.id = 39;
    quest57.isSteamAchievement = true;
    quest57.steamAchievementId = "QUEST_40";
    quest57.name = _("AMATEUR FLIPPER");
    quest57.description = _("Complete 5 trades");
    quest57.rewardType = REWARD_TYPE_TICKETS;
    quest57.rewardAmount = 4;
    quest57.completionCheck = function () {return totalCompletedTrades >= 5;};
    quest57.isVisible = function () {return questManager.isQuestComplete(38);};
    questManager.registerQuest(quest57);

    var quest58 = new Quest();
    quest58.id = 40;
    quest58.isSteamAchievement = true;
    quest58.steamAchievementId = "QUEST_41";
    quest58.name = _("SIDE HUSTLER");
    quest58.description = _("Complete 50 trades");
    quest58.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest58.completionCheck = function () {return totalCompletedTrades >= 50;};
    quest58.isVisible = function () {return questManager.isQuestComplete(38);};
    questManager.registerQuest(quest58);

    var quest59 = new Quest();
    quest59.id = 41;
    quest59.isSteamAchievement = true;
    quest59.steamAchievementId = "QUEST_42";
    quest59.name = _("DAY TRADER");
    quest59.description = _("Complete 250 trades");
    quest59.rewardType = REWARD_TYPE_TICKETS;
    quest59.rewardAmount = 25;
    quest59.completionCheck = function () {return totalCompletedTrades >= 250;};
    quest59.isVisible = function () {return questManager.isQuestComplete(38);};
    questManager.registerQuest(quest59);

    var quest77 = new Quest();
    quest77.id = 42;
    quest77.isSteamAchievement = true;
    quest77.steamAchievementId = "QUEST_43";
    quest77.name = _("EDUCATED WORKFORCE");
    quest77.description = _("Upgrade earth workers to level 5");
    quest77.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest77.rewardAmount = 5;
    quest77.completionCheck = function () {return getEarth().workerLevel >= 5;};
    quest77.completionPercentFunction = function () {return getEarth().workerLevel / 5;}
    quest77.isVisible = function () {return getEarth().workersHired >= 10;};
    questManager.registerQuest(quest77);

    var quest40 = new Quest();
    quest40.id = 43;
    quest40.isSteamAchievement = true;
    quest40.steamAchievementId = "QUEST_44";
    quest40.name = _("SECOND SET OF EYES");
    quest40.description = _("Unlock the metal detector.");
    quest40.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest40.completionCheck = function () {return metalDetectorStructure.level > 0;};
    quest40.isVisible = function () {return true;};
    questManager.registerQuest(quest40);

    var quest39 = new Quest();
    quest39.id = 44;
    quest39.isSteamAchievement = true;
    quest39.steamAchievementId = "QUEST_45";
    quest39.name = _("DELEGATION");
    quest39.description = _("Unlock the manager.");
    quest39.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest39.completionCheck = function () {return managerStructure.level > 0;};
    quest39.isVisible = function () {return true;};
    questManager.registerQuest(quest39);

    var quest64 = new Quest();
    quest64.id = 45;
    quest64.isSteamAchievement = true;
    quest64.steamAchievementId = "QUEST_46";
    quest64.name = _("RETURN OF THE KING");
    quest64.description = _("Return to the game after leaving");
    quest64.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest64.completionCheck = function () {return numGameLaunches > 1;};
    quest64.isVisible = function () {return false;};
    questManager.registerQuest(quest64);

    var quest42 = new Quest();
    quest42.id = 46;
    quest42.isSteamAchievement = true;
    quest42.steamAchievementId = "QUEST_47";
    quest42.name = _("TREASURE HUNTER");
    quest42.description = _("Find a relic.");
    quest42.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest42.completionCheck = function () {return numRelicsEquipped() > 0;};
    quest42.isVisible = function () {return hasUnlockedScientists > 0;};
    questManager.registerQuest(quest42);

    var quest43 = new Quest();
    quest43.id = 47;
    quest43.isSteamAchievement = true;
    quest43.steamAchievementId = "QUEST_48";
    quest43.name = _("FEARLESS OR STUPID");
    quest43.description = _("Complete a nightmare difficulty excavation");
    quest43.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest43.completionCheck = function ()
    {
        for(var i = 0; i < currentScientists.scientists.length; i++)
        {
            if(currentScientists.excavations[i].length >= 8)
            {
                if(isExcavationDone(i) && !isScientistDead(i) && currentScientists.excavations[i][5] >= 3 && !wasScientistRevived(i))
                {
                    return true;
                }
            }
        };
        return false;
    };
    quest43.isVisible = function () {return hasUnlockedScientists > 0;};
    questManager.registerQuest(quest43);

    var quest41 = new Quest();
    quest41.id = 48;
    quest41.isSteamAchievement = true;
    quest41.steamAchievementId = "QUEST_49";
    quest41.name = _("SPELUNKER");
    quest41.description = _("Fully complete a cave.");
    quest41.completionCheck = function () {return numCavesCompleted > 0;};
    quest41.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest41.rewardAmount = 2;
    quest41.isVisible = function () {return questManager.isQuestComplete(107);};
    questManager.registerQuest(quest41);

    var quest52 = new Quest();
    quest52.id = 49;
    quest52.isSteamAchievement = true;
    quest52.steamAchievementId = "QUEST_50";
    quest52.name = _("EFFICIENCY IS KEY");
    quest52.description = _("Get a cave drone to level 3");
    quest52.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest52.completionCheck = function ()
    {
        for(var i = 0; i < drones.length; i++)
        {
            if(drones[i].level >= 3)
            {
                return true;
            }
        }
        return false;
    };
    quest52.isVisible = function () {return questManager.isQuestComplete(107);};
    questManager.registerQuest(quest52);

    var quest69 = new Quest();
    quest69.id = 50;
    quest69.isSteamAchievement = true;
    quest69.steamAchievementId = "QUEST_51";
    quest69.name = _("FULL TIME CAVE DWELLER");
    quest69.description = _("Fully complete 10 caves");
    quest69.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest69.completionCheck = function () {return numCavesCompleted >= 10;};
    quest69.completionPercentFunction = function () {return numCavesCompleted / 10;};
    quest69.isVisible = function () {return questManager.isQuestComplete(48);};
    questManager.registerQuest(quest69);

    var quest68 = new Quest();
    quest68.id = 51;
    quest68.isSteamAchievement = true;
    quest68.steamAchievementId = "QUEST_52";
    quest68.name = _("THAT'S IT?");
    quest68.description = _("Fully complete a cave of 15 depth");
    quest68.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest68.rewardAmount = 10;
    quest68.isVisible = function () {return questManager.isQuestComplete(107);};
    questManager.registerQuest(quest68);

    var quest82 = new Quest();
    quest82.id = 52;
    quest82.isSteamAchievement = true;
    quest82.steamAchievementId = "QUEST_53";
    quest82.name = _("ROBOT WITH A LOT OF HEART");
    quest82.description = _("Drone survive trip with less than 5% of health left and full cargo");
    quest82.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest82.isVisible = function () {return questManager.isQuestComplete(107);};
    questManager.registerQuest(quest82);

    var quest60 = new Quest();
    quest60.id = 53;
    quest60.isSteamAchievement = true;
    quest60.steamAchievementId = "QUEST_54";
    quest60.name = _("MUSK");
    quest60.description = _("Have 1 trillion dollars at one time");
    quest60.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest60.completionCheck = function () {return money.greaterThanOrEqualTo(1000000000000);};
    quest60.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(money, 1000000000000);}
    quest60.isVisible = function () {return questManager.isQuestComplete(10);};
    questManager.registerQuest(quest60);

    var quest67 = new Quest();
    quest67.id = 54;
    quest67.isSteamAchievement = true;
    quest67.steamAchievementId = "QUEST_55";
    quest67.name = _("A LOT OF ZEROS");
    quest67.description = _("Earn 1 Quadrillion dollars in one session");
    quest67.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest67.completionCheck = function () {return totalMoneyEarnedSession.greaterThanOrEqualTo(1000000000000000);};
    quest67.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(totalMoneyEarnedSession, 1000000000000000);};
    quest67.isVisible = function () {return totalMoneyEarnedSession.greaterThanOrEqualTo(1000000000000);};
    questManager.registerQuest(quest67);

    var quest87 = new Quest();
    quest87.id = 55;
    quest87.isSteamAchievement = true;
    quest87.steamAchievementId = "QUEST_56";
    quest87.name = _("WORTHY COLLECTION");
    quest87.description = _("Sell $100 Quadrillion of minerals at once using sell all");
    quest87.rewardType = REWARD_TYPE_TICKETS;
    quest87.rewardAmount = 5;
    quest87.isVisible = function () {return depth >= 303;};
    questManager.registerQuest(quest87);

    var quest61 = new Quest();
    quest61.id = 56;
    quest61.isSteamAchievement = true;
    quest61.steamAchievementId = "QUEST_57";
    quest61.name = _("THIS IS GETTING RIDICULOUS");
    quest61.description = _("Have 1 quintillion dollars at one time");
    quest61.rewardType = REWARD_TYPE_TICKETS;
    quest61.rewardAmount = 10;
    quest61.completionCheck = function () {return money.greaterThanOrEqualTo(1000000000000000000);};
    quest61.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(money, 1000000000000000000);}
    quest61.isVisible = function () {return questManager.isQuestComplete(59);};
    questManager.registerQuest(quest61);

    var quest75 = new Quest();
    quest75.id = 57;
    quest75.isSteamAchievement = true;
    quest75.steamAchievementId = "QUEST_58";
    quest75.name = _("RARE FIND");
    quest75.description = _("Find a Uranium-3");
    quest75.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest75.completionCheck = function () {return worldResources[URANIUM3_INDEX].numOwned >= 1;};
    quest75.isVisible = function () {return true;};
    questManager.registerQuest(quest75);

    var quest76 = new Quest();
    quest76.id = 58;
    quest76.isSteamAchievement = true;
    quest76.steamAchievementId = "QUEST_59";
    quest76.name = _("DON'T GET THIS IN YOUR LUNGS");
    quest76.description = _("Find a Polonium-3");
    quest76.rewardType = REWARD_TYPE_ETHEREAL_CHEST;
    quest76.completionCheck = function () {return worldResources[POLONIUM3_INDEX].numOwned >= 1;};
    quest76.isVisible = function () {return true;};
    questManager.registerQuest(quest76);

    var quest56 = new Quest();
    quest56.id = 59;
    quest56.isSteamAchievement = true;
    quest56.steamAchievementId = "QUEST_60";
    quest56.name = _("BIG BRAINING");
    quest56.description = _("Get an Einsteinium-3");
    quest56.rewardType = REWARD_TYPE_TICKETS;
    quest56.rewardAmount = 20;
    quest56.completionCheck = function () {return worldResources[EINSTEINIUM3_INDEX].numOwned > 0;};
    quest56.isVisible = function () {return depth >= getMoon().startDepth;};
    questManager.registerQuest(quest56);

    var quest89 = new Quest();
    quest89.id = 60;
    quest89.isSteamAchievement = true;
    quest89.steamAchievementId = "QUEST_61";
    quest89.name = _("UNNATURAL DISCOVERY");
    quest89.description = _("Mine a Californium");
    quest89.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest89.completionCheck = function () {return numCaliforniumOwned() >= 1;};
    quest89.isVisible = function () {return questManager.isQuestComplete(15);};
    questManager.registerQuest(quest89);

    var quest83 = new Quest();
    quest83.id = 61;
    quest83.isSteamAchievement = true;
    quest83.steamAchievementId = "QUEST_62";
    quest83.name = _("LOTS OF BROKEN SHOVELS");
    quest83.description = _("Find Titanium");
    quest83.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest83.completionCheck = function () {return worldResources[TITANIUM_INDEX].numOwned >= 1;};
    quest83.isVisible = function () {return depth >= getMoon().startDepth;};
    questManager.registerQuest(quest83);

    var quest74 = new Quest();
    quest74.id = 62;
    quest74.isSteamAchievement = true;
    quest74.steamAchievementId = "QUEST_63";
    quest74.name = _("STOLEN FIRE");
    quest74.description = _("Mine a Promethium");
    quest74.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest74.completionCheck = function () {return worldResources[PROMETHIUM_INDEX].numOwned >= 1;};
    quest74.isVisible = function () {return questManager.isQuestComplete(61);};
    questManager.registerQuest(quest74);

    var quest90 = new Quest();
    quest90.id = 63;
    quest90.isSteamAchievement = true;
    quest90.steamAchievementId = "QUEST_64";
    quest90.name = _("OFF TO LASER TOWN");
    quest90.description = _("Mine an Ytterbium");
    quest90.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest90.completionCheck = function () {return worldResources[YTTERBIUM_INDEX].numOwned >= 1;};
    quest90.isVisible = function () {return questManager.isQuestComplete(62);};
    questManager.registerQuest(quest90);

    var quest46 = new Quest();
    quest46.id = 64;
    quest46.isSteamAchievement = true;
    quest46.steamAchievementId = "QUEST_65";
    quest46.name = _("ROBOTS NEED FRIENDS TOO");
    quest46.description = _("Talk to the broken robot.");
    quest46.rewardType = REWARD_TYPE_ETHEREAL_CHEST;
    quest46.isMilestone = true;
    quest46.milestoneDepth = 250;
    quest46.completionCheck = function () {return hasFoundGidget == 1;};
    quest46.isVisible = function () {return true;};
    questManager.registerQuest(quest46);

    var quest53 = new Quest();
    quest53.id = 65;
    quest53.isSteamAchievement = true;
    quest53.steamAchievementId = "QUEST_66";
    quest53.name = _("5200" + String.fromCharCode(176) + "C");
    quest53.description = _("Reach the core");
    quest53.rewardType = REWARD_TYPE_TICKETS;
    quest53.rewardAmount = 5;
    quest53.isMilestone = true;
    quest53.milestoneDepth = 501;
    quest53.completionCheck = function () {return depth >= 501;};
    quest53.completionPercentFunction = function () {return depth / 501;};
    quest53.isVisible = function () {return depth >= 303;}; //Need to consider when this quest shows up as visible
    questManager.registerQuest(quest53);

    var quest54 = new Quest();
    quest54.id = 66;
    quest54.isSteamAchievement = true;
    quest54.steamAchievementId = "QUEST_67";
    quest54.name = _("THREE QUARTERS OF THE WAY");
    quest54.description = _("Reach 750km");
    quest54.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest54.rewardAmount = 5;
    quest54.completionCheck = function () {return depth >= 750;};
    quest54.completionPercentFunction = function () {return depth / 750;};
    quest54.isVisible = function () {return depth >= 501;}; //Need to consider when this quest shows up as visible
    questManager.registerQuest(quest54);

    var quest55 = new Quest();
    quest55.id = 67;
    quest55.isSteamAchievement = true;
    quest55.steamAchievementId = "QUEST_68";
    quest55.name = _("TITANIC ACHIEVEMENT");
    quest55.description = _("Reach Titan");
    quest55.rewardType = REWARD_TYPE_TICKETS;
    quest55.rewardAmount = 20;
    quest55.isMilestone = true;
    quest55.milestoneDepth = 1814;
    quest55.completionCheck = function () {return depth >= getTitan().startDepth;};
    quest55.completionPercentFunction = function () {return depth / getTitan().startDepth;};
    quest55.isVisible = function () {return depth >= 1032;};
    questManager.registerQuest(quest55);

    var quest44 = new Quest();
    quest44.id = 68;
    quest44.isSteamAchievement = true;
    quest44.steamAchievementId = "QUEST_69";
    quest44.name = _("HALF A FORTNIGHT");
    quest44.description = _("Play for 7 days.");
    quest44.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest44.completionCheck = function () {return playtime > (86400 * 7);};
    quest44.completionPercentFunction = function () {return playtime / (86400 * 7);};
    quest44.isVisible = function () {return questManager.isQuestComplete(8);};
    questManager.registerQuest(quest44);

    var quest85 = new Quest();
    quest85.id = 69;
    quest85.isSteamAchievement = true;
    quest85.steamAchievementId = "QUEST_70";
    quest85.name = _("TIME MACHINE");
    quest85.description = _("Timelapse for 3 days in one session");
    quest85.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest85.rewardAmount = 3;
    quest85.completionCheck = function () {return questManager.isQuestComplete(8) && timelapseMinutesInSession > (60 * 24 * 3);};
    quest85.completionPercentFunction = function () {return timelapseMinutesInSession / (60 * 24 * 3);};
    quest85.isVisible = function () {return true;};
    questManager.registerQuest(quest85);

    var quest47 = new Quest();
    quest47.id = 70;
    quest47.isSteamAchievement = true;
    quest47.steamAchievementId = "QUEST_71";
    quest47.name = _("HAPPY SCROLL WHEEL");
    quest47.description = _("Upgrade your chest collector to level 3.");
    quest47.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest47.completionCheck = function () {return chestCollectorStorageStructure.level >= 3;};
    quest47.completionPercentFunction = function () {return chestCollectorStorageStructure.level / 3;};
    quest47.isVisible = function () {return chestCollectorStorageStructure.level > 0;};
    questManager.registerQuest(quest47);

    var quest48 = new Quest();
    quest48.id = 71;
    quest48.isSteamAchievement = true;
    quest48.steamAchievementId = "QUEST_72";
    quest48.name = _("TRIPLE JUDGEMENT");
    quest48.description = _("Upgrade manager to level 3.");
    quest48.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest48.completionCheck = function () {return managerStructure.level >= 3;};
    quest48.completionPercentFunction = function () {return managerStructure.level / 3;};
    quest48.isVisible = function () {return questManager.isQuestComplete(38);};
    questManager.registerQuest(quest48);

    var quest49 = new Quest();
    quest49.id = 72;
    quest49.isSteamAchievement = true;
    quest49.steamAchievementId = "QUEST_73";
    quest49.name = _("CRUSHED GIFTS = BETTER GIFTS");
    quest49.description = _("Use the chest compressor");
    quest49.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest49.isVisible = function () {return chestCollectorStorageStructure.level > 0;};
    questManager.registerQuest(quest49);

    var quest50 = new Quest();
    quest50.id = 73;
    quest50.isSteamAchievement = true;
    quest50.steamAchievementId = "QUEST_74";
    quest50.name = _("CONGRATS! YOU FAILED AT FAILING.");
    quest50.description = _("Successfully complete an excavation with a 90% or higher chance of failure.");
    quest50.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest50.completionCheck = function ()
    {
        for(var i = 0; i < currentScientists.scientists.length; i++)
        {
            if(currentScientists.excavations[i].length >= 9)
            {
                if(isExcavationDone(i) && !isScientistDead(i) && currentScientists.excavations[i][8] >= 90 && !wasScientistRevived(i))
                {
                    return true;
                }
            }
        };
        return false;
    };
    quest50.isVisible = function () {return hasUnlockedScientists > 0;};
    questManager.registerQuest(quest50);

    var quest62 = new Quest();
    quest62.id = 74;
    quest62.isSteamAchievement = true;
    quest62.steamAchievementId = "QUEST_75";
    quest62.name = _("OR WAS IT A CHICKEN?");
    quest62.description = isMobile() ? _("Tap an orange fish") : _("Click an orange fish");
    quest62.rewardType = REWARD_TYPE_TICKETS;
    quest62.rewardAmount = 3;
    quest62.completionCheck = function () {return orangeFishCollected > 0;};
    quest62.isVisible = function () {return true;};
    questManager.registerQuest(quest62);

    var quest66 = new Quest();
    quest66.id = 75;
    quest66.isSteamAchievement = true;
    quest66.steamAchievementId = "QUEST_76";
    quest66.name = _("RESPECT THE WOOD");
    quest66.description = _("Open 1,000 basic chests");
    quest66.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest66.completionCheck = function () {return chestService.totalBasicChestsOpened >= 1000;};
    quest66.completionPercentFunction = function () {return chestService.totalBasicChestsOpened / 1000;}
    quest66.isVisible = function () {return chestService.totalBasicChestsOpened > 100;};
    questManager.registerQuest(quest66);

    var quest70 = new Quest();
    quest70.id = 76;
    quest70.isSteamAchievement = true;
    quest70.steamAchievementId = "QUEST_77";
    quest70.name = _("GOLDEN BOY");
    quest70.description = _("Collect 100 gold chests");
    quest70.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest70.completionCheck = function () {return chestService.totalGoldChestsOpened >= 100;};
    quest70.completionPercentFunction = function () {return chestService.totalGoldChestsOpened / 100;}
    quest70.isVisible = function () {return chestService.totalGoldChestsOpened > 10;};
    questManager.registerQuest(quest70);

    var quest71 = new Quest();
    quest71.id = 77;
    quest71.isSteamAchievement = true;
    quest71.steamAchievementId = "QUEST_78";
    quest71.name = _("JOURNEY THROUGH TIME");
    quest71.description = _("Total time time lapsed of 1 week");
    quest71.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest71.rewardAmount = 3;
    quest71.completionCheck = function () {return totalTimeLapsedMinutes >= (60 * 24 * 7);};
    quest71.completionPercentFunction = function () {return totalTimeLapsedMinutes / (60 * 24 * 7);}
    quest71.isVisible = function () {return totalTimeLapsedMinutes >= (60 * 24 * 1);};
    questManager.registerQuest(quest71);

    var quest72 = new Quest();
    quest72.id = 78;
    quest72.isSteamAchievement = true;
    quest72.steamAchievementId = "QUEST_79";
    quest72.name = _("FAR INTO THE FUTURE");
    quest72.description = _("Total time time lapsed of 1 year without a DeLorean");
    quest72.rewardType = REWARD_TYPE_TICKETS;
    quest72.rewardAmount = 10;
    quest72.completionCheck = function () {return totalTimeLapsedMinutes >= (60 * 24 * 365);};
    quest72.completionPercentFunction = function () {return totalTimeLapsedMinutes / (60 * 24 * 365);}
    quest72.isVisible = function () {return totalTimeLapsedMinutes >= (60 * 24 * 7);};
    questManager.registerQuest(quest72);

    var quest81 = new Quest();
    quest81.id = 79;
    quest81.isSteamAchievement = true;
    quest81.steamAchievementId = "QUEST_80";
    quest81.name = _("FIRST BLOOD");
    quest81.description = _("Kill a monster");
    quest81.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest81.rewardAmount = 1;
    quest81.completionCheck = function () {return monsterskilled > 0;};
    quest81.isVisible = function () {return depth >= 303;};
    questManager.registerQuest(quest81);

    var quest91 = new Quest();
    quest91.id = 80;
    quest91.isSteamAchievement = true;
    quest91.steamAchievementId = "QUEST_81";
    quest91.name = _("OVER KILL");
    quest91.description = _("Get a battle equip to its max level");
    quest91.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest91.completionCheck = function ()
    {
        return battleEquipsManager.activeEquips.some(function (equip)
        {
            return equip.level >= equip.maxLevel;
        });
    };
    quest91.isVisible = function () {return questManager.isQuestComplete(88);};
    questManager.registerQuest(quest91);

    var quest78 = new Quest();
    quest78.id = 81;
    quest78.isSteamAchievement = true;
    quest78.steamAchievementId = "QUEST_82";
    quest78.name = _("PUMPED UP");
    quest78.description = _("Get oil pump to level 14");
    quest78.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest78.completionCheck = function () {return oilrigStructure.level >= 14;};
    quest78.completionPercentFunction = function () {return oilrigStructure.level / 14;}
    quest78.isVisible = function () {return depth >= 303;};
    questManager.registerQuest(quest78);

    var quest86 = new Quest();
    quest86.id = 82;
    quest86.isSteamAchievement = true;
    quest86.steamAchievementId = "QUEST_83";
    quest86.name = _("BOBBY BUILDER");
    quest86.description = _("Have 1,000 building materials at once");
    quest86.rewardType = REWARD_TYPE_BUILDING_MATERIALS;
    quest86.rewardAmount = 1;
    quest86.completionCheck = function () {return numBuildingMaterialsOwned() >= 1000;};
    quest86.completionPercentFunction = function () {return numBuildingMaterialsOwned() / 1000;};
    quest86.isVisible = function () {return true;};
    questManager.registerQuest(quest86);

    var quest84 = new Quest();
    quest84.id = 83;
    quest84.isSteamAchievement = true;
    quest84.steamAchievementId = "QUEST_84";
    quest84.name = _("ASHKULLY IT'S TERRAWATTS");
    quest84.description = _("10 Trillion Watts");
    quest84.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest84.completionCheck = function () {return drillWattage().greaterThanOrEqualTo(10000000000000);};
    quest84.completionPercentFunction = function () {return divideBigNumberToDecimalNumber(drillWattage(), 10000000000000);};
    quest84.isVisible = function () {return questManager.isQuestComplete(12);};
    questManager.registerQuest(quest84);

    var quest79 = new Quest();
    quest79.id = 84;
    quest79.isSteamAchievement = true;
    quest79.steamAchievementId = "QUEST_85";
    quest79.name = _("QUICK CHARGING");
    quest79.description = _("Generate 300 energy per second with the reactor");
    quest79.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest79.completionCheck = function () {return reactor.grid.cachedEnergyPerSecond >= 300 && reactor.isAbleToRun();};
    quest79.completionPercentFunction = function () {return reactor.grid.cachedEnergyPerSecond / 300;}
    quest79.isVisible = function () {return questManager.isQuestComplete(32);};
    questManager.registerQuest(quest79);

    var quest80 = new Quest();
    quest80.id = 85;
    quest80.isSteamAchievement = true;
    quest80.steamAchievementId = "QUEST_86";
    quest80.name = _("ENERGIZED");
    quest80.description = _("Have 5 million energy at one time in the reactor");
    quest80.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest80.completionCheck = function () {return reactor.currentBatteryCharge() >= 5000000;};
    quest80.completionPercentFunction = function () {return reactor.currentBatteryCharge() / 5000000;}
    quest80.isVisible = function () {return questManager.isQuestComplete(32);};
    questManager.registerQuest(quest80);

    var quest63 = new Quest();
    quest63.id = 86;
    quest63.isSteamAchievement = true;
    quest63.steamAchievementId = "QUEST_87";
    quest63.name = _("LOTS OF BATTERIES");
    quest63.description = _("Have 10 million energy at one time in the reactor");
    quest63.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest63.completionCheck = function () {return numStoredNuclearEnergyOwned() > 10000000;};
    quest63.completionPercentFunction = function () {return numStoredNuclearEnergyOwned() / 10000000;}
    quest63.isVisible = function () {return questManager.isQuestComplete(32);};
    questManager.registerQuest(quest63);

    var quest65 = new Quest();
    quest65.id = 87;
    quest65.isSteamAchievement = true;
    quest65.steamAchievementId = "QUEST_88";
    quest65.name = _("FULLY STAFFED");
    quest65.description = _("Get 10 workers on the moon");
    quest65.rewardType = REWARD_TYPE_TICKETS;
    quest65.rewardAmount = 5;
    quest65.completionCheck = function () {return getMoon().workersHired >= 10;};
    quest65.completionPercentFunction = function () {return getMoon().workersHired / 10;}
    quest65.isVisible = function () {return depth > getMoon().startDepth;};
    questManager.registerQuest(quest65);

    var quest73 = new Quest();
    quest73.id = 88;
    quest73.isSteamAchievement = true;
    quest73.steamAchievementId = "QUEST_89";
    quest73.name = _("THEY HAD A FAMILY..");
    quest73.description = _("Bury 10 scientists");
    quest73.rewardType = REWARD_TYPE_TICKETS;
    quest73.rewardAmount = 5;
    quest73.completionCheck = function () {return deadScientists >= 10;};
    quest73.completionPercentFunction = function () {return deadScientists / 10;}
    quest73.isVisible = function () {return deadScientists > 0;};
    questManager.registerQuest(quest73);

    var quest51 = new Quest();
    quest51.id = 89;
    quest51.isSteamAchievement = true;
    quest51.steamAchievementId = "QUEST_90";
    quest51.name = _("WAR CRIMES");
    quest51.description = _("Sacrifice a scientist to the core.");
    quest51.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest51.completionCheck = function () {return numScientistsSacrificed > 0;};
    quest51.isVisible = function () {return depth >= 501;};
    questManager.registerQuest(quest51);


    //####################### SECRET QUESTS/ACHIEVEMENTS (ON STEAM BUT HIDDEN) #######################

    var quest45 = new Quest();
    quest45.id = 90;
    quest45.isSteamAchievement = true;
    quest45.steamAchievementId = "QUEST_91";
    quest45.name = _("SOMETHING AIN'T RIGHT WITH THAT BOY");
    quest45.description = _("Talk to jeb, that boy needs some milk.");
    quest45.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest45.isVisible = function () {return false;};
    questManager.registerQuest(quest45);

    var quest92 = new Quest();
    quest92.id = 91;
    quest92.isSteamAchievement = true;
    quest92.steamAchievementId = "QUEST_92";
    quest92.name = _("WARPED");
    quest92.description = _("Sacrifice a book of secrets to the core");
    quest92.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest92.completionCheck = function () {return isCoreWarped || isCoreBlessed;};
    quest92.isVisible = function () {return false;};
    questManager.registerQuest(quest92);

    var quest93 = new Quest();
    quest93.id = 92;
    quest93.isSteamAchievement = true;
    quest93.steamAchievementId = "QUEST_93";
    quest93.name = _("HOW SPARKLY");
    quest93.description = _("Get a divine relic");
    quest93.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest93.completionCheck = function ()
    {
        for(var i = 0; i < equippedRelics.length; i++)
        {
            if(equippedRelics[i] > -1)
            {
                if(excavationRewards[equippedRelics[i]].divineId == equippedRelics[i])
                {
                    return true;
                }
            }
        }
        return false;
    };
    quest93.isVisible = function () {return false;};
    questManager.registerQuest(quest93);

    var quest94 = new Quest();
    quest94.id = 93;
    quest94.isSteamAchievement = true;
    quest94.steamAchievementId = "QUEST_94";
    quest94.name = _("ABOMINATION");
    quest94.description = _("Get a warped scientist");
    quest94.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest94.completionCheck = function ()
    {
        for(var i = 0; i < currentScientists.scientists.length; i++)
        {
            if(currentScientists.scientists[i].length > 0)
            {
                if(scientists[currentScientists.scientists[i][0]].warpedId == currentScientists.scientists[i][0])
                {
                    return true;
                }
            }
        }
        return false;
    };
    quest94.isVisible = function () {return false;};
    questManager.registerQuest(quest94);

    var quest95 = new Quest();
    quest95.id = 94;
    quest95.isSteamAchievement = true;
    quest95.steamAchievementId = "QUEST_95";
    quest95.name = _("Mr. miNNNe");
    quest95.description = _("Find the mime");
    quest95.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest95.isVisible = function () {return false;};
    questManager.registerQuest(quest95);

    var quest96 = new Quest();
    quest96.id = 95;
    quest96.isSteamAchievement = true;
    quest96.steamAchievementId = "QUEST_96";
    quest96.name = _("BEEP BOOP");
    quest96.description = _("Find a UFO");
    quest96.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest96.isVisible = function () {return false;};
    questManager.registerQuest(quest96);

    /// ########################################### SUPER MINER QUESTS
    var quest97 = new Quest();
    quest97.id = 96;
    quest97.isSteamAchievement = true;
    quest97.steamAchievementId = "QUEST_97";
    quest97.name = _("Super Mining");
    quest97.description = _("Find your first super miner");
    quest97.rewardType = REWARD_TYPE_TICKETS;
    quest97.rewardAmount = 1;
    quest97.isMilestone = true;
    quest97.milestoneDepth = 15;
    quest97.completionCheck = function () {return superMinerManager.recievedInitialSuperMiner;};
    quest97.isVisible = function () {return true;};
    questManager.registerQuest(quest97);

    var quest98 = new Quest();
    quest98.id = 97;
    quest98.isSteamAchievement = true;
    quest98.steamAchievementId = "QUEST_98";
    quest98.name = _("A Mining Legacy");
    quest98.description = _("Find a legendary super miner");
    quest98.rewardType = REWARD_TYPE_TICKETS;
    quest98.rewardAmount = 20;
    quest98.completionCheck = function () {return superMinerManager.currentSuperMiners.filter(miner => miner.rarity == superMinerRarities.legendary).length > 0;};
    quest98.isVisible = function () {return questManager.isQuestComplete(96);};
    questManager.registerQuest(quest98);

    var quest99 = new Quest();
    quest99.id = 98;
    quest99.isSteamAchievement = true;
    quest99.steamAchievementId = "QUEST_99";
    quest99.name = _("An Ethereal Collection");
    quest99.description = _("Open 100 Ethereal Chests");
    quest99.rewardType = REWARD_TYPE_TICKETS;
    quest99.rewardAmount = 30;
    quest99.completionCheck = function () {return chestService.totalBlackChestsOpened >= 100;};
    quest99.completionPercentFunction = function () {return chestService.totalBlackChestsOpened / 100;};
    quest99.isVisible = function () {return questManager.isQuestComplete(96);};
    questManager.registerQuest(quest99);

    var quest100 = new Quest();
    quest100.id = 99;
    quest100.isSteamAchievement = true;
    quest100.steamAchievementId = "QUEST_100";
    quest100.name = _("Bringing their A Game");
    quest100.description = _("Reach Max level on a Super Miner");
    quest100.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest100.completionCheck = function () {return superMinerManager.currentSuperMiners.filter(miner => miner.isMaxLevel()).length > 0;};
    quest100.isVisible = function () {return questManager.isQuestComplete(96);};
    questManager.registerQuest(quest100);

    // New Quests v146

    var quest101 = new Quest();
    quest101.id = 100;
    quest101.isSteamAchievement = true;
    quest101.steamAchievementId = "QUEST_101";
    quest101.name = _("GRADUATED WITH HONORS");
    quest101.description = _("Have 100 levels between all active scientists");
    quest101.rewardType = REWARD_TYPE_TICKETS;
    quest101.rewardAmount = 50;
    quest101.completionCheck = function () {return has100ScientistsLevels() && questManager.isQuestComplete(29);};
    quest101.completionPercentFunction = function () {return totalScientistLevels() / 100;};
    quest101.isVisible = function () {return questManager.isQuestComplete(29);};
    questManager.registerQuest(quest101);

    var quest102 = new Quest();
    quest102.id = 101;
    quest102.isSteamAchievement = true;
    quest102.steamAchievementId = "QUEST_102";
    quest102.name = _("REDUCE, REUSE, RECYCLE");
    quest102.description = _("Spend 1000 Relic Scrap");
    quest102.rewardType = REWARD_TYPE_TICKETS;
    quest102.rewardAmount = 5;
    quest102.completionCheck = function () {return relicScrapSpent >= 1000;};
    quest102.completionPercentFunction = function () {return relicScrapSpent / 1000;};
    quest102.isVisible = function () {return hasScrappedFirstRelic && hasUnlockedScientists > 0;};
    questManager.registerQuest(quest102);

    var quest103 = new Quest();
    quest103.id = 102;
    quest103.isSteamAchievement = true;
    quest103.steamAchievementId = "QUEST_103";
    quest103.name = _("BATTLE MASTER");
    quest103.description = _("Win 300 battles");
    quest103.rewardType = REWARD_TYPE_TICKETS;
    quest103.rewardAmount = 30;
    quest103.completionCheck = function () {return monsterskilled >= 300;};
    quest103.completionPercentFunction = function () {return monsterskilled / 300;};
    quest103.isVisible = function () {return questManager.isQuestComplete(16);};
    questManager.registerQuest(quest103);

    var quest104 = new Quest();
    quest104.id = 103;
    quest104.isSteamAchievement = true;
    quest104.steamAchievementId = "QUEST_104";
    quest104.name = _("UNDER PRESSURE");
    quest104.description = _("Compress 100 chests");
    quest104.rewardType = REWARD_TYPE_BATTLE_CHEST;
    quest104.completionCheck = function () {return chestCompressor.totalChestsCompressed >= 100;};
    quest104.completionPercentFunction = function () {return chestCompressor.totalChestsCompressed / 100;};
    quest104.isVisible = function () {return questManager.isQuestComplete(72);};
    questManager.registerQuest(quest104);

    var quest105 = new Quest();
    quest105.id = 104;
    quest105.isSteamAchievement = true;
    quest105.steamAchievementId = "QUEST_105";
    quest105.name = _("MECHANICS 101");
    quest105.description = _("Craft 50 drill upgrades");
    quest105.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest105.completionCheck = function () {return drillState.getTotalDrillEquipsCrafted() >= 50;};
    quest105.completionPercentFunction = function () {return drillState.getTotalDrillEquipsCrafted() / 50;};
    quest105.isVisible = function () {return questManager.isQuestComplete(36);};
    questManager.registerQuest(quest105);

    var quest106 = new Quest();
    quest106.id = 105;
    quest106.isSteamAchievement = true;
    quest106.steamAchievementId = "QUEST_106";
    quest106.name = _("ENGINEERING DEGREE");
    quest106.description = _("Craft 100 drill upgrades");
    quest106.rewardType = REWARD_TYPE_GOLD_CHEST;
    quest106.completionCheck = function () {return drillState.getTotalDrillEquipsCrafted() >= 100;};
    quest106.completionPercentFunction = function () {return drillState.getTotalDrillEquipsCrafted() / 100;};
    quest106.isVisible = function () {return questManager.isQuestComplete(104);};
    questManager.registerQuest(quest106);

    var quest107 = new Quest();
    quest107.id = 106;
    quest107.isSteamAchievement = true;
    quest107.steamAchievementId = "QUEST_107";
    quest107.name = _("OPEN FOR BUSINESS");
    quest107.description = _("Find a trading post");
    quest107.rewardType = REWARD_TYPE_BASIC_CHEST;
    quest107.moneyReward = new BigNumber(2500);
    quest107.completionCheck = function () {return depth >= 15;};
    quest107.isVisible = function () {return true;};
    questManager.registerQuest(quest107);

    var quest108 = new Quest();
    quest108.id = 107;
    quest108.isSteamAchievement = true;
    quest108.steamAchievementId = "QUEST_108";
    quest108.name = _("HOW DEEP DOES IT GO?");
    quest108.description = _("Discover an underground cave");
    quest108.rewardType = REWARD_TYPE_BEACON;
    quest108.rewardAmount = 3;
    quest108.moneyReward = new BigNumber(5000);
    quest108.completionCheck = function () {return hasFirstCaveSpawned;};
    quest108.isVisible = function () {return depth >= 45;};
    questManager.registerQuest(quest108);

    var quest109 = new Quest();
    quest109.id = 108;
    quest109.isSteamAchievement = true;
    quest109.steamAchievementId = "QUEST_109";
    quest109.name = _("GOING NUCLEAR");
    quest109.description = _("Find the reactor");
    quest109.rewardType = REWARD_TYPE_RODS;
    quest109.rewardAmount = 4;
    quest109.completionCheck = function () {return depth >= 1134;};
    quest109.isVisible = function () {return depth >= worlds[MOON_INDEX].tradePostDepth;};
    questManager.registerQuest(quest109);

    var quest110 = new Quest();
    quest110.id = 109;
    quest110.isSteamAchievement = true;
    quest110.steamAchievementId = "QUEST_110";
    quest110.name = _("EARTH GUARDIAN");
    quest110.description = _("Defeat all Earth Bosses");
    quest110.rewardType = REWARD_TYPE_TICKETS;
    quest110.rewardAmount = 10;
    quest110.completionCheck = function () {return bossesDefeated >= 6;};
    quest110.completionPercentFunction = function () {return bossesDefeated / 6;};
    quest110.isVisible = function () {return questManager.isQuestComplete(21);};
    questManager.registerQuest(quest110);

    var quest111 = new Quest();
    quest111.id = 110;
    quest111.isSteamAchievement = true;
    quest111.steamAchievementId = "QUEST_111";
    quest111.name = _("LUNAR PROTECTOR");
    quest111.description = _("Defeat all Moon Bosses");
    quest111.rewardType = REWARD_TYPE_GOLD_CHEST_AND_TICKETS;
    quest111.rewardAmount = 20;
    quest111.completionCheck = function () {return bossesDefeated >= 13;};
    quest111.completionPercentFunction = function () {return bossesDefeated / 13;};
    quest111.isVisible = function () {return bossesDefeated >= 7;};
    questManager.registerQuest(quest111);

    var quest112 = new Quest();
    quest112.id = 111;
    quest112.isSteamAchievement = true;
    quest112.steamAchievementId = "QUEST_112";
    quest112.name = _("TITAN SLAYER");
    quest112.description = _("Defeat all Titan Bosses");
    quest112.rewardType = REWARD_TYPE_ETHEREAL_CHEST_AND_TICKETS;
    quest112.rewardAmount = 30;
    quest112.completionCheck = function () {return bossesDefeated >= 20;};
    quest112.completionPercentFunction = function () {return bossesDefeated / 20;};
    quest112.isVisible = function () {return bossesDefeated >= 13;};
    questManager.registerQuest(quest112);

    var quest113 = new Quest();
    quest113.id = 112;
    quest113.isSteamAchievement = false;
    quest113.name = _("PART OF THE FAMILY");
    quest113.rewardType = REWARD_TYPE_TICKETS;
    quest113.rewardAmount = 20;
    quest113.completionCheck = function ()
    {
        return typeof (playsaurusSdk) !== "undefined" && playsaurusSdk.isLoggedIn() && playsaurusSdk.isEmailVerifiedCached();
    };
    quest113.isVisible = function () {return true;};
    quest113.resetsWithAscension = false;
    if(typeof platform !== 'undefined' && platform.isAccountRestricted && platform.isAccountRestricted())
    {
        quest113.description = _("Sorry! Playsaurus Accounts are not supported on this platform");
        quest113.additionalOnClick = function ()
        {
            showAlertPrompt(_("Sorry! Playsaurus Accounts are not supported on this platform"));
        };
    }
    else
    {
        quest113.description = _("Login to your Playsaurus Account to earn points to redeem cool stuff and enable cloud saves");
        quest113.additionalOnClick = function ()
        {
            if(!playsaurusSdk.isLoggedIn())
            {
                showAlertPrompt(_("Log in to your Playsaurus account to access cloud save features, sync across devices and enjoy rewards"));
            }
            else if(!playsaurusSdk.isEmailVerifiedCached())
            {
                showAlertPrompt(_("Please, verify your email to gain this reward"));
            }
        };
    }
    questManager.registerQuest(quest113);

})();


if(platform.setQuestData)
{
    platform.setQuestData();
}

function numQuestsCompleted()
{
    var numCompleted = 0;
    for(var i = 0; i < questManager.quests.length; i++)
    {
        if(questManager.quests[i].isComplete)
        {
            numCompleted++;
        }
    }
    return numCompleted;
}

// ####################################################################
// ################### QUEST CHECK HELPER FUNCTIONS ###################
// ####################################################################

function hasLevel30Scientists()
{
    return highestLevelScientist >= 30;
}

function totalScientistLevels()
{
    var levels = 0;
    for(var i = 0; i < numActiveScientists(); i++)
    {
        levels += getScientistLevel(i)
    }

    return levels;
}

function has100ScientistsLevels()
{
    return totalScientistLevels() >= 100;
}

function has4Weapons()
{
    return battleEquipsManager.activeEquips.filter(e => e.id != 0).length >= 4;
}

function updateHighestLevelScientist()
{
    for(var i = 0; i < numActiveScientists(); i++)
    {
        if(getScientistLevel(i) > highestLevelScientist)
        {
            highestLevelScientist = getScientistLevel(i);
        }
    }

    return highestLevelScientist;
}

function hasLegendaryScientist()
{
    if(hasUnlockedScientists)
    {
        for(var i = 0; i < numActiveScientists(); i++)
        {
            if(currentScientists.scientists[i].length >= 3)
            {
                if(scientists[currentScientists.scientists[i][0]].rarity == scientistRarities.legendary)
                {
                    return true;
                }
            }
        }
        return false;
    }
}

var fbl = 0;
function fbc()
{
    fbl = 1;
}

//var shareCreditTimeSeconds = [302, 602, 1202]; //61 - 59(55), 121 - 50(49), 601 - 86(85), 302 - 119(228), 602 - 139(243), 1202 - 155(260)
//var selectedCreditTimeSeconds = shareCreditTimeSeconds[rand(0, shareCreditTimeSeconds.length - 1)];

function shareMouseDown(showFriends = true)
{
    if(getBuildTarget() != STEAM_BUILD) { } else
    {
        if(showFriends)
        {
            platform.steamApi.activateGameOverlay("Friends");
        }
    }
    setTimeout(function () {questManager.getQuest(1).isComplete = true;}, 1200 * 1000);
}

function generateShareText()
{
    return _("{0}", "https://mrmine.com/?utm_campaign=WebRef&utm_content=" + getId(6));
}

function copyShareText()
{
    if(document.getElementById("simpleInputFieldText"))
    {
        document.getElementById("simpleInputFieldText").select();
        document.execCommand("copy");
        document.getElementById("simpleInputFieldText").select();
        alert(_("Share message copied!"));
        hideSimpleInput();
    }
}

function reviewMouseDown()
{
    if(getBuildTarget() == MOBILE_BUILD)
    {
        if(platform.isIOs())
        {
            openExternalLinkInDefaultBrowser("https://apps.apple.com/us/app/mr-mine-idle/id1659735369");
        }
        else
        {
            openExternalLinkInDefaultBrowser("https://play.google.com/store/apps/details?id=com.playsaurus.mrmine");
        }
    }
    else
    {
        window.open("https://store.steampowered.com/app/1397920/MrMine/", '_blank');
    }
}

function checkReview()
{
    setTimeout(function () {questManager.getQuest(20).isComplete = true;}, 2000);
}