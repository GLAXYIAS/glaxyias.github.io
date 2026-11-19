class SettingsWindow extends TabbedPopupWindow
{
    layerName = "Settings"; // Used as key in activeLayers
    domElementId = "SETTINGSD"; // ID of dom element that gets shown or hidden
    context = SETTINGS;         // Canvas rendering context for popup

    debugLogBox;
    eventLogBox;
    statsPanelBox;
    settingsPane;
    helpPane;

    constructor(boundingBox, startTab = 0)
    {
        super(boundingBox); // Need to call base class constructor
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        var settingsCategories = {
            0: _("Settings"),
            1: _("Event Log"),
            2: _("Help"),
            3: _("Stats")
        }

        this.initializeTabs(Object.values(settingsCategories));

        this.settingsPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "settingsPane"
        );
        this.settingsPane.allowBubbling = true;
        this.addHitbox(this.settingsPane);

        this.helpPane = new Hitbox(
            {
                x: 0,
                y: 0,
                width: this.boundingBox.width,
                height: this.boundingBox.height
            },
            {},
            "",
            "helpPane"
        );
        this.helpPane.allowBubbling = true;
        this.addHitbox(this.helpPane);

        // Discord button
        this.helpPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .70,
                y: this.boundingBox.height * .23,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    openDiscord();
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Discord"), _("Join our Discord community for help and discussions"));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "discordButton"
        ));

        // Email Support button
        this.helpPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .70,
                y: this.boundingBox.height * .29,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    openExternalLinkInDefaultBrowser("mailto:support@playsaurus.com");
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Email Support"), _("Send an email to our support team at support@playsaurus.com"));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "emailSupportButton"
        ));

        // Bug Report button
        this.helpPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .70,
                y: this.boundingBox.height * .35,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    var atomicId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getUserAtomicId() : "N/A";
                    var sessionId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getSessionId() : "SESSION_UNAVAILABLE";
                    var gameVersion = "v" + ((version - 100) / 100) + "." + buildLetter + "." + splitTestValue1;
                    var platform = platformName() || "Unknown";

                    var pollUrl = "https://app.polling.com/forms/08e2fc1e-a9ce-4062-b5dd-8603b6bf492e/share?customerId=" +
                        encodeURIComponent(atomicId + "_" + sessionId + "_" + gameVersion + "_" + platform);

                    openExternalLinkInDefaultBrowser(pollUrl);
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Report Bug"), _("Report a bug through our survey form"));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "bugReportButton"
        ));

        // Wiki button
        this.helpPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .70,
                y: this.boundingBox.height * .41,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    openExternalLinkInDefaultBrowser("https://mrmine.fandom.com/wiki/Mr._Mine_Wiki");
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Wiki"), _("Visit the Mr. Mine wiki for guides and information"));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "wikiButton"
        ));

        // Copy Info button
        this.helpPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .05,
                y: this.boundingBox.height * .40,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    var atomicId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getUserAtomicId() : "N/A";
                    var gameVersion = "v" + ((version - 100) / 100) + "." + buildLetter + "." + splitTestValue1;
                    var platform = platformName() || "Unknown";
                    var sessionId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getSessionId() : "SESSION_UNAVAILABLE";

                    var infoText = _("Atomic ID") + ": " + atomicId + "\n" +
                        _("Session ID") + ": " + sessionId + "\n" +
                        _("Game Version") + ": " + gameVersion + "\n" +
                        _("Platform") + ": " + platform;

                    if(navigator.clipboard && navigator.clipboard.writeText)
                    {
                        navigator.clipboard.writeText(infoText).then(function ()
                        {
                            newNews(_("User info copied to clipboard!"));
                        }).catch(function ()
                        {
                            newNews(_("Failed to copy to clipboard"));
                        });
                    } else
                    {
                        // Fallback for older browsers
                        newNews(_("Clipboard not supported"));
                    }
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Copy Info"), _("Copy user information to clipboard"));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "copyInfoButton"
        ));

        this.debugLogBox = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            this.bodyContainer.boundingBox.height * 0.44, // Increased height for debug log
            this.context,
            this.bodyContainer.boundingBox.x,
            this.bodyContainer.boundingBox.y + this.bodyContainer.boundingBox.height * 0.56, // Start closer to title
            this.bodyContainer.boundingBox.width,
            this.bodyContainer.boundingBox.height * 0.44 - 5, // Adjusted height
            15
        );
        this.addHitbox(this.debugLogBox);
        this.debugLogBox.setVisible(false)
        this.debugLogBox.setEnabled(false)

        this.eventLogBox = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            this.bodyContainer.boundingBox.height,
            this.context,
            this.bodyContainer.boundingBox.x,
            this.bodyContainer.boundingBox.y,
            this.bodyContainer.boundingBox.width,
            this.bodyContainer.boundingBox.height - 5,
            15
        );
        this.addHitbox(this.eventLogBox);
        this.eventLogBox.setVisible(false)
        this.eventLogBox.setEnabled(false)

        this.statsPanelBox = new Scrollbox(
            this.bodyContainer.boundingBox.width - 15,
            this.bodyContainer.boundingBox.height,
            this.context,
            this.bodyContainer.boundingBox.x,
            this.bodyContainer.boundingBox.y,
            this.bodyContainer.boundingBox.width,
            this.bodyContainer.boundingBox.height - 5,
            15
        );
        this.addHitbox(this.statsPanelBox);
        this.statsPanelBox.setVisible(false)
        this.statsPanelBox.setEnabled(false)

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .07,     // Copied from renderButton call below
                y: this.boundingBox.height * .185,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    savegame();
                    if(typeof cloudSaveManager !== 'undefined' && cloudSaveManager.isEnabled)
                    {
                        cloudSaveManager.queueUpload(sids[chosen]);
                    }
                    backupSavesToCloud();
                    newNews(_("Game saved!"));
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Save Game"), _("The game automatically saves every 30 seconds. You can also use ctrl+s."), this.boundingBox.x * 5, this.boundingBox.y * 2)
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "saveButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .07,     // Copied from renderButton call below
                y: this.boundingBox.height * .24,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    showExportPopup();
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Export"), _("Provides a game export code you can use to backup your save or use on another PC."), this.boundingBox.x * 5, this.boundingBox.y * 2)
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "exportButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .07,
                y: this.boundingBox.height * .295,
                width: this.boundingBox.width * .20,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    openExternalLinkInDefaultBrowser("https://playsaurus.com/privacy-policy");
                    playClickSound();
                }
            },
            'pointer',
            "privacyButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .30,     // Copied from renderButton call below
                y: this.boundingBox.height * .185,
                width: this.boundingBox.width * .30,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    openExternalLinkInDefaultBrowser("https://play.google.com/store/apps/details?id=com.playsaurus.mrmine&hl=en_US&gl=US");
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Play on Mobile"), _("Visit Mr.Mine on Android. iOS is also available now!"))
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "saveButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .65,
                y: this.boundingBox.height * .185,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    platform.toggleFullscreen()
                    playClickSound();
                }
            },
            'pointer',
            "fullscreenCheckbox"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .30,     // Copied from renderButton call below
                y: this.boundingBox.height * .245,
                width: this.boundingBox.width * .30,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    //save refresh
                    savegame();
                    if(typeof cloudSaveManager !== 'undefined' && cloudSaveManager.isEnabled)
                    {
                        cloudSaveManager.queueUpload(sids[chosen]);
                    }
                    location.reload();
                    playClickSound();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Log out of game"), _("Save and exit game to main menu."));
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "saveButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .30,     // Copied from renderButton call below
                y: this.boundingBox.height * .295,
                width: this.boundingBox.width * .30,
                height: this.boundingBox.height * .05
            },
            {
                onmousedown: function ()
                {
                    hideTooltip();
                    showLanguageSelection();
                },
                onmouseenter: function ()
                {
                    showTooltip(_("Language") + " (Language)", _("Change language.") + "<br> (Change language)");
                },
                onmouseexit: function ()
                {
                    hideTooltip();
                }
            },
            'pointer',
            "saveButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .41,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    if(mute == 0) {mute = 1; music.volume = 0;} else {mute = 0; music.volume = 0.08;}
                    localStorage["mute"] = mute;
                    playClickSound();
                }
            },
            'pointer',
            "musicButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .46,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    if(mutebuttons == 0) {mutebuttons = 1;} else {mutebuttons = 0;}
                    localStorage["mutebuttons"] = mutebuttons;
                    playClickSound();
                }
            },
            'pointer',
            "clickSoundButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .51,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    if(muteisotopes == 0) {muteisotopes = 1;} else {muteisotopes = 0;}
                    localStorage["muteisotopes"] = muteisotopes;
                    playClickSound();
                }
            },
            'pointer',
            "isotopeSoundButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .56,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    if(mutecapacity == 0) {mutecapacity = 1;} else {mutecapacity = 0;}
                    localStorage["mutecapacity"] = mutecapacity;
                    playClickSound();
                }
            },
            'pointer',
            "capicitySoundButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .68,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    if(quality == 1) {quality = 0;} else {quality = 1;}
                    playClickSound();
                }
            },
            'pointer',
            "showMineralsButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .725,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    areQuotesEnabled = !areQuotesEnabled;
                    playClickSound();
                }
            },
            'pointer',
            "showQuotesButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .77,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    showDrillHighlights = !showDrillHighlights;
                    playClickSound();
                }
            },
            'pointer',
            "showDrillHighlightsButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .815,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    showSuperMinerHitboxes = !showSuperMinerHitboxes;
                    playClickSound();
                }
            },
            'pointer',
            "showSuperMinerHitboxesButton"
        ));

        this.settingsPane.addHitbox(new Hitbox(
            {
                x: this.boundingBox.width * .075,
                y: this.boundingBox.height * .86,
                width: this.boundingBox.width * .03,
                height: this.boundingBox.height * .045
            },
            {
                onmousedown: function ()
                {
                    showTradeWarnings = !showTradeWarnings;
                    playClickSound();
                }
            },
            'pointer',
            "showTradeWarningsButton"
        ));
        if(platform.saveAndQuit)
        {
            this.settingsPane.addHitbox(new Button(
                sellb, _("Save and Quit"), "14px Verdana", "#000000",
                {
                    x: this.boundingBox.width * .65,
                    y: this.boundingBox.height * .295,
                    width: this.boundingBox.width * .20,
                    height: this.boundingBox.height * .05
                },
                {
                    onmousedown: function ()
                    {
                        platform.saveAndQuit();
                    }
                },
                'pointer',
                "quitButton"
            ));
        }

        if(startTab > 0)
        {
            this.currentTabIndex = startTab;
        }
        this.onTabChange();
    }

    onTabChange()
    {
        this.settingsPane.setVisible(this.currentTabIndex == 0);
        this.settingsPane.setEnabled(this.currentTabIndex == 0);
        this.eventLogBox.setVisible(this.currentTabIndex == 1);
        this.eventLogBox.setEnabled(this.currentTabIndex == 1);
        this.helpPane.setVisible(this.currentTabIndex == 2);
        this.helpPane.setEnabled(this.currentTabIndex == 2);
        this.debugLogBox.setVisible(this.currentTabIndex == 2);
        this.debugLogBox.setEnabled(this.currentTabIndex == 2);
        this.statsPanelBox.setVisible(this.currentTabIndex == 3);
        this.statsPanelBox.setEnabled(this.currentTabIndex == 3);

        // Log event when help tab is visited
        if(this.currentTabIndex == 2)
        {
            if(typeof (playsaurusSdk.logEvent) === "function")
            {
                playsaurusSdk.logEvent(
                    "help_opened",
                    {
                        atomicId: (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getUserAtomicId() : "N/A",
                        sessionId: (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getSessionId() : "SESSION_UNAVAILABLE",
                        gameVersion: "v" + ((version - 100) / 100) + "." + buildLetter + "." + splitTestValue1,
                        platform: platformName()
                    });
            }
        }
    }

    render()
    {
        this.context.save();
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        super.render(); // Render any child layers
        //Settings
        this.context.fillStyle = "#FFFFFF";

        if(this.currentTabIndex == 0)
        {
            //--- General ---
            this.context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .04, this.boundingBox.height * .13, this.context.measureText(_("GENERAL")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
            this.context.fillText(_("GENERAL"), this.boundingBox.width * .05, this.boundingBox.height * .17);
            renderButton(SETTINGS, sellb, _("Save Game"), this.boundingBox.width * .07, this.boundingBox.height * .18, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
            renderButton(SETTINGS, sellb, _("Export Game"), this.boundingBox.width * .07, this.boundingBox.height * .24, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
            renderButton(SETTINGS, sellb, _("Privacy Policy"), this.boundingBox.width * .07, this.boundingBox.height * .295, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
            renderButton(SETTINGS, sellb, _("Play on Mobile"), this.boundingBox.width * .30, this.boundingBox.height * .18, this.boundingBox.width * .30, this.boundingBox.height * .05, "14px Verdana", "#000000");
            renderButton(SETTINGS, sellb, _("Exit To Main Menu"), this.boundingBox.width * .30, this.boundingBox.height * .24, this.boundingBox.width * .30, this.boundingBox.height * .05, "14px Verdana", "#000000");
            renderButton(SETTINGS, sellb, _("Language") + " (Language)", this.boundingBox.width * .30, this.boundingBox.height * .295, this.boundingBox.width * .30, this.boundingBox.height * .05, "14px Verdana", "#000000");
            if(platform.isFullscreenable())
            {
                renderCheckboxWithText(SETTINGS, _("Fullscreen"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .65, this.boundingBox.height * .185, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (platform.isFullscreen()));
            }
            //Later: save export to a file
            //--- Audio ---
            this.context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .04, this.boundingBox.height * .35, this.context.measureText(_("AUDIO")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
            this.context.fillText(_("AUDIO"), this.boundingBox.width * .05, this.boundingBox.height * .39);
            renderCheckboxWithText(SETTINGS, _("Music On"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .41, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (mute == 0));
            renderCheckboxWithText(SETTINGS, _("Click Sounds On"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .46, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (mutebuttons == 0));
            renderCheckboxWithText(SETTINGS, _("Isotope Sounds On"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .51, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (muteisotopes == 0));
            renderCheckboxWithText(SETTINGS, _("Capacity Full Sound On"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .56, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (mutecapacity == 0));
            //--- Effects ---
            this.context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .04, this.boundingBox.height * .62, this.context.measureText(_("EFFECTS")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
            this.context.fillText(_("EFFECTS"), this.boundingBox.width * .05, this.boundingBox.height * .66);
            renderCheckboxWithText(SETTINGS, _("Show Minerals Above Miners (And other effects)"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .68, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", (quality == 1));
            renderCheckboxWithText(SETTINGS, _("Show Miner Quotes"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .725, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", areQuotesEnabled);
            renderCheckboxWithText(SETTINGS, _("Show Drill Highlights"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .77, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", showDrillHighlights);
            renderCheckboxWithText(SETTINGS, _("Show Super Miner Hitboxes"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .815, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", showSuperMinerHitboxes);
            renderCheckboxWithText(SETTINGS, _("Show trade warnings"), "14px Verdana", "#FFFFFF", this.boundingBox.width * .075, this.boundingBox.height * .86, this.boundingBox.width * .03, this.boundingBox.height * .045, "#FFFFFF", "#000000", showTradeWarnings);
            //renderCheckboxWithText(SETTINGS, "Show Confirmation Popups For Relic And Drill Deletion", "14px Verdana", "#FFFFFF", this.boundingBox.width*.075, this.boundingBox.height*.61, this.boundingBox.width*.03, this.boundingBox.height*.045, "#FFFFFF", "#000000", true);
            //Show confirmation popups for relic and drill equip deletion
            //--- Key Bindings ---
            //this.context.fillText("KEY BINDINGS", this.boundingBox.width*.05, this.boundingBox.height*.70);
            //Coming soon
        }
        else if(this.currentTabIndex == 1)
        {
            this.renderLog(this.eventLogBox, eventlog);
        }
        else if(this.currentTabIndex == 2)
        {
            this.renderHelpPanel();
        }
        else if(this.currentTabIndex == 3)
        {
            //stats
            this.renderStatsPanel();
        }
        this.context.restore();
    }


    renderLog(logScrollbox, logSourceArray)
    {
        logScrollbox.context.save();
        logScrollbox.context.clearRect(0, 0, logScrollbox.contentWidth, logScrollbox.contentHeight);
        var fontSize = 16;
        var prevLineY = 0;
        logScrollbox.context.font = fontSize + "px Verdana";
        logScrollbox.context.textBaseline = "top";
        logScrollbox.context.fillStyle = "white";
        var text;
        for(var line = logSourceArray.length - 1; line >= 0; --line)
        {
            if(typeof (logSourceArray[line]) == "object")
            {
                text = logSourceArray[line][0] + _("({0} Ago)", formattedCountDown((currentTime() - logSourceArray[line][1]) / 1000));
            }
            else
            {
                text = logSourceArray[line];
            }
            var lineBoundingBox = fillTextWrap(
                logScrollbox.context,
                text,
                5,
                prevLineY + fontSize / 2,
                logScrollbox.contentWidth - 10
            );
            logScrollbox.context.save();
            if(line % 2 == 1)
            {
                logScrollbox.context.fillStyle = "#333333";
            }
            else
            {
                logScrollbox.context.fillStyle = "#666666";
            }
            logScrollbox.context.globalAlpha = 0.3;
            logScrollbox.context.globalCompositeOperation = "destination-over";
            logScrollbox.context.fillRect(lineBoundingBox.x1, lineBoundingBox.y1 - fontSize / 4, logScrollbox.contentWidth, lineBoundingBox.height + fontSize / 2);
            logScrollbox.context.restore();
            prevLineY = lineBoundingBox.y2;
        }
        if(logScrollbox.contentHeight < prevLineY)
        {
            logScrollbox.contentHeight = prevLineY;
            logScrollbox.initializeScrollbar();
        }
        logScrollbox.context.restore();
    }

    renderStatsPanel()
    {
        var numberOfStatLines = 33;

        this.statsPanelBox.initializeScrollbar();
        var context = this.statsPanelBox.context;
        context.save();
        context.imageSmoothingEnabled = false;
        this.statsPanelBox.clearCanvas();
        this.statsPanelBox.contentHeight = this.statsPanelBox.boundingBox.height * .08 + (this.statsPanelBox.boundingBox.height * .09 * numberOfStatLines);

        context.drawImage(drillState.drill().worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, buydw * .62, buydh * .05, buydw * .25, buydh * .4);
        context.drawImage(drillState.engine().worldAsset, 168 * getAnimationFrameIndex(4, 10), 0, 168, 158, buydw * .62, buydh * .05, buydw * .25, buydh * .4);

        if(drillState.equippedDrillEquips[0] > -1) {context.drawImage(drillState.engine().icon, 0, 0, 50, 50, buydw * .57, buydh * .5, buydw * .07, buydh * .1);}
        if(drillState.equippedDrillEquips[1] > -1) {context.drawImage(drillState.drill().icon, 0, 0, 50, 50, buydw * .65, buydh * .5, buydw * .07, buydh * .1);}
        if(drillState.equippedDrillEquips[2] > -1) {context.drawImage(drillState.fan().icon, 0, 0, 50, 50, buydw * .73, buydh * .5, buydw * .07, buydh * .1);}
        if(drillState.equippedDrillEquips[3] > -1) {context.drawImage(drillState.cargo().icon, 0, 0, 50, 50, buydw * .81, buydh * .5, buydw * .07, buydh * .1);}

        context.fillStyle = "#FFFFFF";
        context.font = "14px Verdana";
        context.fillText(_("Time Played") + ": " + shortenedFormattedTime(playtime), buydw * .03, buydh * .05);
        context.fillText(_("Drill Power") + ": " + beautifynum(drillWattage()) + " W", buydw * .03, buydh * .11);
        var timeUntilNext = estimatedTimeUntilNextDepth();
        context.fillText(_("Time Until {0}km Depth", (depth + 1)) + ": ", buydw * .03, buydh * .17);
        context.drawImage(oneDicons, 220, 0, 20, 20, buydw * .01 + BY.measureText(_("Time Until {0}km Depth", (depth + 1)) + ": ").width - buydw * .005, buydh * .17 - Math.round(buydw * .0225), Math.round(buydw * .025), Math.round(buydw * .025));
        context.fillText(formattedCountDown((parseInt(timeUntilNext) + 1)), buydw * .01 + BY.measureText(_("Time Until {0}km Depth", (depth + 1)) + ": ").width + buydw * .02, buydh * .17);

        //graph
        if(mineralAndMoneyLog.length > 0)
        {
            var largestValue = bigNumberMax.apply(null, totalValueLog);
            for(var i = 60; i > 0; i--)
            {
                var totalValuePlotPoint = 0n;
                var mineralValuePlotPoint = 0n;
                if(mineralAndMoneyLog.length > i)
                {
                    totalValuePlotPoint = totalValueLog[i];
                    mineralValuePlotPoint = mineralAndMoneyLog[i][0];
                }
                var plotPointWidth = Math.ceil(buydw * .0077);
                var totalValueHeight = buydh * .44 * divideBigNumberToDecimalNumber(totalValuePlotPoint, largestValue);
                var mineralValueHeight = buydh * .44 * divideBigNumberToDecimalNumber(mineralValuePlotPoint, largestValue);
                context.fillStyle = "#004400";
                context.fillRect(Math.floor(plotPointWidth * (i + 1)), buydh * .62 - totalValueHeight, plotPointWidth, totalValueHeight);
                context.fillStyle = "#440000";
                context.fillRect(Math.floor(plotPointWidth * (i + 1)), buydh * .62 - mineralValueHeight, plotPointWidth, mineralValueHeight);
            }

            context.fillStyle = "#004400";
            context.fillRect(buydw * .11, buydh * .65, buydw * .01, buydh * .05);
            context.fillStyle = "#440000";
            context.fillRect(buydw * .11, buydh * .72, buydw * .01, buydh * .05);
            context.fillStyle = "#FFFFFF";
            context.font = "12px Verdana"
            context.fillText(_("Money Value") + " (" + beautifynum(money) + ")", buydw * .135, buydh * .68);
            context.fillText(_("Mineral Value") + " (" + beautifynum(getValueOfMinerals()) + ")", buydw * .135, buydh * .75);
            context.fillRect(buydw * .005, buydh * .18, buydw * .005, buydh * .44);
            context.fillRect(buydw * .005, buydh * .62, buydw * .50, buydh * .005);
            context.font = "12px Verdana"
            context.fillText(_("Before"), buydw * .01, buydh * .658);
            context.fillText(_("Now"), buydw * .51, buydh * .658);
            context.font = "14px Verdana";
        }
        else
        {
            saveCanvasState(context);
            context.font = "14px Verdana"
            context.fillText(_("Game must run for 60sec to get data for graph"), buydw * .01, buydh * .48);
            restoreCanvasState(context);
        }

        let yPadding = this.boundingBox.height * .07;
        let statsAdded = 0;
        let createStat = (text, value) =>
        {
            context.fillText(text + ": " + value, buydw * .03, this.boundingBox.height * .79 + (statsAdded * yPadding));
            statsAdded++;
        }
        context.restore();

        saveCanvasState(context);
        context.font = "14px Verdana";
        context.fillStyle = "#FFFFFF";
        createStat(_("Current Game Version"), "v" + ((version - 100) / 100) + "." + buildLetter + "." + splitTestValue1);
        createStat(_("Total Minerals Mined"), beautifynum(totalMineralsMined));
        createStat(_("Total Basic Chests Opened"), beautifynum(chestService.totalBasicChestsOpened));
        createStat(_("Total Gold Chests Opened"), beautifynum(chestService.totalGoldChestsOpened));
        createStat(_("Total Ethereal Chests Opened"), beautifynum(chestService.totalBlackChestsOpened));
        createStat(_("Total Battle Chests Opened"), beautifynum(chestService.totalBattleChestsOpened));
        createStat(_("Total Chests Compressed"), beautifynum(chestCompressor.totalChestsCompressed));
        createStat(_("Total Trades Done"), beautifynum(totalCompletedTrades));
        createStat(_("Total Drill Upgrades Crafted"), beautifynum(drillState.getTotalDrillEquipsCrafted()));
        createStat(_("Total Relic Scrap Spent"), beautifynum(relicScrapSpent));
        createStat(_("Total Time Lapsed"), shortenedFormattedTime(totalTimeLapsedMinutes * 60));
        createStat(_("Total Time Lapsed This Session"), shortenedFormattedTime(timelapseMinutesInSession * 60));
        createStat(_("Total Money Earned This Session"), beautifynum(totalMoneyEarnedSession));
        createStat(_("Total Money Collected from Chests This Session"), beautifynum(chestService.totalMoneyFromChests));
        createStat(_("Highest Level Scientist Ever"), beautifynum(highestLevelScientist));
        createStat(_("Scientists Buried"), beautifynum(deadScientists));
        createStat(_("Monsters Killed"), beautifynum(monsterskilled));
        createStat(_("Minerals Sacrificed"), beautifynum(mineralsSacrificed));
        createStat(_("Caves Fully Explored"), beautifynum(numCavesCompleted));
        createStat(_("Value of Minerals Mined This Session"), beautifynum(mineralsMinedValue));
        createStat(_("Value of Minerals Sold This Session"), beautifynum(mineralsSoldValue));
        createStat(_("Session Duration"), shortenedFormattedTime(performance.now() / 1000));
        restoreCanvasState(context);
    }

    renderHelpPanel()
    {
        var context = this.context;
        context.save();
        context.imageSmoothingEnabled = false;
        context.fillStyle = "#FFFFFF";
        context.font = "14px Verdana";

        //User Info
        context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .04, this.boundingBox.height * .15, context.measureText(_("USER INFO")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
        context.fillText(_("USER INFO"), this.boundingBox.width * .05, this.boundingBox.height * .19);

        // Atomic ID
        var atomicId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getUserAtomicId() : "N/A";
        fillTextShrinkToFit(context, _("Atomic ID") + ": " + atomicId, this.boundingBox.width * .05, this.boundingBox.height * .23, this.boundingBox.width * .60, "left");

        // Session ID
        var sessionId = (typeof (playsaurusSdk) != "undefined") ? playsaurusSdk.getSessionId() : "SESSION_UNAVAILABLE";
        fillTextShrinkToFit(context, _("Session ID") + ": " + sessionId, this.boundingBox.width * .05, this.boundingBox.height * .27, this.boundingBox.width * .60, "left");

        // Game Version
        var gameVersion = "v" + ((version - 100) / 100) + "." + buildLetter + "." + splitTestValue1;
        fillTextShrinkToFit(context, _("Game Version") + ": " + gameVersion, this.boundingBox.width * .05, this.boundingBox.height * .31, this.boundingBox.width * .60, "left");

        // Platform
        var platform = platformName() || "Unknown";
        fillTextShrinkToFit(context, _("Platform") + ": " + platform, this.boundingBox.width * .05, this.boundingBox.height * .35, this.boundingBox.width * .60, "left");

        // Copy Info button
        renderButton(SETTINGS, sellb, _("Copy Info"), this.boundingBox.width * .05, this.boundingBox.height * .40, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");

        //Support Links
        context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .68, this.boundingBox.height * .15, context.measureText(_("SUPPORT")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
        context.fillText(_("SUPPORT"), this.boundingBox.width * .69, this.boundingBox.height * .19);

        // Support buttons (right side, stacked vertically)
        renderButton(SETTINGS, sellb, _("Discord"), this.boundingBox.width * .70, this.boundingBox.height * .23, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
        renderButton(SETTINGS, sellb, _("Email Support"), this.boundingBox.width * .70, this.boundingBox.height * .29, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
        renderButton(SETTINGS, sellb, _("Report Bug"), this.boundingBox.width * .70, this.boundingBox.height * .35, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");
        renderButton(SETTINGS, sellb, _("Wiki"), this.boundingBox.width * .70, this.boundingBox.height * .41, this.boundingBox.width * .20, this.boundingBox.height * .05, "14px Verdana", "#000000");

        //Debug Log
        context.drawImage(darkdot, 0, 0, 1, 1, this.boundingBox.width * .04, this.boundingBox.height * .50, context.measureText(_("DEBUG LOG")).width + this.boundingBox.width * .02, this.boundingBox.height * .05);
        context.fillText(_("DEBUG LOG"), this.boundingBox.width * .05, this.boundingBox.height * .54);

        context.restore();

        if(typeof (consoleLog) !== "undefined")
        {
            this.renderLog(this.debugLogBox, consoleLog);
        }
    }
}