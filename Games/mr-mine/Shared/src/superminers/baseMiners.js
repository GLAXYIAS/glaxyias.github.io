function initializeBaseMiners() {
    var superSeller = new SuperSeller();
    superSeller.id = 0;
    superSeller.name = "Master Mined";
    superSeller.slug = "master_mined";
    superSeller.portrait = stonksPortrait;
    superSeller.rarity = superMinerRarities.legendary;
    superSeller.maxLevel = 10;
    superSeller.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller);

    var superSeller2 = new SuperSeller();
    superSeller2.id = 1;
    superSeller2.name = "Tyler";
    superSeller2.slug = "tyler";
    superSeller2.portrait = tiePortrait;
    superSeller2.rarity = superMinerRarities.uncommon;
    superSeller2.maxLevel = 10;
    superSeller2.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller2);

    var superSeller3 = new SuperSeller();
    superSeller3.id = 2;
    superSeller3.name = "Rocket Pockets";
    superSeller3.slug = "rocket_pockets";
    superSeller3.portrait = wallStreetPortrait;
    superSeller3.rarity = superMinerRarities.rare;
    superSeller3.maxLevel = 10;
    superSeller3.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller3);

    var superSeller4 = new SuperSeller();
    superSeller4.id = 3;
    superSeller4.name = "Taylor";
    superSeller4.slug = "taylor";
    superSeller4.portrait = taylorPortrait;
    superSeller4.rarity = superMinerRarities.uncommon;
    superSeller4.maxLevel = 10;
    superSeller4.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller4);

    var superSeller5 = new SuperSeller();
    superSeller5.id = 4;
    superSeller5.name = "Anonymous";
    superSeller5.slug = "anonymous";
    superSeller5.portrait = femaleManager;
    superSeller5.rarity = superMinerRarities.common;
    superSeller5.maxLevel = 10;
    superSeller5.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller5);

    var superSeller6 = new SuperSeller();
    superSeller6.id = 5;
    superSeller6.name = "Gustavo";
    superSeller6.slug = "gustavo";
    superSeller6.portrait = maleManager;
    superSeller6.rarity = superMinerRarities.common;
    superSeller6.maxLevel = 10;
    superSeller6.attachedMineralId = 1;
    superMinerManager.registerBaseMiner(superSeller6);

    var buffMiner = new BuffMiner();
    buffMiner.id = 6;
    buffMiner.name = "Diana";
    buffMiner.slug = "diana";
    buffMiner.portrait = miraCraftPortrait;
    buffMiner.renderContext = MAIN;
    buffMiner.renderer.walkingSpritesheet = new SpritesheetAnimation(miraCraftWalking, 8, 8);
    buffMiner.renderer.walkingSpritesheet.verticalAlign = "center";
    buffMiner.rarity = superMinerRarities.rare;
    buffMiner.maxLevel = 5;
    buffMiner.buffId = 0;
    buffMiner.mineralsBetweenBuffByLevel = [50000, 52500, 55000, 57500, 60000, 62500, 65000, 67500, 70000, 72500, 75000];
    buffMiner.buffPercentageByLevel = [500, 550, 600, 650, 700, 850, 900, 1000, 1050, 1100];
    buffMiner.renderer.heightFraction = 0.7;
    buffMiner.renderer.minMiningTime = 0;
    buffMiner.renderer.maxMiningTime = 0;
    buffMiner.renderer.yOffset = -0.15;
    superMinerManager.registerBaseMiner(buffMiner);

    var gamerMiner = new MiningSuperMiner();
    gamerMiner.id = 7;
    gamerMiner.name = "Chuck";
    gamerMiner.slug = "chuck";
    gamerMiner.portrait = radGamerPortrait;
    gamerMiner.renderContext = MAIN;
    gamerMiner.renderer.walkingSpritesheet = new SpritesheetAnimation(radGamerWalking, 8, 10);
    gamerMiner.renderer.walkingSpritesheet.verticalAlign = "center";
    gamerMiner.renderer.drillingSpritesheet = new SpritesheetAnimation(radGamerDrilling, 8, 10);
    gamerMiner.renderer.drillingSpritesheet.verticalAlign = "center";
    gamerMiner.renderer.walkSpeed *= 0.8;
    gamerMiner.rarity = superMinerRarities.rare;
    gamerMiner.maxLevel = 10;
    gamerMiner.renderer.heightFraction = 1.2;
    gamerMiner.renderer.yOffset = 0.1;
    if (isMobile()) {
        gamerMiner.renderer.anchorPadding = 0;
    }
    gamerMiner.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height = hitbox.boundingBox.height * 0.75;
        hitbox.boundingBox.width = hitbox.boundingBox.height * 1.25;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(gamerMiner);

    var cat = new MiningSuperMiner();
    cat.id = 8;
    cat.name = "Chester";
    cat.slug = "chester";
    cat.portrait = drillyCatPortrait;
    cat.renderContext = MAIN;
    cat.renderer.walkingSpritesheet = new SpritesheetAnimation(drillyCatWalking, 8, 10);
    cat.renderer.walkingSpritesheet.verticalAlign = "center";
    cat.renderer.drillingSpritesheet = new SpritesheetAnimation(drillyCatDrilling, 8, 10);
    cat.renderer.drillingSpritesheet.verticalAlign = "center";
    cat.rarity = superMinerRarities.legendary;
    cat.maxLevel = 10;
    // cat.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(cat);

    var malesuperminer1 = new MiningSuperMiner();
    malesuperminer1.id = 9;
    malesuperminer1.name = "Rubble";
    malesuperminer1.slug = "rubble";
    malesuperminer1.portrait = maleMiner1;
    malesuperminer1.renderContext = MAIN;
    malesuperminer1.renderer.walkingSpritesheet = new SpritesheetAnimation(maleMiner1Walking, 8, 10);
    malesuperminer1.renderer.walkingSpritesheet.verticalAlign = "center";
    malesuperminer1.renderer.drillingSpritesheet = new SpritesheetAnimation(maleMiner1Drilling, 6, 10);
    malesuperminer1.renderer.drillingSpritesheet.verticalAlign = "center";
    malesuperminer1.rarity = superMinerRarities.common;
    malesuperminer1.maxLevel = 10;
    // malesuperminer1.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(malesuperminer1);

    var malesuperminer2 = new MiningSuperMiner();
    malesuperminer2.id = 10;
    malesuperminer2.name = "Gembo";
    malesuperminer2.slug = "gembo";
    malesuperminer2.portrait = maleMiner2;
    malesuperminer2.renderContext = MAIN;
    malesuperminer2.renderer.walkingSpritesheet = new SpritesheetAnimation(maleMiner2Walking, 8, 10);
    malesuperminer2.renderer.walkingSpritesheet.verticalAlign = "center";
    malesuperminer2.renderer.drillingSpritesheet = new SpritesheetAnimation(maleMiner2Drilling, 6, 10);
    malesuperminer2.renderer.drillingSpritesheet.verticalAlign = "center";
    malesuperminer2.rarity = superMinerRarities.uncommon;
    malesuperminer2.maxLevel = 10;
    // malesuperminer2.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(malesuperminer2);

    var malesuperminer3 = new MiningSuperMiner();
    malesuperminer3.id = 11;
    malesuperminer3.name = "Walter";
    malesuperminer3.slug = "walter";
    malesuperminer3.portrait = maleMiner3;
    malesuperminer3.renderContext = MAIN;
    malesuperminer3.renderer.walkingSpritesheet = new SpritesheetAnimation(maleMiner3Walking, 8, 10);
    malesuperminer3.renderer.walkingSpritesheet.verticalAlign = "center";
    malesuperminer3.renderer.drillingSpritesheet = new SpritesheetAnimation(maleMiner3Drilling, 6, 10);
    malesuperminer3.renderer.drillingSpritesheet.verticalAlign = "center";
    malesuperminer3.rarity = superMinerRarities.common;
    malesuperminer3.maxLevel = 10;
    // malesuperminer3.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(malesuperminer3);

    var malesuperminer4 = new MiningSuperMiner();
    malesuperminer4.id = 12;
    malesuperminer4.name = "Sir Minesalot";
    malesuperminer4.slug = "sir_minesalot";
    malesuperminer4.portrait = maleMiner4;
    malesuperminer4.renderContext = MAIN;
    malesuperminer4.renderer.walkingSpritesheet = new SpritesheetAnimation(maleMiner4Walking, 8, 10);
    malesuperminer4.renderer.walkingSpritesheet.verticalAlign = "center";
    malesuperminer4.renderer.drillingSpritesheet = new SpritesheetAnimation(maleMiner4Drilling, 4, 10);
    malesuperminer4.renderer.drillingSpritesheet.verticalAlign = "center";
    malesuperminer4.rarity = superMinerRarities.uncommon;
    malesuperminer4.maxLevel = 10;
    // malesuperminer4.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(malesuperminer4);

    var malesuperminer5 = new MiningSuperMiner();
    malesuperminer5.id = 13;
    malesuperminer5.name = "Bruce";
    malesuperminer5.slug = "bruce";
    malesuperminer5.portrait = maleMiner5;
    malesuperminer5.renderContext = MAIN;
    malesuperminer5.renderer.walkingSpritesheet = new SpritesheetAnimation(maleMiner5Walking, 8, 10);
    malesuperminer5.renderer.walkingSpritesheet.verticalAlign = "center";
    malesuperminer5.renderer.drillingSpritesheet = new SpritesheetAnimation(maleMiner5Drilling, 6, 10);
    malesuperminer5.renderer.drillingSpritesheet.verticalAlign = "center";
    malesuperminer5.rarity = superMinerRarities.common;
    malesuperminer5.maxLevel = 10;
    // malesuperminer5.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(malesuperminer5);

    var girlsuperminer1 = new MiningSuperMiner();
    girlsuperminer1.id = 14;
    girlsuperminer1.name = "Jess";
    girlsuperminer1.slug = "jess";
    girlsuperminer1.portrait = girlMiner1;
    girlsuperminer1.renderContext = MAIN;
    girlsuperminer1.renderer.walkingSpritesheet = new SpritesheetAnimation(girlMiner1Walking, 8, 10);
    girlsuperminer1.renderer.walkingSpritesheet.verticalAlign = "center";
    girlsuperminer1.renderer.drillingSpritesheet = new SpritesheetAnimation(girlMiner1Drilling, 6, 10);
    girlsuperminer1.renderer.drillingSpritesheet.verticalAlign = "center";
    girlsuperminer1.rarity = superMinerRarities.common;
    girlsuperminer1.maxLevel = 10;
    // girlsuperminer1.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(girlsuperminer1);

    var girlsuperminer2 = new MiningSuperMiner();
    girlsuperminer2.id = 15;
    girlsuperminer2.name = "Su";
    girlsuperminer2.slug = "su";
    girlsuperminer2.portrait = girlMiner2;
    girlsuperminer2.renderContext = MAIN;
    girlsuperminer2.renderer.walkingSpritesheet = new SpritesheetAnimation(girlMiner2Walking, 8, 10);
    girlsuperminer2.renderer.walkingSpritesheet.verticalAlign = "center";
    girlsuperminer2.renderer.drillingSpritesheet = new SpritesheetAnimation(girlMiner2Drilling, 5, 10);
    girlsuperminer2.renderer.drillingSpritesheet.verticalAlign = "center";
    girlsuperminer2.rarity = superMinerRarities.uncommon;
    girlsuperminer2.maxLevel = 10;
    girlsuperminer2.renderer.heightFraction = 0.5;
    girlsuperminer2.renderer.yOffset = -0.2;
    superMinerManager.registerBaseMiner(girlsuperminer2);

    var girlsuperminer3 = new MiningSuperMiner();
    girlsuperminer3.id = 16;
    girlsuperminer3.name = "Autumn";
    girlsuperminer3.slug = "autumn";
    girlsuperminer3.portrait = girlMiner3;
    girlsuperminer3.renderContext = MAIN;
    girlsuperminer3.renderer.walkingSpritesheet = new SpritesheetAnimation(girlMiner3Walking, 8, 10);
    girlsuperminer3.renderer.walkingSpritesheet.verticalAlign = "center";
    girlsuperminer3.renderer.drillingSpritesheet = new SpritesheetAnimation(girlMiner3Drilling, 6, 10);
    girlsuperminer3.renderer.drillingSpritesheet.verticalAlign = "center";
    girlsuperminer3.rarity = superMinerRarities.common;
    girlsuperminer3.maxLevel = 10;
    // girlsuperminer3.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(girlsuperminer3);

    var girlsuperminer4 = new MiningSuperMiner();
    girlsuperminer4.id = 17;
    girlsuperminer4.name = "Sasha";
    girlsuperminer4.slug = "sasha";
    girlsuperminer4.portrait = girlMiner4;
    girlsuperminer4.renderContext = MAIN;
    girlsuperminer4.renderer.walkingSpritesheet = new SpritesheetAnimation(girlMiner5Walking, 9, 10);
    girlsuperminer4.renderer.walkingSpritesheet.verticalAlign = "center";
    girlsuperminer4.renderer.drillingSpritesheet = new SpritesheetAnimation(girlMiner5Drilling, 5, 10);
    girlsuperminer4.renderer.drillingSpritesheet.verticalAlign = "center";
    girlsuperminer4.rarity = superMinerRarities.uncommon;
    girlsuperminer4.maxLevel = 10;
    // girlsuperminer4.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(girlsuperminer4);

    var girlsuperminer5 = new MiningSuperMiner();
    girlsuperminer5.id = 18;
    girlsuperminer5.name = "Rose";
    girlsuperminer5.slug = "rose";
    girlsuperminer5.portrait = girlMiner5;
    girlsuperminer5.renderContext = MAIN;
    girlsuperminer5.renderer.walkingSpritesheet = new SpritesheetAnimation(girlMiner4Walking, 8, 10);
    girlsuperminer5.renderer.walkingSpritesheet.verticalAlign = "center";
    girlsuperminer5.renderer.drillingSpritesheet = new SpritesheetAnimation(girlMiner4Drilling, 6, 10);
    girlsuperminer5.renderer.drillingSpritesheet.verticalAlign = "center";
    girlsuperminer5.rarity = superMinerRarities.common;
    girlsuperminer5.maxLevel = 10;
    // girlsuperminer5.spriteYOffset = 0.185;
    superMinerManager.registerBaseMiner(girlsuperminer5);

    var purpaminer = new MiningSuperMiner();
    purpaminer.id = 19;
    purpaminer.name = "Friendly Purpa";
    purpaminer.slug = "friendly_purpa";
    purpaminer.portrait = purpaPortrait;
    purpaminer.renderContext = MAIN;
    purpaminer.renderer.walkingSpritesheet = new SpritesheetAnimation(purpaWalking, 4, 4);
    purpaminer.renderer.walkingSpritesheet.verticalAlign = "center";
    purpaminer.renderer.drillingSpritesheet = new SpritesheetAnimation(purpaDrilling, 4, 10);
    purpaminer.renderer.drillingSpritesheet.verticalAlign = "center";
    purpaminer.renderer.walkSpeed *= 0.3;
    purpaminer.rarity = superMinerRarities.rare;
    purpaminer.maxLevel = 10;
    superMinerManager.registerBaseMiner(purpaminer);

    var stomper = new DrillMiner();
    stomper.id = 20;
    stomper.name = "Stomper";
    stomper.slug = "stomper";
    stomper.portrait = stomperPortrait;
    stomper.renderContext = MAIN;
    stomper.renderer.drillingSpritesheet = new SpritesheetAnimation(stomperDrilling, 9, 10);
    stomper.renderer.drillingSpritesheet.verticalAlign = "center";
    stomper.rarity = superMinerRarities.legendary;
    stomper.maxLevel = 10;
    superMinerManager.registerBaseMiner(stomper);

    var aayla = new DrillMiner();
    aayla.id = 21;
    aayla.name = "Aayla";
    aayla.slug = "aayla";
    aayla.portrait = rastaGirlPortrait;
    aayla.renderContext = MAIN;
    aayla.renderer.drillingSpritesheet = new SpritesheetAnimation(rastaGirlDrilling, 6, 10);
    aayla.renderer.drillingSpritesheet.verticalAlign = "center";
    aayla.rarity = superMinerRarities.uncommon;
    aayla.maxLevel = 10;
    superMinerManager.registerBaseMiner(aayla);

    var gertrud = new DrillMiner();
    gertrud.id = 22;
    gertrud.name = "Gertrud";
    gertrud.slug = "gertrud";
    gertrud.portrait = vikingGirlPortrait;
    gertrud.renderContext = MAIN;
    gertrud.renderer.drillingSpritesheet = new SpritesheetAnimation(vikingGirlDrilling, 6, 10);
    gertrud.renderer.drillingSpritesheet.verticalAlign = "center";
    gertrud.rarity = superMinerRarities.common;
    gertrud.maxLevel = 10;
    superMinerManager.registerBaseMiner(gertrud);

    var sax = new DrillMiner();
    sax.id = 23;
    sax.name = "Sax";
    sax.slug = "sax";
    sax.portrait = kungFuPortrait;
    sax.renderContext = MAIN;
    sax.renderer.drillingSpritesheet = new SpritesheetAnimation(kungFuDrilling, 6, 10);
    sax.renderer.drillingSpritesheet.verticalAlign = "center";
    sax.rarity = superMinerRarities.rare;
    sax.maxLevel = 10;
    superMinerManager.registerBaseMiner(sax);

    var forest = new DrillMiner();
    forest.id = 24;
    forest.name = "Forest";
    forest.slug = "forest";
    forest.portrait = lumberJackPortrait;
    forest.renderContext = MAIN;
    forest.renderer.drillingSpritesheet = new SpritesheetAnimation(lumberJackDrilling, 6, 10);
    forest.renderer.drillingSpritesheet.verticalAlign = "center";
    forest.rarity = superMinerRarities.rare;
    forest.maxLevel = 10;
    superMinerManager.registerBaseMiner(forest);

    var stefi = new DrillMiner();
    stefi.id = 25;
    stefi.name = "Stefi";
    stefi.slug = "stefi";
    stefi.portrait = gymGirlPortrait;
    stefi.renderContext = MAIN;
    stefi.renderer.drillingSpritesheet = new SpritesheetAnimation(gymGirlDrilling, 6, 10);
    stefi.renderer.drillingSpritesheet.verticalAlign = "center";
    stefi.rarity = superMinerRarities.uncommon;
    stefi.maxLevel = 10;
    superMinerManager.registerBaseMiner(stefi);

    var goldEgg = new EggMiner();
    goldEgg.id = 26;
    goldEgg.portrait = goldClosed;
    goldEgg.hatchedPortrait = goldHatched;
    goldEgg.name = "Gold Egg";
    goldEgg.slug = "gold_egg";
    goldEgg.rarity = superMinerRarities.rare;
    goldEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(goldEgg);

    var etherealEgg = new EggMiner();
    etherealEgg.id = 27;
    etherealEgg.portrait = etherealClosed;
    etherealEgg.hatchedPortrait = etherealHatched;
    etherealEgg.name = "Ethereal Egg";
    etherealEgg.slug = "ethereal_egg";
    etherealEgg.rarity = superMinerRarities.legendary;
    etherealEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(etherealEgg);

    var zaouli = new MiningSuperMiner();
    zaouli.id = 28;
    zaouli.name = "Zaouli";
    zaouli.slug = "zaouli";
    zaouli.portrait = zaouliPortrait;
    zaouli.renderContext = MAIN;
    zaouli.subType = "isotope";
    zaouli.renderer.walkingSpritesheet = new SpritesheetAnimation(zaouliWalking, 9, 10);
    zaouli.renderer.walkingSpritesheet.verticalAlign = "center";
    zaouli.renderer.drillingSpritesheet = new SpritesheetAnimation(zaouliDrilling, 17, 10);
    zaouli.renderer.drillingSpritesheet.verticalAlign = "center";
    zaouli.rarity = superMinerRarities.legendary;
    zaouli.maxLevel = 10;
    zaouli.baseSpeed = 10;
    zaouli.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height *= 0.75;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(zaouli);

    var orangeFish = new ChestMiner();
    orangeFish.id = 29;
    orangeFish.name = "Orange Fish";
    orangeFish.slug = "orange_fish";
    orangeFish.portrait = orangeFishPortrait;
    orangeFish.renderContext = MAIN;
    orangeFish.renderer.walkingSpritesheet = new SpritesheetAnimation(orangeFishWorld, 12, 10);
    orangeFish.renderer.walkingSpritesheet.verticalAlign = "center";
    orangeFish.renderer.flipHorizontal = true;
    orangeFish.rarity = superMinerRarities.legendary;
    orangeFish.maxLevel = 10;
    orangeFish.positionHitbox = function (hitbox) {
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.3;
        hitbox.boundingBox.height *= 0.5;
        if (localStorage["isFullscreen"] == "true" && !this.renderer.facingRight) {
            hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.5;
        }
        return hitbox;
    }
    superMinerManager.registerBaseMiner(orangeFish);

    var oldMan = new DepositMiner();
    oldMan.id = 30;
    oldMan.name = "Gramps";
    oldMan.slug = "gramps";
    oldMan.portrait = oldManPortrait;
    oldMan.renderContext = MAIN;
    oldMan.renderer.walkingSpritesheet = new SpritesheetAnimation(oldManWalking, 8, 5);
    oldMan.renderer.walkingSpritesheet.verticalAlign = "center";
    oldMan.renderer.drillingSpritesheet = new SpritesheetAnimation(oldManDrilling, 14, 10);
    oldMan.renderer.drillingSpritesheet.verticalAlign = "center";
    oldMan.renderer.walkSpeed *= 0.2;
    oldMan.renderer.yOffset = -0.1;
    oldMan.renderer.heightFraction = .8;
    oldMan.rarity = superMinerRarities.rare;
    oldMan.maxLevel = 10;
    oldMan.positionHitbox = function (hitbox) {
        hitbox.boundingBox.y += hitbox.boundingBox.height * 0.1;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(oldMan);

    var goldBird = new BuffMiner();
    goldBird.id = 31;
    goldBird.name = "Thoth the Wise";
    goldBird.slug = "thoth_the_wise";
    goldBird.portrait = thothPortrait
    goldBird.renderContext = MAIN;
    goldBird.renderer.walkingSpritesheet = new SpritesheetAnimation(thothWalking, 7, 10);
    goldBird.renderer.walkingSpritesheet.verticalAlign = "center";
    goldBird.renderer.drillingSpritesheet = new SpritesheetAnimation(thothDrilling, 7, 10);
    goldBird.renderer.drillingSpritesheet.verticalAlign = "center";
    goldBird.rarity = superMinerRarities.legendary;
    goldBird.maxLevel = 10;
    goldBird.buffId = 9;
    goldBird.buffDuration = 300;
    goldBird.mineralsBetweenBuffByLevel = [75000, 82500, 90000, 97500, 105000, 112500, 120000, 127500, 135000, 142500, 150000];
    goldBird.buffPercentageByLevel = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150];
    goldBird.renderer.heightFraction = 0.9;
    superMinerManager.registerBaseMiner(goldBird);

    var whiiteEgg = new EggMiner();
    whiiteEgg.id = 32;
    whiiteEgg.portrait = whiteClosed;
    whiiteEgg.hatchedPortrait = whiteHatched;
    whiiteEgg.name = "White Egg";
    whiiteEgg.slug = "white_egg";
    whiiteEgg.rarity = superMinerRarities.common;
    whiiteEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(whiiteEgg);

    var silverEgg = new EggMiner();
    silverEgg.id = 33;
    silverEgg.portrait = silverClosed;
    silverEgg.hatchedPortrait = silverHatched;
    silverEgg.name = "Silver Egg";
    silverEgg.slug = "silver_egg";
    silverEgg.rarity = superMinerRarities.uncommon;
    silverEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(silverEgg);

    var bezos = new MiningSuperMiner();
    bezos.id = 34;
    bezos.name = "Jeffrey";
    bezos.slug = "jeffrey";
    bezos.portrait = jeffreyPortrait;
    bezos.renderContext = MAIN;
    bezos.renderer.walkingSpritesheet = new SpritesheetAnimation(jeffreyWalking, 7, 8);
    bezos.renderer.walkingSpritesheet.verticalAlign = "center";
    bezos.renderer.drillingSpritesheet = new SpritesheetAnimation(jeffreyDrilling, 20, 8);
    bezos.renderer.drillingSpritesheet.verticalAlign = "center";
    bezos.renderer.walkSpeed *= 0.8;
    bezos.autoSell = true;
    bezos.rarity = superMinerRarities.legendary;
    bezos.maxLevel = 10;
    bezos.renderer.heightFraction = .8;
    bezos.renderer.yOffset = -0.05;
    superMinerManager.registerBaseMiner(bezos);

    var booster = new SuperBooster();
    booster.id = 35;
    booster.name = "Booster";
    booster.slug = "booster";
    booster.portrait = bouncyBallPortrait;
    booster.renderContext = MAIN;
    booster.renderer.walkingSpritesheet = new SpritesheetAnimation(bouncyBallWalking, 8, 8);
    booster.renderer.walkingSpritesheet.verticalAlign = "center";
    booster.renderer.walkSpeed *= 1;
    booster.rarity = superMinerRarities.legendary;
    booster.maxLevel = 10;
    booster.positionHitbox = function (hitbox) {
        if (!this.renderer.facingRight) {
            hitbox.boundingBox.x += hitbox.boundingBox.width;
        }
        hitbox.boundingBox.y += hitbox.boundingBox.height * 0.2;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(booster);

    var Wizard = new RewardMiner();
    Wizard.id = 36;
    Wizard.name = "Goldalf";
    Wizard.slug = "goldalf";
    Wizard.portrait = wizardPortrait;
    Wizard.renderContext = MAIN;
    Wizard.renderer.walkingSpritesheet = new SpritesheetAnimation(wizardWalking, 8, 8);
    Wizard.renderer.walkingSpritesheet.verticalAlign = "center";
    Wizard.renderer.drillingSpritesheet = new SpritesheetAnimation(wizardDrilling, 10, 8);
    Wizard.renderer.drillingSpritesheet.verticalAlign = "center";
    Wizard.renderer.walkSpeed *= 1;
    Wizard.renderer.yOffset = -0.1;
    Wizard.rarity = superMinerRarities.legendary;
    Wizard.maxLevel = 10;
    Wizard.positionHitbox = function (hitbox) {
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.3;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(Wizard);

    var fourArms = new MiningSuperMiner();
    fourArms.id = 37;
    fourArms.name = "Gaston";
    fourArms.slug = "gaston";
    fourArms.portrait = fourArmsPortrait;
    fourArms.renderContext = MAIN;
    fourArms.renderer.walkingSpritesheet = new SpritesheetAnimation(fourArmsWalking, 6, 6);
    fourArms.renderer.walkingSpritesheet.verticalAlign = "center";
    fourArms.renderer.drillingSpritesheet = new SpritesheetAnimation(fourArmsDrilling, 4, 12);
    fourArms.renderer.drillingSpritesheet.verticalAlign = "center";
    fourArms.rarity = superMinerRarities.legendary;
    fourArms.renderer.yOffset = -0.05;
    fourArms.renderer.heightFraction = 1.05;
    fourArms.maxLevel = 10;
    superMinerManager.registerBaseMiner(fourArms);

    var broski = new MiningSuperMiner();
    broski.id = 38;
    broski.name = "Broski Bruh";
    broski.slug = "broski_bruh";
    broski.portrait = broskiPortrait;
    broski.renderContext = MAIN;
    broski.renderer.walkingSpritesheet = new SpritesheetAnimation(broskiWalking, 7, 7);
    broski.renderer.walkingSpritesheet.verticalAlign = "center";
    broski.renderer.drillingSpritesheet = new SpritesheetAnimation(broskiDrilling, 4, 12);
    broski.renderer.drillingSpritesheet.verticalAlign = "center";
    broski.renderer.heightFraction = 1.05;
    broski.renderer.yOffset = 0.05;
    broski.rarity = superMinerRarities.legendary;
    broski.maxLevel = 10;
    superMinerManager.registerBaseMiner(broski);

    var scuzz = new DepositMiner();
    scuzz.id = 39;
    scuzz.name = "Scuzz";
    scuzz.slug = "scuzz";
    scuzz.portrait = sadSkunkPortrait;
    scuzz.renderContext = MAIN;
    scuzz.renderer.walkingSpritesheet = new SpritesheetAnimation(sadSkunkWalking, 8, 4);
    scuzz.renderer.walkingSpritesheet.verticalAlign = "center";
    scuzz.renderer.walkSpeed *= 0.75;
    scuzz.rarity = superMinerRarities.rare;
    scuzz.maxLevel = 10;
    scuzz.positionHitbox = function (hitbox) {
        hitbox.boundingBox.y += hitbox.boundingBox.height * 0.1;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(scuzz);

    var kingCole = new DepositMiner();
    kingCole.id = 40;
    kingCole.name = "Old King Coal";
    kingCole.slug = "old_king_coal";
    kingCole.portrait = kingColePortrait;
    kingCole.renderContext = MAIN;
    kingCole.renderer.walkingSpritesheet = new SpritesheetAnimation(kingColeWalking, 6, 6);
    kingCole.renderer.walkingSpritesheet.verticalAlign = "center";
    kingCole.renderer.drillingSpritesheet = new SpritesheetAnimation(kingColeDrilling, 11, 6);
    kingCole.renderer.drillingSpritesheet.verticalAlign = "center";
    kingCole.renderer.walkSpeed *= 0.5;
    kingCole.renderer.yOffset = -0.1;
    kingCole.rarity = superMinerRarities.legendary;
    kingCole.maxLevel = 10;
    kingCole.positionHitbox = function (hitbox) {
        hitbox.boundingBox.y += hitbox.boundingBox.height * 0.1;
        if (localStorage["isFullscreen"] == "true") {
            hitbox.boundingBox.y += hitbox.boundingBox.height * 0.5;
        }
        return hitbox;
    }
    superMinerManager.registerBaseMiner(kingCole);

    //this was supposed to be a super miner that insta filled minerals but that seems kind of annoying?
    var jarHead = new MiningSuperMiner();
    jarHead.id = 41;
    jarHead.name = "Jar Head";
    jarHead.slug = "jar_head";
    jarHead.portrait = jarHeadPortrait;
    jarHead.renderContext = MAIN;
    jarHead.renderer.walkingSpritesheet = new SpritesheetAnimation(jarHeadWalking, 10, 10);
    jarHead.renderer.walkingSpritesheet.verticalAlign = "center";
    jarHead.renderer.drillingSpritesheet = new SpritesheetAnimation(jarHeadDrilling, 10, 10);
    jarHead.renderer.drillingSpritesheet.verticalAlign = "center";
    jarHead.rarity = superMinerRarities.rare;
    jarHead.maxLevel = 10;
    superMinerManager.registerBaseMiner(jarHead);

    var juggernaut = new MiningSuperMiner();
    juggernaut.id = 42;
    juggernaut.name = "Juggernaut";
    juggernaut.slug = "juggernaut";
    juggernaut.portrait = JuggernautPortrait;
    juggernaut.renderContext = MAIN;
    juggernaut.renderer.walkingSpritesheet = new SpritesheetAnimation(JuggernautWalking, 10, 10);
    juggernaut.renderer.walkingSpritesheet.verticalAlign = "center";
    juggernaut.renderer.drillingSpritesheet = new SpritesheetAnimation(JuggernautDrilling, 17, 10);
    juggernaut.renderer.drillingSpritesheet.verticalAlign = "center";
    juggernaut.rarity = superMinerRarities.legendary;
    juggernaut.maxLevel = 10;
    juggernaut.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height *= 0.6
        hitbox.boundingBox.x -= this.superMinerHitbox.boundingBox.width * 0.5
        return hitbox;
    }
    superMinerManager.registerBaseMiner(juggernaut);

    var unicorn = new MiningSuperMiner();
    unicorn.id = 43;
    unicorn.name = "Sparklina";
    unicorn.slug = "sparklina";
    unicorn.portrait = unicornPortrait;
    unicorn.renderContext = MAIN;
    unicorn.renderer.walkingSpritesheet = new SpritesheetAnimation(unicornWalking, 8, 8);
    unicorn.renderer.walkingSpritesheet.verticalAlign = "center";
    unicorn.renderer.drillingSpritesheet = new SpritesheetAnimation(unicornDrilling, 7, 7);
    unicorn.renderer.drillingSpritesheet.verticalAlign = "center";
    unicorn.rarity = superMinerRarities.rare;
    unicorn.maxLevel = 10;
    unicorn.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height = hitbox.boundingBox.height * 0.75;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(unicorn);

    var arcaneEgg = new EggMiner();
    arcaneEgg.id = 44;
    arcaneEgg.portrait = offWhiteClosed;
    arcaneEgg.hatchedPortrait = offWhiteHatched;
    arcaneEgg.name = "Arcane Egg";
    arcaneEgg.slug = "arcane_egg";
    arcaneEgg.rarity = superMinerRarities.uncommon;
    arcaneEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(arcaneEgg);

    var dinoRider = new ChestMiner();
    dinoRider.id = 45;
    dinoRider.name = "Dino Rider";
    dinoRider.slug = "dino_rider";
    dinoRider.portrait = dinoRiderPortrait;
    dinoRider.renderContext = MAIN;
    dinoRider.renderer.walkingSpritesheet = new SpritesheetAnimation(dinoRiderWorld, 8, 6);
    dinoRider.renderer.walkingSpritesheet.verticalAlign = "center";
    dinoRider.renderer.heightFraction = 1.1;
    dinoRider.renderer.flipHorizontal = true;
    dinoRider.renderer.yOffset = -0.1;
    dinoRider.rarity = superMinerRarities.rare;
    dinoRider.maxLevel = 10;
    dinoRider.positionHitbox = function (hitbox) {
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.3;
        hitbox.boundingBox.height *= 0.5;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(dinoRider);

    var orangutan = new MiningSuperMiner();
    orangutan.id = 46;
    orangutan.name = "King Orange";
    orangutan.slug = "king_orange";
    orangutan.portrait = orangutanPortrait;
    orangutan.renderContext = MAIN;
    orangutan.renderer.walkingSpritesheet = new SpritesheetAnimation(orangutanWalking, 8, 10);
    orangutan.renderer.walkingSpritesheet.verticalAlign = "center";
    orangutan.renderer.drillingSpritesheet = new SpritesheetAnimation(orangutanDrilling, 8, 8);
    orangutan.renderer.drillingSpritesheet.verticalAlign = "center";
    orangutan.rarity = superMinerRarities.rare;
    orangutan.renderer.yOffset = -0.09;
    orangutan.renderer.heightFraction = 1;
    orangutan.maxLevel = 10;
    // King Orange walks on the ceiling/roof
    if (isMobile()) {
        orangutan.renderer.verticalAnchor = "top";
        orangutan.renderer.anchorPadding = 0;
    }
    orangutan.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height *= 0.6;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(orangutan);

    var scrapMachine = new ScrapMiner();
    scrapMachine.id = 47;
    scrapMachine.name = "R.O.B.B.I.N 9000";
    scrapMachine.slug = "robbin_9000";
    scrapMachine.portrait = scrapBotPortrait;
    scrapMachine.renderContext = MAIN;
    scrapMachine.renderer.walkingSpritesheet = new SpritesheetAnimation(scrapBotWalking, 10, 10);
    scrapMachine.renderer.walkingSpritesheet.verticalAlign = "center";
    scrapMachine.renderer.drillingSpritesheet = new SpritesheetAnimation(scrapBotDrilling, 10, 10);
    scrapMachine.renderer.drillingSpritesheet.verticalAlign = "center";
    scrapMachine.rarity = superMinerRarities.rare;
    scrapMachine.renderer.yOffset = (isMobile()) ? -0.1 : -0.2;
    scrapMachine.renderer.heightFraction = .65;
    scrapMachine.maxLevel = 10;
    scrapMachine.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height *= 0.6;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        hitbox.boundingBox.y += hitbox.boundingBox.height * 0.2;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(scrapMachine);

    var scrapMonster = new ScrapMiner();
    scrapMonster.id = 48;
    scrapMonster.name = "Truffles";
    scrapMonster.slug = "truffles";
    scrapMonster.portrait = scrapHogPortrait;
    scrapMonster.renderContext = MAIN;
    scrapMonster.renderer.walkingSpritesheet = new SpritesheetAnimation(scrapHogWalking, 10, 10);
    scrapMonster.renderer.walkingSpritesheet.verticalAlign = "center";
    scrapMonster.renderer.drillingSpritesheet = new SpritesheetAnimation(scrapHogIdle, 6, 6);
    scrapMonster.renderer.drillingSpritesheet.verticalAlign = "center";
    scrapMonster.rarity = superMinerRarities.legendary;
    scrapMonster.renderer.yOffset = (isMobile()) ? -0.05 : -0.1;
    scrapMonster.renderer.heightFraction = .7;
    scrapMonster.maxLevel = 10;
    scrapMonster.positionHitbox = function (hitbox) {
        hitbox.boundingBox.height *= 0.8;
        hitbox.boundingBox.x -= hitbox.boundingBox.width * 0.25;
        return hitbox;
    }
    superMinerManager.registerBaseMiner(scrapMonster);

    var battleEgg = new EggMiner();
    battleEgg.id = 49;
    battleEgg.portrait = purpleClosed;
    battleEgg.hatchedPortrait = purpleHatched;
    battleEgg.name = "Mystic Egg";
    battleEgg.slug = "mystic_egg";
    battleEgg.rarity = superMinerRarities.rare;
    battleEgg.maxLevel = 10;
    superMinerManager.registerBaseMiner(battleEgg);

    //Special Miners
    //Orc Incremental Promo
    var orc = new MiningSuperMiner();
    orc.id = 200;
    orc.name = "Snarg";
    orc.slug = "snarg";
    orc.portrait = orcMinerPortrait;
    orc.renderContext = MAIN;
    orc.renderer.walkingSpritesheet = new SpritesheetAnimation(orcMinerWalking, 8, 10);
    orc.renderer.walkingSpritesheet.verticalAlign = "center";
    orc.renderer.drillingSpritesheet = new SpritesheetAnimation(orcMinerDrilling, 13, 10);
    orc.renderer.drillingSpritesheet.verticalAlign = "center";
    orc.rarity = superMinerRarities.legendary;
    orc.maxLevel = 10;
    orc.isSpecial = true;
    orc.renderer.heightFraction = 1.3;
    orc.renderer.yOffset = 0.05;
    orc.renderer.speechBubbleText = "SNARGGGG!";
    orc.renderer.speechBubbleYOffset = isMobile() ? 0.55 : 0.35;
    orc.renderer.speechBubbleBold = true;
    superMinerManager.registerBaseMiner(orc);
}

initializeBaseMiners();