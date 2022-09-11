function assert(cond, msg = null) {
  if (!cond) {
    throw new Error(`Assertion failed${msg ? ": " + msg : "."}`);
  }
}

const state = {
  songs: [],
  currSong: 0, // first song by default
  songListItems: [],

  shuffleEnabled: false,
  shuffledSongs: [],

  repeatEnabled: false
};

function getSongs() {
  return state.shuffleEnabled ? state.shuffledSongs : state.songs;
}

function getCurrentSong() {
  assert(state.songs.length > 0);
  assert(state.currSong >= 0 && state.currSong < state.songs.length);
  return getSongs()[state.currSong];
}

function setNextSong() {
  const prev = state.currSong;
  state.currSong += 1;
  if (state.currSong >= state.songs.length) {
    state.currSong = 0;
  }
  return prev;
}

function setPrevSong() {
  const prev = state.currSong;
  state.currSong -= 1;
  if (state.currSong < 0) {
    state.currSong = state.songs.length - 1;
  }
  return prev;
}

function clearSongListItems() {
  for (const it of state.songListItems) {
    it.remove();
  }
  state.songListItems = [];
}

// Debug
window.state = state;

const fileInput = document.querySelector("input[type=file]") ?? assert(false);
fileInput.addEventListener("change", e => {
  const { files } = e.target;
  if (!files.length) return;

  // @NOTE(art): save for later use in event handler, because we lose it
  // after reset target value in the end of the function
  const filesLen = files.length;
  const tmp = [];
  let errcount = 0;

  for (const f of files) {
    const s = {
      name: f.name,
      audio: new Audio(URL.createObjectURL(f))
    }

    s.audio.addEventListener("canplaythrough", () => {
      tmp.push(s);

      // @NOTE(art): save songs only when all are loaded
      // @TODO(art): show some loading indicator to user?
      // @TODO(art): songs are saved out of order
      if (tmp.length === filesLen - errcount) {
        state.songs.push(...tmp);
        drawSongList();
      }
    });

    s.audio.addEventListener("error", () => {
      // @TODO(art): show error to user
      console.error(s.audio.error);
      URL.revokeObjectURL(s.audio.src);
      errcount++;
    });

    s.audio.addEventListener("ended", () => {
      if (state.repeatEnabled) {
        resetAudio(s);
        s.audio.play();
      } else {
        resetAudio(s);
        updateSelectedSong(setNextSong());
        getCurrentSong().audio.play();
        // @TODO(art): check if buttons should be updated
      }
    });
  }

  e.target.value = "";
});

const songList = document.querySelector("#song-list") ?? assert(false);

function drawSongList() {
  clearSongListItems();
  // @NOTE(art): we just need the length, do not need to check if shuffled
  for (let i = 0; i < state.songs.length; i++) {
    state.songListItems.push(createSongListItem(i));
  }
  songList.append(...state.songListItems);
}

function createSongListItem(idx) {
  const li = document.createElement("li");
  li.textContent = getSongs()[idx].name;

  li.style.padding = "1rem";

  if (state.currSong === idx) {
    li.style.background = "red";
  }

  li.addEventListener("click", () => {
    resetAudio(getCurrentSong());
    const prevIdx = state.currSong;
    state.currSong = idx;
    updateSelectedSong(prevIdx);
  });

  return li;
}

function updateSelectedSong(prevIdx) {
  state.songListItems[prevIdx].style.background = "none";
  state.songListItems[state.currSong].style.background = "red";
}

const btnPlay = document.querySelector("#btn-play") ?? assert(false);
btnPlay.addEventListener("click", () => {
  if (!state.songs.length) return;
  getCurrentSong().audio.play();
});

const btnPause = document.querySelector("#btn-pause") ?? assert(false);
btnPause.addEventListener("click", () => {
  if (!state.songs.length) return;
  getCurrentSong().audio.pause();
});

const btnRepeat = document.querySelector("#btn-repeat") ?? assert(false);
btnRepeat.addEventListener("click", () => {
  if (state.repeatEnabled) {
    state.repeatEnabled = false;
    btnRepeat.style.background = "buttonface";
  } else {
    state.repeatEnabled = true;
    btnRepeat.style.background = "green";
  }
});

const btnPrevSong = document.querySelector("#btn-prev-song") ?? assert(false);
btnPrevSong.addEventListener("click", () => {
  if (!state.songs.length) return;

  const prev = getCurrentSong();
  const isPrevPaused = prev.audio.paused;
  resetAudio(prev);

  updateSelectedSong(setPrevSong());

  if (!isPrevPaused) {
    getCurrentSong().audio.play();
  }
});

const btnNextSong = document.querySelector("#btn-next-song") ?? assert(false);
btnNextSong.addEventListener("click", () => {
  if (!state.songs.length) return;

  const prev = getCurrentSong();
  const isPrevPaused = prev.audio.paused;
  resetAudio(prev);

  updateSelectedSong(setNextSong());

  if (!isPrevPaused) {
    getCurrentSong().audio.play();
  }
});

const btnShuffle = document.querySelector("#btn-shuffle") ?? assert(false);
btnShuffle.addEventListener("click", () => {
  if (!state.songs.length) return;

  resetAudio(getCurrentSong());

  if (state.shuffleEnabled) {
    state.shuffleEnabled = false;
    state.shuffledSongs = []
    btnShuffle.style.background = "buttonface";
  } else {
    state.shuffleEnabled = true;
    state.shuffledSongs = shuffle(state.songs);
    btnShuffle.style.background = "green";
  }

  state.currSong = 0;

  drawSongList();
});

function resetAudio(song) {
  song.audio.pause();
  song.audio.currentTime = 0;
}

function shuffle(arr) {
  const newArr = [...arr];

  let ci = arr.length;
  let ri = 0;

  while (ci !== 0) {
    ri = Math.floor(Math.random() * ci);
    ci -= 1;
    [newArr[ci], newArr[ri]] = [newArr[ri], newArr[ci]];
  }

  return newArr;
}

class CustomSlider extends HTMLElement {
  constructor() {
    super();

    const THUMB_SIZE = 20;

    function calcFilled(value, min, max) {
      return ((value - min) / (max - min)) * 100;
    }

    function calcOffset(filled) {
      return THUMB_SIZE * filled * 0.01;
    }

    this.value = this.getAttribute("value") ?? 0;

    const slider = document.createElement("div");
    slider.classList.add("slider");

    const track = document.createElement("div");
    track.classList.add("track");

    const input = document.createElement("input");
    input.min = this.getAttribute("min") ?? 0;
    input.max = this.getAttribute("max") ?? 100;
    input.step = this.getAttribute("step") ?? 1;
    input.value = this.value;
    input.type = "range";

    input.addEventListener("input", e => {
      const { min, max, value } = e.target;

      const filled = calcFilled(value, min, max);
      const offset = calcOffset(filled);

      track.style.setProperty("--track-filled-width", filled + "%");
      track.style.setProperty("--thumb-offset", offset + "px");

      this.value = value;
    });

    track.appendChild(input);
    slider.appendChild(track);

    const filled = calcFilled(input.value, input.min, input.max);
    const offset = calcOffset(filled);

    const style = document.createElement("style");
    style.textContent = `
      .slider {
        padding: ${THUMB_SIZE / 2}px 0;
      }

      .track {
        --track-filled-width: ${filled}%;
        --thumb-offset: ${offset}px;

        position: relative;
        display: flex;
        align-items: center;
        background: gray;
        height: 4px;
      }

      .track::before {
        content: "";
        position: absolute;
        background: black;
        width: var(--track-filled-width);
        height: 100%;
      }

      .track::after {
        content: "";
        position: absolute;
        background: red;
        width: ${THUMB_SIZE}px;
        height: ${THUMB_SIZE}px;
        border-radius: 50%;
        left: calc(var(--track-filled-width) - var(--thumb-offset));
      }

      input {
        width: 100%;
        height: 100%;
        opacity: 0;
        z-index: 1;
      }
    `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(style);
    this.shadowRoot.append(slider);
  }
}

customElements.define("custom-slider", CustomSlider);
