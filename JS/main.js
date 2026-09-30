(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const isStealthMode = urlParams.get('mode') === 'stealth';

    if (window.top !== window.self && !isStealthMode) {
        // LAYER 1: Primary attempt (Redirect out to external utility)
        try {
            window.top.location.replace("https://about:blank");
        } catch (e1) {
            // LAYER 2: Fallback attempt (Redirect back to your own domain URL)
            try {
                window.top.location.replace(window.self.location.href);
            } catch (e2) {
                // LAYER 3: Ultimate Fallback (No redirects. Freeze and destroy page content visually)
                console.warn("Cross-origin redirection blocked. Initiating local interface freeze.");
                document.documentElement.innerHTML = `
                    <div style="
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                        background: #000; color: #8b00ff; z-index: 99999999;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        font-family: monospace; padding: 20px; text-align: center; box-sizing: border-box;
                    ">
                        <h1 style="font-size: 24px; margin-bottom: 10px; border-bottom: 2px solid #8b00ff; padding-bottom: 10px;">ENVIRONMENTAL SECURITY FAULT</h1>
                        <p style="color: #ccc; font-size: 14px; max-width: 500px; margin: 0 auto 20px;">
                            This system dashboard cannot execute within embedded third-party viewport structures.
                        </p>
                        <div style="font-size: 11px; color: #444;">ERR_EMBED_RESTRICTION_TRIGGERED</div>
                    </div>
                `;
                window.stop();
                throw new Error("Execution halted due to framing restriction rules.");
            }
        }
    }
})();

// ==========================================
// DYNAMIC CORE SYSTEMS & GAMES REGISTER DATA
// ==========================================
let _0xData = [
  { id: "b_ap", title: "Brotato All Pain No Gain", url: "Games/brotatoAPNG/Brotato.html", image: "Games/brotatoAPNG/images (23).jpeg", desc: "The newest version of Brotato with the All Pain No Gain update.", popular: true },
{ id: "cloverpit", title: "cloverpit", url: "Games/cloverpit/index.html", desc: "Clover Pit is a roguelite gambling game where you spin, bet, and chase huge payouts while trying not to go broke.", popular: true , image: "Games/cloverpit/images.jpeg" },
    { id: "feedingablackhole", title: "Feeding A Black Hole", url: "Games/feedingablackhole/index.html", desc: "Feed a growing black hole, consume objects, and explore the world to become bigger and more powerful.", popular: true, image: "Games/feedingablackhole/images (1).jpeg" },
    { id: "deadsignal", title: "DeadSignal", url: "Games/DeadSignal/index.html", desc: "A Null-X-Team Special Creation!", popular: true },
  { id: "y_io", title: "Yohoho.io", url: "Games/yohoho/index.html", image: "Games/yohoho/images (24).jpeg", desc: "A pirate battle royale game where you collect gold and fight opponents.", popular: true },
  { id: "b_er", title: "Bitcoin Clicker", url: "Games/Bitcoin/index.html", image: "Games/Bitcoin/images (4).jpeg", jsbin: "https://glaxyias.github.io/Bitcoin-clicker/", isEmbedCode: true, desc: "A Homemade Special.", popular: true },
  { id: "s_lp", title: "Slope", url: "Games/slope/index.html", image: "Games/slope/images (25).jpeg", desc: "A fast-paced 3D platformer. Stay on the track!", popular: true },
  { id: "d_md", title: "DriveMad", url: "Games/drivemad/index.html", image: "Games/drivemad/images (26).jpeg", desc: "Challenging physics-based driving. Don't flip your truck!", popular: true },
  { id: "b_ft", title: "Bullet Force", url: "Games/bulletforce/index.html", image: "Games/bulletforce/images (27).jpeg", desc: "Action-packed multiplayer FPS. Dominate the battlefield.", popular: true },
  { id: "b_bb", title: "Baseball Bros", url: "Games/baseballbros/Baseballbros.html", image: "Games/baseballbros/images (28).jpeg", desc: "An arcade baseball game with fast-paced matches.", popular: true },
  { id: "b_kt", title: "Basket Bros", url: "Games/basketbros/Basketbros.html", image: "Games/basketbros/images (29).jpeg", desc: "Chaotic basketball with crazy dunks and quick matches.", popular: true },
  { id: "b_sts", title: "Basketball Stars", url: "Games/basketballstars/Basketballstars.html", image: "Games/basketballstars/images (30).jpeg", desc: "Fast-paced 1v1 street-style basketball matches.", popular: true },
  { id: "c_cc", title: "Cookie Clicker", url: "Games/cookieclicker/cookieclicker.html", jsbin: "https://codepen.io/Glaeesas/embed/EaZpPeO?default-tab=result&theme-id=dark", isEmbedCode: true, image: "Games/cookieclicker/images (35).jpeg", desc: "Click cookies to build an industrial empire.", popular: true },
  { id: "b_rd", title: "Basket Random", url: "Games/basketrandom/Basketrandom.html", image: "Games/basketrandom/images (5).jpeg", desc: "Fun basketball game featuring completely random physics parameters.", popular: true },
  { id: "r_bw", title: "Retro Bowl", url: "Games/retrobowl/Retrobowl.html", image: "/Games/retrobowl/images (6).jpeg", desc: "Manage your team and lead them to gridiron glory.", popular: true },
  { id: "a_us", title: "Among Us", url: "Games/amongus/Amongus.html", desc: "Complete tasks while avoiding hidden impostors.", popular: true , image: "Games/amongus/images (7).jpeg" },
  { id: "d_dk", title: "Doki Doki Literature Club", url: "Games/dokidoki/index.html", desc: "A deep psychological horror visual novel experience.", popular: true , image: "Games/dokidoki/images (1).jpeg" },
  { id: "p_tr", title: "PolyTrack", url: "Games/polytrack/index.html", desc: "A fast-paced low-poly racing game with crisp drifting controls.", popular: true , image: "Games/polytrack/images (2).jpeg" },
  { id: "a_gr", title: "Agar.io", url: "Games/agar/index.html", desc: "Multiplayer cells-eating battle arena. (May experience latency issues)", popular: true , image: "Games/agar/images.png" },
  { id: "t_ts", title: "Truck Sim", url: "Games/trucksim/index.html", desc: "Navigate tricky roads transporting heavy structural cargo safely.", popular: true , image: "Games/trucksim/Screenshot 2026-08-11 08.23.04.png" },
  { id: "t_pa", title: "Throw a Potato", url: "Games/TAPA/index.html", image: "Games/TAPA/images (20).jpeg", desc: "Physics arcade game where you launch a potato over complex obstacles.", popular: true },
  { id: "t_p2", title: "Throw a Potato 2", url: "Games/TAPA2/index.html", image: "Games/TAPA2/images.png", desc: "The official sequel featuring refined launch engines and bigger stages.", popular: true },
  { id: "t_to", title: "Tung Tung Tung Sahur Obby", url: "Games/T^3sahurobby/index.html", image: "Games/T^3sahurobby/images (21).jpeg", desc: "Meme-inspired obstacle map built to test jumping accuracy.", popular: true },
  { id: "t_tb", title: "Tung Baldi Basics", url: "Games/tungbaldibasics/index.html", desc: "Horror puzzle game featuring surreal environments and puzzle challenges.", popular: true , image: "Games/tungbaldibasics/images (1).png" },
  { id: "w_dl", title: "Wordle", url: "Games/wordle/index.html", desc: "Figure out the daily hidden five-letter word within six attempts.", popular: true , image: "Games/wordle/images (2).png" },
  { id: "v_3x", title: "Vex 3 Xmas", url: "Games/Vex/Vex3Xmas/index.html", desc: "Festive holiday edition of the classic stickman parkour challenge.", popular: true , image: "Games/Vex/Vex3Xmas/images (3).jpeg" },
  { id: "v_4", title: "Vex 4", url: "Games/Vex/Vex4/index.html", desc: "Sprint, leap, and dodge deadly stage traps dynamically.", popular: true , image: "Games/Vex/Vex4/images (4).jpeg" },
  { id: "v_5", title: "Vex 5", url: "Games/Vex/Vex5/index.html", desc: "Hardcore level obstacles matching elite timing requirements.", popular: true , image: "Games/Vex/Vex5/images (5).jpeg" },
  { id: "v_6", title: "Vex 6", url: "Games/Vex/Vex6/index.html", desc: "Refined stickman parkour tracks with brand new stage assets.", popular: true , image: "Games/Vex/Vex6/images (6).jpeg" },
  { id: "v_7", title: "Vex 7", url: "Games/Vex/Vex7/index.html", desc: "Complex levels engineered to test your reflexes.", popular: true , image: "Games/Vex/Vex7/images (7).jpeg" },
  { id: "v_8", title: "Vex 8", url: "Games/Vex/Vex8/index.html", desc: "The absolute latest installment in the Vex platforming franchise.", popular: true , image: "Games/Vex/Vex8/images (8).jpeg" },
  { id: "v_ch", title: "Vex Challenges", url: "Games/Vex/VexChallenges/index.html", desc: "Bite-sized high-speed speedrunning tasks for testing agility.", popular: true , image: "Games/Vex/VexChallenges/images (9).jpeg" },
  { id: "v_x2", title: "Vex x3m 2", url: "Games/Vex/Vexx3m2/index.html", desc: "Extreme driving mechanics combined with classic Vex obstacle formats.", popular: true , image: "Games/Vex/Vex3/images (22).jpeg" },
  { id: "v_xm", title: "Vex x3m", url: "Games/Vex/Vexx3m/index.html", desc: "Blast through motorcycle speed trials with tight balance adjustments.", popular: true , image: "Games/Vex/Vexx3m/images (10).jpeg" },
  { id: "v_3", title: "Vex 3", url: "Games/Vex/Vex3/index.html", image: "Games/Vex/Vex3/images (22).jpeg", desc: "The iconic original entry into the parkour system.", popular: true },
  { id: "slice_master", title: "Slice Master", url: "Games/slicemaster/index.html", desc: "Flip your blades accurately to chop items clean in half down the line.", popular: true , image: "Games/slicemaster/images (2).jpeg" },
  { id: "skinwalker", title: "Skinwalker", url: "Games/skinwalker/index.html", desc: "Atmospheric survival horror centered around staying undetected outdoors.", popular: true , image: "Games/skinwalker/images (7).jpeg" },
  { id: "skib_shooter", title: "Skib Shooters", url: "Games/skibshooter/index.html", desc: "Dynamic target arena where waves of attackers stream in continuously.", popular: true , image: "Games/skibshooter/images (10).jpeg" },
  { id: "ragdoll_drop", title: "Ragdoll Drop", url: "Games/ragdrop/index.html", jsbin: "https://codepen.io/Glaeesas/embed/OPWZjEg?default-tab=result&theme-id=dark", isEmbedCode: true, desc: "Drop your structural targets down pins to clear high score records.", popular: true , image: "Games/ragdrop/images (3).jpeg" },
  { id: "g_spin", title: "Gun Spin", url: "Games/gunspin/gunspin.html", desc: "Launch your firearm through the air and use recoil strategically to travel the greatest distance possible.", popular: true , image: "Games/gunspin/images (4).jpeg" },
  { id: "gm_1", title: "Gun Mayhem", url: "Games/GunMayhem/gunmayhem/gunmayhem.html", image: "Games/GunMayhem/gunmayhem/images (9).jpeg", desc: "Fast-paced multiplayer arena shooter featuring powerful weapons, explosions, and chaotic battles.", popular: true },
  { id: "gm_2", title: "Gun Mayhem 2", url: "Games/GunMayhem/gunmayhem2/gunmayhem2.html", image: "Games/GunMayhem/gunmayhem2/images (10).jpeg", desc: "The sequel to Gun Mayhem with more weapons, maps, customization, and intense combat.", popular: true },
  { id: "gm_r", title: "Gun Mayhem Redux", url: "Games/GunMayhem/gunmayhemredux/gunmayhemredux.html", image: "Games/GunMayhem/gunmayhemredux/images (11).jpeg", desc: "A remastered Gun Mayhem experience with improved gameplay, expanded content, and smoother action.", popular: true },
  { id: "m_d", title: "Mutilate a Doll", url: "Games/mutilateadoll/mutilateadoll.html", desc: "A sandbox ragdoll simulation game where you can experiment with physics, weapons, and chaos. (Will Cause Massive Lag)", popular: true , image: "Games/mutilateadoll/images (5).jpeg" },
  { id: "b_md", title: "Bacon May Die", url: "Games/bakonmaydie/index.html", desc: "Fast-paced side-scrolling brawler where a fearless pig battles endless enemy waves using melee attacks and powerful weapons.", popular: true , image: "Games/bakonmaydie/Screenshot 2026-08-19 20.31.50.png" },
  { id: "a_df", title: "A Dance of Fire and Ice", url: "Games/ADOFAI/ADOFAI.html", image: "Games/ADOFAI/ADOFAI.jpeg", desc: "Rhythm-based precision game where you guide two orbiting planets through challenging musical tracks.", popular: true },
  { id: "a_sr", title: "Amazing Strange Rope Police", url: "Games/ASRP/index.html", image: "Games/ASRP/images (1).jpeg", desc: "Open-world action game where you use superhuman abilities, vehicles, and gadgets to fight crime across a massive city.", popular: true },
  { id: "a_oc", title: "Ages of Conflict", url: "Games/AOC/index.html", desc: "Strategic world simulation where nations wage wars, form alliances, and reshape the map through dynamic conflicts.", popular: true , image: "Games/AOC/images.jpeg" },
  { id: "mx3", title: "Moto X3M", url: "Games/MotoX3m/MotoX3m/index.html", image: "Games/MotoX3m/MotoX3m/images (14).jpeg", desc: "Race through explosive obstacle courses packed with ramps, traps, and high-speed motorcycle stunts.", popular: true },
  { id: "mx3_2", title: "Moto X3M 2", url: "Games/MotoX3m/MotoX3m2/index.html", image: "Games/MotoX3m/MotoX3m2/images (15).jpeg", desc: "The sequel featuring tougher tracks, bigger jumps, and even more dangerous stunt challenges.", popular: true },
  { id: "mx3_3", title: "Moto X3M 3", url: "Games/MotoX3m/MotoX3m3/index.html", image: "Games/MotoX3m/MotoX3m3/images (16).jpeg", desc: "Take on intense new levels filled with hazards, precision jumps, and fast-paced motorcycle action.", popular: true },
  { id: "mx3_w", title: "Moto X3M Winter", url: "Games/MotoX3m/MotoX3m Winter/index.html", image: "Games/MotoX3m/MotoX3m Winter/images (17).jpeg", desc: "A festive winter-themed Moto X3M adventure featuring snowy tracks and holiday-inspired obstacles.", popular: true },
  { id: "mx3_s", title: "Moto X3M Spooky Land", url: "Games/MotoX3m/MotoX3m Spooky Land/index.html", image: "Games/MotoX3m/MotoX3m Spooky Land/images (18).jpeg", desc: "Halloween-themed motorcycle racing with haunted tracks, creepy decorations, and dangerous traps.", popular: true },
  { id: "mx3_p", title: "Moto X3M Pool Party", url: "Games/MotoX3m/MotoX3m Pool Party/index.html", image: "Games/MotoX3m/MotoX3m Pool Party/images (19).jpeg", desc: "Splash through water-filled stunt courses packed with slides, loops, and summer-themed challenges.", popular: true },
  { id: "dad", title: "Daddish", url: "Games/daddish/index.html", desc: "Charming platformer where a radish dad embarks on a journey to rescue his missing children through challenging levels.", popular: true , image: "Games/daddish/images (6).jpeg" },
  { id: "eggy", title: "Eggy Car", url: "Games/eggy/index.html", desc: "Drive carefully across hilly terrain while balancing a fragile egg on your vehicle without letting it fall.", popular: true , image: "Games/eggy/maxresdefault.jpg" },
  { id: "er_1", title: "Escape Road", url: "Games/Escaperoad/Escape Road/index.html", image: "Games/Escaperoad/Escape Road/images (5).jpeg", desc: "Outrun relentless pursuers in this high-speed driving game packed with sharp turns and daring escapes.", popular: true },
  { id: "er_2", title: "Escape Road 2", url: "Games/Escaperoad/Escape Road 2/index.html", image: "Games/Escaperoad/Escape Road 2/images (6).jpeg", desc: "The sequel expands the action with tougher chases, new vehicles, and more intense escape routes.", popular: true },
  { id: "er_3", title: "Escape Road 3", url: "Games/Escaperoad/Escape Road 3/index.html", image: "Games/Escaperoad/Escape Road 3/images (7).jpeg", desc: "Take on even greater challenges with faster pursuits, advanced obstacles, and nonstop driving action.", popular: true },
  { id: "erc_2", title: "Escape Road City 2", url: "Games/Escaperoad/Escape Road City 2/index.html", image: "Games/Escaperoad/Escape Road City 2/images (8).jpeg", desc: "Navigate a bustling city while evading capture through crowded streets, shortcuts, and dangerous intersections.", popular: true },
  { id: "imt", title: "Idle Miner Tycoon", url: "Games/IMT/index.html", image: "Games/IMT/images (13).jpeg", desc: "Build a mining empire from the ground up by managing resources, upgrading operations, and expanding your profits.", popular: true },
  { id: "ime_1", title: "Idle Mining Empire", url: "Games/IME/index.html", jsbin: "https://codepen.io/Glaeesas/embed/bNgMxpg?default-tab=result&theme-id=dark", isEmbedCode: true, image: "Games/IME/images (12).jpeg", desc: "Build your mining operation from the ground up, automate production, and expand your empire to earn massive profits even while idle.", popular: true },
  { id: "dbs", title: "Double Barrel Sniper", url: "Games/DBS/index.html", image: "Games/DBS/download.jpeg", desc: "Sharpen your aim in this precision sniper game featuring challenging missions, long-range shots, and tactical gameplay.", popular: true },
  { id: "dm_1", title: "Doge Miner", url: "Games/Dogeminer1/index.html", image: "Games/Dogeminer1/images (3).jpeg", desc: "Mine Dogecoins, hire Shiba workers, and upgrade your operation to reach the moon in this idle clicker game.", popular: true },
  { id: "dm_2", title: "Doge Miner 2", url: "Games/Dogeminer2/index.html", image: "Games/Dogeminer2/images (4).jpeg", desc: "The sequel expands the Dogecoin mining adventure with new upgrades, planets, and even more ways to grow your mining empire.", popular: true },
  { id: "babel_tower", title: "Babel Tower", url: "Games/babeltower/index.html", desc: "Build the legendary tower of Babel by managing resources, hiring workers, and upgrading your production lines in this strategic idle game.", popular: true , image: "Games/babeltower/Screenshot 2026-08-19 21.19.31.png" },
  { id: "baby_chicco", title: "Baby Chicco Adventure", url: "Games/bcadventure/index.html", desc: "Guide a cute little penguin through a dangerous world filled with obstacles, enemies, and platforming challenges in this classic side-scrolling adventure.", popular: true , image: "Games/bcadventure/images (9).jpeg" },
  { id: "baby_sniper_vietnam", title: "Baby Sniper in Vietnam", url: "Games/BSV/index.html", image: "Games/BSV/images (2).jpeg", desc: "Take on critical missions, hone your long-range accuracy, and clear strategic targets under the cover of dense jungle terrain in this tactical sniping simulation.", popular: true },
  { id: "backrooms", title: "The Backrooms", url: "Games/backrooms/index.html", desc: "Explore the eerie, endless yellow hallways of the Backrooms while trying to find an exit and avoid the terrifying entities lurking in the shadows.", popular: true , image: "Games/backrooms/images (8).jpeg" },
  { id: "bad_bodyguard", title: "Bad Bodyguard", url: "Games/badbodyguard/index.html", desc: "Navigate chaotic security situations, make split-second defensive decisions, and protect your high-profile clients from wild incoming hazards in this unpredictable simulation.", popular: true , image: "Games/badbodyguard/images.png" },
  { id: "car_crash_3", title: "Car Crash 3", url: "Games/carcrash3/index.html", desc: "Test the limits of high-speed structural physics, unleash vehicle destruction across sandbox stunt arenas, and watch realistic damage dynamics play out in this high-impact driving simulator.", popular: true , image: "Games/carcrash3/Screenshot 2026-08-10 21.04.55.png" },
  { id: "stick_merge", title: "Stick Merge", url: "Games/stickmerge/index.html", image: "Games/stickmerge/images (31).jpeg", desc: "Merge various weapons together to create more powerful firearms and eliminate targets.", popular: true },
  { id: "strike_force_kitty", title: "Strike Force Kitty", url: "Games/strikeforcekitty/index.html", image: "Games/strikeforcekitty/images (32).jpeg", desc: "Lead a squad of adorable kittens to rescue the princess, defeating enemies and collecting outfits along the way.", popular: true },
  { id: "superhot", title: "SUPERHOT", url: "Games/superhot/index.html", image: "Games/superhot/images (33).jpeg", desc: "An innovative first-person shooter where time moves only when you move.", popular: true },
  { id: "arena_king", title: "Arena King", url: "Games/arenaking/index.html", image: "Games/arenaking/images (34).jpeg", desc: "Battle opponents in the arena, collect gold, and grow your crown to become the ultimate king.", popular: true },
  { id: "a_dark_room", title: "A Dark Room", url: "Games/adarkroom/index.html", jsbin: "https://codepen.io/Glaeesas/embed/019f90ef-3bea-753d-be5c-54659e699c0a?default-tab=result&theme-id=dark", isEmbedCode: true, image: "Games/adarkroom/images (36).jpeg", desc: "An atmospheric, text-based survival adventure that starts with a cold room and a single spark.", popular: true },
  { id: "a_date_with_death", title: "A Date with Death", url: "Games/adatewithdeath/index.html", image: "Games/adatewithdeath/images.jpeg", desc: "A romance chat sim where you chat, customize your look, and place your soul on the line against the Grim Reaper.", popular: true },
  { id: "day_in_the_office", title: "A Day in the Office", url: "Games/dayintheoffice/index.html", image: "Games/dayintheoffice/images (1).jpeg", desc: "A surreal horror game where you navigate an endless work day that you can never escape.", popular: true },
  { id: "advent_neon", title: "AdventNEON", url: "Games/adventneon/index.html", image: "Games/adventneon/images (2).jpeg", desc: "A hyper-active 2D action platformer focused on intense speed and crushing combat.", popular: true },
  { id: "adventure_capitalist", title: "Adventure Capitalist", url: "Games/adventure capitalist/index.html", image: "Games/adventure capitalist/images (3).jpeg", desc: "Start with a single lemonade stand and invest your way to building a massive financial empire.", popular: true },
  { id: "ahoysurvival", title: "Ahoy Survival", url: "Games/ahoysurvival/index.html", jsbin: "https://codepen.io/Glaeesas/embed/019fe8bf-da2a-7eaa-8e4c-33c4ab9ba7d8?default-tab=result&theme-id=dark", isEmbedCode: true, image: "Games/ahoysurvival/images (8).jpeg", desc: "Survive the open seas, gather resources, and fight to stay alive in a dangerous ocean world.", popular: false },
  { id: "airline", title: "airline tycoon", url: "Games/airline/index.html", desc: "An idle airline management game where you build your own airline empire, buy and upgrade planes, unlock new routes, and earn money as your airline grows!", popular: true, image: "Games/airline/images (4).png" },
  { id: "bitplanes", title: "bitplanes", url: "Games/bitplanes/index.html", desc: "BitPlanes is an addictive idle aviation game where you build your fleet, manage planes, unlock new aircraft, and grow your airline empire while earning money over time.", popular: true , image: "Games/bitplanes/images.jpeg" },

  { id: "jailbreakobby", title: "jailbreakobby", url: "Games/jailbreakobby/index.html", desc: "Parkour through a prison complex, dodge guards, and race for freedom in this high-stakes escape obby.", popular: true , image: "Games/jailbreakobby/images.jpeg" },

  { id: "luckyblockobby", title: "luckyblockobby", url: "Games/luckyblockobby/index.html", desc: "Jump through obstacle courses packed with lucky blocks, random rewards, and surprise challenges.", popular: true , image: "Games/luckyblockobby/images (1).jpeg" },

  { id: "ninjaobby", title: "ninjaobby", url: "Games/ninjaobby/index.html", desc: "Leap across rooftops, dodge traps, and master precise parkour moves in this ninja-themed obstacle course.", popular: true , image: "Games/ninjaobby/images (2).jpeg" },

  { id: "clickerobby", title: "clickerobby", url: "Games/clickerobby/index.html", desc: "Combine clicker progression with parkour stages—level up your power as you race through challenging maps.", popular: true },

  { id: "obbyforbrainrot", title: "obbyforbrainrot", url: "Games/obbyforbrainrot/index.html", desc: "A chaotic meme-inspired obstacle course filled with viral brainrot vibes, wild jumps, and nonstop laughs.", popular: true },

  { id: "leafblower", title: "leafblower", url: "Games/leafblower/index.html", desc: "Clear yards of leaves with your leaf blower, upgrade your gear, and grow your lawn-care empire in this idle-style game.", popular: true, image: "Games/leafblower/images (11).jpeg" },

  { id: "ultrakill", title: "ultrakill", url: "Games/ultrakill/index.html", desc: "A hyper-violent, style-focused FPS where every kill chains into the next—move fast, shoot faster, and stay stylish.", popular: true },

  { id: "halflife", title: "halflife", url: "Games/halflife/index.html", desc: "Step into the classic sci-fi shooter: fight through Black Mesa, battle aliens, and uncover a conspiracy that changes everything.", popular: true , image: "Games/halflife/images (3).jpeg" },

  { id: "blackjack", title: "blackjack", url: "Games/blackjack/index.html", desc: "Play classic casino blackjack—hit, stand, and double down as you try to beat the dealer without going over 21.", popular: true },

  { id: "kanyezone", title: "kanyezone", url: "Games/kanyezone/index.html", desc: "A chaotic Kanye-themed experience packed with memes, music vibes, and unexpected challenges.", popular: true },

  { id: "blood", title: "blood", url: "Games/blood/index.html", desc: "A classic retro FPS filled with demons, heavy weapons, and nonstop action.", popular: true },
  { id: "fallout", title: "fallout", url: "Games/fallout/index.html", desc: "Survive the wasteland, scavenge gear, and navigate a post-apocalyptic world full of danger.", popular: true },
];
let favoriteGamesList = JSON.parse(localStorage.getItem('nullx_favorites_arr')) || [];
let contextTargetId = null;

// ==========================================
// NULLAI BASE44 CORE INTERACTION SYSTEM
// ==========================================
const BASE44_BASE_URL = "https://nullai.base44.app";
const BASE44_APP_ID = "6687ebfbbbaa7e8910eb4eb9";
const BASE44_API_KEY = "c00d41eb8e5c8e44ebae08764a75";
let activeChatSessionId = null;

async function initializeBase44Chat() {
    try {
        const response = await fetch(`${BASE44_BASE_URL}/entities/Chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-id": BASE44_APP_ID,
                "api_key": BASE44_API_KEY
            },
            body: JSON.stringify({
                title: `Dashboard Session - ${new Date().toLocaleTimeString()}`,
                chat_type: "saved"
            })
        });
        if (!response.ok) throw new Error("Failed initialization link.");
        const chatData = await response.json();
        activeChatSessionId = chatData.id;
        console.log("[NullAI] Connected Session ID:", activeChatSessionId);
    } catch (err) {
        console.error("[NullAI Setup Error]:", err);
        activeChatSessionId = "fallback_" + Math.random().toString(36).substring(7);
    }
}

async function sendChatMessage(userText) {
    if (!activeChatSessionId) await initializeBase44Chat();
    try {
        const userMsgResponse = await fetch(`${BASE44_BASE_URL}/entities/Message`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-app-id": BASE44_APP_ID, "api_key": BASE44_API_KEY },
            body: JSON.stringify({ role: "user", content: userText, chat_id: activeChatSessionId })
        });
        if (!userMsgResponse.ok) throw new Error("Failed to sync record.");

        await new Promise(resolve => setTimeout(resolve, 1800));

        const checkReplyResponse = await fetch(`${BASE44_BASE_URL}/entities/Message?chat_id=${activeChatSessionId}&sort=createdAt:desc&limit=2`, {
            method: "GET",
            headers: { "x-app-id": BASE44_APP_ID, "api_key": BASE44_API_KEY }
        });
        if (!checkReplyResponse.ok) throw new Error("Failed to pull response.");
        const messages = await checkReplyResponse.json();

        if (messages && messages.length > 0 && (messages[0].role === "assistant" || messages[0].role === "agent")) {
            return messages[0].content;
        }
        return "System processing query. Try asking again if the line remains idle.";
    } catch (error) {
        console.error("[NullAI Operational Fault]:", error);
        return "Connection timed out. Check back momentarily.";
    }
}

function attachChatEventListeners() {
    const chatBox = document.getElementById("chatBox");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    if (!chatBox || !chatInput) return;

    async function handleTransmission() {
        const queryText = chatInput.value.trim();
        if (!queryText) return;

        renderBubble(queryText, "user-bubble");
        chatInput.value = "";

        const waitIndicator = renderBubble("Analyzing input streams...", "assistant-bubble loading-state");
        const replyString = await sendChatMessage(queryText);

        waitIndicator.remove();
        renderBubble(replyString, "assistant-bubble");
    }

    function renderBubble(contentStr, stylingClass) {
        const element = document.createElement("div");
        element.className = `chat-bubble ${stylingClass}`;
        element.innerText = contentStr;
        chatBox.appendChild(element);
        chatBox.scrollTop = chatBox.scrollHeight;
        return element;
    }

    sendBtn?.addEventListener("click", handleTransmission);
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") handleTransmission();
    });
}

function launchStealthWindow(maskType, targetEnv) {
  // Strip off any existing parameters to get a clean base URL
  const currentUrl = window.location.href.split('?')[0];
  let title = "Null X";
  let escapeRedirect = "https://about:blank";

  const customCloaks = {
    'Google Classroom': { t: "Home", r: "https://classroom.google.com/" },
    'Google Drive': { t: "My Drive - Google Drive", r: "https://drive.google.com/" },
    'Gmail': { t: "Inbox (12) - Google Mail", r: "https://mail.google.com/" },
    'Canvas': { t: "Dashboard", r: "https://www.instructure.com/" },
    'Canva': { t: "Home - Canva", r: "https://www.canva.com/" },
    'Microsoft 365': { t: "Search | M365 Copilot", r: "https://m365.cloud.microsoft/search?from=PortalHome&auth=2&origindomain=microsoft365&client-request-id=8f00c2ca-b9d5-43f0-9056-d1cca74442ba" },
    'NoRedInk': { t: "Student Home | NoRedInk", r: "https://www.noredink.com/learn/home" },
    'Neptune Navigate': { t: "Universal - Portal", r: "https://universal.neptunenavigate.com/course/view/j6orc8CW0xCrSodEmuZ4rAMl32Ml32" },
    'Pear Assessment': { t: "Assignments - Pear Assessment", r: "https://assessment.peardeck.com/home/assignments" },
    'Membean': { t: "Dashboard", r: "https://membean.com/dashboard" },
    'i-Ready Reading': { t: "Reading Home Page, i-Ready", r: "https://login.i-ready.com/mspro/dashboard/home" },
    'i-Ready Math': { t: "Math Home Page, i-Ready", r: "https://login.i-ready.com/mspro/dashboard/home" },
    'DeltaMath': { t: "DeltaMath Student Application", r: "https://www.deltamath.com/app/student/4796542/upcoming" },
    'ExploreLearning Gizmos': { t: "ExploreLearning Gizmos", r: "https://apps.explorelearning.com/gizmos?altRedirectID=0" },
    'Progress Learning': { t: "Assignments | Progress Learning", r: "https://app.progresslearning.com/classlink?code=c1774361678626941d7d1c9cfefa3f6fbd4cbdf674eca2&response_type=code" },
    'Student Support Time': { t: "Thrive - Dashboard", r: "https://forsyth.studentsupporttime.com/SHome#!/app/dashboard" },
    'Kahoot': { t: "Kahoot!", r: "https://kahoot.it/" },
    'Nearpod': { t: "Nearpod", r: "https://nearpod.com/student/" },
    'Khan Academy': { t: "Khan Academy | Free Online Courses, Lessons & Practice", r: "https://www.khanacademy.org/" },
    'Coursera': { t: "Coursera | Online Courses & Credentials", r: "https://www.coursera.org/" },
    'edX': { t: "edX | Online Courses from the World's Best Universities", r: "https://www.edx.org/" },
    'Quizlet': { t: "Quizlet - Flashcards, Study Guides & More", r: "https://quizlet.com/" },
    'Grammarly': { t: "Grammarly: Free Writing AI Assistant", r: "https://www.grammarly.com/" },
    'Clever': { t: "Clever | Single Sign-On for Education", r: "https://clever.com/" },
    'Blackboard': { t: "Blackboard | Education Delivery Platform", r: "https://www.blackboard.com/" },
    'Moodle': { t: "Moodle - Open-source learning platform", r: "https://moodle.org/" },
    'Schoology': { t: "Schoology - Learning Management System", r: "https://www.scholology.com/" },
    'Null X': { t: "Null X", r: "https://about:blank/" },
    'Google Slides': { t: "Google Slides", r: "https://slides.google.com/" },
    'Google Sheets': { t: "Google Sheets", r: "https://sheets.google.com/" },
    'IXL': { t: "IXL | Math, Language Arts, Science, Social Studies", r: "https://www.ixl.com/" },
    'Prodigy': { t: "Prodigy | Math Game for Students", r: "https://www.prodigygame.com/" },
    'BrainPOP': { t: "BrainPOP - Animated Educational Site", r: "https://www.brainpop.com/" },
    'PBS Kids': { t: "PBS KIDS", r: "https://pbskids.org/" },
    'Starfall': { t: "Starfall Education: Learn to Read", r: "https://www.starfall.com/" },
    'ABCmouse': { t: "ABCmouse.com - Early Learning Academy", r: "https://www.abcmouse.com/" },
    'Duolingo': { t: "Duolingo - The world's best way to learn a language", r: "https://www.duolingo.com/" },
    'Code.org': { t: "Code.org - Learn Computer Science", r: "https://code.org/" },
    'Scholastic': { t: "Scholastic | Books for Kids", r: "https://www.scholastic.com/" },
    'National Geographic Kids': { t: "National Geographic Kids", r: "https://kids.nationalgeographic.com/" },
    'Wolfram Alpha': { t: "Wolfram|Alpha: Computational Knowledge Engine", r: "https://www.wolframalpha.com/" },
    'Chegg': { t: "Chegg - Get 24/7 Homework Help", r: "https://www.chegg.com/" },
    'Pearson': { t: "Pearson | The world's learning company", r: "https://www.pearson.com/" },
    'Houghton Mifflin Harcourt': { t: "HMH | Education Resources", r: "https://www.hmhco.com/" },
    'McGraw Hill': { t: "McGraw Hill - Education", r: "https://www.mheducation.com/" },
    'Desmos': { t: "Desmos | Graphing Calculator", r: "https://www.desmos.com/" },
    'CK-12': { t: "CK-12 Foundation", r: "https://www.ck12.org/" },
    'TED-Ed': { t: "TED-Ed | Lessons Worth Sharing", r: "https://ed.ted.com/" },
    'Britannica': { t: "Encyclopædia Britannica", r: "https://www.britannica.com/" },
    'Smithsonian Learning Lab': { t: "Smithsonian Learning Lab", r: "https://learninglab.si.edu/" },
    'Common App': { t: "Common App | Apply to College", r: "https://www.commonapp.org/" },
    'College Board': { t: "College Board - SAT, AP, College Search", r: "https://www.collegeboard.org/" },
    'Khan Academy Kids': { t: "Khan Academy Kids - Free Educational App", r: "https://www.khanacademy.org/khan-academy-kids" },
    'SplashLearn': { t: "SplashLearn - Fun Math & ELA Learning", r: "https://www.splashlearn.com/" },
    'Quizizz': { t: "Quizizz | Make Learning Fun", r: "https://quizizz.com/" },
    'Edpuzzle': { t: "Edpuzzle - Make Any Video Your Lesson", r: "https://edpuzzle.com/" },
    'Notion': { t: "Notion - All-in-one Workspace", r: "https://www.notion.so/" },
    'OpenStax': { t: "OpenStax - Free Textbooks", r: "https://openstax.org/" },
    'Crash Course': { t: "Crash Course", r: "https://thecrashcourse.com/" },
    'BBC Bitesize': { t: "BBC Bitesize - Learning Resources", r: "https://www.bbc.co.uk/bitesize" },
    'Skillshare': { t: "Skillshare - Online Classes", r: "https://www.skillshare.com/" },
    'Udemy': { t: "Udemy - Online Courses", r: "https://www.udemy.com/" },
    'LinkedIn Learning': { t: "LinkedIn Learning", r: "https://www.linkedin.com/learning/" },
    'Harvard Online': { t: "Harvard Online Courses", r: "https://online.harvard.edu/" },
    'Mystery Science': { t: "Mystery Science", r: "https://mysteryscience.com/" },
    'Reading IQ': { t: "ReadingIQ - Digital Library", r: "https://www.readingiq.com/" },
    'CodeSpark': { t: "codeSpark Academy", r: "https://codespark.org/" },
    'Brighterly': { t: "Brighterly - Math for Kids", r: "https://brighterly.com/" },
    'Storynory': { t: "Storynory - Free Audio Stories", r: "https://www.storynory.com/" },
    'CoolMath': { t: "Cool Math Games & Lessons", r: "https://www.coolmath.com/" },
    'DOGOnews': { t: "DOGOnews - Kid News", r: "https://www.dogonews.com/" },
    'Brainscape': { t: "Brainscape - Flashcards", r: "https://www.brainscape.com/" },
    'Piazza': { t: "Piazza - Q&A Platform", r: "https://piazza.com/" },
    'Quizalize': { t: "Quizalize - Adaptive Quizzes", r: "https://www.quizalize.com/" },
    'Classkick': { t: "Classkick - Real-time Feedback", r: "https://www.classkick.com/" },
    'Peergrade': { t: "Peergrade - Peer Assessment", r: "https://www.peergrade.io/" },
    'Open Yale Courses': { t: "Open Yale Courses", r: "https://oyc.yale.edu/" },
    'MIT OpenCourseWare': { t: "MIT OpenCourseWare", r: "https://ocw.mit.edu/" },
    'FutureLearn': { t: "FutureLearn - Online Courses", r: "https://www.futurelearn.com/" },
    'MasterClass': { t: "MasterClass - Learn from the Best", r: "https://www.masterclass.com/" },
    'Codecademy': { t: "Codecademy - Learn to Code", r: "https://www.codecademy.com/" },
    'freeCodeCamp': { t: "freeCodeCamp.org", r: "https://www.freecodecamp.org/" },
    'Pluralsight': { t: "Pluralsight - Tech Skills Platform", r: "https://www.pluralsight.com/" },
    'DataCamp': { t: "DataCamp - Learn Data Science", r: "https://www.datacamp.com/" },
    'Tynker': { t: "Tynker - Coding for Kids", r: "https://www.tynker.com/" },
    'Scratch': { t: "Scratch - Imagine, Program, Share", r: "https://scratch.mit.edu/" },
    'Outschool': { t: "Outschool - Live Online Classes", r: "https://outschool.com/" },
    'Epic!': { t: "Epic - Kids' Books and Videos", r: "https://www.getepic.com/" },
    'XtraMath': { t: "XtraMath - Math Fact Fluency", r: "https://xtramath.org/" },
    'Babbel': { t: "Babbel - Language Learning", r: "https://www.babbel.com/" },
    'Rosetta Stone': { t: "Rosetta Stone - Language Learning", r: "https://www.rosettastone.com/" },
    'Memrise': { t: "Memrise - Learn Languages", r: "https://www.memrise.com/" },
    'Busuu': { t: "Busuu - Learn Languages Online", r: "https://www.busuu.com/" },
    'Fluenz': { t: "Fluenz - Language Learning", r: "https://fluenz.com/" },
    'Mango Languages': { t: "Mango Languages", r: "https://mangolanguages.com/" },
    'Pimsleur': { t: "Pimsleur - Learn a New Language", r: "https://www.pimsleur.com/" },
    'Glossika': { t: "Glossika - Language Training", r: "https://ai.glossika.com/" },
    'Lingodeer': { t: "LingoDeer - Learn Languages", r: "https://www.lingodeer.com/" },
    'Drops': { t: "Drops - Learn Languages", r: "https://languagedrops.com/" },
    'Yousician': { t: "Yousician - Learn Guitar, Piano, Bass & Ukulele", r: "https://yousician.com/" },
    'Simply Piano': { t: "Simply Piano - Learn Piano", r: "https://www.joytunes.com/simply-piano" },
    'Flowkey': { t: "flowkey - Learn Piano", r: "https://www.flowkey.com/" },
    'Synthesia': { t: "Synthesia - Piano Game", r: "https://synthesiagame.com/" },
    'Skoove': { t: "Skoove - Learn to Play Piano", r: "https://www.skoove.com/" },
    'Perfect Ear': { t: "Perfect Ear - Ear Training", r: "https://www.perfectear.app/" },
    'ToneGym': { t: "ToneGym - Ear Training for Musicians", r: "https://www.tonegym.co/" },
    'Soundgym': { t: "SoundGym - Audio Ear Training", r: "https://www.soundgym.co/" },
    'Musictheory.net': { t: "Musictheory.net", r: "https://www.musictheory.net/" },
    'Teoria': { t: "Teoria - Music Theory Web", r: "https://www.teoria.com/" },
    'Audible': { t: "Audible - Audiobooks & Podcasts", r: "https://www.audible.com/" },
    'Libby': { t: "Libby, by OverDrive", r: "https://libbyapp.com/" },
    'Hoopla': { t: "hoopla - Streaming Audiobooks, Music, Video & eBooks", r: "https://www.hoopladigital.com/" },
    'Scribd': { t: "Scribd - Audiobooks & Ebooks", r: "https://www.scribd.com/" },
    'Wattpad': { t: "Wattpad - Where stories live", r: "https://www.wattpad.com/" },
    'Goodreads': { t: "Goodreads - Book Reviews & Recommendations", r: "https://www.goodreads.com/" },
    'StoryGraph': { t: "The StoryGraph", r: "https://app.thestorygraph.com/" },
    'BookBub': { t: "BookBub - Great Deals on Bestselling Ebooks", r: "https://www.bookbub.com/" },
    'LibraryThing': { t: "LibraryThing - Catalog your books online", r: "https://www.librarything.com/" },
    'Project Gutenberg': { t: "Project Gutenberg - free ebooks", r: "https://www.gutenberg.org/" }
  };

  if (maskType && customCloaks[maskType]) {
    title = customCloaks[maskType].t;
    escapeRedirect = customCloaks[maskType].r;
  }

  let win = window.open("about:blank", "_blank");
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html style="margin: 0; padding: 0; overflow: hidden; height: 100%;">
      <head>
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; height: 100%; background: #000;">
        <iframe src="${currentUrl}?mode=stealth" style="width: 100%; height: 100%; border: none;"></iframe>
      </body>
      </html>
    `);
    win.document.close();

    // Redirect original tab to the mask target
    window.location.replace(escapeRedirect);
  } else {
    alert("Pop-ups must be enabled to launch the Stealth Environment.");
  }
}
// ========================================================
// CORE GAME LAUNCH ENGINE WITH STABILIZED CONTROLS
// ========================================================
function launchGame(gameId) {
  const game = _0xData.find(g => g.id === gameId);
  if (!game) return;

  const rootUrl = "https://glaxyias.github.io/";
  const gameTab = window.open("about:blank", "_blank");
  if (!gameTab) {
    alert("Pop-up blocked! Please allow popup permissions to play games.");
    return;
  }

  gameTab.document.title = "Null X";
  gameTab.document.open();

  const isEmbed = game.isEmbedCode;
  const gameSrc = isEmbed ? game.jsbin : (rootUrl + game.url.replace(/^\.\.\//, ""));

  gameTab.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${game.title}</title>

<style>
body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; color:#fff; }
iframe { width:100%; height:100vh; display:block; border:none; }

.back-btn {
  position: fixed; top: 15px; left: 15px; z-index: 99999999;
  background: #0a0a0a; color: #8b00ff; border: 2px solid #8b00ff;
  padding: 8px 14px; font-weight: bold; border-radius: 6px;
  cursor: pointer; box-shadow: 0 0 10px rgba(139,0,255,0.5);
  font-family: sans-serif; text-decoration: none; display: inline-block;
}

#back-btn-hint {
  position: fixed;
  top: 60px;
  left: 15px;
  background: #0a0a0a;
  color: #8b00ff;
  padding: 6px 10px;
  border: 2px solid #8b00ff;
  border-radius: 6px;
  font-family: sans-serif;
  z-index: 99999999;
  box-shadow: 0 0 10px rgba(139,0,255,0.5);
}

#back-btn-menu {
  position: fixed;
  background: #0a0a0a;
  color: #8b00ff;
  border: 2px solid #8b00ff;
  border-radius: 6px;
  padding: 6px;
  font-family: sans-serif;
  z-index: 99999999;
  box-shadow: 0 0 10px rgba(139,0,255,0.5);
}

#back-btn-menu div {
  padding: 4px 6px;
  cursor: pointer;
}
</style>
</head>

<body>
<a href="https://glaxyias.github.io/" class="back-btn">← Back To Home</a>

<iframe src="${gameSrc}" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals" allow="pointer-lock *; fullscreen *; gamepad *; autoplay *"></iframe>

<script>
// First-time hint
(function() {
  if (!localStorage.getItem("backBtnHintShown")) {
    var hint = document.createElement("div");
    hint.id = "back-btn-hint";
    hint.textContent = "Hate the positioning? Right-click to move it.";
    document.body.appendChild(hint);
  }
})();

window.addEventListener("load", function() {
  var backBtn = document.querySelector(".back-btn");
  if (!backBtn) return;

  backBtn.style.position = "fixed";

  backBtn.addEventListener("contextmenu", function(e) {
    e.preventDefault();

    var hint = document.getElementById("back-btn-hint");
    if (hint) {
      hint.remove();
      localStorage.setItem("backBtnHintShown", "true");
    }

    showBackBtnMenu(e.pageX, e.pageY, backBtn);
  });
});

function showBackBtnMenu(x, y, backBtn) {
  var oldMenu = document.getElementById("back-btn-menu");
  if (oldMenu) oldMenu.remove();

  var menu = document.createElement("div");
  menu.id = "back-btn-menu";
  menu.style.top = y + "px";
  menu.style.left = x + "px";

  var options = [
    { label: "Top Left", pos: function(){ setBackBtnPos(backBtn, "15px", null, null, "15px"); } },
    { label: "Top Center", pos: function(){ setBackBtnCenter(backBtn, "15px"); } },
    { label: "Top Right", pos: function(){ setBackBtnPos(backBtn, "15px", null, "15px", null); } },
    { label: "Bottom Left", pos: function(){ setBackBtnPos(backBtn, null, "15px", null, "15px"); } },
    { label: "Bottom Center", pos: function(){ setBackBtnCenter(backBtn, null, "15px"); } },
    { label: "Bottom Right", pos: function(){ setBackBtnPos(backBtn, null, "15px", "15px", null); } },
    { label: "Custom (Drag)", pos: function(){ enableBackBtnDrag(backBtn); } }
  ];

  for (var i = 0; i < options.length; i++) {
    var item = document.createElement("div");
    item.textContent = options[i].label;
    item.addEventListener("click", (function(opt){
      return function(){
        opt.pos();
        menu.remove();
      };
    })(options[i]));
    menu.appendChild(item);
  }

  document.body.appendChild(menu);

  document.addEventListener("click", function(){ menu.remove(); }, { once: true });
}

function setBackBtnPos(btn, top, bottom, right, left) {
  btn.style.top = top;
  btn.style.bottom = bottom;
  btn.style.right = right;
  btn.style.left = left;
  btn.style.transform = "";
}

function setBackBtnCenter(btn, top, bottom) {
  btn.style.top = top;
  btn.style.bottom = bottom;
  btn.style.left = "50%";
  btn.style.right = null;
  btn.style.transform = "translateX(-50%)";
}

function enableBackBtnDrag(btn) {
  btn.style.cursor = "move";
  btn.style.transform = "";

  var dragging = false;

  var startDrag = function(e) {
    dragging = true;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
  };

  var drag = function(e) {
    if (!dragging) return;
    btn.style.left = e.pageX + "px";
    btn.style.top = e.pageY + "px";
    btn.style.right = null;
    btn.style.bottom = null;
  };

  var stopDrag = function() {
    dragging = false;
    btn.style.cursor = "pointer";
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", stopDrag);
  };

  btn.addEventListener("mousedown", startDrag, { once: true });
}
<\/script>

</body>
</html>
`);

  gameTab.document.close();

  // More reliable original-tab close
  function attemptCloseOriginalTab() {
    try {
      const selfWin = window.open(window.location.href, "_self");
      if (selfWin) selfWin.close();
    } catch (e) {}
    try {
      window.close();
    } catch (e) {}
    try {
      if (window.top && window.top !== window) {
        window.top.close();
      }
    } catch (e) {}
    try {
      window.open("", "_self");
      window.close();
    } catch (e) {}
  }

  attemptCloseOriginalTab();
  setTimeout(attemptCloseOriginalTab, 30);

  setTimeout(function() {
    try {
      window.location.replace("https://www.google.com");
    } catch (e) {
      window.location.href = "https://www.google.com";
    }
  }, 120);
}

function renderLibraryGrid(gamesArray) {
  const gameGrid = document.getElementById('gameGrid');
  if (!gameGrid) return;
  gameGrid.innerHTML = '';
  gamesArray.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('data-game-id', game.id);

    // Checks for image thumbnail, generates custom initials gradient placeholder as fallback
    const imgHTML = game.image 
      ? `<img src="${game.image}" class="game-card-img" alt="${game.title}">` 
      : `<div class="game-card-img-placeholder"><span>${game.title.substring(0, 2).toUpperCase()}</span></div>`;

    card.innerHTML = `
      ${imgHTML}
      <h3>${game.title}</h3>
      <div class="game-desc-overlay">${game.desc}</div>
    `;
    card.onclick = () => launchGame(game.id);
    gameGrid.appendChild(card);
  });
}

function renderFavoritesGrid() {
  const favGrid = document.getElementById('favoritesGrid');
  const emptyMsg = document.getElementById('favorites-empty-msg');
  if (!favGrid) return;

  favGrid.querySelectorAll('.game-card').forEach(c => c.remove());

  if (favoriteGamesList.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
    favoriteGamesList.forEach(gameId => {
      const game = _0xData.find(g => g.id === gameId);
      if (game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.setAttribute('data-game-id', game.id);

        // Checks for image thumbnail inside favorites list too!
        const imgHTML = game.image 
          ? `<img src="${game.image}" class="game-card-img" alt="${game.title}">` 
          : `<div class="game-card-img-placeholder"><span>${game.title.substring(0, 2).toUpperCase()}</span></div>`;

        card.innerHTML = `
          ${imgHTML}
          <h3>${game.title}</h3>
          <div class="game-desc-overlay">${game.desc}</div>
        `;
        card.onclick = () => launchGame(game.id);
        favGrid.appendChild(card);
      }
    });
  }
}

function initFeaturedModule() {
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const playFeaturedBtn = document.getElementById('playFeatured');

  if (_0xData.length > 0 && heroTitle) {
    const randomGameSelection = _0xData[Math.floor(Math.random() * _0xData.length)];
    heroTitle.textContent = randomGameSelection.title;
    if (heroDesc) heroDesc.textContent = randomGameSelection.desc;
    if (playFeaturedBtn) {
      playFeaturedBtn.onclick = () => launchGame(randomGameSelection.id);
    }
  }
}

function updateNavActiveState(activeId) {
  ['nav-home', 'nav-games', 'nav-favorites', 'nav-unblockers', 'nav-profile', 'nav-communications', 'nav-terminal', 'nav-assistant'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const currentActive = document.getElementById(activeId);
  if (currentActive) currentActive.classList.add('active');
}

function clearAllViews() {
  const viewElements = [
    document.getElementById('heroSection'),
    document.querySelector('.random-section'),
    document.getElementById('gameGrid'),
    document.getElementById('favoritesGrid'),
    document.getElementById('unblockersSection'),
    document.getElementById('profileSection'),
    document.getElementById('terminalSection'),
    document.getElementById('assistantSection')
  ];

  viewElements.forEach(element => {
    if (element) {
      element.style.setProperty('display', 'none', 'important');
    }
  });
}

function showHomeView() {
  clearAllViews();
  updateNavActiveState('nav-home');

  const heroSection = document.getElementById('heroSection');
  const randomSection = document.querySelector('.random-section');
  const gameGrid = document.getElementById('gameGrid');
  const favGrid = document.getElementById('favoritesGrid');

  if (heroSection) heroSection.style.display = 'flex';
  if (randomSection) randomSection.style.display = 'block';
  if (favGrid) favGrid.style.setProperty('display', 'none', 'important');

  if (gameGrid) {
    gameGrid.style.setProperty('display', 'none', 'important');
  }
  initFeaturedModule();
}

function showAllGamesView() {
  clearAllViews();
  updateNavActiveState('nav-games');

  const gameGrid = document.getElementById('gameGrid');
  const favGrid = document.getElementById('favoritesGrid');

  if (favGrid) favGrid.style.setProperty('display', 'none', 'important');
  if (gameGrid) {
    gameGrid.style.display = 'grid';
    renderLibraryGrid(_0xData);
  }
}

function showFavoritesView() {
  clearAllViews();
  updateNavActiveState('nav-favorites');

  const gameGrid = document.getElementById('gameGrid');
  const favGrid = document.getElementById('favoritesGrid');

  if (gameGrid) gameGrid.style.setProperty('display', 'none', 'important');
  if (favGrid) {
    favGrid.style.display = 'grid';
    renderFavoritesGrid();
  }
}

async function handlePlaceholderView(navId, viewName) {
  clearAllViews();
  updateNavActiveState(navId);

  const viewLower = viewName.toLowerCase();

  if (viewLower === 'assistant') {
    window.location.href = "https://nullai.base44.app";
    return; 
  }

  const targetSectionId = `${viewLower}Section`;
  let customSectionContainer = document.getElementById(targetSectionId);

  if (!customSectionContainer) {
    customSectionContainer = document.createElement('div');
    customSectionContainer.id = targetSectionId;
    customSectionContainer.className = 'custom-view-panel';

    const mainSectionNode = document.querySelector('.main-content .section') || document.querySelector('.main-content');
    if (mainSectionNode) {
      mainSectionNode.appendChild(customSectionContainer);
    }
  }

  customSectionContainer.style.display = 'block';
  customSectionContainer.innerHTML = `<p style="color: #8b00ff; padding: 20px; font-family: sans-serif; font-style: italic; animation: pulse 1.5s infinite;">Mounting filesystem directory node...</p>`;

  try {
    const targetFolder = viewLower === 'terminal' ? 'Terminal' : viewLower;
    const fetchPath = `../${targetFolder}/${viewLower}.html`;

    const response = await fetch(fetchPath);
    if (!response.ok) throw new Error(`Status error ${response.status}`);

    const dynamicCodeContent = await response.text();
    customSectionContainer.innerHTML = dynamicCodeContent;

    attachChatEventListeners();

    // Execute the profile script dynamically if the profile view is loaded
    if (viewLower === 'profile') {
      // Remove the old script if it exists so we get a fresh load
      const existingScript = document.getElementById('profile-dynamic-script');
      if (existingScript) existingScript.remove();

      // Inject and execute the script
      const script = document.createElement('script');
      script.id = 'profile-dynamic-script';
      script.type = 'module';
      // The timestamp trick forces the browser to run it every time instead of using a cached version
      script.src = `../profile/profile.js?v=${Date.now()}`; 
      document.body.appendChild(script);
    }

  } catch (error) {
    console.error(`[System Error] Failed routing structural data for ${viewName}:`, error);
    customSectionContainer.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; border: 1px dashed rgba(139,0,255,0.4); border-radius: 8px; max-width: 500px; margin: 20px auto; background: rgba(10,10,10,0.8);">
        <h3 style="color: #ff3333; margin-top: 0;">Filesystem Mount Error</h3>
        <p style="color: #ccc; font-size: 14px;">Could not verify source file configuration at location pathway: <code>/${viewLower === 'terminal' ? 'Terminal' : viewLower}/${viewLower}.html</code></p>
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">Verify repository spelling match definitions alignment protocols.</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeBase44Chat();

  const isSplashDisabled = localStorage.getItem('disableStudyCloak') === 'true';
  const cloakOverlay = document.getElementById("educational-cloak");

  if (cloakOverlay) {
    if (isSplashDisabled) {
      cloakOverlay.style.display = 'none';
      cloakOverlay.classList.add("hidden");
    } else {
      const timerDisplay = document.querySelector(".timer-subtext-sticky span");
      let timeLeft = 10;
      if (timerDisplay) {
        timerDisplay.textContent = `${timeLeft} seconds.`;
      }

      const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
          if (timerDisplay) timerDisplay.textContent = `${timeLeft} seconds.`;
        } else {
          clearInterval(countdownInterval);
          cloakOverlay.classList.add("hidden");
          console.log("Overlay container initialization cleared successfully.");
        }
      }, 1000);
    }
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.onclick = (e) => {
      e.preventDefault();

      let modal = document.getElementById('settingsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,10,0.95); z-index:999999; display:none; align-items:center; justify-content:center; font-family:sans-serif;";
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="background:#0d0d0d; border:2px solid #8b00ff; border-radius:16px; width:90%; max-width:900px; height:80vh; position:relative; box-shadow:0 0 30px rgba(139,0,255,0.3); display:flex; flex-direction:column;">
          <div style="padding: 20px 30px; border-bottom: 1px solid rgba(139,0,255,0.2); display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#8b00ff; margin:0;">Control Panel Configuration</h2>
            <button id="closeSettings" style="background:none; border:none; color:#ff3333; font-size:28px; font-weight:bold; cursor:pointer; margin-left:auto;">&times;</button>
          </div>
          <div id="modal-settings-content" style="flex:1; padding:30px; overflow-y:auto; color:#fff;">
            <p style="color:#8b00ff; font-weight:bold;">Loading system template parameters...</p>
          </div>
        </div>
      `;
      modal.style.display = 'flex';

      fetch('../Settings/settings.html')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(html => {
          const contentDiv = document.getElementById('modal-settings-content');
          if (contentDiv) {
            contentDiv.innerHTML = html;

            const currentTheme = localStorage.getItem('selectedTheme') || 'default';
            const themeCards = contentDiv.querySelectorAll('.theme-card');
            themeCards.forEach(card => {
              if (card.getAttribute('data-theme') === currentTheme) {
                card.style.borderColor = "#8b00ff";
                card.style.background = "rgba(139, 0, 255, 0.15)";
              }
              card.onclick = () => {
                themeCards.forEach(c => {
                  c.style.borderColor = "transparent";
                  c.style.background = "rgba(255,255,255,0.03)";
                });
                card.style.borderColor = "#8b00ff";
                card.style.background = "rgba(139, 0, 255, 0.15)";
                const selected = card.getAttribute('data-theme');
                localStorage.setItem('selectedTheme', selected);

                if (typeof window.applyTheme === 'function') window.applyTheme(selected);
              };
            });

            const splashCheckbox = document.getElementById('toggle-study-cloak');
            if (splashCheckbox) {
              splashCheckbox.checked = localStorage.getItem('disableStudyCloak') === 'true';
              splashCheckbox.onchange = (e) => {
                localStorage.setItem('disableStudyCloak', e.target.checked ? 'true' : 'false');
              };
            }

            const cloakSelector = document.getElementById('cloakSelector');
            if (cloakSelector) {
              const savedCloak = localStorage.getItem('savedCloak');
              if (savedCloak) cloakSelector.value = savedCloak;
              cloakSelector.onchange = (e) => {
                if (e.target.value === "none") {
                  localStorage.removeItem('savedCloak');
                } else {
                  localStorage.setItem('savedCloak', e.target.value);
                }
              };
            }

            const autoLaunchCheckbox = document.getElementById('toggle-auto-launch');
            const autoLaunchOptionsDiv = document.getElementById('auto-launch-options');
            const autoLaunchEnvSelect = document.getElementById('auto-launch-environment');

            if (autoLaunchCheckbox && autoLaunchOptionsDiv && autoLaunchEnvSelect) {
              const isAutoLaunchOn = localStorage.getItem('autoLaunchEnabled') === 'true';
              autoLaunchCheckbox.checked = isAutoLaunchOn;
              autoLaunchEnvSelect.value = localStorage.getItem('autoLaunchEnv') || 'about:blank';

              if (isAutoLaunchOn) autoLaunchOptionsDiv.style.display = 'block';

              autoLaunchCheckbox.onchange = (e) => {
                localStorage.setItem('autoLaunchEnabled', e.target.checked ? 'true' : 'false');
                autoLaunchOptionsDiv.style.display = e.target.checked ? 'block' : 'none';
              };

              autoLaunchEnvSelect.onchange = (e) => {
                localStorage.setItem('autoLaunchEnv', e.target.value);
              };
            }

            const shortcutInput = document.getElementById('panicShortcut');
            const panicLinkInput = document.getElementById('panicLink');
            const savePanicBtn = document.getElementById('savePanic');

            if (shortcutInput && panicLinkInput && savePanicBtn) {
              const savedPanicKey = localStorage.getItem('panicKey') || 'b';
              const savedPanicBlocker = localStorage.getItem('panicBlocker') || 'goguardian';
              const savedPanicUrl = localStorage.getItem('panicUrl') || 'https://classroom.google.com';

              let tempKey = savedPanicKey;
              shortcutInput.onkeydown = (e) => {
                e.preventDefault();
                if (["Control", "Shift", "Alt", "Meta", "Escape"].includes(e.key)) return;
                tempKey = e.key.toLowerCase();
                shortcutInput.value = `Key: ${e.key.toUpperCase()}`;
              };

              savePanicBtn.onclick = () => {
                localStorage.setItem('panicKey', tempKey);
                localStorage.setItem('panicUrl', panicLinkInput.value.trim());

                savePanicBtn.textContent = "Saved Successfully!";
                savePanicBtn.style.background = "#10b981";
                setTimeout(() => {
                  savePanicBtn.textContent = "Save Panic Settings";
                  savePanicBtn.style.background = "#8b00ff";
                }, 2000);
              };
            }
          }

          const modalCloseBtn = document.getElementById('closeSettings');
          if (modalCloseBtn) {
            modalCloseBtn.onclick = () => { modal.style.display = 'none'; };
          }
        })
        .catch(err => {
          console.error("Modal operational crash trace:", err);
          const contentDiv = document.getElementById('modal-settings-content');
          if (contentDiv) {
            contentDiv.innerHTML = `<p style="color:#ff3333;">Failed parsing setup resources within current active viewport.</p>`;
          }
        });
    };
  }

  showHomeView();

  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    randomBtn.onclick = () => {
      const idx = Math.floor(Math.random() * _0xData.length);
      launchGame(_0xData[idx].id);
    };
  }

  const user = localStorage.getItem('chatUser');
  if (user) {
    if (document.getElementById('welcome-text')) {
      document.getElementById('welcome-text').textContent = `Hello, ${user}`;
    }
    if (document.getElementById('signInBtn')) {
      document.getElementById('signInBtn').textContent = "Sign Out";
    }
  } else {
    if (document.getElementById('welcome-text')) {
      document.getElementById('welcome-text').textContent = "Hello, Guest";
    }
    if (document.getElementById('signInBtn')) {
      document.getElementById('signInBtn').textContent = "Sign In";
    }
  }

  if (document.getElementById('signInBtn')) {
    document.getElementById('signInBtn').onclick = () => {
      if (localStorage.getItem('chatUser')) {
        localStorage.removeItem('chatUser');
        location.reload();
      } else {
        window.location.href = "../Login/login.html";
      }
    };
  }

  if (document.getElementById('nav-home')) document.getElementById('nav-home').onclick = (e) => { e.preventDefault(); showHomeView(); };
  if (document.getElementById('nav-games')) document.getElementById('nav-games').onclick = (e) => { e.preventDefault(); showAllGamesView(); };
  if (document.getElementById('nav-favorites')) document.getElementById('nav-favorites').onclick = (e) => { e.preventDefault(); showFavoritesView(); };

  if (document.getElementById('nav-unblockers')) document.getElementById('nav-unblockers').onclick = (e) => { e.preventDefault(); handlePlaceholderView('nav-unblockers', 'Unblockers'); };
  if (document.getElementById('nav-profile')) document.getElementById('nav-profile').onclick = (e) => { e.preventDefault(); handlePlaceholderView('nav-profile', 'Profile'); };
  if (document.getElementById('nav-terminal')) document.getElementById('nav-terminal').onclick = (e) => { e.preventDefault(); handlePlaceholderView('nav-terminal', 'Terminal'); };

  if (document.getElementById('nav-assistant')) {
    document.getElementById('nav-assistant').onclick = (e) => {
      e.preventDefault();
      window.location.href = "https://nullai.base44.app";
    }; 
  }

  const commsNavBtn = document.getElementById('nav-communications');
  if (commsNavBtn) {
    commsNavBtn.onclick = (e) => {
      e.preventDefault();
      updateNavActiveState('nav-communications');

      if (localStorage.getItem('chatUser')) {
        window.location.href = "../chat/chat.html";
      } else {
        window.location.href = "../Login/login.html";
      }
    };
  }

  if (document.getElementById('stealthOpener')) {
    document.getElementById('stealthOpener').onclick = (e) => {
      e.preventDefault();
      launchStealthWindow(localStorage.getItem('savedCloak') || 'Google Classroom', localStorage.getItem('autoLaunchEnv') || 'about:blank');
    };
  }

  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) { showHomeView(); return; }
      document.getElementById('heroSection').style.display = 'none';
      document.querySelector('.random-section').style.display = 'none';
      if (document.getElementById('favoritesGrid')) document.getElementById('favoritesGrid').style.display = 'none';
      if (document.getElementById('gameGrid')) document.getElementById('gameGrid').style.display = 'grid';
      const hits = _0xData.filter(g => g.title.toLowerCase().includes(term) || g.desc.toLowerCase().includes(term));
      renderLibraryGrid(hits);
    });
  }

  const contextMenu = document.getElementById('custom-context-menu');
  const deleteModal = document.getElementById('delete-modal-overlay');
  const ctxFavorite = document.getElementById('ctx-favorite');
  const ctxDelete = document.getElementById('ctx-delete');

  document.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.game-card');
    if (card) {
      e.preventDefault();
      contextTargetId = card.getAttribute('data-game-id');

      if (favoriteGamesList.includes(contextTargetId)) {
        ctxFavorite.textContent = "Unfavorite Game";
      } else {
        ctxFavorite.textContent = "Favorite Game";
      }

      if (contextMenu) {
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
      }
    } else {
      if (contextMenu) contextMenu.style.display = 'none';
    }
  });

  document.addEventListener('click', () => { if (contextMenu) contextMenu.style.display = 'none'; });

  if (ctxFavorite) {
    ctxFavorite.onclick = () => {
      if (!contextTargetId) return;
      if (favoriteGamesList.includes(contextTargetId)) {
        favoriteGamesList = favoriteGamesList.filter(id => id !== contextTargetId);
      } else {
        favoriteGamesList.push(contextTargetId);
      }
      localStorage.setItem('nullx_favorites_arr', JSON.stringify(favoriteGamesList));

      const favoritesGrid = document.getElementById('favoritesGrid');
      if (favoritesGrid && favoritesGrid.style.display === 'grid') {
        renderFavoritesGrid();
      }
    };
  }

  if (ctxDelete) {
    ctxDelete.onclick = () => {
      if (contextTargetId && deleteModal) deleteModal.style.display = 'flex';
    };
  }

  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = () => {
      if (contextTargetId) {
        _0xData = _0xData.filter(g => g.id !== contextTargetId);
        favoriteGamesList = favoriteGamesList.filter(id => id !== contextTargetId);
        localStorage.setItem('nullx_favorites_arr', JSON.stringify(favoriteGamesList));
        if (document.getElementById('gameGrid').style.display === 'grid') renderLibraryGrid(_0xData);
        if (document.getElementById('favoritesGrid').style.display === 'grid') renderFavoritesGrid();
        if (deleteModal) deleteModal.style.display = 'none';
      }
    };
  }

  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.onclick = () => {
      if (deleteModal) deleteModal.style.display = 'none';
    };
  }

  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      function updateBatteryDisplay() {
        const batteryText = document.getElementById('battery-status');
        if (batteryText) {
          const level = Math.round(battery.level * 100);
          const charging = battery.charging ? " (Charging)" : "";
          batteryText.textContent = `Battery: ${level}%${charging}`;
        }
      }
      updateBatteryDisplay();
      battery.addEventListener('levelchange', updateBatteryDisplay);
      battery.addEventListener('chargingchange', updateBatteryDisplay);
    }).catch(err => console.error("Battery access denied:", err));
  }

  function updateClockDisplay() {
    const clockText = document.getElementById('digital-clock');
    if (clockText) {
      const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
      clockText.textContent = new Date().toLocaleTimeString(undefined, options);
    }
  }
  updateClockDisplay();
  setInterval(updateClockDisplay, 1000);

  if (localStorage.getItem('autoLaunchEnabled') === 'true' && !sessionStorage.getItem('launchedThisSession')) {
    sessionStorage.setItem('launchedThisSession', 'true');
    setTimeout(() => {
      launchStealthWindow(localStorage.getItem('savedCloak') || 'Google Classroom', localStorage.getItem('autoLaunchEnv') || 'about:blank');
    }, 500);
  }

  window.addEventListener('keydown', (e) => {
    const savedPanicKey = localStorage.getItem('panicKey');
    const redirectUrl = localStorage.getItem('panicUrl') || 'https://classroom.google.com';

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    if (savedPanicKey && e.key.toLowerCase() === savedPanicKey.toLowerCase()) {
      e.preventDefault();
      window.location.replace(redirectUrl);
    }
  });
});

async function fetchLiveWeather() {
  try {
    const response = await fetch('https://wttr.in/?format=j1');
    if (!response.ok) throw new Error("Weather stream dropped");

    const data = await response.json();
    const current = data.current_condition[0];
    const area = data.nearest_area[0];

    const tempF = current.temp_F;
    const humidity = current.humidity;
    const city = area.areaName[0].value;

    const tempEl = document.getElementById('live-temp');
    const humidEl = document.getElementById('live-humidity');
    const cityEl = document.getElementById('live-city');

    if (tempEl) tempEl.textContent = `${tempF}°`;
    if (humidEl) humidEl.innerHTML = `<i class="fa-solid fa-droplet"></i> ${humidity}% Humidity`;
    if (cityEl) cityEl.textContent = city;

  } catch (err) {
    console.error("[System Error] Live weather lookup stalled:", err);
    const cityEl = document.getElementById('live-city');
    if (cityEl) cityEl.textContent = "Offline Mode";
  }
}

fetchLiveWeather();

(function initLiveUpdateChecker() {
  let currentVersion = null;
  const CHECK_INTERVAL = 30000;

  async function checkServerVersion() {
    try {
      const response = await fetch(`./version.json?cache-bust=${Date.now()}`);
      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;

      if (!currentVersion) {
        currentVersion = serverVersion;
        return;
      }

      if (serverVersion > currentVersion) {
        currentVersion = serverVersion;
        showUpdateNotification();
      }
    } catch (err) {
      console.log("[NxOS Sync] Live data stream polling paused.");
    }
  }

  function showUpdateNotification() {
    if (document.getElementById("nxos-update-popup")) return;

    const popup = document.createElement("div");
    popup.id = "nxos-update-popup";
    popup.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: #0d0d13;
      border: 1px solid #8b00ff;
      border-radius: 8px;
      padding: 18px 22px;
      box-shadow: 0 0 25px rgba(139, 0, 255, 0.4);
      z-index: 99999;
      font-family: monospace;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 320px;
      animation: slideInNxOS 0.4s ease-out;
    `;

    popup.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #27c93f; animation: blink 1s infinite;">●</span>
        <strong style="color: #8b00ff; letter-spacing: 0.5px;">SYSTEM UPDATE DETECTED</strong>
      </div>
      <div style="color: #aaa; font-size: 13px; line-height: 1.4;">
        New live core files and data layouts have just been pushed to the site.
      </div>
      <div style="display: flex; gap: 10px; margin-top: 5px;">
        <button id="nxos-reload-btn" style="flex: 1; background: #8b00ff; border: none; color: #fff; padding: 8px; border-radius: 4px; font-family: inherit; font-weight: bold; cursor: pointer; transition: 0.2s;">
          Sync & Reload
        </button>
        <button id="nxos-dismiss-btn" style="background: #222; border: 1px solid #444; color: #aaa; padding: 8px 12px; border-radius: 4px; font-family: inherit; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes slideInNxOS {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes blink {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      #nxos-reload-btn:hover { background: #a333ff !important; box-shadow: 0 0 10px rgba(139,0,255,0.5); }
    `;
    document.head.appendChild(style);
    document.body.appendChild(popup);

    document.getElementById("nxos-reload-btn").addEventListener("click", async () => {
      sessionStorage.clear();

      const targetUrl = window.location.href;

      try {
        // 1. Fetch the main HTML file with headers that instruct the server & browser to bypass cache
        await fetch(targetUrl, {
          headers: {
            'Pragma': 'no-cache',
            'Expires': '-1',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        // 2. Fetch version.json to clear the cache trace on your version tracking
        await fetch('./version.json', {
          headers: {
            'Pragma': 'no-cache',
            'Expires': '-1',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        // 3. Perform the in-place page swap
        window.location.replace(targetUrl);
      } catch (e) {
        // Fallback reload if network is interrupted
        window.location.reload();
      }
    });

    document.getElementById("nxos-dismiss-btn").addEventListener("click", () => {
      popup.remove();
    });
  }

  checkServerVersion();
  setInterval(checkServerVersion, CHECK_INTERVAL);
})();

// ==========================================
// DYNAMIC CARD CSS INJECTOR 
// ==========================================
(function injectCardStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .game-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    .game-card-img {
      width: 100%;
      height: 140px;
      /* Changed to 'contain' so the whole image fits without getting cropped */
      object-fit: contain; 
      /* Added a dark background to fill any empty space around the image */
      background-color: #0d0d13; 
      border-radius: 8px 8px 0 0;
      margin-bottom: 8px;
    }
    .game-card-img-placeholder {
      width: 100%;
      height: 140px;
      background: linear-gradient(135deg, #1f1f2e, #0d0d13);
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8b00ff;
      font-weight: bold;
      font-size: 24px;
      border-bottom: 1px solid rgba(139, 0, 255, 0.2);
      margin-bottom: 8px;
    }
    .game-card h3 {
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);
})();
// ==========================================
// STEALTH MODE OPENER (about:blank)
// ==========================================
const stealthBtn = document.getElementById("stealthOpener");

if (stealthBtn) {
    stealthBtn.addEventListener("click", () => {
        let win = window.open("about:blank", "_blank");

        if (win) {
            // Get the current page URL, but strip off any existing parameters just in case
            let currentUrl = window.location.href.split('?')[0]; 

            win.document.write(`
                <!DOCTYPE html>
                <html style="margin: 0; padding: 0; overflow: hidden; height: 100%;">
                <head>
                    <title>Google Drive</title>
                    <link rel="icon" href="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png">
                </head>
                <body style="margin: 0; padding: 0; height: 100%; background: #000;">
                    <iframe src="${currentUrl}?mode=stealth" style="width: 100%; height: 100%; border: none;"></iframe>
                </body>
                </html>
            `);
            win.document.close();

            // Redirect the original tab to a safe site so the teacher doesn't see it left open
            window.location.replace("https://classroom.google.com");
        } else {
            alert("Pop-ups must be enabled to launch Stealth Mode.");
        }
    });
}
// ==========================================
// PRIVACY GUARD: PIN LOCK SYSTEM
// ==========================================
(function initPinLock() {
  const STORAGE_KEY = "nxos_user_pin";
  const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes idle time before locking
  let idleTimer;

  // 1. Inject Styles for the Lock Screen Overlay
  const lockStyle = document.createElement("style");
  lockStyle.innerHTML = `
    #pin-lock-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: #0d0d13;
      color: #fff;
      z-index: 99999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    }
    .pin-box {
      background: #181824;
      border: 1px solid rgba(139, 0, 255, 0.3);
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      width: 300px;
    }
    .pin-box h2 {
      margin: 0 0 10px 0;
      color: #8b00ff;
      font-size: 20px;
    }
    .pin-box p {
      font-size: 13px;
      color: #aaa;
      margin-bottom: 20px;
    }
    .pin-input {
      width: 100%;
      padding: 12px;
      font-size: 20px;
      letter-spacing: 8px;
      text-align: center;
      background: #0d0d13;
      border: 1px solid #8b00ff;
      color: #fff;
      border-radius: 6px;
      box-sizing: border-box;
      outline: none;
      margin-bottom: 15px;
    }
    .pin-btn {
      width: 100%;
      padding: 10px;
      background: #8b00ff;
      border: none;
      color: #fff;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .pin-btn:hover {
      background: #a126ff;
    }
    .pin-error {
      color: #ff4a4a;
      font-size: 12px;
      margin-top: 10px;
      display: none;
    }
  `;
  document.head.appendChild(lockStyle);

  // 2. Lock Screen Modal Generator
  function createLockOverlay() {
    if (document.getElementById("pin-lock-overlay")) return;

    const savedPin = localStorage.getItem(STORAGE_KEY);
    const isFirstTime = !savedPin;

    const overlay = document.createElement("div");
    overlay.id = "pin-lock-overlay";
    overlay.innerHTML = `
      <div class="pin-box">
        <h2>${isFirstTime ? "Set Security PIN" : "Dashboard Locked"}</h2>
        <p>${isFirstTime ? "Create a 4-digit PIN to secure your site" : "Enter your 4-digit PIN to unlock"}</p>
        <input type="password" maxlength="4" class="pin-input" id="pin-field" autofocus placeholder="••••" />
        <button class="pin-btn" id="pin-submit">${isFirstTime ? "Save PIN" : "Unlock"}</button>
        <div class="pin-error" id="pin-err-msg">Invalid PIN. Try again.</div>
      </div>
    `;

    document.body.appendChild(overlay);

    const inputField = document.getElementById("pin-field");
    const submitBtn = document.getElementById("pin-submit");
    const errorMsg = document.getElementById("pin-err-msg");

    function handleSubmission() {
      const enteredPin = inputField.value.trim();

      if (enteredPin.length !== 4) {
        errorMsg.innerText = "PIN must be exactly 4 digits.";
        errorMsg.style.display = "block";
        return;
      }

      if (isFirstTime) {
        localStorage.setItem(STORAGE_KEY, enteredPin);
        overlay.remove();
        resetIdleTimer();
      } else {
        if (enteredPin === savedPin) {
          overlay.remove();
          resetIdleTimer();
        } else {
          errorMsg.innerText = "Incorrect PIN!";
          errorMsg.style.display = "block";
          inputField.value = "";
        }
      }
    }

    submitBtn.addEventListener("click", handleSubmission);
    inputField.addEventListener("keyup", (e) => {
      if (e.key === "Enter") handleSubmission();
    });
  }

  // 3. Idle Detection Timer
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (localStorage.getItem(STORAGE_KEY)) {
      idleTimer = setTimeout(() => {
        createLockOverlay();
      }, IDLE_TIMEOUT_MS);
    }
  }

  // 4. Global Event Listeners (Mouse movement resets idle timer)
  ["mousemove", "keydown", "click", "scroll"].forEach((evt) => {
    window.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // 5. Quick-Lock Keyboard Shortcut (Ctrl + L or Alt + L)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      createLockOverlay();
    }
  });

  // Start initial timer
  resetIdleTimer();
});
// =========================================================================
// UNIFIED PANIC & DECOY BLOCKER SYSTEM (20 SCHOOL FILTERS)
// =========================================================================
(function initNullXPanicEngine() {
  let activeOverlay = null;

  // 1. GLOBAL KEYDOWN LISTENER (Works on all pages)
  window.addEventListener("keydown", (e) => {
    // Ignore input if user is actively typing in a text field or input
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
      return;
    }

    const savedPanicKey = (localStorage.getItem("panicKey") || "b").toLowerCase();
    const savedPanicUrl = localStorage.getItem("panicUrl") || "https://classroom.google.com";
    const blockerType = localStorage.getItem("panicBlocker") || "goguardian";

    if (savedPanicKey && e.key.toLowerCase() === savedPanicKey) {
      e.preventDefault();

      if (blockerType === "redirect") {
        window.location.replace(savedPanicUrl);
      } else {
        toggleDecoyOverlay(blockerType);
      }
    }
  });

  function toggleDecoyOverlay(type) {
    if (activeOverlay) {
      removeDecoyOverlay();
    } else {
      renderDecoyOverlay(type);
    }
  }

  function removeDecoyOverlay() {
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
    }
  }

  function renderDecoyOverlay(type) {
    activeOverlay = document.createElement("div");
    activeOverlay.id = "nullx-panic-overlay";
    activeOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 2147483647; background: #ffffff; color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      user-select: none; overflow: auto;
    `;

    // Press ESC twice rapidly to dismiss overlay emergency backup
    let escCount = 0;
    let escTimer;
    window.addEventListener("keydown", function escListener(evt) {
      if (evt.key === "Escape") {
        escCount++;
        clearTimeout(escTimer);
        if (escCount >= 2) {
          removeDecoyOverlay();
          window.removeEventListener("keydown", escListener);
        }
        escTimer = setTimeout(() => { escCount = 0; }, 1000);
      }
    });

    activeOverlay.innerHTML = getBlockerTemplate(type);
    document.body.appendChild(activeOverlay);
  }

  // Expose toggle globally so settings modal can invoke it if needed
  window.toggleDecoyOverlay = toggleDecoyOverlay;

  // 2. TEMPLATES FOR ALL 20 BLOCKERS
  function getBlockerTemplate(type) {
    const host = window.location.hostname || "game-server.net";
    const ip = `10.${Math.floor(Math.random()*100+10)}.${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*200+10)}`;

    switch (type) {
      case "goguardian":
        return `
          <div style="background:#1e293b; color:#fff; padding:15px 30px; display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #ef4444;">
            <div style="font-weight:700; font-size:18px; display:flex; align-items:center; gap:10px;">
              <span style="background:#ef4444; width:12px; height:12px; border-radius:50%; display:inline-block;"></span>
              GoGuardian Admin
            </div>
            <div style="font-size:12px; color:#94a3b8;">Restricted Content Engine v6.2</div>
          </div>
          <div style="max-width:600px; margin:80px auto; padding:30px; text-align:center;">
            <div style="font-size:64px; margin-bottom:10px;">🚫</div>
            <h1 style="font-size:26px; color:#0f172a; margin-bottom:12px; font-weight:800;">Restricted Page</h1>
            <p style="color:#475569; font-size:15px; line-height:1.5; margin-bottom:24px;">
              This website has been restricted by your administrator policy.
            </p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; text-align:left; font-size:13px; color:#334155; margin-bottom:20px;">
              <div><strong>URL:</strong> https://${host}/</div>
              <div><strong>Category:</strong> Games / Uncategorized</div>
              <div><strong>Reason:</strong> Explicit Policy Block</div>
            </div>
            <button onclick="alert('Request sent to system administrator.')" style="background:#2563eb; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:600; cursor:pointer;">Request Admin Review</button>
          </div>
        `;

      case "securly":
        return `
          <div style="max-width:550px; margin:100px auto; font-family:Arial, sans-serif; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <div style="background:#0284c7; color:#fff; padding:25px; font-size:22px; font-weight:bold;">Website Blocked</div>
            <div style="padding:30px; background:#fff;">
              <p style="font-size:16px; color:#374151; margin-bottom:20px;">Securly Web Filter has restricted access to this page.</p>
              <div style="background:#f3f4f6; border-left:4px solid #0284c7; padding:12px; text-align:left; font-size:13px; color:#4b5563; margin-bottom:25px;">
                <p style="margin:4px 0;"><strong>Domain:</strong> ${host}</p>
                <p style="margin:4px 0;"><strong>Filter Policy:</strong> School Strict Policy</p>
                <p style="margin:4px 0;"><strong>Category:</strong> Games & Entertainment</p>
              </div>
              <p style="font-size:12px; color:#9ca3af;">Securly Protection Services</p>
            </div>
          </div>
        `;

      case "lightspeed":
        return `
          <div style="background:#0f172a; height:100vh; color:#f8fafc; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px; box-sizing:border-box;">
            <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:40px; max-width:500px; width:100%;">
              <div style="color:#f43f5e; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Lightspeed Systems Relay</div>
              <h2 style="font-size:24px; font-weight:700; margin-bottom:15px; color:#fff;">Access Blocked</h2>
              <p style="color:#94a3b8; font-size:14px; margin-bottom:25px;">This domain is restricted by the network security profile.</p>
              <div style="background:#0f172a; padding:12px; border-radius:6px; font-family:monospace; font-size:12px; color:#64748b; text-align:left;">
                HOST: ${host}<br>
                RULE: DENY_GAMES_POLICY<br>
                CLIENT: ${ip}
              </div>
            </div>
          </div>
        `;

      case "fortinet":
        return `
          <div style="max-width:600px; margin:80px auto; border:2px solid #dc2626; border-radius:4px; font-family:sans-serif; background:#fff;">
            <div style="background:#dc2626; color:#fff; padding:12px 20px; font-weight:bold; font-size:16px;">FortiGuard Web Filtering - Web Page Blocked!</div>
            <div style="padding:25px; color:#1f2937;">
              <p style="font-size:14px; margin-bottom:15px;">You have attempted to access a webpage that is in violation of network usage guidelines.</p>
              <table style="width:100%; border-collapse:collapse; font-size:13px; color:#374151; margin-bottom:20px;">
                <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 0; font-weight:bold;">URL:</td><td>http://${host}/</td></tr>
                <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 0; font-weight:bold;">Category:</td><td>Freeware and Software Downloads / Games</td></tr>
                <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 0; font-weight:bold;">Client IP:</td><td>${ip}</td></tr>
              </table>
              <div style="font-size:11px; color:#6b7280; text-align:right;">Powered by Fortinet</div>
            </div>
          </div>
        `;

      case "cisco":
        return `
          <div style="max-width:580px; margin:100px auto; font-family:'Segoe UI', sans-serif;">
            <div style="border-left:6px solid #2563eb; padding-left:20px;">
              <h2 style="font-size:28px; color:#1e3a8a; margin:0 0 10px 0; font-weight:600;">Cisco Umbrella</h2>
              <h3 style="font-size:20px; color:#1f2937; margin:0 0 15px 0;">This site is blocked.</h3>
              <p style="color:#4b5563; font-size:14px; line-height:1.6;">This site is blocked due to content filtering restrictions set by your network administrator.</p>
              <div style="margin-top:20px; font-size:12px; color:#9ca3af; font-family:monospace;">
                Block Reason: Category "Gaming"<br>
                Target: ${host}
              </div>
            </div>
          </div>
        `;

      case "blocksi":
        return `
          <div style="max-width:500px; margin:90px auto; border-top:5px solid #2563eb; background:#fff; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:0 0 8px 8px; text-align:center;">
            <div style="font-size:22px; font-weight:bold; color:#1e40af; margin-bottom:10px;">Blocksi Manager</div>
            <div style="font-size:16px; color:#dc2626; font-weight:600; margin-bottom:20px;">Access Restricted</div>
            <p style="font-size:14px; color:#4b5563; margin-bottom:20px;">Web filtering settings prevent access to <strong>${host}</strong>.</p>
            <div style="background:#f3f4f6; padding:10px; border-radius:6px; font-size:12px; color:#6b7280;">Policy: Student Filter Standard</div>
          </div>
        `;

      case "paloalto":
        return `
          <div style="max-width:620px; margin:80px auto; font-family:Arial, sans-serif; border:1px solid #d1d5db; border-radius:6px; overflow:hidden;">
            <div style="background:#0f172a; color:#fff; padding:16px 20px; font-weight:bold; font-size:18px;">Palo Alto Networks - GlobalProtect</div>
            <div style="padding:30px; background:#fff; color:#374151;">
              <h2 style="color:#dc2626; font-size:20px; margin-top:0;">URL Access Blocked</h2>
              <p style="font-size:14px; line-height:1.5;">The site you requested cannot be loaded due to district security policies.</p>
              <div style="background:#f8fafc; padding:15px; border:1px solid #e2e8f0; font-size:13px; font-family:monospace; margin-top:20px;">
                URL: https://${host}/<br>User: student@school.edu<br>Action: Blocked
              </div>
            </div>
          </div>
        `;

      case "sonicwall":
        return `
          <div style="max-width:560px; margin:90px auto; border:1px solid #ea580c; border-radius:6px; font-family:sans-serif; overflow:hidden;">
            <div style="background:#ea580c; color:#fff; padding:14px 20px; font-size:18px; font-weight:bold;">SonicWall Network Security</div>
            <div style="padding:25px; background:#fff; color:#1f2937;">
              <h3 style="margin-top:0; color:#c2410c;">Web Site Blocked</h3>
              <p style="font-size:14px;">Access to the requested URL has been blocked by SonicWall Content Filtering Service.</p>
              <div style="background:#fff7ed; border:1px solid #ffedd5; padding:12px; font-size:13px; color:#9a3412; margin-top:15px;">
                <strong>URL:</strong> http://${host}/<br><strong>Category:</strong> Games
              </div>
            </div>
          </div>
        `;

      case "sophos":
        return `
          <div style="max-width:580px; margin:90px auto; border-top:6px solid #0284c7; font-family:sans-serif; padding:30px; background:#fff; box-shadow:0 10px 20px rgba(0,0,0,0.05);">
            <div style="font-size:24px; font-weight:bold; color:#0369a1; margin-bottom:10px;">Sophos Web Control</div>
            <h3 style="font-size:18px; color:#1f2937; margin-bottom:15px;">High Risk / Restrictive Category Blocked</h3>
            <p style="font-size:14px; color:#4b5563; line-height:1.5;">Access to <strong>${host}</strong> has been restricted by Sophos Endpoint Defense rules.</p>
          </div>
        `;

      case "contentkeeper":
        return `
          <div style="max-width:600px; margin:80px auto; font-family:Arial, sans-serif; background:#fff; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
            <div style="background:#0284c7; color:#fff; padding:16px 24px; font-size:20px; font-weight:bold;">ContentKeeper Web Filter</div>
            <div style="padding:30px; color:#334155;">
              <h2 style="color:#b91c1c; font-size:22px; margin-top:0;">Access Denied by Policy</h2>
              <p style="font-size:14px;">Your network administrator has configured ContentKeeper to filter this site.</p>
              <div style="background:#f1f5f9; padding:12px; font-size:13px; font-family:monospace; margin-top:20px;">
                Site: ${host}<br>Reason: Uncategorized Media / Games
              </div>
            </div>
          </div>
        `;

      case "smoothwall":
        return `
          <div style="max-width:550px; margin:90px auto; font-family:Helvetica, sans-serif; border-left:6px solid #0d9488; padding:30px; background:#fff; box-shadow:0 4px 15px rgba(0,0,0,0.06);">
            <div style="font-size:22px; font-weight:bold; color:#0f766e; margin-bottom:10px;">Smoothwall Filter</div>
            <h3 style="font-size:18px; color:#111827; margin-bottom:10px;">Content Restricted</h3>
            <p style="font-size:14px; color:#4b5563;">Access to the requested URL <strong>${host}</strong> has been denied based on active safety policies.</p>
          </div>
        `;

      case "linewize":
        return `
          <div style="max-width:500px; margin:100px auto; font-family:sans-serif; text-align:center; padding:35px; background:#fff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.1);">
            <div style="font-size:28px; font-weight:bold; color:#4f46e5; margin-bottom:10px;">Linewize</div>
            <div style="font-size:18px; font-weight:600; color:#1f2937; margin-bottom:15px;">Page Blocked</div>
            <p style="font-size:14px; color:#6b7280; line-height:1.5;">This website is restricted under your school's online safety policy.</p>
            <div style="margin-top:20px; font-size:12px; color:#9ca3af; font-family:monospace;">Domain: ${host}</div>
          </div>
        `;

      case "iboss":
        return `
          <div style="max-width:580px; margin:80px auto; font-family:Arial, sans-serif; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div style="background:#111827; color:#fff; padding:18px 24px; font-weight:bold; font-size:20px; display:flex; justify-content:space-between; align-items:center;">
              iboss Cybersecurity
              <span style="background:#ef4444; font-size:11px; padding:3px 8px; border-radius:4px; text-transform:uppercase;">Blocked</span>
            </div>
            <div style="padding:30px; background:#fff; color:#374151;">
              <h3 style="margin-top:0; color:#111827;">Threat & Content Defense Triggered</h3>
              <p style="font-size:14px;">Access to <strong>http://${host}/</strong> is denied by organizational safety policy.</p>
            </div>
          </div>
        `;

      case "zscaler":
        return `
          <div style="max-width:580px; margin:90px auto; font-family:Arial, sans-serif; border:1px solid #cbd5e1; border-radius:8px; padding:30px; background:#fff;">
            <div style="color:#0284c7; font-size:24px; font-weight:bold; margin-bottom:10px;">Zscaler Internet Access</div>
            <h2 style="font-size:20px; color:#0f172a; margin-bottom:15px;">Organization Security Policy - Blocked</h2>
            <p style="font-size:14px; color:#475569; line-height:1.5;">The requested URL violates institutional web use rules.</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px; font-size:12px; font-family:monospace; color:#334155; margin-top:20px;">
              URL: https://${host}/<br>Category: Games / Uncategorized
            </div>
          </div>
        `;

      case "barracuda":
        return `
          <div style="max-width:560px; margin:90px auto; border:1px solid #3b82f6; border-radius:6px; font-family:sans-serif; overflow:hidden;">
            <div style="background:#1d4ed8; color:#fff; padding:14px 20px; font-size:18px; font-weight:bold;">Barracuda Web Security Gateway</div>
            <div style="padding:25px; background:#fff; color:#1f2937;">
              <h3 style="margin-top:0; color:#dc2626;">Access Denied</h3>
              <p style="font-size:14px;">Access to <strong>http://${host}/</strong> has been blocked by Barracuda Web Filter.</p>
            </div>
          </div>
        `;

      case "lanschool":
        return `
          <div style="max-width:500px; margin:100px auto; font-family:sans-serif; text-align:center; padding:30px; border:1px solid #e5e7eb; border-radius:10px; background:#fff;">
            <div style="font-size:20px; font-weight:bold; color:#2563eb; margin-bottom:10px;">LanSchool Web Control</div>
            <div style="font-size:16px; font-weight:600; color:#dc2626; margin-bottom:15px;">Page Restricted</div>
            <p style="font-size:14px; color:#4b5563;">Your teacher or administrator has restricted access to <strong>${host}</strong>.</p>
          </div>
        `;

      case "impero":
        return `
          <div style="max-width:520px; margin:90px auto; border-top:5px solid #7c3aed; background:#fff; padding:30px; box-shadow:0 4px 15px rgba(0,0,0,0.08); border-radius:0 0 8px 8px;">
            <div style="font-size:22px; font-weight:bold; color:#6d28d9; margin-bottom:10px;">Impero Education Pro</div>
            <h3 style="font-size:16px; color:#1f2937; margin-bottom:15px;">Policy Violation Block</h3>
            <p style="font-size:14px; color:#4b5563;">Access to <strong>${host}</strong> is blocked under active classroom control profile.</p>
          </div>
        `;

      case "aristotle":
        return `
          <div style="max-width:550px; margin:90px auto; font-family:Arial, sans-serif; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden;">
            <div style="background:#1e3a8a; color:#fff; padding:15px 20px; font-weight:bold; font-size:18px;">Aristotle K12 Borderless Classroom</div>
            <div style="padding:25px; background:#fff; color:#334155;">
              <h3 style="color:#b91c1c; margin-top:0;">Restricted Access</h3>
              <p style="font-size:14px;">The site <strong>${host}</strong> is blocked during active class sessions.</p>
            </div>
          </div>
        `;

      case "chrome_blocked":
        return `
          <div style="background:#fff; height:100vh; padding:80px 40px; box-sizing:border-box; font-family:Roboto, Arial, sans-serif; color:#202124;">
            <div style="max-width:500px; margin:0 auto;">
              <div style="font-size:48px; margin-bottom:20px; color:#5f6368;">🚫</div>
              <h1 style="font-size:22px; font-weight:500; margin-bottom:15px;">Blocked by administrator</h1>
              <p style="font-size:14px; color:#5f6368; line-height:1.6; margin-bottom:25px;">
                This page has been blocked by your administrator.
              </p>
              <div style="font-family:monospace; font-size:12px; color:#5f6368;">ERR_BLOCKED_BY_ADMINISTRATOR</div>
            </div>
          </div>
        `;

      case "generic_404":
      default:
        return `
          <div style="background:#fff; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:#1f2937;">
            <h1 style="font-size:72px; margin:0; color:#9ca3af;">404</h1>
            <h2 style="font-size:24px; margin:10px 0; font-weight:600;">Page Not Found</h2>
            <p style="color:#6b7280; font-size:14px;">The server could not verify that the requested URL exists on this host.</p>
          </div>
        `;
    }
  }
})();
