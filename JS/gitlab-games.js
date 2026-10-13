/* Pack games on GitHub Pages — load AFTER JS/main.js
 * Host: https://whatchamacallitexe.github.io/pack-a .. pack-j

(function () {
  if (typeof _0xData === "undefined") return;

  var GH = "https://whatchamacallitexe.github.io";

  var packs = {
    "a": "1,10-minutes-till-dawn,2048,3-pandas-in-japan,9007199254740992,adam-and-eve,adam-and-eve-2,block-the-pig,color-match,crossy-road,cubes-2048-io,cut-the-rope,fancy-pants-adventures,flappy-bird,geometry-dash,go-ball,hextris,minesweeper,papas-pizzeria,polybranch,silk,solitaire,spider-solitaire,subway-surfers-ny,swingo,traffic-mania,wallsmash,wordle,wordle-unlimited",
    "b": "achievement-unlocked,adventures-with-anxiety,alien-hominid,amidst-the-sky,angry-sharks,big-red-button,connect-3,cookie-clicker,deal-or-no-deal,deepest-sword,dino-bros,dots-io,fancy-pants-2,football-brawl,meme-2048,papas-burgeria,protektor,sort-the-court,sprinter,superhot,there-is-no-game,tiny-islands,tower-crash-3d,waterworks,wizard-mike,word-slide",
    "c": "1010-deluxe,3d-bowling,animal-io,avalanche,bacon-may-die,cluster-rush,duck-life,dummy-never-fails,dummy-never-fails-2,edge-not-found,eel-slap,factory-balls,fancy-pants-3,flash-tetris,hacker-typer,papas-taco-mia,space-bar-clicker,temple-of-boom,volley-random,wood-block-puzzle,woodventure,xx142-b2exe",
    "d": "among-us,bad-ice-cream,bad-ice-cream-2,bad-ice-cream-3,basket-champs,blumgi-slime,bob-the-robber-2,boxel-rebound,circloo,circloo-2,core-ball,duck-life-2,evolution,exo,fake-virus,g-switch,google-feud,gun-mayhem,gun-mayhem-2,handshakes,happy-wheels,papas-freezeria,penalty-kick,veloce",
    "e": "baldis-basics,ball-sort-halloween,ball-sort-puzzle,big-shot-boxing,bottle-flip,cell-machine,checkers-legend,dante,doodle-jump,drift-boss,drive-mad,duck-life-3-evolution,evil-glitch,farm-match,game-inside-a-game,gimme-the-airpod,hanger,level-devil,mario,ovo,papas-pancakeria,papas-wingeria,push-your-luck,whack-your-boss",
    "f": "adrenaline-challenge,ages-of-conflict,ballistic,bally,bitlife,black-hole-square,bloons-tower-defense,bloxorz,car-rush,dragon-vs-bricks,duck-life-4,eggy-car,george-and-the-printer,go-tet,guess-the-kitty,gunblood,happy-hop,iron-snout,just-one-boss,moto-x3m,push-the-square,roper,save-the-doge",
    "g": "a-dance-of-fire-and-ice,bitcoin-clicker,bloons-tower-defense-2,boxing-random,capybara-clicker,eagle-ride,fruit-ninja,get-on-top,head-soccer,idle-light-city,learn-to-fly,offline-paradise,riddle-school,riddle-school-2,riddle-school-3,soccer-random,wheely-2",
    "h": "1-on-1-soccer,backrooms-2d,basket-and-ball,basket-random,bloons-tower-defense-4,idle-breakout,idle-tree-city,kingdom-rush,learn-to-fly-2,particle-clicker,pou,retro-bowl,riddle-school-4,riddle-school-5,riddle-transfer,riddle-transfer-2,stick-merge",
    "i": "a-dark-room,ball-sort-soccer,biker-street,dodge,down-the-hill,draw-the-hill,electron-dash,galaga,goodnight,icycle,little-alchemy-2,plants-vs-zombies,rise-higher,sandboxels,snow-rider-3d,stickman-go,synesthesia,the-impossible-quiz,townscaper,we-become-what-we-behold",
    "j": "apple-shooter,champion-archer,cubefield,edge-surf,fireboy-and-watergirl,getting-over-it,helicopter,kitten-cannon,missiles,n-gon,ns-shaft,om-nom-bounce,pac-man,space-company,subway-surfers,twitch-tetris"
  };

  // slug -> pack letter
  var slugToPack = Object.create(null);
  Object.keys(packs).forEach(function (letter) {
    packs[letter].split(",").forEach(function (slug) {
      slug = slug.trim().toLowerCase();
      if (slug && !slugToPack[slug]) slugToPack[slug] = letter;
    });
  });

  function packUrl(letter, slug) {
    return GH + "/pack-" + letter + "/" + slug + "/";
  }

  var ids = Object.create(null);
  var fixed = 0;
  var added = 0;

  // 1) Rewrite existing entries that match a pack slug (old gfiles / gitlab / games-* URLs)
  for (var i = 0; i < _0xData.length; i++) {
    var game = _0xData[i];
    if (game.id != null) ids[String(game.id)] = true;

    var slug = null;
    if (game.id) {
      var rawId = String(game.id).toLowerCase();
      // gl_apple_shooter -> apple-shooter
      if (rawId.indexOf("gl_") === 0) {
        slug = rawId.slice(3).replace(/_/g, "-");
      } else {
        slug = rawId.replace(/_/g, "-");
      }
    }
    if (!slugToPack[slug] && game.url) {
      var m = String(game.url).match(
        /(?:gfiles\d*|games-[a-j]|pack-[a-j]|gitlab\.io\/[^/]+)\/([^/?#]+)/i
      );
      if (m) slug = m[1].toLowerCase();
    }

    if (slug && slugToPack[slug]) {
      var letter = slugToPack[slug];
      var next = packUrl(letter, slug);
      if (game.url !== next) {
        game.url = next;
        game.external = true;
        fixed++;
      }
    }
  }

  // 2) Add any pack games missing from the library
  Object.keys(slugToPack).forEach(function (slug) {
    var letter = slugToPack[slug];
    var id = "gl_" + slug.replace(/-/g, "_");
    if (ids[id] || ids[slug]) return;

    // also skip if any entry already has this slug as id
    var already = false;
    for (var j = 0; j < _0xData.length; j++) {
      var g = _0xData[j];
      if (!g) continue;
      if (String(g.id || "").toLowerCase() === slug) {
        already = true;
        break;
      }
      if (g.url && String(g.url).toLowerCase().indexOf("/" + slug + "/") !== -1) {
        already = true;
        break;
      }
    }
    if (already) return;

    var title = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });

    _0xData.push({
      id: id,
      title: title,
      url: packUrl(letter, slug),
      external: true,
      desc: "Play " + title + " online.",
      popular: true
    });
    ids[id] = true;
    added++;
  });

  console.log("[pack] fixed", fixed, "urls, added", added, "games");

  if (typeof renderLibraryGrid === "function") {
    try {
      renderLibraryGrid(_0xData);
    } catch (e) {
      console.error("[pack] render failed:", e);
    }
  }
})();
*/
