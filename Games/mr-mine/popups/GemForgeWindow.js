class GemForgeWindow extends TabbedPopupWindow {
    layerName = "gemforge"; // Used as key in activeLayers
    domElementId = "GEMFORGED"; // ID of dom element that gets shown or hidden
    context = GEMFORGE;         // Canvas rendering context for popup

    constructor(boundingBox) {
        super(boundingBox); // Need to call base class constructor
        if (!boundingBox) {
            this.setBoundingBox();
        }

        var tabCategories = {
            0: _("Forge Home"),
            1: _("Upgrades")
        };

        this.initializeTabs(Object.values(tabCategories));

        this.forgeHomePane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "forgeHomePane"
        );
        this.forgeHomePane.allowBubbling = true;
        this.addHitbox(this.forgeHomePane);

        this.upgradesPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "upgradesPane"
        );
        this.upgradesPane.allowBubbling = true;
        this.addHitbox(this.upgradesPane);

        this.forgeStatsPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "forgeStatsPane"
        );
        this.forgeStatsPane.allowBubbling = true;
        this.addHitbox(this.forgeStatsPane);

        this.mousingDown = false;
        this.mouseDownTime = 0;
        this.mousingDownFunction = function () { };

        this.onTabChange();
    }

    onTabChange() {
        if (this.currentTabIndex == 0) {
            this.forgeHomePane.setVisible(true)
            this.forgeHomePane.setEnabled(true)
            this.upgradesPane.setVisible(false)
            this.upgradesPane.setEnabled(false)
            this.forgeStatsPane.setVisible(false)
            this.forgeStatsPane.setEnabled(false)
            this.initializeHomeHitboxes();
        }
        else if (this.currentTabIndex == 1) {
            this.forgeHomePane.setVisible(false)
            this.forgeHomePane.setEnabled(false)
            this.upgradesPane.setVisible(true)
            this.upgradesPane.setEnabled(true)
            this.forgeStatsPane.setVisible(false)
            this.forgeStatsPane.setEnabled(false)
            this.initializeUpgradesHitboxes();
        }
        else if (this.currentTabIndex == 2) {
            this.forgeHomePane.setVisible(false)
            this.forgeHomePane.setEnabled(false)
            this.upgradesPane.setVisible(true)
            this.upgradesPane.setEnabled(true)
            this.forgeStatsPane.setVisible(true)
            this.forgeStatsPane.setEnabled(true)
            this.initializeStatsHitboxes();
        }
    }

    initializeHomeHitboxes() {
        this.forgeHomePane.clearHitboxes();

        for (var i = 0; i < GemForger.gems.length; i++) {
            var gem = GemForger.gems[i];

            let gemContainer = this.forgeHomePane.addHitbox(new Hitbox(
                {
                    x: this.boundingBox.width * .1,
                    y: this.boundingBox.height * .24 + (this.boundingBox.height * .13 * i),
                    width: this.boundingBox.width * .75,
                    height: this.boundingBox.height * .13
                },
                {},
                "",
                "gemContainer" + gem.id
            ));
            gemContainer.render = function (boundingBox, gem) {
                let context = this.context;
                context.save();
                context.drawImage(
                    valueFrame,
                    boundingBox.x + (boundingBox.width * .25),
                    boundingBox.y + (boundingBox.height * .19),
                    boundingBox.width * .11,
                    boundingBox.height * .62
                );

                context.fillStyle = "#FFFFFF";
                fillTextShrinkToFit(
                    context,
                    gem.workload,
                    boundingBox.x + (boundingBox.width * .25),
                    boundingBox.y + (boundingBox.height * .6),
                    boundingBox.width * .11,
                    "center"
                );

                let message = _("{0}", formattedCountDown(gem.ticksRemaining * (2 - STAT.gemSpeedMultiplier())));
                let fillPercentage = 0;
                if (gem.workload > 0) {
                    message = _("{0}", formattedCountDown((gem.estimatedCraftTime - currentTime()) / 1000));
                    fillPercentage = (gem.ticksPerCraft - gem.ticksRemaining) / gem.ticksPerCraft;

                }

                let fillColor = "#7F7F7F";
                if (gem.missingIngredients) {
                    message = _("Missing Ingredients");
                    fillPercentage = 1;
                    fillColor = `rgba(255, 0, 0, ${0.5 + (0.5 * oscillate(currentTime(), 200))})`;
                }

                renderFancyProgressBar(
                    context,
                    message,
                    fillPercentage,
                    boundingBox.x + (boundingBox.width * .4),
                    boundingBox.y + (boundingBox.height * .2),
                    boundingBox.width * .7,
                    boundingBox.height * .6,
                    fillColor,
                    "#000000",
                    "#FFFFFF",
                    timerFrame
                );


                context.restore();
            }.bind(this, gemContainer.boundingBox, gem);

            var iconHeight = this.boundingBox.height * .13;
            var iconWidth = this.boundingBox.width * .1;
            var xCoordinate = this.boundingBox.width * .075;
            var yCoordinate = this.boundingBox.height * .23 + (iconHeight * i);
            var buttonPos = this.boundingBox.width * .1;

            let gemIcon = this.forgeHomePane.addHitbox(new Hitbox(
                {
                    x: xCoordinate,
                    y: yCoordinate,
                    width: iconWidth,
                    height: iconHeight
                },
                {
                    onmouseenter: function (gem) {
                        var forgeCountdown;
                        if (gem.workload > 0) {
                            forgeCountdown = formattedCountDown((gem.estimatedCraftTime - currentTime()) / 1000);
                        }
                        else {
                            forgeCountdown = formattedCountDown(gem.ticksRemaining * (2 - STAT.gemSpeedMultiplier()));
                        }
                        var tooltipDetails = generatePrettyBlueprintTooltip(gem.blueprint);
                        tooltipDetails.description = _("<b>Time:</b> {0}<br><b>Materials:</b><br>{1}",
                            forgeCountdown,
                            tooltipDetails.description)
                        showTooltip(tooltipDetails.title, tooltipDetails.description, mouseX, mouseY, 180);
                    }.bind(this, gem),
                    onmouseexit: function () {
                        hideTooltip();
                    }
                },
                'pointer',
                "gem" + gem.id + "Icon"
            ));
            gemIcon.render = function (boundingBox, gem) {
                let context = this.context;
                context.save();
                drawImageFitInBox(
                    context,
                    gem.getIcon(),
                    boundingBox.x,
                    boundingBox.y,
                    boundingBox.width,
                    boundingBox.height * .75
                );

                context.fillStyle = "#FFFFFF";
                context.font = (boundingBox.width * .25) + "px Verdana";
                fillTextShrinkToFit(
                    context,
                    gem.numOwned(),
                    boundingBox.x,
                    boundingBox.y + boundingBox.height * .875,
                    boundingBox.width,
                    "center"
                );
                context.restore();
            }.bind(this, gemIcon.boundingBox, gem);

            let addToGem = this.forgeHomePane.addHitbox(new Hitbox(
                {
                    x: xCoordinate + buttonPos + iconWidth / 2,
                    y: yCoordinate + iconHeight / 3,
                    width: iconWidth / 2,
                    height: iconHeight / 2
                },
                {
                    onmousedown: function (gem) {
                        this.mousingDownFunction = function () {
                            GemForger.addLoadToGem(gem.id)
                        }.bind(this, gem);
                        this.mousingDownFunction();
                        this.mousingDown = true;
                        this.mouseDownTime = currentTime();

                    }.bind(this, gem),
                    onmouseup: function () {
                        this.mousingDown = false;
                        this.mousingDownFunction = function () { };
                    }.bind(this)
                },
                'pointer',
                "addToGem" + gem.id
            ));
            addToGem.render = function (boundingBox, gem) {
                this.context.drawImage(btnIncrease, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
            }.bind(this, addToGem.boundingBox, gem);

            let subtractFromGem = this.forgeHomePane.addHitbox(new Hitbox(
                {
                    x: xCoordinate + buttonPos,
                    y: yCoordinate + iconHeight / 3,
                    width: iconWidth / 2,
                    height: iconHeight / 2
                },
                {
                    onmousedown: function (gem) {
                        this.mousingDownFunction = function () {
                            GemForger.addLoadToGem(gem.id, -1)
                        }.bind(this, gem);
                        this.mousingDownFunction();
                        this.mousingDown = true;
                        this.mouseDownTime = currentTime();

                    }.bind(this, gem),
                    onmouseup: function () {
                        this.mousingDown = false;
                        this.mousingDownFunction = function () { };
                    }.bind(this)
                },
                'pointer',
                "subtractFromGem" + gem.id
            ));
            subtractFromGem.render = function (boundingBox, gem) {
                this.context.drawImage(btnDecrease, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
            }.bind(this, subtractFromGem.boundingBox, gem);

        }
    }

    initializeUpgradesHitboxes() {
        this.upgradesPane.clearHitboxes();

        let upgrades = gemUpgradesManager.upgrades;
        let upgradesPerRow = Math.ceil(upgrades.length / 2);

        for (var i = 0; i < upgrades.length; i++) {
            let upgrade = upgrades[i];
            let row = Math.floor(i / upgradesPerRow);
            let column = i % upgradesPerRow;
            let upgradesThisRow = Math.min(upgradesPerRow, upgrades.length - (upgradesPerRow * row));

            let yPos = this.boundingBox.height * .125 + (this.boundingBox.height * .4 * row);
            let centeredXPos = (this.boundingBox.width - (this.boundingBox.width * .28 * upgradesThisRow)) / 2;
            let xPos = centeredXPos + (this.boundingBox.width * .28 * column);
            let cardWidth = this.boundingBox.width * .25;
            let cardHeight = this.boundingBox.height * .38;

            let upgradeContainer = this.upgradesPane.addHitbox(new Hitbox(
                {
                    x: xPos,
                    y: yPos,
                    width: cardWidth,
                    height: cardHeight
                },
                {},
                "",
                "upgradeContainer" + upgrade.id
            ));
            upgradeContainer.render = function (boundingBox, upgrade) {
                let context = this.context;
                context.save();

                let container = upgrade.canPurchase() ? forgeCardEnabled : forgeCardDisabled;
                context.drawImage(container, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);


                context.font = (this.boundingBox.height * .03) + "px Verdana";
                context.fillStyle = "#000000";
                fillTextShrinkToFit(context,
                    upgrade.name,
                    boundingBox.x + (boundingBox.width * .05),
                    boundingBox.y + (boundingBox.height * .1),
                    boundingBox.width * .9,
                    "center"
                );

                drawImageFitInBox(
                    context,
                    upgrade.icon,
                    boundingBox.x - (boundingBox.width * .33),
                    boundingBox.y + boundingBox.height * .13,
                    boundingBox.width,
                    boundingBox.height * .20
                );
                context.font = (this.boundingBox.height * .04) + "px Verdana";
                context.strokeStyle = "#000000";
                context.lineWidth = 5;
                strokeTextShrinkToFit(
                    context,
                    _("Level {0}", upgrade.level),
                    boundingBox.x + (boundingBox.width * .35),
                    boundingBox.y + (boundingBox.height * .28),
                    boundingBox.width * .6,
                    "center"
                );
                context.fillStyle = "#FFFFFF";
                fillTextShrinkToFit(
                    context,
                    _("Level {0}", upgrade.level),
                    boundingBox.x + (boundingBox.width * .35),
                    boundingBox.y + (boundingBox.height * .28),
                    boundingBox.width * .6,
                    "center"
                );
                fillTextWrapWithHeightLimit(
                    context,
                    upgrade.getDescription(),
                    boundingBox.x + (boundingBox.width * .075),
                    boundingBox.y + (boundingBox.height * .45),
                    boundingBox.width * .85,
                    boundingBox.height * .35,
                    "center"
                );

                let upgradeText = upgrade.canPurchase() ? _("Upgrade") : upgrade.isMaxLevel() ? _("Max Level") : _("Missing Ingredients");

                strokeTextShrinkToFit(
                    context,
                    upgradeText,
                    boundingBox.x + (boundingBox.width * .075),
                    boundingBox.y + (boundingBox.height * .9),
                    boundingBox.width * .85,
                    "center"
                );

                fillTextShrinkToFit(
                    context,
                    upgradeText,
                    boundingBox.x + (boundingBox.width * .075),
                    boundingBox.y + (boundingBox.height * .9),
                    boundingBox.width * .85,
                    "center"
                );

                context.restore();
            }.bind(this, upgradeContainer.boundingBox, upgrade);

            let tooltip = function (upgrade) {
                var tooltipDetails = {
                    "title": upgrade.name,
                    "description": generateHtmlForIngredients(upgrade.getIngredients(upgrade.level + 1))
                };
                tooltipDetails.description = upgrade.isMaxLevel() ? _("Max Level") : _("<br>Next Level:<br>{0}<br><br>Materials:</b><br>{1}", upgrade.getDescription(upgrade.level + 1), tooltipDetails.description)
                showTooltip(tooltipDetails.title, tooltipDetails.description, mouseX, mouseY, 180);
            }

            let upgradeButton = this.upgradesPane.addHitbox(new Hitbox(
                {
                    x: xPos + (cardWidth * .05),
                    y: yPos + (cardHeight * .8),
                    width: cardWidth * .9,
                    height: cardWidth * .2
                },
                {
                    onmousedown: function (upgrade) {

                        this.mousingDownFunction = function () {
                            if (upgrade.canPurchase()) {
                                upgrade.purchase();
                                hideTooltip();
                                tooltip(upgrade);
                            }
                        }.bind(this, upgrade);
                        this.mousingDownFunction();
                        this.mousingDown = true;
                        this.mouseDownTime = currentTime();
                    }.bind(this, upgrade),
                    onmouseup: function () {
                        this.mousingDown = false;
                        this.mousingDownFunction = function () { };
                    }.bind(this),
                    onmouseenter: function (upgrade) {
                        tooltip(upgrade);
                    }.bind(this, upgrade),
                    onmouseexit: function () {
                        hideTooltip();
                    }
                },
                'pointer',
                "upgradeButton" + upgrade.id
            ));
        }
    }

    initializeStatsHitboxes() {
        this.forgeStatsPane.clearHitboxes();
    }

    render() {
        //This is giga jank but it works
        //I wanted to be able to add workload while holding down the mouse button
        let timeSinceMouseDown = currentTime() - this.mouseDownTime;
        if (this.mousingDown && timeSinceMouseDown > 500) {
            let loops = Math.floor(timeSinceMouseDown / 1000);
            for (var i = 0; i < loops + 1; i++) {
                this.mousingDownFunction();
            }
        }

        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render();
        this.renderChildren();

        if (this.currentTabIndex == 0) {
            this.context.save();
            this.context.fillStyle = "#FFFFFF";
            this.context.strokeStyle = "#000000";
            this.context.textBaseline = "bottom";
            this.context.lineWidth = 3;

            //Titles

            this.context.drawImage(
                valueFrame,
                this.boundingBox.width * .289,
                this.boundingBox.height * .15,
                this.boundingBox.width * .08,
                this.boundingBox.height * .08
            );

            this.context.font = this.boundingBox.width * .03 + "px Verdana";
            var currentlWorkloadText = GemForger.currentMaxLoad() - GemForger.currentLoad();
            this.context.lineWidth = 3;
            this.context.strokeStyle = "#000000";

            strokeTextWrapWithHeightLimit(
                this.context,
                _("Remaining Workload"),
                this.boundingBox.width * .15,
                this.boundingBox.height * .18,
                this.boundingBox.width * .125,
                this.boundingBox.height * .08
            )

            fillTextWrapWithHeightLimit(
                this.context,
                _("Remaining Workload"),
                this.boundingBox.width * .15,
                this.boundingBox.height * .18,
                this.boundingBox.width * .125,
                this.boundingBox.height * .08
            )

            fillTextShrinkToFit(
                this.context,
                currentlWorkloadText,
                this.boundingBox.width * .289,
                this.boundingBox.height * .21,
                this.boundingBox.width * .08,
                "center"
            );

            strokeTextShrinkToFit(
                this.context,
                _("Time Remaining"),
                this.boundingBox.width * .37,
                this.boundingBox.height * .22,
                this.boundingBox.width * .6,
                "center"
            );

            fillTextShrinkToFit(
                this.context,
                _("Time Remaining"),
                this.boundingBox.width * .37,
                this.boundingBox.height * .22,
                this.boundingBox.width * .6,
                "center"
            );

            this.context.font = "15px Verdana";

            this.context.restore();
            // this.context.drawImage(forgedRedGem, 0, 0, forgedRedGem.width, forgedRedGem.height, this.boundingBox.width * .20, this.boundingBox.height * .475, this.boundingBox.width * .1, this.boundingBox.height * .125);
            // var craftButtonImage = GemForger.canQueueGem(RED_FORGED_GEM_INDEX) ? craftb : craftbg;
            // renderButton(this.context, craftButtonImage, _("CRAFT RED GEM"), this.boundingBox.width * .15, this.boundingBox.height * .60, this.boundingBox.width * .20, this.boundingBox.height * .05, "11px Verdana", "#000000");

            // craftButtonImage = GemForger.canQueueGem(BLUE_FORGED_GEM_INDEX) ? craftb : craftbg;
            // this.context.drawImage(forgedBlueGem, 0, 0, forgedBlueGem.width, forgedBlueGem.height, this.boundingBox.width * .45, this.boundingBox.height * .475, this.boundingBox.width * .1, this.boundingBox.height * .125);
            // renderButton(this.context, craftButtonImage, _("CRAFT BLUE GEM"), this.boundingBox.width * .40, this.boundingBox.height * .60, this.boundingBox.width * .20, this.boundingBox.height * .05, "11px Verdana", "#000000");

            // craftButtonImage = GemForger.canQueueGem(GREEN_FORGED_GEM_INDEX) ? craftb : craftbg;
            // this.context.drawImage(forgedGreenGem, 0, 0, forgedGreenGem.width, forgedGreenGem.height, this.boundingBox.width * .70, this.boundingBox.height * .475, this.boundingBox.width * .1, this.boundingBox.height * .125);
            // renderButton(this.context, craftButtonImage, _("CRAFT GREEN GEM"), this.boundingBox.width * .65, this.boundingBox.height * .60, this.boundingBox.width * .20, this.boundingBox.height * .05, "11px Verdana", "#000000");

            // craftButtonImage = GemForger.canQueueGem(PURPLE_FORGED_GEM_INDEX) ? craftb : craftbg;
            // this.context.drawImage(forgedPurpleGem, 0, 0, forgedPurpleGem.width, forgedPurpleGem.height, this.boundingBox.width * .2, this.boundingBox.height * .68, this.boundingBox.width * .1, this.boundingBox.height * .125);
            // renderButton(this.context, craftButtonImage, _("CRAFT PURPLE GEM"), this.boundingBox.width * .15, this.boundingBox.height * .805, this.boundingBox.width * .20, this.boundingBox.height * .05, "11px Verdana", "#000000");

            // craftButtonImage = GemForger.canQueueGem(YELLOW_FORGED_GEM_INDEX) ? craftb : craftbg;
            // this.context.drawImage(forgedYellowGem, 0, 0, forgedYellowGem.width, forgedYellowGem.height, this.boundingBox.width * .45, this.boundingBox.height * .68, this.boundingBox.width * .1, this.boundingBox.height * .125);
            // renderButton(this.context, craftButtonImage, _("CRAFT YELLOW GEM"), this.boundingBox.width * .4, this.boundingBox.height * .805, this.boundingBox.width * .20, this.boundingBox.height * .05, "11px Verdana", "#000000");
        }
        else if (this.currentTabIndex == 2) {
            this.context.save();
            this.context.fillStyle = "#FFFFFF";
            this.context.strokeStyle = "#000000";
            this.context.textBaseline = "bottom";
            this.context.lineWidth = 3;

            if (!GemForger.gemForgeStructure.isAtMaxLevel()) {
                var headerText = _("CURRENT");
                var levelText = _("Forge Level: {0}", gemForgeStructure.level);
                var statsText = _("Forge Max Workload: {0}", GemForger.currentMaxLoad());
                this.context.font = "bold 20px Verdana";
                strokeTextShrinkToFit(this.context, headerText, this.boundingBox.width * .08, this.boundingBox.height * .2, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, headerText, this.boundingBox.width * .08, this.boundingBox.height * .2, this.boundingBox.width * .38, "center");
                this.context.font = "20px Verdana";
                strokeTextShrinkToFit(this.context, levelText, this.boundingBox.width * .08, this.boundingBox.height * .27, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, levelText, this.boundingBox.width * .08, this.boundingBox.height * .27, this.boundingBox.width * .38, "center");
                strokeTextShrinkToFit(this.context, statsText, this.boundingBox.width * .08, this.boundingBox.height * .34, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, statsText, this.boundingBox.width * .08, this.boundingBox.height * .34, this.boundingBox.width * .38, "center");

                var headerText = _("NEXT LEVEL");
                var levelText = _("Forge Level: {0}", gemForgeStructure.level + 1);
                var statsText = _("Forge Max Workload: {0}", GemForger.currentMaxLoad() + GemForger.levelUpWorkloadIncrease());
                this.context.font = "bold 20px Verdana";
                strokeTextShrinkToFit(this.context, headerText, this.boundingBox.width * .5, this.boundingBox.height * .2, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, headerText, this.boundingBox.width * .5, this.boundingBox.height * .2, this.boundingBox.width * .38, "center");
                this.context.font = "20px Verdana";
                strokeTextShrinkToFit(this.context, levelText, this.boundingBox.width * .5, this.boundingBox.height * .27, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, levelText, this.boundingBox.width * .5, this.boundingBox.height * .27, this.boundingBox.width * .38, "center");
                strokeTextShrinkToFit(this.context, statsText, this.boundingBox.width * .5, this.boundingBox.height * .34, this.boundingBox.width * .38, "center");
                fillTextShrinkToFit(this.context, statsText, this.boundingBox.width * .5, this.boundingBox.height * .34, this.boundingBox.width * .38, "center");
            }
            else {
                var forgeLevelText = _("You Are At the Max Level");
                strokeTextShrinkToFit(this.context, forgeLevelText, 0, this.boundingBox.height * .4, this.boundingBox.width, "center");
                fillTextShrinkToFit(this.context, forgeLevelText, 0, this.boundingBox.height * .4, this.boundingBox.width, "center");
            }

            this.context.restore();
        }
    }

}