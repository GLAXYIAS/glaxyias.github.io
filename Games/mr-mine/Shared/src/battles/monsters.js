(function initializeMonsters() {
    // MONSTERS

    var newMonster = new monster();
    newMonster.name = "Rocket";
    newMonster.animation = new SpritesheetAnimation(monster01, 4, 4);
    newMonster.minDepth = 300;
    newMonster.maxDepth = 340;
    newMonster.baseDamage = 12;
    newMonster.baseHealth = 50;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Ramer";
    newMonster.animation = new SpritesheetAnimation(monster02, 4, 4);
    newMonster.minDepth = 330;
    newMonster.maxDepth = 410;
    newMonster.baseDamage = 22;
    newMonster.baseHealth = 100;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Stoner";
    newMonster.animation = new SpritesheetAnimation(monster03, 4, 4);
    newMonster.minDepth = 400;
    newMonster.maxDepth = 520;
    newMonster.baseDamage = 30;
    newMonster.baseHealth = 200;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "RockLord";
    newMonster.animation = new SpritesheetAnimation(monster04, 4, 4);
    newMonster.minDepth = 500;
    newMonster.maxDepth = 620;
    newMonster.baseDamage = 40;
    newMonster.baseHealth = 400;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Ting";
    newMonster.animation = new SpritesheetAnimation(monster05, 4, 4);
    newMonster.minDepth = 605;
    newMonster.maxDepth = 720;
    newMonster.baseDamage = 50;
    newMonster.baseHealth = 450;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Blurk";
    newMonster.animation = new SpritesheetAnimation(monster06, 4, 4);
    newMonster.minDepth = 700;
    newMonster.maxDepth = 840;
    newMonster.baseDamage = 55;
    newMonster.baseHealth = 550;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Necro";
    newMonster.animation = new SpritesheetAnimation(monster07, 4, 4);
    newMonster.minDepth = 795;
    newMonster.maxDepth = 1020;
    newMonster.baseDamage = 75;
    newMonster.baseHealth = 600;
    battleManager.registerMonster(newMonster);

    //w2 monsters

    newMonster = new monster();
    newMonster.name = "Purpa";
    newMonster.animation = new SpritesheetAnimation(monster08, 4, 4);
    newMonster.minDepth = 1020;
    newMonster.maxDepth = 1050;
    newMonster.baseDamage = 110;
    newMonster.baseHealth = 800;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Blurb";
    newMonster.animation = new SpritesheetAnimation(monster09, 4, 4);
    newMonster.minDepth = 1045;
    newMonster.maxDepth = 1095;
    newMonster.baseDamage = 120;
    newMonster.baseHealth = 900;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Blinky";
    newMonster.animation = new SpritesheetAnimation(monster10, 4, 4);
    newMonster.minDepth = 1090;
    newMonster.maxDepth = 1135;
    newMonster.baseDamage = 130;
    newMonster.baseHealth = 1000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Bulda";
    newMonster.animation = new SpritesheetAnimation(monster11, 4, 4);
    newMonster.minDepth = 1130;
    newMonster.maxDepth = 1185;
    newMonster.baseDamage = 130;
    newMonster.baseHealth = 1350;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Whacko";
    newMonster.animation = new SpritesheetAnimation(monster12, 4, 4);
    newMonster.minDepth = 1170;
    newMonster.maxDepth = 1300;
    newMonster.baseDamage = 100;
    newMonster.baseHealth = 1500;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Godu";
    newMonster.animation = new SpritesheetAnimation(monster13, 4, 4);
    newMonster.minDepth = 1280;
    newMonster.maxDepth = 1390;
    newMonster.baseDamage = 130;
    newMonster.baseHealth = 1600;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Woobla";
    newMonster.animation = new SpritesheetAnimation(monster14, 4, 4);
    newMonster.minDepth = 1370;
    newMonster.maxDepth = 1490;
    newMonster.baseDamage = 150;
    newMonster.baseHealth = 1700;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Wormer";
    newMonster.animation = new SpritesheetAnimation(monster15, 4, 4);
    newMonster.minDepth = 1475;
    newMonster.maxDepth = 1580;
    newMonster.baseDamage = 175;
    newMonster.baseHealth = 1800;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Wooblo";
    newMonster.animation = new SpritesheetAnimation(monster16, 4, 4);
    newMonster.minDepth = 1575;
    newMonster.maxDepth = 1685;
    newMonster.baseDamage = 200;
    newMonster.baseHealth = 2000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Sploog";
    newMonster.animation = new SpritesheetAnimation(monster17, 4, 4);
    newMonster.minDepth = 1675;
    newMonster.maxDepth = 1810;
    newMonster.baseDamage = 225;
    newMonster.baseHealth = 2250;
    battleManager.registerMonster(newMonster);

    //w3 monsters

    newMonster = new monster();
    newMonster.name = "Razors";
    newMonster.animation = new SpritesheetAnimation(monster18, 4, 4);
    newMonster.minDepth = 1810;
    newMonster.maxDepth = 1900;
    newMonster.baseDamage = 300;
    newMonster.baseHealth = 2500;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Wriggleys";
    newMonster.animation = new SpritesheetAnimation(monster19, 4, 4);
    newMonster.minDepth = 1900;
    newMonster.maxDepth = 2000;
    newMonster.baseDamage = 350;
    newMonster.baseHealth = 2750;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Hooksley";
    newMonster.animation = new SpritesheetAnimation(monster20, 4, 4);
    newMonster.minDepth = 2000;
    newMonster.maxDepth = 2100;
    newMonster.baseDamage = 400;
    newMonster.baseHealth = 3000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Verdantis";
    newMonster.animation = new SpritesheetAnimation(monster21, 4, 4);
    newMonster.minDepth = 2100;
    newMonster.maxDepth = 2200;
    newMonster.baseDamage = 400;
    newMonster.baseHealth = 4000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Clawmp";
    newMonster.animation = new SpritesheetAnimation(monster22, 4, 4);
    newMonster.minDepth = 2200;
    newMonster.maxDepth = 2400;
    newMonster.baseDamage = 450;
    newMonster.baseHealth = 6000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = "Eeluminator";
    newMonster.animation = new SpritesheetAnimation(monster23, 4, 4);
    newMonster.minDepth = 2400;
    newMonster.maxDepth = 2600;
    newMonster.baseDamage = 700;
    newMonster.baseHealth = 7500;
    battleManager.registerMonster(newMonster);

    //BOSSES
    //w1 bosses

    newMonster = new monster();
    newMonster.name = _("Imp Overlord");
    newMonster.animation = new SpritesheetAnimation(ImpBoss, 4, 4);
    newMonster.levelAsset = bossLevel1;
    newMonster.isBoss = true;
    newMonster.minDepth = 400;
    newMonster.maxDepth = 400;
    newMonster.baseDamage = 60;
    newMonster.baseHealth = 60;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("The Unnamed");
    newMonster.animation = new SpritesheetAnimation(AbominationBoss, 4, 4);
    newMonster.levelAsset = bossLevel2;
    newMonster.isBoss = true;
    newMonster.minDepth = 500;
    newMonster.maxDepth = 500;
    newMonster.baseDamage = 75;
    newMonster.baseHealth = 75;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Immortal Warlock");
    newMonster.animation = new SpritesheetAnimation(WarlockBoss, 4, 4);
    newMonster.levelAsset = bossLevel3;
    newMonster.isBoss = true;
    newMonster.minDepth = 600;
    newMonster.maxDepth = 600;
    newMonster.baseDamage = 50;
    newMonster.baseHealth = 150;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Demon Beast");
    newMonster.animation = new SpritesheetAnimation(DemonBoss, 4, 4);
    newMonster.levelAsset = bossLevel4;
    newMonster.isBoss = true;
    newMonster.minDepth = 700;
    newMonster.maxDepth = 700;
    newMonster.baseDamage = 30;
    newMonster.baseHealth = 200;
    newMonster.bonusReward = () => {
        chestCompressorStructure.level = 1;
        learnBlueprint(3, 12);
        chestCompressorTimeStructure.level = 1;
        learnBlueprint(3, 13);
        chestCompressorSlotStructure.level = 1;
        learnBlueprint(3, 14);
        newNews(_("Discovered the Chest Compressor!"));
    };
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Ancient Wizard");
    newMonster.animation = new SpritesheetAnimation(AncientBoss, 4, 4);
    newMonster.levelAsset = bossLevel5;
    newMonster.isBoss = true;
    newMonster.minDepth = 800;
    newMonster.maxDepth = 800;
    newMonster.baseDamage = 40;
    newMonster.baseHealth = 360;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Radioactive Butcher");
    newMonster.animation = new SpritesheetAnimation(RadioactiveBoss, 4, 4);
    newMonster.levelAsset = bossLevel6;
    newMonster.isBoss = true;
    newMonster.minDepth = 900;
    newMonster.maxDepth = 900;
    newMonster.baseDamage = 40;
    newMonster.baseHealth = 500;
    battleManager.registerMonster(newMonster);

    //w2 bosses

    newMonster = new monster();
    newMonster.name = _("The Infected");
    newMonster.animation = new SpritesheetAnimation(TheInfected, 4, 4);
    newMonster.levelAsset = bossLevel7;
    newMonster.isBoss = true;
    newMonster.minDepth = 1132;
    newMonster.maxDepth = 1132;
    newMonster.baseDamage = 50;
    newMonster.baseHealth = 800;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("The Infector");
    newMonster.animation = new SpritesheetAnimation(TheInfector, 4, 4);
    newMonster.levelAsset = bossLevel8;
    newMonster.isBoss = true;
    newMonster.minDepth = 1232;
    newMonster.maxDepth = 1232;
    newMonster.baseDamage = 60;
    newMonster.baseHealth = 1200;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Zorgax - 036");
    newMonster.animation = new SpritesheetAnimation(Zorgax, 4, 4);
    newMonster.levelAsset = bossLevel9;
    newMonster.isBoss = true;
    newMonster.minDepth = 1332;
    newMonster.maxDepth = 1332;
    newMonster.baseDamage = 65;
    newMonster.baseHealth = 2000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Ancient Defender");
    newMonster.animation = new SpritesheetAnimation(AncientDefender, 4, 4);
    newMonster.levelAsset = bossLevel10;
    newMonster.isBoss = true;
    newMonster.minDepth = 1432;
    newMonster.maxDepth = 1432;
    newMonster.baseDamage = 65;
    newMonster.baseHealth = 3000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Squido");
    newMonster.animation = new SpritesheetAnimation(Squido, 4, 4);
    newMonster.levelAsset = bossLevel11;
    newMonster.isBoss = true;
    newMonster.minDepth = 1532;
    newMonster.maxDepth = 1532;
    newMonster.baseDamage = 90;
    newMonster.baseHealth = 3500;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Lunarios");
    newMonster.animation = new SpritesheetAnimation(Lunarios, 4, 4);
    newMonster.levelAsset = bossLevel12;
    newMonster.isBoss = true;
    newMonster.minDepth = 1632;
    newMonster.maxDepth = 1632;
    newMonster.baseDamage = 150;
    newMonster.baseHealth = 2800;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Bargo");
    newMonster.animation = new SpritesheetAnimation(Bargo, 4, 4);
    newMonster.levelAsset = bossLevel13;
    newMonster.isBoss = true;
    newMonster.minDepth = 1732;
    newMonster.maxDepth = 1732;
    newMonster.baseDamage = 200;
    newMonster.baseHealth = 3000;
    battleManager.registerMonster(newMonster);

    //w3 bosses

    newMonster = new monster();
    newMonster.name = _("Angler");
    newMonster.animation = new SpritesheetAnimation(Angler, 4, 4);
    newMonster.levelAsset = bossLevel14;
    newMonster.isBoss = true;
    newMonster.minDepth = 1914;
    newMonster.maxDepth = 1914;
    newMonster.baseDamage = 300;
    newMonster.baseHealth = 3000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Muscylon");
    newMonster.animation = new SpritesheetAnimation(Muscylon, 4, 4);
    newMonster.levelAsset = bossLevel15;
    newMonster.isBoss = true;
    newMonster.minDepth = 2014;
    newMonster.maxDepth = 2014;
    newMonster.baseDamage = 400;
    newMonster.baseHealth = 4000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Muscylon");
    newMonster.animation = new SpritesheetAnimation(Muscylon, 4, 4);
    newMonster.levelAsset = bossLevel15;
    newMonster.isBoss = true;
    newMonster.minDepth = 2114;
    newMonster.maxDepth = 2114;
    newMonster.baseDamage = 500;
    newMonster.baseHealth = 5000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Coral Drake");
    newMonster.animation = new SpritesheetAnimation(Leafdrake, 4, 4);
    newMonster.levelAsset = bossLevel16;
    newMonster.isBoss = true;
    newMonster.minDepth = 2214;
    newMonster.maxDepth = 2214;
    newMonster.baseDamage = 600;
    newMonster.baseHealth = 5500;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Axolash");
    newMonster.animation = new SpritesheetAnimation(Axolash, 4, 4);
    newMonster.levelAsset = bossLevel17;
    newMonster.isBoss = true;
    newMonster.minDepth = 2314;
    newMonster.maxDepth = 2314;
    newMonster.baseDamage = 700;
    newMonster.baseHealth = 8000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Pyrecoil");
    newMonster.animation = new SpritesheetAnimation(Pyrecoil, 4, 4);
    newMonster.levelAsset = bossLevel18;
    newMonster.isBoss = true;
    newMonster.minDepth = 2414;
    newMonster.maxDepth = 2414;
    newMonster.baseDamage = 1400;
    newMonster.baseHealth = 14000;
    battleManager.registerMonster(newMonster);

    newMonster = new monster();
    newMonster.name = _("Abyssal Warden");
    newMonster.animation = new SpritesheetAnimation(AbyssalWarden, 4, 4);
    newMonster.levelAsset = bossLevel19;
    newMonster.isBoss = true;
    newMonster.minDepth = 2514;
    newMonster.maxDepth = 2514;
    newMonster.baseDamage = 2100;
    newMonster.baseHealth = 18000;
    battleManager.registerMonster(newMonster);
})()