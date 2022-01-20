const playBtn = document.querySelector("#play-btn");
const pauseBtn = document.querySelector("#pause-btn");
const resetBtn = document.querySelector("#reset-btn");

const audio = new Audio("basta-war.mp3");

playBtn.addEventListener("click", () => {
    audio.play();
});

pauseBtn.addEventListener("click", () => {
    audio.pause();
});

resetBtn.addEventListener("click", () => {
    audio.load();
});
