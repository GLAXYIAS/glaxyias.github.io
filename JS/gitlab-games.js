// GitLab Pages games (games-a..j) — load AFTER JS/main.js
(function () {
  if (typeof _0xData === "undefined") return;
  var GL = "https://declineoptionalcookies.gitlab.io";
  var packs = {"a": "1,10-minutes-till-dawn,2048,3-pandas-in-japan,9007199254740992,adam-and-eve,adam-and-eve-2,block-the-pig,color-match,crossy-road,cubes-2048-io,cut-the-rope,fancy-pants-adventures,flappy-bird,geometry-dash,go-ball,hextris,minesweeper,papas-pizzeria,polybranch,silk,solitaire,spider-solitaire,subway-surfers-ny,swingo,traffic-mania,wallsmash,wordle,wordle-unlimited", "b": "achievement-unlocked,adventures-with-anxiety,alien-hominid,amidst-the-sky,angry-sharks,big-red-button,connect-3,cookie-clicker,deal-or-no-deal,deepest-sword,dino-bros,dots-io,fancy-pants-2,football-brawl,meme-2048,papas-burgeria,protektor,sort-the-court,sprinter,superhot,there-is-no-game,tiny-islands,tower-crash-3d,waterworks,wizard-mike,word-slide", "c": "1010-deluxe,3d-bowling,animal-io,avalanche,bacon-may-die,cluster-rush,duck-life,dummy-never-fails,dummy-never-fails-2,edge-not-found,eel-slap,factory-balls,fancy-pants-3,flash-tetris,hacker-typer,papas-taco-mia,space-bar-clicker,temple-of-boom,volley-random,wood-block-puzzle,woodventure,xx142-b2exe", "d": "among-us,bad-ice-cream,bad-ice-cream-2,bad-ice-cream-3,basket-champs,blumgi-slime,bob-the-robber-2,boxel-rebound,circloo,circloo-2,core-ball,duck-life-2,evolution,exo,fake-virus,g-switch,google-feud,gun-mayhem,gun-mayhem-2,handshakes,happy-wheels,papas-freezeria,penalty-kick,veloce", "e": "baldis-basics,ball-sort-halloween,ball-sort-puzzle,big-shot-boxing,bottle-flip,cell-machine,checkers-legend,dante,doodle-jump,drift-boss,drive-mad,duck-life-3-evolution,evil-glitch,farm-match,game-inside-a-game,gimme-the-airpod,hanger,level-devil,mario,ovo,papas-pancakeria,papas-wingeria,push-your-luck,whack-your-boss", "f": "adrenaline-challenge,ages-of-conflict,ballistic,bally,bitlife,black-hole-square,bloons-tower-defense,bloxorz,car-rush,dragon-vs-bricks,duck-life-4,eggy-car,george-and-the-printer,go-tet,guess-the-kitty,gunblood,happy-hop,iron-snout,just-one-boss,moto-x3m,push-the-square,roper,save-the-doge", "g": "a-dance-of-fire-and-ice,bitcoin-clicker,bloons-tower-defense-2,boxing-random,capybara-clicker,eagle-ride,fruit-ninja,get-on-top,head-soccer,idle-light-city,learn-to-fly,offline-paradise,riddle-school,riddle-school-2,riddle-school-3,soccer-random,wheely-2", "h": "1-on-1-soccer,backrooms-2d,basket-and-ball,basket-random,bloons-tower-defense-4,idle-breakout,idle-tree-city,kingdom-rush,learn-to-fly-2,particle-clicker,pou,retro-bowl,riddle-school-4,riddle-school-5,riddle-transfer,riddle-transfer-2,stick-merge", "i": "a-dark-room,ball-sort-soccer,biker-street,dodge,down-the-hill,draw-the-hill,electron-dash,galaga,goodnight,icycle,little-alchemy-2,plants-vs-zombies,rise-higher,sandboxels,snow-rider-3d,stickman-go,synesthesia,the-impossible-quiz,townscaper,we-become-what-we-behold", "j": "apple-shooter,champion-archer,cubefield,edge-surf,fireboy-and-watergirl,getting-over-it,helicopter,kitten-cannon,missiles,n-gon,ns-shaft,om-nom-bounce,pac-man,space-company,subway-surfers,twitch-tetris"};
  var ids = {};
  for (var i = 0; i < _0xData.length; i++) ids[_0xData[i].id] = 1;
  var urlHints = _0xData.map(function (g) { return String(g.url || "").toLowerCase(); });
  var added = 0;
  Object.keys(packs).forEach(function (letter) {
    var repo = "games-" + letter;
    packs[letter].split(",").forEach(function (slug) {
      slug = slug.trim();
      if (!slug) return;
      var id = "gl_" + slug.replace(/-/g, "_");
      if (ids[id]) return;
      var hasLocal = urlHints.some(function (u) { return u.indexOf(slug) !== -1; });
      if (hasLocal) return;
      var title = slug.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      _0xData.push({
        id: id,
        title: title,
        url: GL + "/" + repo + "/" + slug + "/",
        external: true,
        desc: "GitLab Pages (" + repo + ")",
        popular: true
      });
      ids[id] = 1;
      added++;
    });
  });
  console.log("[GitLab Pages] added", added, "games");
  if (typeof renderLibraryGrid === "function") {
    try { renderLibraryGrid(_0xData); } catch (e) {}
  }
})();
