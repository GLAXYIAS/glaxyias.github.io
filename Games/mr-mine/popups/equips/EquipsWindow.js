/* 

    The way this popup works is a little convoluted and maybe a little jank? 
    It serves many different purposes, but the confusing part lies with how it interacts with EquipSelectorWindow.js
    to facilitate getting new Equips from Weapon Chests when your slots are already full. 
    Look to that file if you have questions about what some of this functionality does. 

*/

class EquipsWindow extends TabbedPopupWindow {
    layerName = "Equip"; // Used as key in activeLayers
    domElementId = "EQUIPD"; // ID of dom element that gets shown or hidden
    context = EQP;         // Canvas rendering context for popup
    zIndex = 5;
    lastRenderTreasureLength = -1;

    popupFrameImage = smFrame;

    slotsPerRow = 4;
    fractionalSlotPadding = 0.025;
    equipHitboxes = [];

    constructor(boundingBox, worldIndex, showreplaceButtons = false, tabToOpen = 0) {
        super(boundingBox);
        if (!boundingBox) {
            this.setBoundingBox();
        }
        this.initializeTabs([_("Equips"), _("Rewards")]);
        this.currentTabIndex = tabToOpen;

        this.windowYOffset = this.tabHeight - 0.023 * this.boundingBox.height;

        this.bodyContainer.boundingBox = {
            x: this.boundingBox.width * 0.037,
            y: this.windowYOffset + this.boundingBox.height * 0.048,
            width: this.boundingBox.width * 0.909,
            height: (this.boundingBox.height - this.windowYOffset) * 0.877,
        }

        this.headerHeight = this.bodyContainer.boundingBox.height * 0.1;

        this.worldIndex = worldIndex;
        this.showreplaceButtons = showreplaceButtons;
        this.lastAnimation = currentTime();
        this.sortedBy = "";
        this.equips = battleEquipsManager.activeEquips;

        this.initializeTreasureHitboxes();
        //this.intializeSortButtons();
        this.initializeEquipHitboxes();
        this.initializeEquipScrollboxContents();
        this.onTabChange();
        this.sortEquips();
    }

    initializeEquipHitboxes() {
        var scrollboxY = this.windowYOffset + (this.boundingBox.height - this.windowYOffset) * 0.16;
        this.equipsPane = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            0,
            this.context,
            this.bodyContainer.boundingBox.x,
            scrollboxY,
            this.bodyContainer.boundingBox.width,
            (this.bodyContainer.boundingBox.height * .98) - scrollboxY + 2 * this.windowYOffset,
            15

        );
        this.equipsPane.scrollToTop();
        this.addHitbox(this.equipsPane);
    }

    initializeTreasureHitboxes() {
        var scrollboxY = this.windowYOffset + (this.boundingBox.height - this.windowYOffset) * 0.16;
        this.treasureScrollbox = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            0,
            this.context,
            this.bodyContainer.boundingBox.x,
            scrollboxY,
            this.bodyContainer.boundingBox.width,
            (this.bodyContainer.boundingBox.height * .98) - scrollboxY + 2 * this.windowYOffset,
            15
        );
        this.addHitbox(this.treasureScrollbox);

    }

    generateTreasureScrollboxContents() {
        this.lastRenderTreasureLength = battleStorage.treasure.length;
        var box = this.treasureScrollbox;
        var slotSize = 42;
        var iconSize = 30;
        var padding = 10;
        box.clearHitboxes();
        box.context.save();
        box.context.clearRect(0, 0, box.contentWidth, box.contentWidth);
        var slotsPerRow = Math.min(9, Math.floor((box.contentWidth - padding * 2) / slotSize));
        var totalRows = Math.max(2, Math.ceil(battleStorage.maxTreasure / slotsPerRow));
        var slotSpacingX = ((box.contentWidth - padding * 2) - (slotSize * slotsPerRow)) / (slotsPerRow - 1);
        var slotSpacingY = slotSpacingX / 3;
        box.contentHeight = totalRows * slotSize + (totalRows - 1) * slotSpacingY + 1;
        box.initializeScrollbar();
        box.canvas.height = box.contentHeight;
        box.setScale();
        for (var i = 0; i < battleStorage.maxTreasure; ++i) {
            var indexInRow = i % slotsPerRow;
            var slotX = padding + indexInRow * (slotSize + slotSpacingX);
            var slotY = Math.floor(i / slotsPerRow) * (slotSize + slotSpacingY);
            box.context.fillStyle = "#000000";
            box.context.globalAlpha = 0.5;
            box.context.fillRect(slotX, slotY, slotSize, slotSize);
            box.context.globalAlpha = 1;
            if (i < battleStorage.treasure.length) {
                var item = battleStorage.treasure[i];
                box.context.imageSmoothingEnabled = false;
                drawImageFitInBox(
                    box.context,
                    item.icon,
                    slotX + (slotSize - iconSize) / 2,
                    slotY + (slotSize - iconSize) / 2,
                    iconSize,
                    iconSize
                );
                box.addHitbox(new Hitbox(
                    {
                        x: slotX,
                        y: slotY,
                        width: slotSize,
                        height: slotSize,
                    },
                    {
                        onmousedown: function (item, index) {
                            battleStorage.grantAndRemove(index);
                            this.generateTreasureScrollboxContents();
                        }.bind(this, item, i),
                        onmouseenter: function (item, x, y) {
                            var coords = this.getGlobalCoordinates(x, y + slotSize);
                            showTooltip(
                                item.getName(),
                                "",
                                coords.x * uiScaleX,
                                coords.y * uiScaleY
                            );
                        }.bind(this.treasureScrollbox, item, slotX, slotY),
                        onmouseexit: function () {
                            hideTooltip();
                        }
                    },
                    "pointer"
                )
                );
            }
            box.context.drawImage(
                itemFrame,
                slotX,
                slotY,
                slotSize,
                slotSize
            );
        }
        box.context.restore();
        box.currentScrollY = 0;
    }

    onTabChange() {
        if (this.currentTabIndex === 1) {
            this.equipsPane.clearHitboxes();
            this.equipsPane.setEnabled(false);
            this.equipsPane.setVisible(false);
            this.deleteHitboxWithId(this.equipsPane.id);
            this.initializeTreasureHitboxes();
            this.generateTreasureScrollboxContents();
            this.treasureScrollbox.setEnabled(true);
            this.treasureScrollbox.setVisible(true);
        }
        else {
            this.treasureScrollbox.clearHitboxes();
            this.deleteHitboxWithId(this.treasureScrollbox.id);
            this.treasureScrollbox.setEnabled(false);
            this.treasureScrollbox.setVisible(false);
            this.initializeEquipHitboxes();
            this.initializeEquipScrollboxContents();
            this.equipsPane.setEnabled(true);
            this.equipsPane.setVisible(true);
        }
    }

    intializeSortButtons() {
        var fractionalButtonWidth = 0.95;
        var buttonWidth = this.headerHeight * fractionalButtonWidth;
        var yOffset = (1 - fractionalButtonWidth) / 2 * this.headerHeight;
        var xOffset = -buttonWidth / 2;

        this.createSortButton(
            "rarity",
            "left",
            {
                x: xOffset + this.bodyContainer.boundingBox.width - 3 * buttonWidth,
                y: yOffset,
                width: buttonWidth,
                height: buttonWidth,
            }
        );
        this.createSortButton(
            "level",
            "middle",
            {
                x: xOffset + this.bodyContainer.boundingBox.width - 2 * buttonWidth,
                y: yOffset,
                width: buttonWidth,
                height: buttonWidth,
            },
        );
        this.createSortButton(
            "type",
            "right",
            {
                x: xOffset + this.bodyContainer.boundingBox.width - buttonWidth,
                y: yOffset,
                width: buttonWidth,
                height: buttonWidth,
            }
        );
    }

    createSortButton(sortType, position, boundingBox) {
        var button = this.bodyContainer.addHitbox(new Hitbox(
            boundingBox,
            {
                onmousedown: () => {
                    this.sortEquips(sortType);
                },
            },
            'pointer',
            ''
        ));
        button.render = function (root) {
            var coords = this.getRelativeCoordinates(0, 0, root);
            let button = window[position + (root.sortedBy == sortType ? "SMButtonDim" : "SMButton")];
            let buttonIcon = window[sortType + (root.sortedBy == sortType ? "dimSMIcon" : "SMIcon")];

            root.context.drawImage(
                button,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
            root.context.drawImage(
                buttonIcon,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
        }.bind(button, this);
    }

    initializeEquipScrollboxContents() {
        this.equipsPane.clearHitboxes();
        this.equipsPane.contentHeight = 0;
        this.equipHitboxes = [];

        var slotPadding = this.equipsPane.contentWidth * this.fractionalSlotPadding;
        this.slotWidth = (this.equipsPane.contentWidth - (slotPadding * (this.slotsPerRow + 1))) / this.slotsPerRow;
        this.slotHeight = getScaledImageDimensions(equipRarities.common.mediumFrame, this.slotWidth).height;
        this.slotYPadding = this.showreplaceButtons ? this.slotHeight * 0.3 : slotPadding;

        for (var i = 0; i < battleEquipsManager.activeEquips.length + 1; i++) {
            let coords = getItemCoordsInList(
                this.slotWidth,
                this.slotHeight,
                slotPadding,
                this.slotYPadding,
                this.slotsPerRow,
                i
            );
            let slotX = coords.x;
            let slotY = coords.y;

            if (i < battleEquipsManager.activeEquips.length) {
                let equip = this.equips[i];

                this.equipHitboxes.push(this.equipsPane.addHitbox(new Hitbox(
                    {
                        x: slotX,
                        y: slotY + (this.slotHeight * 0.05),
                        width: this.slotWidth,
                        height: this.slotHeight,
                    },
                    {
                        onmousedown: () => {
                            if (keysPressed["Shift"] && equip.canPressButton()) {
                                equip.onButtonPress();
                            }
                            else if (!this.showreplaceButtons) {
                                openUi(EquipWindow, null, equip);
                            }
                        },
                    },
                    'pointer',
                    'equip_' + i
                )));


                if (this.showreplaceButtons) {
                    this.equipsPane.addHitbox(new Hitbox(
                        {
                            x: slotX,
                            y: slotY + (this.slotHeight * 0.05) + this.slotHeight,
                            width: this.slotWidth,
                            height: this.slotHeight * 0.25,
                        },
                        {
                            onmousedown: () => {
                                if (!isConfirmationPromptOpen()) {
                                    showConfirmationPrompt(
                                        _("Are you sure you want to replace {0} for a {1} and {2} Weapon Scrap?", equip.translatedName, battleEquipsManager.getBaseEquipById(battleEquipsManager.pendingEquip).translatedName, equip.scrapAmount()),
                                        _("Yes"),
                                        () => {
                                            equip.scrap();
                                            battleEquipsManager.addActiveEquip(battleEquipsManager.pendingEquip);
                                            battleEquipsManager.removePendingEquip();
                                            activeLayers.EquipSelectorWindow.madeAChoice = true;
                                            closeUi(activeLayers.EquipSelectorWindow);
                                            this.equips = battleEquipsManager.activeEquips;
                                            this.showreplaceButtons = false;
                                            this.initializeEquipScrollboxContents()
                                        },
                                        _("No"),
                                        null,
                                        null,
                                        false
                                    );
                                }
                            },
                        },
                        'pointer',
                        'replaceButton_' + i
                    ));
                }
            }

            if (i == battleEquipsManager.activeEquips.length) {
                this.purchaseButton = this.equipsPane.addHitbox(new Hitbox(
                    {
                        x: slotX,
                        y: slotY + (this.slotHeight * 0.05),
                        width: this.slotWidth,
                        height: this.slotHeight,
                    },
                    {
                        onmousedown: () => {
                            if (battleEquipsManager.canUpgradeSlot()) {
                                showConfirmationPrompt(
                                    _("Purchase another equip slot for {0} Weapon Scrap", battleEquipsManager.nextSlotCost()),
                                    _("Purchase"),
                                    () => {
                                        battleEquipsManager.upgradeSlots()
                                    },
                                    _("Cancel"),
                                    null,
                                    _("NOTE: This only adds slots, it does not grant equips."),
                                    null,
                                    false
                                )
                            }
                            else if (!activeLayers.SuperMinerSelectorWindow) {
                                showConfirmationPrompt(
                                    _("You don't have enough Weapon Scrap. Open more Battle Chests", battleEquipsManager.nextSlotCost()),
                                    _("Open Battle Chests"),
                                    () => {
                                        openUi(PurchaseWindow, null, 0, Math.abs(purchaseWindowTabOrder - 1));
                                    },
                                    _("Cancel"),
                                    null,
                                    null,
                                    false
                                )
                            }
                        },
                    },
                    'pointer',
                    'purchaseSlotButton'
                ));
            }
        }

        this.equipsPane.setContentHeightToIncludeLastChild();
        this.equipsPane.scrollToTop();
    }

    close() {
        if (activeLayers.EquipSelectorWindow && !activeLayers.EquipSelectorWindow.madeAChoice) {
            let equip = activeLayers.EquipSelectorWindow.equip;
            showConfirmationPrompt(
                _("Are you sure you want to scrap {0} for {1} Weapon Scrap?", equip.translatedName, equip.scrapAmount()),
                _("Yes"),
                () => {
                    if (battleEquipsManager.removePendingEquip()) {
                        equip.grantScrapFromScrap();
                    }
                    activeLayers.EquipSelectorWindow.madeAChoice = true;
                    closeUi(activeLayers.EquipSelectorWindow);
                    closeUi(this);
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

    sortEquips(sort) {
        if (sort == "rarity") {
            this.equips.sort((a, b) => b.rarity.id - a.rarity.id);
        }
        else if (sort == "level") {
            this.equips.sort((a, b) => b.level - a.level);
        }
        else if (sort == "type") {
            this.equips.sort((a, b) => b.type - a.type);
        }
        else {
            this.equips.sort((a, b) => (b.hasButton && b.percentageUntilAction() == 1) - (a.hasButton && a.percentageUntilAction() == 1))
        }
        this.sortedBy = sort;
        this.initializeEquipScrollboxContents();
    }

    render() {
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render(); // Render any child layers

        if (this.currentTabIndex === 0) {
            this.renderEquipsTab();
        }
        else if (this.currentTabIndex === 1) {
            this.clearCanvas();
            this.renderChildren();
        }

    }

    renderEquipsTab() {
        this.context.save();
        this.context.font = (this.boundingBox.height * 0.05) + "px KanitM"
        this.equipsPane.context.clearRect(0, 0, this.equipsPane.contentWidth, this.equipsPane.contentHeight);

        //slots display
        this.context.fillStyle = battleEquipsManager.isFull() ? "#FF0000" : "#FFFFFF";
        fillTextShrinkToFit(
            this.context,
            _("Equips: {0}/{1}", battleEquipsManager.activeEquips.length, battleEquipsManager.slots),
            0,
            this.bodyContainer.boundingBox.y + this.headerHeight / 2,
            this.boundingBox.width,
            "center"
        );

        //scrap display
        var soulIconWidth = this.headerHeight * 0.95;
        this.context.fillStyle = "#FFFFFF";
        let scrap = worldResources[WEAPON_SCRAP_INDEX];
        this.context.drawImage(
            scrap.largeIcon,
            (this.boundingBox.width * 0.05),
            this.bodyContainer.boundingBox.y + (this.headerHeight - soulIconWidth) / 2,
            this.boundingBox.width * .06,
            this.boundingBox.width * .06
        );
        fillTextShrinkToFit(
            this.context,
            scrap.numOwned,
            this.boundingBox.width * 0.12,
            this.bodyContainer.boundingBox.y + this.headerHeight / 2,
            this.boundingBox.width,
            "left"
        );

        this.equipsPane.context.font = (this.equipsPane.boundingBox.height * .1) + "px KanitM"
        this.equipsPane.context.fillStyle = "#000000";
        for (var i = 0; i < battleEquipsManager.activeEquips.length; i++) {
            let equip = this.equips[i];
            let equipHitbox = this.equipHitboxes[i];

            if (equipHitbox) {
                let boundingBox = equipHitbox.boundingBox;

                equip.drawCard(this.equipsPane.context, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
            }

            let replaceButton = this.equipsPane.getHitboxById("replaceButton_" + i)
            if (replaceButton) {
                this.equipsPane.context.drawImage(stopb, 0, 0, stopb.width, stopb.height, replaceButton.boundingBox.x, replaceButton.boundingBox.y, replaceButton.boundingBox.width, replaceButton.boundingBox.height)
                this.equipsPane.context.font = (this.equipsPane.boundingBox.height * .05) + "px KanitM"
                this.equipsPane.context.lineWidth = 5;
                this.equipsPane.context.strokeStyle = "#000000";
                this.equipsPane.context.fillStyle = "#FFFFFF";
                this.equipsPane.context.textBaseline = "middle";
                strokeTextWrapWithHeightLimit(this.equipsPane.context, _("Replace"), replaceButton.boundingBox.x + (replaceButton.boundingBox.width * 0.1), replaceButton.boundingBox.y + (replaceButton.boundingBox.height * 0.5), replaceButton.boundingBox.width * 0.8, replaceButton.boundingBox.height * .7, "center");
                fillTextWrapWithHeightLimit(this.equipsPane.context, _("Replace"), replaceButton.boundingBox.x + (replaceButton.boundingBox.width * 0.1), replaceButton.boundingBox.y + (replaceButton.boundingBox.height * 0.5), replaceButton.boundingBox.width * 0.8, replaceButton.boundingBox.height * .7, "center");
                this.equipsPane.context.textBaseline = "alphabetic";
            }

            let purchaseSlot = this.purchaseButton;
            let scrap = worldResources[WEAPON_SCRAP_INDEX];
            this.equipsPane.context.drawImage(smallAddFrame, 0, 0, smallAddFrame.width, smallAddFrame.height, purchaseSlot.boundingBox.x, purchaseSlot.boundingBox.y, purchaseSlot.boundingBox.width, purchaseSlot.boundingBox.height);
            this.equipsPane.context.font = (this.equipsPane.boundingBox.height * .05) + "px KanitM"
            this.equipsPane.context.fillStyle = battleEquipsManager.canUpgradeSlot() ? "#bebebe" : "#b65d5e"
            this.equipsPane.context.drawImage(scrap.smallIcon, 0, 0, scrap.smallIcon.width, scrap.smallIcon.height, purchaseSlot.boundingBox.x + (purchaseSlot.boundingBox.width * 0.15), purchaseSlot.boundingBox.y + (purchaseSlot.boundingBox.height * 0.7), this.boundingBox.width * .03, this.boundingBox.width * .03);
            fillTextWrapWithHeightLimit(this.equipsPane.context, battleEquipsManager.nextSlotCost(), purchaseSlot.boundingBox.x + (purchaseSlot.boundingBox.width * 0.4), purchaseSlot.boundingBox.y + (purchaseSlot.boundingBox.height * 0.8), purchaseSlot.boundingBox.width * 0.5, purchaseSlot.boundingBox.height * .7, "left");

        }
        this.context.restore();
    }

}