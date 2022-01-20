const duration = document.querySelector("#duration");
const currentTime = document.querySelector("#current-time");

const volume = document.querySelector("#volume");
const incVolumeBtn = document.querySelector("#inc-volume-btn");
const decVolumeBtn = document.querySelector("#dec-volume-btn");

const playBtn = document.querySelector("#play-btn");
const pauseBtn = document.querySelector("#pause-btn");
const resetBtn = document.querySelector("#reset-btn");

const audio = new Audio("basta-war.mp3");

audio.addEventListener("loadeddata", () => {
    let [min, sec] = secondsToMinutes(audio.duration);
    duration.textContent = `${min}:${sec}`;

    [min, sec] = secondsToMinutes(audio.currentTime);
    currentTime.textContent = `${min}:${sec}`;

    volume.textContent = (audio.volume * 100).toFixed() + "%";
});

audio.addEventListener("timeupdate", () => {
    const [min, sec] = secondsToMinutes(audio.currentTime);
    currentTime.textContent = `${min}:${sec}`;
});

audio.addEventListener("volumechange", () => {
    if (audio.volume == 0) {
        volume.textContent = "Muted";
    } else {
        volume.textContent = (audio.volume * 100).toFixed() + "%";
    }
});

playBtn.addEventListener("click", () => {
    audio.play();
});

pauseBtn.addEventListener("click", () => {
    audio.pause();
});

resetBtn.addEventListener("click", () => {
    audio.load();
});

const VOLUME_STEP = 0.05;
incVolumeBtn.addEventListener("click", () => {
    let v = audio.volume + VOLUME_STEP;
    if (v > 1) {
        v = 1;
    }
    audio.volume = v;
});

decVolumeBtn.addEventListener("click", () => {
    let v = audio.volume - VOLUME_STEP;
    if (v < 0) {
        v = 0;
    }
    audio.volume = v;
});


function secondsToMinutes(secs) {
    const min = String(parseInt(secs / 60)).padStart(2, "0");
    const sec = String(parseInt(secs % 60)).padStart(2, "0");

    return [min, sec];
}
