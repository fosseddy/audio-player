function assert(cond, msg = null) {
  if (!cond) {
    throw new Error(`Assertion failed${msg ? ": " + msg : "."}`);
  }
}

const state = {
  songs: [],
  currSong: 0, // first song by default

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

const fileInput = document.querySelector("input[type=file]") ?? assert(false);
fileInput.addEventListener("change", e => {
  const { files } = e.target;
  if (!files.length) return;

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
      if (tmp.length === files.length - errcount) {
        state.songs.push(...tmp);
        drawSongList();
        btnVolume.$slider.$updateValue(getCurrentSong().audio.volume);
        drawSongProgress();
        e.target.value = "";
      }
    });

    s.audio.addEventListener("error", () => {
      // @TODO(art): show error to user
      console.error(s.audio.error);
      URL.revokeObjectURL(s.audio.src);
      errcount++;
    });

    s.audio.addEventListener("timeupdate", () => {
      updateSongProgress();
    });

    s.audio.addEventListener("ended", () => {
      if (state.repeatEnabled) {
        resetAudio(s);
        s.audio.play();
      } else {
        // @TODO(art): do not play next song if we reach the end
        resetAudio(s);
        updateSelectedSong(setNextSong());
        drawSongProgress();
        getCurrentSong().audio.play();
        // @TODO(art): check if buttons should be updated
      }
    });
  }
});

const songList = document.querySelector("#song-list") ?? assert(false);
songList.$items = [];

function drawSongList() {
  for (const it of songList.$items) {
    it.remove();
  }

  const items = [];

  for (let i = 0; i < state.songs.length; i++) {
    items.push(createSongListItem(i));
  }

  songList.append(...items);
  songList.$items = items;
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
    drawSongProgress();
  });

  return li;
}

function updateSelectedSong(prevIdx) {
  songList.$items[prevIdx].style.background = "none";
  songList.$items[state.currSong].style.background = "red";
}

const songProgress = document.querySelector("#song-progress") ?? assert(false);

function drawSongProgress() {
  const song = getCurrentSong();

  while (songProgress.firstChild) {
    songProgress.firstChild.remove();
  }

  const curr = document.createElement("p");
  curr.textContent = secondsToTime(song.audio.currentTime);
  songProgress.appendChild(curr);
  songProgress.$currTime = curr;

  const slider = createSlider({
    value: song.audio.currentTime,
    max: song.audio.duration
  });
  slider.classList.add("song-progress__slider");

  slider.addEventListener("slider-click", e => {
    song.audio.currentTime = e.detail;
  });

  songProgress.appendChild(slider);
  songProgress.$slider = slider;

  const end = document.createElement("p");
  end.textContent = secondsToTime(song.audio.duration);
  songProgress.appendChild(end);
}

function updateSongProgress() {
  const { currentTime } = getCurrentSong().audio;
  const { $currTime, $slider } = songProgress;

  $currTime.textContent = secondsToTime(currentTime);
  if (!$slider.$dragging) {
    $slider.$updateValue(currentTime);
  }
}

function secondsToTime(s) {
  const min = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return min + ":" + sec;
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

  // @TODO(art): reset current song if it played for some time?
  const prev = getCurrentSong();
  const isPrevPaused = prev.audio.paused;
  resetAudio(prev);

  updateSelectedSong(setPrevSong());
  drawSongProgress();

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
  drawSongProgress();

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

const btnVolume = document.querySelector("#btn-volume") ?? assert(false);
btnVolume.$slider = createSlider({ max: 1, step: 0.1 });
btnVolume.$slider.style.width = "100px";
btnVolume.$slider.addEventListener("slider-change", e => {
  getCurrentSong().audio.volume = e.detail;
});
btnVolume.appendChild(btnVolume.$slider);

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

function createSlider({ value = 0, min = 0, max = 100, step = 1 }) {
  // @NOTE(art): defined in css file, must be updated mutually
  const THUMB_SIZE = 20;

  function calcFilledWidth(value, min, max) {
    return ((value - min) / (max - min)) * 100;
  }

  function calcThumbOffset(filled) {
    return THUMB_SIZE * filled * 0.01;
  }

  const slider = document.createElement("div");
  slider.classList.add("slider");

  const track = document.createElement("div");
  track.classList.add("slider__track");

  const input = document.createElement("input");
  input.classList.add("slider__input");
  input.min = min;
  input.max = max;
  input.value = value;
  input.step = step;
  input.type = "range";

  const filled = calcFilledWidth(value, min, max);
  const offset = calcThumbOffset(filled);
  track.style.setProperty("--filled-width", filled + "%");
  track.style.setProperty("--thumb-offset", offset + "px");

  input.addEventListener("mousedown", () => {
    slider.$dragging = true;
  });

  input.addEventListener("mouseup", () => {
    slider.$dragging = false;
  });

  input.addEventListener("click", e => {
    slider.dispatchEvent(new CustomEvent("slider-click", {
      detail: e.target.value
    }));
  });

  input.addEventListener("input", e => {
    const { min, max, value } = e.target;

    const filled = calcFilledWidth(value, min, max);
    const offset = calcThumbOffset(filled);
    track.style.setProperty("--filled-width", filled + "%");
    track.style.setProperty("--thumb-offset", offset + "px");

    slider.dispatchEvent(new CustomEvent("slider-change", { detail: value }));
  });

  track.appendChild(input);
  slider.appendChild(track);

  slider.$input = input;
  slider.$dragging = false;
  slider.$updateValue = function(val) {
    slider.$input.value = val;
    slider.$input.dispatchEvent(new Event("input"));
  }

  return slider;
}
