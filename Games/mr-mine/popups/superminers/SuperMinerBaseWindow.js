class SuperMinerBaseWindow extends PopupWindow
{
    layerName = "SuperMinerBaseWindow"; // Used as key in activeLayers
    domElementId = "SMBD";
    context = SMB;

    isRendered = true;
    isPopup = true;
    allowBubbling = true;


    constructor(boundingBox, superMiner)
    {
        super(boundingBox); // Need to call base class constructor

        this.superMiner = superMiner;
        this.bg = superMiner.rarity.largeFrame
        this.showingTooltip = false;
        this.buttonAnimation = new SpritesheetAnimation(btnShine, 7, 7);
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
        this.boundingBox.width = superMiner.rarity.largeFrame.width * this.boundingBox.height / superMiner.rarity.largeFrame.height;
        this.boundingBox.x = (oldBoundingBox.width - this.boundingBox.width) / 2;
        this.initHitboxes();
    }

    initHitboxes()
    {
        this.closeButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.9,
                y: 0,
                width: this.boundingBox.width * 0.1,
                height: this.boundingBox.height * 0.065
            },
            {
                onmousedown: () =>
                {
                    closeUi(this);
                    hideTooltip();
                }
            },
            'pointer',
            "closeButton",
            true,
            true
        ));

        this.skillButton = this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * 0.05,
                y: this.boundingBox.height * 0.74,
                width: this.boundingBox.width * 0.195,
                height: this.boundingBox.height * 0.13
            },
            {
                onmouseenter: () => { },
            },
            null,
            "skillButton",
            true,
            true
        ));
    }

    render()
    {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);

        // drawColoredRect(this.context, 0, 0, mainw, mainh, "#000000", 0.5);
        this.context.font = (this.boundingBox.height * 0.05) + "px KanitB";
        this.context.lineWidth = 6;

        let buttonBg = this.superMiner.hasButton ? this.superMiner.rarity.button : this.superMiner.rarity.flatButton
        let buttonIcon = this.superMiner.buttonIcon;
        let rarity = this.superMiner.rarity.name;
        let portrait = this.superMiner.portrait;

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
        strokeTextShrinkToFit(this.context, this.superMiner.name, xOffset + this.boundingBox.width * 0.05, popupY + (popupHeight * .055), popupWidth * .6, "left");
        this.context.strokeStyle = "#000000";
        fillTextShrinkToFit(this.context, this.superMiner.name, xOffset + this.boundingBox.width * 0.05, popupY + (popupHeight * .055), popupWidth * .6, "left");


        //portrait
        drawImageFitInBox(
            this.context,
            portrait,
            xOffset + popupWidth * 0.207,
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

        //skill icon/button
        let button = this.getHitboxById("skillButton");
        this.context.drawImage(buttonBg, 0, 0, buttonBg.width, buttonBg.height, xOffset + button.boundingBox.x, yOffset + button.boundingBox.y, button.boundingBox.width, button.boundingBox.height);

        if(buttonIcon)
        {
            this.context.drawImage(buttonIcon, 0, 0, buttonIcon.width, buttonIcon.height, xOffset + button.boundingBox.x + (button.boundingBox.width * .05), yOffset + button.boundingBox.y + (button.boundingBox.height * .05), button.boundingBox.width * .9, button.boundingBox.height * .9);
        }


        //description (handled by the super miner class, did it this way incase we want multiple things shown for certain miners)
        this.context.fillStyle = "#FFFFFF";
        this.context.font = (this.boundingBox.height * 0.03) + "px Verdana";
        this.context.textBaseline = "top"
        if(this.superMiner.renderDescription)
        {
            this.superMiner.renderDescription(
                this.context,
                xOffset + this.boundingBox.width * 0.33,
                yOffset + this.boundingBox.height * 0.70,
                this.boundingBox.width * 0.60,
                this.boundingBox.height * 0.25
            );
        }
        this.context.restore();

        super.render(); // Render any child layers
    }
}