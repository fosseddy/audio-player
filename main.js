function assert(cond, msg = null) {
  if (!cond) {
    throw new Error(`Assertion failed${msg ? ": " + msg : "."}`);
  }
}

const state = {
  audio: new Audio(),
  audioChanged: false,

  songs: [],
  songIdx: 0, // first song by default

  shuffleEnabled: false,
  shuffledSongs: [],

  songListExpanded: true
};

function getSongs() {
  return state.shuffleEnabled ? state.shuffledSongs : state.songs;
}

function getSong(idx = state.songIdx) {
  assert(state.songs.length > 0);
  assert(idx >= 0 && idx < state.songs.length);
  return getSongs()[idx];
}

function loadSong() {
  state.audio.src = getSong().src;
  state.audio.load();
}

function isAudioReady() {
  return state.audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA;
}

function resetAudio() {
  state.audio.pause();
  state.audio.currentTime = 0;
}

function setPrevSong() {
  const prev = state.songIdx;
  state.songIdx -= 1;
  if (state.songIdx < 0) {
    state.songIdx = state.songs.length - 1;
  }
  return prev;
}

function setNextSong() {
  const prev = state.songIdx;
  state.songIdx += 1;
  if (state.songIdx >= state.songs.length) {
    state.songIdx = 0;
  }
  return prev;
}

function loadPrevSong() {
  const prevIdx = setPrevSong();
  loadSong();
  return prevIdx;
}

function loadNextSong() {
  const prevIdx = setNextSong();
  loadSong();
  return prevIdx;
}

const fileInput = document.querySelector("input[type=file]") ?? assert(false);
fileInput.addEventListener("change", e => {
  const { files } = e.target;
  if (!files.length) return;

  for (const f of files) {
    const s = {
      name: f.name,
      src: URL.createObjectURL(f)
    };

    state.songs.push(s);
  }

  loadSong();
  drawSongList();

  e.target.value = "";
});

state.audio.addEventListener("canplaythrough", () => {
  console.log("canplaythrough");
  if (state.audioChanged) {
    drawSongProgress();
  }
});

state.audio.addEventListener("timeupdate", () => {
  console.log("timeupdate");
  // @NOTE(art): in our case if after timeupdate audio is not ready, that
  // means we loaded new source
  state.audioChanged = !isAudioReady();
  if (!state.audioChanged) {
    updateSongProgress();
  }
});

state.audio.addEventListener("ended", () => {
  console.log("ended");
  const isLast = state.songs.length - 1 === state.songIdx;

  updateSelectedSong(loadNextSong());

  if (!isLast) {
    state.audio.play();
  }
});

state.audio.addEventListener("error", () => {
  console.log("error");
  // @TODO(art): show error in ui?
  console.error(state.audio.error);
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
  li.classList.add("song-list__item");
  // @TODO(art): Check ui for long names
  li.textContent = getSong(idx).name;

  if (state.songIdx === idx) {
    li.style.background = "red";
  }

  li.addEventListener("click", () => {
    if (state.songIdx === idx) return;
    resetAudio();
    const prev = state.songIdx;
    state.songIdx = idx;
    loadSong();
    updateSelectedSong(prev);
  });

  return li;
}

function updateSelectedSong(prevIdx) {
  songList.$items[prevIdx].style.background = "none";
  songList.$items[prevIdx].style.position = "static";

  songList.$items[state.songIdx].style.background = "red";

  if (!state.songListExpanded) {
    songList.$items[state.songIdx].style.position = "sticky";
    songList.$items[state.songIdx].style.top = "0px";
    songList.$items[state.songIdx].style.bottom = "0px";
  }
}

const songProgress = document.querySelector("#song-progress") ?? assert(false);

function drawSongProgress() {
  while (songProgress.firstChild) {
    songProgress.firstChild.remove();
  }

  const curr = document.createElement("p");
  curr.textContent = secondsToTime(state.audio.currentTime);
  songProgress.appendChild(curr);
  songProgress.$currTime = curr;

  const slider = createSlider({
    value: state.audio.currentTime,
    max: state.audio.duration
  });

  slider.addEventListener("slider-click", e => {
    state.audio.currentTime = e.detail;
  });

  songProgress.appendChild(slider);
  songProgress.$slider = slider;

  const end = document.createElement("p");
  end.textContent = secondsToTime(state.audio.duration);
  songProgress.appendChild(end);
}

function updateSongProgress() {
  const { currentTime } = state.audio;
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
  if (!isAudioReady()) return;
  state.audio.play();
});

const btnPause = document.querySelector("#btn-pause") ?? assert(false);
btnPause.addEventListener("click", () => {
  if (!isAudioReady()) return;
  state.audio.pause();
});

const btnPrevSong = document.querySelector("#btn-prev-song") ?? assert(false);
btnPrevSong.addEventListener("click", () => {
  if (state.songs.length <= 1) return;

  const wasPlaying = !state.audio.paused;
  resetAudio();

  // @TODO(art): just reset current song if it played for some time?
  updateSelectedSong(loadPrevSong());

  if (wasPlaying) {
    state.audio.play();
  }
});

const btnNextSong = document.querySelector("#btn-next-song") ?? assert(false);
btnNextSong.addEventListener("click", () => {
  if (state.songs.length <= 1) return;

  const wasPlaying = !state.audio.paused;
  resetAudio();

  updateSelectedSong(loadNextSong());

  if (wasPlaying) {
    state.audio.play();
  }
});

const btnRepeat = document.querySelector("#btn-repeat") ?? assert(false);
btnRepeat.addEventListener("click", () => {
  if (state.audio.loop) {
    state.audio.loop = false;
    btnRepeat.style.background = "buttonface";
  } else {
    state.audio.loop = true;
    btnRepeat.style.background = "green";
  }
});

const btnShuffle = document.querySelector("#btn-shuffle") ?? assert(false);
btnShuffle.addEventListener("click", () => {
  if (!state.songs.length) return;

  resetAudio();

  if (state.shuffleEnabled) {
    state.shuffleEnabled = false;
    state.shuffledSongs = []
    btnShuffle.style.background = "buttonface";
  } else {
    state.shuffleEnabled = true;
    state.shuffledSongs = shuffle(state.songs);
    btnShuffle.style.background = "green";
  }

  state.songIdx = 0;
  loadSong();

  drawSongList();
});

const btnVolume = document.querySelector("#btn-volume") ?? assert(false);
btnVolume.$slider = createSlider({ max: 1, step: 0.1 });
btnVolume.$slider.$updateValue(state.audio.volume);
btnVolume.$slider.addEventListener("slider-change", e => {
  state.audio.volume = e.detail;
});
btnVolume.appendChild(btnVolume.$slider);

const btnBurger = document.querySelector("#btn-burger") ?? assert(false);
if (state.songListExpanded) {
  btnBurger.style.background = "green";
}
btnBurger.addEventListener("click", () => {
  if (state.songListExpanded) {
    state.songListExpanded = false;
    btnBurger.style.background = "buttonface";

    songList.style.maxHeight = "55px";
    songList.style.overflowY = "hidden";

    if (state.songs.length) {
      songList.$items[state.songIdx].style.position = "sticky";
      songList.$items[state.songIdx].style.top = "0px";
      songList.$items[state.songIdx].style.bottom = "0px";
    }
  } else {
    state.songListExpanded = true;
    btnBurger.style.background = "green";

    songList.style.maxHeight = "300px";
    songList.style.overflowY = "auto";

    if (state.songs.length) {
      songList.$items[state.songIdx].style.position = "static";
      songList.$items[state.songIdx].scrollIntoView();
    }
  }
});

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
  const THUMB_SIZE = 20;

  function calcFilledWidth(value, min, max) {
    return ((value - min) / (max - min)) * 100;
  }

  function calcThumbOffset(filled) {
    return THUMB_SIZE * filled * 0.01;
  }

  const slider = document.createElement("div");
  slider.style.setProperty("--thumb-size", THUMB_SIZE + "px");
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
  slider.style.setProperty("--filled-width", filled + "%");
  slider.style.setProperty("--thumb-offset", offset + "px");

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
