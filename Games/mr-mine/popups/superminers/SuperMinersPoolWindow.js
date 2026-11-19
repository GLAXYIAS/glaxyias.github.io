class SuperMinersPoolWindow extends TabbedPopupWindow
{
    layerName = "SuperPool"; // Used as key in activeLayers
    domElementId = "SUPERPOOLD"; // ID of dom element that gets shown or hidden
    context = SMPR;         // Canvas rendering context for popup
    zIndex = 0;

    popupFrameImage = smFrame;

    slotsPerRow = 4;
    fractionalSlotPadding = 0.025;
    headerHitboxes = [];
    rewardHeaders = [{
        text: _("Scrap"),
        rarity: "40%"
    },
    {
        text: _("Common"),
        rarity: "35%"
    },
    {
        text: _("Uncommon"),
        rarity: "16.5%"
    },
    {
        text: _("Rare"),
        rarity: "7.5%"
    },
    {
        text: _("Legendary"),
        rarity: "1%"
    }];
    scrapHitbox;
    superMinerHitboxes = [];

    constructor(boundingBox, worldIndex)
    {
        super(boundingBox);
        if(!boundingBox)
        {
            this.setBoundingBox();
        }
        this.initializeTabs();

        this.windowYOffset = this.tabHeight - 0.023 * this.boundingBox.height;

        this.bodyContainer.boundingBox = {
            x: this.boundingBox.width * 0.037,
            y: this.windowYOffset + this.boundingBox.height * 0.048,
            width: this.boundingBox.width * 0.909,
            height: (this.boundingBox.height - this.windowYOffset) * 0.877,
        }

        this.headerHeight = this.bodyContainer.boundingBox.height * 0.1;

        this.worldIndex = worldIndex;
        this.lastAnimation = currentTime();
        this.miners = superMinerManager.baseSuperMiners.filter(miner => !miner.isSpecial);

        this.getHitboxById("closeButton").onmousedown = () =>
        {
            openUi(PurchaseWindow, null, 0, 0);
            if(!mutebuttons) closeAudio[rand(0, closeAudio.length - 1)].play();
        }

        this.initializeHitboxes();
        this.initializeScrollboxContents();
        this.sortSuperMiners();
    }

    initializeHitboxes()
    {
        var scrollboxY = this.windowYOffset + (this.boundingBox.height - this.windowYOffset) * 0.149;
        this.superMinerPane = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            0,
            this.context,
            this.bodyContainer.boundingBox.x,
            scrollboxY,
            this.bodyContainer.boundingBox.width,
            this.bodyContainer.boundingBox.height - scrollboxY + 2 * this.windowYOffset,
            15

        );
        this.superMinerPane.scrollToTop();
        this.addHitbox(this.superMinerPane);
    }

    initializeScrollboxContents()
    {
        this.superMinerPane.clearHitboxes();
        this.superMinerPane.contentHeight = 0;
        this.superMinerHitboxes = [];

        var slotPadding = this.superMinerPane.contentWidth * this.fractionalSlotPadding;
        this.slotWidth = (this.superMinerPane.contentWidth - (slotPadding * (this.slotsPerRow + 1))) / this.slotsPerRow;
        this.slotHeight = getScaledImageDimensions(superMinerRarities.common.smallFrame, this.slotWidth).height;
        this.slotYPadding = slotPadding;

        // Add headers
        let yPosition = this.slotHeight * 0.2 / 2;

        for(var i = 0; i < this.rewardHeaders.length; i++)
        {
            this.addHeader(i, yPosition);

            if(i == 0)
            {
                this.scrapHitbox = new Hitbox({
                    x: 0 + slotPadding,
                    y: this.headerHitboxes[i].boundingBox.y + this.headerHitboxes[i].boundingBox.height * 1.5,
                    width: this.slotWidth,
                    height: this.slotHeight,
                }, {
                    onmouseenter: function ()
                    {
                        showTooltip(_("Super Miner Souls"), _("Used to upgrade Super Miners"), mouseX, mouseY);
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                    'pointer',
                    'scrap'
                );
                this.superMinerPane.addHitbox(this.scrapHitbox);
                let yPositionOffset = this.scrapHitbox.boundingBox.y - this.headerHitboxes[i].boundingBox.height;
                yPosition = (this.slotHeight + this.slotYPadding) + this.slotHeight * 0.2 + yPositionOffset;
            } else
            {
                var rarity;
                switch(this.rewardHeaders[i].text)
                {
                    case _("Common"): rarity = superMinerRarities.common; break;
                    case _("Uncommon"): rarity = superMinerRarities.uncommon; break;
                    case _("Rare"): rarity = superMinerRarities.rare; break;
                    case _("Legendary"): rarity = superMinerRarities.legendary; break;
                }
                var filteredMiners = this.miners.filter(miner => miner.rarity.id == rarity.id);

                for(var j = 0; j < filteredMiners.length; j++)
                {
                    let coords = getItemCoordsInList(
                        this.slotWidth,
                        this.slotHeight,
                        slotPadding,
                        this.slotYPadding,
                        this.slotsPerRow,
                        j
                    );
                    let slotX = coords.x;
                    let slotY = this.headerHitboxes[i].boundingBox.y + this.headerHitboxes[i].boundingBox.height * 1.5 + coords.y;

                    let superMiner = filteredMiners[j];

                    this.superMinerHitboxes.push(this.superMinerPane.addHitbox(new Hitbox(
                        {
                            x: slotX,
                            y: slotY,
                            width: this.slotWidth,
                            height: this.slotHeight,
                        },
                        {
                            onmousedown: () =>
                            {
                                openUiWithoutClosing(SuperMinerBaseWindow, null, superMiner);
                            }
                        },
                        'pointer',
                        'superMiner_' + i + j
                    )));
                }


                let yPositionOffset = this.superMinerHitboxes[this.superMinerHitboxes.length - 1].boundingBox.y - this.headerHitboxes[i].boundingBox.height;
                yPosition = (this.slotHeight + this.slotYPadding) + this.slotHeight * 0.2 + yPositionOffset;
            }
        }

        this.superMinerPane.setContentHeightToIncludeLastChild();
        this.superMinerPane.scrollToTop();
    }

    addHeader(index, yPosition)
    {
        let headerHeight = this.slotHeight * 0.2;

        this.headerHitboxes.push(this.superMinerPane.addHitbox(new Hitbox(
            {
                x: 0,
                y: yPosition,
                width: this.superMinerPane.contentWidth,
                height: headerHeight,
            },
            {},
            null,
            'header_' + index
        )));
    }

    sortSuperMiners()
    {

        this.miners.sort((a, b) => a.rarity.id - b.rarity.id);
        this.initializeScrollboxContents();
    }

    render()
    {
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render(); // Render any child layers

        this.context.font = (this.boundingBox.height * 0.05) + "px KanitM"
        this.context.textBaseline = "middle";

        this.superMinerPane.context.clearRect(0, 0, this.superMinerPane.contentWidth, this.superMinerPane.contentHeight);

        //slots display
        this.context.fillStyle = "#FFFFFF";
        this.context.textBaseline = "middle";
        fillTextShrinkToFit(
            this.context,
            _("Possible Rewards"),
            0,
            this.bodyContainer.boundingBox.y + this.headerHeight / 2,
            this.boundingBox.width,
            "center"
        );

        // Render headers and divider lines
        this.renderHeaders();

        //Render Scrap Frame
        this.superMinerPane.context.font = (this.superMinerPane.boundingBox.height * .1) + "px KanitM"
        this.superMinerPane.context.fillStyle = "#2c0664";

        let scrapFrame = smallAddFrame
        let scrapImage = superMinerSouls.largeIcon

        if(this.scrapHitbox)
        {
            let boundingBox = this.scrapHitbox.boundingBox;

            this.superMinerPane.context.fillRect(
                boundingBox.x,
                boundingBox.y,
                boundingBox.width,
                boundingBox.height
            );
            this.superMinerPane.context.drawImage(
                scrapFrame,
                boundingBox.x,
                boundingBox.y,
                boundingBox.width,
                boundingBox.height
            );
            drawImageFitInBox(
                this.superMinerPane.context,
                scrapImage,
                boundingBox.x + (boundingBox.width * 0.1),
                boundingBox.y + (boundingBox.height * 0.145),
                boundingBox.width * 0.8,
                boundingBox.height * 0.60
            );

            this.superMinerPane.context.fillStyle = "#000000";
            this.superMinerPane.context.textBaseline = "middle";
            fillTextWrapWithHeightLimit(
                this.superMinerPane.context,
                "Souls",
                boundingBox.x,
                boundingBox.y + (boundingBox.height * 0.08),
                boundingBox.width,
                boundingBox.height * .1,
                "center"
            );

            this.superMinerPane.context.fillStyle = "#FFFFFF";
            fillTextWrapWithHeightLimit(
                this.superMinerPane.context,
                "35 - 50",
                boundingBox.x,
                boundingBox.y + (boundingBox.height * 0.85),
                boundingBox.width,
                boundingBox.height * .15,
                "center"
            );
        }

        this.superMinerPane.context.font = (this.superMinerPane.boundingBox.height * .1) + "px KanitM"
        this.superMinerPane.context.fillStyle = "#000000";

        //Rneder Super Miner Frames
        for(var i = 0; i < this.miners.length; i++)
        {
            let superMiner = this.miners[i];
            let buttonIcon = superMiner.buttonIcon;
            let frame = superMiner.rarity.smallFrameNoFill;
            let portrait = superMiner.portrait;

            let superMinerHitbox = this.superMinerHitboxes[i];
            if(superMinerHitbox)
            {
                let boundingBox = superMinerHitbox.boundingBox;
                let buttonOffset = (boundingBox.width * 0.36);

                //frame/portrait
                if(frame && frame.drawAnimation)
                {
                    frame.phaseShift = i * 7;
                    frame.drawAnimation(
                        this.superMinerPane.context,
                        boundingBox.x,
                        boundingBox.y,
                        boundingBox.width,
                        boundingBox.height
                    );
                }
                else
                {
                    this.superMinerPane.context.drawImage(
                        frame,
                        boundingBox.x,
                        boundingBox.y,
                        boundingBox.width,
                        boundingBox.height
                    );
                }
                drawImageFitInBox(
                    this.superMinerPane.context,
                    portrait,
                    boundingBox.x + (boundingBox.width * 0.04),
                    boundingBox.y + (boundingBox.height * 0.145),
                    boundingBox.width * 0.92,
                    boundingBox.height * 0.60
                );


                if(buttonIcon)
                {
                    this.superMinerPane.context.drawImage(buttonIcon, 0, 0, buttonIcon.width, buttonIcon.height, boundingBox.x + buttonOffset, boundingBox.y + (boundingBox.height * 0.79), boundingBox.width * .27, boundingBox.width * .27);
                }

                this.superMinerPane.context.fillStyle = "#000000";
                this.superMinerPane.context.textBaseline = "middle";
                fillTextWrapWithHeightLimit(
                    this.superMinerPane.context,
                    superMiner.name,
                    boundingBox.x,
                    boundingBox.y + (boundingBox.height * 0.08),
                    boundingBox.width,
                    boundingBox.height * .1,
                    "center"
                );
            }

        }

    }

    renderHeaders()
    {
        let headerHeight = this.slotHeight * 0.2;

        for(let i = 0; i < this.rewardHeaders.length; i++)
        {
            //let yPosition = i * (this.slotHeight + this.slotYPadding) + headerHeight;
            var hitbox = this.headerHitboxes[i];

            // Draw header text
            this.superMinerPane.context.font = (headerHeight * 0.8) + "px KanitM";
            this.superMinerPane.context.fillStyle = "#FFFFFF";
            this.superMinerPane.context.textBaseline = "middle";
            this.superMinerPane.context.fillText(
                this.rewardHeaders[i].text,
                this.superMinerPane.contentWidth * 0.05,
                hitbox.boundingBox.y + headerHeight / 2
            );
            this.superMinerPane.context.fillText(
                this.rewardHeaders[i].rarity,
                this.superMinerPane.contentWidth * 0.85,
                hitbox.boundingBox.y + headerHeight / 2
            );

            // Draw divider line
            this.superMinerPane.context.strokeStyle = "#FFFFFF";
            this.superMinerPane.context.lineWidth = 2;
            this.superMinerPane.context.beginPath();
            this.superMinerPane.context.moveTo(0, hitbox.boundingBox.y + headerHeight);
            this.superMinerPane.context.lineTo(this.superMinerPane.contentWidth, hitbox.boundingBox.y + headerHeight);
            this.superMinerPane.context.stroke();
        }
    }

}