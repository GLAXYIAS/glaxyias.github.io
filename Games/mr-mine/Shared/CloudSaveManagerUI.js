/**
 * CloudSaveManagerUI - UI/Interaction layer for cloud save functionality
 *
 * This class handles all user-facing cloud save operations including:
 * - Save options menu (upload, download, sync)
 * - Cloud saves listing
 * - Conflict resolution
 * - Import/export confirmations
 *
 * Works in conjunction with:
 * - CloudSaveManager.js (data/API layer)
 * - ConflictResolutionWindow.js (UI component)
 */
class CloudSaveManagerUI
{
    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Get an icon safely (returns null if not loaded)
     */
    static getIcon(iconVar)
    {
        return typeof iconVar !== 'undefined' ? iconVar : null;
    }

    /**
     * Check if user is logged in to Playsaurus account.
     * If logged in, executes the callback. Otherwise shows login prompt.
     */
    static requirePlaysaurusLogin(callback)
    {
        if(typeof(playsaurusSdk) !== 'undefined' && playsaurusSdk.isLoggedIn())
        {
            if(!playsaurusSdk.isEmailVerifiedCached())
            {
                setTimeout(function()
                {
                    showConfirmationPrompt(
                        _("Verify your email to access this feature."),
                        _("OK"),
                        null,
                        _("Close")
                    );
                }, 50);
                return;
            }
            callback();
        }
        else
        {
            setTimeout(function()
            {
                showConfirmationPrompt(
                    _("Log in to your Playsaurus account to access cloud save features, sync across devices and enjoy rewards"),
                    _("Log In"),
                    function()
                    {
                        if(typeof(playsaurusSdk) !== 'undefined')
                        {
                            playsaurusSdk.startLogin(callback);
                        }
                    },
                    _("Cancel")
                );
            }, 50);
        }
    }

    /**
     * Check if CloudSaveManager is available
     */
    static isCloudSaveAvailable()
    {
        return typeof(cloudSaveManager) !== 'undefined';
    }

    /**
     * Show error message when cloud save feature is not available
     */
    static showCloudNotAvailableError()
    {
        setTimeout(function()
        {
            showConfirmationPrompt(
                _("Cloud save feature is not available."),
                _("OK"),
                null,
                _("Close")
            );
        }, 50);
    }

    // =========================================================================
    // SAVE OPTIONS MENU
    // =========================================================================

    /**
     * Show cloud save options menu for a save slot
     * @param {number} slotIndex - The save slot index
     */
    static async showSaveOptions(slotIndex)
    {
        var hasSaveInSlot = slotIndex < RSc;
        var items = [];
        var matchingCloudSave = null;
        var accountRestricted = typeof platform !== 'undefined' && platform.isAccountRestricted && platform.isAccountRestricted();

        // Check for matching cloud save if there's a save in the slot and user is logged in
        if(!accountRestricted && hasSaveInSlot && typeof(playsaurusSdk) !== 'undefined' && playsaurusSdk.isLoggedIn() && CloudSaveManagerUI.isCloudSaveAvailable())
        {
            try
            {
                var localSaveName = sids[slotIndex];
                var cloudSaves = await cloudSaveManager.getCloudSavesForDisplay();
                matchingCloudSave = cloudSaves.find(function(save) {
                    return save.saveName === localSaveName;
                }) || null;
            }
            catch(e)
            {
                console.error('[CloudSaveManagerUI] Error fetching cloud saves:', e);
            }
        }

        // Upload option (only if there's a save in the slot and account is not restricted)
        if(hasSaveInSlot && !accountRestricted)
        {
            items.push({
                title: _("Upload to Cloud"),
                subtitle: _("Backup this save to the cloud"),
                onClick: function()
                {
                    CloudSaveManagerUI.uploadToCloud(slotIndex);
                },
                enabled: true,
                icon: typeof cloudUploadIcon !== 'undefined' ? cloudUploadIcon : null
            });

            // Update from Cloud option (only if there's a matching cloud save)
            if(matchingCloudSave)
            {
                items.push({
                    title: _("Update from Cloud"),
                    subtitle: _("Sync this save with its cloud version"),
                    onClick: function()
                    {
                        CloudSaveManagerUI.syncFromCloud(slotIndex, matchingCloudSave);
                    },
                    enabled: true,
                    icon: typeof cloudSyncIcon !== 'undefined' ? cloudSyncIcon : null
                });
            }
        }

        // Options for empty slots
        if(!hasSaveInSlot)
        {
            // New Game option
            items.push({
                title: _("New Game"),
                subtitle: _("Create a new save in this slot"),
                onClick: function()
                {
                    setTimeout(function()
                    {
                        openNewGamePrompt();
                    }, 50);
                },
                enabled: true,
                icon: typeof newGameIcon !== 'undefined' ? newGameIcon : null
            });

            // Import from code option (not available on iOS)
            if(!(isMobile() && platform.isIOs()))
            {
                items.push({
                    title: _("Import from Code"),
                    subtitle: _("Load a save from an import code"),
                    onClick: function()
                    {
                        setTimeout(function()
                        {
                            showImportPopup();
                        }, 50);
                    },
                    enabled: true,
                    icon: typeof importCodeIcon !== 'undefined' ? importCodeIcon : null
                });
            }

            // Import from cloud option (not available on restricted platforms)
            if(!accountRestricted)
            {
                items.push({
                    title: _("Import from Cloud"),
                    subtitle: _("Download a save from the cloud"),
                    onClick: function()
                    {
                        CloudSaveManagerUI.importFromCloud();
                    },
                    enabled: true,
                    icon: typeof cloudDownloadIcon !== 'undefined' ? cloudDownloadIcon : null
                });
            }
        }

        // Delete save option (only if there's a save in the slot)
        if(hasSaveInSlot)
        {
            items.push({
                title: _("Delete Save"),
                subtitle: _("Permanently delete this save"),
                onClick: function()
                {
                    showDeleteSaveConfirmation(slotIndex);
                },
                enabled: true,
                danger: true,
                icon: typeof deleteSaveIcon !== 'undefined' ? deleteSaveIcon : null
            });
        }

        openUiWithoutClosing(
            ListWindow,
            null,
            _("Save Options"),
            items
        );
    }

    // =========================================================================
    // UPLOAD OPERATIONS
    // =========================================================================

    /**
     * Upload a local save to the cloud
     * @param {number} slotIndex - The save slot index
     */
    static uploadToCloud(slotIndex)
    {
        CloudSaveManagerUI.requirePlaysaurusLogin(function()
        {
            if(!CloudSaveManagerUI.isCloudSaveAvailable())
            {
                CloudSaveManagerUI.showCloudNotAvailableError();
                return;
            }

            var saveName = sids[slotIndex];

            // Check if a cloud save with the same name already exists
            cloudSaveManager.getCloudSavesForDisplay().then(function(cloudSaves)
            {
                var matchingCloudSave = null;
                for(var i = 0; i < cloudSaves.length; i++)
                {
                    if(cloudSaves[i].saveName === saveName)
                    {
                        matchingCloudSave = cloudSaves[i];
                        break;
                    }
                }

                if(matchingCloudSave)
                {
                    // Compare local and cloud to detect conflicts
                    var comparison = cloudSaveManager.compareLocalAndCloudSave(saveName, matchingCloudSave);

                    if(comparison.hasConflict && comparison.recommendation !== 'USE_LOCAL')
                    {
                        // Cloud has more progress or different state - show conflict resolution
                        setTimeout(function()
                        {
                            CloudSaveManagerUI.showConflictResolution(comparison, matchingCloudSave, saveName);
                        }, 50);
                        return;
                    }
                }

                // No conflict or local has more progress - proceed with upload
                CloudSaveManagerUI.performUpload(saveName);
            }).catch(function(e)
            {
                console.error('[CloudSaveManagerUI] Error checking cloud saves before upload:', e);
                // On error fetching, proceed with upload anyway
                CloudSaveManagerUI.performUpload(saveName);
            });
        });
    }

    /**
     * Perform the actual upload to cloud and show result
     * @param {string} saveName - The save name to upload
     */
    static performUpload(saveName)
    {
        cloudSaveManager.backupSaveToCloud(saveName).then(function(result)
        {
            setTimeout(function()
            {
                if(result.success)
                {
                    showConfirmationPrompt(
                        _("Save uploaded to cloud successfully!"),
                        _("OK"),
                        null,
                        _("Close")
                    );
                }
                else
                {
                    showConfirmationPrompt(
                        _("Failed to upload save: ") + (result.error || _("Unknown error")),
                        _("OK"),
                        null,
                        _("Close")
                    );
                }
            }, 50);
        });
    }

    // =========================================================================
    // IMPORT OPERATIONS
    // =========================================================================

    /**
     * Start the cloud import flow (shows cloud saves list)
     */
    static importFromCloud()
    {
        CloudSaveManagerUI.requirePlaysaurusLogin(function()
        {
            setTimeout(function()
            {
                if(CloudSaveManagerUI.isCloudSaveAvailable())
                {
                    CloudSaveManagerUI.showCloudSavesList();
                }
                else
                {
                    CloudSaveManagerUI.showCloudNotAvailableError();
                }
            }, 50);
        });
    }

    /**
     * Show list of cloud saves for import
     */
    static showCloudSavesList()
    {
        if(!CloudSaveManagerUI.isCloudSaveAvailable())
        {
            CloudSaveManagerUI.showCloudNotAvailableError();
            return;
        }

        cloudSaveManager.listCloudSaves().then(function(result)
        {
            if(!result.success)
            {
                showConfirmationPrompt(
                    _("Failed to load cloud saves: ") + (result.error || _("Unknown error")),
                    _("OK"),
                    null,
                    _("Close")
                );
                return;
            }

            if(result.saves.length === 0)
            {
                showConfirmationPrompt(
                    _("No cloud saves found."),
                    _("OK"),
                    null,
                    _("Close")
                );
                return;
            }

            var items = [];

            for(var i = 0; i < result.saves.length; i++)
            {
                (function(save) {
                    var depth = save.depthFormatted || (save.depth ? save.depth + " " + _("km") : "0 " + _("km"));
                    var money = save.money || "$0";
                    var playTime = save.playTimeFormatted || "0h 0m";
                    var time = save.timeAgo || save.lastSavedFormatted || _("Unknown");
                    var platform = save.platformFormatted || save.platform || _("Unknown");
                    var isCompatible = save.canLoad !== false;
                    var versionDisplay = save.versionDisplay || cloudSaveManager.formatVersionDisplay(save.gameVersion || 0, save.patchLetter || '');
                    var versionInfo = _("Version") + ": " + versionDisplay;
                    if(!isCompatible)
                    {
                        // Short, plain reason the row can't be imported, drawn in red
                        // (see subtitleLineColors below) so users understand the block.
                        versionInfo += "  -  " + _("Version Mismatch");
                    }

                    // Mirror the HTML cloud-saves list layout (MobileMainMenu
                    // showMobileCloudSavesScreen): "name [dot] platform" as the
                    // title, then middot-separated values (no verbose labels) split
                    // over two lines so they stay readable, a version line, and the
                    // dim "time ago" line. The middot is built via fromCharCode so a
                    // literal char in source can't get mojibaked by the page charset.
                    var dot = "  " + String.fromCharCode(183) + "  ";
                    var subtitleLines = [
                        depth + dot + money,
                        _("Tickets") + ": " + (save.ticketsFormatted || "0") + dot + playTime,
                        versionInfo,
                        time
                    ];
                    var VERSION_LINE_INDEX = 2;
                    items.push({
                        title: (save.saveName || _("Cloud Save")) + dot + platform,
                        subtitle: subtitleLines.join("\n"),
                        // Paint the version line red when the save can't be imported.
                        subtitleLineColors: isCompatible ? null
                            : (function() { var c = {}; c[VERSION_LINE_INDEX] = ListWindow.COLOR_TEXT_ERROR; return c; })(),
                        onClick: function() {
                            CloudSaveManagerUI.importWithConfirmation(save);
                        },
                        enabled: isCompatible,
                        danger: !isCompatible
                    });
                })(result.saves[i]);
            }

            openUiWithoutClosing(
                ListWindow,
                null,
                _("Select a Cloud Save"),
                items,
                isMobile() ? 138 : 112, // Item height for title + 4 subtitle lines
                { itemStyle: "card" }  // container1 cards, like the cloud-save / rewards lists
            );
        });
    }

    /**
     * Import a cloud save with confirmation (checks for conflicts)
     * @param {Object} cloudSave - The cloud save to import
     */
    static importWithConfirmation(cloudSave)
    {
        // Block import if the save is from a newer version of the game
        if(cloudSave.canLoad === false)
        {
            setTimeout(function()
            {
                showConfirmationPrompt(
                    _("This save is from a newer version of the game. Please update before continuing"),
                    _("OK"),
                    null,
                    _("Close")
                );
            }, 50);
            return;
        }

        if(RSc >= 3)
        {
            showConfirmationPrompt(
                _("You have too many saves, delete one first."),
                _("OK"),
                null,
                _("Close")
            );
            return;
        }

        var displayName = cloudSave.displayName || cloudSave.saveName || _("Cloud Save");
        var depthText = cloudSave.depth ? beautifynum(cloudSave.depth) + " " + _("Km") : "?";
        var moneyText = cloudSave.money || "?";
        var ticketsText = cloudSave.ticketsFormatted || beautifynum(cloudSave.tickets || 0);

        // Check for conflicts with existing local saves
        var hasConflict = false;
        var conflictComparison = null;

        // Check each local save slot for a matching name
        for(var i = 0; i < RSc; i++)
        {
            var localSaveName = sids[i];
            if(localSaveName === displayName)
            {
                // Found a local save with the same name - check for conflict
                var comparison = cloudSaveManager.compareLocalAndCloudSave(localSaveName, cloudSave);
                if(comparison.hasConflict)
                {
                    hasConflict = true;
                    conflictComparison = comparison;
                    break;
                }
            }
        }

        setTimeout(function()
        {
            if(hasConflict && conflictComparison)
            {
                // Show conflict resolution UI
                CloudSaveManagerUI.showConflictResolution(conflictComparison, cloudSave, displayName);
            }
            else
            {
                // No conflict - show normal confirmation
                showConfirmationPrompt(
                    _("Import save from cloud?") + "\n" + displayName + "\n" + _("Depth") + ": " + depthText + "\n" + _("Money") + ": " + moneyText + "\n" + _("Tickets") + ": " + ticketsText,
                    _("Import"),
                    function()
                    {
                        CloudSaveManagerUI.performImport(cloudSave.id, displayName);
                    },
                    _("Cancel")
                );
            }
        }, 50);
    }

    /**
     * Perform the actual cloud save import
     * @param {string} cloudSaveId - The cloud save ID
     * @param {string} displayName - The display name for the save
     */
    static performImport(cloudSaveId, displayName)
    {
        cloudSaveManager.importCloudSave(cloudSaveId, displayName).then(function(result)
        {
            setTimeout(function()
            {
                if(result.success)
                {
                    showConfirmationPrompt(
                        _("Save imported successfully!"),
                        _("OK"),
                        function() { reloadGame(); },
                        _("Close")
                    );
                }
                else
                {
                    showConfirmationPrompt(
                        _("Failed to import save: ") + (result.error || _("Unknown error")),
                        _("OK"),
                        null,
                        _("Close")
                    );
                }
            }, 50);
        });
    }

    // =========================================================================
    // SYNC OPERATIONS
    // =========================================================================

    /**
     * Sync local save with cloud version (Update from Cloud)
     * @param {number} slotIndex - The save slot index
     * @param {Object} matchingCloudSave - The matching cloud save
     */
    static syncFromCloud(slotIndex, matchingCloudSave)
    {
        // Block sync if the cloud save is from a newer version of the game
        if(matchingCloudSave.canLoad === false)
        {
            setTimeout(function()
            {
                showConfirmationPrompt(
                    _("This save is from a newer version of the game. Please update before continuing"),
                    _("OK"),
                    null,
                    _("Close")
                );
            }, 50);
            return;
        }

        CloudSaveManagerUI.requirePlaysaurusLogin(function()
        {
            if(!CloudSaveManagerUI.isCloudSaveAvailable())
            {
                CloudSaveManagerUI.showCloudNotAvailableError();
                return;
            }

            var localSaveName = sids[slotIndex];

            // Compare local and cloud saves to check for conflicts
            var comparison = cloudSaveManager.compareLocalAndCloudSave(localSaveName, matchingCloudSave);

            setTimeout(function()
            {
                if(comparison.hasConflict)
                {
                    // Show conflict resolution UI
                    CloudSaveManagerUI.showConflictResolution(comparison, matchingCloudSave, localSaveName);
                }
                else
                {
                    // No conflict - show confirmation before replacing
                    var depthText = matchingCloudSave.depth ? beautifynum(matchingCloudSave.depth) + " " + _("Km") : "?";
                    var moneyText = matchingCloudSave.money || "?";
                    var ticketsText = matchingCloudSave.ticketsFormatted || beautifynum(matchingCloudSave.tickets || 0);

                    showConfirmationPrompt(
                        _("Replace local save with cloud version?") + "\n" + localSaveName + "\n" + _("Depth") + ": " + depthText + "\n" + _("Money") + ": " + moneyText + "\n" + _("Tickets") + ": " + ticketsText,
                        _("Update"),
                        function()
                        {
                            CloudSaveManagerUI.performImport(matchingCloudSave.id, localSaveName);
                        },
                        _("Cancel")
                    );
                }
            }, 50);
        });
    }

    // =========================================================================
    // CONFLICT RESOLUTION
    // =========================================================================

    /**
     * Show conflict resolution UI when cloud and local saves conflict
     * @param {Object} comparison - The comparison result from CloudSaveManager
     * @param {Object} cloudSave - The cloud save object
     * @param {string} saveName - The save name
     */
    static showConflictResolution(comparison, cloudSave, saveName)
    {
        var localSave = comparison.comparison.local;
        var cloudSaveInfo = comparison.comparison.cloud;

        var onLocalChosen = function()
        {
            // User chose to keep local save - upload it to cloud (overwrite)
            setTimeout(function()
            {
                showConfirmationPrompt(
                    _("This will overwrite the cloud save with your local save. Continue?"),
                    _("Overwrite Cloud"),
                    function()
                    {
                        cloudSaveManager.backupSaveToCloud(saveName).then(function(result)
                        {
                            if(result.success)
                            {
                                showConfirmationPrompt(
                                    _("Local save uploaded to cloud successfully!"),
                                    _("OK"),
                                    null,
                                    _("Close")
                                );
                            }
                            else
                            {
                                showConfirmationPrompt(
                                    _("Failed to upload local save: ") + (result.error || _("Unknown error")),
                                    _("OK"),
                                    null,
                                    _("Close")
                                );
                            }
                        });
                    },
                    _("Cancel")
                );
            }, 50);
        };

        var onCloudChosen = function()
        {
            // User chose to keep cloud save - import it (overwrite local)
            setTimeout(function()
            {
                showConfirmationPrompt(
                    _("This will overwrite your local save with the cloud save. Continue?"),
                    _("Overwrite Local"),
                    function()
                    {
                        CloudSaveManagerUI.performImport(cloudSave.id, saveName);
                    },
                    _("Cancel")
                );
            }, 50);
        };

        openUiWithoutClosing(
            ConflictResolutionWindow,
            null,
            _("Save Conflict Detected"),
            localSave,
            cloudSaveInfo,
            onLocalChosen,
            onCloudChosen
        );
    }
}

// Create global alias for backwards compatibility and easier access
var cloudSaveManagerUI = CloudSaveManagerUI;
