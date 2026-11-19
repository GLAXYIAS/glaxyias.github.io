class CraftingWindow extends TabbedPopupWindow
{
    layerName = "crafting"; // Used as key in activeLayers
    domElementId = "CRAFTINGD"; // ID of dom element that gets shown or hidden
    context = CRAFTING;         // Canvas rendering context for popup

    blueprintPane;
    blueprintPaneDefaultWidth;
    blueprintListHitboxes;

    craftingPane;
    isCraftingPaneInitialized = false;
    selectedBlueprint;
    discountedIngredients;
    drillPane;

    constructor(boundingBox, worldIndex = 0, openTab = 0)
    {
        super(boundingBox);
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        this.setFrameImagesByWorldIndex(worldIndex);

        this.context.imageSmoothingEnabled = false;
        this.initializeTabs([_("Craft"), _("Structures"), _("Drill")]);
        this.currentTabIndex = openTab;

        this.blueprintPaneDefaultWidth = this.bodyContainer.boundingBox.width * 0.4;
        this.blueprintPane = new Scrollbox(
            this.blueprintPaneDefaultWidth - 15,
            this.bodyContainer.boundingBox.height,
            this.context,
            this.bodyContainer.boundingBox.x,
            this.bodyContainer.boundingBox.y,
            this.blueprintPaneDefaultWidth,
            this.bodyContainer.boundingBox.height,
            15
        );
        this.addHitbox(this.blueprintPane);
        this.craftingPane = new Hitbox(
            {
                x: this.blueprintPaneDefaultWidth,
                y: 0,
                width: this.bodyContainer.boundingBox.width - this.blueprintPaneDefaultWidth,
                height: this.bodyContainer.boundingBox.height
            },
            {},
            "",
            "craftingPane"
        )
        this.craftingPane.render = function ()
        {
            var context = this.parent.parent.context;
            var coords = this.getRelativeCoordinates(0, 0, this.parent.parent);
            context.save();
            context.fillStyle = "#444444";
            context.fillRect(coords.x, coords.y, 3, this.boundingBox.height);
            this.renderChildren();
            context.restore();
        }
        this.craftingPane.allowBubbling = true;
        this.bodyContainer.addHitbox(this.craftingPane);

        // Initialize drill pane
        this.drillPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.bodyContainer.boundingBox.width,
                height: this.bodyContainer.boundingBox.height
            },
            {},
            "",
            "drillPane"
        );
        this.drillPane.allowBubbling = true;
        this.drillPane.setVisible(false);
        this.drillPane.setEnabled(false);
        this.bodyContainer.addHitbox(this.drillPane);

        this.initializeBlueprintList();
        this.initializeCraftingPane();
        this.initializeEquipList();
        this.initializeDrillIconHitboxes();
    }

    render()
    {
        if(this.currentTabIndex == 0)
        {
            var menuPadding = 2;
            this.context.save();
            this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
            if(isKnownBlueprintsDirty)
            {
                this.initializeBlueprintList();
                isKnownBlueprintsDirty = false;
            }
            if(this.blueprintListHitboxes.length > 0)
            {
                // Update bounding boxes to account for menu expansion
                for(var i = 1; i < this.blueprintListHitboxes.length; ++i)
                {
                    if(this.blueprintListHitboxes[i].boundingBox.y != this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding)
                    {
                        this.blueprintListHitboxes[i].boundingBox.y = this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding;
                    }
                }
                var bottomOfLastMenu = this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding;
                if(bottomOfLastMenu != this.blueprintPane.contentHeight)
                {
                    this.blueprintPane.contentHeight = bottomOfLastMenu;
                    this.blueprintPane.initializeScrollbar();
                    this.blueprintPane.render();
                    this.blueprintPane.scrollTo(this.blueprintPane.currentScrollY);
                }
            }
            this.context.restore();
            super.render();
            this.blueprintPane.renderChildren();
            if(hasUnseenDrillBlueprints()) // DP: Save manager inserts empty string?
            {
                var flickerPeriod = 1500;
                var flickerMaxOpacity = 1;
                var flickerT = (Math.floor(new Date().getTime()) % flickerPeriod) / (flickerPeriod / 2);
                if(flickerT > 1)
                {
                    flickerT = 2 - flickerT;
                }
                this.context.globalAlpha = flickerMaxOpacity * flickerT;
                var markerSize = 5;
                this.context.fillStyle = "#FF0000";
                this.context.strokeStyle = "#FFFFFF";
                this.context.lineWidth = 2;
                this.context.beginPath();
                this.context.arc(
                    this.tabs[0].boundingBox.x + this.tabs[0].boundingBox.width - 2 * markerSize,
                    this.tabs[0].boundingBox.y + 2 * markerSize,
                    markerSize,
                    0,
                    2 * Math.PI
                );
                this.context.fill();
                this.context.stroke();
                this.context.globalAlpha = 1;
            }
        }
        else if(this.currentTabIndex == 1)
        {
            var menuPadding = 2;
            this.context.save();
            this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
            if(isKnownBlueprintsDirty)
            {
                this.initializeBlueprintList();
                isKnownBlueprintsDirty = false;
            }
            if(this.blueprintListHitboxes.length > 0)
            {
                // Update bounding boxes to account for menu expansion
                for(var i = 1; i < this.blueprintListHitboxes.length; ++i)
                {
                    if(this.blueprintListHitboxes[i].boundingBox.y != this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding)
                    {
                        this.blueprintListHitboxes[i].boundingBox.y = this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding;
                    }
                }
                var bottomOfLastMenu = this.blueprintListHitboxes[i - 1].boundingBox.y + this.blueprintListHitboxes[i - 1].boundingBox.height + menuPadding;
                if(bottomOfLastMenu != this.blueprintPane.contentHeight)
                {
                    this.blueprintPane.contentHeight = bottomOfLastMenu;
                    this.blueprintPane.initializeScrollbar();
                    this.blueprintPane.render();
                    this.blueprintPane.scrollTo(this.blueprintPane.currentScrollY);
                }
            }
            this.context.restore();
            super.render();
            if(hasUnseenStructureBlueprints()) // DP: Save manager inserts empty string?
            {
                var flickerPeriod = 1500;
                var flickerMaxOpacity = 1;
                var flickerT = (Math.floor(new Date().getTime()) % flickerPeriod) / (flickerPeriod / 2);
                if(flickerT > 1)
                {
                    flickerT = 2 - flickerT;
                }
                this.context.globalAlpha = flickerMaxOpacity * flickerT;
                var markerSize = 5;
                this.context.fillStyle = "#FF0000";
                this.context.strokeStyle = "#FFFFFF";
                this.context.lineWidth = 2;
                this.context.beginPath();
                this.context.arc(
                    this.tabs[1].boundingBox.x + this.tabs[0].boundingBox.width - 2 * markerSize,
                    this.tabs[1].boundingBox.y + 2 * markerSize,
                    markerSize,
                    0,
                    2 * Math.PI
                );
                this.context.fill();
                this.context.stroke();
                this.context.globalAlpha = 1;
            }
        }
        else if(this.currentTabIndex == 2)
        {
            // Render Drill tab
            this.context.save();
            this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
            super.render();
            this.renderDrillVisualization();
            this.context.restore();
        }

        if(this.currentTabIndex == 0 && this.selectedBlueprint && this.selectedBlueprint.shopSubcategory == "Golem")
        {
            showGolemDialogue();
        }
        else if(this.currentTabIndex == 0 && this.selectedBlueprint && this.selectedBlueprint.shopSubcategory == "Broken Robot")
        {
            showGidgetDialogue();
        }
        else
        {
            showMechanicDialogue();
        }
    }

    close()
    {
        if (activeLayers.MainUILayer) {
            activeLayers.MainUILayer.removeDialogueAttachment();
        }
        animate();

        return super.close();
    }

    onTabChange()
    {
        this.selectedBlueprint = null;
        this.blueprintListHitboxes = [];
        if(this.currentTabIndex <= 1)
        {
            this.craftingPane.setVisible(true)
            this.craftingPane.setEnabled(true)
            this.blueprintPane.setVisible(true)
            this.blueprintPane.setEnabled(true)
            this.equipList.setVisible(false)
            this.equipList.setEnabled(false)
            this.drillPane.setVisible(false)
            this.drillPane.setEnabled(false)
            this.blueprintPane.scrollTo(0);
            this.initializeBlueprintList();
            this.initializeCraftingPane();
            this.blueprintPane.contentHeight = 1;
            this.blueprintPane.clearCanvas();
            this.blueprintPane.initializeScrollbar();
        }
        else if(this.currentTabIndex == 2)
        {
            // Drill tab
            this.craftingPane.setVisible(false)
            this.craftingPane.setEnabled(false)
            this.blueprintPane.setVisible(false)
            this.blueprintPane.setEnabled(false)
            this.equipList.setVisible(false)
            this.equipList.setEnabled(false)
            this.drillPane.setVisible(true)
            this.drillPane.setEnabled(true)
        }
        this.tutorialFlicker();
    }

    initializeBlueprintList(openSubcategoryMenus = [])
    {
        var parentHitbox = this.blueprintPane;
        var craftCategory;
        parentHitbox.clearHitboxes();
        for(var i in this.blueprintListHitboxes)
        {
            if(!this.blueprintListHitboxes[i].isCollapsed)
            {
                openSubcategoryMenus.push(i);
            }
        }
        // parentHitbox.context.clearRect(0, 0, parentHitbox.contentWidth, parentHitbox.contentHeight);
        this.blueprintListHitboxes = [];
        var cumulativeHeight = 0;
        var blueprintList;
        if(this.currentTabIndex == 0)
        {
            craftCategory = 1;
            blueprintList = getKnownBlueprints();
            var blueprintsInCategory = filterBlueprintsByCategoryAndLevel(blueprintList, craftCategory);
            blueprintsInCategory = sortBlueprintsByShopSubcategory(blueprintsInCategory);
        }
        else if(this.currentTabIndex == 1)
        {
            craftCategory = 3;
            blueprintList = getKnownBlueprints();
            var blueprintsInCategory = filterBlueprintsByCategory(blueprintList, craftCategory);
            //blueprintsInCategory = filterBlueprints(blueprintsInCategory, function (blueprint) {return !blueprint.craftedItem.item.isAtMaxLevel();});
            blueprintsInCategory = sortBlueprintsBySubcategory(blueprintsInCategory);
        }
        for(var subcategory in blueprintsInCategory)
        {
            //targetCanvasContext, x, y, width, collapsedHeight, expandedHeight, titleText, fontSize, fontColor
            var newMenu = new CollapsibleMenu(
                parentHitbox.context,
                0,
                cumulativeHeight,
                parentHitbox.boundingBox.width - parentHitbox.scrollbarWidth,
                40,
                0,
                subcategory,
                "18px Verdana",
                "#FFFFFF"
            );
            this.generateSubcategoryMenuContents(blueprintsInCategory[subcategory], newMenu);
            this.blueprintListHitboxes.push(newMenu);
            parentHitbox.addHitbox(newMenu);
            cumulativeHeight += newMenu.boundingBox.height;
        }
        if(openSubcategoryMenus.length > 0)
        {
            for(var i in openSubcategoryMenus)
            {
                if(this.blueprintListHitboxes[openSubcategoryMenus[i]])
                {
                    this.blueprintListHitboxes[openSubcategoryMenus[i]].expand();
                }
            }
        }
        else if(this.blueprintListHitboxes.length == 1)
        {
            this.blueprintListHitboxes[0].expand();
        }
        parentHitbox.isDirty = true;
        // parentHitbox.render();
        // this.render();
    }

    generateSubcategoryMenuContents(blueprintsInSubcategory, menuHitbox)
    {
        var slotSize = Math.min(50, Math.floor(this.boundingBox.height * 0.117));
        var padding = 3;
        var slotsPerRow = Math.floor((menuHitbox.boundingBox.width - padding * 2) / slotSize);
        var totalRows = Math.ceil(blueprintsInSubcategory.length / slotsPerRow);
        var slotSpacing = ((menuHitbox.boundingBox.width - padding * 2) - (slotSize * slotsPerRow)) / (slotsPerRow - 1);
        menuHitbox.canvas.height = totalRows * (slotSize + slotSpacing) + 2 * padding;
        menuHitbox.expandedHeight = menuHitbox.canvas.height + menuHitbox.collapsedHeight;
        menuHitbox.context.save();
        menuHitbox.showNotificationIcon = false;
        for(var i = 0; i < blueprintsInSubcategory.length; ++i)
        {
            var blueprint = blueprintsInSubcategory[i];
            if(!blueprint) continue;
            var indexInRow = i % slotsPerRow;
            var slotX = padding + indexInRow * (slotSize + slotSpacing);
            var slotY = padding + Math.floor(i / slotsPerRow) * (slotSize + slotSpacing);
            drawImageFitInBox(
                menuHitbox.context,
                blueprint.craftedItem.item.getIcon(),
                slotX,
                slotY,
                slotSize,
                slotSize
            );
            if(this.selectedBlueprint == blueprint)
            {
                menuHitbox.context.strokeStyle = "#76E374";
                menuHitbox.context.lineWidth = 3;
                menuHitbox.context.beginPath();
                menuHitbox.context.strokeRect(
                    slotX + menuHitbox.context.lineWidth,
                    slotY + menuHitbox.context.lineWidth,
                    slotSize - 2 * menuHitbox.context.lineWidth,
                    slotSize - 2 * menuHitbox.context.lineWidth
                );
                menuHitbox.context.stroke();
            }
            if(isBlueprintUnseen(blueprint.category, blueprint.id))
            {
                menuHitbox.showNotificationIcon = true;
                var markerSize = 5;
                menuHitbox.context.fillStyle = "#FF0000";
                menuHitbox.context.strokeStyle = "#FFFFFF";
                menuHitbox.context.lineWidth = 2;
                menuHitbox.context.beginPath();
                menuHitbox.context.arc(
                    slotX + slotSize - markerSize,
                    slotY + markerSize,
                    markerSize,
                    0,
                    2 * Math.PI
                );
                menuHitbox.context.fill();
                menuHitbox.context.stroke();
            }
            if(blueprint.category == 3 && blueprint.craftedItem.item.getQuantityOwned() > -1)
            {
                menuHitbox.context.fillStyle = "#FFFFFF";
                menuHitbox.context.strokeStyle = "#000000";
                var fontSize = Math.min(16, this.boundingBox.height * 0.037);
                menuHitbox.context.font = fontSize + "px Verdana";
                menuHitbox.context.textBaseline = "bottom";
                menuHitbox.context.lineWidth = 3;
                if(!blueprint.craftedItem.item.isAtMaxLevel())
                {
                    strokeTextShrinkToFit(
                        menuHitbox.context,
                        blueprint.craftedItem.item.getCurrentLevel() + 1,
                        slotX,
                        slotY + slotSize,
                        slotSize,
                        "right"
                    );
                    fillTextShrinkToFit(
                        menuHitbox.context,
                        blueprint.craftedItem.item.getCurrentLevel() + 1,
                        slotX,
                        slotY + slotSize,
                        slotSize,
                        "right"
                    );
                }
                else
                {
                    strokeTextShrinkToFit(
                        menuHitbox.context,
                        _("max"),
                        slotX,
                        slotY + slotSize,
                        slotSize,
                        "right"
                    );
                    fillTextShrinkToFit(
                        menuHitbox.context,
                        _("max"),
                        slotX,
                        slotY + slotSize,
                        slotSize,
                        "right"
                    );
                }
            }
            var itemHitbox = new Hitbox(
                {
                    x: slotX,
                    y: slotY + menuHitbox.collapsedHeight,
                    width: slotSize,
                    height: slotSize
                },
                {
                    onmousedown: function (blueprint)
                    {
                        this.selectedBlueprint = blueprint;
                        if(blueprint.hasOwnProperty("levels"))
                        {
                            var currentLevel = blueprint.craftedItem.item.getCurrentLevel();
                            if(!blueprint.craftedItem.item.isAtMaxLevel())
                            {
                                this.discountedIngredients = getIngredientListWithDiscounts(blueprint.levels[currentLevel].ingredients);
                            }
                            else
                            {
                                this.discountedIngredients = null;
                            }
                        }
                        else
                        {
                            this.discountedIngredients = getIngredientListWithDiscounts(blueprint.ingredients);
                        }
                        this.initializeCraftingPane();
                    }.bind(this, blueprint),
                    onmouseenter: function (blueprint, x, y)
                    {
                        var coords = this.getGlobalCoordinates(x, y);
                        showTooltip(
                            _(blueprint.craftedItem.item.getName()),
                            _(blueprint.craftedItem.item.getDescription()),
                            coords.x * uiScaleX,
                            coords.y * uiScaleY
                        );
                    }.bind(menuHitbox, blueprint, slotX, slotY + slotSize + menuHitbox.collapsedHeight),
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "pointer"
            );
            menuHitbox.addHitbox(itemHitbox, true);
            var highlight = new EasyHintHighlight(function (menuHitbox, blueprint)
            {
                var canCraft = canCraftBlueprint(blueprint.category, blueprint.id, -1);
                if(canCraft)
                {
                    menuHitbox.canCraftBlueprintInSubcategory = canCraft;
                }
                return !menuHitbox.isCollapsed && canCraft;
            }.bind(this, menuHitbox, blueprint));
            highlight.root = this.blueprintPane;
            highlight.rootContext = this.blueprintPane.context;
            highlight.fillRelativeAlpha = 0.3;
            highlight.highlightColor = "#71f06e";
            highlight.pulsePeriod = 48;
            itemHitbox.addHitbox(highlight);
        }
        var highlight = new EasyHintHighlight(function (menuHitbox)
        {
            return menuHitbox.isCollapsed && menuHitbox.canCraftBlueprintInSubcategory;
        }.bind(this, menuHitbox, blueprint));
        highlight.root = this.blueprintPane;
        highlight.rootContext = this.blueprintPane.context;
        highlight.fillRelativeAlpha = 0.3;
        highlight.highlightColor = "#71f06e";
        highlight.pulsePeriod = 48;
        menuHitbox.addHitbox(highlight);
        menuHitbox.context.restore();
    }

    initializeCraftingPane()
    {
        if(this.selectedBlueprint)
        {
            if(this.currentTabIndex == 1)
            {
                if(this.selectedBlueprint.hasOwnProperty("levels"))
                {
                    var currentLevel = this.selectedBlueprint.craftedItem.item.getCurrentLevel();
                    if(!this.selectedBlueprint.craftedItem.item.isAtMaxLevel())
                    {
                        this.discountedIngredients = getIngredientListWithDiscounts(this.selectedBlueprint.levels[currentLevel].ingredients);
                    }
                    else
                    {
                        this.discountedIngredients = null;
                    }
                }
            }

            if(isBlueprintUnseen(this.selectedBlueprint.category, this.selectedBlueprint.id))
            {
                flagBlueprintAsSeen(this.selectedBlueprint.category, this.selectedBlueprint.id);
            }
            this.craftingPane.clearHitboxes();
            var isSelectedBlueprintKnown = isBlueprintKnown(
                this.selectedBlueprint.category,
                this.selectedBlueprint.id
            );
            var isSelectedBlueprintAvailable = isBlueprintAvailable(
                this.selectedBlueprint.category,
                this.selectedBlueprint.id
            );
            var xPadding = 20;
            var yPadding = this.boundingBox.height * 0.02;
            var iconSize = Math.min(55, Math.ceil(this.boundingBox.height * 0.128));
            var titleBoxPadding = iconSize / 10;
            var blueprintNameBox = new Hitbox(
                {
                    x: xPadding,
                    y: yPadding,
                    width: this.craftingPane.boundingBox.width - 2 * xPadding,
                    height: iconSize + 2 * titleBoxPadding
                },
                {},
                "",
                "blueprintNameBox"
            );
            blueprintNameBox.render = function (parentWindow)
            {
                var context = parentWindow.getContext();
                var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
                context.save();
                context.globalAlpha = 0.6;
                context.fillStyle = "#111111";
                context.fillRect(relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
                context.globalAlpha = 1;
                var fontSize = Math.min(22, parentWindow.boundingBox.height * 0.055);
                context.font = fontSize + "px KanitM";
                context.fillStyle = "#FFFFFF";
                context.textBaseline = "top";
                fillTextWrap(
                    context,
                    parentWindow.selectedBlueprint.craftedItem.item.getName(),
                    relativeCoords.x + iconSize + titleBoxPadding * 4,
                    relativeCoords.y + titleBoxPadding,
                    this.boundingBox.width - iconSize - titleBoxPadding * 5,
                    "left",
                    0.25
                );
                context.restore();
                this.renderChildren();
            }.bind(blueprintNameBox, this);
            var blueprintIcon = new Hitbox(
                {
                    x: titleBoxPadding,
                    y: titleBoxPadding,
                    width: iconSize,
                    height: iconSize
                },
                {
                    onmouseenter: function (blueprint, x, y)
                    {
                        var coords = this.getGlobalCoordinates(x, y);
                        var rawIngredients = getRawIngredientsForBlueprint(blueprint);
                        var ingredientsString = _("Requires") + ":<br>";
                        for(var i in rawIngredients)
                        {
                            ingredientsString += i + ": " + rawIngredients[i] + "<br>";
                        }
                        showTooltip(
                            _(blueprint.craftedItem.item.getName()),
                            blueprint.craftedItem.item.getDescription(),
                            coords.x * uiScaleX,
                            coords.y * uiScaleY
                        );
                    }.bind(blueprintNameBox, this.selectedBlueprint, titleBoxPadding, titleBoxPadding + iconSize),
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "pointer",
                "blueprintIcon"
            );
            blueprintIcon.render = function (parentWindow)
            {
                var context = this.getContext();
                var blueprint = parentWindow.selectedBlueprint;
                var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
                drawImageFitInBox(context, blueprint.craftedItem.item.getIcon(), relativeCoords.x, relativeCoords.y, iconSize, iconSize);
            }.bind(blueprintIcon, this);
            var ingredientsFontSize = Math.min(16, this.boundingBox.height * 0.037);
            var blueprintIngredientsBox = new Hitbox(
                {
                    x: xPadding,
                    y: ingredientsFontSize + blueprintNameBox.boundingBox.y + (blueprintNameBox.boundingBox.height * 1.5) + titleBoxPadding,
                    width: blueprintNameBox.boundingBox.width,
                    height: titleBoxPadding * 4 + iconSize * 2 + ingredientsFontSize * 2
                },
                {}, "", "ingredients"
            );
            blueprintIngredientsBox.render = function (parentWindow)
            {
                var context = this.getContext();
                var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
                var descriptionY = relativeCoords.y * .85;
                context.save();
                if(parentWindow.currentTabIndex == 0)
                {
                    context.fillStyle = "#FFFFFF";
                    context.font = ingredientsFontSize + "px KanitB";
                    fillTextWrap(context, _("Blueprint"), relativeCoords.x, descriptionY, parentWindow.boundingBox.width);
                    context.font = ingredientsFontSize + "px KanitM";
                    drawTextWrap(context, parentWindow.selectedBlueprint.craftedItem.item.getDescription(), relativeCoords.x, descriptionY + 24, (parentWindow.boundingBox.width - relativeCoords.x) * .9, "left", 0.25);
                    context.globalAlpha = 0.6;
                    context.fillStyle = "#111111";
                    context.fillRect(relativeCoords.x, relativeCoords.y + ingredientsFontSize * 6.5, this.boundingBox.width, this.boundingBox.height - ingredientsFontSize * 6.5);
                    context.globalAlpha = 1;
                }
                else if(parentWindow.currentTabIndex == 1)
                {
                    context.fillStyle = "#FFFFFF";
                    context.font = ingredientsFontSize + "px KanitB";
                    fillTextWrap(context, _("Blueprint"), relativeCoords.x, descriptionY, parentWindow.boundingBox.width);
                    context.font = ingredientsFontSize + "px KanitM";
                    drawTextWrap(context, parentWindow.selectedBlueprint.craftedItem.item.getDescription(), relativeCoords.x, descriptionY + 24, (parentWindow.boundingBox.width - relativeCoords.x) * .9, "left", 0.25);
                    context.globalAlpha = 0.6;
                    context.fillStyle = "#111111";
                    context.fillRect(relativeCoords.x, relativeCoords.y + ingredientsFontSize * 6.5, this.boundingBox.width, this.boundingBox.height - ingredientsFontSize * 6.5);
                    context.globalAlpha = 1;
                }
                else
                {
                    context.globalAlpha = 0.6;
                    context.fillStyle = "#111111";
                    context.fillRect(relativeCoords.x, relativeCoords.y + ingredientsFontSize * 6.5, this.boundingBox.width, this.boundingBox.height - ingredientsFontSize * 6.5);
                    // context.fillRect(relativeCoords.x, relativeCoords.y + ingredientsFontSize, this.boundingBox.width, this.boundingBox.height - ingredientsFontSize);
                    context.globalAlpha = 1;
                    context.fillStyle = "#FFFFFF";
                    context.font = ingredientsFontSize + "px KanitM";
                    // context.textBaseline = "top";
                    // context.fillText(_("Ingredients"), relativeCoords.x, relativeCoords.y)    
                    fillTextWrap(context, parentWindow.selectedBlueprint.craftedItem.item.getDescription(), relativeCoords.x, relativeCoords.y + ingredientsFontSize, parentWindow.boundingBox.width, "left", 0.25);
                }
                context.restore();
                this.renderChildren();
            }.bind(blueprintIngredientsBox, this);
            var slotsPerRow = Math.floor((blueprintIngredientsBox.boundingBox.width - titleBoxPadding * 2) / iconSize);
            var slotSpacing = ((blueprintIngredientsBox.boundingBox.width - titleBoxPadding * 2) - (iconSize * slotsPerRow)) / (slotsPerRow - 1);

            if(isSelectedBlueprintKnown || isSelectedBlueprintAvailable)
            {
                var yOffset = ingredientsFontSize * 6.5;
                for(var i in this.discountedIngredients)
                {
                    var indexInRow = i % slotsPerRow;
                    var slotX = titleBoxPadding + indexInRow * (iconSize + slotSpacing);
                    var slotY = titleBoxPadding + Math.floor(i / slotsPerRow) * (iconSize + slotSpacing);
                    var ingredientIcon = new Hitbox(
                        {
                            x: slotX,
                            y: slotY + yOffset,
                            width: iconSize,
                            height: iconSize
                        },
                        {
                            onmousedown: function (blueprint)
                            {
                                if(blueprint)
                                {
                                    if(blueprint.category != this.currentTabIndex)
                                    {
                                        this.blueprintPane.scrollTo(0);
                                        this.currentTabIndex = blueprint.category + 1;
                                        this.initializeBlueprintList();
                                    }
                                    this.selectedBlueprint = blueprint;
                                    this.discountedIngredients = getIngredientListWithDiscounts(blueprint.ingredients);
                                    this.initializeCraftingPane();
                                }
                            }.bind(this, getBlueprintForCraftingItem(this.discountedIngredients[i].item, true)),
                            onmouseenter: function (ingredient, x, y)
                            {
                                var coords = this.getGlobalCoordinates(x, y);
                                let description = _("Owned: {0}<br>Required: {1}", beautifynum(ingredient.item.getQuantityOwned()), beautifynum(ingredient.quantity)) + ingredient.item.getDescription();
                                var itemID = ingredient.item.id;
                                var isMineral = mineralIds.includes(itemID);
                                var isIsotope = isotopeIds.includes(itemID);
                                if(managerStructure.level > 0 && (isMineral || isIsotope))
                                {
                                    description += "<br><br><strong>" + _("Click to prevent {0} from being sold.", ingredient.item.getName()) + "</strong>";
                                }
                                showTooltip(
                                    _(ingredient.item.getName()),
                                    description,
                                    coords.x * uiScaleX,
                                    coords.y * uiScaleY
                                );
                            }.bind(blueprintIngredientsBox, this.discountedIngredients[i], slotX, slotY + iconSize + ingredientsFontSize),
                            onmousedown: function (ingredient)
                            {

                                var itemID = ingredient.item.id;
                                var isMineral = mineralIds.includes(itemID);
                                var isIsotope = isotopeIds.includes(itemID);
                                if(isIsotope && getDepthMineralIsFoundAt(itemID) == 99999 && itemID > highestIsotopeUnlocked)
                                {
                                    var bombardment = getBombardmentForIsotope(ingredient.item.id);
                                    if(depth >= 1134 && bombardment)
                                    {
                                        openUi(ReactorWindow, null, 1);
                                        activeLayers.Reactor.selectedBlueprint = getBlueprintById(6, bombardment.index - 1);
                                        activeLayers.Reactor.blueprintListHitboxes[5].toggle();
                                        activeLayers.Reactor.initializeCraftingPane();
                                    }
                                }
                                else if(managerStructure.level > 0 && (isMineral || isIsotope))
                                {
                                    var confirmationMessage = "";

                                    if(lockedMineralAmtsToSave[ingredient.item.id] > 0)
                                    {
                                        confirmationMessage += _("\n You're currently preventing {0} {1} from being sold. ", beautifynum(lockedMineralAmtsToSave[ingredient.item.id]), ingredient.item.getName());
                                    }

                                    confirmationMessage += _("Are you sure you want to prevent {0} {1} from being sold?", beautifynum(ingredient.quantity), ingredient.item.getName());

                                    showConfirmationPrompt(
                                        confirmationMessage,
                                        _("Yes"),
                                        function ()
                                        {
                                            lockedMineralAmtsToSave[ingredient.item.id] = ingredient.quantity;
                                            hideSimpleInput();
                                        },
                                        _("Cancel")
                                    )
                                }
                            }.bind(blueprintIngredientsBox, this.discountedIngredients[i]),
                            onmouseexit: function ()
                            {
                                hideTooltip();
                            }
                        },
                        "pointer"
                    )
                    ingredientIcon.render = function (parentWindow, ingredient)
                    {
                        var context = this.getContext();
                        var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
                        drawImageFitInBox(context, ingredient.item.getIcon(), relativeCoords.x, relativeCoords.y, iconSize, iconSize);
                        context.fillStyle = "#FFFFFF";
                        var fontSize = Math.min(16, parentWindow.boundingBox.height * 0.037);
                        var barHeight = 0.2 * (this.boundingBox.height);
                        var percentQuantity = ingredient.item.percentageOfQuantity(ingredient.quantity);
                        renderFancyProgressBar(
                            context,
                            "",
                            percentQuantity,
                            relativeCoords.x,
                            relativeCoords.y + this.boundingBox.height - barHeight,
                            this.boundingBox.width,
                            barHeight,
                            percentQuantity >= 1 ? "#5EB65D" : "#c24242",
                            "#000000",
                            "#FFFFFF",
                            timerFrame
                        );
                        context.font = fontSize + "px Verdana";
                        context.textBaseline = "alphabetic";
                        context.lineWidth = 3;
                        context.strokeStyle = "#000000";
                        strokeTextShrinkToFit(
                            context,
                            ingredient.item.getFormattedQuantity(ingredient.quantity),
                            relativeCoords.x,
                            relativeCoords.y + iconSize - barHeight,
                            iconSize * 0.95,
                            "right"
                        );
                        fillTextShrinkToFit(
                            context,
                            ingredient.item.getFormattedQuantity(ingredient.quantity),
                            relativeCoords.x,
                            relativeCoords.y + iconSize - barHeight,
                            iconSize * 0.95,
                            "right"
                        );
                        if(ingredient.item.hasQuantity(ingredient.quantity))
                        {
                            // drawImageFitInBox(context, checkmark, relativeCoords.x, relativeCoords.y, iconSize / 5, iconSize / 5);
                            renderCheckmark(context, relativeCoords.x, relativeCoords.y, iconSize / 5, iconSize / 5);
                        }
                        else
                        {
                            // drawImageFitInBox(context, xmark, relativeCoords.x, relativeCoords.y, iconSize / 5, iconSize / 5);
                            renderXMark(context, relativeCoords.x, relativeCoords.y, iconSize / 5, iconSize / 5);
                        }
                    }.bind(ingredientIcon, this, this.discountedIngredients[i]);
                    blueprintIngredientsBox.addHitbox(ingredientIcon);
                }
            }
            var craftButton = new Hitbox(
                {
                    x: blueprintNameBox.boundingBox.x + (blueprintNameBox.boundingBox.width * .05),
                    y: this.craftingPane.boundingBox.height - ((this.boundingBox.height * .075) * 1.1),
                    width: blueprintNameBox.boundingBox.width * 0.8,
                    height: (this.boundingBox.height * .075)
                },
                {
                    onmousedown: function ()
                    {
                        if(isSelectedBlueprintKnown && this.currentTabIndex == 0)
                        {
                            if(craftBlueprint(this.selectedBlueprint.category, this.selectedBlueprint.id, 0, this.discountedIngredients))
                            {
                                newNews(_("You crafted {0}", this.selectedBlueprint.craftedItem.item.getName()), true);
                                pinnedBlueprintsManager.update();
                                if(!mutebuttons) craftDrillAudio.play();
                            }
                        }
                        else if(isSelectedBlueprintKnown && this.currentTabIndex == 1)
                        {
                            var level = this.selectedBlueprint.craftedItem.item.getCurrentLevel();
                            if(craftBlueprint(this.selectedBlueprint.category, this.selectedBlueprint.id, level + 1, this.discountedIngredients))
                            {
                                newNews(_("You crafted {0}", this.selectedBlueprint.craftedItem.item.getName()), true);
                                pinnedBlueprintsManager.update();
                                if(!mutebuttons) craftStructureAudio.play();
                            }
                        }
                        this.initializeCraftingPane();
                    }.bind(this),
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "pointer",
                "craftButton"
            )
            craftButton.onmouseenter = function (parentWindow)
            {
                if(!canCraftBlueprint(parentWindow.selectedBlueprint.category, parentWindow.selectedBlueprint.id, 0, parentWindow.discountedIngredients))
                {
                    var coords = this.getGlobalCoordinates(0, this.boundingBox.height);
                    showTooltip(getBlueprintNotCraftableReason(parentWindow.selectedBlueprint.category, parentWindow.selectedBlueprint.id), "", coords.x, coords.y);
                }
            }.bind(craftButton, this);
            craftButton.render = function (parentWindow)
            {
                var context = parentWindow.context;
                context.save();
                var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
                if(parentWindow.currentTabIndex == 0)
                {
                    if((isSelectedBlueprintKnown && canCraftBlueprint(parentWindow.selectedBlueprint.category, parentWindow.selectedBlueprint.id, 0, parentWindow.discountedIngredients)))
                    {
                        context.drawImage(upgradeb, relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
                        context.fillStyle = "#000000";
                    }
                    else
                    {
                        context.drawImage(upgradebg_blank, relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
                        context.fillStyle = "#444444";
                    }
                }
                else if(parentWindow.currentTabIndex == 1)
                {
                    var nextLevel = parentWindow.selectedBlueprint.craftedItem.item.getCurrentLevel() + 1;
                    if((isSelectedBlueprintKnown && canCraftBlueprint(parentWindow.selectedBlueprint.category, parentWindow.selectedBlueprint.id, nextLevel, parentWindow.discountedIngredients)))
                    {
                        context.drawImage(upgradeb, relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
                        context.fillStyle = "#000000";
                    }
                    else
                    {
                        context.drawImage(upgradebg_blank, relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
                        context.fillStyle = "#444444";
                    }
                }
                context.textBaseline = "middle";
                var buttonText;
                if(parentWindow.currentTabIndex == 0)
                {
                    if(drillState.equippedDrillEquips.indexOf(getDrillEquipByBlueprintId(parentWindow.selectedBlueprint.id).id) > -1)
                    {
                        buttonText = _("Equipped");
                        var fontSize = Math.min(26, parentWindow.boundingBox.height * 0.065);
                        context.font = fontSize + "px KanitB";
                    }
                    else
                    {
                        buttonText = _("Craft");
                        var fontSize = Math.min(32, parentWindow.boundingBox.height * 0.080);
                        context.font = fontSize + "px KanitB";
                    }
                }
                else if(parentWindow.currentTabIndex == 1)
                {
                    buttonText = _("Craft");
                    var fontSize = Math.min(32, parentWindow.boundingBox.height * 0.080);
                    context.font = fontSize + "px KanitB";
                }
                fillTextShrinkToFit(context, buttonText, relativeCoords.x + 10, relativeCoords.y + this.boundingBox.height / 2 + 2, this.boundingBox.width - 20, "center");
                context.restore();
            }.bind(craftButton, this)

            // var pinButton = new Hitbox(
            //     {
            //         x: craftButton.boundingBox.x + craftButton.boundingBox.width + (this.boundingBox.width * .01),
            //         y: this.craftingPane.boundingBox.height - ((this.boundingBox.height * .075) * 1.1),
            //         width: blueprintNameBox.boundingBox.width * 0.1,
            //         height: (this.boundingBox.height * .075)
            //     },
            //     {
            //         onmousedown: function ()
            //         {
            //             if(isSelectedBlueprintKnown) 
            //             {
            //                 pinnedBlueprintsManager.addPinnedBlueprint(this.selectedBlueprint.category, this.selectedBlueprint.id);
            //             }
            //         }.bind(this)
            //     },
            //     "pointer",
            //     "pinButton"
            // )
            // pinButton.render = function (parentWindow)
            // {
            //     var relativeCoords = this.getRelativeCoordinates(0, 0, parentWindow);
            //     drawImageFitInBox(this.getContext(), pin_Button, relativeCoords.x, relativeCoords.y, this.boundingBox.width, this.boundingBox.height);
            // }.bind(pinButton, this)

            this.craftingPane.addHitbox(blueprintNameBox);
            blueprintNameBox.addHitbox(blueprintIcon);
            this.craftingPane.addHitbox(blueprintIngredientsBox);
            this.craftingPane.addHitbox(craftButton);
            //this.craftingPane.addHitbox(pinButton);
            this.isCraftingPaneInitialized = true;
        }
        else
        {
            var instructionsText;
            if(this.currentTabIndex == 0 || this.currentTabIndex == 1)
            {
                if(knownBlueprints.length == 0 || knownBlueprints.length == 1 && knownBlueprints[0] == "")
                {
                    instructionsText = _("You don't own any blueprints. Find more in the mines.");
                }
                else
                {
                    instructionsText = _("Click on a blueprint on the left to craft it");
                }
            }
            this.craftingPane.clearHitboxes();
            var instructionsHitbox = new Hitbox(
                {
                    x: 20,
                    y: 20,
                    width: this.craftingPane.boundingBox.width - 40,
                    height: this.craftingPane.boundingBox.height - 40,
                },
                {},
                "",
                "instructionsHitbox"
            );
            instructionsHitbox.render = function (parentWindow)
            {
                var coords = this.getRelativeCoordinates(0, 0, parentWindow);
                var context = parentWindow.context;
                context.font = "18px Verdana";
                context.fillStyle = "#FFFFFF";
                context.textBaseline = "middle";
                fillTextWrap(
                    context,
                    instructionsText,
                    coords.x,
                    coords.y + this.boundingBox.height / 2 - 30,
                    this.boundingBox.width
                );
            }.bind(instructionsHitbox, this);
            this.craftingPane.addHitbox(instructionsHitbox);
        }
    }

    initializeEquipList()
    {
        var iconSize = Math.min(55, Math.ceil(this.boundingBox.height * 0.128));
        var padding = 10;
        var equipList = new Hitbox(
            {
                x: 30,
                y: this.bodyContainer.boundingBox.height / 2 - iconSize / 2,
                width: this.bodyContainer.boundingBox.width,
                height: iconSize
            },
            {}, "", "equipList"
        );
        for(var i = 0; i < 4; ++i)
        {
            var equipHitbox = new Hitbox(
                {
                    x: i * (iconSize + padding),
                    y: 0,
                    width: iconSize,
                    height: iconSize
                },
                {
                    onmouseenter: function (i, x, y)
                    {
                        var item = new DrillCraftingItem(drillState.equippedDrillEquips[i]);
                        var coords = this.getGlobalCoordinates(x, y);
                        showTooltip(
                            _(item.getName()),
                            _(item.getDescription()),
                            coords.x * uiScaleX,
                            coords.y * uiScaleY
                        );
                    }.bind(equipList, i, i * (iconSize + padding), iconSize),
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "pointer"
            )
            equipHitbox.render = function (parentWindow, i)
            {
                var item = new DrillCraftingItem(drillState.equippedDrillEquips[i]);
                var coords = this.getRelativeCoordinates(0, 0, parentWindow);
                parentWindow.context.drawImage(item.getIcon(), coords.x, coords.y, this.boundingBox.width, this.boundingBox.height);
            }.bind(equipHitbox, this, i);
            equipList.addHitbox(equipHitbox);
        }
        this.equipList = equipList;
        this.addHitbox(equipList);
        if(this.currentTabIndex != 2)
        {
            this.equipList.setEnabled(false)
            this.equipList.setVisible(false)
        }
    }

    tutorialFlicker()
    {
        if(!hasCraftedABlueprint && canCraftAnyBlueprint(1))
        {
            this.flickerTab(0, 500);
            return true;
        }
        else if(tradingPostStructure.level == 0 && canCraftBlueprint(3, 0))
        {
            this.flickerTab(1, 500);
            return true;
        }
        return false;
    }

    initializeDrillIconHitboxes()
    {
        var buydw = this.bodyContainer.boundingBox.width;
        var buydh = this.bodyContainer.boundingBox.height;

        var drillWidth = buydw * .5;
        var drillHeight = buydh * .7;
        var drillX = (buydw - drillWidth) / 2;
        var drillY = buydh * .05;

        var iconSize = buydw * .08;
        var iconPadding = buydw * .15;  // Match the rendering padding

        var leftX = drillX - iconSize - iconPadding;
        var topY = drillY;
        var bottomY = drillY + drillHeight - iconSize;
        var rightX = drillX + drillWidth + iconPadding;

        // Create hitboxes for each icon position: [0]=Engine(top-left), [1]=Drill(bottom-left), [2]=Fan(top-right), [3]=Cargo(bottom-right)
        var iconPositions = [
            {x: leftX, y: topY, index: 0, isBottom: false},           // Engine (top-left)
            {x: leftX, y: bottomY, index: 1, isBottom: true},         // Drill (bottom-left)
            {x: rightX, y: topY, index: 2, isBottom: false},          // Fan (top-right)
            {x: rightX, y: bottomY, index: 3, isBottom: true}         // Cargo (bottom-right)
        ];

        for(var i = 0; i < iconPositions.length; i++)
        {
            var pos = iconPositions[i];
            var iconHitbox = new Hitbox(
                {
                    x: pos.x,
                    y: pos.y,
                    width: iconSize,
                    height: iconSize
                },
                {
                    onmouseenter: function (equipIndex, x, y, isBottom, size)
                    {
                        if(drillState.equippedDrillEquips[equipIndex] > -1)
                        {
                            var item = new DrillCraftingItem(drillState.equippedDrillEquips[equipIndex]);
                            var coords = this.getGlobalCoordinates(x, y);
                            // Show tooltip from bottom corner for all icons
                            var tooltipY = (coords.y + size) * uiScaleY;
                            showTooltip(
                                _(item.getName()),
                                _(item.getDescription()),
                                coords.x * uiScaleX,
                                tooltipY
                            );
                        }
                    }.bind(this.drillPane, pos.index, pos.x, pos.y, pos.isBottom, iconSize),
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "pointer"
            );
            this.drillPane.addHitbox(iconHitbox);
        }
    }

    renderDrillVisualization()
    {
        var context = this.context;
        var buydw = this.bodyContainer.boundingBox.width;
        var buydh = this.bodyContainer.boundingBox.height;

        context.save();
        context.imageSmoothingEnabled = false;

        // Calculate centered position for the drill
        var drillWidth = buydw * .5;  // Make drill bigger (50% of width)
        var drillHeight = buydh * .7; // Make drill bigger (70% of height)
        var drillX = this.bodyContainer.boundingBox.x + (buydw - drillWidth) / 2; // Center horizontally
        var drillY = this.bodyContainer.boundingBox.y + buydh * .05; // Position near the top

        // Draw only the drill and engine, centered and bigger
        context.drawImage(drillState.drill().worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, drillX, drillY, drillWidth, drillHeight);
        context.drawImage(drillState.engine().worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, drillX, drillY, drillWidth, drillHeight);

        // Draw equipped drill parts icons in corners around the drill
        var iconSize = buydw * .08;
        var iconPadding = buydw * .15;  // Tripled padding to make lines much longer

        // Left side icons (top and bottom)
        var leftX = drillX - iconSize - iconPadding;
        var topY = drillY;
        var bottomY = drillY + drillHeight - iconSize;

        // Right side icons (top and bottom)
        var rightX = drillX + drillWidth + iconPadding;

        // Draw white connecting lines
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 2;

        // Icon positions: Engine (top-left), Drill (bottom-left), Fan (top-right), Cargo (bottom-right)
        // Draw lines from icon centers to drill edges
        if(drillState.equippedDrillEquips[0] > -1)
        {
            context.beginPath();
            context.moveTo(leftX + iconSize, topY + iconSize / 2);
            context.lineTo(drillX, topY + iconSize / 2);
            context.stroke();
        }
        if(drillState.equippedDrillEquips[1] > -1)
        {
            context.beginPath();
            context.moveTo(leftX + iconSize, bottomY + iconSize / 2);
            context.lineTo(drillX, bottomY + iconSize / 2);
            context.stroke();
        }
        if(drillState.equippedDrillEquips[2] > -1)
        {
            context.beginPath();
            context.moveTo(rightX, topY + iconSize / 2);
            context.lineTo(drillX + drillWidth, topY + iconSize / 2);
            context.stroke();
        }
        if(drillState.equippedDrillEquips[3] > -1)
        {
            context.beginPath();
            context.moveTo(rightX, bottomY + iconSize / 2);
            context.lineTo(drillX + drillWidth, bottomY + iconSize / 2);
            context.stroke();
        }

        // Draw icons: Engine (top-left), Drill (bottom-left), Fan (top-right), Cargo (bottom-right)
        if(drillState.equippedDrillEquips[0] > -1)
        {
            context.drawImage(drillState.engine().icon, 0, 0, 50, 50, leftX, topY, iconSize, iconSize);
        }
        if(drillState.equippedDrillEquips[1] > -1)
        {
            context.drawImage(drillState.drill().icon, 0, 0, 50, 50, leftX, bottomY, iconSize, iconSize);
        }
        if(drillState.equippedDrillEquips[2] > -1)
        {
            context.drawImage(drillState.fan().icon, 0, 0, 50, 50, rightX, topY, iconSize, iconSize);
        }
        if(drillState.equippedDrillEquips[3] > -1)
        {
            context.drawImage(drillState.cargo().icon, 0, 0, 50, 50, rightX, bottomY, iconSize, iconSize);
        }

        // Draw drill status at the bottom
        var statusY = this.bodyContainer.boundingBox.y + buydh * 0.85;
        var statusCenterX = this.bodyContainer.boundingBox.x + buydw / 2;
        var isDrillStalled = battleManager.isStalledDueToBoss() || isWaitingForLiftoff();

        context.textAlign = "center";
        context.textBaseline = "middle";

        if(isDrillStalled)
        {
            // Draw "Drill Stalled" in red with warning icons
            context.fillStyle = "#FF0000";
            var iconSize = buydh * 0.15;
            var fontSize = Math.max(18, iconSize * 0.64);
            context.font = fontSize + "px Verdana";
            var statusText = _("Drill Stalled");
            var textWidth = context.measureText(statusText).width;
            var iconSpacing = buydw * 0.02;

            // Calculate pulsing alpha for warning_sign_shine
            var pulsePeriod = 24;
            var pulseAlpha = oscillate(numFramesRendered, pulsePeriod / 2);

            // Draw left icon
            var leftIconX = statusCenterX - textWidth / 2 - iconSize - iconSpacing;
            var iconY = statusY - iconSize / 2;
            context.drawImage(warning_sign, leftIconX, iconY, iconSize, iconSize);
            context.save();
            context.globalAlpha = pulseAlpha;
            context.drawImage(warning_sign_shine, leftIconX, iconY, iconSize, iconSize);
            context.restore();

            // Draw text
            context.fillText(statusText, statusCenterX, statusY);

            // Draw right icon
            var rightIconX = statusCenterX + textWidth / 2 + iconSpacing;
            context.drawImage(warning_sign, rightIconX, iconY, iconSize, iconSize);
            context.save();
            context.globalAlpha = pulseAlpha;
            context.drawImage(warning_sign_shine, rightIconX, iconY, iconSize, iconSize);
            context.restore();
        } else
        {
            // Draw "Drill Power" in white
            context.fillStyle = "#FFFFFF";
            var powerText = _("Drill Power") + ": " + beautifynum(drillWattage()) + " W";
            context.fillText(powerText, statusCenterX, statusY);
        }

        context.textAlign = "left";
        context.restore();
    }

}