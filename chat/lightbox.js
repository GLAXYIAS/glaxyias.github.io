// Image lightbox for chat attachments — loads after chat.js
(function () {
    const IMG_MARKER = "[[IMG]]";

    window.renderMessageBody = function (content) {
        if (typeof content === "string" && content.startsWith(IMG_MARKER)) {
            const url = content.slice(IMG_MARKER.length);
            const safeUrl = url
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            return (
                '<img src="' +
                safeUrl +
                '" class="chat-attached-image" data-full-src="' +
                safeUrl +
                '" onclick="window.openImageLightbox(this.getAttribute(\'data-full-src\') || this.src)" alt="attachment" title="Click to enlarge">'
            );
        }
        // Mentions/reply quotes are rendered by chat-actions.js.
        if (typeof window.nxRenderMessageBody === "function") {
            return window.nxRenderMessageBody(content);
        }
        return content;
    };

    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let originPanX = 0;
    let originPanY = 0;

    function els() {
        return {
            overlay: document.getElementById("image-lightbox"),
            img: document.getElementById("lightbox-img"),
            stage: document.getElementById("lightbox-stage"),
            label: document.getElementById("lightbox-zoom-label"),
            backdrop: document.querySelector("#image-lightbox .image-lightbox-backdrop"),
            btnIn: document.getElementById("lightbox-zoom-in"),
            btnOut: document.getElementById("lightbox-zoom-out"),
            btnReset: document.getElementById("lightbox-zoom-reset"),
            btnClose: document.getElementById("lightbox-close"),
        };
    }

    function applyTransform() {
        const { img, label } = els();
        if (!img) return;
        img.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + scale + ")";
        if (label) label.textContent = Math.round(scale * 100) + "%";
    }

    function setZoom(next) {
        scale = Math.min(8, Math.max(0.25, next));
        if (scale <= 1) {
            panX = 0;
            panY = 0;
        }
        applyTransform();
    }

    window.openImageLightbox = function (src) {
        if (!src) return;
        const { overlay, img } = els();
        if (!overlay || !img) return;
        scale = 1;
        panX = 0;
        panY = 0;
        img.src = src;
        applyTransform();
        overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    };

    function closeLightbox() {
        const { overlay, img } = els();
        if (!overlay) return;
        overlay.classList.add("hidden");
        if (img) img.src = "";
        document.body.style.overflow = "";
        scale = 1;
        panX = 0;
        panY = 0;
    }

    function bindOnce() {
        const { overlay, stage, backdrop, btnIn, btnOut, btnReset, btnClose } = els();
        if (!overlay || overlay.dataset.bound === "1") return;
        overlay.dataset.bound = "1";

        if (btnClose) btnClose.addEventListener("click", closeLightbox);
        if (backdrop) backdrop.addEventListener("click", closeLightbox);
        if (btnIn) btnIn.addEventListener("click", function () { setZoom(scale * 1.25); });
        if (btnOut) btnOut.addEventListener("click", function () { setZoom(scale / 1.25); });
        if (btnReset) btnReset.addEventListener("click", function () {
            scale = 1; panX = 0; panY = 0; applyTransform();
        });

        if (stage) {
            stage.addEventListener("wheel", function (e) {
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
                setZoom(scale * factor);
            }, { passive: false });

            stage.addEventListener("mousedown", function (e) {
                if (e.button !== 0) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                originPanX = panX;
                originPanY = panY;
                stage.classList.add("is-dragging");
                e.preventDefault();
            });
        }

        window.addEventListener("mousemove", function (e) {
            if (!isDragging) return;
            panX = originPanX + (e.clientX - startX);
            panY = originPanY + (e.clientY - startY);
            applyTransform();
        });

        window.addEventListener("mouseup", function () {
            if (!isDragging) return;
            isDragging = false;
            const s = document.getElementById("lightbox-stage");
            if (s) s.classList.remove("is-dragging");
        });

        var lastTouchDist = null;
        if (stage) {
            stage.addEventListener("touchstart", function (e) {
                if (e.touches.length === 2) {
                    var a = e.touches[0], b = e.touches[1];
                    lastTouchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                } else if (e.touches.length === 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    originPanX = panX;
                    originPanY = panY;
                }
            }, { passive: true });

            stage.addEventListener("touchmove", function (e) {
                if (e.touches.length === 2 && lastTouchDist != null) {
                    e.preventDefault();
                    var a = e.touches[0], b = e.touches[1];
                    var dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                    var factor = dist / lastTouchDist;
                    lastTouchDist = dist;
                    setZoom(scale * factor);
                } else if (e.touches.length === 1 && isDragging) {
                    e.preventDefault();
                    panX = originPanX + (e.touches[0].clientX - startX);
                    panY = originPanY + (e.touches[0].clientY - startY);
                    applyTransform();
                }
            }, { passive: false });

            stage.addEventListener("touchend", function () {
                lastTouchDist = null;
                isDragging = false;
            });
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                var o = document.getElementById("image-lightbox");
                if (o && !o.classList.contains("hidden")) {
                    closeLightbox();
                    e.stopImmediatePropagation();
                }
            }
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindOnce);
    } else {
        bindOnce();
    }
})();

// Rewrite attached images so they open the lightbox even if chat.js uses window.open
(function watchChatImages() {
    function upgrade(img) {
        if (!img || img.dataset.lbUpgraded === "1") return;
        if (!img.classList.contains("chat-attached-image")) return;
        img.dataset.lbUpgraded = "1";
        img.title = img.title || "Click to enlarge";
        img.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var src = img.getAttribute("data-full-src") || img.src;
            if (window.openImageLightbox) window.openImageLightbox(src);
        }, true);
        img.removeAttribute("onclick");
    }
    function scan(root) {
        (root.querySelectorAll ? root.querySelectorAll("img.chat-attached-image") : []).forEach(upgrade);
    }
    scan(document);
    var mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (n) {
                if (n.nodeType !== 1) return;
                if (n.matches && n.matches("img.chat-attached-image")) upgrade(n);
                scan(n);
            });
        });
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();
