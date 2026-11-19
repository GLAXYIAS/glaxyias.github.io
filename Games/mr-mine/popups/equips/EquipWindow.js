class EquipWindow extends PopupWindow {
    layerName = "equipWindow"; // Used as key in activeLayers
    domElementId = "SMSD";
    context = SMS;

    isRendered = true;
    isPopup = true;
    allowBubbling = true;


    constructor(boundingBox, equip) {
        super(boundingBox); // Need to call base class constructor

        this.equip = equip;
        this.bg = equip.rarity.largeFrame
        this.lastAnimation = 0;

        this.setBoundingBox();
        var oldBoundingBox = {
            x: this.boundingBox.x,
            y: this.boundingBox.y,
            width: this.boundingBox.width,
            height: this.boundingBox.height
        };
        this.boundingBox.height = oldBoundingBox.height * 0.75;
        this.boundingBox.y = (oldBoundingBox.height - this.boundingBox.height) / 2;
        this.boundingBox.width = equip.rarity.largeFrame.width * this.boundingBox.height / equip.rarity.largeFrame.height;
        this.boundingBox.x = (oldBoundingBox.width - this.boundingBox.width) / 2;
        this.initHitboxes();
    }

    initHitboxes() {
        this.closeButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.9,
                y: 0,
                width: this.boundingBox.width * 0.1,
                height: this.boundingBox.height * 0.065
            },
            {
                onmousedown: function () {
                    openUi(EquipsWindow);
                    hideTooltip();
                }
            },
            'pointer',
            "closeButton",
            true,
            true
        ));

        this.infoButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.85,
                y: this.boundingBox.height * 0.575,
                width: this.boundingBox.width * 0.1,
                height: this.boundingBox.width * 0.1
            },
            {
                onmousedown: () => {
                    openUi(UpgradeLevelsWindow, null, this.equip, "equip");
                },
                onmouseenter: () => {
                    let coords = this.getGlobalCoordinates(this.boundingBox.width * 0.58, this.boundingBox.height * 0.48);
                    showTooltip("Upgrades", '', coords.x, coords.y);
                },
                onmouseexit: () => {
                    hideTooltip();
                }
            },
            'pointer',
            "infoButton"
        ));

        this.levelUpButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.2,
                y: this.boundingBox.height * 0.573,
                width: this.boundingBox.width * 0.6,
                height: this.boundingBox.height * 0.075
            },
            {
                onmousedown: () => {
                    if (this.equip.canLevel()) {
                        showConfirmationPrompt(
                            _("Level up {0} for {1} Weapon Scrap", this.equip.translatedName, this.equip.getLevelCost()),
                            _("Yes"),
                            () => {
                                if (this.equip.canLevel()) {
                                    this.equip.levelUp()
                                }
                            },
                            _("No")
                        )
                    }
                }
            },
            'pointer',
            "levelUpButton",
            true,
            true
        ));
    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);

        // drawColoredRect(this.context, 0, 0, mainw, mainh, "#000000", 0.5);
        this.context.font = (this.boundingBox.height * 0.05) + "px KanitB";
        this.context.lineWidth = 6;

        let rarity = this.equip.rarity.name;
        let icon = this.equip.icon;

        let popupWidth = this.boundingBox.width;
        let popupHeight = this.boundingBox.height;
        let popupX = this.boundingBox.x;
        let popupY = this.boundingBox.y;
        let xOffset = popupX;
        let yOffset = popupY;

        //background
        this.context.drawImage(this.bg, popupX, popupY, popupWidth, popupHeight);

        //**********************
        //Foreground stuff below
        //**********************

        //name
        this.context.lineWidth = 6;
        this.context.fillStyle = "#FFFFFF";
        strokeTextShrinkToFit(this.context, this.equip.name, xOffset + this.boundingBox.width * 0.05, popupY + (popupHeight * .055), popupWidth * .6, "left");
        this.context.strokeStyle = "#000000";
        fillTextShrinkToFit(this.context, this.equip.name, xOffset + this.boundingBox.width * 0.05, popupY + (popupHeight * .055), popupWidth * .6, "left");

        //info button
        drawImageFitInBox(
            this.context,
            middleSMButton,
            xOffset + popupWidth * 0.85,
            yOffset + popupHeight * 0.575,
            popupWidth * 0.1,
            popupWidth * 0.1,
            "center"
        );
        drawImageFitInBox(
            this.context,
            levelSMIcon,
            xOffset + popupWidth * 0.85,
            yOffset + popupHeight * 0.575,
            popupWidth * 0.1,
            popupWidth * 0.1,
            "center"
        );


        //level
        this.context.fillStyle = "#000000";
        fillTextShrinkToFit(this.context, _("Lvl. {0}", this.equip.level), xOffset, popupY + (popupHeight * .055), popupWidth * .83, "right");

        //icon
        drawImageFitInBox(
            this.context,
            icon,
            xOffset + popupWidth * 0.2,
            yOffset + popupHeight * 0.101,
            popupWidth * 0.585,
            popupHeight * 0.403,
            "center",
            "bottom"
        );

        //rarity
        this.context.font = (this.boundingBox.height * 0.025) + "px KanitB";
        this.context.strokeStyle = "#FFFFFF";
        this.context.lineWidth = 2;
        strokeTextShrinkToFit(this.context, rarity, popupX, popupY + (popupHeight * .535), popupWidth, "center");
        this.context.fillStyle = "#A25D03";
        fillTextShrinkToFit(this.context, rarity, popupX, popupY + (popupHeight * .535), popupWidth, "center");
        this.context.strokeStyle = "#000000"

        //level up button
        let levelButtonAsset = this.equip.canLevel() ? smGreenButton : smGrayButton;
        this.context.fillStyle = this.equip.canLevel() ? "#000000" : "#c52c2e";
        this.context.font = (this.boundingBox.height * 0.03) + "px KanitB";
        let levelUpButton = this.getHitboxById("levelUpButton");
        this.context.drawImage(levelButtonAsset, xOffset + levelUpButton.boundingBox.x, yOffset + levelUpButton.boundingBox.y, levelUpButton.boundingBox.width, levelUpButton.boundingBox.height);

        if (this.equip.isMaxLevel()) {
            fillTextShrinkToFit(this.context,
                _("MAX LEVEL"),
                xOffset + levelUpButton.boundingBox.x,
                yOffset + levelUpButton.boundingBox.y + (levelUpButton.boundingBox.height * .7),
                levelUpButton.boundingBox.width,
                "center");

        }
        else {
            let textPosition = fillTextShrinkToFit(
                this.context,
                _("Level up: {0}", this.equip.getLevelCost()),
                xOffset + levelUpButton.boundingBox.x,
                yOffset + levelUpButton.boundingBox.y + (levelUpButton.boundingBox.height * .7),
                levelUpButton.boundingBox.width * .9,
                "center"
            );

            let scrap = worldResources[WEAPON_SCRAP_INDEX];
            let scrapSize = levelUpButton.boundingBox.height * .5;
            this.context.drawImage(
                scrap.largeIcon,
                0,
                0,
                scrap.largeIcon.width,
                scrap.largeIcon.height,
                textPosition.x2 + 5,
                yOffset + levelUpButton.boundingBox.y + (levelUpButton.boundingBox.height * .25),
                scrapSize,
                scrapSize
            );
        }

        //description (handled by the equip class, did it this way incase we want multiple things shown for certain miners)
        this.context.fillStyle = "#FFFFFF";
        this.context.font = (this.boundingBox.height * 0.03) + "px Verdana";
        this.context.textBaseline = "top"
        if (this.equip.drawShortDescription) {
            this.equip.drawShortDescription(
                this.context,
                xOffset + this.boundingBox.width * 0.06,
                yOffset + this.boundingBox.height * 0.70,
                this.boundingBox.width * 0.60,
                this.boundingBox.height * 0.25
            );
        }
        this.context.restore();

        super.render(); // Render any child layers
    }
}