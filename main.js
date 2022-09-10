function assert(cond, msg = null) {
  if (!cond) {
    throw new Error(`Assertion failed${msg ? ": " + msg : "."}`);
  }
}

const state = {
  songs: [],
  currSong: 0, // first song by default
  songListItems: []
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
  }

  e.target.value = "";
});

const songList = document.querySelector("#song-list") ?? assert(false);

function drawSongList() {
  clearSongListItems();

  for (let i = 0; i < state.songs.length; i++) {
    state.songListItems.push(createSongListItem(i));
  }

  songList.append(...state.songListItems);
}

function createSongListItem(idx) {
  const li = document.createElement("li");
  li.textContent = state.songs[idx].name;

  li.style.padding = "1rem";

  if (state.currSong === idx) {
    li.style.background = "red";
  }

  li.addEventListener("click", () => {
    const song = getCurrentSong();
    if (!song.audio.paused) {
      song.audio.pause();
    }
    song.audio.currentTime = 0;

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
