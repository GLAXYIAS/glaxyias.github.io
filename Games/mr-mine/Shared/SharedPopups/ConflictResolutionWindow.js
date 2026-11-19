// Conflict resolution window for showing local vs cloud save comparison.
// Styled to match the Playsaurus account look (see ListWindow): white rounded
// panel (container3), teal save columns (container1/container2), white info
// cards (container3) and the teal/pink Playsaurus buttons (paButtons/paCancel).
class ConflictResolutionWindow extends PopupWindow {
    layerName = "conflictResolutionLayer";
    domElementId = "CONFLICTRESOLUTIOND";
    context = null;
    zIndex = 998;
    openTimestamp = "";

    // Brand title colour for the accounts popups. The branding calls for a
    // gradient title; where a gradient isn't drawn this flat teal stands in
    // for it (per the accounts branding feedback).
    static COLOR_TITLE = "#6FBCBC";

    frameWidth = 24;

    // Shared font size for every button on the popup. Recomputed each frame so
    // localisation can shrink all buttons together (never one in isolation).
    buttonFontSize = 22;
    title;
    localSave;
    cloudSave;
    onLocalChosen;
    onCloudChosen;

    // 9-slice source insets for the rounded container art.
    // container1/container2 are symmetric rounded squares; container3 is a white
    // card with a soft drop shadow that is a little taller along the bottom.
    cardSlice = { left: 42, top: 40, right: 42, bottom: 52 };
    columnSliceWidth = 40;
    columnSliceHeight = 40;

    // Layout settings with desktop/mobile variants
    layout = {
        desktop: {
            popupWidthRatio: 0.62,
            maxPopupWidth: 880,
            sideMargin: 36,
            columnGap: 28,
            topMargin: 64,
            columnHeight: 360,
            innerPad: 16,
            headerGap: 10,
            cardButtonGap: 12,
            iconSize: 44,
            titleFontSize: 30,
            columnTitleFontSize: 24,
            infoFontSize: 17,
            infoLineHeight: 25,
            cardPad: 16,
            buttonWidth: 210,       // shared by every button (clamped to fit a column)
            buttonHeight: 58,        // shared by every button
            buttonFontSize: 28,      // design (max) size; shrinks uniformly to fit content
            cancelTopGap: 22,
            bottomPad: 24,
            popupMaxHeightRatio: 0.9,
            columnLayout: "horizontal"
        },
        mobile: {
            popupWidthRatio: 0.94,
            sideMargin: 22,
            columnGap: 14,
            topMargin: 58,
            columnHeight: 320,
            innerPad: 14,
            headerGap: 8,
            cardButtonGap: 10,
            iconSize: 40,
            titleFontSize: 30,
            columnTitleFontSize: 22,
            infoFontSize: 16,
            infoLineHeight: 22,
            cardPad: 13,
            buttonWidth: 240,       // shared by every button (clamped to fit a column)
            buttonHeight: 56,        // shared by every button
            buttonFontSize: 26,      // design (max) size; shrinks uniformly to fit content
            cancelTopGap: 18,
            bottomPad: 20,
            popupMaxHeightRatio: 0.96,
            columnLayout: "vertical"
        }
    };

    constructor(boundingBox, title, localSave, cloudSave, onLocalChosen, onCloudChosen) {
        super(boundingBox);
        this.activeLayout = isMobile() ? this.layout.mobile : this.layout.desktop;
        this.initHtml();
        this.setBoundingBox();

        this.title = title;
        this.localSave = localSave;
        this.cloudSave = cloudSave;
        this.onLocalChosen = onLocalChosen;
        this.onCloudChosen = onCloudChosen;

        this.initHitboxes();
    }

    initHtml() {
        this.openTimestamp = Math.floor(performance.now());
        this.layerName += "_" + this.openTimestamp;
        this.domElementId += "_" + this.openTimestamp;

        this.div = document.createElement("div");
        this.div.classList.add("CONFLICTRESOLUTIOND");
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
        canvas.id = "CONFLICTRESOLUTION_" + this.openTimestamp;
        this.context = canvas.getContext("2d");

        this.div.appendChild(canvas);
        document.body.appendChild(this.div);
    }

    // Draw a rounded container asset stretched to a box using nine-slice so the
    // corners keep their radius. container3 (the white cards) has an asymmetric
    // drop shadow, so it uses the asymmetric helper.
    drawCard(context, x, y, width, height) {
        drawNineSliceAsym(
            context, container3, x, y, width, height,
            this.cardSlice.left, this.cardSlice.top, this.cardSlice.right, this.cardSlice.bottom
        );
    }

    initHitboxes() {
        this.clearHitboxes();

        var layout = this.activeLayout;

        // Popup width
        var popupWidth = this.boundingBox.width * layout.popupWidthRatio;
        if (layout.maxPopupWidth) {
            popupWidth = Math.min(popupWidth, layout.maxPopupWidth);
        }

        // The vertical budget reserved under the columns for the cancel button.
        var cancelReserve = layout.cancelTopGap + layout.buttonHeight + layout.bottomPad;

        // One shared button width for every button (Keep Local / Keep Cloud /
        // Cancel), clamped so it still fits inside a single column.
        var columnWidth = layout.columnLayout === "vertical"
            ? popupWidth - 2 * layout.sideMargin
            : (popupWidth - 2 * layout.sideMargin - layout.columnGap) / 2;
        this.buttonWidth = Math.min(layout.buttonWidth, columnWidth - 2 * layout.innerPad);

        // Desired popup height from the desired column height, then capped to the
        // screen. If we have to cap, the column height shrinks to fit so nothing
        // overflows the panel.
        var columnHeight = layout.columnHeight;
        var maxPopupHeight = this.boundingBox.height * layout.popupMaxHeightRatio;
        var popupHeight;

        if (layout.columnLayout === "vertical") {
            popupHeight = layout.topMargin + columnHeight * 2 + layout.columnGap + cancelReserve;
            if (popupHeight > maxPopupHeight) {
                popupHeight = maxPopupHeight;
                columnHeight = (popupHeight - layout.topMargin - layout.columnGap - cancelReserve) / 2;
            }
        } else {
            popupHeight = layout.topMargin + columnHeight + cancelReserve;
            if (popupHeight > maxPopupHeight) {
                popupHeight = maxPopupHeight;
                columnHeight = popupHeight - layout.topMargin - cancelReserve;
            }
        }
        this.columnHeight = columnHeight;

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

        var self = this;
        this.body.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;

            // White rounded panel (matches the account screens).
            self.drawCard(context, coords.x, coords.y, this.boundingBox.width, this.boundingBox.height);

            // Title — brand teal, vertically centred in the space between the top
            // of the panel and the top of the first section (the save columns).
            context.save();
            context.font = self.activeLayout.titleFontSize + "px Matiz";
            context.fillStyle = ConflictResolutionWindow.COLOR_TITLE;
            context.textBaseline = "middle";
            var titleMaxWidth = this.boundingBox.width - 2 * self.frameWidth - 20;
            var titleCenterY = coords.y + self.activeLayout.topMargin / 2;
            fillTextShrinkToFit(context, self.title, coords.x + self.frameWidth + 10, titleCenterY, titleMaxWidth, "center", 0, false, true);
            context.restore();

            // Keep every button's text at one consistent (and as large as
            // possible) size before the buttons render.
            self.updateButtonFontSize();

            this.renderChildren();
        };

        this.createSaveComparison();
        this.createCancelButton();
    }

    // Every button is the same width, so measure all three labels against that
    // one width and, if any overflows, scale them all down by the same factor.
    // Result: identical buttons with one font size that adapts to the content.
    updateButtonFontSize() {
        var layout = this.activeLayout;
        var baseFontSize = layout.buttonFontSize;
        var textWidth = this.buttonWidth - 24; // matches the 12px text inset each side

        var labels = [_("Keep Local"), _("Keep Cloud"), _("Cancel")];

        var context = this.context;
        context.save();
        context.font = "bold " + baseFontSize + "px Matiz"; // buttons render bold
        var scale = 1;
        if (textWidth > 0) {
            for (var i = 0; i < labels.length; i++) {
                var w = context.measureText(labels[i]).width;
                if (w > textWidth) {
                    scale = Math.min(scale, textWidth / w);
                }
            }
        }
        context.restore();

        this.buttonFontSize = Math.max(1, Math.floor(baseFontSize * scale));
    }

    createSaveComparison() {
        var layout = this.activeLayout;
        var bodyWidth = this.body.boundingBox.width;
        var columnHeight = this.columnHeight;

        if (layout.columnLayout === "vertical") {
            var columnWidth = bodyWidth - 2 * layout.sideMargin;

            this.createSaveColumn(
                layout.sideMargin, layout.topMargin, columnWidth, columnHeight,
                _("Local Save"), this.localSave, container1, localSaveIcon, _("Keep Local"), this.onLocalChosen, "local"
            );
            this.createSaveColumn(
                layout.sideMargin, layout.topMargin + columnHeight + layout.columnGap, columnWidth, columnHeight,
                _("Cloud Save"), this.cloudSave, container2, cloudSaveIcon, _("Keep Cloud"), this.onCloudChosen, "cloud"
            );
        } else {
            var columnWidth = (bodyWidth - 2 * layout.sideMargin - layout.columnGap) / 2;

            this.createSaveColumn(
                layout.sideMargin, layout.topMargin, columnWidth, columnHeight,
                _("Local Save"), this.localSave, container1, localSaveIcon, _("Keep Local"), this.onLocalChosen, "local"
            );
            this.createSaveColumn(
                layout.sideMargin + columnWidth + layout.columnGap, layout.topMargin, columnWidth, columnHeight,
                _("Cloud Save"), this.cloudSave, container2, cloudSaveIcon, _("Keep Cloud"), this.onCloudChosen, "cloud"
            );
        }
    }

    createSaveColumn(x, y, width, height, title, saveData, containerImage, iconImage, buttonText, onChoose, key) {
        var layout = this.activeLayout;

        // Background column container (teal rounded square, nine-sliced).
        var column = this.body.addHitbox(new Hitbox(
            { x: x, y: y, width: width, height: height },
            {}, "", "saveColumn_" + key
        ));
        column.root = this;
        column.containerImage = containerImage;
        column.iconImage = iconImage;
        column.columnTitle = title;
        column.saveData = saveData;

        var self = this;
        column.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;
            context.save();

            // Column background
            drawNineSlice(
                context, this.containerImage, coords.x, coords.y,
                this.boundingBox.width, this.boundingBox.height,
                self.columnSliceWidth, self.columnSliceHeight
            );

            var pad = layout.innerPad;
            var iconSize = layout.iconSize;

            // Header: icon + title, vertically centred on the icon.
            var headerY = coords.y + pad;
            var headerCenterY = headerY + iconSize / 2;
            if (typeof this.iconImage !== "undefined" && this.iconImage) {
                try {
                    drawImageFitInBox(context, this.iconImage, coords.x + pad, headerY, iconSize, iconSize);
                } catch (e) { /* icon not loaded yet */ }
            }
            var titleX = coords.x + pad + iconSize + 12;
            context.font = layout.columnTitleFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_TEXT;
            context.textBaseline = "middle";
            fillTextShrinkToFit(context, this.columnTitle, titleX, headerCenterY, this.boundingBox.width - (pad + iconSize + 12) - pad, "left", 0, false, true);

            // White info card.
            var cardX = coords.x + pad;
            var cardY = headerY + iconSize + layout.headerGap;
            var cardW = this.boundingBox.width - 2 * pad;
            var buttonH = layout.buttonHeight;
            var buttonY = coords.y + this.boundingBox.height - pad - buttonH;
            var cardH = (buttonY - layout.cardButtonGap) - cardY;

            self.drawCard(context, cardX, cardY, cardW, cardH);

            self.renderSaveInfo(context, this.saveData, cardX, cardY, cardW, cardH);

            context.restore();
        };

        // Choice button (lives at the bottom inside the column). Same fixed size
        // as every other button, horizontally centred within the column.
        var buttonH = layout.buttonHeight;
        var buttonW = this.buttonWidth;
        var buttonPad = layout.innerPad;
        var buttonBox = this.body.addHitbox(new Hitbox(
            {
                x: x + (width - buttonW) / 2,
                y: y + height - buttonPad - buttonH,
                width: buttonW,
                height: buttonH
            },
            {
                onmousedown: function () {
                    if (onChoose) {
                        onChoose();
                    }
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
            "choiceButton_" + key
        ));
        buttonBox.root = this;
        buttonBox.hovered = false;
        buttonBox.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;
            context.save();

            drawNineSliceAsym(
                context, this.hovered ? paButtonsHover : paButtons, coords.x, coords.y,
                this.boundingBox.width, this.boundingBox.height,
                PA_BUTTON_SLICE.left, PA_BUTTON_SLICE.top, PA_BUTTON_SLICE.right, PA_BUTTON_SLICE.bottom
            );

            context.font = self.buttonFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_TEXT;
            context.textBaseline = "middle";
            fillTextShrinkToFit(context, buttonText, coords.x + 12, coords.y + this.boundingBox.height * 0.46, this.boundingBox.width - 24, "center", 0, false, true);

            context.restore();
        };
    }

    renderSaveInfo(context, saveData, cardX, cardY, cardW, cardH) {
        var layout = this.activeLayout;
        var pad = layout.cardPad;
        var textMaxWidth = cardW - 2 * pad;

        if (!saveData) {
            context.font = layout.infoFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_TEXT_DISABLED;
            context.textBaseline = "middle";
            fillTextShrinkToFit(context, _("No save found"), cardX + pad, cardY + cardH / 2, textMaxWidth, "center", 0, false, true);
            return;
        }

        // Build the list of info lines (some fields are optional).
        var lines = [];
        lines.push(_("Name") + ": " + (saveData.saveName || _("Unknown")));
        lines.push(_("Depth") + ": " + (saveData.depthFormatted || (saveData.depth + " " + _("km"))));
        lines.push(_("Money") + ": " + (saveData.money || "$0"));
        lines.push(_("Tickets") + ": " + (saveData.ticketsFormatted || beautifynum(saveData.tickets || 0)));
        lines.push(_("Play Time") + ": " + (saveData.playTimeFormatted || "0h 0m"));
        if (saveData.platformFormatted || saveData.platform) {
            lines.push(_("Platform") + ": " + (saveData.platformFormatted || saveData.platform));
        }
        if (saveData.versionDisplay || saveData.gameVersion) {
            lines.push(_("Version") + ": " + (saveData.versionDisplay || ("" + saveData.gameVersion)));
        }
        if (saveData.lastSavedFormatted || saveData.timeAgo) {
            lines.push(_("Saved") + ": " + (saveData.timeAgo || saveData.lastSavedFormatted));
        }

        // Clamp the line height so every line fits inside the card.
        var avail = cardH - 2 * pad;
        var lineHeight = Math.min(layout.infoLineHeight, avail / lines.length);
        var fontSize = Math.min(layout.infoFontSize, Math.floor(lineHeight * 0.78));

        context.font = fontSize + "px Matiz";
        context.fillStyle = ListWindow.COLOR_TEXT;
        context.textBaseline = "top";

        var textY = cardY + pad;
        for (var i = 0; i < lines.length; i++) {
            fillTextShrinkToFit(context, lines[i], cardX + pad, textY, textMaxWidth, "left", 0, false, true);
            textY += lineHeight;
        }
    }

    createCancelButton() {
        var layout = this.activeLayout;
        var bodyWidth = this.body.boundingBox.width;
        var bodyHeight = this.body.boundingBox.height;

        var buttonWidth = this.buttonWidth; // same size as the Keep Local / Keep Cloud buttons
        var buttonHeight = layout.buttonHeight;
        var buttonX = (bodyWidth - buttonWidth) / 2;
        var buttonY = bodyHeight - layout.bottomPad - buttonHeight;

        var cancelButton = this.body.addHitbox(new Hitbox(
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
            "cancelButton"
        ));
        cancelButton.root = this;
        cancelButton.hovered = false;

        var self = this;
        cancelButton.render = function () {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;
            context.save();

            drawNineSliceAsym(
                context, this.hovered ? paCancelHover : paCancel, coords.x, coords.y,
                this.boundingBox.width, this.boundingBox.height,
                PA_BUTTON_SLICE.left, PA_BUTTON_SLICE.top, PA_BUTTON_SLICE.right, PA_BUTTON_SLICE.bottom
            );

            context.font = self.buttonFontSize + "px Matiz";
            context.fillStyle = ListWindow.COLOR_CANCEL_TEXT;
            context.textBaseline = "middle";
            fillTextShrinkToFit(context, _("Cancel"), coords.x + 12, coords.y + this.boundingBox.height * 0.46, this.boundingBox.width - 24, "center", 0, false, true);

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
