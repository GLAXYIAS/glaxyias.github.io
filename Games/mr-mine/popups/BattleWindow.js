class BattleWindow extends PopupWindow {
    layerName = "Battle"; // Used as key in activeLayers
    domElementId = "BATTLED"; // ID of dom element that gets shown or hidden
    context = BA;         // Canvas rendering context for popup

    isRendered = true;
    isPopup = true;
    allowBubbling = false;


    constructor(boundingBox) {
        super(boundingBox); // Need to call base class constructor
        if (!boundingBox) {
            this.setBoundingBox();
        }

        this.madeAChoice = false;
        this.endedTurnAt = 0;
        this.autoEndedTurns = 0;
        this.defaultEndTurnTime = 5000;
        this.lastPlayedCard = 0;
        this.innerWindowWidth = this.boundingBox.width * .852;
        this.xOffset = this.boundingBox.width * .083;

        this.energyUse = 0;
        this.monsterDamage = 0;
        this.lastAction = currentTime();
        this.cardHovered = -1;
        this.hoveredCardAt = 0;

        this.endTurnButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .4,
                y: this.boundingBox.height * .565,
                width: this.boundingBox.width * .22,
                height: this.boundingBox.height * .055
            },
            {
                onmousedown: function () {
                    this.parent.endTurn();
                    this.parent.lastAction = currentTime();
                    if (battleManager.atkWeps.length == 0 && battleManager.activeWeps.length == 0) {
                        this.parent.autoEndedTurns++;
                    }
                }
            },
            'pointer',
            "endTurnButton"
        ));

        this.closeButton = this.addHitbox(new Button(
            closei, "", "", "",
            {
                x: this.boundingBox.width * .875,
                y: this.boundingBox.height * .11,
                width: this.boundingBox.width * .06,
                height: this.boundingBox.width * .06
            },
            {
                onmousedown: function () {
                    closeUi(this.parent);
                    if (!mutebuttons) closeAudio[rand(0, closeAudio.length - 1)].play();
                }
            },
            'pointer',
            "closeButton"
        ));

        this.healConsumableHitbox = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .86 - (this.boundingBox.width * .06),
                y: this.boundingBox.height * .45,
                width: this.boundingBox.width * .06,
                height: this.boundingBox.width * .07
            },
            {
                onmousedown: function () {
                    this.parent.lastAction = currentTime();

                    if (battleHealConsumable.battleHeals > 0) {
                        let resultingHP = Math.min(battleManager.userMaxHP, battleManager.userHP + Math.round(battleHealConsumable.percentageHealed * battleManager.userMaxHP));
                        showConfirmationPrompt(
                            _("Are you sure you want to use a Medkit to recover {0}% HP?<br>Final HP: {1}/{2}", battleHealConsumable.percentageHealed * 100, beautifynum(resultingHP), beautifynum(battleManager.userMaxHP)),
                            _("Yes"),
                            () => {
                                if (battleHealConsumable.battleHeals <= 0) return;
                                battleManager.userHP = resultingHP;
                                battleHealConsumable.battleHeals--;
                            },
                            _("No"),
                            null,
                            null,
                            false
                        )
                    }
                    else {
                        showConfirmationPrompt(
                            _("You don't have any Medkits left."),
                            _("BUY MORE"),
                            function () {
                                openUi(PurchaseWindow, null, 0, 0);
                                hideSimpleInput();
                            },
                            _("Cancel"),
                            null,
                            null,
                            false
                        );
                    }
                },
                onmouseenter: function () {
                    showTooltip(battleHealConsumable.name, _("Heals you by {0}% during a battle", battleHealConsumable.percentageHealed * 100), this.boundingBox.x - this.boundingBox.width / 2, this.boundingBox.y - this.boundingBox.height);
                },
                onmouseexit: function () {
                    hideTooltip();
                }
            },
            'pointer',
            "healConsumableHitbox"
        ))

        this.healConsumableHitbox.render = function () {
            this.parent.context.save();

            if ((battleManager.userHP + battleManager.userShield) - battleManager.nextMonsterDamage <= 0 &&
                battleHealConsumable.battleHeals > 0 &&
                (battleManager.activeWeps.length <= 0 && battleManager.atkWeps.length > 0)
            ) {
                let oscillation = 1 + (1 * oscillate(currentTime(), 500));
                this.parent.context.filter = `brightness(${oscillation})`;
            }

            drawImageFitInBox(this.parent.context, battleHealConsumable.image, this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.width);
            this.parent.context.strokeStyle = "#000000";
            this.parent.context.lineWidth = 4;
            this.parent.context.fillStyle = "#FFFFFF";
            this.parent.context.font = `bold ${this.boundingBox.height * .25}px Verdana`;
            strokeTextShrinkToFit(this.parent.context, battleHealConsumable.battleHeals, this.boundingBox.x, this.boundingBox.y + this.boundingBox.height * .9, this.boundingBox.width, "center");
            fillTextShrinkToFit(this.parent.context, battleHealConsumable.battleHeals, this.boundingBox.x, this.boundingBox.y + this.boundingBox.height * .9, this.boundingBox.width, "center");
            this.parent.context.restore();
        }

        this.drawConsumableHitbox = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .87,
                y: this.boundingBox.height * .45,
                width: this.boundingBox.width * .06,
                height: this.boundingBox.width * .07
            },
            {
                onmousedown: function () {
                    this.parent.lastAction = currentTime();

                    if (battleDrawConsumable.battleDraws > 0) {
                        showConfirmationPrompt(
                            _("Are you sure you want to use a Card Dispenser to draw {0} cards from the discard pile?<br>Excess cards will be returned to the deck", Math.min(battleManager.discardedWeps.length, gemUpgradesManager.getGemUpgradeById(GEM_UPGRADE_TYPES.MAX_WEAPONS).levelEffect() - battleManager.activeWeps.length)),
                            _("Yes"),
                            () => {
                                if (battleDrawConsumable.battleDraws <= 0) return;
                                battleManager.drawWeaponsFromDiscard(battleManager.discardedWeps.length);
                                battleDrawConsumable.battleDraws--;
                                this.parent.createWeaponHitboxes();
                            },
                            _("No"),
                            null,
                            null,
                            false
                        )
                    }
                    else {
                        showConfirmationPrompt(
                            _("You don't have any Card Dispensers left."),
                            _("BUY MORE"),
                            function () {
                                openUi(PurchaseWindow, null, 0, 0);
                                hideSimpleInput();
                            },
                            _("Cancel"),
                            null,
                            null,
                            false
                        );
                    }
                },
                onmouseenter: function () {
                    showTooltip(battleDrawConsumable.name, _("Draws cards from the discard pile during battle"), this.boundingBox.x - this.boundingBox.width / 2, this.boundingBox.y - this.boundingBox.height * 1.2);
                },
                onmouseexit: function () {
                    hideTooltip();
                }
            },
            'pointer',
            "drawConsumableHitbox"
        ))

        this.drawConsumableHitbox.render = function () {
            this.parent.context.save();

            if (battleManager.activeWeps.length == 0 && battleManager.atkWeps.length == 0 && battleDrawConsumable.battleDraws > 0) {
                let oscillation = 1 + (1 * oscillate(currentTime(), 500));
                this.parent.context.filter = `brightness(${oscillation})`;
            }

            drawImageFitInBox(this.parent.context, battleDrawConsumable.image, this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.width);
            this.parent.context.strokeStyle = "#000000";
            this.parent.context.lineWidth = 4;
            this.parent.context.fillStyle = "#FFFFFF";
            this.parent.context.font = `bold ${this.boundingBox.height * .25}px Verdana`;
            strokeTextShrinkToFit(this.parent.context, battleDrawConsumable.battleDraws, this.boundingBox.x, this.boundingBox.y + this.boundingBox.height * .9, this.boundingBox.width, "center");
            fillTextShrinkToFit(this.parent.context, battleDrawConsumable.battleDraws, this.boundingBox.x, this.boundingBox.y + this.boundingBox.height * .9, this.boundingBox.width, "center");
            this.parent.context.restore();
        }

        this.equipHitboxes = [];

        this.createWeaponHitboxes();
    }

    createWeaponHitboxes() {
        this.equipHitboxes = [];

        for (var i = 0; i < battleManager.activeWeps.length; i++) {
            var column = i;
            var xOffset = ((this.boundingBox.width * .92) - (battleManager.activeWeps.length * this.boundingBox.width * .11)) / 2;
            var equipWidth = this.boundingBox.width * .1;

            this.equipHitboxes.push(this.addHitbox(new Hitbox(
                {
                    x: xOffset + this.boundingBox.width * (0.04 + ((column) * (0.11))),     // Copied from renderButton call below
                    y: this.boundingBox.height * .65,
                    width: equipWidth,
                    height: this.boundingBox.height * .25
                },
                {
                    onmousedown: function () {
                        if (currentTime() - battleManager.lastBattleWonAt > 2000) {
                            var weaponIndex = parseInt(this.id.split("_")[1]);
                            if (battleManager.activeWeps[weaponIndex] && battleManager.activeWeps[weaponIndex].canUse()) {
                                battleManager.atk(weaponIndex);
                                this.parent.createWeaponHitboxes();
                                this.parent.lastPlayedCard = currentTime();
                                this.parent.lastAction = currentTime();
                            }
                        }
                    },
                    onmouseenter: function () {
                        var weaponIndex = parseInt(this.id.split("_")[1]);
                        if (battleManager.activeWeps[weaponIndex]) {
                            this.parent.energyUse = battleManager.activeWeps[weaponIndex].getEnergy();
                            if (battleManager.activeWeps[weaponIndex].getDamage) {
                                this.parent.monsterDamage = battleManager.activeWeps[weaponIndex].getDamage();
                            }

                            if (battleManager.activeWeps[weaponIndex].canUse()) {
                                this.parent.cardHovered = weaponIndex;
                                this.parent.hoveredCardAt = currentTime();
                            }
                        }


                    },
                    onmouseexit: function () {
                        this.parent.monsterDamage = 0;
                        this.parent.energyUse = 0;

                        this.parent.cardHovered = -1;
                    }
                },
                'pointer',
                "weaponButton_" + i
            )));
        }
    }

    renderUserHPBar() {

        let fullhpWidth = this.innerWindowWidth;
        let currentHPWidth = (fullhpWidth * (battleManager.userHP / battleManager.userMaxHP));

        //user hp render
        this.context.fillStyle = "#991111";
        this.context.fillRect(
            this.boundingBox.width * .085,
            this.boundingBox.height * .962,
            currentHPWidth,
            this.boundingBox.height * .036
        );

        //block render
        let blockWidth = fullhpWidth * (battleManager.userShield / battleManager.userMaxHP);
        this.context.fillStyle = "gray";
        this.context.fillRect(
            (this.boundingBox.width * .085) + currentHPWidth - blockWidth,
            this.boundingBox.height * .962,
            blockWidth,
            this.boundingBox.height * .036
        );


        //damage taken render
        let hpAfterAttack = battleManager.userHP - battleManager.nextMonsterDamage;
        let lostHpWidth = Math.max(0, (fullhpWidth * (1 - (hpAfterAttack / battleManager.userMaxHP))));
        this.context.fillStyle = `rgba(0, 0, 0, ${-.5 + (1.5 * oscillate(currentTime(), 1000))})`;
        this.context.fillRect(
            Math.max(this.xOffset + (this.boundingBox.width * .002), (this.boundingBox.width * .085) + fullhpWidth - lostHpWidth),
            this.boundingBox.height * .962,
            Math.min(this.innerWindowWidth, lostHpWidth),
            this.boundingBox.height * .036
        );

        this.context.fillStyle = "#ffffff";
        let hpTextPos = fillTextShrinkToFit(
            this.context,
            beautifynum(battleManager.userHP) + "/" + beautifynum(battleManager.userMaxHP),
            this.xOffset,
            this.boundingBox.height * .985,
            fullhpWidth,
            "center"
        );

        this.context.save();
        for (var TD = 0; TD < battleManager.takenDmg.length; TD++) {
            if (currentTime() - battleManager.takenDmg[TD][1] < 1000) {
                var alphaT = 1 - ((currentTime() - battleManager.takenDmg[TD][1]) / 1000);
                this.context.globalAlpha = alphaT;
                this.context.fillStyle = (battleManager.takenDmg[TD][2]) ? "#FF8800" : "#FF2222";
                this.context.font = `bold ${this.boundingBox.height * .035}px Verdana`;
                this.context.strokeText("-" + battleManager.takenDmg[TD][0], (this.boundingBox.width * .085) + (currentHPWidth * .9) + (TD * 60), this.boundingBox.height * .99);
                this.context.fillText("-" + battleManager.takenDmg[TD][0], (this.boundingBox.width * .085) + (currentHPWidth * .9) + (TD * 60), this.boundingBox.height * .99);
            }
            else {
                battleManager.takenDmg.splice(TD, 1);
                TD--;
            }
        }
        this.context.globalAlpha = 1.0;
        this.context.restore();

        this.context.drawImage(
            healthPool,
            0,
            0,
            healthPool.width,
            healthPool.height,
            this.boundingBox.width * .4,
            this.boundingBox.height * .962,
            this.boundingBox.width * .02,
            this.boundingBox.width * .02
        );
    }

    renderUserEnergyBar() {
        this.context.fillStyle = "#000000";
        this.context.fillRect(this.xOffset, this.boundingBox.height * .914, (this.innerWindowWidth) + (this.boundingBox.width * .003), this.boundingBox.height * .086);
        this.context.fillStyle = "purple";
        this.context.fillRect(this.xOffset + (this.boundingBox.width * .0022), this.boundingBox.height * .918, (this.innerWindowWidth) * (battleManager.userEnergy / battleManager.userMaxEnergy), this.boundingBox.height * .036);

        let energyAfterAttack = Math.max(0, battleManager.userEnergy - this.energyUse);
        let lostEnergyWidth = Math.max(0, (this.innerWindowWidth * (1 - (energyAfterAttack / battleManager.userMaxEnergy))));
        this.context.fillStyle = `rgba(0, 0, 0, ${(.7 * oscillate(currentTime(), 1000))})`;
        this.context.fillRect(
            this.xOffset + (this.innerWindowWidth * 1.005) - lostEnergyWidth,
            this.boundingBox.height * .914,
            lostEnergyWidth,
            this.boundingBox.height * .086
        );
        this.context.fillStyle = "#ffffff";

        let energyTextPos = fillTextShrinkToFit(
            this.context,
            beautifynum(battleManager.userEnergy) + "/" + beautifynum(battleManager.userMaxEnergy),
            this.xOffset,
            this.boundingBox.height * .94,
            this.innerWindowWidth,
            "center"
        );

        this.context.drawImage(
            energyDiamondBar,
            0,
            0,
            energyDiamondBar.width,
            energyDiamondBar.height,
            this.boundingBox.width * .4,
            this.boundingBox.height * .92,
            this.boundingBox.width * .02,
            this.boundingBox.width * .02
        );
    }

    renderRewards() {
        if (!battleManager.isBossBattleActive) {
            //Draw the rewards
            let circleWidth = this.boundingBox.width * .04;
            let circleHeight = this.boundingBox.width * .035;
            let circleDistance = this.boundingBox.width * .04;
            let totalWidth = (circleDistance * (battleManager.battleWaiting.length - 1)) + circleWidth;
            let startX = (this.boundingBox.width - totalWidth) / 2;
            let circleY = this.boundingBox.height * 0.15;

            for (var i = 0; i < battleManager.battleWaiting.length; i++) {
                let circleX = startX + (circleDistance * i);
                let rewardColor;
                let rewardDirection;
                let rewardFrame;

                //Choose frame
                if (battleManager.battleWaiting.length == 1) {
                    rewardDirection = "Single";
                }
                else if (i == 0) {
                    rewardDirection = "Left";
                }
                else if (i == battleManager.battleWaiting.length - 1) {
                    rewardDirection = "Right";
                }
                else {
                    rewardDirection = "Mid";
                }

                //Set frame color
                if (battleManager.activeMonster.difficulty == i + 1) {
                    rewardColor = "Orange";
                }
                else if (battleManager.activeMonster.difficulty < i + 1) {
                    rewardColor = "Default";
                }
                else {
                    rewardColor = "Yellow";
                }

                rewardFrame = window["rewards" + rewardDirection + rewardColor];
                this.context.drawImage(rewardFrame, 0, 0, rewardFrame.width, rewardFrame.height, circleX, circleY, circleWidth, circleHeight);
                if (rewardColor == "Orange") {
                    this.context.globalAlpha = .5 + (.5 * oscillate(currentTime(), 1000));
                    let imageForDirection = window["rewards" + rewardDirection + "Default"]
                    this.context.drawImage(imageForDirection, 0, 0, imageForDirection.width, imageForDirection.height, circleX, circleY, circleWidth, circleHeight);
                    this.context.globalAlpha = 1;
                }

                //draw reward in circle
                let monster = battleManager.battleWaiting[i][2];
                let reward = monster.reward;
                drawImageFitInBox(
                    this.context,
                    reward.icon,
                    circleX + (circleWidth * .15),
                    circleY + (circleWidth * .1),
                    circleWidth * .7,
                    circleHeight * .7
                );

                // if(rewardColor == "Yellow")
                // {
                //     renderCheckmark(
                //         this.context,
                //         circleX + (circleWidth * .37),
                //         circleY + (circleWidth * .6),
                //         circleWidth * .3,
                //         circleWidth * .3,
                //         true
                //     );
                // }

            }
        }
    }

    renderMonsterHPBar() {
        let monsterHPBarX = (this.boundingBox.width - this.boundingBox.width * .45) / 2;
        let monsterHPBarY = this.boundingBox.height * .46;
        let monsterHPBarWidth = this.boundingBox.width * .45;
        let monsterHPBarHeight = this.boundingBox.height * .034;
        let monsterTextY = monsterHPBarY + (monsterHPBarHeight * .7);

        this.context.strokeStyle = "#000000";
        this.context.lineWidth = 4;
        this.context.strokeRect(
            monsterHPBarX,
            monsterHPBarY,
            monsterHPBarWidth,
            monsterHPBarHeight
        );

        this.context.fillStyle = "#000000";
        this.context.fillRect(
            monsterHPBarX,
            monsterHPBarY,
            monsterHPBarWidth,
            monsterHPBarHeight
        );

        let healthPercentage = battleManager.activeMonster.currentHealth / battleManager.activeMonster.baseHealth;
        if (currentTime() - battleManager.lastBattleWonAt < 2000) {
            healthPercentage = 0;
        }
        this.context.fillStyle = "#eb1b9a";
        this.context.fillRect(
            monsterHPBarX,
            monsterHPBarY,
            (monsterHPBarWidth * healthPercentage),
            monsterHPBarHeight
        );

        //damage taken render
        let monsterHpAfterAttack = Math.max(0, battleManager.activeMonster.currentHealth - Math.floor((battleManager.nextMonsterDamage * battleManager.userReflectPercentage)) - this.monsterDamage);
        let monsterLostHpWidth = Math.max(0, (monsterHPBarWidth * (1 - (monsterHpAfterAttack / battleManager.activeMonster.baseHealth))));
        this.context.fillStyle = `rgba(0, 0, 0, ${(.7 * oscillate(currentTime(), 1000))})`;
        this.context.fillRect(
            monsterHPBarX + monsterHPBarWidth - monsterLostHpWidth,
            monsterHPBarY,
            monsterLostHpWidth,
            monsterHPBarHeight
        );

        let monster = battleManager.isBossBattleActive ? battleManager.activeMonster : battleManager.battleWaiting[battleManager.activeMonster.difficulty - 1][2];
        if (currentTime() - battleManager.lastBattleWonAt < 2000) monster = battleManager.battleWaiting[Math.max(0, battleManager.activeMonster.difficulty - 2)][2];

        this.context.fillStyle = "#ffffff";
        this.context.font = `bold ${this.boundingBox.height * .02}px Verdana`;
        let health = healthPercentage == 0 ? 0 : monster.currentHealth;
        this.context.fillText(beautifynum(health) + "/" + beautifynum(monster.baseHealth), this.boundingBox.width * .48, monsterTextY);

        if (!battleManager.isBossBattleActive) {
            this.context.fillText("Wild " + monster.name, monsterHPBarX + monsterHPBarWidth * .05, monsterTextY);
        }
        else {
            this.context.fillText(monster.name, monsterHPBarX + monsterHPBarWidth * .05, monsterTextY);
        }

        //Render Monster Icon
        this.context.save();
        this.context.shadowColor = "black"; // Border color
        this.context.shadowBlur = 20; // Amount of blur for the border
        this.context.shadowOffsetX = 0; // Offset the shadow horizontally
        this.context.shadowOffsetY = 0; // Offset the shadow vertically
        monster.animation.drawFrame(this.context, monsterHPBarX - monsterHPBarHeight, monsterHPBarY - monsterHPBarHeight * .5, monsterHPBarHeight * 2, monsterHPBarHeight * 2, 0);
        this.context.restore();
    }

    renderEndTurnButton() {
        let endTurnButton = this.endTurnButton.boundingBox;
        this.context.save();
        let canCastAnyWep = battleManager.activeWeps.filter(wep => wep.canUse()).length > 0;
        let buttonShouldFlash = (battleManager.activeWeps.length == 0 || !canCastAnyWep) && this.lastAction + 2000 < currentTime();
        let oscillation = 1;
        if (buttonShouldFlash) {
            oscillation = 1 + (1 * oscillate(currentTime(), 500));
            this.context.filter = `brightness(${oscillation})`;
        }

        this.context.drawImage(
            upgradeb,
            0, 0,
            upgradeb.width,
            upgradeb.height,
            endTurnButton.x - (endTurnButton.width * (oscillation - 1) * .025),
            endTurnButton.y - (endTurnButton.height * (oscillation - 1) * .025),
            endTurnButton.width * (1 + (oscillation - 1) * .05),
            endTurnButton.height * (1 + (oscillation - 1) * .05)
        );
        this.context.filter = "none";
        this.context.restore();

        this.context.fillStyle = "#000000";
        this.context.font = `bold ${this.boundingBox.height * .035}px Verdana`;
        fillTextShrinkToFit(this.context, _("End Turn"), endTurnButton.x, endTurnButton.y + (endTurnButton.height * .7), endTurnButton.width, "center");


        if (battleManager.atkWeps.length == 0 && battleManager.activeWeps.length == 0)  // If no weapons are available to attack
        {
            this.context.save();
            this.context.fillStyle = "#000000";
            this.context.fillRect(
                this.endTurnButton.boundingBox.x,
                this.endTurnButton.boundingBox.y + (this.endTurnButton.boundingBox.height * 1.02),
                this.endTurnButton.boundingBox.width,
                this.endTurnButton.boundingBox.height * .15
            );
            this.context.fillStyle = "#ffffff";
            let endTurnProgression = Math.max(200, this.defaultEndTurnTime - (this.autoEndedTurns * 1500));
            let timeLeft = Math.max(0, endTurnProgression - (currentTime() - this.endedTurnAt));

            //draw white bar over black bar and center it as it shrinks
            this.context.fillRect(
                this.endTurnButton.boundingBox.x + (this.endTurnButton.boundingBox.width * (1 - (timeLeft / endTurnProgression))) / 2,
                this.endTurnButton.boundingBox.y + (this.endTurnButton.boundingBox.height * 1.02),
                this.endTurnButton.boundingBox.width * (timeLeft / endTurnProgression),
                this.endTurnButton.boundingBox.height * .15
            );

            if (timeLeft == 0) {
                this.endTurn();
                this.autoEndedTurns++;
            }
            this.context.restore();
        }
    }

    renderMonster() {

        let monster = battleManager.isBossBattleActive ? battleManager.activeMonster : battleManager.battleWaiting[battleManager.activeMonster.difficulty - 1][2];

        if (monster.currentHealth > (monster.baseHealth * .07) && currentTime() - battleManager.lastBattleWonAt > 2000) {
            monster.animation.loopFrames(
                this.context,
                this.boundingBox.width * .31,
                this.boundingBox.height * .26,
                this.boundingBox.width * .38,
                this.boundingBox.height * .18,
                true,
                0,
                monster.animation.frameCount - 1)
        }
        else {
            let monsterWidth = this.boundingBox.width * .38;
            let monsterHeight = this.boundingBox.height * .18;
            let monsterY = this.boundingBox.height * .25;
            let monsterX = this.boundingBox.width * .3;
            let percentageSize = 1;

            if (currentTime() - battleManager.lastBattleWonAt < 2000) {
                monster = battleManager.battleWaiting[Math.max(0, battleManager.activeMonster.difficulty - 2)][2]
                percentageSize = 1 - ((currentTime() - battleManager.lastBattleWonAt) / 2000);
                monsterWidth *= percentageSize;
                monsterHeight *= percentageSize;
                monsterY += (this.boundingBox.height * .18) * (1 - percentageSize) / 2;
                monsterX += (this.boundingBox.width * .38) * (1 - percentageSize) / 2;
            }

            monster.animation.drawFrame(this.context, monsterX, monsterY, monsterWidth, monsterHeight, 3)
        }
    }

    renderEquips() {
        if (currentTime() - battleManager.lastBattleWonAt > 2000) {
            for (var i = 0; i < this.equipHitboxes.length; i++) {
                let equip = battleManager.activeWeps[i];

                if (equip) {
                    let equipHitbox = this.equipHitboxes[i];
                    if (equipHitbox) {
                        let boundingBox = equipHitbox.boundingBox;
                        let risingAnimation = Math.min(300, currentTime() - this.hoveredCardAt);
                        let hovered = this.cardHovered == i;
                        let yAnimation = 0;
                        if (hovered) {
                            yAnimation = boundingBox.height * .02 * (risingAnimation / 300);
                        }

                        equip.drawCard(this.context, boundingBox.x, boundingBox.y - yAnimation, boundingBox.width, boundingBox.height, true);

                    }
                }
            }
        }

        if (battleManager.activeWeps.length == 0 && battleManager.atkWeps.length == 0) {
            let opacty = Math.min(1, ((currentTime() - this.lastPlayedCard) / 1000));
            this.context.globalAlpha = opacty;
            this.context.fillStyle = "#000000";
            this.context.font = `bold ${this.boundingBox.height * .06}px Verdana`;
            fillTextShrinkToFit(
                this.context,
                _("Oh no! You've ran out of cards. Get more or upgrade your cards in the underground city."),
                this.boundingBox.width * .1,
                this.boundingBox.height * .8,
                this.boundingBox.width * .8,
                "center"
            );
            this.context.globalAlpha = 1;
        }
    }

    renderMonsterDamageNumbers() {
        this.context.save();
        for (var DD = 0; DD < battleManager.dealtDmg.length; DD++) {
            if (currentTime() - battleManager.dealtDmg[DD][1] < 1000) {
                var alphaT = 1 - ((currentTime() - battleManager.dealtDmg[DD][1]) / 1000);
                this.context.globalAlpha = alphaT;

                if (battleManager.dealtDmg[DD][2]) {
                    this.context.font = `bold ${this.boundingBox.height * .035}px Verdana`
                }
                else {
                    this.context.font = `bold ${this.boundingBox.height * .032}px Verdana`;
                }

                this.context.strokeStyle = "#000000";
                this.context.lineWidth = 4;

                this.context.strokeText("-" + battleManager.dealtDmg[DD][0],
                    (this.boundingBox.width * .5) + (DD * 3),
                    this.boundingBox.height * .35 - (this.boundingBox.height * .3 * ((currentTime() - battleManager.dealtDmg[DD][1]) / 1000))
                );

                this.context.fillText("-" + battleManager.dealtDmg[DD][0],
                    (this.boundingBox.width * .5) + (DD * 3),
                    this.boundingBox.height * .35 - (this.boundingBox.height * .3 * ((currentTime() - battleManager.dealtDmg[DD][1]) / 1000))
                );
            }
            else {
                battleManager.dealtDmg.splice(DD, 1);
                DD--;
            }
        }
        this.globalAlpha = 1;
        this.context.restore();
    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        this.context.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.context.fillRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        this.context.drawImage(battleBackgroundExtended, 0, 0, battleBackgroundExtended.width, battleBackgroundExtended.height, this.boundingBox.width * .3, this.boundingBox.height * .11, this.boundingBox.width * .40, this.boundingBox.height * .40);
        this.context.drawImage(battlePanel, 0, 0, battlePanel.width, battlePanel.height, this.xOffset, this.boundingBox.height * .55, this.innerWindowWidth, this.boundingBox.height * .40);
        this.renderEquips();
        this.context.fillStyle = "#FFFFFF";

        fillTextShrinkToFit(
            this.context,
            _("Remaining: {0}", battleManager.atkWeps.length),
            this.boundingBox.width * .1,
            this.boundingBox.height * .61,
            this.boundingBox.width * .1,
            "center"
        );

        fillTextShrinkToFit(
            this.context,
            _("Discarded: {0}", battleManager.discardedWeps.length),
            this.boundingBox.width * .82,
            this.boundingBox.height * .61,
            this.boundingBox.width * .1,
            "center"
        );


        this.renderMonster();
        this.renderRewards();
        this.renderMonsterHPBar();
        this.renderMonsterDamageNumbers();
        this.renderUserEnergyBar();
        this.renderUserHPBar();
        this.renderEndTurnButton();

        super.render(); // Render any child layers
        this.context.restore();
    }

    endTurn() {
        battleManager.endTurn();
        this.createWeaponHitboxes();
        this.endedTurnAt = currentTime();
    }

    close() {
        if (battleManager.activeWeps.length == 0 && battleManager.atkWeps.length == 0 && !this.madeAChoice) {
            battleManager.lostBattle();
            this.madeAChoice = true;
        }
        else {
            battleManager.battleActive = false;
            battleManager.isBossBattleActive = false;
            return super.close();
        }
    }
}