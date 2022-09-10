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

function getCurrentSong() {
  assert(state.songs.length > 0);
  assert(state.currSong >= 0);
  return state.songs[state.currSong];
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
        state.currSong += 1;
        if (state.currSong >= state.songs.length) {
          state.currSong = 0;
        }
        drawSongList();
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

  let songs = state.shuffleEnabled ? state.shuffledSongs : state.songs;

  for (let i = 0; i < songs.length; i++) {
    state.songListItems.push(createSongListItem(i));
  }

  songList.append(...state.songListItems);
}

function createSongListItem(idx) {
  let songs = state.shuffleEnabled ? state.shuffledSongs : state.songs;
  const li = document.createElement("li");
  li.textContent = songs[idx].name;

  li.style.padding = "1rem";

  if (state.currSong === idx) {
    li.style.background = "red";
  }

  li.addEventListener("click", () => {
    resetAudio(getCurrentSong());

    state.songListItems[state.currSong].style.background = "none";
    li.style.background = "red";

    state.currSong = idx;
  });

  return li;
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

  const prevSong = getCurrentSong();
  const isPrevPaused = prevSong.audio.paused;
  resetAudio(prevSong);

  state.currSong -= 1;
  if (state.currSong < 0) {
    state.currSong = state.songs.length - 1;
  }

  drawSongList();
  if (!isPrevPaused) {
    getCurrentSong().audio.play();
  }
});

const btnNextSong = document.querySelector("#btn-next-song") ?? assert(false);
btnNextSong.addEventListener("click", () => {
  if (!state.songs.length) return;

  const prevSong = getCurrentSong();
  const isPrevPaused = prevSong.audio.paused;
  resetAudio(prevSong);

  state.currSong += 1;
  if (state.currSong >= state.songs.length) {
    state.currSong = 0;
  }

  drawSongList();
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
