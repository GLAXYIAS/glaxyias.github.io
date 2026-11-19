class SteamApi {
    module = require("steamworks.js");
    api = null;
    appId = null;

    init(appId) {
        // Remember the appId so a failed init (e.g. a launch-time race with the
        // Steam client) can be retried later instead of poisoning the session.
        if (appId != null) {
            this.appId = appId;
        }
        try {
            this.api = this.module.init(this.appId);
        }
        catch (e) {
            // SteamAPI_Init can transiently throw at launch if the Steam client
            // pipe isn't ready yet. Leave api null so we can retry instead of
            // hard-failing for the whole session.
            this.api = null;
            console.error("Steam API init failed (will retry):", e);
        }
        return this.api;
    }

    isInitialized() {
        return this.api != null;
    }

    isSteamRunning() {
        return true;
    }

    isCloudEnabled() {
        if (!this.api) {
            return false;
        }
        return this.api.cloud.isEnabledForApp();
    }

    isCloudEnabledForUser() {
        if (!this.api) {
            return false;
        }
        return this.api.cloud.isEnabledForAccount();
    }

    getSteamId() {
        if (!this.api) {
            return null;
        }
        return this.api.localplayer.getSteamId();
    }

    getAppBuildId() {
        if (!this.api) {
            return null;
        }
        return this.api.apps.appBuildId();
    }

    getIPCountry() {
        if (!this.api) {
            return null;
        }
        return this.api.localplayer.getIpCountry();
    }

    getCurrentGameLanguage() {
        if (!this.api) {
            return "";
        }
        return this.api.apps.currentGameLanguage();
    }

    getAchievementName() {
        return [];
    }

    activateAchievement(achievementId) {
        this.api.achievement.activate(achievementId);
    }

    activateGameOverlay(targetDialogue) {
        this.api.overlay.activateDialog(this.api.overlay.Dialog[targetDialogue]);
    }

    readTextFromFile(saveBackupFileName, onSuccess, onError) {
        var response = "";
        try {
            response = this.api.cloud.readFile(saveBackupFileName);
            onSuccess(response);
        }
        catch (e) {
            onError(e);
        }
    }

    saveTextToFile(filename, content, onSuccess, onError) {
        var response = "";
        try {
            response = this.api.cloud.writeFile(filename, content)
            onSuccess(response);
        }
        catch (e) {
            onError(e);
        }
    }

    registerPurchaseCallback(purchaseCallback) {
        try {
            this.api.callback.register(this.api.callback.SteamCallback.MicroTxnAuthorizationResponse, purchaseCallback);
        }
        catch (error) {
            console.error(error);
        }
    }
}