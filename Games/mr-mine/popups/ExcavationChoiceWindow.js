class ExcavationChoiceWindow extends TabbedPopupWindow {

    layerName = "ExcavationChoice"; // Used as key in activeLayers
    domElementId = "EXCHOICED"; // ID of dom element that gets shown or hidden
    context = EXCHOICE;         // Canvas rendering context for popup

    excavationChoicePane;
    scientist;
    scientistIndex;
    scrollValue

    constructor(boundingBox, scientist, index, scrollValue) {
        super(boundingBox); // Need to call base class constructor
        if (!boundingBox) {
            this.setBoundingBox();
        }

        this.initializeTabs();
        this.backgroundImage = scientistbg;
        this.scientist = scientist;
        this.scientistIndex = index;
        this.scrollValue = scrollValue;

        this.excavationChoicePane = new Hitbox(
            {
                x: this.bodyContainer.boundingBox.x,
                y: this.bodyContainer.boundingBox.y,
                width: this.bodyContainer.boundingBox.width,
                height: this.bodyContainer.boundingBox.height
            },
            {},
            "default",
            "excavationChoicePane"
        );
        this.excavationChoicePane.allowBubbling = true;
        this.addHitbox(this.excavationChoicePane);
        this.initializeHitboxes();
    }

    initializeHitboxes() {
        var scientistIndex = this.scientistIndex;
        this.excavationChoicePane.clearHitboxes();

        var rewardOption1Icon = new Hitbox(
            {
                x: this.excavationChoicePane.boundingBox.width * 0.25 - (this.excavationChoicePane.boundingBox.width * .15) / 2,
                y: this.excavationChoicePane.boundingBox.height * .4,
                width: this.excavationChoicePane.boundingBox.width * .15,
                height: this.excavationChoicePane.boundingBox.height * .225
            },
            {
                onmouseenter: function () {
                    if (firstOpenScientistSlot() > scientistIndex && !isOnActiveExcavation(scientistIndex)) {

                        var isRewardShown = currentScientists.choices[scientistIndex][0][3];
                        var rewardId = currentScientists.choices[scientistIndex][0][4];
                        var rewardStaticData = excavationRewards[rewardId];
                        var rewardName = rewardStaticData.name;
                        var rewardDescription = getRewardDescription(rewardId, scientistIndex);

                        if (isRewardShown || displayHiddenExcavations) {
                            showTooltip(rewardName, rewardDescription);
                            this.cursor = 'pointer';
                        } else {
                            showTooltip("???", "Unknown");
                            this.cursor = 'pointer';
                        }
                    }
                },
                onmouseexit: function () {
                    hideTooltip();
                }
            },
            "default",
            "rewardOption1Icon"
        );

        var rewardOption2Icon = new Hitbox(
            {
                x: this.excavationChoicePane.boundingBox.width * 0.75 - (this.excavationChoicePane.boundingBox.width * .15) / 2,
                y: this.excavationChoicePane.boundingBox.height * .4,
                width: this.excavationChoicePane.boundingBox.width * .15,
                height: this.excavationChoicePane.boundingBox.height * .225
            },
            {
                onmouseenter: function () {
                    if (firstOpenScientistSlot() > scientistIndex && !isOnActiveExcavation(scientistIndex)) {

                        var isRewardShown = currentScientists.choices[scientistIndex][1][3];
                        var rewardId = currentScientists.choices[scientistIndex][1][4];
                        var rewardStaticData = excavationRewards[rewardId];
                        var rewardName = rewardStaticData.name;
                        var rewardDescription = getRewardDescription(rewardId, scientistIndex);

                        if (isRewardShown || displayHiddenExcavations) {
                            showTooltip(rewardName, rewardDescription);
                            this.cursor = 'pointer';
                        } else {
                            showTooltip("???", "Unknown");
                            this.cursor = 'pointer';
                        }
                    }
                },
                onmouseexit: function () {
                    hideTooltip();
                }
            },
            "default",
            "rewardOption2Icon"
        );


        var leftStartButton = new Hitbox(
            {
                x: rewardOption1Icon.boundingBox.x + rewardOption1Icon.boundingBox.width * .5 - this.boundingBox.width * .10,
                y: rewardOption1Icon.boundingBox.y + rewardOption1Icon.boundingBox.height + this.boundingBox.height * .06,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function () {
                    if (!isOnActiveExcavation(scientistIndex) && !isScientistDead(scientistIndex)) {
                        startExcavation(scientistIndex, 0);
                    }
                    playClickSound();
                    openUi(ScientistsWindow);
                },
                onmouseenter: function () {
                    if (!isOnActiveExcavation(scientistIndex) && !isScientistDead(scientistIndex)) {
                        this.cursor = 'pointer';
                    }
                }
            },
            "default",
            "leftStartButton"
        );

        var rightStartButton = new Hitbox(
            {
                x: rewardOption2Icon.boundingBox.x + rewardOption2Icon.boundingBox.width * .5 - this.boundingBox.width * .10,
                y: rewardOption2Icon.boundingBox.y + rewardOption2Icon.boundingBox.height + this.boundingBox.height * .06,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function () {
                    if (!isOnActiveExcavation(scientistIndex)) {
                        startExcavation(scientistIndex, 1);
                    }
                    playClickSound();
                    openUi(ScientistsWindow);

                },
                onmouseenter: function () {
                    if (!isOnActiveExcavation(scientistIndex)) {
                        this.cursor = 'pointer';
                    }
                }
            },
            "default",
            "rightStartButton"
        );

        var rerollButton = new Hitbox(
            {
                x: this.excavationChoicePane.boundingBox.width * .5 - this.excavationChoicePane.boundingBox.width * .3 / 2,
                y: this.excavationChoicePane.boundingBox.height * .86,
                width: this.excavationChoicePane.boundingBox.width * .3,
                height: this.excavationChoicePane.boundingBox.height * .075
            },
            {
                onmousedown: function () {
                    confirmRerollExcavations(scientistIndex);
                    playClickSound();
                },
                onmouseenter: function () {
                    showTooltip(_("Refresh Excavations"), _("Pay 1 ticket to get two new excavation options"));
                    this.cursor = 'pointer';
                },
                onmouseexit: function () {
                    hideTooltip();
                }
            },
            "default",
            "rerollButton"
        );

        var backButton = new Hitbox(
            {
                x: this.excavationChoicePane.boundingBox.x,
                y: this.excavationChoicePane.boundingBox.height * .03,
                width: this.excavationChoicePane.boundingBox.height * .12,
                height: this.excavationChoicePane.boundingBox.height * .12
            },
            {
                onmousedown: function () {
                    playClickSound();
                    openUi(ScientistsWindow);
                },
                onmouseenter: function () {
                    this.cursor = 'pointer';
                }
            },
            "default",
            "backButton"
        );


        var context = this.context;

        var offset = this.excavationChoicePane.boundingBox.x;
        var offsetY = this.excavationChoicePane.boundingBox.y;

        //Render Functions
        rewardOption1Icon.render = () => {
            this.renderChoise(rewardOption1Icon, 0);
        }
        rewardOption2Icon.render = () => {
            this.renderChoise(rewardOption2Icon, 1);
        }
        leftStartButton.render = () => {
            renderButton(context, craftb, _("SELECT"), offset + leftStartButton.boundingBox.x, offsetY + leftStartButton.boundingBox.y, leftStartButton.boundingBox.width, leftStartButton.boundingBox.height, "14px Verdana", "#000000");

        }
        rightStartButton.render = () => {
            renderButton(context, craftb, _("SELECT"), offset + rightStartButton.boundingBox.x, offsetY + rightStartButton.boundingBox.y, rightStartButton.boundingBox.width, rightStartButton.boundingBox.height, "14px Verdana", "#000000");

        }
        rerollButton.render = () => {
            renderButton(context, craftb, _("REFRESH"), offset + rerollButton.boundingBox.x, offsetY + rerollButton.boundingBox.y, rerollButton.boundingBox.width, rerollButton.boundingBox.height, "14px Verdana", "#000000");
        }
        backButton.render = () => {
            drawImageFitInBox(context, backGreenButton, offset + backButton.boundingBox.x, offsetY + backButton.boundingBox.y, backButton.boundingBox.width, backButton.boundingBox.height);
        }

        this.excavationChoicePane.addHitbox(rewardOption1Icon);
        this.excavationChoicePane.addHitbox(rewardOption2Icon);
        this.excavationChoicePane.addHitbox(leftStartButton);
        this.excavationChoicePane.addHitbox(rightStartButton);
        this.excavationChoicePane.addHitbox(rerollButton);
        this.excavationChoicePane.addHitbox(backButton);
    }

    renderChoise(rewardIcon, i) {
        var scientistIndex = this.scientistIndex;
        var staticScientist = scientists[currentScientists.scientists[scientistIndex][0]];

        var excavationChoice = currentScientists.choices[scientistIndex][i];
        var excavationStaticData = excavations[excavationChoice[0]];
        var excavationName = excavationStaticData.names[excavationChoice[5]];
        var deathChance = Math.max(0, Math.round(excavationChoice[2] * staticScientist.deathChanceMultiple * STAT.increasedExcavationSuccessRatePercent()));
        var difficultyText = excavationStaticData.difficulty;
        var isRewardShown = excavationChoice[3];
        var rewardId = excavationChoice[4];
        var excavationDurationMinutes = excavationChoice[1];
        var rewardStaticData = excavationRewards[rewardId];
        var rewardImageRenderFunction = rewardStaticData.renderFunction;
        var rewardName = rewardStaticData.name;

        var offset = this.excavationChoicePane.boundingBox.x;
        var offsetY = this.excavationChoicePane.boundingBox.y;
        var paneSection = this.excavationChoicePane.boundingBox.width * 0.5;

        this.context.drawImage(frame_large, offset + rewardIcon.boundingBox.x - rewardIcon.boundingBox.width * 0.05, offsetY + rewardIcon.boundingBox.y - rewardIcon.boundingBox.height * 0.05, rewardIcon.boundingBox.width * 1.12, rewardIcon.boundingBox.height * 1.12);

        //render the choice
        this.context.font = "bold 14px Verdana";
        this.context.fillStyle = this.getDifficultyColor(difficultyText);
        fillTextShrinkToFit(this.context, excavationName, offset + paneSection * i, this.boundingBox.height * .3, paneSection, "center");
        this.context.font = "14px Verdana";
        this.context.fillStyle = "#FFFFFF";
        fillTextShrinkToFit(this.context, _("Death Chance: {0}", deathChance + "%"), offset + paneSection * i, this.boundingBox.height * .35, paneSection, "center");
        var durationText = _("Duration") + ": " + formattedCountDown(excavationDurationMinutes * 60);
        fillTextShrinkToFit(this.context, durationText, offset + paneSection * i, this.boundingBox.height * .4, paneSection, "center");
        if (isRewardShown || displayHiddenExcavations) {
            let previousFillStyle = this.context.fillStyle;
            this.context.fillStyle = "rgba(255, 255, 255, 0.1)";
            this.context.fillRect(offset + rewardIcon.boundingBox.x, offsetY + rewardIcon.boundingBox.y, rewardIcon.boundingBox.width, rewardIcon.boundingBox.height);
            this.context.fillStyle = previousFillStyle;

            rewardImageRenderFunction(this.context, rewardId, offset + rewardIcon.boundingBox.x, offsetY + rewardIcon.boundingBox.y, rewardIcon.boundingBox.width, rewardIcon.boundingBox.height);

            var tempFont = this.context.font;
            this.context.font = "14px Verdana";
            if (language == "german") this.context.font = "11px Verdana";
            var rewardText = _("Reward") + ": " + rewardName;
            if (language == "german") rewardText = rewardName;
            fillTextShrinkToFit(this.context, rewardText, offset + paneSection * i, offsetY + rewardIcon.boundingBox.y + rewardIcon.boundingBox.height * 1.25, paneSection, "center");
            this.context.font = tempFont;
        }
        else {
            let previousFillStyle = this.context.fillStyle;
            this.context.fillStyle = "rgba(255, 255, 255, 0.1)";
            this.context.fillRect(offset + rewardIcon.boundingBox.x, offsetY + rewardIcon.boundingBox.y, rewardIcon.boundingBox.width, rewardIcon.boundingBox.height);
            this.context.fillStyle = previousFillStyle;

            this.context.fillText("???", offset + rewardIcon.boundingBox.x + rewardIcon.boundingBox.width * .5 - this.context.measureText("???").width / 2, offsetY + rewardIcon.boundingBox.y + rewardIcon.boundingBox.height * .5);
            var tempFont = this.context.font;
            this.context.font = "14px Verdana";
            var rewardText = _("Reward") + ": ???";
            this.context.fillText(rewardText, offset + rewardIcon.boundingBox.x + rewardIcon.boundingBox.width * 0.5 - this.context.measureText(rewardText).width / 2, offsetY + rewardIcon.boundingBox.y + rewardIcon.boundingBox.height * 1.25);
            this.context.font = tempFont;
        }
    }

    getRarityColor(rarity) {
        if (rarity == scientistRarities.common) return "#38b53a";
        else if (rarity == scientistRarities.uncommon) return "#008dd9";
        else if (rarity == scientistRarities.rare) return "#9c2828";
        else if (rarity == scientistRarities.legendary) return "#ebab34";
        else if (rarity == scientistRarities.warped) return (quality == 1) ? "#000000" : "#ffffff";
        else if (rarity == scientistRarities.warpedPlus) return (quality == 1) ? "#000000" : "#ffffff";
        else if (rarity == scientistRarities.warpedPlusPlus) return (quality == 1) ? "#000000" : "#ffffff";
    }

    getDifficultyColor(difficulty) {
        if (difficulty == _("Easy")) return "#46eb49";
        else if (difficulty == _("Medium")) return "#ecf759";
        else if (difficulty == _("Hard")) return "#fc8608";
        else if (difficulty == _("Nightmare")) return "#d1000a";
    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        this.context.restore();
        super.render(); // Render any child layers

        this.context.font = "24px Verdana";
        this.context.fillStyle = "#FFFFFF";
        fillTextShrinkToFit(this.context, _("CHOOSE AN EXCAVATION"), this.boundingBox.width * .2, this.boundingBox.height * .2, this.boundingBox.width * .6, "center", 0, false, true);


        this.excavationChoicePane.renderChildren();

    }
}
