var headerFont = "CFont";

class MainUILayer extends UiLayer
{
    layerName = "MainUILayer";
    zIndex = 3;
    isRendered = true;
    isPopup = false;
    allowBubbling = true;
    context = MAIN;
    isOnScroller = false;
    isHoveringOverScroller = false;
    activeDialogue = {
        "dialogueText": "",
        "dialogueImage": null,
        "dialoguePartyName": "",
        "popupId": "",
        "x": 0,
        "y": 0,
        "isActive": false
    };

    buffContainer;
    currentlyViewedWorld = EARTH_INDEX;

    constructor(boundingBox)
    {
        super(boundingBox);
        if(this.context)
        {
            this.context.canvas.style.x = boundingBox.x;
            this.context.canvas.style.y = boundingBox.y;
            this.context.canvas.style.width = boundingBox.width;
            this.context.canvas.style.height = boundingBox.height;
        }

        this.setBoundingBox();
    }

    setBoundingBox()
    {
        this.boundingBox = this.context.canvas.getBoundingClientRect();
        this.boundingBox.x /= uiScaleX;
        this.boundingBox.y /= uiScaleY;
        this.boundingBox.width /= uiScaleX;
        this.boundingBox.height /= uiScaleY;

        //########### RESET THE HEADER ###########
        this.setupHeader();
    }

    setupHeader()
    {
        this.clearHitboxes();

        // Drill Stalled Highlight Hitbox
        this.drillStalledHighlightHitbox = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .805,
                y: 0,
                width: (this.boundingBox.width) * .131,
                height: (this.boundingBox.height) * .234 / 2
            },
            {
                onmousedown: function ()
                {
                    if(currentlyViewedDepth != depth && (battleManager.isStalledDueToBoss() || isWaitingForLiftoff()))
                    {
                        panToViewDepth(depth);
                    }
                }
            },
            "pointer",
            "drillStalledHighlight"
        ));

        // Drill New Depth Highlight Hitbox (Golden)
        this.drillNewDepthHighlightHitbox = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .805,
                y: 0,
                width: (this.boundingBox.width) * .131,
                height: (this.boundingBox.height) * .234 / 2
            },
            {
                onmousedown: function ()
                {
                    if(currentlyViewedDepth != depth && hasReachedNewDepthUnseen)
                    {
                        panToViewDepth(depth);
                        hasReachedNewDepthUnseen = false;
                    }
                }
            },
            "pointer",
            "drillNewDepthHighlight"
        ));

        //Capacity Nav
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .803,
                y: (this.boundingBox.height) * .068,
                width: (this.boundingBox.width) * .13,
                height: (this.boundingBox.height) * .02
            },
            {
                onmousedown: function ()
                {
                    openUi(SellWindow, null, EARTH_INDEX);
                },
                onmouseenter: function ()
                {
                    showUpdatingTooltip(
                        function ()
                        {
                            var maxCapacity = maxHoldingCapacity();
                            if(maxCapacity >= capacity)
                            {
                                var formattedTimeUntilFull = formattedCountDown(timeUntilCapacityIsFullSeconds());
                                return {
                                    "header": _("Estimated Time Until Full"),
                                    "body": "<center>" + formattedTimeUntilFull + "</center>"
                                };
                            }
                            else
                            {
                                return {
                                    "header": _("Capacity Full"),
                                    "body": _("Sell your minerals to continue mining.<br><br>Drill will continue working even at full capacity.")+_("<br><br>Number of Locked Resources: {0}", lockedMineralAmtsToSave.filter(amt => amt > 0).length)
                                };
                            }
                        }, "80.5%", "9.5%", "120px"
                    );
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "capacityTooltip"
        ));

        //Depth Nav
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .803,
                y: (this.boundingBox.height) * .039,
                width: (this.boundingBox.width) * .13,
                height: (this.boundingBox.height) * .02
            },
            {
                onmouseenter: function ()
                {
                    showUpdatingTooltip(
                        function ()
                        {
                            if(!battleManager.isStalledDueToBoss())
                            {
                                var timeUntilNextKmDepth = estimatedTimeUntilNextDepth();
                                let time = (parseInt(timeUntilNextKmDepth) + 1);
                                let timelapseTime = parseInt(time / ((totalTimeLapsedMinutes / (playtime / 60))))
                                var formattedTime = formattedCountDown(time);

                                let description = `<center>${formattedTime}</center>`;
                                if(managerStructure.level > 1)
                                {
                                    description += `<br><center><strong>${_("Estimate with Timelapse")}</strong></center>
                                    <center>${formattedCountDown(timelapseTime)}</center>`;
                                }
                                return {
                                    "header": _("Time Until {0}km Depth", (depth + 1)),
                                    "body": description
                                };
                            }
                            else
                            {
                                let depthText = formattedDepth(battleManager.bosses[bossesDefeated].minDepth);
                                return {
                                    "header": _("Drill Stalled"),
                                    "body": _("Defeat the boss at {0} to progress.", depthText)
                                };
                            }
                        }, "80.5%", "9.5%", "120px"
                    );
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                },
                onmousedown: function ()
                {
                    if(!battleManager.isStalledDueToBoss())
                    {
                        //Passes empty string for boundingbox and 3 for current tab
                        openUi(SettingsWindow, "", 3);
                    }
                    else
                    {
                        //Jumps to drill depth
                        panToViewDepth(battleManager.bosses[bossesDefeated].minDepth);
                    }
                }
            },
            'pointer',
            "depthTooltip"
        ));

        //Tooltip for total currency
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .803,
                y: (this.boundingBox.height) * .009,
                width: (this.boundingBox.width) * .13,
                height: (this.boundingBox.height) * .02
            },
            {
                onmouseenter: function ()
                {


                    var width = money.toString(10).split("").length * 10;
                    width = Math.max(width, 120);

                    showUpdatingTooltip(
                        function ()
                        {
                            var moneyString = money.toString();
                            var tempReversedString = "";
                            var lastComma = moneyString.length - 1;

                            //reverse Money String and add commas every 3 places
                            for(var i = moneyString.length; i >= 0; i--)
                            {
                                if(lastComma - i > 2)
                                {
                                    tempReversedString += ",";
                                    lastComma = i;
                                };
                                tempReversedString += moneyString.charAt(i)
                            }

                            //reverse it again to get real value
                            var formattedMoney = "$"
                            for(var i = tempReversedString.length; i >= 0; i--)
                            {
                                formattedMoney += tempReversedString.charAt(i)
                            }

                            return {
                                "header": _("Total Money"),
                                "body": "<center>" + formattedMoney + "</center>"
                            };
                        }, "80.5%", "9.5%", width
                    );
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "currencyTooltip"
        ));

        //World Select
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .045,
                y: 0,
                width: (this.boundingBox.width) * .06,
                height: (this.boundingBox.height) * .03
            },
            {
                onmousedown: function ()
                {
                    currentlyViewedDepth = 0;
                    MAIN.clearRect(0, (this.boundingBox.height) * .11, (this.boundingBox.width), (this.boundingBox.height) * .89);
                    animate();
                    hasAnimatedThisFrame = 1;
                    movedivs();
                },
                onmouseenter: function ()
                {
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "EarthSelect"
        ));

        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .045,
                y: (this.boundingBox.height) * .038,
                width: (this.boundingBox.width) * .06,
                height: (this.boundingBox.height) * .03
            },
            {
                onmousedown: function ()
                {
                    if(getMoon().hasReached())
                    {
                        currentlyViewedDepth = getMoon().startDepth;
                        MAIN.clearRect(0, (this.boundingBox.height) * .11, (this.boundingBox.width), (this.boundingBox.height) * .89);
                        animate();
                        hasAnimatedThisFrame = 1;
                        movedivs();
                    }
                },
                onmouseenter: function ()
                {
                    if(getMoon().hasReached())
                    {
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "MoonSelect"
        ));


        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .045,
                y: (this.boundingBox.height) * .076,
                width: (this.boundingBox.width) * .06,
                height: (this.boundingBox.height) * .03
            },
            {
                onmousedown: function ()
                {
                    if(getTitan().hasReached())
                    {
                        currentlyViewedDepth = getTitan().startDepth;
                        MAIN.clearRect(0, (this.boundingBox.height) * .11, (this.boundingBox.width), (this.boundingBox.height) * .89);
                        animate();
                        hasAnimatedThisFrame = 1;
                        movedivs();
                    }
                },
                onmouseenter: function ()
                {
                    if(getTitan().hasReached())
                    {
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "TitanSelect"
        ));

        //#################### SCROLL BAR #####################
        //Up all button
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .037,
                y: (this.boundingBox.height) * .128,
                width: (this.boundingBox.width) * .039,
                height: (this.boundingBox.height) * .074
            },
            {
                onmousedown: function ()
                {
                    changeViewedDepth(-1, true);
                },
                onmouseenter: function ()
                {
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "upAllButton"
        ));

        //Up one button
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .037,
                y: (this.boundingBox.height) * .203,
                width: (this.boundingBox.width) * .039,
                height: (this.boundingBox.height) * .074
            },
            {
                onmousedown: function ()
                {
                    changeViewedDepth(-1);
                },
                onmouseenter: function ()
                {
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "upOneButton"
        ));

        //Down all button
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .037,
                y: (this.boundingBox.height) * .907,
                width: (this.boundingBox.width) * .039,
                height: (this.boundingBox.height) * .074
            },
            {
                onmousedown: function ()
                {
                    changeViewedDepth(1, true);
                },
                onmouseenter: function ()
                {
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "downAllButton"
        ));

        //Down one button
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .037,
                y: (this.boundingBox.height) * .832,
                width: (this.boundingBox.width) * .039,
                height: (this.boundingBox.height) * .074
            },
            {
                onmousedown: function ()
                {
                    changeViewedDepth(1);
                },
                onmouseenter: function ()
                {
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    document.body.style.cursor = '';
                }
            },
            '',
            "downOneButton"
        ));

        //Scroller
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .032,
                y: (this.boundingBox.height) * .28,
                width: (this.boundingBox.width) * .05,
                height: (this.boundingBox.height) * .54
            },
            {
                onmouseenter: function ()
                {
                    activeLayers.MainUILayer.isHoveringOverScroller = true;
                },
                onmouseexit: function ()
                {
                    activeLayers.MainUILayer.isHoveringOverScroller = false;
                },
                onmousedown: function ()
                {
                    activeLayers.MainUILayer.isOnScroller = true;
                    changeViewedDepthBasedOnMouseScrollerPosition();
                },
                onmouseup: function ()
                {
                    activeLayers.MainUILayer.isOnScroller = false;
                },
                onmousemove: function ()
                {
                    if(activeLayers.MainUILayer.isOnScroller)
                    {
                        changeViewedDepthBasedOnMouseScrollerPosition();
                    }
                }
            },
            'pointer',
            "scroller"
        ));

        //Header Mineral Icon Tooltips
        for(var i = 0; i < worldBeingViewed().mineralIdsToSell.length; i++)
        {
            var xCoordinate = (this.boundingBox.width * .125) + (this.boundingBox.width * .09 * Math.floor((i) / 3)) - 20;
            var yCoordinate = (this.boundingBox.height * .015) - 8 + (this.boundingBox.height * .03 * ((i) % 3));

            this.addHitbox(new Hitbox(
                {
                    x: xCoordinate,
                    y: yCoordinate,
                    width: (this.boundingBox.width) * .085,
                    height: (this.boundingBox.height) * .03
                },
                {
                    onmouseenter: function ()
                    {
                        var mineralIndex = parseInt(this.id.split("_")[1]);
                        var mineralOrder = worldBeingViewed().mineralIdsToSell;
                        if(mineralOrder.length <= mineralIndex) return;

                        showUpdatingTooltip(
                            function ()
                            {
                                var mineralIndex = this.mineralIndex;
                                var mineralOrder = worldBeingViewed().mineralIdsToSell;
                                if(mineralOrder.length <= mineralIndex) return;
                                var mineralIndexToRender = mineralOrder[mineralIndex];

                                if(!worldResources[mineralIndexToRender].isIsotope && worldResources[mineralIndexToRender].isOnHeader)
                                {
                                    if(highestOreUnlocked >= mineralIndexToRender)
                                    {
                                        var valueOfMineralHoldings = worldResources[mineralIndexToRender].totalValue();
                                        var mineralDescription = _("Value: $") + beautifynum(worldResources[mineralIndexToRender].sellValue) + "<br>" + _("Value Of Holdings: ${0}", beautifynum(valueOfMineralHoldings));

                                        return {
                                            "header": worldResources[mineralIndexToRender].name,
                                            "body": mineralDescription
                                        };
                                    }
                                    else
                                    {
                                        if(getDepthMineralIsFoundAt(mineralIndexToRender) != 99999)
                                        {
                                            return {
                                                "header": "???",
                                                "body": _("Found around depth {0}km", beautifynum(Math.ceil(getDepthMineralIsFoundAt(mineralIndexToRender) / 5) * 5))
                                            };
                                        }
                                        else if(worldResources[mineralIndexToRender].isIsotope)
                                        {
                                            FUEL_ROD_TYPES.forEach((fuelRod) =>
                                            {
                                                reactorComponents[fuelRod].rewardOutput.forEach((reward) =>
                                                {
                                                    if(reward.item.id == mineralIndexToRender)
                                                    {
                                                        return {
                                                            "header": "???",
                                                            "body": _("Rewarded from {0} in the Reactor", reactorComponents[fuelRod].name)
                                                        };
                                                    }
                                                })
                                            })
                                        }
                                    }
                                }
                            }.bind({"mineralIndex": mineralIndex}), this.boundingBox.x + 20, this.boundingBox.y + 5, "120px"
                        );
                    },
                    onmousedown: function ()
                    {
                        openUi(SellWindow, null, worldBeingViewed().index);
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                'pointer',
                "Mineral_" + i
            ));
        }

        var buildingMaterialsXCoordinate = (this.boundingBox.width * .65);
        var buildingMaterialsYCoordinate = (this.boundingBox.height * .015) - 8;

        this.addHitbox(new Hitbox(
            {
                x: buildingMaterialsXCoordinate,
                y: buildingMaterialsYCoordinate,
                width: (this.boundingBox.width) * .085,
                height: (this.boundingBox.height) * .03
            },
            {
                onmouseenter: function ()
                {
                    showUpdatingTooltip(
                        function ()
                        {
                            return {
                                "header": _("Building Materials"),
                                "body": beautifynum(worldResources[BUILDING_MATERIALS_INDEX].numOwned) + "<br><br>" + _("Found in Chests, Trades, and Scientist explorations")
                            };
                        }, this.boundingBox.x + 26, this.boundingBox.y + 5, "120px"
                    );
                },
                onmousedown: function ()
                {
                    openUi(CraftingWindow, null, worldBeingViewed().index, 1);
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "BuildingMaterialsHeader"
        ));

        if(depth > 302)
        {
            var xCoordinate = (this.boundingBox.width * .65);
            var yCoordinate = (this.boundingBox.height * .045) - 8;

            this.addHitbox(new Hitbox(
                {
                    x: xCoordinate,
                    y: yCoordinate,
                    width: (this.boundingBox.width) * .085,
                    height: (this.boundingBox.height) * .03
                },
                {
                    onmouseenter: function ()
                    {
                        showUpdatingTooltip(
                            function ()
                            {
                                return {
                                    "header": _("Oil"),
                                    "body": beautifynum(worldResources[OIL_INDEX].numOwned) + " / " + beautifynum(oilrigStructure.statValueForCurrentLevel())
                                };
                            }, this.boundingBox.x + 26, this.boundingBox.y + 5, "120px"
                        );
                    },
                    onmousedown: function ()
                    {
                        openUi(OilPumpWindow);
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                'pointer',
                "OilHeader"
            ));
        }

        if(depth > REACTOR_DEPTH)
        {
            var xCoordinate = (this.boundingBox.width * .65);
            var yCoordinate = (this.boundingBox.height * .075) - 8;

            this.addHitbox(new Hitbox(
                {
                    x: xCoordinate,
                    y: yCoordinate,
                    width: (this.boundingBox.width) * .085,
                    height: (this.boundingBox.height) * .03
                },
                {
                    onmouseenter: function ()
                    {
                        showUpdatingTooltip(
                            function ()
                            {
                                return {
                                    "header": _("Nuclear Energy"),
                                    "body": beautifynum(reactor.currentBatteryCharge()) + " / " + beautifynum(reactor.grid.maxBatteryCapacity())
                                };
                            }, this.boundingBox.x + 26, this.boundingBox.y + 5, "120px"
                        );
                    },
                    onmousedown: function ()
                    {
                        openUi(ReactorWindow);
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                'pointer',
                "EnergyHeader"
            ));
        }



        //Header Isotope Icon Tooltips
        for(var i = 0; i < (worldBeingViewed().isotopeIdsToSell.length / 3); i++)
        {
            var columnsOfMineralsDisplayed = worldBeingViewed().mineralIdsToSell.length / 3;
            var xCoordinate = (this.boundingBox.width * (.125 * columnsOfMineralsDisplayed) + (this.boundingBox.width * .17 * Math.floor((i) / 3))) + 5;
            var yCoordinate = (this.boundingBox.height * .015) - 8 + ((i % 3) * this.boundingBox.height * .03);

            //Mineral icons
            this.addHitbox(new Hitbox(
                {
                    x: xCoordinate,
                    y: yCoordinate,
                    width: (this.boundingBox.width) * .085,
                    height: (this.boundingBox.height) * .03
                },
                {
                    onmouseenter: function ()
                    {
                        var mineralIndex = parseInt(this.id.split("_")[1]);

                        showUpdatingTooltip(
                            function ()
                            {
                                var mineralIndex = this.mineralIndex;

                                var mineralOrder = worldBeingViewed().isotopeIdsToSell;
                                if(mineralOrder.length <= (mineralIndex * 3)) return;
                                var mineralIndexToRender = mineralOrder[mineralIndex * 3];

                                if(worldResources[mineralIndexToRender].isIsotope && worldResources[mineralIndexToRender].isOnHeader)
                                {
                                    if(highestIsotopeUnlocked >= mineralIndexToRender)
                                    {
                                        var description = "";
                                        for(var j = 0; j < 3; j++)
                                        {
                                            description += "<center><u><b>" + worldResources[mineralIndexToRender + j].name + "</b></u></center><br>";
                                            var valueOfMineralHoldings = worldResources[mineralIndexToRender + j].totalValue();
                                            description += _("Value: $") + beautifynum(worldResources[mineralIndexToRender + j].sellValue) + "<br>" + _("Value Of Holdings: ${0}", beautifynum(valueOfMineralHoldings)) + "<br><br>";
                                        }
                                        return {
                                            "header": "",
                                            "body": description
                                        };
                                    }
                                    else
                                    {
                                        return {
                                            "header": "???",
                                            "body": ""
                                        };
                                    }
                                }

                            }.bind({"mineralIndex": mineralIndex}), this.boundingBox.x + 26, this.boundingBox.y + 5, "120px"
                        );
                    },
                    onmousedown: function ()
                    {
                        openUi(SellWindow, null, worldBeingViewed().index, 1);
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                'pointer',
                "Mineral_" + i
            ));
        }


        //############# LEFT SIDE BUTTON HITBOXES #############
        //Discord
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .085,
                y: (this.boundingBox.height) * .12,
                width: (this.boundingBox.width) * .025,
                height: (this.boundingBox.height) * .045
            },
            {
                onmousedown: function ()
                {
                    if(currentlyViewedDepth == 0)
                    {
                        openDiscord();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(currentlyViewedDepth == 0)
                    {
                        showTooltip(_("Discord"), _("Join us on discord for updates and occasional ticket redemption codes"), '11.5%', '12%');
                        this.cursor = 'pointer';
                    }
                    else
                    {
                        this.cursor = 'default';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            'default',
            "discordButton"
        ));

        //Email Collection (shown only when platform doesn't support Playsaurus accounts)
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .085,
                y: (this.boundingBox.height) * .1675,
                width: (this.boundingBox.width) * .025,
                height: (this.boundingBox.height) * .045
            },
            {
                onmousedown: function ()
                {
                    if(!isEmailCollected() && currentlyViewedDepth == 0)
                    {
                        showMobileEmailPrompt();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(!isEmailCollected() && currentlyViewedDepth == 0)
                    {
                        showTooltip(_("Subscribe to our email updates for free redemption codes and game news"), "", "11.5%", "16.75%");
                        this.cursor = 'pointer';
                    }
                    else
                    {
                        this.cursor = 'default';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'default',
            "emailCollectionButton"
        ));
        var emailButton = this.getHitboxById("emailCollectionButton");
        emailButton.isVisible = () => typeof platform !== 'undefined' && platform.isAccountRestricted();
        emailButton.isEnabled = () => typeof platform !== 'undefined' && platform.isAccountRestricted();

        var leftButtonWidth = this.boundingBox.width * 0.09;

        //Offer Button
        var offerButtonSize = this.boundingBox.width * 0.035;
        this.offerButton = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * (.085 + .027),
                y: (this.boundingBox.height) * .12,
                width: offerButtonSize,
                height: offerButtonSize
            },
            {
                onmousedown: function ()
                {
                    openUi(OfferWindow);
                }
            },
            '',
            "offerButton"
        ));

        this.offerButton.render = function ()
        {
            if(offerButtonIcon.constructor.name == "HTMLImageElement")
            {
                offerButtonIcon = new SpritesheetAnimation(
                    offerButtonIcon,
                    9,
                    20
                );
                offerButtonIcon.unpauseAfterFrames = 20;
            }
            var coords = this.getGlobalCoordinates(0, 0);
            coords.x *= uiScaleX;
            coords.y *= uiScaleY;
            offerButtonIcon.drawAnimation(
                MAIN,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            )
            offerButtonIcon.playUntilFinished();
            this.renderChildren();
        }

        this.offerButton.isVisible = () => offerManager.getCurrentOffer();
        this.offerButton.isEnabled = () => offerManager.getCurrentOffer();

        //Offer Timer
        this.offerTimer = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * (.085 + .027),
                y: this.offerButton.boundingBox.y + this.offerButton.boundingBox.height,
                width: offerButtonSize,
                height: this.offerButton.boundingBox.height / 2
            },
            {},
            '',
            "offerTimer"
        ));

        this.offerTimer.render = function ()
        {
            var coords = this.getGlobalCoordinates(0, 0);
            coords.x *= uiScaleX;
            coords.y *= uiScaleY;
            var img = bundleTimerBackground;
            MAIN.drawImage(
                img,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
            MAIN.save();
            MAIN.font = this.boundingBox.height * 0.97 + "px Calibri";
            MAIN.fillStyle = "#FFFFFF";
            MAIN.textBaseline = "middle";
            MAIN.lineWidth = 2;
            MAIN.strokeStyle = "#000000";
            strokeTextShrinkToFit(
                MAIN,
                formattedCountDown(offerManager.getTimeRemainingForOffer()),
                coords.x,
                coords.y + this.boundingBox.height / 2,
                this.boundingBox.width,
                "center"
            );
            fillTextShrinkToFit(
                MAIN,
                formattedCountDown(offerManager.getTimeRemainingForOffer()),
                coords.x,
                coords.y + this.boundingBox.height / 2,
                this.boundingBox.width,
                "center"
            );
            MAIN.restore();
            this.renderChildren();
        }

        this.offerTimer.isVisible = () => offerManager.getCurrentOffer();
        this.offerTimer.isEnabled = () => offerManager.getCurrentOffer();

        //Offer Chests Button
        this.storedRewardsButton = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * (.085 + .027),
                y: (this.boundingBox.height) * .1675,
                width: (this.boundingBox.width) * .025,
                height: (this.boundingBox.height) * .045
            },
            {
                onmousedown: function ()
                {
                    openUi(OfferChestWindow);
                }
            },
            '',
            "storedRewardsButton"
        ));

        this.storedRewardsButton.render = function ()
        {
            var coords = this.getGlobalCoordinates(0, 0);
            coords.x *= uiScaleX;
            coords.y *= uiScaleY;
            var img = goldchesticon;
            drawImageFitInBox(
                MAIN,
                img,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height
            );
            this.renderChildren();
        }

        this.storedRewardsButton.isVisible = () => rewardedChestStorage.hasUnclaimedChests();
        this.storedRewardsButton.isEnabled = () => rewardedChestStorage.hasUnclaimedChests();

        this.storedRewardsButton.addHitbox(new EasyHintArrow(
            "left",
            () => typeof (offerManager) != "undefined" && rewardedChestStorage.hasUnclaimedChests(),
            0,
            0,
            0,
            -1,
            (this.boundingBox.width) * .025
        ));

        //Survey Collection
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .085,
                y: (this.boundingBox.height) * .1675,
                width: (this.boundingBox.width) * .025,
                height: (this.boundingBox.height) * .045
            },
            {
                onmousedown: function ()
                {
                    if(currentlyViewedDepth == 0 && depth > 20 && document.getElementById("surveyDiv") == null)
                    {
                        if(!hasTakenSurveyCheck() && !(localStorage["isSurveyPending"] == "true" || localStorage["isSurveyPending"] == true))
                        {
                            platform.openSurvey();
                        }
                        else if(hasTakenSurveyCheck() && isFlashQuestionSurveyPromptVisible() && !(localStorage["isServerSurveyPending"] == "true" || localStorage["isServerSurveyPending"] == true))
                        {
                            platform.openFlashSurvey();
                        }
                    }
                },
                onmouseenter: function ()
                {
                    if(currentlyViewedDepth == 0 && depth > 20 && document.getElementById("surveyDiv") == null)
                    {
                        if(!hasTakenSurveyCheck() && !(localStorage["isSurveyPending"] == "true" || localStorage["isSurveyPending"] == true))
                        {
                            showTooltip(_("Take a short survey and get {0} tickets. Answer accurately to qualify for more surveys.", 5 * surveyRewardMultiplier()), "", "11.5%", "16.75%");
                        }
                        else if(hasTakenSurveyCheck() && isFlashQuestionSurveyPromptVisible() && !(localStorage["isServerSurveyPending"] == "true" || localStorage["isServerSurveyPending"] == true))
                        {
                            showTooltip(_("Take a short {0} question survey and get {1} tickets. Answer accurately to qualify for more surveys.", numFlashQuestions, numFlashQuestions * surveyRewardMultiplier()), "", "11.5%", "16.75%");
                        }
                        this.cursor = 'pointer';
                    }
                    else
                    {
                        this.cursor = 'default';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'deafult',
            "surveyButton"
        ));

        //Holiday Button
        var holidayButton = this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .15,
                y: (this.boundingBox.height) * .115,
                width: (this.boundingBox.width) * .13,
                height: (this.boundingBox.height) * .08
            },
            {
                onmousedown: function ()
                {
                    if(limitedTimeEventManager.isEventActive && currentlyViewedDepth == 0)
                    {
                        if(limitedTimeEventManager.activeEvent.displayCountdown)
                        {
                            if(limitedTimeEventManager.openHolidayUI)
                            {
                                limitedTimeEventManager.openHolidayUI();
                            }
                            playClickSound();
                        }
                    }
                },
                onmouseenter: function ()
                {
                    if(currentlyViewedDepth == 0)
                    {
                        if(limitedTimeEventManager.isEventActive)
                        {
                            if(limitedTimeEventManager.activeEvent.displayCountdown)
                            {
                                var tooltip = limitedTimeEventManager.eventTooltip();
                                showTooltip(tooltip.header, tooltip.body, "12.5%", "18.75%");
                            }
                        }
                        this.cursor = 'pointer';
                    }
                    else
                    {
                        this.cursor = 'default';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'default',
            "holidayEventButton"
        ));

        holidayButton.isVisible = () => limitedTimeEventManager.isEventActive;
        holidayButton.isEnabled = () => limitedTimeEventManager.isEventActive;

        //############# RIGHT SIDE SHORTCUT HITBOXES #############
        //Settings
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: (this.boundingBox.height) * .115,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    openUi(SettingsWindow);
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Settings"), _(''), '82%', '11.3%');
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "settingsButton"
        ));

        this.buffContainer = new Hitbox(
            {
                x: Math.ceil((this.boundingBox.width) * .902),
                y: 0,
                width: 0,
                height: (this.boundingBox.height) * 0.5
            },
            {},
            ""
        );
        this.buffContainer.allowBubbling = true;
        this.buffContainer.defaultX = this.buffContainer.boundingBox.x;
        this.addHitbox(this.buffContainer);

        var yPercent0 = 17.5;
        var yPercentIncrement = 6;
        var yIncrement = this.boundingBox.height * yPercentIncrement / 100;
        var y0 = this.boundingBox.height * yPercent0 / 100;

        //Crafting Window
        var buttonPos = y0;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    openUi(CraftingWindow);
                    isCraftNotificationOn = false;
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Open Crafting"), _(''), '82%', yPercent0 + "%");
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "craftingShortcut"
        ));

        //Super Miner
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth < SUPER_MINER_DEPTH) return;
                    openUi(SuperMinersWindow)
                    panToViewDepth(SUPER_MINER_DEPTH);
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    if(depth < SUPER_MINER_DEPTH) return;
                    var description = "";
                    showTooltip(_("Jump to Super Miner Building"), description, '82%', yPercent0 + yPercentIncrement + "%");
                    document.body.style.cursor = 'pointer';
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "superMinerShortcut"
        ));

        //Trading Post
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[0].depth)
                    {
                        panToViewDepth(tradeConfig.tradingPosts[0].depth);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[0].depth)
                    {
                        showTooltip(_("Jump to Trading Post"), _(''), '82%', yPercent0 + yPercentIncrement * 2 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "tradePostShortcut"
        ));

        //Cave
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= CAVE_BUILDING_DEPTH)
                    {
                        panToViewDepth(CAVE_BUILDING_DEPTH);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= CAVE_BUILDING_DEPTH)
                    {
                        var description = "";
                        if(treasureStorage.isFull())
                        {
                            description = _("Treasure storage is full!");
                        }
                        showTooltip(_("Jump to Cave Building"), description, '82%', yPercent0 + yPercentIncrement * 2 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "caveMenuShortcut"
        ));


        //Scientists
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(hasUnlockedScientists)
                    {
                        openUi(ScientistsWindow);
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(hasUnlockedScientists)
                    {
                        showUpdatingTooltip(
                            function ()
                            {
                                if(currentScientists.scientists.length > 0)
                                {
                                    var compeltedExcavations = 0;
                                    var deadScientists = 0;
                                    var workingScientists = 0;
                                    var inactiveScientists = 0;

                                    currentScientists.scientists.forEach((scientist, i) =>
                                    {
                                        if(isOnActiveExcavation(i))
                                        {
                                            if(isScientistDead(i))
                                            {
                                                deadScientists++;
                                            } else if(isExcavationDone(i))
                                            {
                                                compeltedExcavations++;
                                            } else
                                            {
                                                workingScientists++;
                                            }
                                        }
                                        else
                                        {
                                            inactiveScientists++;
                                        }
                                    });

                                    return {
                                        "header": _("Excavations"),
                                        "body": _("<center><b>Number of Scientists:</b> {0}/{1}<br><b>Completed Excavations:</b> {2}<br><b>Dead Scientists:</b> {3}<br><b>Working Scientists:</b> {4}<br><b>Inactive Scientists:</b> {5}</center>", currentScientists.scientists.length, scientistSlots, compeltedExcavations, deadScientists, workingScientists, inactiveScientists)
                                    };
                                }
                                else
                                {
                                    return {
                                        "header": _("Excavations"),
                                        "body": _("You don't own any scientists!")
                                    };
                                }
                            }, this.boundingBox.x * 0.85 - 30, yPercent0 + yPercentIncrement * 3 + "%", "180px"
                        );

                        document.body.style.cursor = 'pointer';
                    }

                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "scientistShortcut"
        ));

        //City
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= 303)
                    {
                        panToViewDepth(302);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= 303)
                    {
                        showTooltip(_("Jump to the Underground City") + "<br><br>" + _("Forge Workload: {0}", GemForger.currentLoad()), _(''), '82%', yPercent0 + yPercentIncrement * 4 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "cityShortcut"
        ));

        //Core
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= 501)
                    {
                        panToViewDepth(501);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= 501)
                    {
                        showTooltip(_("Jump to The Core"), _(''), '82%', yPercent0 + yPercentIncrement * 5 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "coreShortcut"
        ));

        //Lunar Trading Post 
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[1].depth)
                    {
                        panToViewDepth(tradeConfig.tradingPosts[1].depth);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[1].depth)
                    {
                        showTooltip(_("Jump to Lunar Trading Post"), _(''), '82%', yPercent0 + yPercentIncrement * 6 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "lunarTradePostShortcut"
        ));

        //Reactor
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= REACTOR_DEPTH + 1)
                    {
                        panToViewDepth(REACTOR_DEPTH + 1);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= REACTOR_DEPTH + 1)
                    {
                        showTooltip(_("Jump to Reactor"), _(''), '82%', yPercent0 + yPercentIncrement * 7 + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "reactorShortcut"
        ));

        //Titan Trading Post
        buttonPos += yIncrement;
        this.addHitbox(new Hitbox(
            {
                x: (this.boundingBox.width) * .937,
                y: buttonPos,
                width: (this.boundingBox.width) * .0305,
                height: (this.boundingBox.height) * .058
            },
            {
                onmousedown: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[2].depth)
                    {
                        panToViewDepth(tradeConfig.tradingPosts[2].depth);
                        closeOtherUIs();
                        playClickSound();
                    }
                },
                onmouseenter: function ()
                {
                    if(depth >= tradeConfig.tradingPosts[2].depth)
                    {
                        showTooltip(_("Jump to Titan Trading Post"), _(''), '82%', (yPercent0 + yPercentIncrement * 8) + "%");
                        document.body.style.cursor = 'pointer';
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                    document.body.style.cursor = '';
                }
            },
            '',
            "titanTradePostShortcut"
        ));

        this.displayAllBuffs();
    }

    render()
    {
        if(worldAtDepth(currentlyViewedDepth).index != this.worldBeingViewed)
        {
            this.worldBeingViewed = worldAtDepth(currentlyViewedDepth).index;
            this.setupHeader();
        }

        this.renderScrollbar();
        this.renderHeader();
        this.renderRightSideBar();
        this.updateDrillStalledHighlightHitbox();
        this.renderPopupDialogueAttachment();
        this.renderChildren();
        renderHintArrows();
        this.renderVersionNumber();

        if(buffs.isDirty)
        {
            this.displayAllBuffs();
            buffs.isDirty = false
        }
    }

    updateDrillStalledHighlightHitbox()
    {
        // Check if we should show the drill stalled highlight
        var shouldShow = currentlyViewedDepth != depth &&
            (battleManager.isStalledDueToBoss() || isWaitingForLiftoff()) &&
            showHintArrows &&
            showDrillHighlights;

        if(this.drillStalledHighlightHitbox)
        {
            if(shouldShow)
            {
                // Update hitbox position to match highlight render location
                var highlightHeight = (this.boundingBox.height * .234) / 2;
                this.drillStalledHighlightHitbox.boundingBox.y = this.boundingBox.height - highlightHeight;
                this.drillStalledHighlightHitbox.setEnabled(true);
            }
            else
            {
                this.drillStalledHighlightHitbox.setEnabled(false);
            }
        }

        // Update golden new depth highlight hitbox
        this.updateDrillNewDepthHighlightHitbox();
    }

    updateDrillNewDepthHighlightHitbox()
    {
        // Check if we should show the golden new depth highlight (but not when stalled)
        var isDrillStalled = battleManager.isStalledDueToBoss() || isWaitingForLiftoff();
        var shouldShow = currentlyViewedDepth != depth &&
            hasReachedNewDepthUnseen &&
            !isDrillStalled &&
            showHintArrows &&
            showDrillHighlights;

        if(this.drillNewDepthHighlightHitbox)
        {
            if(shouldShow)
            {
                // Update hitbox position to match highlight render location
                var highlightHeight = (this.boundingBox.height * .234) / 2;
                this.drillNewDepthHighlightHitbox.boundingBox.y = this.boundingBox.height - highlightHeight;
                this.drillNewDepthHighlightHitbox.setEnabled(true);
            }
            else
            {
                this.drillNewDepthHighlightHitbox.setEnabled(false);
            }
        }
    }

    renderVersionNumber()
    {
        this.context.save();
        this.context.fillStyle = "#FFFFFF";
        this.context.font = (this.context.canvas.width * 0.01) + "px Consolas";
        this.context.textBaseline = "top";
        this.context.globalAlpha = 0.4;
        var text = "V" + ((version - 100) / 100) + buildLetter;
        var width = this.context.measureText(text).width;
        this.context.fillText(text, mainw * 0.97 - width, 0);
        this.context.restore();
    }

    renderHeader()
    {
        this.context.save();
        this.context.clearRect(0, 0, mainw, Math.ceil(mainh * .11) + 1);
        this.context.fillStyle = "#FFFFFF";
        this.context.font = (this.context.canvas.width * 0.0125) + "px " + headerFont;
        if(isHeaderTextBolded)
        {
            this.context.font = "bold " + (this.context.canvas.width * 0.0125) + "px " + headerFont;
        }

        this.context.font = Math.round(mainw * .013) + "px" + headerFont;

        //Render the World Tabs
        for(var i = 0; i < worlds.length; i++)
        {
            this.context.fillStyle = "#BBBBBB";
            if(worlds[i].hasReached())
            {
                if(worldBeingViewed() == worlds[i])
                {
                    this.context.fillStyle = "#FFFFFF";
                }
                this.context.fillText(_(worlds[i].name), mainw * .048, Math.floor(mainh * .023 + (mainh * .034 * i)));
            }
            else
            {
                this.context.fillText("???", mainw * .048, Math.floor(mainh * .023 + (mainh * .034 * i)));
            }
        }
        this.context.fillStyle = "#FFFFFF";

        //Render the minerals
        var mineralOrder = worldBeingViewed().mineralIdsToSell;
        for(let i = 0; i < mineralOrder.length; i++)
        {
            const mineralIndexToRender = mineralOrder[i];

            if(!worldResources[mineralIndexToRender].isIsotope && worldResources[mineralIndexToRender].isOnHeader)
            {
                const xCoordinate = Math.floor((mainw * .125) + (mainw * .09 * Math.floor((i) / 3))) - 20;
                const yCoordinate = Math.floor((mainh * .015) - 8 + (mainh * .03 * ((i) % 3)));
                const yCoordinateText = 8 + Math.floor(mainh * .015 + (mainh * ((i) % 3) * .03));

                const mineralIcon = highestOreUnlocked >= mineralIndexToRender ? worldResources[mineralIndexToRender].smallIcon : worldResources[mineralIndexToRender].smallIconHidden;
                this.context.drawImage(mineralIcon, 0, 0, mineralIcon.width, mineralIcon.height, xCoordinate, yCoordinate, 20, 20);

                this.context.fillText(shortenNum(worldResources[mineralIndexToRender].numOwned, 2, 9), xCoordinate + 25, yCoordinateText);
            }
        }

        var isotopeOrder = worldBeingViewed().isotopeIdsToSell;
        var columnsOfMineralsDisplayed = worldBeingViewed().mineralIdsToSell.length / 3;
        var i = 0;
        var numIsotopesRendered = 0;
        while(i < isotopeOrder.length)
        {
            var mineralIndexToRender = isotopeOrder[i];

            if(worldResources[mineralIndexToRender].isIsotope && worldResources[mineralIndexToRender].isOnHeader)
            {
                var xCoordinate = Math.floor((mainw * (.125 * columnsOfMineralsDisplayed) + (mainw * .17 * Math.floor((i) / 9)))) + 5;
                var yCoordinate = Math.floor((mainh * .015) - 8 + ((numIsotopesRendered % 3) * mainh * .03));

                if(highestIsotopeUnlocked >= mineralIndexToRender)
                {
                    this.context.drawImage(worldResources[mineralIndexToRender].smallIcon, 0, 0, worldResources[mineralIndexToRender].smallIcon.width, worldResources[mineralIndexToRender].smallIcon.height, xCoordinate, yCoordinate, 20, 20);
                }
                else
                {
                    this.context.drawImage(worldResources[mineralIndexToRender].smallIconHidden, 0, 0, worldResources[mineralIndexToRender].smallIconHidden.width, worldResources[mineralIndexToRender].smallIconHidden.height, xCoordinate, yCoordinate, 20, 20);
                }

                this.context.fillText(shortenNum(worldResources[mineralIndexToRender].numOwned, 1, 6) + ", " + shortenNum(worldResources[mineralIndexToRender + 1].numOwned, 1, 6) + ", " + shortenNum(worldResources[mineralIndexToRender + 2].numOwned, 1, 6), xCoordinate + 25, yCoordinate + 16);
                i += 3;
                numIsotopesRendered++;
            }
            else
            {
                i++;
            }
        }

        this.context.drawImage(worldResources[BUILDING_MATERIALS_INDEX].smallIcon, 0, 0, worldResources[BUILDING_MATERIALS_INDEX].smallIcon.width, worldResources[BUILDING_MATERIALS_INDEX].smallIcon.height, 8 + mainw * .65, (mainh * .014) - 6, 20, 20);
        this.context.fillText(shortenAndBeautifyNum(worldResources[BUILDING_MATERIALS_INDEX].numOwned), 8 + mainw * .67, 8 + mainh * .014);

        this.context.fillStyle = "#666666";
        if(depth > 302)
        {
            this.context.drawImage(worldResources[OIL_INDEX].smallIcon, 0, 0, worldResources[OIL_INDEX].smallIcon.width, worldResources[OIL_INDEX].smallIcon.height, 8 + mainw * .65, (mainh * .044) - 6, 20, 20);

            if(isOilRigFull())
            {
                this.context.fillRect(8 + mainw * .67, (mainh * .044) - 6, this.context.measureText(shortenAndBeautifyNum(oilRigStats[oilrigStructure.level][1]) + " (100%)").width * 1, 18);
            }
            else
            {
                this.context.fillRect(8 + mainw * .67, (mainh * .044) - 6, this.context.measureText(shortenAndBeautifyNum(oilRigStats[oilrigStructure.level][1]) + " (" + Math.floor(worldResources[OIL_INDEX].numOwned * 100 / oilrigStructure.statValueForCurrentLevel()) + "%)").width * (worldResources[OIL_INDEX].numOwned / oilrigStructure.statValueForCurrentLevel()), 18);
            }

        }

        if(depth > REACTOR_DEPTH)
        {
            this.context.drawImage(worldResources[NUCLEAR_ENERGY_INDEX].smallIcon, 0, 0, worldResources[NUCLEAR_ENERGY_INDEX].smallIcon.width, worldResources[NUCLEAR_ENERGY_INDEX].smallIcon.height, 8 + mainw * .65, (mainh * .074) - 6, 20, 20);

            if(reactor.currentBatteryCharge() > 0)
            {

                if(reactor.currentBatteryCharge() >= reactor.grid.maxBatteryCapacity())
                {
                    this.context.fillRect(8 + mainw * .67, (mainh * .074) - 6, this.context.measureText(shortenAndBeautifyNum(reactor.grid.maxBatteryCapacity()) + " (100%)").width * 1, 18);
                }
                else
                {
                    this.context.fillRect(8 + mainw * .67, (mainh * .074) - 6, this.context.measureText(shortenAndBeautifyNum(reactor.grid.maxBatteryCapacity()) + " (" + Math.floor(reactor.currentBatteryCharge() * 100 / reactor.grid.maxBatteryCapacity()) + "%)").width * (reactor.currentBatteryCharge() / reactor.grid.maxBatteryCapacity()), 18);
                }
            }
        }

        this.context.fillStyle = "#FFFFFF";
        this.context.fillText("$" + beautifynum(money), 8 + mainw * .81, 8 + mainh * .015);
        this.context.fillStyle = "#666666";
        if(capacity > 0)
        {
            if(isCapacityFull())
            {
                this.context.fillRect(8 + mainw * .81, (mainh * .074) - 6, this.context.measureText(_("Capacity") + ": " + shortenAndBeautifyNum(maxHoldingCapacity()) + " (100%)").width * 1, 18);
                if(numFramesRendered % 200 == 1 && playtime < 7200)
                {
                    newNews(_("Your Capacity is Full! Sell some minerals at the sell center so you can keep mining."));
                }
            }
            else
            {
                this.context.fillRect(8 + mainw * .81, (mainh * .074) - 6, this.context.measureText(_("Capacity") + ": " + shortenAndBeautifyNum(reactor.currentBatteryCharge()) + " (" + Math.floor(capacity * 100 / maxHoldingCapacity()) + "%)").width * (capacity / maxHoldingCapacity()), 18);
            }
        }

        var depthText = "";
        if(!getMoon().hasReached())
        {
            depthText = _("Depth") + ": " + depth + "Km (" + (progressTowardsNextDepth.greaterThan(depthDifficultyTable[depth]) ? "100%)" : Math.floor(divideBigNumberToDecimalNumber(progressTowardsNextDepth, depthDifficultyTable[depth]) * 100) + "%)");
        }
        else if(getMoon().hasReached() && !getTitan().hasReached())
        {
            depthText = depth + "Km (W2-" + getMoon().depthReached() + "Km) (" + (progressTowardsNextDepth.greaterThan(depthDifficultyTable[depth]) ? "100%)" : Math.floor(divideBigNumberToDecimalNumber(progressTowardsNextDepth, depthDifficultyTable[depth]) * 100) + "%)");
        }
        else if(getTitan().hasReached())
        {
            depthText = depth + "Km (W3-" + getTitan().depthReached() + "Km) (" + (progressTowardsNextDepth.greaterThan(depthDifficultyTable[depth]) ? "100%)" : Math.floor(divideBigNumberToDecimalNumber(progressTowardsNextDepth, depthDifficultyTable[depth]) * 100) + "%)");
        }

        if(progressTowardsNextDepth.greaterThan(0))
        {
            this.context.fillRect(8 + mainw * .81, (mainh * .044) - 6, this.context.measureText(depthText).width * Math.min(1, (divideBigNumberToDecimalNumber(progressTowardsNextDepth, depthDifficultyTable[depth]))), 18);
        }

        this.context.fillStyle = "#FFFFFF";

        framesRendered2++;
        if(getAnimationFrameIndex(2, 5) == 1 && battleManager.isStalledDueToBoss()) //Red flash if drill is stalled
        {
            this.context.fillStyle = "#FF0000";
            this.context.fillRect(8 + mainw * .81, (mainh * .044) - 6, this.context.measureText(depthText).width, 18);
            this.context.fillStyle = "#000000";
        }
        else
        {
            this.context.fillStyle = "#FFFFFF";
        }
        // Draw warning icon if drill is stalled
        if(battleManager.isStalledDueToBoss())
        {
            var iconX = 8 + mainw * .81 - 35;
            var iconY = (mainh * .044) - 11;
            this.context.drawImage(warning_sign, 0, 0, warning_sign.width, warning_sign.height, iconX, iconY, 30, 30);
            // Draw glowing warning_sign_shine with pulsing alpha
            var pulsePeriod = 24;
            var pulseAlpha = oscillate(framesRendered2, pulsePeriod / 2);
            this.context.save();
            this.context.globalAlpha = pulseAlpha;
            this.context.drawImage(warning_sign_shine, 0, 0, warning_sign_shine.width, warning_sign_shine.height, iconX, iconY, 30, 30);
            this.context.restore();
        }
        this.context.fillText(depthText, 8 + mainw * .81, 8 + mainh * .044);

        if(getAnimationFrameIndex(2, 5) == 1 && isCapacityFull()) //Red flash if capacity is full
        {
            this.context.fillStyle = "#FF0000";
            if(capacity > maxHoldingCapacity())
            {
                this.context.fillRect(8 + mainw * .81, (mainh * .074) - 7, this.context.measureText(_("Capacity") + ": " + shortenAndBeautifyNum(maxHoldingCapacity()) + " (100%)").width, 18);
            }
            else
            {
                this.context.fillRect(8 + mainw * .81, (mainh * .074) - 7, this.context.measureText(_("Capacity") + ": " + shortenAndBeautifyNum(maxHoldingCapacity()) + " (" + Math.floor(capacity * 100 / maxHoldingCapacity()) + "%)").width, 18);
            }
            this.context.fillStyle = "#000000";
        }
        else
        {
            this.context.fillStyle = "#FFFFFF";
        }
        // Draw warning icon if capacity is full
        if(isCapacityFull())
        {
            var iconX = 8 + mainw * .81 - 35;
            var iconY = (mainh * .074) - 12;
            this.context.drawImage(warning_sign, 0, 0, warning_sign.width, warning_sign.height, iconX, iconY, 30, 30);
            // Draw glowing warning_sign_shine with pulsing alpha
            var pulsePeriod = 24;
            var pulseAlpha = oscillate(framesRendered2, pulsePeriod / 2);
            this.context.save();
            this.context.globalAlpha = pulseAlpha;
            this.context.drawImage(warning_sign_shine, 0, 0, warning_sign_shine.width, warning_sign_shine.height, iconX, iconY, 30, 30);
            this.context.restore();
        }
        if(isCapacityFull())
        {
            this.context.fillText(_("Capacity") + ": " + shortenAndBeautifyNum(maxHoldingCapacity()) + " (100%)", 8 + mainw * .81, 8 + mainh * .074);
        }
        else
        {
            this.context.fillText(_("Capacity") + ": " + shortenAndBeautifyNum(maxHoldingCapacity()) + " (" + Math.floor(capacity * 100 / maxHoldingCapacity()) + "%)", 8 + mainw * .81, 8 + mainh * .074);
        }

        if(depth > 302)
        {
            this.context.fillStyle = "#FFFFFF";
            this.context.fillText(shortenAndBeautifyNum(worldResources[OIL_INDEX].numOwned) + " (" + Math.floor(worldResources[OIL_INDEX].numOwned * 100 / oilRigStats[oilrigStructure.level][1]) + "%)", 8 + mainw * .67, 8 + mainh * .044);

        }

        if(depth > REACTOR_DEPTH)
        {
            this.context.fillStyle = "#FFFFFF";
            if(framesRendered2 % 4 == 1 && reactor.grid.maxBatteryCapacity() > 0 && reactor.currentBatteryCharge() >= reactor.grid.maxBatteryCapacity())
            {
                this.context.fillStyle = "#FF0000";
                if(reactor.currentBatteryCharge() >= reactor.grid.maxBatteryCapacity())
                {
                    this.context.fillRect(8 + mainw * .67, (mainh * .074) - 7, this.context.measureText(shortenNum(reactor.grid.maxBatteryCapacity(), 2) + " (100%)").width, 18);
                }
                else
                {
                    this.context.fillRect(8 + mainw * .67, (mainh * .074) - 7, this.context.measureText(shortenNum(reactor.grid.maxBatteryCapacity(), 2) + " (" + Math.floor(reactor.currentBatteryCharge() * 100 / reactor.grid.maxBatteryCapacity()) + "%)").width, 18);
                }
                this.context.fillStyle = "#000000";
            }
            if(reactor.currentBatteryCharge() >= reactor.grid.maxBatteryCapacity())
            {
                this.context.fillText(shortenNum(reactor.grid.maxBatteryCapacity(), 2) + " (100%)", 8 + mainw * .67, 8 + mainh * .074);
            }
            else
            {
                this.context.fillText(shortenNum(reactor.currentBatteryCharge(), 2) + " (" + Math.floor(reactor.currentBatteryCharge() * 100 / reactor.grid.maxBatteryCapacity()) + "%)", 8 + mainw * .67, 8 + mainh * .074);
            }
        }
        this.context.restore();
    }

    renderScrollbar()
    {
        this.context.clearRect(Math.ceil(mainw * .037), Math.ceil(mainh * .128), Math.floor(mainw * .039), Math.ceil(mainh * .907) + Math.ceil(mainh * .074));
        if(currentlyViewedDepth !== 0)
        {
            this.context.drawImage(upallb, 0, 0, upallb.width, upallb.height, Math.ceil(mainw * .037), Math.ceil(mainh * .128), Math.floor(mainw * .039), Math.ceil(mainh * .074));
            this.context.drawImage(upb, 0, 0, upb.width, upb.height, Math.ceil(mainw * .037), Math.ceil(mainh * .203), Math.floor(mainw * .039), Math.ceil(mainh * .074));
        }
        else
        {
            this.context.drawImage(upallbg, 0, 0, upallbg.width, upallbg.height, Math.ceil(mainw * .037), Math.ceil(mainh * .128), Math.floor(mainw * .039), Math.ceil(mainh * .074));
            this.context.drawImage(upbg, 0, 0, upbg.width, upbg.height, Math.ceil(mainw * .037), Math.ceil(mainh * .203), Math.floor(mainw * .039), Math.ceil(mainh * .074));
        }
        if(currentlyViewedDepth !== depth)
        {
            this.context.drawImage(downb, 0, 0, downb.width, downb.height, Math.ceil(mainw * .037), Math.ceil(mainh * .832), Math.floor(mainw * .039), Math.ceil(mainh * .074));
            this.context.drawImage(downallb, 0, 0, downallb.width, downallb.height, Math.ceil(mainw * .037), Math.ceil(mainh * .907), Math.floor(mainw * .039), Math.ceil(mainh * .074));
        }
        else
        {
            this.context.drawImage(downbg, 0, 0, downbg.width, downbg.height, Math.ceil(mainw * .037), Math.ceil(mainh * .832), Math.floor(mainw * .039), Math.ceil(mainh * .074));
            this.context.drawImage(downallbg, 0, 0, downallbg.width, downallbg.height, Math.ceil(mainw * .037), Math.ceil(mainh * .907), Math.floor(mainw * .039), Math.ceil(mainh * .074));
        }
        renderChestSliderDots();

        if(activeLayers.MainUILayer.isOnScroller)
        {
            this.context.globalAlpha = 0.4;
        }
        else if(activeLayers.MainUILayer.isHoveringOverScroller)
        {
            this.context.globalAlpha = 0.70;
        }
        drawCircle(this.context, Math.ceil(mainw * .0565), Math.ceil(mainh * (.314 + (.490 * (currentlyViewedDepth / depth)))), Math.floor(mainw * .004), "#76de74", "#76de74", 0);
        this.context.globalAlpha = 1;
    }

    renderRightSideBar()
    {

        var iconX = Math.ceil(mainw * .937);
        var iconWidth = (this.boundingBox.width) * .0305 * uiScaleX;
        var iconHeight = (this.boundingBox.height) * .058 * uiScaleY;

        this.context.clearRect(iconX, Math.ceil(mainh * .115), iconWidth, Math.ceil(mainh * .885));
        this.context.drawImage(settingsb, 0, 0, 33, 34, iconX, Math.ceil(mainh * .115), iconWidth, iconHeight);

        var y0 = Math.ceil(mainh * 0.175);
        var yIncrement = Math.ceil(mainh * 0.06);

        if(!isCraftNotificationOn)
        {
            this.context.drawImage(hammerAnvil, 0, 0, hammerAnvil.width, hammerAnvil.height, iconX, y0, iconWidth, iconHeight);
        }
        else
        {
            this.context.globalAlpha = 0.5 + (0.5 * oscillate(currentTime(), 500));
            console.log(this.context.globalAlpha);
            this.context.drawImage(hammerAnvil, 0, 0, hammerAnvil.width, hammerAnvil.height, iconX, y0, iconWidth, iconHeight);
            this.context.globalAlpha = 1;
        }

        //Shortcuts
        if(depth >= tradeConfig.tradingPosts[0].depth)
        {
            let iconY = this.getHitboxById("tradePostShortcut").boundingBox.y;
            if(isTradeAvailable(earthTradeOffer1))
            {
                this.context.drawImage(tradingpostb, 0, 0, 33, 39, iconX, iconY * uiScaleY, iconWidth, iconHeight);
            }
            else
            {
                let timeRemainingUntilTrade = getNextTradeTimeForWorld(0) - playtime;
                let icon;
                if(tradeConfig.tradingPosts[0].structure.level > 0)
                {
                    let maxTimeUntilNextTrade = getTimeBetweenTrades(0);
                    icon = generateIconWithCooldownOverlay(
                        tradingpostb,
                        iconWidth,
                        iconHeight,
                        timeRemainingUntilTrade / maxTimeUntilNextTrade
                    );
                }
                else
                {
                    icon = generateIconWithCooldownOverlay(
                        tradingpostb,
                        iconWidth,
                        iconHeight,
                        1
                    );
                }
                this.context.drawImage(icon, iconX, iconY * uiScaleY);
                if(icon.remove) icon.remove();
                icon = null;
            }
        }

        if(superMinerManager.numSuperMiners() > 0 || chestService.totalBlackChestsOpened > 0)
        {
            let iconY = this.getHitboxById("superMinerShortcut").boundingBox.y;
            this.context.drawImage(superb, iconX, iconY * uiScaleY, iconWidth, iconHeight);
        }

        if(hasUnlockedScientists)
        {
            var inactiveColor = "#888888";
            var completeColor = "#00FF00";
            var workingColor = "#FFFF00";
            var allWorking = true;
            var dotColor;
            let hitbox = this.getHitboxById("scientistShortcut");
            var iconY = hitbox.boundingBox.y;
            var dotWidth = iconWidth / 6;
            this.context.save();
            this.context.drawImage(scientistb, iconX, iconY * uiScaleY, iconWidth, iconHeight);

            dotColor = inactiveColor;   // Default to inactive color

            for(var i in currentScientists.scientists)
            {
                if(currentScientists.scientists[i].length > 0)
                {
                    if(isExcavationDone(i) || isScientistDead(i))
                    {
                        dotColor = completeColor;  // If any excavation is done, set to complete color and break
                        allWorking = false;
                        break;
                    }
                    else if(!isOnActiveExcavation(i))
                    {
                        allWorking = false;
                    }
                }
            }

            if(allWorking) dotColor = workingColor; // If all scientists are working, set to working color. Else, keep it as inactive color
            if(currentScientists.scientists.length == 0) dotColor = inactiveColor; // If no scientists, set to inactive color

            var dotX = iconX + dotWidth * 1.5;
            var dotY = iconY + dotWidth;
            this.context.fillStyle = dotColor;
            this.context.strokeStyle = "#111111";
            this.context.beginPath();
            this.context.arc(dotX, dotY * uiScaleY, dotWidth / 2, 0, Math.PI * 2);
            this.context.fill();
            this.context.stroke();

            this.context.restore();
        }
        if(depth >= 304)
        {
            var inactiveColor = "#888888";
            var workingColor = "#FFFF00";
            var dotColor;
            var iconY = this.getHitboxById("cityShortcut").boundingBox.y;
            var dotWidth = iconWidth / 6;
            this.context.drawImage(undergroundb, iconX, iconY * uiScaleY, iconWidth, iconHeight);
        }

        if(depth >= 501)
        {
            var iconY = this.getHitboxById("coreShortcut").boundingBox.y;
            this.context.drawImage(coreb, iconX, iconY * uiScaleY, iconWidth, iconHeight);
        }

        if(depth >= tradeConfig.tradingPosts[1].depth)
        {
            var iconY = this.getHitboxById("lunarTradePostShortcut").boundingBox.y;

            if(isTradeAvailable(moonTradeOffer1))
            {
                this.context.drawImage(lunartradingpostb, 0, 0, 33, 39, iconX, iconY * uiScaleY, iconWidth, iconHeight);
            }
            else
            {
                let timeRemainingUntilTrade = getNextTradeTimeForWorld(1) - playtime;
                let icon;
                if(tradeConfig.tradingPosts[1].structure.level > 0)
                {
                    let maxTimeUntilNextTrade = getTimeBetweenTrades(1);
                    icon = generateIconWithCooldownOverlay(
                        lunartradingpostb,
                        iconWidth,
                        iconHeight,
                        timeRemainingUntilTrade / maxTimeUntilNextTrade
                    );
                }
                else
                {
                    icon = generateIconWithCooldownOverlay(
                        lunartradingpostb,
                        iconWidth,
                        iconHeight,
                        1
                    );
                }
                this.context.drawImage(icon, iconX, iconY * uiScaleY);
                if(icon.remove) icon.remove();
                icon = null;
            }
        }

        if(depth >= tradeConfig.tradingPosts[2].depth)
        {
            var iconY = this.getHitboxById("titanTradePostShortcut").boundingBox.y;

            if(isTradeAvailable(titanTradeOffer1))
            {
                this.context.drawImage(titantpbutton, 0, 0, 33, 39, iconX, iconY * uiScaleY, iconWidth, iconHeight);
            }
            else
            {
                let timeRemainingUntilTrade = getNextTradeTimeForWorld(2) - playtime;
                let icon;
                if(tradeConfig.tradingPosts[2].structure.level > 0)
                {
                    let maxTimeUntilNextTrade = getTimeBetweenTrades(2);
                    icon = generateIconWithCooldownOverlay(
                        titantpbutton,
                        iconWidth,
                        iconHeight,
                        timeRemainingUntilTrade / maxTimeUntilNextTrade
                    );
                }
                else
                {
                    icon = generateIconWithCooldownOverlay(
                        titantpbutton,
                        iconWidth,
                        iconHeight,
                        1
                    );
                }
                this.context.drawImage(icon, iconX, iconY * uiScaleY);
                if(icon.remove) icon.remove();
                icon = null;
            }
        }

        if(depth >= REACTOR_DEPTH + 1)
        {
            var iconY = this.getHitboxById("reactorShortcut").boundingBox.y;
            this.context.drawImage(reactorb, iconX, iconY * uiScaleY, iconWidth, iconHeight);

            var inactiveColor = "#FFFF00";
            var workingColor = "#00FF00";
            var disabledColor = "#FF0000"
            var dotColor;

            var dotWidth = iconWidth / 6;
            this.context.save();
            if(reactor.isRunning)
            {
                dotColor = workingColor;

                for(var i = 0; i < reactor.grid.fuelCellRemainingEnergy.length; i++)
                {
                    if(reactor.grid.fuelCellRemainingEnergy[i].remainingEnergy == 0)
                    {
                        dotColor = inactiveColor;
                    }
                }

            }
            else
            {
                dotColor = disabledColor;
            }
            var dotX = iconX + iconWidth / 2 - dotWidth * 1.5;
            var dotY = iconY + dotWidth;
            this.context.fillStyle = dotColor;
            this.context.strokeStyle = "#111111";
            this.context.beginPath();
            this.context.arc(dotX, dotY * uiScaleY, dotWidth / 2, 0, Math.PI * 2);
            this.context.fill();
            this.context.stroke();
            this.context.restore();
        }

        if(depth >= CAVE_BUILDING_DEPTH)
        {
            var frameNum = getAnimationFrameIndex(8, 10);
            var iconY = this.getHitboxById("caveMenuShortcut").boundingBox.y;
            var dotWidth = iconWidth / 6;
            if((frameNum == 0 || frameNum == 2) && treasureStorage.isFull())
            {
                if(!this.redCaveButtonIcon || this.redCaveButtonIcon.width == 0)
                {
                    var tempCanvas = document.createElement('canvas');
                    var tempContext = tempCanvas.getContext('2d');
                    tempCanvas.width = caveb.width;
                    tempCanvas.height = caveb.height;
                    tempContext.drawImage(caveb, 0, 0);
                    tempContext.globalAlpha = 0.4;
                    tempContext.fillStyle = "#FF0000";
                    tempCanvas.globalCompositeOperation = 'source-atop';
                    console.log("Drawing red cave button icon");
                    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    this.redCaveButtonIcon = new Image();
                    this.redCaveButtonIcon.src = tempCanvas.toDataURL();
                    tempCanvas.remove();
                    tempCanvas = null;
                }
                if(this.redCaveButtonIcon && this.redCaveButtonIcon.width > 0)
                {
                    this.context.drawImage(this.redCaveButtonIcon, iconX, iconY * uiScaleY, iconWidth, iconHeight);
                }
            }
            else
            {
                this.context.drawImage(caveb, iconX, iconY * uiScaleY, iconWidth, iconHeight);
            }
            var dotColor = "#888888";
            for(var i in caves)
            {
                if(caves[i].isActive && !caves[i].isExplored)
                {
                    // New cave available
                    dotColor = "#00FF00";
                    break;
                }
                else if(caves[i].isActive && caves[i].currentFuel >= 100)
                {
                    // Can send a drone in a cave
                    dotColor = "#FFFF00";
                }
            }
            this.context.save();
            var dotX = iconX + iconWidth / 2 + dotWidth * (0 - 1) * 1.5;
            var dotY = iconY + dotWidth;
            this.context.fillStyle = dotColor;
            this.context.strokeStyle = "#111111";
            this.context.beginPath();
            this.context.arc(dotX, dotY * uiScaleY, dotWidth / 2, 0, Math.PI * 2);
            this.context.fill();
            this.context.stroke();
            this.context.restore();
        }
    }

    renderPopupDialogueAttachment()
    {
        if(this.activeDialogue.x > 0)
        {
            if(activeLayers.hasOwnProperty(this.activeDialogue.popupId))
            {
                var popupDialogueWidth = this.boundingBox.width * .125 * uiScaleX;
                var popupDialogueHeight = this.boundingBox.height * .425 * uiScaleY;
                var leftSideOfDialogueX = this.activeDialogue.x - popupDialogueWidth;
                var padding = this.boundingBox.width * .01 * uiScaleX;
                var leftSideOfDialogueWidthPaddingX = this.activeDialogue.x - popupDialogueWidth + padding;
                var dialogueHolderWidthAfterPadding = popupDialogueWidth - padding * 2;

                this.context.save();
                this.context.textBaseline = "top";
                this.context.font = "12px Verdana";
                var dialogueTextDimensions = fillTextWrap(
                    this.context,
                    this.activeDialogue.dialogueText,
                    leftSideOfDialogueWidthPaddingX,
                    this.activeDialogue.y + (padding * 1.5) + dialogueHolderWidthAfterPadding,
                    dialogueHolderWidthAfterPadding,
                    "left",
                    0.2,
                    true
                );

                this.context.drawImage(
                    narrowTooltip, 0, 0, narrowTooltip.width, narrowTooltip.height,
                    leftSideOfDialogueX, this.activeDialogue.y, popupDialogueWidth, (dialogueTextDimensions.y2 - this.activeDialogue.y) + padding);

                this.context.drawImage(
                    darkdot, 0, 0, 1, 1,
                    leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding, dialogueHolderWidthAfterPadding, dialogueHolderWidthAfterPadding);

                this.context.strokeStyle = "#70401e";
                this.context.strokeRect(leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding, dialogueHolderWidthAfterPadding, dialogueHolderWidthAfterPadding);

                var dialogueImage;
                if(this.activeDialogue.extraImage && getAnimationFrameIndex(CHARACTER_BLINK_PERIOD, 10) == 0)
                {
                    dialogueImage = this.activeDialogue.extraImage;
                }
                else
                {
                    dialogueImage = this.activeDialogue.dialogueImage;
                }
                this.context.drawImage(
                    dialogueImage, 0, 0, dialogueImage.width, dialogueImage.height,
                    leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding, dialogueHolderWidthAfterPadding, dialogueHolderWidthAfterPadding);

                this.context.textBaseline = "top";
                this.context.font = "12px Verdana";
                var dialogueTextDimensions = fillTextWrap(
                    this.context,
                    this.activeDialogue.dialogueText,
                    leftSideOfDialogueWidthPaddingX,
                    this.activeDialogue.y + (padding * 1.5) + dialogueHolderWidthAfterPadding,
                    dialogueHolderWidthAfterPadding,
                    "left",
                    0.2
                );

                this.context.textBaseline = "bottom";
                this.context.fillStyle = "#000000";
                this.context.strokeStyle = "#000000";
                this.context.globalAlpha = 0.27;
                this.context.fillRect(leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding + dialogueHolderWidthAfterPadding - 16, dialogueHolderWidthAfterPadding, 16);
                this.context.globalAlpha = 1;
                this.context.fillStyle = "#FFFFFF";
                strokeTextShrinkToFit(this.context, this.activeDialogue.dialoguePartyName, leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding + dialogueHolderWidthAfterPadding, dialogueHolderWidthAfterPadding, "center");
                fillTextShrinkToFit(this.context, this.activeDialogue.dialoguePartyName, leftSideOfDialogueWidthPaddingX, this.activeDialogue.y + padding + dialogueHolderWidthAfterPadding, dialogueHolderWidthAfterPadding, "center");

                this.context.restore();
            }
            else
            {
                this.removeDialogueAttachment();
            }
        }
    }

    removeDialogueAttachment()
    {
        this.activeDialogue = {
            "dialogueText": "",
            "dialogueImage": null,
            "dialoguePartyName": "",
            "popupId": "",
            "x": 0,
            "y": 0,
            "isActive": false
        };
    }

    addPopupDialogueAttachment(dialogueText, dialogueImage, dialoguePartyName, dialoguePopupId, extraImage = null)
    {
        var globalCoordinates;
        for(var key in activeLayers)
        {
            if(activeLayers.hasOwnProperty(dialoguePopupId) && activeLayers[key].isPopup)
            {
                if(activeLayers[key].hasOwnProperty("tabHeight"))
                {
                    globalCoordinates = this.getGlobalCoordinates(activeLayers[key].boundingBox.x, activeLayers[key].boundingBox.y + activeLayers[key].tabHeight);
                }
                else
                {
                    globalCoordinates = this.getGlobalCoordinates(activeLayers[key].boundingBox.x, activeLayers[key].boundingBox.y);
                }

                this.activeDialogue.dialogueImage = dialogueImage;
                this.activeDialogue.extraImage = extraImage;
                this.activeDialogue.dialogueText = dialogueText;
                this.activeDialogue.dialoguePartyName = dialoguePartyName;
                this.activeDialogue.popupId = dialoguePopupId;
                this.activeDialogue.x = globalCoordinates.x * uiScaleX;
                this.activeDialogue.y = globalCoordinates.y * uiScaleY;
                this.activeDialogue.isActive = true;
                return;
            }
        }
    }

    displayNewBuff(activeBuffIndex)
    {
        var newBuffHitbox = new Hitbox(
            {
                x: 0,
                y: 0,
                width: Math.floor(mainw * .03),
                height: Math.ceil(mainh * .055)
            },
            {},
            "pointer"
        );

        if(activeLayers.PinnedBlueprintsLayer)
        {
            this.buffContainer.boundingBox.y = activeLayers.PinnedBlueprintsLayer.pinnedBlueprintContainer.boundingBox.height + 100;
        }

        newBuffHitbox.onmouseenter = function (i)
        {
            var tooltipWidth = 160;
            buffs.showBuffTooltip(
                i,
                (this.parent.boundingBox.x + this.boundingBox.x - tooltipWidth + this.boundingBox.width) * uiScaleX,
                (this.parent.boundingBox.y + this.boundingBox.y + this.boundingBox.height) * uiScaleY
            )
        }.bind(newBuffHitbox, activeBuffIndex)
        newBuffHitbox.onmouseexit = function ()
        {
            hideTooltip();
        }
        newBuffHitbox.render = function (root, i, buffObject)
        {
            var coords = this.getGlobalCoordinates(0, 0);
            renderBuff(
                root.context,
                coords.x * uiScaleX,
                coords.y * uiScaleY,
                this.boundingBox.width,
                this.boundingBox.height,
                i
            );
            if(buffs.activeBuffs[i] != buffObject || buffs.getBuffTimeRemaining(i) <= 0)
            {
                root.deleteBuffFromOverlay(this);
            }
        }.bind(newBuffHitbox, this, activeBuffIndex, buffs.activeBuffs[activeBuffIndex]);
        this.buffContainer.addHitbox(newBuffHitbox);
        this.arrangeBuffsInOverlay();
    }

    displayAllBuffs()
    {
        this.buffContainer.clearHitboxes();
        for(var i in buffs.activeBuffs)
        {
            if(!buffs.activeBuffs[i].isPaused())
            {
                this.displayNewBuff(i);
            }
        }
        this.arrangeBuffsInOverlay();
    }

    arrangeBuffsInOverlay()
    {
        var buffList = this.buffContainer.hitboxes;
        var padding = 5;
        if(buffList.length > 0)
        {
            var numberOfBuffsPerColumn = Math.floor(this.buffContainer.boundingBox.height / ((buffList[0].boundingBox.height + padding) + padding));
            var numberOfColumns = Math.ceil(buffList.length / numberOfBuffsPerColumn);
            this.buffContainer.boundingBox.width = (buffList[0].boundingBox.width + padding) * numberOfColumns;
            this.buffContainer.boundingBox.x = this.buffContainer.defaultX - (numberOfColumns - 1) * (buffList[0].boundingBox.width + padding);
            for(var i = 0; i < buffList.length; ++i)
            {
                buffList[i].boundingBox.x = (numberOfColumns - 1 - Math.floor(i / numberOfBuffsPerColumn)) * (buffList[i].boundingBox.width + padding);
                buffList[i].boundingBox.y = (i % numberOfBuffsPerColumn) * (buffList[i].boundingBox.height + padding);
                // Reset hitbox ID to ensure it matches the buff's index in activeBuffs
                buffList[i].id = "buff_" + i;
            }
        }
        else
        {
            this.buffContainer.boundingBox.x = this.buffContainer.defaultX;
            this.buffContainer.boundingBox.width = 0;
        }
    }

    deleteBuffFromOverlay(activeBuffHitbox)
    {
        this.buffContainer.deleteHitboxWithId(activeBuffHitbox.id);
        this.displayAllBuffs();
    }

}



//############# GLOBAL SCOPED #############
var lastScrollTime = 0;
var maxRefreshRateMsecs = 10;
function changeViewedDepthBasedOnMouseScrollerPosition()
{
    if(expectedTimeUntilNextRepaintMsec() < maxRefreshRateMsecs && lastScrollTime < currentTime() - maxRefreshRateMsecs)
    {
        var pageHeight = window.innerHeight;
        var startOfScroller = pageHeight * .311;
        var endOfScroller = pageHeight * .805;
        var heightOfScroller = endOfScroller - startOfScroller;
        var mousePercent = (mouseY - startOfScroller) / heightOfScroller;
        mousePercent = Math.max(0, mousePercent);
        if(mousePercent >= 0 && mousePercent <= 100)
        {
            var newDepthToView = Math.round(depth * mousePercent);
            newDepthToView = Math.min(newDepthToView, depth);
            currentlyViewedDepth = newDepthToView;

            MAIN.clearRect(0, mainh * .11, mainw, mainh * .89);
            animate();
            hasAnimatedThisFrame = 1;
            movedivs();
        }
        lastScrollTime = currentTime();
    }
}