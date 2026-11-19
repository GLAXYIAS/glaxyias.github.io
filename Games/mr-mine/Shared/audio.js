var mute = 0;
var mutebuttons = 0;
var muteisotopes = 0;
var mutecapacity = 0;
var mainMusic = "Shared/Audio/newmusic.mp3";

var clickAudio;
var clickMineral;
var closeAudio;
var buyAudio;
var isotopeFoundAudio;
var failureAudio;
var music;
var capacityFullAudio;
var armoryUpgradeAudio;
var craftDrillAudio;
var craftStructureAudio;
var defeatBossAudio;
var discoverMineralAudio;
var droneReturnAudio;
var hireAudio;
var questCollectAudio;
var questCompleteAudio;
var sacrificeMineralAudio;
var sacrificeWarped;
var sacrificeDivine;
var scientistCollectAudio;
var takeoffCountdownAudio;
var tradeAudio;
var caveAppearsAudio;
var caveCollapseAudio;
var chestGoldOpenAudio;
var chestOpenAudio;

function createSound(source) {
	let sound = new Media(getMediaUrl(source));
	return sound;
}

function patchAudioForDesktop() {
	if (!window.Media) {
		window.Media = Audio;
		window.Media.prototype.setVolume = function (volume) {
			this.volume = volume;
		}
	}
}

function getMediaUrl(mediaPath) {
	if (isMobile() && platform.isAndroid()) {
		return "file:///android_asset/www/" + mediaPath;
	} else if (isMobile() && platform.isIOs()) {
		return cordova.file.applicationDirectory + "www/" + mediaPath;
	}
	return mediaPath;
}

if (!isMobile() || !platform.isIOs()) {
	patchAudioForDesktop();
	initSoundEffects();
}

function initSoundEffects() {
	clickAudio = [createSound("Shared/Audio/click1.wav"), createSound("Shared/Audio/click2.wav"), createSound("Shared/Audio/click3.wav"), createSound("Shared/Audio/click4.wav"), createSound("Shared/Audio/click5.wav")];
	clickMineral = [createSound("Shared/Audio/clickmineral1new.mp3"), createSound("Shared/Audio/clickmineral2new.mp3"), createSound("Shared/Audio/clickmineral3new.mp3"), createSound("Shared/Audio/clickmineral4new.mp3")];
	closeAudio = [createSound("Shared/Audio/cliclack2.wav"), createSound("Shared/Audio/cliclack3.wav")]
	buyAudio = createSound("Shared/Audio/buy.wav");
	isotopeFoundAudio = createSound("Shared/Audio/special.wav");
	failureAudio = createSound("Shared/Audio/nope.wav");
	if (!isMobile()) {
		music = platform.initMusic();
	}
	capacityFullAudio = createSound("Shared/Audio/CapacityFull.mp3");
	armoryUpgradeAudio = createSound("Shared/Audio/armoryupgrade.mp3");
	craftDrillAudio = createSound("Shared/Audio/craftdrill.mp3");
	craftStructureAudio = createSound("Shared/Audio/craftstructure.mp3");
	defeatBossAudio = createSound("Shared/Audio/defeatboss.mp3");
	discoverMineralAudio = createSound("Shared/Audio/discovermineral.mp3");
	droneReturnAudio = createSound("Shared/Audio/dronereturn.mp3");
	hireAudio = createSound("Shared/Audio/hire.mp3");
	questCollectAudio = createSound("Shared/Audio/questcollect.mp3");
	questCompleteAudio = createSound("Shared/Audio/questcomplete.mp3");
	sacrificeMineralAudio = createSound("Shared/Audio/sacrificemineral.mp3");
	sacrificeWarped = createSound("Shared/Audio/sacrificeWarped.mp3");
	sacrificeDivine = createSound("Shared/Audio/sacrificeDivine.mp3");
	scientistCollectAudio = createSound("Shared/Audio/scientistscollect.mp3");
	takeoffCountdownAudio = createSound("Shared/Audio/takeoffcountdown.mp3");
	tradeAudio = createSound("Shared/Audio/trade.mp3");
	caveAppearsAudio = createSound("Shared/Audio/caveappears.mp3");
	caveCollapseAudio = createSound("Shared/Audio/cavecollapse.mp3");
	chestGoldOpenAudio = createSound("Shared/Audio/chestgoldopen.mp3");
	chestOpenAudio = createSound("Shared/Audio/chestopen.mp3");
	promoClickableAudio = [createSound("Shared/Audio/grub-attack.wav")];
	capacityFullAudio.setVolume(0.05);
	promoClickableAudio.forEach(sound => sound.setVolume(0.1));
}

function setVolume() {
	if (localStorage.getItem("mute") === null) {
		mute = 0;
		mutebuttons = 0;
		mutecapacity = 1;
		muteisotopes = 0;
		localStorage["mute"] = 0;
		localStorage["mutebuttons"] = 0;
		localStorage["mutecapacity"] = 1;
		localStorage["muteisotopes"] = 0;

	}
	else {
		mute = parseInt(localStorage["mute"]);
		mutebuttons = parseInt(localStorage["mutebuttons"]);
		mutecapacity = parseInt(localStorage["mutecapacity"]);
		muteisotopes = parseInt(localStorage["muteisotopes"]);
	}
	// platform.toggleMusic();
}

function playClickSound() {
	if (!mutebuttons) clickAudio[rand(0, clickAudio.length - 1)].play();
}