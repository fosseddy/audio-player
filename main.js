const duration = document.querySelector("#duration");
const currentTime = document.querySelector("#current-time");

const playBtn = document.querySelector("#play-btn");
const pauseBtn = document.querySelector("#pause-btn");
const resetBtn = document.querySelector("#reset-btn");

const audio = new Audio("basta-war.mp3");

audio.addEventListener("loadeddata", () => {
    let [min, sec] = secondsToMinutes(audio.duration);
    duration.textContent = `${min}:${sec}`;

    [min, sec] = secondsToMinutes(audio.currentTime);
    currentTime.textContent = `${min}:${sec}`;
});

audio.addEventListener("timeupdate", () => {
    const [min, sec] = secondsToMinutes(audio.currentTime);
    currentTime.textContent = `${min}:${sec}`;
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

function secondsToMinutes(secs) {
    const min = String(parseInt(secs / 60)).padStart(2, "0");
    const sec = String(parseInt(secs % 60)).padStart(2, "0");

    return [min, sec];
}
