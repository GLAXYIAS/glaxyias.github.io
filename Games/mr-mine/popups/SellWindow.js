class SellWindow extends TabbedPopupWindow
{
    layerName = "SELL"; // Used as key in activeLayers
    domElementId = "SELLD"; // ID of dom element that gets shown or hidden
    context = SL;         // Canvas rendering context for popup

    worldIndex;
    resourcePane;

    constructor(boundingBox, worldIndex, openTab = 0)
    {
        super(boundingBox);
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        this.setFrameImagesByWorldIndex(worldIndex);

        this.currentTabIndex = openTab;
        this.worldIndex = worldIndex;

        var sellCategories = {
            0: _("Sell Ore"),
            1: _("Sell Isotope")
        }
        this.initializeTabs(Object.values(sellCategories));

        var buttonPadding = .0075;
        for(var i = 0; i < 13; i++)
        {
            var height = this.boundingBox.height * (.05 + buttonPadding) * (i + 2.5);

            var hitboxCallbacks = {
                onmousedown: this.sellButtonClick(i)
            };

            // Add tooltip for SELL ALL button
            if(i == 12)
            {
                hitboxCallbacks.onmouseenter = this.sellAllButtonHover();
                hitboxCallbacks.onmouseexit = function ()
                {
                    hideTooltip();
                };
            }

            this.addHitbox(new Hitbox(
                {
                    x: this.boundingBox.width * .045,
                    y: height,
                    width: this.boundingBox.width * .20,
                    height: this.boundingBox.height * .05
                },
                hitboxCallbacks,
                'pointer',
                "sellButton_" + i
            ))

            if(i < 12)
            {
                var newLockButton = this.addHitbox(new Hitbox(
                    {
                        x: this.boundingBox.width * .25,
                        y: height,
                        width: this.boundingBox.width * .04,
                        height: this.boundingBox.height * .05
                    },
                    {
                        onmousedown: this.lockButtonClick(i),
                        onmouseenter: this.lockButtonHover(i),
                        onmouseexit: function ()
                        {
                            hideTooltip();
                        }
                    },
                    'pointer',
                    "lockButton_" + i
                ))
                newLockButton.isEnabled = function (i)
                {
                    return i < this.getTabResources().length;
                }.bind(this, i);
                newLockButton.isVisible = newLockButton.isEnabled;
            }
        }

        this.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .25,
                y: this.boundingBox.height * (.05 + buttonPadding) * 14.25 + (this.boundingBox.height * .027),
                width: this.boundingBox.width * .04,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: this.lockAllButtonClick(),
                onmouseenter: this.lockAllButtonHover(),
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "lockAllButton"
        ));

        this.toggleSellButtons();
    }

    onTabChange()
    {
        this.toggleSellButtons();
    }

    toggleSellButtons()
    {
        var resourceIndexesViewed = this.getTabResources();
        for(var i = 0; i < 12; ++i)
        {
            this.getHitboxById("sellButton_" + i).setEnabled((i < resourceIndexesViewed.length))
        }
    }

    getWorld()
    {
        return worlds[this.worldIndex];
    }

    getTabResources()
    {
        if(this.currentTabIndex == 0)
        {
            return this.getWorld().mineralIdsToSell;
        }
        else if(this.currentTabIndex == 1)
        {
            return this.getWorld().isotopeIdsToSell;
        }
    }

    render()
    {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        this.context.restore();
        super.render(); // Render any child layers

        this.context.fillStyle = "#FFFFFF";
        var fontToUse = "14px Verdana";
        this.context.font = fontToUse;
        var sellPriceMultiplier = STAT.sellPriceMultiplier();
        var managerPadding = this.boundingBox.width * .04;
        var buttonPadding = .0075;

        var resourceIndexesViewed = this.getTabResources();

        var buttonToRender = 0;
        var sellAllProfit = new BigNumber(0);
        for(var i in resourceIndexesViewed)
        {
            var resourceId = resourceIndexesViewed[i];
            var worldResource = worldResources[resourceId];

            buttonToRender++;
            var height = this.boundingBox.height * (.05 + buttonPadding) * (buttonToRender + 1.5);

            if((!worldResource.isIsotope && highestOreUnlocked >= resourceId) || (worldResource.isIsotope && (highestIsotopeUnlocked + 2) >= resourceId))
            {
                this.context.fillText(worldResource.name + ": " + beautifynum(worldResource.numOwned) + " = $" + beautifynum(doBigNumberDecimalMultiplication(worldResource.totalValue(), sellPriceMultiplier)), managerPadding + 25 + this.boundingBox.width * .25, 4 + height + (this.boundingBox.height * .025));
                this.context.drawImage(worldResource.smallIcon, 0, 0, worldResource.smallIcon.width, worldResource.smallIcon.height, managerPadding + 3 + this.boundingBox.width * .25, -12 + height + (this.boundingBox.height * .025), 20, 20);
            }
            else
            {
                this.context.fillText(_("????") + ": 0 = $0", managerPadding + 25 + this.boundingBox.width * .25, 6 + height + (this.boundingBox.height * .025));
                this.context.drawImage(worldResource.smallIconHidden, 0, 0, worldResource.smallIconHidden.width, worldResource.smallIconHidden.height, managerPadding + 3 + this.boundingBox.width * .25, -12 + height + (this.boundingBox.height * .025), 20, 20);
            }

            this.context.drawImage(getLockIconForMineralNumber(resourceId), 0, 0, 27, 21, this.boundingBox.width * .25, height, this.boundingBox.width * .04, this.boundingBox.height * .05);
            renderButton(this.context, sellb, _("SELL"), this.boundingBox.width * .045, height, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
            sellAllProfit = sellAllProfit.add(getMineralSaleStats(resourceId).profit);
        }

        var height = this.boundingBox.height * (.05 + buttonPadding) * 14.25;
        renderButtonScaled(this.context, sellb, _("SELL ALL"), this.boundingBox.width * .045, height + (this.boundingBox.height * .027), this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
        this.context.fillText("$" + beautifynum(sellAllProfit), this.boundingBox.width * .3, height + (this.boundingBox.height * 0.063));

        showSellerDialogue();

        var lockAllIcon;
        // Check if any resources in current tab are locked
        var resourceIndexesViewed = this.getTabResources();
        var anyLocked = false;
        for(var i = 0; i < resourceIndexesViewed.length; i++)
        {
            if(lockedMineralAmtsToSave[resourceIndexesViewed[i]] > 0)
            {
                anyLocked = true;
                break;
            }
        }
        lockAllIcon = anyLocked ? lock : unlock;
        this.context.drawImage(lockAllIcon, 0, 0, 27, 21, this.boundingBox.width * .25, height + (this.boundingBox.height * .027), this.boundingBox.width * .04, this.boundingBox.height * .05);

        if(money.equals(0) && getValueOfMineralsExcludingHe3() >= getEarth().workerHireCost() && getEarth().workersHired == 0)
        {
            drawImageRot(this.context, arrowleft, 0, 0, arrowleft.width, arrowleft.height, (oscillate(numFramesRendered, 8) * this.boundingBox.width * .018), this.boundingBox.height * .125, Math.floor(this.boundingBox.width * .075), Math.floor(this.boundingBox.height * .075), 180);
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

    sellButtonClick(buttonIndex)
    {
        //button index, this.parent.currentTabIndex, 
        return function ()
        {
            var resourceIndexesViewed = this.parent.getTabResources();
            var previousMineralsOwned = [];
            var previousMoney = new BigNumber(money);

            for(var i = 0; i < resourceIndexesViewed.length; i++)
            {
                previousMineralsOwned[i] = worldResources[resourceIndexesViewed[i]].numOwned;
            }

            if(buttonIndex < resourceIndexesViewed.length)
            {
                sellMineral(resourceIndexesViewed[buttonIndex]);
            }
            else if(buttonIndex == 12)
            {
                for(var i in resourceIndexesViewed)
                {
                    var resourceIndex = resourceIndexesViewed[i];
                    sellMineral(resourceIndex);
                }
            }

            if(mutebuttons == 0)
            {
                if(buttonIndex != 12 && worldResources[resourceIndexesViewed[buttonIndex]].numOwned != previousMineralsOwned[buttonIndex])
                {
                    playClickSound();
                }
                else if(!money.equals(previousMoney))
                {
                    playClickSound();
                }
            }

            var totalSaleProceeds = money.subtract(previousMoney);
            if(totalSaleProceeds.greaterThan(100000000000000000))
            {
                questManager.getQuest(55).markComplete();
            }
        };
    }

    lockButtonClick(buttonIndex)
    {
        return function ()
        {
            var resourceIndexesViewed = this.parent.getTabResources();
            var mineralIndex = resourceIndexesViewed[buttonIndex];
            showSimpleInput(_("Enter the amount of {0} you want to prevent from being sold.", getLockedMineralName(mineralIndex)), _("Update"), "0", getMineralUpdateLockFunction(mineralIndex), _("Cancel"));
            playClickSound();
        };
    }

    lockButtonHover(buttonIndex)
    {
        return function ()
        {
            var resourceIndexesViewed = this.parent.getTabResources();
            var mineralIndex = resourceIndexesViewed[buttonIndex];

            if(lockedMineralAmtsToSave[mineralIndex] == 0)
            {
                showTooltip(_("Lock Resource"), _("Set minimum amount of {0} to keep", getLockedMineralName(mineralIndex)));
            }
            else
            {
                showTooltip(_("Resources Locked"), _("Locked to maintain a minimum of {0} {1}", beautifynum(lockedMineralAmtsToSave[mineralIndex]), getLockedMineralName(mineralIndex)));
            }
        };
    }

    lockAllButtonClick()
    {
        return function ()
        {
            showSimpleInput(_("Enter the amount of {0} you want to prevent from being sold.", _("Resources")), _("Update"), "0", this.parent.getLockAllUpdateFunction(), _("Cancel"));
            playClickSound();
        };
    }

    lockAllButtonHover()
    {
        return function ()
        {
            showTooltip(_("Lock Resource"), _("Set minimum amount of {0} to keep", _("Resources")));
        };
    }

    sellAllButtonHover()
    {
        return function ()
        {
            var tabName = this.parent.currentTabIndex == 0 ? _("Ore") : _("Isotope");
            showTooltip(_("Sell All"), _("Sells all the {0} from this region", tabName));
        };
    }

    getLockAllUpdateFunction()
    {
        return function ()
        {
            var amtToLock = document.getElementById("simpleInputFieldText").value;
            document.getElementById("simpleInputFieldText").value = "";

            var value = amtToLock.replace(/,/g, '');

            if(value.toLowerCase().includes("k")) value = amtToLock.replace(/k/gi, '000')
            else if(value.toLowerCase().includes("m")) value = amtToLock.replace(/m/gi, '000000')
            else if(value.toLowerCase().includes("b")) value = amtToLock.replace(/b/gi, '000000000')
            else if(value.toLowerCase().includes("t")) value = amtToLock.replace(/t/gi, '000000000000')
            else if(value.includes("q")) value = amtToLock.replace(/q/gi, '000000000000000')
            else if(value.includes("Q")) value = amtToLock.replace(/Q/gi, '000000000000000000')
            else if(value.includes("s")) value = amtToLock.replace(/s/gi, '000000000000000000000')

            var lockValue = parseInt(value);
            if(isNaN(lockValue) || lockValue < 0)
            {
                lockValue = 0;
            }

            lockWorldResources(this.worldIndex, this.currentTabIndex, lockValue);
            hideSimpleInput();
        }.bind(this);
    }

}