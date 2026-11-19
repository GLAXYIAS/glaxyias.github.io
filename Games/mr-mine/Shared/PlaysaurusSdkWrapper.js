class SuperMinerSlotsFullError extends Error
{
    constructor()
    {
        super("SuperMinerSlotsFull");
        this.name = "SuperMinerSlotsFullError";
    }
}

class SuperMinerNotUnlockedError extends Error
{
    constructor()
    {
        super("SuperMinerNotUnlocked");
        this.name = "SuperMinerNotUnlockedError";
    }
}

class UnsupportedRewardError extends Error
{
    constructor()
    {
        super("UnsupportedReward");
        this.name = "UnsupportedRewardError";
    }
}

class PlaysaurusSdk
{
    lastNewsCheckTime = 0;
    timeBetweenNewsChecks = 12 * 3600000; // 12 hours

    pendingRewardsCache = null;
    pendingRewardsCount = 0;

    _claimInProgress = false;
    _claimedRewardIds = new Set();

    _emailVerified = null; // null = unknown, true/false = cached status

    endpointRoot = "https://app.playsaurus.com";
    apiEndpoint = this.endpointRoot + "/api";
    profileUrl = this.endpointRoot + "/profile";
    tosUrl = "https://playsaurus.com/terms-and-conditions";
    privacyPolicyUrl = "https://playsaurus.com/privacy-policy";

    // The game's OAuth client, created in the Playsaurus admin panel. It has to travel with the
    // endpoint above: the SDK derives the OAuth host from the API endpoint, so a client id only
    // ever works against the server that issued it, and the wrong pairing is rejected with
    // "invalid_client". Web dev builds swap both in Web/build.py:applyDevBuildChanges().
    // Staging: 01a05ebb-8250-7168-87f5-9c27f4e5eb75
    oauthClientId = "01a06eb4-664a-73c9-a6e3-8e9537c76548";

    // The custom URI scheme the Cordova login comes back through, registered on the OAuth client
    // as "com.playsaurus.mrmine://oauth/callback" and as the cordova-plugin-oauth variables in
    // Mobile/package.json. It matches the Android package name from Mobile/config.xml; the iOS
    // bundle id is the same but camel-cased, and a scheme has to be lowercase because Android
    // matches it case-sensitively. Dashes are not allowed either: the Android build rewrites them
    // to underscores and the return trip breaks.
    oauthCordovaScheme = "com.playsaurus.mrmine";

    _loginController = null;
    _loginPhaseWatched = false;

    errorHandler = null;

    cloudSaveId = -1;

    userAtomicId = null;
    eventSessionIds = {};

    generalPriceLocalizationId = null;
    bundlePriceLocalizationId = null;

    constructor()
    {
        window.addEventListener("load", async () =>
        {
            try
            {
                this.errorHandler = new PlaysaurusErrorHandler();
                await this.initSdk();
                this.initEventListeners();
                if(isWeb())
                {
                    await localizePurchasePackPrices();
                    if(typeof (platform) != "undefined" && platform.initPurchases)
                    {
                        platform.initPurchases();
                    }
                }
                else if(isSteam())
                {
                    platform.getUserLocationData(
                        localizePurchasePackPrices.bind(this),
                        localizePurchasePackPrices.bind(this)
                    );
                }
                this.fetchPendingRewards();
                if(this.isLoggedIn())
                {
                    this.checkEmailVerified();
                }
            }
            catch(e)
            {
                console.error(e);
            }
        });
    }

    async initSdk()
    {
        // Wait for advertising ID if retrieval is in progress (Android)
        if(isMobile() && platform.advertisingIdPromise)
        {
            try
            {
                await platform.advertisingIdPromise;
            }
            catch(e)
            {
                console.warn("Failed to await advertising ID:", e);
            }
        }
        var config = {
            gameSlug: "mr-mine",
            endpoint: this.apiEndpoint,
            gameStorefront: this.getStorefrontName(),
            gameVersion: version + buildLetter + "." + revisionNumber,
            userUid: platform.getUserId() + "",
            locale: actuallyUsedLocaleCode(),
            analytics: {enabled: true}
        };
        if(isMobile() && platform.advertisingId)
        {
            if(platform.isIOs())
            {
                config.analytics.deviceIdfa = platform.advertisingId;
            }
            else
            {
                config.analytics.deviceGaid = platform.advertisingId;
            }
        }
        if(isMobile() && platform.isActualDevice && typeof device !== 'undefined' && device.uuid)
        {
            if(platform.isIOs())
            {
                config.analytics.deviceIdfv = device.uuid;
            }
            else
            {
                config.analytics.deviceAndroidId = device.uuid;
            }
        }
        config.analytics.dataCollector = this.createDataCollector();
        config.gamePlatform = platformName();
        if(config.gamePlatform == "steam")
        {
            config.gamePlatform = "desktop";
            config.analytics.steamId = platform.getUserId();
        }
        config.oauthClientId = this.oauthClientId;
        var oauthBrowser = this.createOAuthBrowser();
        if(oauthBrowser)
        {
            config.oauthBrowser = oauthBrowser;
        }
        try
        {
            Playsaurus.initialize(config);

            // Initialize cloud save manager after SDK is ready
            if(typeof cloudSaveManager !== 'undefined')
            {
                cloudSaveManager.initialize();
            }
        }
        catch(e)
        {
            this.handleError(e);
        }
    }

    initEventListeners()
    {
        if(isSteam())
        {
            const {ipcRenderer} = require('electron');
            const maxExecutionTimeBeforeClose = 3000;
            ipcRenderer.on("before-close", async (event) =>
            {
                // Force the window to close if endSession() takes too long
                var timeout = new Promise((resolve, reject) =>
                {
                    setTimeout(() =>
                    {
                        resolve();
                    }, maxExecutionTimeBeforeClose);
                });
                await Promise.race([timeout, Playsaurus.analytics.endSession()]);
                ipcRenderer.send('before-close-done');
            });
        }
        else if(isMobile())
        {
            document.addEventListener("pause", async function ()
            {
                if(typeof (adManager) == "undefined" || !adManager.isWatchingAd())
                {
                    await this.endSession();
                }
            }.bind(this));
            document.addEventListener("resume", function ()
            {
                if(Playsaurus.analytics._session == null)
                {
                    this.initSdk();
                }
                this.lastNewsCheckTime = 0;
                this.fetchAnnouncementsIfDue();
                this.fetchPendingRewards();
            }.bind(this));
        }
        else
        {
            window.addEventListener("beforeunload", this.endSession);
        }
    }

    // AUTHENTICATION

    /**
     * Builds the analytics data collector for this platform. Each one reads the device through its
     * runtime's native APIs and falls back to the browser's when they are unavailable, so the
     * device model, OS and RAM in a session are only as accurate as the collector we hand over.
     */
    createDataCollector()
    {
        try
        {
            if(isSteam() && typeof (PlaysaurusElectron) !== "undefined")
            {
                return new PlaysaurusElectron.DataCollector();
            }
            if(isMobile() && platform.isActualDevice && typeof (PlaysaurusCordova) !== "undefined")
            {
                return new PlaysaurusCordova.DataCollector();
            }
        }
        catch(e)
        {
            console.error("Failed to create the analytics data collector:", e);
        }
        return new Playsaurus.BrowserDataCollector();
    }

    /**
     * Builds the OAuth browser this platform needs to open the login page and catch the redirect
     * back. Returns null on the web, where the SDK's built-in popup already does the right thing.
     */
    createOAuthBrowser()
    {
        try
        {
            if(isSteam() && typeof (PlaysaurusElectron) !== "undefined")
            {
                // The login opens in the player's real browser and comes back on a 127.0.0.1
                // loopback bound by registerOAuthMain() in PC/main.js.
                return new PlaysaurusElectron.ElectronOAuthBrowser();
            }
            if(isMobile() && platform.isActualDevice && typeof (PlaysaurusCordova) !== "undefined")
            {
                return new PlaysaurusCordova.OAuthBrowser({scheme: this.oauthCordovaScheme});
            }
        }
        catch(e)
        {
            console.error("Failed to create the OAuth browser:", e);
        }
        return null;
    }

    isOAuthConfigured()
    {
        return !!this.oauthClientId;
    }

    /**
     * Logs the player in through their Playsaurus Account. Registration happens on the same page,
     * so this is the only entry point the game needs. Call it straight from a click or tap: the
     * browser only allows the login popup to open while the player's activation is still alive.
     *
     * @param {Function} [onLoginCallback] Runs after a successful login.
     */
    async startLogin(onLoginCallback)
    {
        if(this._loginController)
        {
            // Only one login can run at a time; a second one would fight over the same popup.
            return;
        }
        if(!this.isOAuthConfigured())
        {
            console.error("Cannot log in: the Playsaurus OAuth client ID is not configured.");
            alert(_("Sign in is not available in this build."));
            return;
        }

        this._loginController = new AbortController();
        this._watchLoginPhase();
        this._showLoginOverlay();

        try
        {
            await Playsaurus.auth.loginWithOAuth({
                signal: this._loginController.signal,
                deviceName: this.getLoginDeviceName()
            });
            this._handleLoginSuccess(onLoginCallback);
        }
        catch(error)
        {
            this._handleLoginError(error);
        }
        finally
        {
            this._loginController = null;
            this._hideLoginOverlay();
        }
    }

    /**
     * Cancels a login that is still running. The player reaches this through the overlay's cancel
     * button, which only exists where they can actually see it (see _showLoginOverlay).
     */
    cancelLogin()
    {
        if(this._loginController)
        {
            this._loginController.abort();
        }
    }

    /**
     * A friendly label for the session list in the player's Playsaurus Account.
     */
    getLoginDeviceName()
    {
        try
        {
            if(isMobile() && typeof (device) !== "undefined" && device.model)
            {
                return device.model;
            }
        }
        catch(e)
        {
            console.warn("Failed to read the device model:", e);
        }
        return Playsaurus.auth.generateDeviceName();
    }

    /**
     * Most of a login happens where the game cannot see it. Once the player comes back there is a
     * short silent step while the SDK trades the result for a token, and an idle overlay there
     * looks frozen, so swap the message for a "finishing" one.
     */
    _watchLoginPhase()
    {
        if(this._loginPhaseWatched)
        {
            return;
        }
        this._loginPhaseWatched = true;
        Playsaurus.auth.oauthLoginPhaseChanged.add((args) =>
        {
            if(args.phase === Playsaurus.OAuthLoginPhase.Finishing)
            {
                this._setLoginMessage(_("Signing you in..."));
            }
        });
    }

    _handleLoginSuccess(onLoginCallback)
    {
        this.checkEmailVerified();
        this.fetchPendingRewards();
        newNews(_("Successfully logged in"));
        if(onLoginCallback)
        {
            onLoginCallback();
        }
    }

    _handleLoginError(error)
    {
        // The player closing the login, or backing out of it, is normal behaviour and not
        // something to alarm them about.
        if(error instanceof Playsaurus.PlaysaurusOAuthCancelledError)
        {
            return;
        }
        if(error instanceof Playsaurus.PlaysaurusOAuthDeniedError)
        {
            newNews(_("Sign in was denied"));
            return;
        }
        if(error instanceof Playsaurus.PlaysaurusOAuthTimeoutError)
        {
            newNews(_("Sign in timed out. Please try again."));
            return;
        }
        if(error instanceof Playsaurus.PlaysaurusOAuthPopupBlockedError)
        {
            // The sign in window has to open from the click itself, so all the player can do is
            // allow it and click again.
            alert(_("Your browser blocked the sign in window. Please allow pop-ups and try again."));
            return;
        }
        if(error instanceof Playsaurus.PlaysaurusOAuthBrowserUnavailableError)
        {
            console.error("No browser is available for the OAuth login:", error);
            alert(_("Sign in could not open a browser on this device."));
            return;
        }
        if(error instanceof Playsaurus.PlaysaurusOAuthError)
        {
            console.error("OAuth login failed:", error);
            newNews(_("Sign in failed. Please try again."));
            return;
        }
        this.handleError(error);
    }

    // LOGIN OVERLAY
    // The login itself happens outside the game, so all the game shows is a waiting state.

    _showLoginOverlay()
    {
        var screen = document.getElementById("OAUTHLOGINSCREEN");
        if(!screen)
        {
            return;
        }
        this._setLoginMessage(_("Complete your sign in in the window that just opened."));

        // On Cordova the login covers the game, so the player could never reach a cancel button:
        // dismissing the browser is the cancel. Everywhere else they need a way out, because a
        // popup can end up hidden behind the game window (and on PC the login opens in a browser
        // the game cannot watch at all).
        var cancelBtn = document.getElementById("oauthLoginCancelBtn");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.style.display = (isMobile() && platform.isActualDevice) ? "none" : "";
        cancelBtn.onclick = () => this.cancelLogin();

        screen.style.display = "flex";
        if(typeof (fitAccountButtonsText) === "function")
        {
            fitAccountButtonsText(screen);
        }
    }

    _setLoginMessage(message)
    {
        var messageEl = document.getElementById("oauthLoginMessage");
        if(messageEl)
        {
            messageEl.textContent = message;
        }
    }

    _hideLoginOverlay()
    {
        var screen = document.getElementById("OAUTHLOGINSCREEN");
        if(screen)
        {
            screen.style.display = "none";
        }
    }

    isLoggedIn()
    {
        return Playsaurus.auth.isLoggedIn;
    }

    async logout()
    {
        showPurchaseLoadingOverlay();
        try
        {
            try
            {
                await Playsaurus.auth.logout();
            }
            catch(e)
            {
                this.handleError(e);
            }
            this.handleLogout();
        }
        catch(error)
        {
            console.error(error);
        }
        hidePurchaseLoadingOverlay();
    }

    handleLogout()
    {
        this._emailVerified = null;

        // Close the account window if it's open
        if(typeof (AccountWindow) !== "undefined" && activeLayers["account"])
        {
            activeLayers["account"].close();
        }

        // Show confirmation message
        newNews(_("Successfully logged out"));
    }

    async getUserProfile()
    {
        try
        {
            const user = await Playsaurus.auth.getProfile();
            return user;
        } catch(error)
        {
            this.handleError(error);
        }
        return null;
    }

    editUserProfile()
    {
        openExternalLinkInDefaultBrowser(this.profileUrl);
    }

    async openPointsShop()
    {
        var user = await this.getUserProfile();
        if(user && user.pointsShopLink)
        {
            openExternalLinkInDefaultBrowser(user.pointsShopLink);
        }
    }

    async resendEmailVerification()
    {
        try
        {
            const result = await Playsaurus.auth.resendEmailVerification();
            return result;
        }
        catch(error)
        {
            this.handleError(error);
        }
        return null;
    }

    /**
     * Check if the user's email is verified (async, refreshes from server).
     * Updates the cached status.
     */
    async checkEmailVerified()
    {
        var userInfo = await this.getUserProfile();
        if(userInfo)
        {
            this._emailVerified = userInfo.isEmailVerified;
        }
        return this._emailVerified;
    }

    /**
     * Returns the cached email verification status.
     * Returns true if unknown (not yet checked) to avoid blocking features before first check.
     */
    isEmailVerifiedCached()
    {
        if(this._emailVerified === null) return true;
        return this._emailVerified;
    }

    // CLOUD SAVE

    buildSaveInfo()
    {
        const saveName = sids[chosen];
        const saveData = exportgametext();
        const compressedSaveData = this.compressSaveData(saveData);
        return {
            playTime: playtime,
            fileName: saveName + '.dat',
            file: new Blob([compressedSaveData], {type: 'application/octet-stream'}),
            metadata: {
                depth: depth,
                money: "$" + beautifynum(money),
                encoding: "gzip"
            },
        };
    }

    compressSaveData(saveData)
    {
        return window.pako.gzip(saveData);
    }

    async decompressSaveData(saveBlob)
    {
        const arrayBuffer = await saveBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const decompressedSaveData = pako.ungzip(uint8Array, {to: 'string'});
        return decompressedSaveData;
    }

    async saveToCloud()
    {
        const saveInfo = this.buildSaveInfo();
        let cloudSave = null;
        try
        {
            if(this.cloudSaveId === -1)
            {
                cloudSave = await Playsaurus.cloudSaves.create(saveInfo);
                console.log('Save created:', cloudSave);
            }
            else
            {
                cloudSave = await Playsaurus.cloudSaves.updateOrCreate(this.cloudSaveId, saveInfo);
                if(cloudSave.id === this.cloudSaveId)
                {
                    console.log('Save updated:', cloudSave);
                } else
                {
                    console.log('Save created:', cloudSave);
                }
            }
        }
        catch(error)
        {
            console.error('Failed to update or create save:', error);
            this.handleError(error);
        }
        if(cloudSave)
        {
            this.cloudSaveId = cloudSave.id;
        }
        return cloudSave;
    }

    async loadCloudSave(saveId, targetSlot = null)
    {
        try
        {
            const fileBlob = await Playsaurus.cloudSaves.download(saveId);
            const saveData = await this.decompressSaveData(fileBlob);
            console.log(saveData);
        } catch(error)
        {
            console.error('Failed to download save:', error);
            this.handleError(error);
        }
    }

    // ANALYTICS

    async endSession()
    {
        console.log("ENDING SESSION");
        try
        {
            await Playsaurus.analytics.endSession();
        } catch(error)
        {
            this.handleError(error);
        }
        console.log("SESSION ENDED");
        return true;
    }

    updateLocale(newLanguageCode)
    {
        Playsaurus.locale = newLanguageCode;
    }

    async localizePrices(prices, isBundle = false)
    {
        var args = {
            prices: []
        };
        for(var i = 0; i < prices.length; ++i)
        {
            args.prices[i] = new Playsaurus.Money(prices[i], "USD");
        }
        var expectedCountry = platform.getUserCountryCode();
        if(expectedCountry)
        {
            args.expectedCountry = expectedCountry;
        }
        var expectedCurrency = platform.getUserCurrencyCode();
        if(expectedCurrency)
        {
            args.expectedCurrency = expectedCurrency;
        }
        args.productType = isBundle ? "bundle" : "general";
        try
        {
            var result = await Playsaurus.prices.localizeMany(args);
        } catch(error)
        {
            if(error instanceof Playsaurus.PlaysaurusMaintenanceError ||
                error instanceof Playsaurus.PlaysaurusTooManyRequestsError)
            {
                console.error('Failed to localize prices:', error);
                return null;
            }
            this.handleError(error);
        }
        if(result && result[0])
        {
            if(!isBundle)
            {
                this.generalPriceLocalizationId = result[0].priceLocalizationId
            }
            else
            {
                this.bundlePriceLocalizationId = result[0].priceLocalizationId
            }
            return result;
        }
        return null;
    }

    async logPurchase(data)
    {
        try
        {
            let localizationId = data.productType == "bundle" ? this.bundlePriceLocalizationId : this.generalPriceLocalizationId;
            const purchase = await Playsaurus.purchases.store({
                sku: data.sku,
                price: new Playsaurus.Money("" + data.amount, data.currency),
                currency: data.currency,
                transactionId: data.transactionId,
                productType: data.productType,
                priceLocalizationId: localizationId,
                paymentGateway: data.paymentGateway
            });

            console.log('Purchase logged successfully:', purchase);
        } catch(error)
        {
            console.error('Failed to log purchase:', error);
            this.handleError(error);
        }
    }

    getStorefrontName()
    {
        switch(platformName())
        {
            case "ios":
                return "app_store";
            case "android":
                return "google_play";
            case "steam":
                return "steam";
            case "web":
                switch(platform.domain)
                {
                    case "armorgames":
                        return "armor_games";
                    case "crazygames":
                        return "crazy_games";
                    default:
                        return "playsaurus_web";
                }
        }
        return null;
    }

    getUserAtomicId()
    {
        return Playsaurus.getAtomicId();
    }

    getSessionId()
    {
        try
        {
            // Try to get the session ID from Playsaurus analytics
            if(Playsaurus && Playsaurus.analytics && Playsaurus.analytics._session)
            {
                return Playsaurus.analytics._session.id || Playsaurus.analytics._session.sessionId;
            }
            // Fallback to a simple session based on performance.now() and page load time
            return "SESSION_" + Math.floor(performance.now()).toString(36);
        } catch(e)
        {
            console.warn("Could not get session ID:", e);
            return "SESSION_UNAVAILABLE";
        }
    }

    setEventSessionId(eventSessionKey, id = null)
    {
        if(id == null)
        {
            id = crypto.randomUUID();
        }
        this.eventSessionIds[eventSessionKey] = id;
        return id;
    }

    getEventSessionId(eventSessionKey)
    {
        return this.eventSessionIds[eventSessionKey] || this.setEventSessionId(eventSessionKey);
    }

    clearEventSessionId(eventSessionKey)
    {
        this.eventSessionIds[eventSessionKey] = null;
    }

    // ANNOUNCEMENTS

    async fetchAnnouncementsIfDue(openUiIfNew = true)
    {
        if(this.isDueForAnnouncements())
        {
            try
            {
                const result = await Playsaurus.announcements.fetch();
                this.lastNewsCheckTime = Date.now();
                if(openUiIfNew && result)
                {
                    openUiWithoutClosing(AnnouncementPopup, null, result);
                }
            }
            catch(e)
            {
                if(e instanceof Playsaurus.PlaysaurusMaintenanceError ||
                    e instanceof Playsaurus.PlaysaurusTooManyRequestsError)
                {
                    console.error('Failed to fetch announcements:', e);
                    return;
                }
                this.handleError(e);
            }
        }
    }

    isDueForAnnouncements()
    {
        return isGameLoaded
            && Date.now() > this.lastNewsCheckTime + this.timeBetweenNewsChecks
            && numGameLaunches > 1;
    }

    // PENDING REWARDS

    async fetchPendingRewards()
    {
        if(!this.isLoggedIn())
        {
            return null;
        }
        try
        {
            var result = await Playsaurus.pendingRewards.list({
                supportedRewardTypes: supportedRewardTypes
            });
            this.pendingRewardsCache = result;
            this.pendingRewardsCount = result.rewards.length;
            this.updatePendingRewardsBadges();
            return result;
        }
        catch(e)
        {
            console.error('Failed to fetch pending rewards:', e);
            // Don't block the game for background fetch failures due to server issues.
            // The player can still check rewards manually when the server recovers.
            if(e instanceof Playsaurus.PlaysaurusMaintenanceError ||
                e instanceof Playsaurus.PlaysaurusTooManyRequestsError)
            {
                return null;
            }
            this.handleError(e);
        }
        return null;
    }

    getPendingRewardsCache()
    {
        return this.pendingRewardsCache;
    }

    getPendingRewardsCount()
    {
        return this.pendingRewardsCount;
    }

    updatePendingRewardsBadges()
    {
        var hasPending = this.pendingRewardsCount > 0;
        var accountDot = document.getElementById('accountRewardsDot');
        if(accountDot)
        {
            accountDot.style.display = hasPending ? 'block' : 'none';
        }
        var rewardsDot = document.getElementById('rewardsBtnDot');
        if(rewardsDot)
        {
            rewardsDot.style.display = hasPending ? 'block' : 'none';
        }
    }

    isClaimInProgress()
    {
        return this._claimInProgress;
    }

    async claimAllPendingRewards()
    {
        if(!this.isLoggedIn() || !isSaveFileLoaded())
        {
            return;
        }
        if(this._claimInProgress)
        {
            console.warn('Claim already in progress, ignoring claimAllPendingRewards call');
            return;
        }
        this._claimInProgress = true;
        try
        {
            var result = await this.fetchPendingRewards();
            if(!result || result.rewards.length === 0)
            {
                return;
            }

            var allMessages = [];
            var skippedNotUnlocked = 0;
            var skippedUnsupported = 0;
            for(var i = 0; i < result.rewards.length; i++)
            {
                var reward = result.rewards[i];
                try
                {
                    var claimResult = await this.claimSingleReward(reward);
                    if(claimResult.alreadyClaimed)
                    {
                        continue;
                    }
                    if(claimResult.label)
                    {
                        allMessages.push(claimResult.label);
                    }
                    if(claimResult.message)
                    {
                        allMessages.push(claimResult.message);
                    }
                }
                catch(claimError)
                {
                    if(claimError instanceof SuperMinerNotUnlockedError) skippedNotUnlocked++;
                    if(claimError instanceof UnsupportedRewardError) skippedUnsupported++;
                    console.error('Failed to claim reward:', reward.id, claimError);
                }
            }

            if(skippedNotUnlocked > 0)
            {
                allMessages.push(_("Progress further in the game to claim {0} of your rewards.", skippedNotUnlocked));
            }

            if(skippedUnsupported > 0)
            {
                allMessages.push(_("Update the game to the latest version to receive {0} more reward(s)!", skippedUnsupported));
            }

            if(allMessages.length > 0)
            {
                window.alert(allMessages.join("\n"));
            }

            if(result.unsupportedRewardsCount > 0)
            {
                window.alert(_("Update the game to the latest version to receive {0} more reward(s)!", result.unsupportedRewardsCount));
            }

            await this.fetchPendingRewards();
        }
        catch(e)
        {
            console.error('Failed to claim pending rewards:', e);
        }
        finally
        {
            this._claimInProgress = false;
        }
    }

    // Returns an Error explaining why these reward items can't be granted right now,
    // or null when they can. Checked before claiming so the reward stays pending on the
    // server instead of being consumed by a game that can't receive it.
    getRewardGrantBlocker(items)
    {
        var superMinerItemCount = 0;
        for(var k = 0; k < items.length; k++)
        {
            if(items[k].type !== "super_miner") continue;
            superMinerItemCount++;
            // A promo miner added after this build shipped has no local definition, so
            // claiming it would consume the reward and grant nothing.
            if(!superMinerManager.getSuperMinerBySlug(items[k].value))
            {
                return new UnsupportedRewardError();
            }
        }
        if(superMinerItemCount > 0)
        {
            if(!superMinerManager.isBuildingUnlocked())
            {
                return new SuperMinerNotUnlockedError();
            }
            if(superMinerItemCount > superMinerManager.slots - superMinerManager.numSuperMiners())
            {
                return new SuperMinerSlotsFullError();
            }
        }
        return null;
    }

    async claimSingleReward(reward)
    {
        if(this._claimedRewardIds.has(reward.id))
        {
            console.warn('Reward already claimed this session:', reward.id);
            return { label: '', message: null, alreadyClaimed: true };
        }

        // Pre-claim validation: leave the reward pending on the server when it can't be
        // granted yet, so the player can retry once the game can actually receive it.
        // UI catch handlers detect these errors to close the rewards screen before
        // alerting (otherwise the alert renders behind the DOM overlay).
        if(reward.rewards && reward.rewards.length > 0)
        {
            var blocker = this.getRewardGrantBlocker(reward.rewards);
            if(blocker)
            {
                throw blocker;
            }
        }

        this._claimedRewardIds.add(reward.id);

        var claimed;
        try
        {
            claimed = await Playsaurus.pendingRewards.claim(reward.id);
        }
        catch(e)
        {
            if(!(e instanceof Playsaurus.PlaysaurusConflictError))
            {
                this._claimedRewardIds.delete(reward.id);
            }
            throw e;
        }

        // Server confirmed the claim — grant rewards locally.
        // Each item is granted individually so one failure doesn't block the rest.
        var labels = [];
        for(var j = 0; j < claimed.rewards.length; j++)
        {
            var item = claimed.rewards[j];
            try
            {
                if(item.type === "super_miner")
                {
                    var baseMiner = superMinerManager.getSuperMinerBySlug(item.value);
                    if(baseMiner)
                    {
                        superMinerManager.addSuperMiner(baseMiner);
                        savegame("pending_reward_super_miner");
                        openUi(SuperMinerBlackWindow, null, baseMiner, true);
                    }
                    else
                    {
                        console.error('Unknown super miner slug in pending reward:', item.value);
                    }
                }
                else
                {
                    grantRewardByType(item.type, item.value);
                }
            }
            catch(grantError)
            {
                console.error('Failed to grant reward item:', item.type, item.value, grantError);
            }
            if(item.displayLabel)
            {
                labels.push(item.displayLabel);
            }
        }
        return {
            label: labels.join(', '),
            message: claimed.message || null
        };
    }

    async claimRewards(rewards)
    {
        if(!isSaveFileLoaded())
        {
            return [];
        }
        if(this._claimInProgress)
        {
            console.warn('Claim already in progress, ignoring claimRewards call');
            return [];
        }

        this._claimInProgress = true;
        try
        {
            var allResults = [];
            var skippedSlotsFull = 0;
            var skippedNotUnlocked = 0;
            var skippedUnsupported = 0;
            for(var i = 0; i < rewards.length; i++)
            {
                try
                {
                    var result = await this.claimSingleReward(rewards[i]);
                    if(!result.alreadyClaimed)
                    {
                        allResults.push(result);
                    }
                }
                catch(e)
                {
                    if(e instanceof SuperMinerSlotsFullError) skippedSlotsFull++;
                    if(e instanceof SuperMinerNotUnlockedError) skippedNotUnlocked++;
                    if(e instanceof UnsupportedRewardError) skippedUnsupported++;
                    console.error('Failed to claim reward:', rewards[i].id, e);
                }
            }
            await this.fetchPendingRewards();
            allResults.skippedSlotsFull = skippedSlotsFull;
            allResults.skippedNotUnlocked = skippedNotUnlocked;
            allResults.skippedUnsupported = skippedUnsupported;
            return allResults;
        }
        finally
        {
            this._claimInProgress = false;
        }
    }

    async showPendingRewardsOnLoad()
    {
        if(!this.isLoggedIn() || !isSaveFileLoaded() || !this.isEmailVerifiedCached())
        {
            return;
        }
        var result = await this.fetchPendingRewards();
        if(!result || result.rewards.length === 0)
        {
            return;
        }
        if(typeof window.showPendingRewardsScreen === 'function')
        {
            window.showPendingRewardsScreen();
        }
    }

    // EVENT LOGGING

    logEvent(eventName, eventData)
    {
        if(!isSimulating)
        {
            try
            {
                eventData = this.appendCommonEventData(eventData);
                Playsaurus.analytics.sendEvent(eventName, eventData);
            }
            catch(e)
            {
                this.handleError(e);
            }
        }
    }

    appendCommonEventData(eventData)
    {
        eventData.current_depth = depth;
        eventData.playtime = playtime;
        return eventData;
    }

    // Events are queued and sent on a debounce, so anything logged right before the
    // page goes away is lost with it. Call this to push the queue out immediately.
    // The caller owns the timeout: tracking must never keep the game from moving on.
    async flushEvents()
    {
        try
        {
            await Playsaurus.analytics.flush();
        }
        catch(e)
        {
            this.handleError(e);
        }
    }

    logPremiumCurrencySpent(ticketPrice, category, subtype)
    {
        this.logEvent(
            "premium_currency_spent",
            {
                ticket_price: ticketPrice,
                category: category,
                subtype: subtype
            }
        )
    }

    logPremiumCurrencyGained(addedTickets, source)
    {
        this.logEvent(
            "premium_currency_gained",
            {
                amount: addedTickets,
                from: source
            }
        )
    }

    logInAppPurchase(sku, amount, currency, usdAmount = 0)
    {
        this.logEvent(
            "in_app_purchase_completed",
            {
                sku: sku,
                usd_amount: usdAmount,
                amount: amount,
                currency: currency,
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
    }

    logPurchaseWindowViewed()
    {
        this.setEventSessionId("purchase");
        this.logEvent(
            "purchase_window_opened",
            {
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
    }

    logStartedPurchase(sku)
    {
        this.logEvent(
            "purchase_started",
            {
                sku: sku,
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
    }

    logCanceledPurchase(sku)
    {
        this.logEvent(
            "purchase_canceled",
            {
                sku: sku,
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
        this.clearEventSessionId("purchase");
    }

    logViewedOffer(sku)
    {
        this.setEventSessionId("purchase");
        this.logEvent(
            "offer_viewed",
            {
                sku: sku,
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
    }

    logFirstPurchase(sku, amount, currency, usdAmount)
    {
        this.logEvent(
            "first_purchase_completed",
            {
                sku: sku,
                usd_amount: usdAmount,
                amount: amount,
                currency: currency,
                purchase_session_id: this.getEventSessionId("purchase")
            }
        )
    }

    logDepthReached(newDepth)
    {
        this.logEvent(
            "depth_reached",
            {
                depth: newDepth
            }
        )
    }

    logBlackChestOpened(superMinerId, superMinerRarity, superMinerSoulsAmount)
    {
        this.logEvent(
            "black_chest_opened",
            {
                super_miner_id: superMinerId,
                super_miner_rarity: superMinerRarity,
                super_miner_souls_amount: superMinerSoulsAmount,
            }
        )
    }

    logOrangeFishCollected(atDepth)
    {
        this.logEvent(
            "orange_fish_found",
            {
                depth: atDepth
            }
        )
    }

    logDrillUpgrade(upgradedPartIndex, newPartLevel, wattagePercentChange, cargoPercentChange)
    {
        this.logEvent(
            "drill_upgraded",
            {
                upgraded_part_index: upgradedPartIndex,
                new_part_level: newPartLevel,
                wattage_percent_change: wattagePercentChange,
                cargo_percent_change: cargoPercentChange
            }
        )
    }

    logMinerPurchase(world, newCount, newLevel)
    {
        this.logEvent(
            "miner_upgrade_purchased",
            {
                world: world,
                new_miner_count: newCount,
                new_miner_level: newLevel
            }
        )
    }

    logStructureUpgrade(structureId, newLevel)
    {
        this.logEvent(
            "structure_upgraded",
            {
                structure_id: structureId,
                new_level: newLevel
            }
        )
    }

    logExcavationStarted(scientistRarity, scientistLevel, deathChance, rewardId, duration)
    {
        this.logEvent(
            "excavation_started",
            {
                scientist_rarity: scientistRarity,
                scientist_level: scientistLevel,
                death_chance: deathChance,
                reward_id: rewardId,
                duration: duration
            }
        )
    }

    logCaveStarted(caveDepth)
    {
        this.logEvent(
            "cave_started",
            {
                cave_depth: caveDepth,
                total_caves_explored: numberOfCavesExplored
            }
        )
    }

    logQuestCompleted(questId)
    {
        this.logEvent(
            "quest_completed",
            {
                quest_id: questId
            }
        )
    }

    logRedeemedCode(code)
    {
        this.logEvent(
            "code_redeemed",
            {
                code: code
            }
        )
    }

    logAdLoaded(loadDuration, networkName, revenue, trackingDisabled)
    {
        this.setEventSessionId("ad");
        this.logEvent(
            "ad_loaded",
            {
                load_duration: loadDuration,
                ad_session_id: this.getEventSessionId("ad"),
                network: networkName,
                revenue: revenue,
                tracking_disabled: trackingDisabled
            }
        )
    }

    logAdStarted(networkName, revenue, trackingDisabled, placementId)
    {
        this.logEvent(
            "ad_started",
            {
                ad_session_id: this.getEventSessionId("ad"),
                network: networkName,
                revenue: revenue,
                tracking_disabled: trackingDisabled,
                placement: placementId
            }
        )
    }

    logAdCompleted(watchDuration, networkName, revenue, trackingDisabled, placementId)
    {
        this.logEvent(
            "ad_completed",
            {
                completion_duration: watchDuration,
                ad_session_id: this.getEventSessionId("ad"),
                network: networkName,
                revenue: revenue,
                tracking_disabled: trackingDisabled,
                placement: placementId
            }
        );
        this.clearEventSessionId("ad");
    }

    logAdError(errorCode, networkName, revenue, trackingDisabled, placementId = null)
    {
        this.logEvent(
            "ad_failed",
            {
                error_code: errorCode,
                ad_session_id: this.getEventSessionId("ad"),
                network: networkName,
                revenue: revenue,
                tracking_disabled: trackingDisabled,
                placement: placementId
            }
        )
        this.clearEventSessionId("ad");
    }

    logClickedCommunityButton()
    {
        this.logEvent(
            "community_button_clicked",
            {}
        )
    }

    logImportedSaveFile()
    {
        this.logEvent(
            "game_imported",
            {}
        )
    }

    logExportedSaveFile()
    {
        this.logEvent(
            "game_exported",
            {}
        )
    }

    logSaveLoadError(errorType, message, initiator)
    {
        this.logEvent(
            "save_load_failed",
            {
                error_type: errorType,
                error_message: message,
                save_load_initiator: initiator,
                time_since_last_play: timeSinceLastPlay()
            }
        )
    }

    handleError(error)
    {
        if(error instanceof Playsaurus.PlaysaurusNetworkError)
        {
            this.errorHandler.handle(error);
        }
        else
        {
            throw error;
        }
    }
}

const playsaurusSdk = new PlaysaurusSdk();