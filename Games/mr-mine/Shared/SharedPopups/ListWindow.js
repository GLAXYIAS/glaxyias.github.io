// Generic list window for displaying clickable options/items
class ListWindow extends PopupWindow {
    // Playsaurus account look palette (shared with the account/login/cloud CSS screens)
    static COLOR_TEXT = "#1E484E";          // dark teal — titles/labels on the teal buttons
    static COLOR_TEXT_DIM = "rgba(30, 72, 78, 0.85)"; // detail lines (matches .cloud-save-details)
    static COLOR_TEXT_TIME = "rgba(30, 72, 78, 0.6)"; // "time ago" line (matches .cloud-save-time)
    static COLOR_TEXT_DISABLED = "rgba(30, 72, 78, 0.4)";
    static COLOR_TEXT_ERROR = "#C0392B";    // warning red — e.g. "Version Mismatch" on an incompatible save
    static COLOR_CANCEL_TEXT = "#8A2B43";   // dark maroon — text on the pink cancel button
    static COLOR_TITLE = "#6FBCBC";         // brand teal popup title (flat fill stands in for the title gradient)

    layerName = "listWindowLayer";
    domElementId = "LISTWINDOWD";
    context = null;
    zIndex = 998;
    openTimestamp = "";

    frameWidth = 24;
    title;
    items; // Array of {title, subtitle, onClick, enabled, subtitleLineColors}
           // subtitleLineColors: optional { [lineIndex]: cssColor } to recolor
           // specific subtitle lines (e.g. a red "Version Mismatch" warning).
    actionTaken = false;
    itemHeight = 70; // Default item height, can be overridden

    scrollOffset = 0;
    maxScrollOffset = 0;
    totalItemsHeight = 0;
    itemsClipY = 0;
    itemsClipHeight = 0;
    itemHitboxes = [];
    exitButtonHitbox = null;

    // Layout settings with desktop/mobile variants
    layout = {
        desktop: {
            popupWidthRatio: 0.5,
            maxPopupWidth: 440,
            sideMargin: 50,
            iconSize: 44,
            iconOffsetY: 0, // vertical nudge for the item icon (negative = up)
            titleFontSize: 28,
            itemTitleFontSize: 20,
            itemSubtitleFontSize: 14,
            itemSubtitleLineHeight: 16,
            itemSubtitleOffsetY: 38,
            exitButtonFontSize: 20
        },
        mobile: {
            popupWidthRatio: 0.9,
            sideMargin: 30,
            iconSize: 52,
            // The larger mobile text metrics push the text-block centre (and so the
            // icon) lower than desktop; nudge the icon up to match the PC look.
            iconOffsetY: -4,
            titleFontSize: 32,
            itemTitleFontSize: 26,
            itemSubtitleFontSize: 18,
            itemSubtitleLineHeight: 22,
            itemSubtitleOffsetY: 40,
            exitButtonFontSize: 24
        }
    };

    constructor(boundingBox, title, items, itemHeight, options) {
        super(boundingBox);
        this.activeLayout = isMobile() ? this.layout.mobile : this.layout.desktop;
        this.initHtml();
        this.setBoundingBox();

        this.title = title;
        this.items = items || [];
        if(itemHeight) {
            this.itemHeight = itemHeight;
        }
        // Item background style: "button" (default, teal paButtons) keeps the
        // Save Options look; "card" uses the container1 nine-slice so the
        // Select a Cloud Save list matches the cloud-save / rewards items.
        this.itemStyle = (options && options.itemStyle) || "button";

        this.initHitboxes();
        this.addScrollEvents();
    }

    initHtml() {
        this.openTimestamp = Math.floor(performance.now());
        this.layerName += "_" + this.openTimestamp;
        this.domElementId += "_" + this.openTimestamp;

        this.div = document.createElement("div");
        this.div.classList.add("LISTWINDOWD");
        this.div.onselectstart = () => false;
        this.div.ondragstart = () => false;
        this.div.style.zIndex = this.zIndex;
        this.div.style.visibility = "hidden";
        this.div.id = this.domElementId;

        var canvas = document.createElement("canvas");
        canvas.width = 0;
        canvas.height = 0;
        canvas.style.width = 0;
        canvas.style.height = 0;
        canvas.style.position = "absolute";
        canvas.style.zIndex = this.zIndex;
        canvas.id = "LISTWINDOW_" + this.openTimestamp;
        this.context = canvas.getContext("2d");

        this.div.appendChild(canvas);
        document.body.appendChild(this.div);
    }

    initHitboxes() {
        this.clearHitboxes();

        // Calculate dimensions - adaptive height based on content.
        // Cap the width on desktop so the (portrait) account panel background keeps
        // its proportions and the popup stays portrait like the account screens.
        var popupWidth = this.boundingBox.width * this.activeLayout.popupWidthRatio;
        if(this.activeLayout.maxPopupWidth)
        {
            popupWidth = Math.min(popupWidth, this.activeLayout.maxPopupWidth);
        }

        // Calculate required height
        var itemGap = 10;
        var topMargin = 70; // Title space
        var exitButtonHeight = 85; // Exit button + more padding
        var numItems = this.items.length;
        var numItemsForHeight = Math.min(numItems, 6);

        var contentHeight = topMargin + (this.itemHeight * numItemsForHeight) + (itemGap * (numItemsForHeight - 1)) + exitButtonHeight;
        var popupHeight = Math.min(contentHeight, this.boundingBox.height * 0.8);

        var totalItemsHeight = numItems > 0 ? (this.itemHeight * numItems + itemGap * (numItems - 1)) : 0;
        this.totalItemsHeight = totalItemsHeight;
        this.itemsClipY = topMargin;
        this.itemsClipHeight = popupHeight - topMargin - exitButtonHeight;
        this.maxScrollOffset = Math.max(0, totalItemsHeight - this.itemsClipHeight);
        this.scrollOffset = 0;
        this.itemHitboxes = [];

        var popupX = (this.boundingBox.width - popupWidth) / 2;
        var popupY = (this.boundingBox.height - popupHeight) / 2;

        // Main body
        this.body = this.addHitbox(new Hitbox(
            {
                x: popupX,
                y: popupY,
                width: popupWidth,
                height: popupHeight
            },
            {}, "", "body"
        ));
        this.body.root = this;

        // Body render function
        var self = this;
        this.body.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;

            // Draw the Playsaurus account panel background (matches the account /
            // login / cloud-saves screens, which use the container3 nine-slice).
            // container3 is a white rounded card with a taller bottom slice for its
            // drop shadow, so use the asymmetric nine-slice helper (42/40/42/52).
            drawNineSliceAsym(
                context,
                container3,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height,
                42, 40, 42, 52
            );

            // Title — brand teal, vertically centred in the space between the top
            // of the panel and the top of the first section (the item list).
            context.save();
            context.font = this.root.activeLayout.titleFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_TITLE;
            context.textBaseline = "middle";
            var titleMaxWidth = this.boundingBox.width - 2 * self.frameWidth - 20;
            var titleCenterY = coords.y + self.itemsClipY / 2;
            fillTextShrinkToFit(context, self.title, coords.x + self.frameWidth + 10, titleCenterY, titleMaxWidth, "center", 0, false, true);
            context.restore();

            // Card lists (Select a Cloud Save) sit on a container2 scroll panel,
            // matching the Rewards scroll box. The white container3 item cards then
            // render on top of it.
            var isCardList = self.itemStyle === "card";
            if(isCardList)
            {
                var bgPad = 16;
                drawNineSlice(
                    context, container2,
                    coords.x + self.activeLayout.sideMargin - bgPad,
                    coords.y + self.itemsClipY - 8,
                    this.boundingBox.width - 2 * (self.activeLayout.sideMargin - bgPad),
                    self.itemsClipHeight + 16,
                    40, 40
                );
            }

            if(self.maxScrollOffset > 0)
            {
                // Clip items area so scrolled-out items don't bleed over title/exit button
                context.save();
                context.beginPath();
                context.rect(
                    coords.x + self.frameWidth,
                    coords.y + self.itemsClipY,
                    this.boundingBox.width - 2 * self.frameWidth,
                    self.itemsClipHeight
                );
                context.clip();
                for(var idx = 0; idx < self.itemHitboxes.length; idx++)
                {
                    self.itemHitboxes[idx].render.call(self.itemHitboxes[idx]);
                }
                context.restore();

                // Draw scrollbar. Card lists use the Rewards scroll-box look: a teal
                // rounded track with a white rounded thumb, tucked inside the
                // container2 panel. Other lists keep the thin default bar.
                var sbW = isCardList ? 6 : 4;
                var sbX = isCardList
                    ? (this.boundingBox.width - (self.activeLayout.sideMargin - 16) - sbW - 4)
                    : (this.boundingBox.width - self.frameWidth - sbW - 2);
                var sbTrackH = self.itemsClipHeight;
                var thumbH = Math.max(20, sbTrackH * (sbTrackH / self.totalItemsHeight));
                var thumbY = self.itemsClipY + (self.scrollOffset / self.maxScrollOffset) * (sbTrackH - thumbH);
                context.save();
                if(isCardList && context.roundRect)
                {
                    context.fillStyle = '#91D7D7';
                    context.beginPath();
                    context.roundRect(coords.x + sbX, coords.y + self.itemsClipY, sbW, sbTrackH, sbW / 2);
                    context.fill();
                    context.fillStyle = '#FFFFFF';
                    context.beginPath();
                    context.roundRect(coords.x + sbX, coords.y + thumbY, sbW, thumbH, sbW / 2);
                    context.fill();
                }
                else
                {
                    context.fillStyle = 'rgba(30,72,78,0.15)';
                    context.fillRect(coords.x + sbX, coords.y + self.itemsClipY, sbW, sbTrackH);
                    context.fillStyle = '#91D7D7';
                    context.fillRect(coords.x + sbX, coords.y + thumbY, sbW, thumbH);
                }
                context.restore();

                if(self.exitButtonHitbox)
                {
                    self.exitButtonHitbox.render.call(self.exitButtonHitbox);
                }
            }
            else
            {
                this.renderChildren();
            }
        };

        this.createListItems();
        this.createExitButton();
    }

    createListItems() {
        var itemGap = 10;
        var topMargin = 70; // Space for title
        var sideMargin = this.activeLayout.sideMargin;

        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            var itemY = topMargin + (this.itemHeight + itemGap) * i;

            var itemBox = this.body.addHitbox(new Hitbox(
                {
                    x: sideMargin,
                    y: itemY,
                    width: this.body.boundingBox.width - 2 * sideMargin,
                    height: this.itemHeight
                },
                {
                    onmousedown: function () {
                        var visY = this.boundingBox.y;
                        if (visY + this.boundingBox.height <= this.root.itemsClipY ||
                            visY >= this.root.itemsClipY + this.root.itemsClipHeight) return;
                        if (this.itemData && this.itemData.onClick && this.itemData.enabled !== false) {
                            this.itemData.onClick();
                            this.root.actionTaken = true;
                            this.root.close();
                        }
                    },
                    onmouseenter: function () {
                        this.hovered = true;
                    },
                    onmouseexit: function () {
                        this.hovered = false;
                    }
                },
                "pointer",
                "listItem_" + i
            ));

            itemBox.root = this;
            itemBox.itemData = item;
            itemBox.hovered = false;
            itemBox.baseY = itemY;
            this.itemHitboxes.push(itemBox);

            // Render function
            itemBox.render = function () {
                if (!this.itemData) return;

                var coords = this.getRelativeCoordinates(0, 0, this.root);
                var context = this.root.context;

                context.save();

                var isEnabled = this.itemData.enabled !== false;

                // Disabled items (e.g. incompatible cloud saves) render faded.
                if (!isEnabled) {
                    context.globalAlpha = 0.5;
                }

                if (this.root.itemStyle === "card") {
                    // Select a Cloud Save: white container3 card sitting on the
                    // container2 scroll panel, matching the cloud-save / rewards
                    // scroll box.
                    drawNineSliceAsym(
                        context,
                        container3,
                        coords.x, coords.y,
                        this.boundingBox.width, this.boundingBox.height,
                        42, 40, 42, 52
                    );
                } else {
                    // Save Options (default): teal Playsaurus button as the item background.
                    drawNineSliceAsym(
                        context,
                        (this.hovered && isEnabled) ? paButtonsHover : paButtons,
                        coords.x, coords.y,
                        this.boundingBox.width, this.boundingBox.height,
                        PA_BUTTON_SLICE.left, PA_BUTTON_SLICE.top, PA_BUTTON_SLICE.right, PA_BUTTON_SLICE.bottom
                    );
                }

                var hasSubtitle = !!this.itemData.subtitle;
                var titleFontSize = this.root.activeLayout.itemTitleFontSize;
                var subtitleFontSize = this.root.activeLayout.itemSubtitleFontSize;
                var subtitleLineHeight = this.root.activeLayout.itemSubtitleLineHeight;
                var subtitleOffsetY = this.root.activeLayout.itemSubtitleOffsetY;

                // Vertical centre of the text block, so the icon lines up with the
                // text rather than the full button height (which includes the 3D lip).
                var titleY = hasSubtitle ? 12 : 25;
                var textTop = titleY;
                var textBottom;
                if (hasSubtitle) {
                    var numLines = this.itemData.subtitle.split('\n').length;
                    textBottom = subtitleOffsetY + (numLines - 1) * subtitleLineHeight + subtitleFontSize;
                } else {
                    textBottom = titleY + titleFontSize;
                }
                var textCenterY = coords.y + (textTop + textBottom) / 2;

                // Draw icon if provided
                var iconSize = this.root.activeLayout.iconSize;
                var iconMargin = 18;
                var textLeftMargin = 18;
                // Extra right padding so the text clears the button's heavier right 3D
                // lip and doesn't crowd the right edge (esp. long localized strings).
                var textRightPadding = 28;
                if (this.itemData.icon && typeof this.itemData.icon !== 'undefined') {
                    try {
                        var iconX = coords.x + iconMargin;
                        var iconY = textCenterY - iconSize / 2 + (this.root.activeLayout.iconOffsetY || 0);
                        context.drawImage(this.itemData.icon, iconX, iconY, iconSize, iconSize);
                        textLeftMargin = iconMargin + iconSize + 14; // Adjust text position when icon is present
                    } catch (e) {
                        // Icon not loaded yet, just skip it
                    }
                }

                var textMaxWidth = this.boundingBox.width - textLeftMargin - textRightPadding;

                // Draw title (dark teal, account font)
                context.font = titleFontSize + "px Matiz";
                context.fillStyle = isEnabled ? ListWindow.COLOR_TEXT : ListWindow.COLOR_TEXT_DISABLED;
                context.textBaseline = "top";
                context.textAlign = "left";

                fillTextShrinkToFit(context, this.itemData.title || "", coords.x + textLeftMargin, coords.y + titleY, textMaxWidth, "left", 0, false, true);

                // Draw subtitle if present (smaller, dimmed dark teal).
                // Handle multi-line subtitles (split by \n)
                if (hasSubtitle) {
                    var lines = this.itemData.subtitle.split('\n');
                    var isCard = this.root.itemStyle === "card";

                    for (var i = 0; i < lines.length; i++) {
                        // For the cloud-save card style, the last line is the
                        // "time ago" line: render it a touch smaller and dimmer so
                        // the hierarchy matches the HTML cloud-saves list.
                        var isTimeLine = isCard && i === lines.length - 1;
                        var lineFontSize = isTimeLine ? Math.round(subtitleFontSize * 0.85) : subtitleFontSize;

                        context.font = lineFontSize + "px Matiz";
                        if (!isEnabled) {
                            context.fillStyle = ListWindow.COLOR_TEXT_DISABLED;
                        } else {
                            context.fillStyle = isTimeLine ? ListWindow.COLOR_TEXT_TIME : ListWindow.COLOR_TEXT_DIM;
                        }

                        // Optional per-line color override (e.g. a red "Version
                        // Mismatch" warning on an incompatible cloud save). Kept at
                        // full opacity so it stays legible even when the row itself
                        // is disabled/faded.
                        var lineColors = this.itemData.subtitleLineColors;
                        var lineColorOverride = lineColors && lineColors[i];
                        var prevAlpha = context.globalAlpha;
                        if (lineColorOverride) {
                            context.fillStyle = lineColorOverride;
                            if (!isEnabled) {
                                context.globalAlpha = 1.0;
                            }
                        }

                        fillTextShrinkToFit(context, lines[i], coords.x + textLeftMargin, coords.y + subtitleOffsetY + (i * subtitleLineHeight), textMaxWidth);

                        context.globalAlpha = prevAlpha;
                    }
                }

                context.restore();
            };
        }
    }

    createExitButton() {
        var buttonWidth = isMobile() ? 200 : 175;
        var buttonHeight = isMobile() ? 60 : 52;
        var buttonX = (this.body.boundingBox.width - buttonWidth) / 2;
        var buttonY = this.body.boundingBox.height - buttonHeight - 24; // More padding

        var exitButton = this.body.addHitbox(new Hitbox(
            {
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            },
            {
                onmousedown: function () {
                    this.root.close();
                },
                onmouseenter: function () {
                    this.hovered = true;
                },
                onmouseexit: function () {
                    this.hovered = false;
                }
            },
            "pointer",
            "exitButton"
        ));

        exitButton.root = this;
        exitButton.hovered = false;
        this.exitButtonHitbox = exitButton;

        exitButton.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;

            // Draw the pink Playsaurus cancel button
            drawNineSliceAsym(
                context,
                this.hovered ? paCancelHover : paCancel,
                coords.x, coords.y,
                this.boundingBox.width, this.boundingBox.height,
                PA_BUTTON_SLICE.left, PA_BUTTON_SLICE.top, PA_BUTTON_SLICE.right, PA_BUTTON_SLICE.bottom
            );

            // Draw text (dark maroon, account font)
            context.save();
            context.font = this.root.activeLayout.exitButtonFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_CANCEL_TEXT;
            context.textBaseline = "middle";
            fillTextShrinkToFit(context, _("Cancel"), coords.x + 10, coords.y + this.boundingBox.height / 2, this.boundingBox.width - 20, "center", 0, false, true);
            context.restore();
        };
    }

    render() {
        if (!isDivVisible(this.domElementId)) {
            showDiv(this.domElementId, this.zIndex);
        }
        this.context.clearRect(0, 0, this.boundingBox.width, this.boundingBox.height);
        drawColoredRect(this.context, 0, 0, this.boundingBox.width, this.boundingBox.height, "#000000", 0.5);
        this.renderChildren();
    }

    addScrollEvents()
    {
        if(this.maxScrollOffset <= 0) return;
        var self = this;

        // Mouse wheel (desktop)
        this.div.addEventListener('wheel', function(e)
        {
            e.preventDefault();
            self.applyScroll(e.deltaY);
        }, { passive: false });

        // Touch drag (mobile)
        var touchStartY = 0;
        var touchStartScroll = 0;
        this.div.addEventListener('touchstart', function(e)
        {
            touchStartY = e.touches[0].clientY;
            touchStartScroll = self.scrollOffset;
        }, { passive: true });

        this.div.addEventListener('touchmove', function(e)
        {
            var canvasEl = self.context.canvas;
            var rect = canvasEl.getBoundingClientRect();
            var scaleY = rect.height > 0 ? canvasEl.height / rect.height : 1;
            var dy = (touchStartY - e.touches[0].clientY) * scaleY;
            self.scrollOffset = Math.max(0, Math.min(self.maxScrollOffset, touchStartScroll + dy));
            self.updateItemHitboxPositions();
            e.preventDefault();
        }, { passive: false });
    }

    applyScroll(delta)
    {
        this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + delta));
        this.updateItemHitboxPositions();
    }

    updateItemHitboxPositions()
    {
        for(var i = 0; i < this.itemHitboxes.length; i++)
        {
            this.itemHitboxes[i].boundingBox.y = this.itemHitboxes[i].baseY - this.scrollOffset;
        }
    }

    close() {
        hideSimpleInput();
        try {
            document.body.removeChild(this.div);
        } catch (e) {
            console.warn(e);
            if (this.context && this.context.canvas) {
                minimizeCanvas(this.context.canvas);
            }
        }
        var result = super.close();
        if (result) {
            delete activeLayers[this.layerName];
        }
        return result;
    }
}
