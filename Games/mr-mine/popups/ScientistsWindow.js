class ScientistsWindow extends TabbedPopupWindow
{

    layerName = "Arch"; // Used as key in activeLayers
    domElementId = "ARCHD"; // ID of dom element that gets shown or hidden
    context = ARCH;         // Canvas rendering context for popup

    scientistsPane;
    relicsPane;

    buttonHitboxes;


    constructor(boundingBox)
    {
        super(boundingBox); // Need to call base class constructor
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        var tabCategories = {
            0: _("Excavations"),
            1: _("Relics")
        }

        this.backgroundImage = scientistbg;
        this.initializeTabs(Object.values(tabCategories));

        this.scientistsPane = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            this.bodyContainer.boundingBox.height,
            this.context,
            this.bodyContainer.boundingBox.x,
            this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * 0.1,
            this.bodyContainer.boundingBox.width,
            this.bodyContainer.boundingBox.height * 0.9,
            15
        );
        this.scientistsPane.allowBubbling = true;
        this.addHitbox(this.scientistsPane);

        this.relicsPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "relicsPane"
        );
        this.relicsPane.allowBubbling = true;
        this.addHitbox(this.relicsPane);

        this.onTabChange();
    }

    onTabChange()
    {
        if(this.currentTabIndex < 1)
        {
            this.relicsPane.setVisible(false)
            this.relicsPane.setEnabled(false)
            this.scientistsPane.setVisible(true)

            this.scientistsPane.setEnabled(true)

            this.initializeScientistHitboxes();
        }
        else
        {
            this.relicsPane.setVisible(true)
            this.relicsPane.setEnabled(true)
            this.scientistsPane.setVisible(false)
            this.scientistsPane.setEnabled(false)

            this.relicsPane.clearHitboxes();
            this.initializeRelicsHitboxes();
        }
    }

    initializeScientistHitboxes()
    {

        this.scientistsPane.clearHitboxes();

        if(currentScientists.scientists.length == 0) return;

        var sortedIndexes = this.sortCompletedExcavations();

        //Container values
        var xPos = 0;
        var yPos = 0;
        var width = this.scientistsPane.boundingBox.width * 0.97;
        var height = this.scientistsPane.boundingBox.height * 0.49;
        var yOffset = this.scientistsPane.boundingBox.height * 0.02;

        this.scientistsPane.excavationStatuses = [];

        currentScientists.scientists.forEach((scientist, index) =>
        {
            if(scientist == [])
            {
                return
            }
            //Scientist container
            var sortedPosition = sortedIndexes.indexOf(index);

            var scientistContainer = new Hitbox(
                {
                    x: xPos,
                    y: yPos + (height + yOffset) * sortedPosition,
                    width: width,
                    height: height
                },
                {
                    onmouseenter: function () { },
                },
                "default",
                "scientistContainer_" + index
            );

            //Scientist frame 
            scientistContainer.frame = this.getAnimatedRarityFrame(scientists[scientist[0]].rarity);

            if(scientistContainer.frame)
            {
                scientistContainer.frameRenderer = new SpritesheetAnimation(scientistContainer.frame, 15, 10);
            }
            else
            {
                scientistContainer.frame = this.getRarityFrame(scientists[scientist[0]].rarity);
                scientistContainer.frameRenderer = null;
            }

            scientistContainer.render = function ()
            {
                this.parent.context.drawImage(scientistbg, scientistContainer.boundingBox.x + scientistContainer.boundingBox.width * 0.25, scientistContainer.boundingBox.y, scientistContainer.boundingBox.width * 0.57, scientistContainer.boundingBox.height);

                this.parent.context.drawImage(taskPanel, scientistContainer.boundingBox.x + scientistContainer.boundingBox.width * 0.25, scientistContainer.boundingBox.y, scientistContainer.boundingBox.width * 0.75, scientistContainer.boundingBox.height);

                //Render Frame
                if(scientistContainer.frameRenderer)
                {
                    if(scientists[scientist[0]].rarity == scientistRarities.warped || scientists[scientist[0]].rarity == scientistRarities.warpedPlus || scientists[scientist[0]].rarity == scientistRarities.warpedPlusPlus)
                    {
                        let frame = numFramesRendered % 100;

                        if(frame < 50 || frame > 52)
                        {
                            scientistContainer.frameRenderer.drawAnimation(
                                this.parent.context,
                                scientistContainer.boundingBox.x,
                                scientistContainer.boundingBox.y,
                                scientistContainer.boundingBox.width * 0.25,
                                scientistContainer.boundingBox.height,
                                false,
                                [0, 1, 2, 3, 4, 7, 8, 9, 8, 9, 8, 9]
                            );
                        }
                        else
                        {
                            scientistContainer.frameRenderer.loopFrames(
                                this.parent.context,
                                scientistContainer.boundingBox.x,
                                scientistContainer.boundingBox.y,
                                scientistContainer.boundingBox.width * 0.25,
                                scientistContainer.boundingBox.height,
                                false,
                                11,
                                14
                            );
                        }
                    }
                    else
                    {
                        scientistContainer.frameRenderer.loopFrames(
                            this.parent.context,
                            scientistContainer.boundingBox.x,
                            scientistContainer.boundingBox.y,
                            scientistContainer.boundingBox.width * 0.25,
                            scientistContainer.boundingBox.height,
                            false,
                            0,
                            14
                        );
                    }
                }
                else
                {
                    this.parent.context.drawImage(scientistContainer.frame, scientistContainer.boundingBox.x, scientistContainer.boundingBox.y, scientistContainer.boundingBox.width * 0.25, scientistContainer.boundingBox.height);
                }
            }
            this.scientistsPane.addHitbox(scientistContainer);

            //Container partitions
            var partition1X = 0;
            var partition1Width = scientistContainer.boundingBox.width * .25;
            var partition2X = scientistContainer.boundingBox.width * .25;
            var partition2Width = scientistContainer.boundingBox.width * .57;
            var partition3X = scientistContainer.boundingBox.width * .82;
            var partition3Width = scientistContainer.boundingBox.width * .18;

            //Partition 1 - Scientist info

            var yInfoPos = scientistContainer.boundingBox.y + scientistContainer.boundingBox.height * 0.04;

            var scientistName = new Hitbox(
                {
                    x: partition1X,
                    y: yInfoPos,
                    width: partition1Width,
                    height: scientistContainer.boundingBox.height * 0.15
                },
                {},
                "default",
                "scientistName_" + index
            );
            var scientistImage = new Hitbox(
                {
                    x: partition1Width * 0.125,
                    y: yInfoPos + (scientistContainer.boundingBox.height * 0.09),
                    width: partition1Width * 0.75,
                    height: partition1Width * 0.76
                },
                {
                    onmouseenter: function ()
                    {
                        showTooltip(_("Scientist info"), _("Level and Rarity affects the amount of rewards excavations give. Rarity also reduces your death chance and increases the amount of experience your scientist gains."))
                    },
                    onmouseexit: hideTooltip
                },
                "default",
                "scientistImage_" + index
            );
            var scientistRarity = new Hitbox(
                {
                    x: scientistImage.boundingBox.x,
                    y: yInfoPos + scientistContainer.boundingBox.height * 0.7,
                    width: scientistImage.boundingBox.width,
                    height: scientistContainer.boundingBox.height * 0.1
                },
                {},
                "default",
                "scientistRarity_" + index
            );
            var scientistLevel = new Hitbox(
                {
                    x: (partition1Width - partition1Width * 0.92) / 2,
                    y: yInfoPos + scientistContainer.boundingBox.height * 0.81,
                    width: partition1Width * 0.92,
                    height: scientistContainer.boundingBox.height * 0.12
                },
                {},
                "default",
                "scientistLevel_" + index
            );

            //Scientist Info Renders

            var staticScientist = scientists[currentScientists.scientists[index][0]];

            scientistName.render = function ()
            {
                //Render Name
                var nameText = staticScientist.name;
                this.parent.context.fillStyle = "#000000"
                this.parent.context.font = `${this.boundingBox.height * .6}px Verdana`;
                fillTextShrinkToFit(this.parent.context, nameText, scientistName.boundingBox.x + scientistName.boundingBox.width * .05, scientistName.boundingBox.y + scientistName.boundingBox.height * 0.4, scientistName.boundingBox.width * .9, "center", 0, false, true);
            }

            scientistImage.render = function ()
            {
                var imageId = getScientistImage(currentScientists.scientists[index][0]);

                //Render Noise
                this.parent.context.fillStyle = "#211A14"
                if(!staticScientist.isNormal && quality == 1)
                {
                    var noiseImages = [noise1, noise2, noise3, noise4, noise5, noise6];
                    var selectedNoise = noiseImages[rand(0, noiseImages.length - 1)];
                    this.parent.context.globalAlpha = 0.2 + (0.15 * Math.random());
                    this.parent.context.drawImage(selectedNoise, 0, 0, selectedNoise.width, selectedNoise.height, scientistContainer.boundingBox.x + scientistContainer.boundingBox.width * 0.01, scientistImage.boundingBox.y, scientistContainer.boundingBox.width * 0.23, scientistImage.boundingBox.height);
                    this.parent.context.globalAlpha = 1;
                }

                //Render Image
                if(isScientistDead(index))
                {
                    if(index % 2 != 0)
                    {
                        this.parent.context.drawImage(death1, 0, 0, death1.width, death1.height, scientistImage.boundingBox.x, scientistImage.boundingBox.y, scientistImage.boundingBox.width, scientistImage.boundingBox.height);
                    }
                    else
                    {
                        this.parent.context.drawImage(death2, 0, 0, death2.width, death2.height, scientistImage.boundingBox.x, scientistImage.boundingBox.y, scientistImage.boundingBox.width, scientistImage.boundingBox.height);
                    }
                }
                else
                {
                    this.parent.context.drawImage(imageId, 0, 0, imageId.width, imageId.height, scientistImage.boundingBox.x, scientistImage.boundingBox.y, scientistImage.boundingBox.width, scientistImage.boundingBox.height);
                }
            }

            scientistRarity.render = function ()
            {
                this.parent.context.font = `bold ${this.boundingBox.height * .5}px Verdana`;
                this.parent.context.fillStyle = "#A25D03";
                this.parent.context.save();
                var rarityText = _(staticScientist.rarity.name);
                fillTextShrinkToFit(this.parent.context, rarityText, scientistRarity.boundingBox.x, scientistRarity.boundingBox.y + scientistRarity.boundingBox.height * 0.7, scientistRarity.boundingBox.width, "center", 0, false, true);
                this.parent.context.restore();
                this.parent.context.fillStyle = "#FFFFFF";
                this.parent.context.font = "14px Verdana";
            }

            scientistLevel.render = function ()
            {
                this.parent.context.fillStyle = "#FFFFFF";
                this.parent.context.font = "13px Verdana";
                var levelText = _("Lvl") + " " + getScientistLevel(index)
                if(getScientistLevel(index) < 100)
                {
                    renderFancyProgressBar(this.parent.context, levelText, getScientistPercentToNextLevel(index), scientistLevel.boundingBox.x, scientistLevel.boundingBox.y, scientistLevel.boundingBox.width, scientistLevel.boundingBox.height, "#7f7f7f", "#12131a", "#FFFFFF", taskValueFrame);

                } else
                {
                    renderFancyProgressBar(this.parent.context, levelText, 1, scientistLevel.boundingBox.x, scientistLevel.boundingBox.y, scientistLevel.boundingBox.width, scientistLevel.boundingBox.height, "#7f7f7f", "#12131a", "#FFFFFF", taskValueFrame);
                }
            }

            this.scientistsPane.addHitbox(scientistName);
            this.scientistsPane.addHitbox(scientistImage);
            this.scientistsPane.addHitbox(scientistRarity);
            this.scientistsPane.addHitbox(scientistLevel);

            //Partition 2 - Excavation info

            var excavationTitle = new Hitbox(
                {
                    x: partition2X,
                    y: scientistContainer.boundingBox.y,
                    width: partition2Width,
                    height: scientistContainer.boundingBox.height * .1
                },
                {},
                "default",
                "excavationTitle_" + index
            )

            var excavationImage = new Hitbox(
                {
                    x: partition2X + (partition2Width - partition2Width * .2) / 2,
                    y: scientistContainer.boundingBox.y + scientistContainer.boundingBox.height * .2,
                    width: partition2Width * .2,
                    height: partition2Width * .2
                },
                {
                    onmouseenter: function ()
                    {
                        if(isOnActiveExcavation(index))
                        {
                            var rewardInfo = getActiveExcavationRewardValues(index);
                            var isRewardShown = currentScientists.excavations[index][7];
                            if(rewardInfo.id > -1 && (isRewardShown || (isExcavationDone(index) && !isScientistDead(index)) || displayHiddenExcavations) && !wasScientistSacrificed(index))
                            {
                                showTooltip(rewardInfo.name, rewardInfo.description);
                                this.cursor = 'pointer';
                            } else
                            {
                                showTooltip("???", "Unknown");
                                this.cursor = 'pointer';
                            }
                        }

                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "default",
                "excavationImage_" + index
            );

            var excavationProgress = new Hitbox(
                {
                    x: partition2X + partition2Width * .01,
                    y: scientistContainer.boundingBox.y + scientistContainer.boundingBox.height - scientistContainer.boundingBox.height * .24,
                    width: partition2Width * 0.98,
                    height: scientistContainer.boundingBox.height * .22
                },
                {},
                "default",
                "excavationProgress_" + index
            );

            //Excavation Renders
            excavationTitle.render = function ()
            {
                if(isOnActiveExcavation(index))
                {
                    var activeExcavation = currentScientists.excavations[index];
                    var staticExcavation = excavations[activeExcavation[5]];
                    var difficultyText = staticExcavation.difficulty;
                    var isRewardShown = currentScientists.excavations[index][7];
                    this.parent.context.fillStyle = this.parent.parent.getDifficultyColor(difficultyText);
                    var excavationText = getActiveExcavationText(index);
                    this.parent.context.font = excavationTitle.boundingBox.height * 0.5 + "px Verdana"
                    fillTextShrinkToFit(this.parent.context, excavationText, excavationTitle.boundingBox.x, excavationTitle.boundingBox.y + excavationTitle.boundingBox.height, excavationTitle.boundingBox.width, "center", 0, false, true);
                    this.parent.context.fillStyle = "#FFFFFF";
                    this.parent.context.font = "14px Verdana";

                    var excavationRewardValues = getActiveExcavationRewardValues(index);

                    var rewardText;
                    if(excavationRewardValues.id > -1 && (isRewardShown || (isExcavationDone(index) && !isScientistDead(index)) || displayHiddenExcavations) && !wasScientistSacrificed(index))
                    {
                        var rewardText = excavationRewardValues.name;
                        excavationRewards[excavationRewardValues.id].renderFunction(this.parent.context, excavationRewardValues.id, excavationImage.boundingBox.x, excavationImage.boundingBox.y, excavationImage.boundingBox.width, excavationImage.boundingBox.height);
                    }
                    else
                    {
                        var rewardText = "Reward: ???";
                    }

                    fillTextShrinkToFit(this.parent.context, rewardText, excavationProgress.boundingBox.x, excavationProgress.boundingBox.y - excavationProgress.boundingBox.height / 3, excavationProgress.boundingBox.width, "center");
                }
                else
                {
                    this.parent.context.font = "bold " + excavationTitle.boundingBox.height * 0.7 + "px Verdana"
                    var excavationText = _("Awaiting Excavation");
                    fillTextShrinkToFit(this.parent.context, excavationText, excavationTitle.boundingBox.x, excavationTitle.boundingBox.y + excavationTitle.boundingBox.height, excavationTitle.boundingBox.width, "center");
                    this.parent.context.fillStyle = "#FFFFFF";
                    this.parent.context.font = "14px Verdana";

                    var tempFont = this.parent.context.font;
                    this.parent.context.font = "14px Verdana";
                    this.parent.context.font = tempFont;
                }
            }
            excavationImage.render = function ()
            {
                this.parent.context.drawImage(frame_large, excavationImage.boundingBox.x - excavationImage.boundingBox.width * 0.05, excavationImage.boundingBox.y - excavationImage.boundingBox.height * 0.05, excavationImage.boundingBox.width * 1.12, excavationImage.boundingBox.height * 1.12);
                this.parent.context.fillStyle = "rgba(255, 255, 255, 0.1)";
                this.parent.context.fillRect(excavationImage.boundingBox.x, excavationImage.boundingBox.y, excavationImage.boundingBox.width, excavationImage.boundingBox.height);

                if(isOnActiveExcavation(index))
                {
                    var isRewardShown = currentScientists.excavations[index][7];

                    this.parent.context.fillStyle = "#FFFFFF";
                    this.parent.context.font = "14px Verdana";

                    var excavationRewardValues = getActiveExcavationRewardValues(index);

                    if(excavationRewardValues.id > -1 && (isRewardShown || (isExcavationDone(index) && !isScientistDead(index)) || displayHiddenExcavations) && !wasScientistSacrificed(index))
                    {
                        excavationRewards[excavationRewardValues.id].renderFunction(this.parent.context, excavationRewardValues.id, excavationImage.boundingBox.x, excavationImage.boundingBox.y, excavationImage.boundingBox.width, excavationImage.boundingBox.height);
                    }
                    else
                    {
                        this.parent.context.drawImage(darkdot, 0, 0, darkdot.width, darkdot.height, excavationImage.boundingBox.x, excavationImage.boundingBox.y, excavationImage.boundingBox.width, excavationImage.boundingBox.height);
                        this.parent.context.fillText("???", excavationImage.boundingBox.x + (excavationImage.boundingBox.width - this.parent.context.measureText("???").width) / 2, excavationImage.boundingBox.y + excavationImage.boundingBox.height / 2);
                    }

                }
                else
                {
                    this.parent.context.fillStyle = "#FFFFFF";
                    this.parent.context.font = "14px Verdana";
                    this.parent.context.fillText("???", excavationImage.boundingBox.x + (excavationImage.boundingBox.width - this.parent.context.measureText("???").width) / 2, excavationImage.boundingBox.y + excavationImage.boundingBox.height / 2);
                }
            }
            excavationProgress.render = function ()
            {
                var percentComplete = excavationPercentComplete(index);
                var remainingTime = excavationTimeRemainingSeconds(index);
                let newStatus = "";

                if(isScientistDead(index))
                {
                    newStatus = "dead";
                    var deathReason = getDeathReason(index);
                    this.parent.context.font = excavationProgress.boundingBox.height + "px Verdana"
                    renderFancyProgressBar(this.parent.context, deathReason, 1, excavationProgress.boundingBox.x, excavationProgress.boundingBox.y, excavationProgress.boundingBox.width, excavationProgress.boundingBox.height, "#F12525", "#12131a", "#FFFFFF");
                }
                else if(isExcavationDone(index))
                {
                    newStatus = "done";
                    renderFancyProgressBar(this.parent.context, _("Success"), 1, excavationProgress.boundingBox.x, excavationProgress.boundingBox.y, excavationProgress.boundingBox.width, excavationProgress.boundingBox.height, "#f6c447", "#12131a", "#FFFFFF");
                }
                else if(!isOnActiveExcavation(index))
                {
                    newStatus = "inactive";
                    renderFancyProgressBar(this.parent.context, "", 0, excavationProgress.boundingBox.x, excavationProgress.boundingBox.y, excavationProgress.boundingBox.width, excavationProgress.boundingBox.height, "#7f7f7f", "#12131a", "#FFFFFF");
                }
                else
                {
                    newStatus = "active";
                    var time = _("Time Remaining: {0}", formattedCountDown(remainingTime))
                    this.parent.context.font = excavationProgress.boundingBox.height + "px Verdana"
                    renderFancyProgressBar(this.parent.context, time, percentComplete, excavationProgress.boundingBox.x, excavationProgress.boundingBox.y, excavationProgress.boundingBox.width, excavationProgress.boundingBox.height, "#7f7f7f", "#12131a", "#FFFFFF");
                }

                if(this.parent.excavationStatuses[index] == undefined)
                {
                    this.parent.excavationStatuses[index] = newStatus;
                }
                else if(newStatus != this.parent.excavationStatuses[index])
                {
                    this.parent.parent.initializeScientistHitboxes();
                }
            }

            this.scientistsPane.addHitbox(excavationTitle);
            this.scientistsPane.addHitbox(excavationImage);
            this.scientistsPane.addHitbox(excavationProgress);


            //Partition 3 - Buttons
            //Buttons values
            var buttonWidth = partition3Width * .8;
            var buttonHeight = scientistContainer.boundingBox.height * .3;
            var buttonX = partition3X + (partition3Width - buttonWidth) / 2;
            var buttonY = (isOnActiveExcavation(index)) ? scientistContainer.boundingBox.y + scientistContainer.boundingBox.height * .15 : scientistContainer.boundingBox.y + (scientistContainer.boundingBox.height - buttonHeight) / 2;

            // Start / Collect / Ressurect button
            var scientistFirstButton = new Hitbox(
                {
                    x: buttonX,
                    y: buttonY,
                    width: buttonWidth,
                    height: buttonHeight
                },
                {
                    onmousedown: () =>
                    {
                        if(isOnActiveExcavation(index))
                        {
                            if(isScientistDead(index))
                            {
                                var costToResurrect = getCostToResurrect(index);
                                var activeScientist = currentScientists.scientists[index];
                                var activeExcavation = currentScientists.excavations[index];
                                var staticScientist = scientists[activeScientist[0]];

                                if(tickets >= costToResurrect)
                                {
                                    var promptTitle;

                                    if(wasScientistSacrificed(index) && activeExcavation[8] == 100)
                                    {
                                        promptTitle = _("Are you sure you want to pay {0} tickets to bring {1} back from his sacrifice?", costToResurrect, staticScientist.name)
                                    }
                                    else
                                    {
                                        promptTitle = _("Are you sure you want to pay {0} tickets to resurrect {1} and recover the reward?", costToResurrect, staticScientist.name)
                                    }

                                    let func = function (index)
                                    {
                                        resurrectScientist(index);
                                        playClickSound();
                                        this.initializeScientistHitboxes();
                                    }.bind(this, index);

                                    showConfirmationPrompt(
                                        promptTitle,
                                        _("Yes"),
                                        func,
                                        _("Cancel"),
                                        null,
                                        null,
                                        false
                                    );

                                }
                                else
                                {
                                    showConfirmationPrompt(
                                        _("You don't have enough tickets"),
                                        _("BUY TICKETS"),
                                        function ()
                                        {
                                            openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                                            hideSimpleInput();
                                        },
                                        _("Cancel"),
                                        null,
                                        null,
                                        false
                                    );
                                }
                            }
                            else if(isExcavationDone(index))
                            {
                                onClickClaimExcavationReward(index);
                                playClickSound();
                                this.initializeScientistHitboxes();
                            }
                        }
                        else
                        {
                            openUi(ExcavationChoiceWindow, null, scientist, index, activeLayers.Arch.scientistsPane.currentScrollY);
                            playClickSound();
                        }
                    },
                    onmouseenter: function ()
                    {
                        if(isScientistDead(index))
                        {
                            showTooltip(_("Resurrect Scientist"), _("Resurrect {0} for {1} tickets", scientists[scientist[0]].name, getCostToResurrect(index)));
                        }
                        if(!isOnActiveExcavation(index) || isExcavationDone(index) || isScientistDead(index))
                        {
                            this.cursor = 'pointer';
                        }
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "default",
                "scientistFirstButton_" + index
            );

            // Bury / Forfeit button
            var scientistSecondButton = new Hitbox(
                {
                    x: buttonX,
                    y: buttonY + scientistContainer.boundingBox.height * .4,
                    width: buttonWidth,
                    height: buttonHeight
                },
                {
                    onmousedown: () =>
                    {
                        if(isOnActiveExcavation(index))
                        {
                            if(isExcavationDone(index) && !isScientistDead(index))
                            {
                                tempConfirmForfeitIndex = index;
                                var activeExcavation = currentScientists.excavations[index];
                                var confirmationText;
                                if(excavationRewards[activeExcavation[0]].isRelic)
                                {
                                    confirmationText = _("Are you sure you want to forfeit your relic and receive {0} relic scrap?", getRelicScrapAmount(excavationRewards[activeExcavation[0]]));
                                }
                                else
                                {
                                    confirmationText = _("Are you sure you want to forfeit your reward?");
                                }

                                let func = function (index)
                                {
                                    confirmForfeitExcavation(index);
                                    hideSimpleInput();
                                    playClickSound();
                                    this.initializeScientistHitboxes();
                                }.bind(this, index);

                                showConfirmationPrompt(
                                    confirmationText,
                                    _("Yes"),
                                    func,
                                    _("Cancel"),
                                    null,
                                    null,
                                    false
                                );
                            }
                            else if(isScientistDead(index))
                            {
                                var activeScientist = currentScientists.scientists[index];
                                var staticScientist = scientists[activeScientist[0]];

                                let func = function (index)
                                {
                                    buryScientist(index);
                                    playClickSound();
                                    this.onClickReloadWindow();
                                }.bind(this, index);

                                showConfirmationPrompt(
                                    _("Are you sure you want to bury {0}?", staticScientist.name),
                                    _("Yes"),
                                    func,
                                    _("Cancel"),
                                    null,
                                    null,
                                    false
                                );

                            }
                        }
                    },
                    onmouseenter: function ()
                    {
                        if(isOnActiveExcavation(index))
                        {
                            if(isExcavationDone(index) && !isScientistDead(index))
                            {
                                showTooltip(_("Forfeit Reward"), _("Forfeit your reward if you cannot claim it or do not want to claim it."));
                            }
                        }
                        if(!isOnActiveExcavation(index) || isExcavationDone(index) || isScientistDead(index))
                        {
                            this.cursor = 'pointer';
                        }
                    },
                    onmouseexit: function ()
                    {
                        hideTooltip();
                    }
                },
                "default",
                "scientistSecondButton_" + index
            );

            //Button Renders
            scientistFirstButton.render = function ()
            {
                if(isScientistDead(index))
                {
                    renderButton(this.parent.context, scientistGreenButton, _("RESURRECT"), scientistFirstButton.boundingBox.x, scientistFirstButton.boundingBox.y, scientistFirstButton.boundingBox.width, scientistFirstButton.boundingBox.height, `bold ${this.boundingBox.height * .3}px Verdana`, "#000000");
                }
                else if(isExcavationDone(index))
                {
                    renderButton(this.parent.context, scientistGreenButton, _("COLLECT"), scientistFirstButton.boundingBox.x, scientistFirstButton.boundingBox.y, scientistFirstButton.boundingBox.width, scientistFirstButton.boundingBox.height, `bold ${this.boundingBox.height * .3}px Verdana`, "#000000");
                }
                else if(!isOnActiveExcavation(index))
                {
                    renderButton(this.parent.context, scientistBlueButton, _("CHOOSE"), scientistFirstButton.boundingBox.x, scientistFirstButton.boundingBox.y, scientistFirstButton.boundingBox.width, scientistFirstButton.boundingBox.height, `bold ${this.boundingBox.height * .3}px Verdana`, "#000000");
                }
            }

            scientistSecondButton.render = function ()
            {
                if(isScientistDead(index))
                {
                    renderButton(this.parent.context, scientistRedButton, _("BURY"), scientistSecondButton.boundingBox.x, scientistSecondButton.boundingBox.y, scientistSecondButton.boundingBox.width, scientistSecondButton.boundingBox.height, `bold ${this.boundingBox.height * .3}px Verdana`, "#000000");
                }
                else if(isExcavationDone(index))
                {
                    renderButton(this.parent.context, scientistRedButton, _("FORFEIT"), scientistSecondButton.boundingBox.x, scientistSecondButton.boundingBox.y, scientistSecondButton.boundingBox.width, scientistSecondButton.boundingBox.height, `bold ${this.boundingBox.height * .3}px Verdana`, "#000000");
                }
            }

            this.scientistsPane.addHitbox(scientistFirstButton);
            this.scientistsPane.addHitbox(scientistSecondButton);
        });

        this.scientistsPane.contentHeight = currentScientists.scientists.length * (height + yOffset);
    }

    sortCompletedExcavations()
    {
        var completedIndexes = [];
        var inactiveIndexes = [];
        var activeIndexes = [];

        for(var i = 0; i < currentScientists.scientists.length; i++)
        {
            if(isExcavationDone(i) || isScientistDead(i))
            {
                completedIndexes.push(i);
            }
            else if(!isOnActiveExcavation(i))
            {
                inactiveIndexes.push(i);
            } else
            {
                activeIndexes.push(i);
            }
        }

        activeIndexes.sort((a, b) => excavationPercentComplete(a) > excavationPercentComplete(b) ? -1 : 1);

        return completedIndexes.concat(inactiveIndexes).concat(activeIndexes);
    }

    onClickReloadWindow()
    {
        var scrollValue = activeLayers.Arch.scientistsPane.currentScrollY;
        openUi(ScientistsWindow);
        activeLayers.Arch.scientistsPane.scrollTo(scrollValue);
    }

    initializeRelicsHitboxes()
    {
        this.scientistsPane.clearHitboxes();

        var cellWidth = .12;
        var cellHeight = .18;
        var cellsPerRow = 5;
        var xOffset = .15 * this.boundingBox.width;
        var yOffset = .16 * this.boundingBox.height;
        for(var i = 0; i < Math.min(absoluteMaxRelicSlots, maxRelicSlots + 1); i++)
        {
            var row = (i % cellsPerRow);
            var column = Math.floor(i / cellsPerRow);

            var x = (cellWidth * this.boundingBox.width * row) + xOffset;
            var y = (cellHeight * this.boundingBox.height * column) + yOffset;

            this.context.strokeRect(x, y, this.boundingBox.width * cellWidth, this.boundingBox.height * cellHeight);

            var relicGridCell = new RelicGridCell(
                {
                    x: x,
                    y: y,
                    width: this.boundingBox.width * cellWidth,
                    height: this.boundingBox.height * cellHeight
                },
                row,
                column,
                i
            )

            if(equippedRelics[i] != -1)
            {
                var relicComponent = new RelicComponentUI(
                    {
                        x: 0,
                        y: 0,
                        width: this.boundingBox.width * cellWidth,
                        height: this.boundingBox.height * cellHeight
                    },
                    i
                )
                relicComponent.isOnGrid = true;
                relicGridCell.addHitbox(relicComponent);
            }
            this.relicsPane.addHitbox(relicGridCell);
        }

        var relicTrashHitbox = new Hitbox(
            {
                x: this.boundingBox.width * .8,
                y: this.boundingBox.height * .45,
                width: this.boundingBox.width * .1,
                height: this.boundingBox.height * .12
            },
            {
                onmouseenter: function ()
                {
                    this.cursor = 'pointer';
                    if(relicEditMode == 0)
                    {
                        showTooltip(_("Scrap"), _("Currently not set to scrap, click this to toggle relic scrapping mode."));
                    }
                    else
                    {
                        showTooltip(_("Scrap"), _("Currently set to scrap, click this to turn off relic scrapping mode."));
                    }
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                },
                onmousedown: function ()
                {
                    if(relicEditMode == 1)
                    {
                        relicEditMode = 0;
                    }
                    else
                    {
                        relicEditMode = 1;
                    }
                    playClickSound();
                }
            },
            "default",
            "relicTrashHitbox"
        );
        this.relicsPane.addHitbox(relicTrashHitbox);

        var relicScrapHitbox = new Hitbox(
            {
                x: this.boundingBox.width * .8,
                y: this.boundingBox.height * .20,
                width: this.boundingBox.width * .10,
                height: this.boundingBox.height * .12
            },
            {
                onmouseenter: function ()
                {
                    this.cursor = 'pointer'
                    showUpdatingTooltip(
                        function ()
                        {
                            return {
                                "header": _("Relic Scrap"),
                                "body": _("<center>Scrap relics to gain relic scraps.</center>") + "<br>" + _("<center>Relic scrap can occasionally be traded with traders</center>")
                            }
                        }, mouseX, mouseY
                    );
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            "default",
            "relicScrapHitbox"
        );
        this.relicsPane.addHitbox(relicScrapHitbox);
    }


    getRarityColor(rarity)
    {
        if(rarity == scientistRarities.common) return "#38b53a";
        else if(rarity == scientistRarities.uncommon) return "#008dd9";
        else if(rarity == scientistRarities.rare) return "#9c2828";
        else if(rarity == scientistRarities.legendary) return "#ebab34";
        else if(rarity == scientistRarities.warped) return (quality == 1) ? "#000000" : "#ffffff";
        else if(rarity == scientistRarities.warpedPlus) return (quality == 1) ? "#000000" : "#ffffff";
        else if(rarity == scientistRarities.warpedPlusPlus) return (quality == 1) ? "#000000" : "#ffffff";
    }

    getRarityFrame(rarity)
    {
        if(rarity == scientistRarities.common) return scientistFrameCommon;
        else if(rarity == scientistRarities.uncommon) return scientistFrameUncommon;
        else if(rarity == scientistRarities.rare) return scientistFrameRare;
        else if(rarity == scientistRarities.legendary) return scientistFrameLegendary;
        else if(rarity == scientistRarities.warped) return scientistFrameWarped;
        else if(rarity == scientistRarities.warpedPlus) return scientistFrameWarpedPlus;
        else if(rarity == scientistRarities.warpedPlusPlus) return scientistFrameWarpedPlus;
    }

    getAnimatedRarityFrame(rarity)
    {
        if(rarity == scientistRarities.common) return null;
        else if(rarity == scientistRarities.uncommon) return null;
        else if(rarity == scientistRarities.rare) return scientistFrameRareSheet;
        else if(rarity == scientistRarities.legendary) return scientistFrameLegendarySheet;
        else if(rarity == scientistRarities.warped) return scientistFrameWarpedSheet;
        else if(rarity == scientistRarities.warpedPlus) return scientistFrameWarpedPlusSheet;
        else if(rarity == scientistRarities.warpedPlusPlus) return scientistFrameWarpedPlusSheet;
    }

    getDifficultyColor(difficulty)
    {
        if(difficulty == _("Easy")) return "#46eb49";
        else if(difficulty == _("Medium")) return "#ecf759";
        else if(difficulty == _("Hard")) return "#fc8608";
        else if(difficulty == _("Nightmare")) return "#d1000a";
    }

    render()
    {
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render(); // Render any child layers

        //Scientists tab
        if(this.currentTabIndex < 1)
        {

            this.context.save();
            this.context.drawImage(excavationsHeader, this.bodyContainer.boundingBox.x, this.bodyContainer.boundingBox.y, this.bodyContainer.boundingBox.width, this.bodyContainer.boundingBox.height * 0.1);
            this.context.fillStyle = "#FFFFFF"
            this.context.font = `bold ${this.boundingBox.height * .05}px Verdana`;
            fillTextShrinkToFit(this.context,
                _("Scientists: {0}/{1}", currentScientists.scientists.length, scientistSlots),
                this.bodyContainer.boundingBox.x + (this.boundingBox.width * .125),
                this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * 0.06,
                this.bodyContainer.boundingBox.width * .75,
                "center"
            );
            this.context.restore();

            if(currentScientists.scientists.length == 0)
            {
                this.context.fillStyle = "#FFFFFF"
                var titleText = _("You do not have any scientists, you need to unlock more.");
                fillTextShrinkToFit(this.context, titleText, this.boundingBox.width * .2, this.boundingBox.height * .25, this.boundingBox.width * .6, "center");
                if(language == "english")
                {
                    var howToGetText = _("Find more scientists from chests.");
                    fillTextShrinkToFit(this.context, howToGetText, this.boundingBox.width * .2, this.boundingBox.height * .30, this.boundingBox.width * .6, "center");
                }
            }
            else
            {
                this.scientistsPane.renderChildren();
            }

        }
        else
        {
            //Draw relic scrap
            drawImageFitInBox(
                this.context,
                relicScrap.largeIcon,
                this.boundingBox.width * .8,
                this.boundingBox.height * .20,
                this.boundingBox.width * .10,
                this.boundingBox.height * .12,
                "center"
            );

            this.context.save()
            this.context.fillStyle = "#FFFFFF";
            this.context.strokeStyle = "#000000"
            this.context.lineWidth = 2;
            this.context.font = `${this.boundingBox.height * .04}px Verdana`;
            strokeTextShrinkToFit(this.context, numRelicScrapsOwned(), this.boundingBox.width * .8, this.boundingBox.height * .20 + relicScrap.largeIcon.height * .8, this.boundingBox.width * .10, "center", 0, false, true);
            fillTextShrinkToFit(this.context, numRelicScrapsOwned(), this.boundingBox.width * .8, this.boundingBox.height * .20 + relicScrap.largeIcon.height * .8, this.boundingBox.width * .10, "center", 0, false, true);
            this.context.restore();

            //Draw trash can
            if(relicEditMode == 0)
            {
                this.context.drawImage(trashb, 0, 0, 20, 20, this.boundingBox.width * .8, this.boundingBox.height * .45, this.boundingBox.width * .1, this.boundingBox.height * .12);
            }
            else
            {
                this.context.drawImage(trashb2, 0, 0, 20, 20, this.boundingBox.width * .8, this.boundingBox.height * .45, this.boundingBox.width * .1, this.boundingBox.height * .12);
            }
        }
    }
}

class RelicGridCell extends DragDropUIComponent
{
    row;
    column;

    constructor(boundingBox, row, column, index)
    {
        super(boundingBox); // Need to call base class constructor

        this.displayType = 4;
        this.isDropRegion = true;
        this.dropTypesAccepted = [1];
        this.row = row;
        this.column = column;
        this.index = index;
        this.id = "RelicGridSlot_" + row + "_" + column;
    }

    render()
    {
        var rootContext = this.getRootLayer().context;

        if(this.isDropCandidate)
        {
            rootContext.save();
        }

        rootContext.fillStyle = "rgba(255, 255, 255, 0.3)";
        rootContext.strokeStyle = 'rgb(0, 0, 0)';

        var localCoordinates = this.parent.getRelativeCoordinates(this.boundingBox.x, this.boundingBox.y, this.getRootLayer());
        rootContext.strokeRect(localCoordinates.x, localCoordinates.y, this.boundingBox.width, this.boundingBox.height);
        rootContext.fillRect(localCoordinates.x, localCoordinates.y, this.boundingBox.width, this.boundingBox.height);


        if(this.index + 1 > maxRelicSlots)
        {
            rootContext.fillStyle = "#2b2b2b";
            rootContext.fillRect(localCoordinates.x + (this.boundingBox.width / 2) - (this.boundingBox.width * .05), localCoordinates.y + (this.boundingBox.height * .15), this.boundingBox.width * 0.1, this.boundingBox.height * .7);
            rootContext.fillRect(localCoordinates.x + (this.boundingBox.width * .15), localCoordinates.y + (this.boundingBox.height / 2) - (this.boundingBox.height * .05), this.boundingBox.width * 0.7, this.boundingBox.height * .1);
        }

        rootContext.globalAlpha = 1;
        super.render();

        if(this.isDropCandidate)
        {
            rootContext.restore();
        }
    }

    onAcceptDrop()
    {

        if(this.index + 1 > maxRelicSlots)
        {
            activeDraggingInstance.onDropFailed();
            return;
        }

        super.onAcceptDrop();
        let draggedHitbox = activeDraggingInstance;
        let draggedRelic = equippedRelics[draggedHitbox.index];
        let currentHitbox = this.hitboxes[0];
        let currentRelic = equippedRelics[this.index];

        activeDraggingInstance.parentBeforeDrag.clearHitboxes();

        if(currentHitbox)
        {
            activeDraggingInstance.parentBeforeDrag.addHitbox(currentHitbox);
        }

        this.clearHitboxes();
        this.addHitbox(draggedHitbox);

        equippedRelics[this.index] = draggedRelic;
        equippedRelics[draggedHitbox.index] = currentRelic;

        //should rewrite this so the cells don't flicker on rerender
        activeLayers.Arch.relicsPane.clearHitboxes();
        activeLayers.Arch.initializeRelicsHitboxes();

        activeDraggingInstance.boundingBox.x = 1;
        activeDraggingInstance.boundingBox.y = 1;
    }

    onmousedown()
    {
        if(this.index + 1 > maxRelicSlots)
        {
            if(tickets >= getRelicSlotCost())
            {
                showConfirmationPrompt(
                    _("Do you want to purchase another relic slot for {0} tickets?", getRelicSlotCost()),
                    _("Yes"),
                    () =>
                    {
                        if(tickets < getRelicSlotCost()) return;
                        subtractTickets(getRelicSlotCost(), ShopCategories.INGAME_PURCHASE, IngamePurchaseSubcategories.RELIC_SLOT_PURCHASE);
                        expandRelicInventory();
                        activeLayers.Arch.relicsPane.clearHitboxes();
                        activeLayers.Arch.initializeRelicsHitboxes();
                    },
                    _("No"),
                    null,
                    null,
                    false
                )
            }
            else
            {
                showConfirmationPrompt(
                    _("Next relic slot cost {0} tickets. You don't have enough tickets.", getRelicSlotCost()),
                    _("BUY TICKETS"),
                    function ()
                    {
                        openUi(PurchaseWindow, null, 0, purchaseWindowTabOrder);
                        hideSimpleInput();
                    },
                    _("Cancel"),
                    null,
                    null,
                    false
                )
            }

        }
    }

    onChildRemoved()
    {
        super.onChildRemoved();

        //should rewrite this so the cells don't flicker on rerender
        activeLayers.Arch.relicsPane.clearHitboxes();
        activeLayers.Arch.initializeRelicsHitboxes();
    }
}

class RelicComponentUI extends DragDropUIComponent
{
    index;
    isMouseOver = false;
    isOnGrid;
    baseCost = 30;

    constructor(boundingBox, index)
    {
        super(boundingBox); // Need to call base class constructor

        this.displayType = 1;
        this.isDraggable = true;
        this.index = index;
    }

    render()
    {
        var rootContext = this.getRootLayer().context;

        if(this.isDropCandidate)
        {
            rootContext.save();
            rootContext.shadowBlur = 11;
        }

        this.renderComponent();
        super.render();

        if(this.isDropCandidate)
        {
            rootContext.restore();
        }
    }

    onmouseenter(e)
    {
        super.onmouseenter(e);
        this.cursor = 'pointer';
        showTooltipForRelic(this.index);
        this.isMouseOver = true;
    }

    onmouseexit(e)
    {
        super.onmouseexit(e);
        hideTooltip();
        this.isMouseOver = false;
    }

    onmousedown(e)
    {
        if(relicEditMode != 1)
        {
            super.onmousedown(e);
        }
        else
        {
            var amount = getRelicScrapAmount(excavationRewards[equippedRelics[this.index]]);
            showConfirmationPrompt(
                _("Are you sure you want to scrap this relic for {0} relic scrap?", amount),
                _("Yes"),
                () =>
                {

                    addRelicScrap(amount);
                    newNews(_("You gained {0} x Relic Scrap", amount), true);
                    if(!hasScrappedFirstRelic)
                    {
                        hasScrappedFirstRelic = true;
                    }
                    deleteEquippedRelic(this.index);
                    hideSimpleInput();
                    activeLayers.Arch.relicsPane.clearHitboxes();
                    activeLayers.Arch.initializeRelicsHitboxes();

                },
                _("No"),
                null,
                null,
                false
            );
            relicEditMode = 0;
        }
    }

    renderComponent()
    {
        var rootContext = this.getRootLayer().context;
        var localCoordinates = this.parent.getRelativeCoordinates(this.boundingBox.x, this.boundingBox.y, this.getRootLayer());
        excavationRewards[equippedRelics[this.index]].renderFunction(rootContext, equippedRelics[this.index], localCoordinates.x, localCoordinates.y, this.boundingBox.width, this.boundingBox.height);
    }
}