class PromoPopup extends TabbedPopupWindow {
    layerName = "promopopup"; // Used as key in activeLayers
    domElementId = "PROMOD"; // ID of dom element that gets shown or hidden
    context = PROMO;         // Canvas rendering context for popup
    promoUrl = "https://apps.apple.com/us/app/mr-mine-idle/id1659735369";
    promoAsset = activePromoAsset;
    promoText1 = "MrMine is now out on iOS!";
    promoText2 = "Now you can manage your mine on the go!";

    constructor(boundingBox) {
        super(boundingBox); // Need to call base class constructor
        if (!boundingBox) {
            this.setBoundingBox();
        }

        this.initializeTabs(Object.values({}));

        this.addHitbox(new Button(
            JustUpgrade, _("Play on Mobile"), "26px KanitB", "#000000",
            {
                x: this.boundingBox.width * 0.3,     // Copied from renderButton call below
                y: this.boundingBox.height * 0.80,
                width: this.boundingBox.width * 0.4,
                height: this.boundingBox.height * 0.10
            },
            {
                onmousedown: function () {
                    promosClicked.push(CURRENTLY_ACTIVE_PROMO_ID);
                    openExternalLinkInDefaultBrowser(this.parent.promoUrl);
                    playClickSound();
                }
            },
            'pointer',
            "upgradeButton"
        ));
        lastTimeSeenPromo = currentTime();
    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        this.context.restore();
        super.render();

        this.context.fillStyle = "#FFFFFF";
        var slotW = this.boundingBox.width * 0.6;
        var slotH = slotW * (407 / 600);
        var slotX = this.boundingBox.width * 0.2;
        var slotY = this.boundingBox.height * 0.13;
        drawImageFitInBox(
            this.context,
            this.promoAsset,
            Math.round(slotX),
            Math.round(slotY),
            Math.round(slotW),
            Math.round(slotH)
        );
        var textY1 = slotY + slotH + this.boundingBox.height * 0.04;
        var textY2 = textY1 + this.boundingBox.height * 0.05;
        this.context.font = "13px Verdana";
        this.context.fillText(this.promoText1, this.boundingBox.width * .5 - this.context.measureText(this.promoText1).width / 2, textY1);
        this.context.font = "13px Verdana";
        this.context.fillText(this.promoText2, this.boundingBox.width * .5 - this.context.measureText(this.promoText2).width / 2, textY2);
    }
}