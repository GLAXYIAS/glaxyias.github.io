class EquipSelectorWindow extends PopupWindow {
    layerName = "EquipSelectorWindow"; // Used as key in activeLayers
    domElementId = "SPECIALD";
    context = SPC;

    isRendered = true;
    isPopup = true;
    allowBubbling = false;
    zIndex = 4;


    constructor(boundingBox, equip) {
        super(boundingBox); // Need to call base class constructor
        this.setBoundingBox();

        this.equip = equip;
        this.bg = equip.rarity.mediumFrame
        this.madeAChoice = false;

        this.initHitboxes();
    }

    initHitboxes() {
        this.clearHitboxes();

        this.skillButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .116,
                y: this.boundingBox.height * .473,
                width: this.boundingBox.width * .2,
                height: this.boundingBox.height * .3
            },
            {},
            'cursor',
            "skillButton"
        ));

        this.scrapButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .13,
                y: this.boundingBox.height * .55,
                width: this.boundingBox.width * .1,
                height: this.boundingBox.height * .065
            },
            {
                onmousedown: () => {
                    if (battleEquipsManager.isFull()) {
                        showConfirmationPrompt(
                            _("Are you sure you want to scrap {0} for {1} Weapon Scrap?", this.equip.name, this.equip.scrapAmount()),
                            _("Yes"),
                            () => {
                                this.madeAChoice = true;
                                if (battleEquipsManager.removePendingEquip()) {
                                    this.equip.grantScrapFromScrap();
                                }
                                if (activeLayers.Equip) {
                                    activeLayers.Equip.showreplaceButtons = false;
                                    activeLayers.Equip.initializeEquipScrollboxContents();
                                }
                                closeUi(this);
                            },
                            _("No"),
                            null,
                            null,
                            false
                        )
                    }
                    else {
                        this.madeAChoice = true;
                        if (battleEquipsManager.removePendingEquip()) {
                            battleEquipsManager.addActiveEquip(this.equip.id);
                        }
                        if (activeLayers.Equip) {
                            activeLayers.Equip.showreplaceButtons = false;
                            activeLayers.Equip.initializeEquipScrollboxContents();
                        }
                        closeUi(this);
                    }
                }
            },
            'pointer',
            "scrapButton"
        ));
    }

    close() {
        if (!this.madeAChoice) {
            showConfirmationPrompt(
                _("Are you sure you want to scrap {0} for {1} Weapon Scrap?", this.equip.name, this.equip.scrapAmount()),
                _("Yes"),
                () => {
                    if (battleEquipsManager.removePendingEquip()) {
                        this.equip.grantScrapFromScrap();
                    }
                    if (activeLayers.Equip) {
                        activeLayers.Equip.showreplaceButtons = false;
                        activeLayers.Equip.initializeEquipScrollboxContents();
                    }
                },
                _("No"),
                () => {
                    openUiWithoutClosing(EquipsWindow, null, 0, true, this.equip);
                    this.setBoundingBox();
                },
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

        drawColoredRect(this.context, 0, 0, this.boundingBox.width, this.boundingBox.height, "#000000", 0.5);
        this.context.font = (this.boundingBox.height * 0.025) + "px KanitB";
        this.context.lineWidth = 6;

        let popupWidth = this.boundingBox.width * .11;
        let popupHeight = this.boundingBox.height * .3;
        let popupX = this.boundingBox.width * .125;
        let popupY = this.boundingBox.height * 0.25;
        let xOffset = popupX + (this.boundingBox.width * 0.005);

        //background

        //**********************
        //Foreground stuff below
        //**********************

        this.equip.drawCard(this.context, popupX, popupY, popupWidth, popupHeight);

        let scrapButton = this.getHitboxById("scrapButton")
        if (scrapButton) {
            let buttonImage = stopb;
            let buttonText = _("Scrap");

            if (!battleEquipsManager.isFull()) {
                buttonImage = startb;
                buttonText = _("Equip");
            }

            this.context.drawImage(buttonImage, 0, 0, buttonImage.width, buttonImage.height, scrapButton.boundingBox.x, scrapButton.boundingBox.y, scrapButton.boundingBox.width, scrapButton.boundingBox.height)
            this.context.lineWidth = 5;
            this.context.strokeStyle = "#000000";
            this.context.fillStyle = "#FFFFFF";
            strokeTextWrapWithHeightLimit(this.context, buttonText, scrapButton.boundingBox.x + (scrapButton.boundingBox.width * 0.1), scrapButton.boundingBox.y + (scrapButton.boundingBox.height * 0.7), scrapButton.boundingBox.width * 0.8, scrapButton.boundingBox.height * .7, "center");
            fillTextWrapWithHeightLimit(this.context, buttonText, scrapButton.boundingBox.x + (scrapButton.boundingBox.width * 0.1), scrapButton.boundingBox.y + (scrapButton.boundingBox.height * 0.7), scrapButton.boundingBox.width * 0.8, scrapButton.boundingBox.height * .7, "center");
        }


        super.render(); // Render any child layers


    }
}