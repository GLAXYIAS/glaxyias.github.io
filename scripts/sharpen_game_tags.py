#!/usr/bin/env python3
"""Sharpen the library's genre tags using title-aware rules.

The original import tagged almost every ASCII-pack game as Arcade. This script
replaces those placeholder tags with several useful categories and falls back to
Casual only when a title has no identifiable genre.
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "JS" / "main.js"

MANUAL = {
    "brotato all pain no gain": ["Roguelike", "Shooter", "Action"],
    "bloodvox": ["Horror", "Shooter"],
    "cloverpit": ["Roguelike", "Horror", "Puzzle"],
    "feeding a black hole": ["Puzzle", "Idle", "Casual"],
    "deadsignal": ["Horror", "Simulation", "Puzzle"],
    "undead corridor": ["Horror", "Shooter"],
    "doki doki literature club": ["Visual Novel", "Horror", "Adventure"],
    "throw a potato": ["Casual", "Puzzle"],
    "throw a potato 2": ["Casual", "Puzzle"],
    "throw a potato again": ["Casual", "Puzzle"],
    "tung tung tung sahur obby": ["Platformer", "Casual"],
    "skinwalker": ["Horror"],
    "ragdoll drop": ["Casual", "Action"],
    "bacon may die": ["Action", "Fighting"],
    "superhot": ["Shooter", "Action"],
    "bad bodyguard": ["Action"],
    "a day in the office": ["Adventure", "Casual"],
    "daddish": ["Platformer"],
    "escape road": ["Racing", "Platformer"],
    "escape road 2": ["Racing", "Platformer"],
    "escape road 3": ["Racing", "Platformer"],
    "escape road city 2": ["Racing", "Platformer"],
    "among us": ["Party", "Multiplayer"],
    "minecraft 1.12": ["Sandbox", "Simulation", "Multiplayer"],
    "minecraft 1.5": ["Sandbox", "Simulation", "Multiplayer"],
    "super smash flash": ["Fighting", "Fan Game"],
    "super smash flash 2": ["Fighting", "Fan Game"],
    "super smash flash v08": ["Fighting", "Fan Game"],
    "fancy pants adventure": ["Platformer"],
    "fancy pants 2": ["Platformer"],
    "fancy pants 3": ["Platformer"],
    "fancy pants adventures": ["Platformer"],
    "getting over it": ["Platformer", "Casual"],
    "gettingoverit": ["Platformer", "Casual"],
    "house of hazards": ["Party", "Multiplayer"],
    "stick fight": ["Fighting", "Party"],
    "stickman hook": ["Platformer", "Casual"],
    "clover pit": ["Roguelike", "Horror", "Puzzle"],
    "brotato": ["Roguelike", "Shooter", "Action"],
    "dead signal": ["Horror", "Simulation", "Puzzle"],
    "a game about feeding a black hole": ["Puzzle", "Idle", "Casual"],
    "balatro": ["Roguelike", "Cards", "Strategy"],
    "buckshot roulette": ["Horror", "Roguelike", "Casual"],
    "vampire survivors": ["Roguelike", "Action", "Survival"],
    "10 minutes till dawn": ["Roguelike", "Shooter", "Survival"],
    "20 minutes till dawn": ["Roguelike", "Shooter", "Survival"],
    "binding of isaac": ["Roguelike", "Shooter", "Horror"],
    "the binding of isaac": ["Roguelike", "Shooter", "Horror"],
    "slay the spire": ["Roguelike", "Cards", "Strategy"],
    "inscryption": ["Roguelike", "Cards", "Horror"],
    "hollow knight": ["Platformer", "Adventure", "Action"],
    "celeste": ["Platformer", "Adventure"],
    "stardew valley": ["Simulation", "Adventure", "Idle"],
    "geometry dash": ["Platformer", "Rhythm", "Casual"],
    "a dance of fire and ice": ["Rhythm", "Puzzle"],
    "adofai": ["Rhythm", "Puzzle"],
    "retro bowl": ["Sports", "Retro"],
    "drive mad": ["Racing", "Casual"],
    "drivemad": ["Racing", "Casual"],
    "slope": ["Platformer", "Casual"],
    "poly track": ["Racing", "3D"],
    "polytrack": ["Racing", "3D"],
    "cookie clicker": ["Idle", "Casual"],
    "wordle": ["Puzzle", "Casual"],
    "minesweeper": ["Puzzle", "Retro"],
    "2048": ["Puzzle", "Casual"],
    "bloxorz": ["Puzzle"],
    "plants vs zombies": ["Tower Defense", "Strategy"],
    "angry birds": ["Puzzle", "Casual"],
    "fruit ninja": ["Casual", "Action"],
    "pou": ["Simulation", "Casual"],
    "bitlife": ["Simulation", "Casual"],
    "doki doki literature club plus": ["Visual Novel", "Horror"],
    "class of 09": ["Visual Novel", "Adventure"],
    "a date with death": ["Visual Novel", "Adventure"],
    "ace attorney": ["Visual Novel", "Adventure", "Puzzle"],
    "space invaders": ["Shooter", "Retro"],
    "space is key": ["Platformer", "Puzzle"],
    "space waves": ["Platformer", "Casual"],
    "spacebar clicker": ["Idle", "Casual"],
    "space wars battleground": ["Shooter", "Strategy"],
    "streets of rage": ["Fighting", "Action"],
    "streets of rage 2": ["Fighting", "Action"],
    "streets of rage 3": ["Fighting", "Action"],
    "superhot": ["Shooter", "Action"],
    "super hot": ["Shooter", "Action"],
    "superhot mind control": ["Shooter", "Action"],
    "super metroid": ["Platformer", "Adventure"],
    "sonic battle": ["Fighting", "Fan Game", "Action"],
    "sift heads": ["Shooter", "Action"],
    "sift heads world": ["Shooter", "Action"],
    "sift heads cartels": ["Shooter", "Action"],
    "sift heads cartels act 2": ["Shooter", "Action"],
    "sift heads cartels act 3": ["Shooter", "Action"],
}

PRIORITY = [
    "Fan Game", "Roguelike", "Visual Novel", "Horror", "Shooter", "Fighting", "Action", "Racing",
    "Sports", "Tower Defense", "Platformer", "Puzzle", "Strategy",
    "Idle", "Survival", "Adventure", "Simulation", "Sandbox", "Party",
    "Multiplayer", "Arcade", "Retro", "Rhythm", "Cooking", "Dress Up", "Cards", "3D",
    "2D", "Casual",
]


def field(text: str, name: str) -> str:
    m = re.search(r"\b" + re.escape(name) + r':\s*"((?:\\.|[^"\\])*)"', text)
    return m.group(1) if m else ""


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().replace("&", " and ")).strip()


def entries(source: str):
    """Yield every game object, including entries inside the GitLab/new-J IIFEs."""
    stack = []
    quote = False
    escape = False
    for i, ch in enumerate(source):
        if quote:
            if escape:
                escape = False
            elif ch == chr(92):
                escape = True
            elif ch == '"':
                quote = False
            continue
        if ch == '"':
            quote = True
        elif ch == "{":
            stack.append(i)
        elif ch == "}" and stack:
            start = stack.pop()
            obj = source[start:i + 1]
            if ("id:" in obj and "title:" in obj and "url:" in obj
                    and obj.count("{") == 1 and obj.count("}") == 1):
                yield start, i + 1, obj



def has(text: str, pattern: str) -> bool:
    return bool(re.search(pattern, text))


def classify(title: str) -> list[str]:
    manual = MANUAL.get(norm(title))
    if manual:
        return manual

    t = norm(title)
    found: list[str] = []

    def add(tag: str) -> None:
        if tag not in found:
            found.append(tag)

    # Very recognisable genres first.
    if has(t, r"fnaf|five nights|horror|scary|granny|slender|backrooms|zombie|resident evil|silent hill|doom|fear|haunt|creepy|exorcist|amnesia|outlast|mutilate|blood|killer|murder|nightmare|yume|dementium|insomniary|scp|poppy playtime|bendy|evil nun|hello neighbor|cry of fear|left 4 dead|dead rising|dead by daylight|phasmophobia|lethal company|choo choo|dark deception|dead signal|cloverpit|undead corridor"):
        add("Horror")
    if has(t, r"tower defense|bloons|\bbtd\b|plants vs zombies|kingdom rush|sanctum|orc must die|dungeon defenders|fieldrunners|castle defense|defend your"):
        add("Tower Defense")
    if has(t, r"race|racing|racer|drift|kart|moto|motocross|bmx|taxi|driver|driving|turbo|highway|traffic|jetski|jet ski|snowmobile|downhill|rally|formula|\bcar\b|truck|parking|\bbus\b|subway|nitro|burnout|need for speed|gran turismo|mario kart|trackmania|hill climb|snow rider|snow road|slow roads|poly ?track|street racing|truck sim"):
        add("Racing")
    if has(t, r"football|soccer|basket|baseball|hockey|tennis|golf|volley|boxing|wrestl|bowling|billiard|cricket|rugby|skate|snowboard|surf|archery|darts|ping pong|table tennis|olympic|penalty|goal|hoop|dunk|fifa|nfl|nba|wwe|ufc|sports|kickball|handball|badminton|squash|curling|fishing|skateboard|skating|swim|\bpool\b|sports heads|head soccer|soccer random|basket random|volley random|boxing random|basketball|race master"):
        add("Sports")
    if has(t, r"shoot|shooter|\bgun\b|sniper|\bwar\b|warfare|battle|combat|strike|assault|army|soldier|tank|plane|helicopter|aircraft|counter.?strike|call of duty|battlefield|halo|doom|fps|bullet|weapon|swat|terror|raze|shotgun|pistol|rifle|\bbow\b|arrow|turret|superhot"):
        add("Shooter")
    if has(t, r"mario|sonic|jump|platform|runner|parkour|fancy pants|kirby|mega ?man|castlevania|shantae|celeste|hollow knight|rayman|crash bandicoot|spyro|doodle|jetpack|gravity|flip|climb|\bvex\b|geometry dash|adofai|a dance of fire|icy|red ball|fireboy|watergirl|leap|bounce|pogo|\bwall\b|hook|slope|\brun\b|running|sprint|escape road|subway surfers|temple run|level devil|cat mario|impossible game|geometry|dash|ninja|obby"):
        add("Platformer")
    if has(t, r"puzzle|match|sort|block|tetris|2048|sudoku|mahjong|solitaire|chess|checker|minesweeper|wordle|crossword|quiz|trivia|escape|\broom\b|hidden|find|difference|brain|logic|maze|color|fill|flow|connect|pipe|cut the rope|angry birds|slice|physics|stack|ball sort|bubble|merge|nonogram|riddle|\bword\b|typing|math|number|shape|draw|paint|guess|spell|letter|scrabble|boggle|hangman|domino|monopoly|backgammon|bingo|poker|blackjack|casino|card|bloxorz|factory balls|civiballs|cover orange|bridge|light|laser|mirror|circuit|program|hack|code|cipher|detective|mystery|feeding a black hole"):
        add("Puzzle")
    if has(t, r"idle|clicker|tycoon|incremental|capitalist|cookie clicker|mining|factory|empire|farm|business|restaurant|papa|management|builder|build|craft|sandbox|city|airport|hospital|hotel|mall|shop|store|bank|zoo|aquarium|garden|planet|space company|cell to singularity|antimatter|evolution|infinite craft|little alchemy|powder|melvor|ngu|realm grinder|adventure capitalist|universal paperclips|theory of magic|kittens game|a dark room|spaceplan|trimps|swarm sim|dodecadragons"):
        add("Idle")
    if has(t, r"strategy|age of war|clash|empire|risk\b|civilization|\bciv\b|command|conquer|red alert|tiberian|tactics|siege|kingdom|castle|viking|clash of|war\b|battle|domination|chess|checker|\bgo\b|defense|tower defense"):
        add("Strategy")
    if has(t, r"fight|fighting|brawl|smash|punch|kick|mortal kombat|street fighter|tekken|soulcalibur|samurai shodown|virtua fighter|guilty gear|blazblue|dragon ball fighterz|super smash|wrestling|boxing|ufc|wwe|stick fight|shadow fight|karate|kung fu|combat|duel|arena"):
        add("Fighting")
    if has(t, r"action|shoot|shooter|gun|sniper|war\b|warfare|battle|combat|strike|assault|army|soldier|tank|ninja|samurai|assassin|monster|zombie|survival|dungeon|hero|attack|defend|boss|enemy|slash|sword|weapon|superhero|spider ?man|batman|avengers|power ranger|transform|dragon ball|naruto|one piece|pirate|fight|fighting|brawl|smash|punch|kick|platform|jump|runner|parkour|adventure|quest|explore"):
        add("Action")
    if "Shooter" in found or "Fighting" in found or "Platformer" in found:
        add("Action")
    if has(t, r"adventure|quest|zelda|pokemon|rpg|story|dungeon|cave|explore|island|journey|wizard|knight|mystery|detective|point and click|escape|walking|date\b|life is strange|undertale|deltarune|earthbound|final fantasy|chrono|secret of mana|golden sun|fire emblem|advance wars|harvest moon|stardew|animal crossing|another world|limbo|inside"):
        add("Adventure")
    if has(t, r"simulator|\bsim\b|tycoon|city|farm|build|craft|sandbox|survival|flight|train|truck|\bbus\b|parking|cooking|restaurant|papa|\blife\b|\bdate\b|dress|makeover|\bpet\b|\bdog\b|\bcat\b|fishing|hunting|farming|garden|zoo|aquarium|hospital|hotel|mall|shop|store|bank|business|management|airport|plane|mechanic|police|firefighter|doctor|dentist|hair|salon|babysitter|pregnant|mother|baby|family|school|teacher|prison|house|home|town|village|theme park|park|airline|railroad|train station"):
        add("Simulation")
    if has(t, r"minecraft|roblox|garry.?s mod|sandbox|terraria|infinite craft|little alchemy|sandboxels|powder toy|worldbox|townscaper"):
        add("Sandbox")
    if has(t, r"2 player|multiplayer|party|random|bros|friends|1v1|among us|fall guys|jackbox|uno|monopoly|trivia|quiz|guess|charades|bingo|board|family|\.io|io\b|online|duel|battle royale|pvp|co.?op|together|house of hazards"):
        add("Party")
    if has(t, r"\.io|io\b|2 player|multiplayer|online|pvp|co.?op|among us|fall guys|roblox|brawl|duel|bros|random|1v1"):
        add("Multiplayer")
    if has(t, r"pac ?man|galaga|asteroids|space invaders|centipede|dig dug|frogger|pong|breakout|pinball|joust|qbert|burger ?time|tapper|robotron|defender|arcade|metal slug|neo geo|street fighter|mortal kombat"):
        add("Arcade")
    if has(t, r"pac ?man|galaga|asteroids|space invaders|centipede|dig dug|frogger|street fighter|mortal kombat|metal slug|neo geo|classic|retro|pinball|breakout|pong|tetris|snake|tapper|burger ?time|joust|defender|robotron|qbert|donkey kong|super mario|sonic|sega|\bnes\b|snes|game boy|\bgba\b|atari|commodore|amiga|\bdos\b|flash game"):
        add("Retro")
    if has(t, r"mario|sonic|pokemon|fnaf|five nights|fnf|friday night funkin|baldi|bendy|cuphead|kirby|super smash|team fortress|half.?life|portal|lego|star wars|harry potter|batman|spider ?man|dragon ball|naruto|one piece|squid game|poppy playtime|huggy wuggy|rainbow friends|garten of banban|skibidi|brainrot"):
        add("Fan Game")
    if has(t, r"brotato|rogue|roguelike|hades|dead cells|enter the gungeon|binding of isaac|risk of rain|vampire survivors|20 minutes till dawn|10 minutes till dawn|cloverpit|buckshot roulette|balatro|slay the spire|monster train|cult of the lamb|gunfire reborn|soul knight|nuclear throne|tiny rogues|nova drift|rogue legacy|spelunky|noita|dome keeper|against the storm|darkest dungeon|loop hero|peglin|dicey dungeons|griftlands|neoverse|inscryption"):
        add("Roguelike")
    if has(t, r"survival|survive|zombie|apocalypse|raft|stranded|island|forest|minecraft|terraria|don.t starve|dayz|\bark\b|rust|subnautica|long dark|green hell|project zomboid|7 days|dead frontier|state of decay|last stand|last of us|resident evil|left 4 dead|unturned|palworld|valheim|enshrouded|v rising|icarus"):
        add("Survival")
    if has(t, r"cooking|chef|restaurant|papa|burger|pizza|taco|sushi|ice cream|cake|donut|bakery|kitchen|food|serve|diner|coffee|barista|hot dog|sandwich|breakfast|food truck|good pizza|barbecue|bbq"):
        add("Cooking")
    if has(t, r"\bdress\b|makeover|fashion|\bsalon\b|hairstyle|outfit|princess|barbie|bratz|monster high|winx|mermaid|wedding|\bmodel\b|beauty|\bspa\b|nails|tattoo|boutique|shopaholic|clothes|\bstyle\b"):
        add("Dress Up")
    if has(t, r"fnf|friday night funkin|rhythm|music|piano|beat|dance|guitar|osu|geometry dash|adofai|a dance of fire and ice|just shapes|rhythm doctor|muse dash|arcaea|phigros|beat saber"):
        add("Rhythm")
    if has(t, r"doki doki|date with death|class of 09|ace attorney|danganronpa|steins.?gate|clannad|katawa shoujo|needy streamer|slay the princess|scarlet hollow|dream daddy|monster prom|visual novel"):
        add("Visual Novel")
    if has(t, r"card|cards|poker|blackjack|solitaire|uno|monopoly|magic|hearthstone|slay the spire|balatro|inscryption|gwent|yugioh|deck"):
        add("Cards")
    if has(t, r"\b3d\b|3 d|unity|webgl|fps|poly ?track|slow roads|snow rider"):
        add("3D")
    if has(t, r"\b2d\b|2 d"):
        add("2D")

    if not found:
        add("Casual")
    # Keep the most descriptive categories first, capped at five.
    return [tag for tag in PRIORITY if tag in found][:5]


def main() -> None:
    if not MAIN.exists():
        sys.exit("JS/main.js not found")
    source = MAIN.read_text(encoding="utf-8")
    items = list(entries(source))
    edits = []
    counts = Counter()
    for start, end, obj in items:
        title = field(obj, "title")
        tags = classify(title)
        counts.update(tags)
        tag_text = ", ".join('"' + tag + '"' for tag in tags)
        if re.search(r"\btags:\s*\[[^\]]*\]", obj):
            new_obj = re.sub(r"\btags:\s*\[[^\]]*\]", f"tags: [{tag_text}]", obj, count=1)
        else:
            new_obj = obj[:-1] + f', tags: [{tag_text}]' + obj[-1:]
        edits.append((start, end, new_obj))

    for start, end, replacement in reversed(edits):
        source = source[:start] + replacement + source[end:]
    MAIN.write_text(source, encoding="utf-8")
    print(f"retagged {len(items)} games")
    print(", ".join(f"{tag}: {count}" for tag, count in counts.most_common()))


if __name__ == "__main__":
    main()
