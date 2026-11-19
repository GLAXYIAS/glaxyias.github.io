const MINING_DISPLAY_TYPE_NONE = 0;
const MINING_DISPLAY_TYPE_CALCULATE = 1;
const MINING_DISPLAY_TYPE_FAKE = 2;

const SPEECH_BUBBLE_MIN_INTERVAL_MS = 10000;
const SPEECH_BUBBLE_MAX_INTERVAL_MS = 30000;

class WanderingSuperMinerRenderer {
    // CUSTOMIZABLE PROPERTIES

    // override default values set in worldConfig
    heightFraction;
    yOffset;
    leftBound;
    rightBound;

    // Vertical positioning within the level hitbox
    // "bottom" = sprite anchored at bottom of level (default, for floor walkers)
    // "top" = sprite anchored at top of level (for roof/ceiling walkers)
    verticalAnchor = "bottom";

    // Padding from the anchor point (as fraction of level height)
    // Default 0.1 means 10% padding from the anchor (floor or ceiling)
    anchorPadding = 0.1;

    flipHorizontal = false;

    minMiningTime = 5;
    maxMiningTime = 12;
    walkSpeed = 65;     // pixels per second

    drillingSpritesheet;
    walkingSpritesheet;

    // Optional: if set, this miner will randomly show a speech bubble with this text.
    // Leave unset to disable the bubble entirely for this miner.
    speechBubbleText;
    speechBubbleNextTimeMs;
    speechBubbleShownAtMs = -Infinity;
    speechBubbleYOffset = 0; // fraction of levelHeight; positive moves bubble down
    speechBubbleBold = false;

    // PRIVATE
    parent;
    facingRight = true;

    currentPos;
    targetPos;
    moveTime;
    currentStateTimer = 0;
    isWalking = false;
    hasStartedStateAnimation = false;
    miningDisplayType = MINING_DISPLAY_TYPE_NONE;
    mineralsFound = [];

    constructor(parent) {
        this.parent = parent;

        if (typeof (this.heightFraction) == "undefined") this.heightFraction = worldConfig.superMiners.height;
        if (typeof (this.yOffset) == "undefined") this.yOffset = worldConfig.superMiners.yOffset;
        if (typeof (this.leftBound) == "undefined") this.leftBound = worldConfig.superMiners.leftBound;
        if (typeof (this.rightBound) == "undefined") this.rightBound = worldConfig.superMiners.rightBound;

        this.currentPos = (this.rightBound - this.leftBound) * Math.random();
    }

    getSpritePosition() {
        let x = 0;
        let y = 0;
        let levelY = 0; // Top of the level hitbox for hitbox positioning
        let spriteWidth = worldConfig.levelHeight * this.heightFraction;

        if (isMobile()) {
            // On mobile, use the level hitbox's coordinate system for consistent positioning
            let levelHitbox = activeLayers.WorldLayer.getLevelHitbox(this.parent.currentDepth);
            if (levelHitbox) {
                let levelCoords = levelHitbox.getGlobalCoordinates(0, 0);
                levelY = levelCoords.y;

                if (this.verticalAnchor === "top") {
                    // Sprite anchored at top (for roof/ceiling walkers)
                    // y is where the TOP of the sprite bounding box will be drawn
                    // anchorPadding pushes it down from the ceiling
                    y = levelCoords.y + worldConfig.levelHeight * this.anchorPadding;
                } else {
                    // Sprite anchored at bottom (default, for floor walkers)
                    // y is where the TOP of the sprite bounding box will be drawn
                    // anchorPadding accounts for floor area (0.1 = 10% from bottom)
                    let effectiveLevelBottom = levelCoords.y + worldConfig.levelHeight * (1 - this.anchorPadding);
                    y = effectiveLevelBottom - spriteWidth;
                }
            } else {
                // Fallback to old calculation if level hitbox not found
                let platformDepth = this.parent.currentDepth + 1;
                y = worldConfig.topBound + worldConfig.levelHeight *
                    (worldConfig.numberOfDepthsVisible - ((currentlyViewedDepth + partialDepthOffset) - (platformDepth)) -
                        this.heightFraction + this.yOffset) - mainh * worldConfig.bottomBoundFraction;
                levelY = y;
            }
        } else {
            // Desktop calculation remains unchanged
            let platformDepth = this.parent.currentDepth;
            y = worldConfig.topBound + worldConfig.levelHeight *
                (worldConfig.numberOfDepthsVisible - ((currentlyViewedDepth + partialDepthOffset) - (platformDepth)) -
                    this.heightFraction + this.yOffset) - mainh * worldConfig.bottomBoundFraction;
            levelY = y;
        }

        if (this.isWalking) {
            let percentTowardsLocation = 1 - this.currentStateTimer / this.moveTime;
            x = lerp(this.currentPos, this.targetPos, percentTowardsLocation) * worldConfig.levelWidth;
        }
        else {
            x = worldConfig.levelWidth * this.currentPos;
        }
        x += worldConfig.leftBound;

        // Determine if sprite will be flipped (facing left)
        let isFlipped = (this.facingRight != this.flipHorizontal);

        return { x: x, y: y, spriteWidth: spriteWidth, isFlipped: isFlipped, levelY: levelY };
    }

    updateSpriteState(dt) {
        if (this.currentStateTimer <= 0) {
            if (!this.isWalking) {
                this.isWalking = true;
                this.setNewTargetPosition();
                this.currentStateTimer = this.moveTime;
                this.hasStartedStateAnimation = false;
            }
            else {
                this.isWalking = false;
                this.currentStateTimer = this.minMiningTime + Math.random() * (this.maxMiningTime - this.minMiningTime);
                this.currentPos = this.targetPos;
                this.hasStartedStateAnimation = false;
            }
        }
        else {
            this.currentStateTimer -= dt;
        }
    }

    setNewTargetPosition() {
        this.targetPos = this.leftBound + Math.random() * (this.rightBound - this.leftBound);
        this.moveTime = (worldConfig.levelWidth * Math.abs(this.currentPos - this.targetPos) / this.walkSpeed);
        this.facingRight = this.targetPos > this.currentPos;
    }

    render(context) {
        this.updateSpriteState(renderDeltaTime / 1000);
        var levelPadding = 2;
        if (currentlyViewedDepth + partialDepthOffset - levelPadding - worldConfig.numberOfDepthsVisible <= this.parent.currentDepth &&
            this.parent.currentDepth <= currentlyViewedDepth + partialDepthOffset + levelPadding) {
            var pos = this.getSpritePosition();
            var bubbleAnchor = { x: pos.x, y: pos.y, spriteWidth: pos.spriteWidth };
            context.save();

            var spritesheet;

            if (!this.isWalking && this.drillingSpritesheet) {
                spritesheet = this.drillingSpritesheet;

                if (quality == 1 && !isCapacityFull()) {
                    if (this.miningDisplayType == MINING_DISPLAY_TYPE_CALCULATE) {
                        for (var i = this.mineralsFound.length - 1; i >= 0; i--) {
                            this.mineralsFound[i].frames--;

                            if (this.mineralsFound[i].frames <= 0) {
                                this.mineralsFound.splice(i, 1);
                            }
                        }

                        var mineralsWithSuperMiner = estimatedMineralsPerMinuteAtLevel(this.parent.currentDepth, true).reduce((a, b) => a + b, 0);
                        var mineralsWithoutSuperMiner = estimatedMineralsPerMinuteAtLevel(this.parent.currentDepth, false).reduce((a, b) => a + b, 0);
                        var superMinerMineralsPerMinute = mineralsWithSuperMiner - mineralsWithoutSuperMiner;
                        var framesToAnimate = 12;
                        var totalFrameTimeMsec = framesToAnimate * 1000 / 20;
                        var numMineralsToDisplay = Math.round(totalFrameTimeMsec * superMinerMineralsPerMinute / 60000);
                        var maxMineralsToDisplay = 20;
                        if (Math.min(numMineralsToDisplay, maxMineralsToDisplay) > this.mineralsFound.length) {
                            if (rand(0, 2) == 0) {
                                var mineralToAdd = getSingleRandomMineralTypeAtDepthByWeight(this.parent.currentDepth);
                                var xVel = ((rand(0, 250) - 125) / 50);
                                this.mineralsFound.push({ "mineralType": mineralToAdd, "frames": framesToAnimate, "xVel": xVel });
                            }
                        }

                        for (var i = 0; i < this.mineralsFound.length; i++) {
                            var framesRemainingToShow = this.mineralsFound[i].frames;
                            var mineralIndex = this.mineralsFound[i].mineralType;
                            var xOffset = (framesToAnimate - framesRemainingToShow) * this.mineralsFound[i].xVel;
                            context.globalAlpha = MINERAL_COLLECTED_POPUP_ALPHA_SEQUENCE[framesRemainingToShow];
                            var yOffsetForSequence = MINERAL_COLLECTED_POPUP_OFFSET_SEQUENCE[framesRemainingToShow] * 2;
                            context.drawImage(
                                worldResources[mineralIndex].smallIcon,
                                pos.x + xOffset + (worldConfig.levelHeight * this.heightFraction / 2) - (Math.ceil(mainw * .012) / 2),
                                pos.y + yOffsetForSequence,
                                Math.floor(mainh * .021),
                                Math.floor(mainh * .021)
                            );
                            context.globalAlpha = 1;
                        }
                    }
                    else if (this.miningDisplayType == MINING_DISPLAY_TYPE_FAKE) {
                        for (var i = this.mineralsFound.length - 1; i >= 0; i--) {
                            this.mineralsFound[i].frames--;

                            if (this.mineralsFound[i].frames <= 0) {
                                this.mineralsFound.splice(i, 1);
                            }
                        }

                        var mineralsWithSuperMiner = estimatedMineralsPerMinuteAtLevel(this.parent.currentDepth, true).reduce((a, b) => a + b, 0);
                        var superMinerMineralsPerMinute = mineralsWithSuperMiner / 2;
                        var framesToAnimate = 12;
                        var totalFrameTimeMsec = framesToAnimate * 1000 / 20;
                        var numMineralsToDisplay = Math.round(totalFrameTimeMsec * superMinerMineralsPerMinute / 60000);
                        var maxMineralsToDisplay = 20;
                        if (Math.min(numMineralsToDisplay, maxMineralsToDisplay) > this.mineralsFound.length) {
                            if (rand(0, 2) == 0) {
                                var mineralToAdd = getSingleRandomMineralTypeAtDepthByWeight(this.parent.currentDepth);
                                var xVel = ((rand(0, 250) - 125) / 50);
                                this.mineralsFound.push({ "mineralType": mineralToAdd, "frames": framesToAnimate, "xVel": xVel });
                            }
                        }

                        for (var i = 0; i < this.mineralsFound.length; i++) {
                            var framesRemainingToShow = this.mineralsFound[i].frames;
                            var mineralIndex = this.mineralsFound[i].mineralType;
                            var xOffset = (framesToAnimate - framesRemainingToShow) * this.mineralsFound[i].xVel;
                            context.globalAlpha = MINERAL_COLLECTED_POPUP_ALPHA_SEQUENCE[framesRemainingToShow];
                            var yOffsetForSequence = MINERAL_COLLECTED_POPUP_OFFSET_SEQUENCE[framesRemainingToShow] * 2;
                            context.drawImage(
                                worldResources[mineralIndex].smallIcon,
                                pos.x + xOffset + (worldConfig.levelHeight * this.heightFraction / 2) - (Math.ceil(mainw * .012) / 2),
                                pos.y + yOffsetForSequence,
                                Math.floor(mainh * .021),
                                Math.floor(mainh * .021)
                            );
                            context.globalAlpha = 1;
                        }
                    }
                }
            }
            else {
                spritesheet = this.walkingSpritesheet;
            }

            if (isMobile()) {
                // Set vertical alignment based on anchor (bottom for floor walkers, top for ceiling walkers)
                let vAlign = this.verticalAnchor === "top" ? "top" : "bottom";
                spritesheet.verticalAlign = vAlign;
                spritesheet.horizontalAlign = "left";
            }

            // Calculate actual sprite dimensions (uses spritesheet's alignment settings)
            var spriteDimensions = fitBoxInBox(
                spritesheet.frameWidth,
                spritesheet.spritesheet.height,
                pos.x,
                pos.y,
                worldConfig.levelHeight * this.heightFraction,
                worldConfig.levelHeight * this.heightFraction,
                spritesheet.horizontalAlign,
                spritesheet.verticalAlign
            );

            if (isMobile()) {
                // Store the actual rendered width for hitbox calculations
                this._lastRenderedWidth = spriteDimensions.width;
                this._lastRenderedX = spriteDimensions.x;
            }

            if (this.facingRight != this.flipHorizontal) {
                context.scale(-1, 1);
                pos.x = -(spriteDimensions.x + spriteDimensions.width);
            }

            if (!this.hasStartedStateAnimation) {
                this.hasStartedStateAnimation = true;
                spritesheet.goToFrame(0);
            }

            var box = spritesheet.drawAnimation(
                context,
                pos.x,
                pos.y,
                worldConfig.levelHeight * this.heightFraction,
                worldConfig.levelHeight * this.heightFraction,
                true
            )

            // context.globalAlpha = 0.2;
            // context.fillStyle = "#0000FF";
            // context.fillRect(
            //     pos.x,
            //     pos.y,
            //     worldConfig.levelHeight * this.heightFraction,
            //     worldConfig.levelHeight * this.heightFraction
            // )

            // context.fillStyle = "#FFFF00";
            // context.fillRect(...Object.values(box));

            context.restore();

            this.renderSpeechBubbleAboveSprite(context, bubbleAnchor);
        }
    }

    renderSpeechBubbleAboveSprite(context, anchor) {
        if (!this.speechBubbleText) return;
        if (!areQuotesEnabled || isTimelapseOn || isSimulating || isOfflineProgressActive) return;

        var now = currentTime();

        if (typeof this.speechBubbleNextTimeMs === "undefined") {
            this.speechBubbleNextTimeMs = now + rand(SPEECH_BUBBLE_MIN_INTERVAL_MS, SPEECH_BUBBLE_MAX_INTERVAL_MS);
        }

        if (now >= this.speechBubbleShownAtMs + QUOTE_FADE_OUT_DURATION_MSECS && now >= this.speechBubbleNextTimeMs) {
            this.speechBubbleShownAtMs = now;
            this.speechBubbleNextTimeMs = now + QUOTE_FADE_OUT_DURATION_MSECS + rand(SPEECH_BUBBLE_MIN_INTERVAL_MS, SPEECH_BUBBLE_MAX_INTERVAL_MS);
        }

        var elapsed = now - this.speechBubbleShownAtMs;
        if (elapsed >= QUOTE_FADE_OUT_DURATION_MSECS) return;

        var alpha = 1 - Math.pow(elapsed / QUOTE_FADE_OUT_DURATION_MSECS, 10);

        var bubbleX = anchor.x + anchor.spriteWidth / 2;
        var bubbleY = anchor.y + worldConfig.levelHeight * this.speechBubbleYOffset;

        context.globalAlpha = alpha;
        renderSpeechBubble(context, this.speechBubbleText, bubbleX, bubbleY, this.speechBubbleBold);
        context.globalAlpha = 1;
    }
}

class DrillMinerRenderer {
    parent;

    drillingSpritesheet;

    // Size of sprite bounding box as fraction of level height
    heightFraction = 1;

    // Padding from the bottom (floor) as fraction of level height
    anchorPadding = 0.1;

    // Store last rendered dimensions for hitbox calculations
    _lastRenderedWidth = 0;
    _lastRenderedX = 0;

    constructor(parent) {
        this.parent = parent;
    }

    update() { }

    getDrillMinerPosition() {
        var spriteSize = worldConfig.levelHeight * this.heightFraction;
        var x, y;
        var levelY = 0;

        if (!isMobile()) {
            x = mainw * 0.818;
            y = worldConfig.topBound + worldConfig.levelHeight *
                (worldConfig.numberOfDepthsVisible - 1 + depth - currentlyViewedDepth) -
                this.drillingSpritesheet.spritesheet.height;
            levelY = y;
        }
        else {
            // On mobile, use level hitbox positioning for consistency with other world entities
            x = (mainw - spriteSize) * 0.5;

            // Try to get position from the drill level hitbox
            let drillLevel = activeLayers.WorldLayer.drillLevel;
            if (drillLevel) {
                let levelCoords = drillLevel.getGlobalCoordinates(0, 0);
                levelY = levelCoords.y;
                // Position sprite from the bottom of the level with padding (same as wandering miners)
                let effectiveLevelBottom = levelCoords.y + worldConfig.levelHeight * (1 - this.anchorPadding);
                y = effectiveLevelBottom - spriteSize;
            } else {
                // Fallback to old calculation
                y = worldConfig.topBound + worldConfig.levelHeight *
                    (worldConfig.numberOfDepthsVisible + depth - (currentlyViewedDepth + partialDepthOffset))
                    - mainh * worldConfig.bottomBoundFraction - spriteSize;
                levelY = y;
            }
        }

        return { x: x, y: y, spriteSize: spriteSize, levelY: levelY };
    }

    render(context) {
        if (currentlyViewedDepth >= depth - 2) {
            var { x, y, spriteSize } = this.getDrillMinerPosition();

            if (isMobile()) {
                // Set alignment to bottom (standing on floor)
                this.drillingSpritesheet.verticalAlign = "bottom";
                this.drillingSpritesheet.horizontalAlign = "left";

                // Calculate actual sprite dimensions after fitting
                var spriteDimensions = fitBoxInBox(
                    this.drillingSpritesheet.frameWidth,
                    this.drillingSpritesheet.spritesheet.height,
                    x,
                    y,
                    spriteSize,
                    spriteSize,
                    "left",
                    "bottom"
                );

                // Store for hitbox calculations
                this._lastRenderedWidth = spriteDimensions.width;
                this._lastRenderedX = spriteDimensions.x;
            }

            this.drillingSpritesheet.drawAnimation(
                context,
                x,
                y,
                spriteSize,
                spriteSize,
                true
            );
        }
    }
}