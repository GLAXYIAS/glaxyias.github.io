class UpgradeLevelsWindow extends TabbedPopupWindow {
    layerName = "UpgradeLevelsWindow"; // Used as key in activeLayers
    domElementId = "ULD";
    context = UL; // Ensure this context is defined appropriately

    isRendered = true;
    isPopup = true;
    allowBubbling = true;

    constructor(boundingBox, upgradable, upgradableType) {
        super(boundingBox);
        if (!boundingBox) {
            this.setBoundingBox();
        }

        this.upgradable = upgradable;
        this.upgradableType = upgradableType;

        this.initializeTabs();
        this.initializeValues();
        this.initializeHitboxes();
    }

    initializeValues() {
        if (this.upgradable) {
            this.upgradableLevel = this.upgradable.level;
            this.upgradableMaxLevel = this.upgradable.maxLevel;

            if (this.upgradableType == "superMiner") {
                this.upgradableName = this.upgradable.name;
                this.upgradableIcon = this.upgradable.portrait;
            }
            else if (this.upgradableType == "equip") {
                this.upgradableName = this.upgradable.translatedName;
                this.upgradableIcon = this.upgradable.icon;
            }
        }
    }

    initializeHitboxes() {
        this.returnButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.05,
                y: this.boundingBox.height * 0.13,
                width: this.boundingBox.width * 0.07,
                height: this.boundingBox.width * 0.07
            },
            {
                onmousedown: function () {
                    if (this.upgradable) {
                        if (this.upgradableType == "superMiner") {
                            openUi(SuperMinerWindow, null, this.upgradable);
                        }
                        else if (this.upgradableType == "equip") {
                            openUi(EquipWindow, null, this.upgradable);
                        }
                    }
                }.bind(this)
            },
            'pointer',
            "returnButton"
        ));

        this.levelsScrollbox = this.addHitbox(new Scrollbox(
            this.boundingBox.width * 0.9,
            1000,
            this.context,
            this.boundingBox.width * 0.04,
            this.boundingBox.height * 0.45,
            this.boundingBox.width * 0.9,
            this.boundingBox.height * 0.45,
            15
        ));

        let scrollY = 0;

        for (i = 0; i < this.upgradableMaxLevel; i++) {
            let level = i + 1;
            let boundingBox = this.levelsScrollbox.boundingBox;
            let yPos = boundingBox.height * (i * .3);
            let hitbox = new Hitbox(
                {
                    x: boundingBox.width * .075,
                    y: yPos,
                    width: boundingBox.width * .9,
                    height: boundingBox.height * .3
                },
                {},
                '',
                "levelInfo" + level
            );

            if (level == this.upgradableLevel) scrollY = yPos;

            hitbox.render = function (upgradable, upgradableType, upgradableLevel) {
                let context = this.parent.context;
                context.save();
                if (level < upgradableLevel) {
                    renderRoundedRectangle(context, this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height * .9, 10, "#000000", "rgba(0,0,0,0.5)", 1);
                    context.fillStyle = "#808080";
                }
                else if (level == upgradableLevel) {
                    renderRoundedRectangle(context, this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height * .9, 10, "#00CC33", "rgba(0,0,0,0.5)", 1);
                    context.fillStyle = "#FFFFFF";
                }
                else {
                    renderRoundedRectangle(context, this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height * .9, 10, "#FFFFFF", "rgba(0,0,0,0.5)", 1);
                    context.fillStyle = "#FFFFFF";
                }

                context.font = `bold ${this.boundingBox.height * .5}px KanitB`;
                fillTextShrinkToFit(context, _("Lvl. {0} -", level), this.boundingBox.width * .1, this.boundingBox.y + this.boundingBox.height * .55, this.boundingBox.width * .2, "left", false, false, true);

                if (upgradableType == "equip") {
                    upgradable.drawDescriptionForLevel(context, this.boundingBox.width * .32, this.boundingBox.y + this.boundingBox.height * .55, this.boundingBox.width * .75, level);
                }
                else if (upgradableType == "superMiner") {
                    fillTextShrinkToFit(context, upgradable.getShortDescriptionForLevel(level), this.boundingBox.width * .32, this.boundingBox.y + this.boundingBox.height * .55, this.boundingBox.width * .75, "left");
                }

                context.restore();
            }.bind(hitbox, this.upgradable, this.upgradableType, this.upgradableLevel);

            this.levelsScrollbox.addHitbox(hitbox);
        }

        this.levelsScrollbox.contentHeight = this.levelsScrollbox.boundingBox.height * (this.upgradableMaxLevel * .3);
        this.levelsScrollbox.scrollTo(scrollY);

        this.returnButton.render = function () {
            let context = this.parent.context;
            context.save();
            drawImageFitInBox(
                context,
                backGreenButton,
                this.boundingBox.x,
                this.boundingBox.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
            context.restore();
        }
    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render();

        renderRoundedRectangle(
            this.context,
            this.boundingBox.width * .15,
            this.boundingBox.height * .13,
            this.boundingBox.width * .7,
            this.boundingBox.height * .3,
            10,
            "#000000",
            "rgba(0,0,0,0.5)"
        );

        //Icon
        drawImageFitInBox(
            this.context,
            this.upgradableIcon,
            this.boundingBox.width * .175,
            this.boundingBox.height * .15,
            this.boundingBox.width * .2,
            this.boundingBox.width * .2
        );

        //Name and Level
        this.context.fillStyle = "#FFFFFF";
        this.context.font = `bold ${this.boundingBox.height * .05}px KanitB`;
        fillTextShrinkToFit(this.context, this.upgradableName + " - " + _("Lvl. {0} / {1}", this.upgradableLevel, this.upgradableMaxLevel), this.boundingBox.width * .4, this.boundingBox.height * .2, this.boundingBox.width * .45, "left", false, false, true);

        if (this.upgradableLevel < this.upgradableMaxLevel) {
            fillTextShrinkToFit(
                this.context,
                _("Next Level:"),
                this.boundingBox.width * .4,
                this.boundingBox.height * .33,
                this.boundingBox.width * .45,
                "left"
            );
        }
        else {
            fillTextShrinkToFit(
                this.context,
                _("Max Level"),
                this.boundingBox.width * .4,
                this.boundingBox.height * .33,
                this.boundingBox.width * .45,
                "left"
            );
        }

        if (this.upgradableType == "equip") {
            this.upgradable.drawShortDescription(
                this.context,
                this.boundingBox.width * .4,
                this.boundingBox.height * .27,
                this.boundingBox.width * .45,
                this.boundingBox.height * .1
            );

            if (this.upgradableLevel < this.upgradableMaxLevel) {
                this.upgradable.drawDescriptionForLevel(
                    this.context,
                    this.boundingBox.width * .4,
                    this.boundingBox.height * .39,
                    this.boundingBox.width * .45,
                    this.upgradableLevel + 1
                );
            }
        }
        else if (this.upgradableType == "superMiner") {
            fillTextShrinkToFit(
                this.context,
                this.upgradable.getShortDescriptionForLevel(this.upgradableLevel),
                this.boundingBox.width * .4,
                this.boundingBox.height * .27,
                this.boundingBox.width * .45,
                "left"
            );

            if (this.upgradableLevel < this.upgradableMaxLevel) {
                fillTextShrinkToFit(
                    this.context,
                    this.upgradable.getShortDescriptionForLevel(this.upgradableLevel + 1),
                    this.boundingBox.width * .4,
                    this.boundingBox.height * .39,
                    this.boundingBox.width * .45,
                    "left"
                );
            }
        }

        this.context.restore();

    }

}