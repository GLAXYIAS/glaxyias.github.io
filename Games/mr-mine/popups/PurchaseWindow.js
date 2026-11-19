class PurchaseWindow extends TabbedPopupWindow {
    layerName = "Purchase"; // Used as key in activeLayers
    domElementId = "PURCHASED"; // ID of dom element that gets shown or hidden
    context = PU;         // Canvas rendering context for popup

    buyTabIndex = 0;
    useTabIndex = 1;

    categoryHeaders = [{
        text: _("Rewards"),
        category: ShopCategories.FREE,
        hitbox: null,
        renderY: 0
    },
    {
        text: _("Chests"),
        category: ShopCategories.CHESTS,
        hitbox: null,
        renderY: 0
    },
    {
        text: _("Materials"),
        category: ShopCategories.BUILDING_MATERIALS,
        hitbox: null,
        renderY: 0
    },
    {
        text: _("Buffs"),
        category: ShopCategories.BUFFS,
        hitbox: null,
        renderY: 0
    },
    {
        text: _("Consumables"),
        category: ShopCategories.CONSUMABLE,
        hitbox: null,
        renderY: 0
    },
    {
        text: _("Special"),
        category: ShopCategories.MISC,
        hitbox: null,
        renderY: 0
    }
    ];

    storeItemsData = [];

    itemForPurchase = null;

    buyButtons = [];
    useButtons = [];

    viewedPurchaseTab = false;

    constructor(boundingBox, worldIndex = 0, tabIndex = 0) {
        super(boundingBox); // Need to call base class constructor
        if (!boundingBox) {
            this.setBoundingBox();
        }

        this.setFrameImagesByWorldIndex(worldIndex)

        this.currentTabIndex = tabIndex;

        var fontToUse = "14px Verdana"
        if (language == "french") { fontToUse = "12px Verdana"; }


        if (purchaseWindowTabOrder == 1) {
            this.initializeTabs([_("Use Tickets"), _("Get Tickets")]);
            this.useTabIndex = 0;
            this.buyTabIndex = 1;
        }
        else {
            this.initializeTabs([_("Get Tickets"), _("Use Tickets")]);
        }

        this.shopBG = new Hitbox(
            {
                x: this.bodyContainer.boundingBox.width * .07,
                y: this.bodyContainer.boundingBox.height * .1,
                width: this.bodyContainer.boundingBox.width * .25,
                height: this.bodyContainer.boundingBox.height * .35
            },
            {}
        );
        this.shopBG.render = function (parentWindow) {
            renderRoundedRectangle(
                parentWindow.context,
                this.parent.bodyContainer.boundingBox.x + (this.parent.bodyContainer.boundingBox.width * .025),
                this.parent.bodyContainer.boundingBox.y + (this.parent.bodyContainer.boundingBox.height * .05),
                this.parent.bodyContainer.boundingBox.width * .95,
                this.parent.bodyContainer.boundingBox.height * .82,
                10,
                "rgba(0, 0, 0, 0.5)",
                "rgba(0, 0, 0, 0.5)",
                0
            )
        }.bind(this.shopBG, this);
        this.addHitbox(this.shopBG);

        this.shopScrollBox = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            this.bodyContainer.boundingBox.height * .9 + (purchasedh * .15 * Math.max(0, shopManager.getAvailableShopItems().length - 3)),
            this.context,
            this.bodyContainer.boundingBox.x + (this.bodyContainer.boundingBox.width * .05),
            this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .05),
            this.bodyContainer.boundingBox.width * .9,
            this.bodyContainer.boundingBox.height * .82,
            15
        );
        this.shopScrollBox.shopItems = [];
        this.addHitbox(this.shopScrollBox);
        this.shopScrollBox.setVisible(true);
        this.shopScrollBox.setEnabled(true);

        if (shopVariantId == 0) {
            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 - ticketImage1.width * 1.6,
                    y: ticketImage1.height * 1.6,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(1);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton1"
            )));

            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 - ticketImage1.width * 0.5,
                    y: ticketImage1.height * 1.6,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(2);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton2"
            )));

            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 + ticketImage1.width * 0.6,
                    y: ticketImage1.height * 1.6,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(3);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton3"
            )));

            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 - ticketImage1.width * 1.6,
                    y: ticketImage1.height * 3.1,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(4);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton4"
            )));

            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 - ticketImage1.width * 0.5,
                    y: ticketImage1.height * 3.1,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(5);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton5"
            )));

            this.buyButtons.push(this.addHitbox(new Button(
                upgradeb, _("BUY"), fontToUse, "#000000",
                {
                    x: this.boundingBox.width * 0.5 + ticketImage1.width * 0.6,
                    y: ticketImage1.height * 3.1,
                    width: ticketImage1.width,
                    height: 18
                },
                {
                    onmousedown: function () {
                        platform.buyPack(6);
                        playClickSound();
                    }
                },
                'pointer',
                "buyButton6"
            )));
        }
        else {
            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .07,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(1);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton1"
            )));

            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .39,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(2);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton2"
            )));

            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .71,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(3);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton3"
            )));

            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .07,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(4);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton4"
            )));

            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .36,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(5);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton5"
            )));

            this.buyButtons.push(this.addHitbox(new Hitbox(
                {
                    x: this.bodyContainer.boundingBox.width * .65,
                    y: this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                    width: this.bodyContainer.boundingBox.width * .3,
                    height: this.bodyContainer.boundingBox.height * .41
                },
                {
                    onmousedown: function () {
                        platform.buyPack(6);
                        playClickSound();
                    }
                },
                "pointer",
                "newBuyButton6"
            )));
        }

        this.useButtons.push(this.addHitbox(new Button(
            craftb, _("REDEEM"), fontToUse, "#000000",
            {
                x: purchasedw * .53,
                y: purchasedh * .85,
                width: purchasedw * .20,
                height: purchasedh * .04
            },
            {
                onmousedown: function () {
                    showRedeemPrompt();
                    playClickSound();
                }
            },
            "pointer"
        )));
        this.useButtons[0].isVisible = () => this.currentTabIndex == this.useTabIndex;
        this.useButtons[0].isEnabled = () => this.currentTabIndex == this.useTabIndex;

        this.useButtons.push(this.addHitbox(new Button(
            craftb, _("REWARDS"), fontToUse, "#000000",
            {
                x: purchasedw * .75,
                y: purchasedh * .85,
                width: purchasedw * .20,
                height: purchasedh * .04
            },
            {
                onmousedown: function () {
                    playClickSound();
                    if(!playsaurusSdk.isLoggedIn()) {
                        showAlertPrompt(_("Log in to your Playsaurus account to access cloud save features, sync across devices and enjoy rewards"));
                        return;
                    }
                    if(!playsaurusSdk.isEmailVerifiedCached()) {
                        showAlertPrompt(_("Verify your email to access this feature."));
                        return;
                    }
                    closeUiByName("Purchase");
                    window.showPendingRewardsScreen();
                }
            },
            "pointer"
        )));
        this.useButtons[1].isVisible = () => this.currentTabIndex == this.useTabIndex;
        this.useButtons[1].isEnabled = () => this.currentTabIndex == this.useTabIndex;
        this.shopBG.isVisible = () => this.currentTabIndex == this.useTabIndex;
        this.shopScrollBox.isVisible = () => this.currentTabIndex == this.useTabIndex;
        this.shopScrollBox.isEnabled = () => this.currentTabIndex == this.useTabIndex;

        for (var i in this.buyButtons) {
            this.buyButtons[i].isVisible = () => this.currentTabIndex == this.buyTabIndex;
            this.buyButtons[i].isEnabled = () => this.currentTabIndex == this.buyTabIndex;
        }
        this.onTabChange();

        this.initializeShopMenu();

        trackEvent_logPurchaseWindowOpen();
    }

    initializeShopMenu() {
        this.shopScrollBox.clearHitboxes();
        this.storeItemsData = [];
        this.availableShopItems = shopManager.getAvailableShopItems();

        var filterShopItems = [];
        var headerHeight = this.bodyContainer.boundingBox.height * .1;
        var shopItemSpacing = this.bodyContainer.boundingBox.height * .01;
        var shopItemHeight = this.bodyContainer.boundingBox.height * .5;
        var yPosition = this.bodyContainer.boundingBox.height * .02;

        for (var i = 0; i < this.categoryHeaders.length; i++) {
            filterShopItems = this.availableShopItems.filter((item) => item.categoryType == this.categoryHeaders[i].category);
            if (filterShopItems.length > 0) {
                this.categoryHeaders[i].hitbox = this.shopScrollBox.addHitbox(new Hitbox(
                    {
                        x: 0,
                        y: yPosition,
                        width: this.bodyContainer.boundingBox.width * .97,
                        height: headerHeight
                    },
                    {
                        onmousedown: function () { }
                    },
                    "default",
                    this.categoryHeaders[i].text + "_header"
                ));

                this.categoryHeaders[i].renderY = yPosition;

                filterShopItems.forEach((item, i) => {
                    let column = i % 3;
                    let row = Math.floor(i / 3);

                    let hitbox;

                    hitbox = this.shopScrollBox.addHitbox(new Hitbox(
                        {
                            x: this.bodyContainer.boundingBox.width * .02 + (this.bodyContainer.boundingBox.width * .31 * column),
                            y: yPosition + headerHeight + shopItemSpacing + (this.bodyContainer.boundingBox.height * .52 * row),
                            width: this.bodyContainer.boundingBox.width * .31,
                            height: shopItemHeight
                        },
                        {
                            onmousedown: function () {
                                hideTooltip();
                                if (item.isPurchaseable()) {
                                    this.itemForPurchase = item;
                                    showConfirmationPrompt(
                                        _("Spend {0} tickets to purchase {1}?", item.getCost(), item.name),
                                        _("Yes"),
                                        () => {
                                            if (this.itemForPurchase) {
                                                item.onPurchase();
                                                this.itemForPurchase = null;
                                            }
                                        },
                                        _("Cancel"),
                                        () => {
                                            if (this.itemForPurchase) {
                                                this.itemForPurchase = null;
                                            }
                                        },
                                        null,
                                        false
                                    );
                                }
                                else if (tickets < item.getCost()) {
                                    showConfirmationPrompt(
                                        _("Not enough tickets. You need {0} tickets.", item.getCost()),
                                        _("BUY TICKETS"),
                                        () => {
                                            openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                                        },
                                        _("Cancel"),
                                        null,
                                        null,
                                        false
                                    );
                                }
                            },
                            onmouseenter: () => {
                                item.tooltip(mouseX, mouseY)
                            },
                            onmouseexit: function () {
                                hideTooltip();
                            }
                        },
                        "pointer",
                        item.name + "_shopItem"
                    ));
                    this.shopScrollBox.shopItems.push(hitbox);
                    this.storeItemsData.push({
                        item: item,
                        hitbox: hitbox,
                        renderX: this.bodyContainer.boundingBox.width * .02 + (this.bodyContainer.boundingBox.width * .31 * column),
                        renderY: yPosition + headerHeight + shopItemSpacing + (this.bodyContainer.boundingBox.height * .52 * row),
                    });

                    if (item.type == ChestType.black) {
                        hitbox.addHitbox(new Hitbox(
                            {
                                x: hitbox.boundingBox.width * .85,
                                y: hitbox.boundingBox.height * .155,
                                width: hitbox.boundingBox.width * .12,
                                height: hitbox.boundingBox.width * .12
                            },
                            {
                                onmousedown: function () {
                                    openUi(SuperMinersPoolWindow);
                                }
                            },
                            'pointer',
                            "SMInfoButton"
                        ));
                    }
                });

                yPosition = yPosition + headerHeight + shopItemSpacing + (this.bodyContainer.boundingBox.height * .52 * Math.ceil(filterShopItems.length / 3));
            }
            else {
                this.categoryHeaders[i].hitbox = null;
            }

            this.shopScrollBox.contentHeight = yPosition;
            filterShopItems = [];
        }

    }

    render() {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render();
        PU.fillStyle = "#FFFFFF";
        var fontToUse = "14px Verdana"
        if (language == "french") { fontToUse = "12px Verdana"; }
        if (this.currentTabIndex == this.buyTabIndex) {
            if (!this.viewedPurchaseTab) {
                this.viewedPurchaseTab = true;
                trackEvent_ViewedPurchaseWindow();
            }
            if (true || getBuildTarget() == STEAM_BUILD || platform.domain == "armorgames") {
                this.context.drawImage(v5Tix10, this.bodyContainer.boundingBox.width * .07, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);
                this.context.drawImage(v5Tix55, this.bodyContainer.boundingBox.width * .39, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);
                this.context.drawImage(v5Tix120, this.bodyContainer.boundingBox.width * .71, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .02), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);
                this.context.drawImage(v5Tix250, this.bodyContainer.boundingBox.width * .07, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);
                this.context.drawImage(v5Tix650, this.bodyContainer.boundingBox.width * .39, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);
                this.context.drawImage(v5Tix1400, this.bodyContainer.boundingBox.width * .71, this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46), this.bodyContainer.boundingBox.width * .3, this.bodyContainer.boundingBox.height * .41);

                this.context.fillStyle = "#FFF";
                this.context.strokeStyle = "#000";
                this.context.font = "22px Matiz";
                this.context.lineWidth = 4;

                this.context.fillStyle = "#FFF";
                this.context.shadowColor = "black";
                this.context.shadowOffsetX = 1;
                this.context.shadowOffsetY = 4;
                strokeTextShrinkToFit(this.context, purchasePacks[1].formattedPrice, this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[1].formattedPrice, this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, purchasePacks[2].formattedPrice, this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[2].formattedPrice, this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, purchasePacks[3].formattedPrice, this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[3].formattedPrice, this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .38, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, purchasePacks[4].formattedPrice, this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[4].formattedPrice, this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, purchasePacks[5].formattedPrice, this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[5].formattedPrice, this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, purchasePacks[6].formattedPrice, this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, purchasePacks[6].formattedPrice, this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .82, this.bodyContainer.boundingBox.width * .24, "center", 0);

                this.context.lineWidth = 3;
                this.context.shadowOffsetX = 0;
                this.context.shadowOffsetY = 1;
                this.context.font = "14px Verdana";
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 10), this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 10), this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 55), this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 55), this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 120), this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 120), this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .07, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 250), this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 250), this.bodyContainer.boundingBox.width * .10, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 650), this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 650), this.bodyContainer.boundingBox.width * .42, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);
                strokeTextShrinkToFit(this.context, _("Pack of {0} tickets", 1400), this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);
                fillTextShrinkToFit(this.context, _("Pack of {0} tickets", 1400), this.bodyContainer.boundingBox.width * .74, this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * .51, this.bodyContainer.boundingBox.width * .24, "center", 0);

                if (showShopBadges) {
                    this.context.font = "18px Matiz";
                    drawImageFitInBox(this.context,
                        salesStar,
                        this.bodyContainer.boundingBox.width * .62,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .09),
                        this.bodyContainer.boundingBox.width * .1,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        "+10%",
                        this.bodyContainer.boundingBox.width * .64,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .14),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        "+10%",
                        this.bodyContainer.boundingBox.width * .64,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .14),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );


                    drawImageFitInBox(this.context,
                        salesStar,
                        this.bodyContainer.boundingBox.width * .94,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .09),
                        this.bodyContainer.boundingBox.width * .1,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        "+20%",
                        this.bodyContainer.boundingBox.width * .96,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .14),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        "+20%",
                        this.bodyContainer.boundingBox.width * .96,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .14),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );

                    drawImageFitInBox(this.context,
                        salesStar,
                        this.bodyContainer.boundingBox.width * .3,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .53),
                        this.bodyContainer.boundingBox.width * .1,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        "+25%",
                        this.bodyContainer.boundingBox.width * .32,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        "+25%",
                        this.bodyContainer.boundingBox.width * .32,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );

                    drawImageFitInBox(this.context,
                        salesStar,
                        this.bodyContainer.boundingBox.width * .62,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .53),
                        this.bodyContainer.boundingBox.width * .1,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        "+30%",
                        this.bodyContainer.boundingBox.width * .64,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        "+30%",
                        this.bodyContainer.boundingBox.width * .64,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );

                    drawImageFitInBox(this.context,
                        salesStar,
                        this.bodyContainer.boundingBox.width * .94,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .53),
                        this.bodyContainer.boundingBox.width * .1,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        "+40%",
                        this.bodyContainer.boundingBox.width * .96,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        "+40%",
                        this.bodyContainer.boundingBox.width * .96,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .58),
                        this.bodyContainer.boundingBox.width * .06,
                        "center",
                        0
                    );
                }

                if (showShopPurchaseHeaders) {
                    drawImageFitInBox(this.context,
                        salesBanner,
                        this.bodyContainer.boundingBox.width * .095,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .4),
                        this.bodyContainer.boundingBox.width * .25,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    drawImageFitInBox(this.context,
                        salesBanner,
                        this.bodyContainer.boundingBox.width * .735,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .4),
                        this.bodyContainer.boundingBox.width * .25,
                        this.bodyContainer.boundingBox.height * .1
                    )

                    strokeTextShrinkToFit(this.context,
                        _("Most Popular"),
                        this.bodyContainer.boundingBox.width * .115,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                        this.bodyContainer.boundingBox.width * .2,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        _("Most Popular"),
                        this.bodyContainer.boundingBox.width * .115,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                        this.bodyContainer.boundingBox.width * .2,
                        "center",
                        0
                    );

                    strokeTextShrinkToFit(this.context,
                        _("Best Value"),
                        this.bodyContainer.boundingBox.width * .755,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                        this.bodyContainer.boundingBox.width * .2,
                        "center",
                        0
                    );
                    fillTextShrinkToFit(this.context,
                        _("Best Value"),
                        this.bodyContainer.boundingBox.width * .755,
                        this.bodyContainer.boundingBox.y + (this.bodyContainer.boundingBox.height * .46),
                        this.bodyContainer.boundingBox.width * .2,
                        "center",
                        0
                    );
                }

            }
            this.context.lineWidth = 1;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;


        }
        if (this.currentTabIndex == this.useTabIndex) {
            this.shopScrollBox.context.clearRect(0, 0, this.shopScrollBox.contentWidth, this.shopScrollBox.contentHeight);

            this.renderHeaders();

            this.storeItemsData.forEach((shopItem, i) => {
                let hitbox = shopItem.hitbox;
                let posX = shopItem.renderX;
                let posY = shopItem.renderY;
                let xScale = this.bodyContainer.boundingBox.width / this.shopScrollBox.boundingBox.width;
                let scale = (2 - this.shopScrollBox.scale);
                let item = shopItem.item;

                this.shopScrollBox.context.drawImage(
                    shopItemFrame,
                    posX,
                    posY,
                    hitbox.boundingBox.width * scale,
                    hitbox.boundingBox.height * scale
                );

                renderRoundedRectangle(
                    this.shopScrollBox.context,
                    (posX + (hitbox.boundingBox.width * .1)),
                    (posY + (hitbox.boundingBox.height * .15)),
                    hitbox.boundingBox.width * scale * .8,
                    hitbox.boundingBox.height * scale * .44,
                    10,
                    "rgba(0, 0, 0, 0.5)",
                    "rgba(0, 0, 0, 0.5)",
                    0
                )

                drawImageFitInBox(
                    this.shopScrollBox.context,
                    item.image,
                    posX,
                    (posY + (hitbox.boundingBox.height * .15)),
                    hitbox.boundingBox.width * scale,
                    hitbox.boundingBox.height * scale * .43,
                )

                if (item.maxQuantity) {
                    for (var i = 0; i < item.maxQuantity; i++) {

                        let fillColor = i < item.getCurrentQuantity() || item.isMaxedOut() ? "#F7BD00" : "#dedede";

                        drawCircle(
                            this.shopScrollBox.context,
                            (posX + (hitbox.boundingBox.width * .15) + (hitbox.boundingBox.width * .07 * i)),
                            (posY + (hitbox.boundingBox.height * .2)),
                            hitbox.boundingBox.height * .02 * scale,
                            fillColor,
                            "#000000",
                            2
                        );
                    }

                }


                this.shopScrollBox.context.save();
                this.shopScrollBox.context.font = (hitbox.boundingBox.height * .1) + "px Verdana";
                this.shopScrollBox.context.fillStyle = "#FFFFFF";

                fillTextShrinkToFit(
                    this.shopScrollBox.context,
                    item.name,
                    (posX + (hitbox.boundingBox.height * .05)),
                    (posY + (hitbox.boundingBox.height * .115)),
                    hitbox.boundingBox.width * .9 * scale,
                    "center"
                )

                if (!item.isMaxedOut() && item.getCost() > 0) {
                    let ticketOffset = item.getCost() < 10 ? .31 : .28
                    drawImageFitInBox(
                        this.shopScrollBox.context,
                        smallShopTicketGold,
                        (posX + (hitbox.boundingBox.width * ticketOffset)),
                        (posY + (hitbox.boundingBox.height * .68)),
                        hitbox.boundingBox.width * .75 * scale,
                        hitbox.boundingBox.height * .1 * scale,
                        "left"
                    )

                    let costOffset = item.getCost() < 10 ? .64 : .6
                    this.shopScrollBox.context.fillStyle = "#F8E460";
                    fillTextShrinkToFit(
                        this.shopScrollBox.context,
                        "x" + item.getCost(),
                        (posX + (hitbox.boundingBox.width * costOffset)),
                        (posY + (hitbox.boundingBox.height * .765)),
                        hitbox.boundingBox.width * .7 * scale,
                    )
                }

                this.shopScrollBox.context.font = (hitbox.boundingBox.height * .17) + "px KanitM";
                this.shopScrollBox.context.fillStyle = "#1798c7";
                let buttonText;
                if (item.getCost() > 0) {
                    buttonText = item.isMaxedOut() ? _("MAX LEVEL") : _("BUY");
                } else {
                    buttonText = _("FREE");
                }
                let yOffset = item.isMaxedOut() ? .97 : .98;
                fillTextShrinkToFit(
                    this.shopScrollBox.context,
                    buttonText,
                    (posX + (hitbox.boundingBox.width * .125)),
                    (posY + (hitbox.boundingBox.height * yOffset)),
                    hitbox.boundingBox.width * .75 * scale,
                    "center"
                )

                if (item.type == ChestType.black) {
                    var smInfoButton = hitbox.getHitboxById("SMInfoButton");
                    if (smInfoButton) {
                        drawImageFitInBox(
                            this.shopScrollBox.context,
                            infoIcon,
                            (posX + hitbox.boundingBox.width * .855),
                            (posY + hitbox.boundingBox.height * .16),
                            smInfoButton.boundingBox.width,
                            smInfoButton.boundingBox.height
                        )
                    }
                }

                this.shopScrollBox.context.restore();
            })

        }
        this.context.restore();


        PU.fillStyle = "#FFF";
        PU.font = "24px KanitM";
        PU.drawImage(smallShopTicketGold, 0, 0, smallShopTicketGold.width, smallShopTicketGold.height, purchasedw * .07, purchasedh * .85, purchasedw * .09, purchasedh * .05);
        PU.fillText("x" + tickets, purchasedw * .17, purchasedh * .89);
    }

    renderHeaders() {
        this.shopScrollBox.context.save();

        for (let i = 0; i < this.categoryHeaders.length; i++) {
            if (!this.categoryHeaders[i].hitbox) continue;

            var text = this.categoryHeaders[i].text;
            var headerHeight = this.categoryHeaders[i].hitbox.boundingBox.height;

            // Draw header text
            this.shopScrollBox.context.font = (headerHeight * 0.8) + "px KanitM";
            this.shopScrollBox.context.fillStyle = "#FFFFFF";
            this.shopScrollBox.context.textBaseline = "middle";
            this.shopScrollBox.context.fillText(
                text,
                this.shopScrollBox.contentWidth * 0.05,
                this.categoryHeaders[i].renderY + (headerHeight * 0.5)
            );

            // Draw divider line
            this.shopScrollBox.context.strokeStyle = "#FFFFFF";
            this.shopScrollBox.context.lineWidth = 2;
            this.shopScrollBox.context.beginPath();
            this.shopScrollBox.context.moveTo(0, this.categoryHeaders[i].renderY + headerHeight);
            this.shopScrollBox.context.lineTo(this.shopScrollBox.contentWidth, this.categoryHeaders[i].renderY + headerHeight);
            this.shopScrollBox.context.stroke();
        }

        this.shopScrollBox.context.restore();
    }
}