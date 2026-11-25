#!/usr/bin/env python3
"""Refresh the Null X startup prototype.

Run with the path to brand-new-start-up-screen/index.html.
Every replacement must match exactly once so a stale file fails loudly.
"""

import pathlib
import sys

PATH = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "brand-new-start-up-screen/index.html")
src = PATH.read_text(encoding="utf-8")


def replace(old: str, new: str) -> None:
    global src
    count = src.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one match, found {count}:\n{old[:200]}")
    src = src.replace(old, new, 1)


# ---------------------------------------------------------------------------
# New view styles
# ---------------------------------------------------------------------------

NEW_CSS = """
/* home / library views */

.homeView{animation:viewIn .28s var(--ease)}
.libraryView{
  padding-top:14px;
  min-height:calc(100vh - 108px);
  outline:none;
  animation:viewIn .3s var(--ease);
}
@keyframes viewIn{
  from{opacity:0;transform:translateY(9px)}
  to{opacity:1;transform:none}
}

body.is-library .aside,
body.is-library .foot{display:none}

@media (min-width:761px){
  body.is-library .shell{grid-template-columns:var(--rail) minmax(0,1fr)}
}

.lib__top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 0 14px;
  border-bottom:1px solid var(--line);
  margin-bottom:20px;
}
.lib__back,
.lib__close{
  display:inline-flex;
  align-items:center;
  gap:8px;
  height:30px;
  padding:0 10px;
  border:1px solid var(--line);
  border-radius:2px;
  font-family:var(--mono);
  font-size:9px;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--mute);
  transition:border-color .16s var(--ease),color .16s var(--ease),background .16s var(--ease);
}
.lib__back:hover,
.lib__close:hover{
  border-color:rgba(224,122,0,.55);
  color:var(--ink);
  background:var(--orange-wash);
}
.lib__back svg{width:12px;height:12px}
.lib__close .kbd{height:16px;min-width:16px;font-size:8px}
.lib__mode{
  font-family:var(--mono);
  font-size:8.5px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--mute-2);
}
.lib__note{
  margin:7px 0 0;
  font-family:var(--mono);
  font-size:8.5px;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--mute-2);
}

@media (max-width:760px){
  .lib__top{padding-top:10px}
  .lib__mode{display:none}
  .lib__close .kbd{display:none}
  .libraryView{min-height:calc(100vh - 120px)}
}

"""
replace("/* responsive */", NEW_CSS + "/* responsive */")

# ---------------------------------------------------------------------------
# Copy in the owner's voice
# ---------------------------------------------------------------------------

replace(
    """          A browser arcade for the five minutes before class, the free period, and the lesson
          whose slides you already read. <b>1,575 games</b>, a calculator that keeps quiet,
          and a proxy for when the network gets nosy. Nothing to install, no account needed.""",
    """          Five minutes before class, the free period, or a lesson where the slides are already
          done — this is the arcade for that. <b>1,575 games</b>, a calculator, and a proxy
          for when the school network gets annoying. No installs, no account.""",
)

replace("Six that hold up", "Six that actually hold up")
replace("Picked by hand, not by ranking", "Hand-picked, not ranked")
replace("<a href=\"#library\">Browse the shelf ↓</a>", "<a href=\"#library\" data-open-library>Open the library →</a>")

replace(
    "Theme pass: darker orange, background picker moved into its own popout.",
    "Theme update: darker orange, and the background picker has its own popout now.",
)
replace(
    "Upgrade pack — Ctrl+K search, XP, achievements, daily streaks and themes.",
    "Upgrade pack is in: Ctrl+K search, XP, achievements, daily streaks, themes.",
)
replace(
    "Library cleaned: virtual grid, four across, only games that actually launch.",
    "Library cleanup: four across, and only games that actually launch.",
)
replace(
    "Settings → Game Display: switch iframes off for stubborn Unity builds.",
    "Settings → Game Display: turn iframes off for the Unity games that won't load.",
)
replace(
    "Pack games moved onto GitHub (pack-a through pack-j). Dead links removed.",
    "Pack games moved to GitHub (pack-a to pack-j). Dead links are gone.",
)

replace(
    "A browser arcade, kept running by Glaxyias. Games belong to the people who made them.",
    "A browser arcade run by Glaxyias. The games belong to the people who made them.",
)
replace("Prototype — live homepage untouched", "Prototype build — the live homepage is still the old one.")
replace(
    "Nothing on the shelf matches that. Try a shorter word.",
    "Nothing matches that. Try a shorter word.",
)

# ---------------------------------------------------------------------------
# Sidebar links
# ---------------------------------------------------------------------------

replace(
    '<a class="rail__item is-active" href="#top" data-nav="home">',
    '<a class="rail__item is-active" href="#top" data-nav="home" aria-controls="homeView">',
)
replace(
    '<a class="rail__item" href="#library" data-nav="library">',
    '<a class="rail__item" href="#library" data-nav="library" aria-controls="libraryView">',
)
replace(
    '<a class="rail__item" href="#library" data-favs="1">',
    '<a class="rail__item" href="#saved" data-favs="1" aria-controls="libraryView">',
)

# ---------------------------------------------------------------------------
# Split the home content from the library view
# ---------------------------------------------------------------------------

replace(
    '<section class="hero" aria-labelledby="hero-title">',
    '<div class="homeView" id="homeView">\n\n    <section class="hero" aria-labelledby="hero-title">',
)

replace(
    """    </section>

    <section class="sec" id="library" aria-labelledby="lib-title">
      <div class="lib__head">
        <div>
          <p class="eyebrow">03 — The library</p>
          <h2 class="sec__title" id="lib-title">The whole shelf</h2>
        </div>""",
    """    </section>

    </div>

    <section class="sec libraryView" id="libraryView" aria-labelledby="lib-title" tabindex="-1" hidden>
      <div class="lib__top">
        <button class="lib__back" type="button" id="libraryBack">
          <svg aria-hidden="true"><use href="#i-left"/></svg>
          <span>Back to start</span>
        </button>
        <span class="lib__mode" id="libMode">All games</span>
        <button class="lib__close" type="button" id="libraryClose" aria-label="Close library">
          <span>Close</span><span class="kbd" aria-hidden="true">Esc</span>
        </button>
      </div>
      <div class="lib__head">
        <div>
          <p class="eyebrow" id="libEyebrow">The library</p>
          <h2 class="sec__title" id="lib-title">The whole shelf</h2>
          <p class="lib__note" id="libNote">Every game that actually launches.</p>
        </div>""",
)

replace(
    'Showing saved games only — <a href="#library" style="border-bottom:1px solid rgba(244,239,231,.3)">see everything</a>',
    'Showing saved games only — <a href="#library" data-show-all style="border-bottom:1px solid rgba(244,239,231,.3)">see everything</a>',
)

# ---------------------------------------------------------------------------
# JavaScript: view switching
# ---------------------------------------------------------------------------

replace(
    'var state = { q: "", tag: "All", sort: "default", limit: PAGE, favsOnly: false, seed: 1 };',
    'var state = { q: "", tag: "All", sort: "default", limit: PAGE, favsOnly: false, seed: 1 };\n  var currentView = "home";',
)

replace(
    """    statLoaded: $("#statLoaded")
  };""",
    """    statLoaded: $("#statLoaded"),
    homeView: $("#homeView"),
    libraryView: $("#libraryView"),
    libraryBack: $("#libraryBack"),
    libraryClose: $("#libraryClose"),
    libTitle: $("#lib-title"),
    libEyebrow: $("#libEyebrow"),
    libNote: $("#libNote"),
    libMode: $("#libMode")
  };""",
)

replace(
    """  function markActive(link) {
    $$(".rail__item").forEach(function (item) { item.classList.remove("is-active"); });
    if (link) link.classList.add("is-active");
  }
""",
    """  function markActive(link) {
    $$(".rail__item").forEach(function (item) { item.classList.remove("is-active"); });
    if (link) link.classList.add("is-active");
  }

  function updateLibraryChrome() {
    if (!els.libTitle) return;
    els.libTitle.textContent = state.favsOnly ? "Saved games" : "The whole shelf";
    if (els.libEyebrow) els.libEyebrow.textContent = state.favsOnly ? "Your shelf" : "The library";
    if (els.libNote) {
      els.libNote.textContent = state.favsOnly
        ? "The ones you starred. Saved in this browser."
        : "Every game that actually launches.";
    }
    if (els.libMode) els.libMode.textContent = state.favsOnly ? "Saved" : "All games";
  }

  function setView(view, keepQuery) {
    if (view !== "home" && view !== "library" && view !== "saved") view = "home";
    var inLibrary = view !== "home";

    currentView = view;
    state.favsOnly = view === "saved";

    if (!keepQuery) {
      state.q = "";
      state.tag = "All";
      if (els.q) els.q.value = "";
      setChip("All");
    }

    if (els.homeView) els.homeView.hidden = inLibrary;
    if (els.libraryView) els.libraryView.hidden = !inLibrary;
    document.body.classList.toggle("is-library", inLibrary);

    if (inLibrary) {
      state.limit = PAGE;
      updateLibraryChrome();
      renderGrid(true);
      markActive(view === "saved" ? $(".rail__item[data-favs]") : $(".rail__item[data-nav='library']"));
      try { history.replaceState(null, "", view === "saved" ? "#saved" : "#library"); } catch (err) { /* file:// */ }
      document.title = (view === "saved" ? "Saved" : "Library") + " — Null X";
      window.scrollTo(0, 0);
      if (els.libraryView) els.libraryView.focus();
    } else {
      markActive($(".rail__item[data-nav='home']"));
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (err) { /* file:// */ }
      document.title = "Null X — Startup";
      window.scrollTo(0, 0);
    }
  }
""",
)

replace(
    """      els.q.addEventListener("input", function () {
        clearTimeout(debounce);
        var value = els.q.value;
        debounce = setTimeout(function () {
          state.q = value;
          renderGrid(true);
        }, 80);
      });""",
    """      els.q.addEventListener("input", function () {
        clearTimeout(debounce);
        var value = els.q.value;
        debounce = setTimeout(function () {
          if (currentView === "home" && value.trim()) setView("library", true);
          state.q = value;
          renderGrid(true);
        }, 80);
      });""",
)

replace(
    """    if (els.reset) {
      els.reset.addEventListener("click", function () {
        state.q = "";
        state.tag = "All";
        state.favsOnly = false;
        if (els.q) els.q.value = "";
        setChip("All");
        renderGrid(true);
      });
    }""",
    """    if (els.reset) {
      els.reset.addEventListener("click", function () {
        var fromSaved = state.favsOnly;
        state.q = "";
        state.tag = "All";
        if (els.q) els.q.value = "";
        setChip("All");
        if (fromSaved) {
          setView("library");
        } else {
          state.favsOnly = false;
          updateLibraryChrome();
          renderGrid(true);
        }
      });
    }""",
)

replace(
    """    $$(".rail__item").forEach(function (item) {
      item.addEventListener("click", function () {
        markActive(item);
        if (item.hasAttribute("data-favs")) {
          state.favsOnly = true;
          renderGrid(true);
        } else if (item.getAttribute("data-nav") === "library") {
          state.favsOnly = false;
          renderGrid(true);
        }
      });
    });""",
    """    $$(".rail__item").forEach(function (item) {
      item.addEventListener("click", function (event) {
        if (item.hasAttribute("data-favs")) {
          event.preventDefault();
          setView("saved");
        } else if (item.getAttribute("data-nav") === "library") {
          event.preventDefault();
          setView("library");
        } else if (item.getAttribute("data-nav") === "home") {
          event.preventDefault();
          setView("home");
        }
        // External rail links keep their normal navigation.
      });
    });

    var brandLink = $(".rail__brand");
    if (brandLink) {
      brandLink.addEventListener("click", function (event) {
        event.preventDefault();
        setView("home");
      });
    }

    if (els.libraryBack) els.libraryBack.addEventListener("click", function () { setView("home"); });
    if (els.libraryClose) els.libraryClose.addEventListener("click", function () { setView("home"); });

    $$("[data-open-library]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        setView("library");
      });
    });

    $$("[data-show-all]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        setView("library");
      });
    });""",
)

replace(
    """        if (typing && els.q && document.activeElement === els.q) {
          els.q.value = "";
          state.q = "";
          renderGrid(true);
          els.q.blur();
        }
        return;
      }""",
    """        if (typing && els.q && document.activeElement === els.q) {
          els.q.value = "";
          state.q = "";
          renderGrid(true);
          els.q.blur();
          return;
        }
        if (currentView !== "home") {
          setView("home");
          return;
        }
      }""",
)

replace(
    """    tick();
    initEvents();
    restartDeck();
  }""",
    """    tick();
    initEvents();
    restartDeck();

    if (window.location.hash === "#saved") setView("saved");
    else if (window.location.hash === "#library") setView("library");
    else setView("home");
  }""",
)

PATH.write_text(src, encoding="utf-8")
print(f"Patched {PATH} ({len(src):,} bytes)")
