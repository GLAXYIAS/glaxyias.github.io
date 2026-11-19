class AccountWindow extends TabbedPopupWindow
{
    layerName = "account"; // Used as key in activeLayers
    domElementId = "ACCOUNTD"; // ID of dom element that gets shown or hidden
    context = ACCOUNT;         // Canvas rendering context for popup

    defaultFont = "24px Verdana";

    userInfo = null;
    avatarImage = null;

    bodyPaddingX = 0.02;
    bodyPaddingY = 0.04;
    avatarHeight = 0.30;
    headerHeight = 0.15;
    subheaderHeight = 0.11;
    editButtonWidth = 0.5;
    editButtonHeight = 0.1;

    constructor(boundingBox)
    {
        super(boundingBox);
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        this.initializeTabs();
        this.getUserInfo();
        this.initHitboxes();
    }

    async getUserInfo()
    {
        this.userInfo = await playsaurusSdk.getUserProfile();
        // Update cached email verification status
        if(this.userInfo)
        {
            playsaurusSdk._emailVerified = this.userInfo.isEmailVerified;
        }
        this.avatarImage = this.createAvatarElement();
    }

    initHitboxes()
    {
        var xPadding = this.bodyPaddingX * this.bodyContainer.boundingBox.width;
        var yPadding = this.bodyPaddingY * this.bodyContainer.boundingBox.height;

        let avatar = this.bodyContainer.addHitbox(new Hitbox(
            {
                x: xPadding,
                y: yPadding,
                width: this.avatarHeight * this.bodyContainer.boundingBox.height,
                height: this.avatarHeight * this.bodyContainer.boundingBox.height
            },
            {}
        ));
        avatar.render = this.renderAvatar.bind(avatar, this);

        let headerX = avatar.boundingBox.x + avatar.boundingBox.width + xPadding;
        let headerWidth = this.bodyContainer.boundingBox.width - avatar.boundingBox.width - 3 * xPadding;
        let header = this.bodyContainer.addHitbox(new Hitbox(
            {
                x: headerX,
                y: yPadding,
                width: headerWidth,
                height: this.headerHeight * this.bodyContainer.boundingBox.height
            },
            {}
        ));
        header.render = this.renderHeader.bind(header, this);
        header.isVisible = () => this.userInfo != null && this.userInfo.isEmailVerified;

        let subheader = this.bodyContainer.addHitbox(new Hitbox(
            {
                x: headerX,
                y: header.boundingBox.y + header.boundingBox.height,
                width: headerWidth,
                height: this.subheaderHeight * this.bodyContainer.boundingBox.height
            },
            {}
        ));
        subheader.render = this.renderSubheader.bind(subheader, this);
        subheader.isVisible = () => this.userInfo != null && this.userInfo.isEmailVerified;

        // Verification message (shown when email not verified)
        let verifyMessageY = avatar.boundingBox.y + avatar.boundingBox.height + yPadding;
        let verifyMessage = this.bodyContainer.addHitbox(new Hitbox(
            {
                x: xPadding,
                y: verifyMessageY,
                width: this.bodyContainer.boundingBox.width - 2 * xPadding,
                height: this.headerHeight * this.bodyContainer.boundingBox.height
            },
            {}
        ));
        verifyMessage.render = this.renderVerifyMessage.bind(verifyMessage, this);
        verifyMessage.isVisible = () => this.userInfo != null && !this.userInfo.isEmailVerified;

        let editButtonWidth = this.bodyContainer.boundingBox.width * this.editButtonWidth;
        let editButtonHeight = this.bodyContainer.boundingBox.width * this.editButtonHeight;
        let editButtonX = this.bodyContainer.boundingBox.width / 2 - editButtonWidth / 2;
        let editButtonY = this.bodyContainer.boundingBox.height - yPadding - editButtonHeight * 2 - yPadding;

        // Edit Profile button (verified only)
        let editButton = this.createButton(
            startb,
            _("Edit Profile"),
            {
                x: editButtonX,
                y: editButtonY,
                width: editButtonWidth,
                height: editButtonHeight
            },
            function ()
            {
                playsaurusSdk.editUserProfile();
            }.bind(this)
        );
        editButton.isVisible = () => this.userInfo != null && this.userInfo.isEmailVerified;
        editButton.isEnabled = () => this.userInfo != null && this.userInfo.isEmailVerified;

        // Resend Email button (unverified only)
        let resendButton = this.createButton(
            startb,
            _("Resend Email"),
            {
                x: editButtonX,
                y: editButtonY,
                width: editButtonWidth,
                height: editButtonHeight
            },
            function ()
            {
                playsaurusSdk.resendEmailVerification().then(function(result)
                {
                    if(result)
                    {
                        newNews(_("Verification email sent!"));
                    }
                });
            }.bind(this)
        );
        resendButton.isVisible = () => this.userInfo != null && !this.userInfo.isEmailVerified;
        resendButton.isEnabled = () => this.userInfo != null && !this.userInfo.isEmailVerified;

        let logoutButtonY = editButtonY + editButtonHeight + yPadding;
        let logoutButton = this.createButton(
            startb,
            _("Logout"),
            {
                x: editButtonX,
                y: logoutButtonY,
                width: editButtonWidth,
                height: editButtonHeight
            },
            function ()
            {
                playsaurusSdk.logout();
            }.bind(this)
        );
        logoutButton.isVisible = () => this.userInfo != null;
        logoutButton.isEnabled = () => this.userInfo != null;
    }

    createAvatarElement()
    {
        let img = new Image();
        img.src = this.userInfo.avatarUrl;
        const canvas = document.createElement("canvas");

        img.onload = function ()
        {
            const context = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY);

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.closePath();
            context.clip();
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = this.userInfo.avatarUrl;
        return canvas;
    }

    createButton(image, text, boundingBox, clickFunction)
    {
        var button = this.bodyContainer.addHitbox(new Hitbox(
            boundingBox,
            {
                onmousedown: function (e)
                {
                    if(clickFunction)
                    {
                        clickFunction();
                    }
                    this.actionTaken = true;
                    this.close();
                }.bind(this)
            }
        ));
        button.root = this;
        button.image = image;
        button.text = text;
        button.render = function ()
        {
            var coords = this.getRelativeCoordinates(0, 0, this.root);
            var context = this.root.context;
            context.drawImage(this.image, coords.x, coords.y, this.boundingBox.width, this.boundingBox.height);

            context.font = (this.boundingBox.height * 0.6) + "px KanitM";
            context.fillStyle = "#FFFFFF";
            context.textBaseline = "middle";
            context.lineWidth = 4;
            drawNineSlice(
                context,
                this.image,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.height,
                31,
                24
            );
            strokeTextShrinkToFit(
                context,
                this.text,
                coords.x + (this.boundingBox.width * 0.075),
                coords.y + (this.boundingBox.height * 0.51),
                this.boundingBox.width * .85,
                "center"
            );
            fillTextShrinkToFit(
                context,
                this.text,
                coords.x + (this.boundingBox.width * 0.075),
                coords.y + (this.boundingBox.height * 0.51),
                this.boundingBox.width * .85,
                "center"
            );

        }
        return button;
    }

    render()
    {
        this.clearCanvas();
        this.context.fillStyle = "#FFFFFF";
        this.context.strokeStyle = "#000000";
        this.context.lineWidth = 4;
        this.context.textBaseline = "top";
        this.context.font = this.defaultFont;
        super.render();
    }

    renderVerifyMessage(root)
    {
        if(!root.userInfo) return;
        let coords = this.getRelativeCoordinates(0, 0, root);
        root.context.save();
        root.context.fillStyle = "#ffcc44";
        root.context.font = (this.boundingBox.height * 0.45) + "px KanitM";
        root.context.textBaseline = "top";
        root.context.lineWidth = 3;
        root.context.strokeStyle = "#000000";
        strokeTextShrinkToFit(
            root.context,
            _("Please verify your email to use account features."),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "center"
        );
        fillTextShrinkToFit(
            root.context,
            _("Please verify your email to use account features."),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "center"
        );
        root.context.restore();
    }

    renderAvatar(root)
    {
        if(!root.userInfo) return;
        root.context.save();
        root.context.lineWidth = 2;
        let coords = this.getRelativeCoordinates(0, 0, root);
        drawImageFitInBox(
            root.context,
            root.avatarImage,
            coords.x,
            coords.y,
            this.boundingBox.width,
            this.boundingBox.height
        )
        root.context.beginPath();
        root.context.arc(
            coords.x + this.boundingBox.width / 2,
            coords.y + this.boundingBox.height / 2,
            this.boundingBox.width / 2,
            0,
            Math.PI * 2
        );
        root.context.stroke();

        root.context.restore();
    }

    renderHeader(root)
    {
        if(!root.userInfo) return;
        let coords = this.getRelativeCoordinates(0, 0, root);
        root.context.font = this.boundingBox.height + "px KanitM";
        strokeTextShrinkToFit(
            root.context,
            _("Welcome, {0}", root.userInfo.username),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "left"
        );
        fillTextShrinkToFit(
            root.context,
            _("Welcome, {0}", root.userInfo.username),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "left"
        );
        root.font = root.context.defaultFont;
    }

    renderSubheader(root)
    {
        if(!root.userInfo) return;
        let coords = this.getRelativeCoordinates(0, 0, root);
        root.context.font = this.boundingBox.height + "px KanitM";
        strokeTextShrinkToFit(
            root.context,
            _("Playsaurus Account holder since {0}", root.userInfo.createdAt.getFullYear()),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "left"
        );
        fillTextShrinkToFit(
            root.context,
            _("Playsaurus Account holder since {0}", root.userInfo.createdAt.getFullYear()),
            coords.x,
            coords.y,
            this.boundingBox.width,
            "left"
        );
        root.context.font = root.defaultFont;
    }
}