/**
 * CloudSaveManager - Handles cloud save backup with Playsaurus servers
 *
 * Features:
 * - Automatically backup saves to Playsaurus cloud when saving locally
 * - Download and restore saves on new devices after login
 * - Version validation to prevent loading saves from newer game versions
 * - Non-blocking upload queue with offline support
 * - Conflict resolution for local vs cloud saves
 *
 * This does NOT replace or interfere with the existing Steam Cloud backup system.
 */
class CloudSaveManager
{
    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    static SYNC_STATUS = {
        IDLE: 'idle',
        SYNCING: 'syncing',
        SUCCESS: 'success',
        ERROR: 'error',
        OFFLINE: 'offline'
    };

    static MAX_RETRY_ATTEMPTS = 3;
    static UPLOAD_QUEUE_KEY = 'cloudSaveUploadQueue';
    static SAVE_ID_MAPPING_KEY = 'cloudSaveIdMapping';

    // =========================================================================
    // STATE
    // =========================================================================

    isEnabled = false;
    isSyncing = false;
    syncStatus = CloudSaveManager.SYNC_STATUS.IDLE;
    lastSyncTime = 0;
    lastSyncError = null;

    // Upload queue for offline support
    pendingUploads = [];

    // Cache of cloud saves (fetched from server)
    cloudSaveCache = new Map();

    // Maps local save names to cloud save IDs
    saveIdMapping = new Map();

    // Callbacks for UI updates
    onSyncStatusChanged = null;
    onCloudSavesUpdated = null;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    constructor()
    {
        this.loadPersistedState();
        this.setupEventListeners();
    }

    /**
     * Initialize the cloud save manager.
     * Should be called after Playsaurus SDK is initialized and user may be logged in.
     */
    initialize()
    {
        console.log('[CloudSaveManager] Initializing...');

        this.isEnabled = this.isUserEligible();

        if(this.isEnabled)
        {
            console.log('[CloudSaveManager] Cloud saves enabled for user');
            this.processUploadQueue();
        }
        else
        {
            console.log('[CloudSaveManager] Cloud saves not available (user not logged in or SDK not ready)');
        }

        return this.isEnabled;
    }

    /**
     * Re-check eligibility (call after login)
     */
    refresh()
    {
        const wasEnabled = this.isEnabled;
        this.isEnabled = this.isUserEligible();

        if(this.isEnabled && !wasEnabled)
        {
            console.log('[CloudSaveManager] Cloud saves now enabled');
            this.processUploadQueue();
        }

        return this.isEnabled;
    }

    /**
     * Check if the user can use cloud saves.
     * Requires: Playsaurus SDK initialized + user logged in.
     */
    isUserEligible()
    {
        try
        {
            if(typeof Playsaurus === 'undefined')
            {
                return false;
            }

            if(!Playsaurus.isInitialized)
            {
                return false;
            }

            if(!Playsaurus.auth.isLoggedIn)
            {
                return false;
            }

            if(typeof playsaurusSdk !== 'undefined' && !playsaurusSdk.isEmailVerifiedCached())
            {
                return false;
            }

            return true;
        }
        catch(e)
        {
            console.warn('[CloudSaveManager] Error checking eligibility:', e);
            return false;
        }
    }

    loadPersistedState()
    {
        try
        {
            const queueData = localStorage.getItem(CloudSaveManager.UPLOAD_QUEUE_KEY);
            if(queueData)
            {
                this.pendingUploads = JSON.parse(queueData);
                console.log(`[CloudSaveManager] Loaded ${this.pendingUploads.length} pending uploads from storage`);
            }

            const mappingData = localStorage.getItem(CloudSaveManager.SAVE_ID_MAPPING_KEY);
            if(mappingData)
            {
                const mappings = JSON.parse(mappingData);
                this.saveIdMapping = new Map(Object.entries(mappings));
            }
        }
        catch(e)
        {
            console.warn('[CloudSaveManager] Failed to load persisted state:', e);
            this.pendingUploads = [];
            this.saveIdMapping = new Map();
        }
    }

    persistState()
    {
        try
        {
            localStorage.setItem(
                CloudSaveManager.UPLOAD_QUEUE_KEY,
                JSON.stringify(this.pendingUploads)
            );

            const mappingObj = Object.fromEntries(this.saveIdMapping);
            localStorage.setItem(CloudSaveManager.SAVE_ID_MAPPING_KEY, JSON.stringify(mappingObj));
        }
        catch(e)
        {
            console.warn('[CloudSaveManager] Failed to persist state:', e);
        }
    }

    setupEventListeners()
    {
        window.addEventListener('online', () =>
        {
            console.log('[CloudSaveManager] Network online - processing queue');
            if(this.isEnabled)
            {
                this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.IDLE);
                this.processUploadQueue();
            }
        });

        window.addEventListener('offline', () =>
        {
            console.log('[CloudSaveManager] Network offline');
            this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.OFFLINE);
        });

        if(typeof Playsaurus !== 'undefined' && Playsaurus.authTokenChanged)
        {
            Playsaurus.authTokenChanged.add(() =>
            {
                this.onAuthChanged();
            });
        }
    }

    onAuthChanged()
    {
        const wasEnabled = this.isEnabled;
        this.isEnabled = this.isUserEligible();

        if(this.isEnabled && !wasEnabled)
        {
            console.log('[CloudSaveManager] User logged in - enabling cloud saves');
            this.processUploadQueue();
        }
        else if(!this.isEnabled && wasEnabled)
        {
            console.log('[CloudSaveManager] User logged out - disabling cloud saves');
            // Clear all account-specific data to prevent cross-account uploads
            this.cloudSaveCache.clear();
            this.pendingUploads = [];
            this.saveIdMapping.clear();
            this.persistState();
            this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.IDLE);
        }
    }

    // =========================================================================
    // SYNC STATUS
    // =========================================================================

    updateSyncStatus(status, error = null)
    {
        this.syncStatus = status;
        this.lastSyncError = error;

        if(status === CloudSaveManager.SYNC_STATUS.SUCCESS)
        {
            this.lastSyncTime = Date.now();
        }

        if(this.onSyncStatusChanged)
        {
            this.onSyncStatusChanged(status, error);
        }
    }

    /**
     * @deprecated Use getStatus() instead for better formatted output
     */
    getSyncStatusInfo()
    {
        return this.getStatus();
    }

    // =========================================================================
    // UPLOAD QUEUE (Non-blocking backup on save)
    // =========================================================================

    /**
     * Queue a save for cloud backup. Called from savegame() after saving locally.
     */
    queueUpload(saveName)
    {
        if(!this.isEnabled)
        {
            return;
        }

        // Dedupe: only keep the latest version of each save in queue
        this.pendingUploads = this.pendingUploads.filter(item => item.saveName !== saveName);
        this.pendingUploads.push({
            saveName: saveName,
            timestamp: Date.now(),
            retries: 0
        });

        this.persistState();
        console.log(`[CloudSaveManager] Queued upload for: ${saveName}`);

        if(navigator.onLine && !this.isSyncing)
        {
            this.processUploadQueue();
        }
    }

    /**
     * Process pending uploads. Called automatically when online or after queueing.
     */
    async processUploadQueue()
    {
        if(!this.isEnabled || this.isSyncing || !navigator.onLine)
        {
            return;
        }

        if(this.pendingUploads.length === 0)
        {
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.SYNCING);

        console.log(`[CloudSaveManager] Processing ${this.pendingUploads.length} pending uploads`);

        const failedUploads = [];

        while(this.pendingUploads.length > 0)
        {
            const item = this.pendingUploads[0];

            try
            {
                await this.uploadSave(item.saveName);
                this.pendingUploads.shift();
                this.persistState();
                console.log(`[CloudSaveManager] Successfully uploaded: ${item.saveName}`);
            }
            catch(error)
            {
                console.error(`[CloudSaveManager] Upload failed for ${item.saveName}:`, error);

                // If auth expired or email not verified, stop processing but preserve queue
                if(!this.isEnabled || (typeof Playsaurus !== 'undefined' &&
                    (error instanceof Playsaurus.PlaysaurusUnauthorizedError ||
                     error instanceof Playsaurus.PlaysaurusForbiddenError)))
                {
                    console.warn('[CloudSaveManager] Auth/permission issue - preserving queue for later');
                    this.persistState();
                    break;
                }

                if(!navigator.onLine)
                {
                    this.persistState();
                    break;
                }

                item.retries++;

                if(item.retries >= CloudSaveManager.MAX_RETRY_ATTEMPTS)
                {
                    console.warn(`[CloudSaveManager] Max retries reached for ${item.saveName}, removing from queue`);
                    this.pendingUploads.shift();
                    failedUploads.push(item);
                }
                else
                {
                    this.pendingUploads.shift();
                    this.pendingUploads.push(item);
                }

                this.persistState();
            }
        }

        this.isSyncing = false;

        if(failedUploads.length > 0)
        {
            this.updateSyncStatus(
                CloudSaveManager.SYNC_STATUS.ERROR,
                _('Failed to backup {0} save(s)', failedUploads.length)
            );
            this.logCloudSaveEvent('upload_failed', {count: failedUploads.length});
        }
        else if(this.pendingUploads.length === 0)
        {
            this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.SUCCESS);
        }
    }

    // =========================================================================
    // UPLOAD IMPLEMENTATION
    // =========================================================================

    async uploadSave(saveName)
    {
        const saveData = localStorage.getItem(saveName);
        if(!saveData)
        {
            throw new Error(`Save not found in localStorage: ${saveName}`);
        }

        const saveInfo = this.buildSaveInfo(saveName, saveData);
        let existingCloudId = this.saveIdMapping.get(saveName) || -1;

        // If no local mapping, check server for an existing save with the same name
        // to prevent duplicates when uploading from different devices
        if(existingCloudId === -1)
        {
            try
            {
                const cloudSaves = await Playsaurus.cloudSaves.getAll();
                for(const existing of cloudSaves)
                {
                    const existingName = (existing.metadata || {}).save_name || (existing.filename ? existing.filename.replace('.dat', '') : '');
                    if(existingName === saveName)
                    {
                        existingCloudId = existing.id;
                        console.log(`[CloudSaveManager] Found existing cloud save by name: ${existingCloudId}`);
                        break;
                    }
                }
            }
            catch(e)
            {
                console.warn('[CloudSaveManager] Failed to check for existing cloud saves:', e);
            }
        }

        let cloudSave;
        try
        {
            if(existingCloudId === -1)
            {
                cloudSave = await Playsaurus.cloudSaves.create(saveInfo);
                console.log(`[CloudSaveManager] Created new cloud save: ${cloudSave.id}`);
                this.logCloudSaveEvent('created', {saveName: saveName});
            }
            else
            {
                cloudSave = await Playsaurus.cloudSaves.updateOrCreate(existingCloudId, saveInfo);
                if(cloudSave.id === existingCloudId)
                {
                    console.log(`[CloudSaveManager] Updated cloud save: ${cloudSave.id}`);
                    this.logCloudSaveEvent('updated', {saveName: saveName});
                }
                else
                {
                    console.log(`[CloudSaveManager] Created new cloud save (old not found): ${cloudSave.id}`);
                    this.logCloudSaveEvent('created', {saveName: saveName});
                }
            }

            this.saveIdMapping.set(saveName, cloudSave.id);
            this.persistState();
            this.cloudSaveCache.set(saveName, cloudSave);

            return cloudSave;
        }
        catch(error)
        {
            if(error instanceof Playsaurus.PlaysaurusUnauthorizedError)
            {
                this.isEnabled = false;
                this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.ERROR, _('Authentication expired'));
            }
            else if(error instanceof Playsaurus.PlaysaurusForbiddenError)
            {
                this.isEnabled = false;
                this.updateSyncStatus(CloudSaveManager.SYNC_STATUS.ERROR, _('Please verify your email to use cloud saves'));
            }
            throw error;
        }
    }

    buildSaveInfo(saveName, saveData)
    {
        const metadata = this.extractSaveMetadata(saveName, saveData);
        const compressedData = this.compressSaveData(saveData);

        return {
            playTime: metadata.playtime || 0,
            startedAt: metadata.uid || Date.now(),
            fileName: saveName + '.dat',
            file: new Blob([compressedData], {type: 'application/octet-stream'}),
            metadata: {
                save_name: saveName,
                depth: metadata.depth || 0,
                money: metadata.money || '$0',
                tickets: metadata.tickets || 0,
                local_timestamp: Date.now(),
                platform: platformName(),
                patch_letter: typeof patchLetter !== 'undefined' ? patchLetter : '',
                encoding: 'gzip'
            }
        };
    }

    /**
     * Extract metadata from save data for display purposes.
     * Field indices based on registerVariablesToSave() order:
     * 0 = money, 1 = depth, 3 = UID, 9 = oldversion, 81 = playtime, 115 = tickets, 134 = savetime
     */
    extractSaveMetadata(saveName, saveData)
    {
        try
        {
            const decodedOnce = b64_to_utf8(saveData);
            const decodedTwice = b64_to_utf8(decodedOnce);
            const fields = decodedTwice.split('|');

            return {
                depth: parseInt(fields[1]) || 0,
                money: '$' + beautifynum(new BigNumber(fields[0] || 0)),
                playtime: parseInt(fields[81]) || 0,
                version: parseInt(fields[9]) || 0,
                uid: parseInt(fields[3]) || 0,
                tickets: parseInt(fields[115]) || 0,
                savetime: parseInt(fields[134]) || 0
            };
        }
        catch(e)
        {
            console.warn('[CloudSaveManager] Failed to extract save metadata:', e);
            return {depth: 0, money: '$0', playtime: 0, version: 0, uid: 0, tickets: 0, savetime: 0};
        }
    }

    compressSaveData(saveData)
    {
        return pako.gzip(saveData);
    }

    async decompressSaveData(blob)
    {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        return pako.ungzip(uint8Array, {to: 'string'});
    }

    // =========================================================================
    // FETCH CLOUD SAVES (for new device restore)
    // =========================================================================

    async fetchCloudSaves()
    {
        if(!this.isUserEligible())
        {
            return [];
        }

        console.log('[CloudSaveManager] Fetching cloud saves from server...');

        try
        {
            const cloudSaves = await Playsaurus.cloudSaves.getAll();

            this.cloudSaveCache.clear();
            for(const save of cloudSaves)
            {
                const saveName = save.metadata?.save_name || save.filename.replace('.dat', '');
                this.cloudSaveCache.set(saveName, save);
                this.saveIdMapping.set(saveName, save.id);
            }

            this.persistState();

            console.log(`[CloudSaveManager] Fetched ${cloudSaves.length} cloud saves`);

            if(this.onCloudSavesUpdated)
            {
                this.onCloudSavesUpdated(cloudSaves);
            }

            return cloudSaves;
        }
        catch(error)
        {
            console.error('[CloudSaveManager] Failed to fetch cloud saves:', error);
            throw error;
        }
    }

    async getCloudSavesForDisplay()
    {
        const cloudSaves = await this.fetchCloudSaves();

        return cloudSaves.map(save =>
        {
            const meta = save.metadata || {};
            const canLoad = this.canLoadCloudSave(save);
            const parsed = this.parseGameVersion(save.gameVersion);
            const savePatchLetter = parsed.patchLetter || meta.patch_letter;
            const saveVersionNumber = parsed.versionNumber || 0;

            return {
                id: save.id,
                saveName: meta.save_name || save.filename.replace('.dat', ''),
                depth: meta.depth || 0,
                depthFormatted: (meta.depth || 0) + ' km',
                money: meta.money || '$0',
                tickets: meta.tickets || 0,
                ticketsFormatted: beautifynum(meta.tickets || 0),
                gameVersion: saveVersionNumber,
                gameVersionFormatted: this.formatVersionNumber(saveVersionNumber),
                patchLetter: savePatchLetter,
                versionDisplay: this.formatVersionDisplay(saveVersionNumber, savePatchLetter),
                playTime: save.playTime || 0,
                playTimeFormatted: this.formatPlayTime(save.playTime || 0),
                platform: meta.platform || 'unknown',
                platformFormatted: this.formatPlatformName(meta.platform),
                lastSaved: save.updatedAt,
                lastSavedFormatted: this.formatTimestamp(save.updatedAt),
                timeAgo: this.getTimeAgo(save.updatedAt?.getTime()),
                canLoad: canLoad.allowed,
                loadError: canLoad.allowed ? null : canLoad.message
            };
        });
    }

    formatPlatformName(platform)
    {
        const names = {
            'steam': 'Steam',
            'desktop': 'Desktop',
            'web': 'Web',
            'android': 'Android',
            'ios': 'iOS'
        };
        return names[platform] || platform || 'Unknown';
    }

    // =========================================================================
    // VERSION VALIDATION
    // =========================================================================

    /**
     * Get the major version number from a version code.
     * Formula: (version - 100) / 100
     * Example: version 146 -> 0.46
     * This may vary across platforms in the future.
     */
    getMajorVersion(versionNumber)
    {
        // Convert to number if it's a string
        const versionNum = typeof versionNumber === 'string' ? parseInt(versionNumber, 10) : versionNumber;

        // Check if it's a valid number
        if(!versionNum || isNaN(versionNum) || versionNum < 100)
        {
            return 0;
        }

        return (versionNum - 100) / 100;
    }

    /**
     * Parse the gameVersion string stored by the Playsaurus SDK.
     * The SDK stores gameVersion as "{version}{patchLetter}.{revision}" (e.g. "146I.5").
     * @param {string|number} gameVersion - Raw gameVersion from the API (e.g. "146I.5")
     * @returns {{versionNumber: number, patchLetter: string}}
     */
    parseGameVersion(gameVersion)
    {
        if(!gameVersion)
        {
            return {versionNumber: 0, patchLetter: ''};
        }

        const str = '' + gameVersion;
        const match = str.match(/^(\d+)([A-Za-z]?)/);
        if(!match)
        {
            return {versionNumber: 0, patchLetter: ''};
        }

        return {
            versionNumber: parseInt(match[1], 10) || 0,
            patchLetter: match[2] ? match[2].toUpperCase() : ''
        };
    }

    /**
     * Check if a cloud save version is compatible with the current game version.
     * Compares version numbers first, then patch letters if versions match.
     * If the cloud save has no patch letter (old save format), only version numbers are compared.
     * @param {number} cloudVersion - The cloud save's version number (e.g. 146)
     * @param {number} currentVersion - The current game version number (e.g. 146)
     * @param {string} cloudPatchLetter - The cloud save's patch letter (e.g. "I"), or empty string
     * @param {string} currentPatchLetter - The current game's patch letter (e.g. "I"), or empty string
     */
    isVersionCompatible(cloudVersion, currentVersion, cloudPatchLetter = '', currentPatchLetter = '')
    {
        const cloudMajor = this.getMajorVersion(cloudVersion);
        const currentMajor = this.getMajorVersion(currentVersion);

        if(cloudMajor !== currentMajor)
        {
            return cloudMajor <= currentMajor;
        }

        // Same version number - compare patch letters
        // If the cloud save has no patch letter, it's an old save format and is allowed
        if(!cloudPatchLetter)
        {
            return true;
        }

        // Both have patch letters - compare alphabetically
        if(currentPatchLetter)
        {
            return cloudPatchLetter <= currentPatchLetter;
        }

        return true;
    }

    /**
     * Format version for display, combining version number and patch letter.
     * Example: version=146, patchLetter="I" -> "146.I"
     * Example: version=146, patchLetter="" -> "146"
     */
    formatVersionDisplay(versionNumber, patchLetter)
    {
        if(!versionNumber || versionNumber === 0)
        {
            return typeof version !== 'undefined' ? (version + '') : _('Unknown');
        }

        if(patchLetter)
        {
            return versionNumber + '.' + patchLetter;
        }

        return '' + versionNumber;
    }

    /**
     * Format version number for display.
     * Example: 146 -> "v0.46"
     */
    formatVersionNumber(versionNumber)
    {
        const major = this.getMajorVersion(versionNumber);

        // Handle edge case where major is 0 or invalid
        if(major === 0)
        {
            return 'v0.00';
        }

        return 'v' + major.toFixed(2);
    }

    canLoadCloudSave(cloudSave)
    {
        // Parse the gameVersion string (e.g. "146I.5") to extract number and patch letter.
        // The SDK always writes gameVersion in this format, so this works for all saves.
        const parsed = this.parseGameVersion(cloudSave.gameVersion);
        const cloudVersion = parsed.versionNumber;
        // Prefer the letter parsed from gameVersion (stamped at SDK init, before any save is
        // loaded) over metadata.patch_letter, which can carry a stale letter restored from the save file
        const cloudPatchLetter = parsed.patchLetter || (cloudSave.metadata || {}).patch_letter;

        const currentVersion = typeof version !== 'undefined' ? version : 0;
        const currentPatchLetter = typeof patchLetter !== 'undefined' ? patchLetter : '';

        if(!this.isVersionCompatible(cloudVersion, currentVersion, cloudPatchLetter, currentPatchLetter))
        {
            return {
                allowed: false,
                reason: 'NEWER_VERSION',
                message: _('This save is from a newer version of the game. Please update before continuing')
            };
        }

        return {allowed: true};
    }

    // =========================================================================
    // DOWNLOAD & IMPORT (for new device restore)
    // =========================================================================

    async downloadAndImportCloudSave(cloudSaveId, targetSaveName = null)
    {
        console.log(`[CloudSaveManager] Downloading cloud save ID: ${cloudSaveId}`);

        try
        {
            const cloudSave = await Playsaurus.cloudSaves.get(cloudSaveId);

            const validation = this.canLoadCloudSave(cloudSave);
            if(!validation.allowed)
            {
                throw new Error(validation.message);
            }

            const fileBlob = await Playsaurus.cloudSaves.download(cloudSaveId);
            const saveData = await this.decompressSaveData(fileBlob);
            const saveName = targetSaveName || cloudSave.metadata?.save_name || 'CloudSave';

            const result = this.importSaveToLocal(saveName, saveData, cloudSave);

            console.log(`[CloudSaveManager] Successfully imported cloud save as: ${result.saveName}`);
            this.logCloudSaveEvent('downloaded', {saveName: result.saveName, cloudSaveId: cloudSaveId});

            return result;
        }
        catch(error)
        {
            console.error('[CloudSaveManager] Failed to download cloud save:', error);
            this.logCloudSaveEvent('download_failed', {cloudSaveId: cloudSaveId, error: error.message});
            throw error;
        }
    }

    importSaveToLocal(saveName, saveData, cloudSave = null)
    {
        if(!this.isValidSaveData(saveData))
        {
            throw new Error(_('The cloud save data is corrupted or invalid.'));
        }

        const existingSaves = localStorage.getItem('R') || '';
        const saveNames = existingSaves.split('|').filter(s => s !== '');
        const saveExists = saveNames.includes(saveName);

        if(!saveExists && saveNames.length >= 3)
        {
            throw new Error(_('You already have 3 saves. Please delete one before importing.'));
        }

        if(saveExists)
        {
            console.log(`[CloudSaveManager] Overwriting existing save: ${saveName}`);
        }

        // Store directly - saveData from decompression is already in correct format
        localStorage.setItem(saveName, saveData);

        if(!saveExists)
        {
            const newRegistry = saveName + '|' + existingSaves;
            localStorage.setItem('R', newRegistry);
        }

        if(cloudSave)
        {
            this.saveIdMapping.set(saveName, cloudSave.id);
            this.persistState();
        }

        return {
            saveName: saveName,
            isNew: !saveExists,
            cloudSaveId: cloudSave?.id
        };
    }

    isValidSaveData(saveData)
    {
        try
        {
            if(!saveData || saveData.length === 0)
            {
                return false;
            }

            // Save data is double base64 encoded
            const decodedOnce = b64_to_utf8(saveData);
            if(decodedOnce.length === 0)
            {
                return false;
            }

            const decodedTwice = b64_to_utf8(decodedOnce);
            if(decodedTwice.length === 0)
            {
                return false;
            }

            const fields = decodedTwice.split('|');
            if(fields.length < 10)
            {
                return false;
            }

            const saveVersion = fields[9];
            if(isNaN(parseInt(saveVersion)))
            {
                return false;
            }

            return true;
        }
        catch(e)
        {
            return false;
        }
    }

    // =========================================================================
    // DELETE CLOUD SAVE
    // =========================================================================

    async deleteCloudSave(saveName)
    {
        const cloudSaveId = this.saveIdMapping.get(saveName);
        if(!cloudSaveId)
        {
            console.log(`[CloudSaveManager] No cloud save found for: ${saveName}`);
            return false;
        }

        try
        {
            await Playsaurus.cloudSaves.delete(cloudSaveId);

            this.saveIdMapping.delete(saveName);
            this.cloudSaveCache.delete(saveName);
            this.persistState();

            console.log(`[CloudSaveManager] Deleted cloud save: ${saveName}`);
            this.logCloudSaveEvent('deleted', {saveName: saveName});
            return true;
        }
        catch(error)
        {
            console.error(`[CloudSaveManager] Failed to delete cloud save:`, error);
            throw error;
        }
    }

    async deleteCloudSaveById(cloudSaveId)
    {
        try
        {
            await Playsaurus.cloudSaves.delete(cloudSaveId);

            for(const [saveName, id] of this.saveIdMapping.entries())
            {
                if(id === cloudSaveId)
                {
                    this.saveIdMapping.delete(saveName);
                    this.cloudSaveCache.delete(saveName);
                    break;
                }
            }
            this.persistState();

            console.log(`[CloudSaveManager] Deleted cloud save ID: ${cloudSaveId}`);
            return true;
        }
        catch(error)
        {
            console.error(`[CloudSaveManager] Failed to delete cloud save:`, error);
            throw error;
        }
    }

    // =========================================================================
    // SYNC ALL (backup all local saves)
    // =========================================================================

    async syncAllSaves()
    {
        if(!this.isEnabled)
        {
            console.log('[CloudSaveManager] Cannot sync - not enabled');
            return false;
        }

        const saveNames = getAllSaveNames();
        if(!saveNames || saveNames.length === 0)
        {
            console.log('[CloudSaveManager] No saves to sync');
            return true;
        }

        console.log(`[CloudSaveManager] Queueing ${saveNames.length} saves for cloud backup`);

        for(const saveName of saveNames)
        {
            this.queueUpload(saveName);
        }

        await this.processUploadQueue();
        return true;
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    formatTimestamp(timestamp)
    {
        if(!timestamp)
        {
            return _('Unknown');
        }

        try
        {
            const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
            return date.toLocaleString();
        }
        catch(e)
        {
            return _('Unknown');
        }
    }

    formatPlayTime(seconds)
    {
        if(!seconds || seconds <= 0)
        {
            return '0m';
        }

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        let result = '';
        if(days > 0)
        {
            result += days + 'd ';
        }
        if(hours > 0 || days > 0)
        {
            result += hours + 'h ';
        }
        result += mins + 'm';

        return result.trim();
    }

    getTimeAgo(timestamp)
    {
        if(!timestamp)
        {
            return '';
        }

        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if(seconds < 60)
        {
            return _('Just now');
        }
        if(seconds < 3600)
        {
            const mins = Math.floor(seconds / 60);
            return _("{0} min ago", mins);
        }
        if(seconds < 86400)
        {
            const hours = Math.floor(seconds / 3600);
            return _("{0} hour(s) ago", hours);
        }

        const days = Math.floor(seconds / 86400);
        return _("{0} day(s) ago", days);
    }

    async hasCloudSaves()
    {
        if(!this.isUserEligible())
        {
            return false;
        }

        try
        {
            const saves = await this.fetchCloudSaves();
            return saves.length > 0;
        }
        catch(e)
        {
            return false;
        }
    }

    getCachedCloudSave(saveName)
    {
        return this.cloudSaveCache.get(saveName) || null;
    }

    getCloudSaveId(saveName)
    {
        return this.saveIdMapping.get(saveName) || null;
    }

    logCloudSaveEvent(eventName, data = {})
    {
        if(typeof playsaurusSdk !== 'undefined' && playsaurusSdk.logEvent)
        {
            playsaurusSdk.logEvent('cloud_save_' + eventName, data);
        }
    }

    // =========================================================================
    // CONFLICT RESOLUTION
    // =========================================================================

    compareLocalAndCloudSave(localSaveName, cloudSave)
    {
        const cloudPlayTime = cloudSave.playTime || 0;
        const parsedCloudVersion = this.parseGameVersion(cloudSave.gameVersion);
        const cloudSavePatchLetter = cloudSave.patchLetter || parsedCloudVersion.patchLetter || (cloudSave.metadata || {}).patch_letter;
        const cloudInfo = {
            saveName: cloudSave.saveName || cloudSave.metadata?.save_name || (cloudSave.filename ? cloudSave.filename.replace('.dat', '') : 'Unknown'),
            playTime: cloudPlayTime,
            playTimeFormatted: cloudSave.playTimeFormatted || this.formatPlayTime(cloudPlayTime),
            depth: cloudSave.depth || cloudSave.metadata?.depth || 0,
            depthFormatted: cloudSave.depthFormatted || ((cloudSave.depth || cloudSave.metadata?.depth || 0) + ' km'),
            money: cloudSave.money || cloudSave.metadata?.money || '$0',
            tickets: cloudSave.tickets || cloudSave.metadata?.tickets || 0,
            ticketsFormatted: beautifynum(cloudSave.tickets || cloudSave.metadata?.tickets || 0),
            platform: cloudSave.platform || cloudSave.metadata?.platform || 'unknown',
            platformFormatted: cloudSave.platformFormatted || this.formatPlatformName(cloudSave.platform || cloudSave.metadata?.platform),
            lastSaved: cloudSave.lastSaved || cloudSave.updatedAt,
            lastSavedFormatted: cloudSave.lastSavedFormatted || this.formatTimestamp(cloudSave.updatedAt),
            timeAgo: cloudSave.timeAgo || this.getTimeAgo(cloudSave.updatedAt?.getTime()),
            gameVersion: parsedCloudVersion.versionNumber || 0,
            patchLetter: cloudSavePatchLetter,
            versionDisplay: cloudSave.versionDisplay || this.formatVersionDisplay(parsedCloudVersion.versionNumber || 0, cloudSavePatchLetter)
        };

        const localSaveData = localStorage.getItem(localSaveName);
        if(!localSaveData)
        {
            return {
                hasConflict: false,
                recommendation: 'USE_CLOUD',
                reason: 'LOCAL_NOT_FOUND',
                comparison: {
                    local: null,
                    cloud: cloudInfo
                }
            };
        }

        const localMeta = this.extractSaveMetadata(localSaveName, localSaveData);
        const localPlayTime = localMeta.playtime || 0;
        const diffSeconds = cloudPlayTime - localPlayTime;

        const localVersion = typeof version !== 'undefined' ? version : 0;
        const localPatchLetter = typeof patchLetter !== 'undefined' ? patchLetter : '';
        const comparison = {
            local: {
                saveName: localSaveName,
                playTime: localPlayTime,
                playTimeFormatted: this.formatPlayTime(localPlayTime),
                depth: localMeta.depth || 0,
                depthFormatted: (localMeta.depth || 0) + ' km',
                money: localMeta.money || '$0',
                tickets: localMeta.tickets || 0,
                ticketsFormatted: beautifynum(localMeta.tickets || 0),
                gameVersion: localVersion,
                patchLetter: localPatchLetter,
                versionDisplay: this.formatVersionDisplay(localVersion, localPatchLetter)
            },
            cloud: cloudInfo,
            playTimeDiff: diffSeconds,
            playTimeDiffFormatted: this.formatPlayTime(Math.abs(diffSeconds))
        };

        // Check if depth or money differs (indicating different game states)
        const localDepth = localMeta.depth || 0;
        const cloudDepth = cloudInfo.depth || 0;
        const depthDiffers = localDepth !== cloudDepth;
        const moneyDiffers = localMeta.money !== cloudInfo.money;

        // If depth or money differs, always show conflict resolution
        if(depthDiffers || moneyDiffers)
        {
            return {
                hasConflict: true,
                recommendation: 'ASK_USER',
                reason: 'DIFFERENT_PROGRESS',
                comparison: comparison
            };
        }

        // If depth and money are the same, check playtime
        if(Math.abs(diffSeconds) <= 60)
        {
            return {
                hasConflict: false,
                recommendation: 'USE_LOCAL',
                reason: 'SAVES_EQUAL',
                comparison: comparison
            };
        }

        if(diffSeconds > 60)
        {
            return {
                hasConflict: true,
                recommendation: 'USE_CLOUD',
                reason: 'CLOUD_MORE_PROGRESS',
                comparison: comparison
            };
        }

        return {
            hasConflict: true,
            recommendation: 'ASK_USER',
            reason: 'LOCAL_MORE_PROGRESS',
            comparison: comparison
        };
    }

    async checkAllConflicts()
    {
        if(!this.isUserEligible())
        {
            return [];
        }

        const conflicts = [];

        await this.fetchCloudSaves();

        for(const [saveName, cloudSave] of this.cloudSaveCache)
        {
            const conflictInfo = this.compareLocalAndCloudSave(saveName, cloudSave);
            if(conflictInfo.hasConflict)
            {
                conflicts.push({
                    saveName: saveName,
                    cloudSaveId: cloudSave.id,
                    ...conflictInfo
                });
            }
        }

        return conflicts;
    }

    async resolveConflictUseCloud(cloudSaveId, localSaveName)
    {
        console.log(`[CloudSaveManager] Resolving conflict - using cloud save for: ${localSaveName}`);
        this.logCloudSaveEvent('conflict_resolved', {choice: 'cloud', saveName: localSaveName});

        return await this.downloadAndImportCloudSave(cloudSaveId, localSaveName);
    }

    async resolveConflictUseLocal(localSaveName)
    {
        console.log(`[CloudSaveManager] Resolving conflict - using local save for: ${localSaveName}`);
        this.logCloudSaveEvent('conflict_resolved', {choice: 'local', saveName: localSaveName});

        this.queueUpload(localSaveName);
        await this.processUploadQueue();

        return {saveName: localSaveName, source: 'local'};
    }

    // =========================================================================
    // UI HELPER METHODS
    // =========================================================================

    async listCloudSaves()
    {
        if(!this.isUserEligible())
        {
            return {
                success: false,
                error: _('Please log in to access cloud saves'),
                saves: []
            };
        }

        try
        {
            const saves = await this.getCloudSavesForDisplay();
            return {
                success: true,
                saves: saves,
                count: saves.length
            };
        }
        catch(error)
        {
            return {
                success: false,
                error: error.message || _('Failed to load cloud saves'),
                saves: []
            };
        }
    }

    async getCloudSaveDetails(cloudSaveId)
    {
        if(!this.isUserEligible())
        {
            return {
                success: false,
                error: _('Please log in to access cloud saves')
            };
        }

        try
        {
            const cloudSave = await Playsaurus.cloudSaves.get(cloudSaveId);
            const meta = cloudSave.metadata || {};
            const canLoad = this.canLoadCloudSave(cloudSave);

            return {
                success: true,
                save: {
                    id: cloudSave.id,
                    saveName: meta.save_name || cloudSave.filename.replace('.dat', ''),
                    depth: meta.depth || 0,
                    depthFormatted: (meta.depth || 0) + ' km',
                    money: meta.money || '$0',
                    tickets: meta.tickets || 0,
                    ticketsFormatted: beautifynum(meta.tickets || 0),
                    gameVersion: cloudSave.gameVersion || 0,
                    playTime: cloudSave.playTime || 0,
                    playTimeFormatted: this.formatPlayTime(cloudSave.playTime || 0),
                    platform: meta.platform || 'unknown',
                    platformFormatted: this.formatPlatformName(meta.platform),
                    lastSaved: cloudSave.updatedAt,
                    lastSavedFormatted: this.formatTimestamp(cloudSave.updatedAt),
                    timeAgo: this.getTimeAgo(cloudSave.updatedAt?.getTime()),
                    canLoad: canLoad.allowed,
                    loadError: canLoad.allowed ? null : canLoad.message
                }
            };
        }
        catch(error)
        {
            return {
                success: false,
                error: error.message || _('Failed to load cloud save details')
            };
        }
    }

    async importCloudSave(cloudSaveId, targetSaveName = null)
    {
        if(!this.isUserEligible())
        {
            return {
                success: false,
                error: _('Please log in to access cloud saves')
            };
        }

        try
        {
            const result = await this.downloadAndImportCloudSave(cloudSaveId, targetSaveName);
            return {
                success: true,
                saveName: result.saveName,
                isNew: result.isNew,
                message: result.isNew
                    ? _('Cloud save imported as new save: {0}', result.saveName)
                    : _('Cloud save restored to: {0}', result.saveName)
            };
        }
        catch(error)
        {
            return {
                success: false,
                error: error.message || _('Failed to import cloud save')
            };
        }
    }

    async removeCloudSave(cloudSaveId)
    {
        if(!this.isUserEligible())
        {
            return {
                success: false,
                error: _('Please log in to manage cloud saves')
            };
        }

        try
        {
            await this.deleteCloudSaveById(cloudSaveId);
            return {
                success: true,
                message: _('Cloud save deleted')
            };
        }
        catch(error)
        {
            return {
                success: false,
                error: error.message || _('Failed to delete cloud save')
            };
        }
    }

    async backupSaveToCloud(saveName)
    {
        // Refresh enabled state in case user logged in after initialization
        this.refresh();

        if(!this.isUserEligible())
        {
            return {
                success: false,
                error: _('Please log in to backup saves')
            };
        }

        if(!this.isEnabled)
        {
            return {
                success: false,
                error: _('Cloud saves not enabled')
            };
        }

        try
        {
            // Directly upload instead of using queue to avoid race condition
            await this.uploadSave(saveName);

            return {
                success: true,
                message: _('Save backed up to cloud')
            };
        }
        catch(error)
        {
            return {
                success: false,
                error: error.message || _('Failed to backup save')
            };
        }
    }

    getStatus()
    {
        return {
            isEnabled: this.isEnabled,
            isLoggedIn: this.isUserEligible(),
            isSyncing: this.isSyncing,
            syncStatus: this.syncStatus,
            pendingUploads: this.pendingUploads.length,
            lastSyncTime: this.lastSyncTime,
            lastSyncTimeFormatted: this.formatTimestamp(this.lastSyncTime),
            lastSyncTimeAgo: this.getTimeAgo(this.lastSyncTime),
            lastError: this.lastSyncError,
            isOnline: navigator.onLine
        };
    }
}

// =========================================================================
// GLOBAL INSTANCE
// =========================================================================

var cloudSaveManager = new CloudSaveManager();
