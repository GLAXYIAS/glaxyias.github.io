class EquipBlackWindow extends PopupWindow {
    layerName = "EquipBlackWindow";
    domElementId = "SUPBD";
    context = SBD;

    isRendered = true;
    isPopup = true;
    allowBubbling = false;
    zIndex = 4;

    animationDuration = 1000;
    animationTimer;

    equipFrameWidth = 0.25;
    buttonWidth = 0.15;
    buttonAreaWidth = 0.5;

    constructor(boundingBox, equip) {
        super(boundingBox);
        this.setBoundingBox();

        this.equip = equip;
        this.animationTimer = this.animationDuration;

        this.initEquipPortrait();
        this.initButtons();
    }

    initEquipPortrait() {
        var equipFrame = this.equip.rarity.popupFrame;
        var equipFrameWidth = this.boundingBox.width * this.equipFrameWidth;
        var equipFrameHeight = equipFrame.height * (equipFrameWidth / equipFrame.width);

        var equipPortraitFrame = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width - equipFrameWidth) / 2,
                y: this.boundingBox.height * 0.4 - equipFrameHeight / 2,
                width: equipFrameWidth,
                height: equipFrameHeight
            },
            {},
            ""
        ));

        // PORTRAIT
        equipPortraitFrame.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.parent);
            this.parent.context.drawImage(
                this.parent.equip.rarity.popupFrame,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            );

            drawImageFitInBox(
                this.parent.context,
                this.parent.equip.icon,
                coords.x + (this.boundingBox.width * 0.205),
                coords.y + (this.boundingBox.height * 0.031),
                this.boundingBox.width * .593,
                this.boundingBox.height * .621
            );

            this.renderChildren();
        }

        // RARITY TEXT
        equipPortraitFrame.addHitbox(new Hitbox(
            {
                x: equipFrameWidth * 0.25,
                y: equipFrameHeight * 0.67,
                width: equipFrameWidth * 0.50,
                height: equipFrameHeight * 0.05
            },
            {}
        )).render = function () {
                var coords = this.getRelativeCoordinates(0, 0, this.parent.parent);
                var context = this.parent.parent.context;
                var rarity = this.parent.parent.equip.rarity.name
                context.save();
                context.font = this.boundingBox.height + "px KanitB";
                context.strokeStyle = "#FFFFFF";
                context.lineWidth = 2;
                strokeTextShrinkToFit(
                    context,
                    rarity,
                    coords.x,
                    coords.y,
                    this.boundingBox.width,
                    "center"
                );
                context.fillStyle = "#A25D03";
                fillTextShrinkToFit(
                    context,
                    rarity,
                    coords.x,
                    coords.y,
                    this.boundingBox.width,
                    "center"
                );
                context.restore();
            }

        // NAME
        this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.1,
                y: equipPortraitFrame.boundingBox.y - this.boundingBox.height * 0.055,
                width: this.boundingBox.width * 0.8,
                height: this.boundingBox.height * 0.05
            },
            {},
            ""
        )).render = function () {
                var coords = this.getRelativeCoordinates(0, 0, this.parent);
                this.parent.context.save();
                this.parent.context.textBaseline = "top";
                this.parent.context.font = this.boundingBox.height + "px KanitB";
                this.parent.context.fillStyle = "#FFFFFF";
                fillTextShrinkToFit(
                    this.parent.context,
                    this.parent.equip.name,
                    coords.x,
                    coords.y,
                    this.boundingBox.width,
                    "center"
                );
                this.parent.context.restore();
            }

        // DESCRIPTION
        this.addHitbox(new Hitbox(
            {
                x: equipPortraitFrame.boundingBox.x,
                y: equipPortraitFrame.boundingBox.y + equipFrameHeight + this.boundingBox.height * 0.01,
                width: equipFrameWidth,
                height: this.boundingBox.height * 0.13
            },
            {},
            ""
        )).render = function () {
                var coords = this.getRelativeCoordinates(0, 0, this.parent);
                this.parent.context.save();
                this.parent.context.textBaseline = "top";
                this.parent.context.font = (this.boundingBox.height * 0.25) + "px Verdana";
                this.parent.context.fillStyle = "#FFFFFF";
                this.parent.equip.drawShortDescription(
                    this.parent.context,
                    coords.x,
                    coords.y,
                    this.boundingBox.width
                );
                this.parent.context.restore();
            }
    }

    initButtons() {
        var buttonWidth = this.boundingBox.width * this.buttonWidth;
        var buttonHeight = startb.height * (buttonWidth / startb.width);
        var buttonOffset = this.boundingBox.width * this.buttonAreaWidth / 2

        this.equipButton = this.addHitbox(new Hitbox(
            {
                x: buttonOffset + (this.boundingBox.width * this.buttonAreaWidth - 2 * buttonWidth) / 3,
                y: this.boundingBox.height - 2 * buttonHeight,
                width: buttonWidth,
                height: buttonHeight
            },
            {
                onmousedown: () => {
                    if (battleEquipsManager.isFull()) {
                        showConfirmationPrompt(
                            _("You have no slots available to equip {0}. Do you want to make room or scrap {0} for {1} Weapon Scrap?", this.equip.name, this.equip.scrapAmount()),
                            _("Make room"),
                            () => {
                                this.madeAChoice = true;
                                openUiWithoutClosing(EquipSelectorWindow, null, this.equip)
                                openUiWithoutClosing(EquipsWindow, null, 0, true);
                                closeUi(this);
                            },
                            _("Scrap"),
                            () => {
                                this.madeAChoice = true;
                                if (battleEquipsManager.removePendingEquip()) {
                                    this.equip.grantScrapFromScrap();
                                }
                                closeUi(this);
                            },
                            null,
                            false
                        )
                    }
                    else {
                        this.madeAChoice = true;
                        battleEquipsManager.addActiveEquip(this.equip.id);
                        battleEquipsManager.removePendingEquip();
                        closeUi(this);
                    }
                }
            },
            'pointer',
            "equipButton"
        ));

        this.equipButton.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.parent);
            var context = this.parent.context;
            context.save();
            context.drawImage(
                startb,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            )
            context.lineWidth = 5;
            context.strokeStyle = "#000000";
            context.fillStyle = "#FFFFFF";
            context.textBaseline = "top";
            context.font = this.boundingBox.height * 0.7 + "px KanitB";
            strokeTextWrapWithHeightLimit(
                context,
                _("Equip"),
                coords.x + (this.boundingBox.width * 0.1),
                coords.y + (this.boundingBox.height * 0.15),
                this.boundingBox.width * 0.8,
                this.boundingBox.height * .7,
                "center"
            );
            fillTextWrapWithHeightLimit(
                context,
                _("Equip"),
                coords.x + (this.boundingBox.width * 0.1),
                coords.y + (this.boundingBox.height * 0.15),
                this.boundingBox.width * 0.8,
                this.boundingBox.height * .7,
                "center"
            );
            context.restore();
        }

        this.scrapButton = this.addHitbox(new Hitbox(
            {
                x: buttonOffset + (2 * this.boundingBox.width * this.buttonAreaWidth - buttonWidth) / 3,
                y: this.boundingBox.height - 2 * buttonHeight,
                width: buttonWidth,
                height: buttonHeight
            },
            {
                onmousedown: () => {
                    showConfirmationPrompt(
                        _("Are you sure you want to scrap {0} for {1} Weapon Scrap?", this.equip.translatedName, this.equip.scrapAmount()),
                        _("Yes"),
                        () => {
                            this.madeAChoice = true;
                            if (battleEquipsManager.removePendingEquip()) {
                                this.equip.grantScrapFromScrap();
                            }
                            closeUi(this);
                        },
                        _("No"),
                        null,
                        null,
                        false
                    )
                }
            },
            'pointer',
            "scrapButton"
        ));

        this.scrapButton.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.parent);
            var context = this.parent.context;
            context.drawImage(
                stopb,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            )
            context.lineWidth = 5;
            context.strokeStyle = "#000000";
            context.fillStyle = "#FFFFFF";
            context.textBaseline = "top";
            context.font = this.boundingBox.height * 0.7 + "px KanitB";
            strokeTextWrapWithHeightLimit(
                context,
                _("Scrap"),
                coords.x + (this.boundingBox.width * 0.1),
                coords.y + (this.boundingBox.height * 0.15),
                this.boundingBox.width * 0.8,
                this.boundingBox.height * .7,
                "center"
            );
            fillTextWrapWithHeightLimit(
                context,
                _("Scrap"),
                coords.x + (this.boundingBox.width * 0.1),
                coords.y + (this.boundingBox.height * 0.15),
                this.boundingBox.width * 0.8,
                this.boundingBox.height * .7,
                "center"
            );
        }
    }

    close() {
        //need this check because closing the popup will trigger the close function again
        if (!this.madeAChoice) {
            showConfirmationPrompt(
                _("Are you sure you want to scrap {0} for {1} Weapon Scrap?", this.equip.name, this.equip.scrapAmount()),
                _("Yes"),
                () => {
                    this.madeAChoice = true;
                    if (battleEquipsManager.removePendingEquip()) {
                        this.equip.grantScrapFromScrap();
                    }
                    return super.close();
                },
                _("No"),
                null,
                null,
                false
            )
        }
        else {
            return super.close();
        }
    }

    render() {
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);

        let animationPercent = Math.min(1, (this.animationDuration - this.animationTimer) / this.animationDuration);
        var radius = lerp(0, Math.max(this.boundingBox.width, this.boundingBox.height), animationPercent);

        this.context.globalAlpha = 1 * (animationPercent * 3);
        this.context.globalCompositeOperation = "source-over";
        drawCircle(
            this.context,
            this.boundingBox.width / 2,
            this.boundingBox.height / 2,
            radius,
            "#000000",
            "#000000",
            0
        );

        if (animationPercent < 1) {
            this.context.globalCompositeOperation = "source-atop";
            this.animationTimer -= renderDeltaTime;
        }
        else {
            this.context.globalCompositeOperation = "source-over";
        }

        this.context.globalAlpha = 1;

        this.context.save();
        let starAnimationDuration = 2000;
        this.context.globalAlpha = 1 - oscillate(performance.now(), starAnimationDuration);
        var xOffset = (performance.now() % (starAnimationDuration * 10)) / (starAnimationDuration * 10);
        drawImageLoop(
            this.context,
            dots1,
            0,
            0,
            this.boundingBox.width,
            this.boundingBox.height,
            xOffset
        )
        this.context.globalAlpha = 0.7;
        xOffset = (performance.now() % (starAnimationDuration * 8)) / (starAnimationDuration * 8);
        drawImageLoop(
            this.context,
            dots2,
            0,
            0,
            this.boundingBox.width,
            this.boundingBox.height,
            xOffset
        )
        this.context.restore();
        this.renderChildren();
    }
}