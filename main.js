let uid = 0;

const state = {
  songs: [],
  currentSong: null
};

window.state = state;

const ui = {
  songList: document.querySelector("#song-list"),
  songInput: document.querySelector("input[type='file']"),
  buttons: {
    play: document.querySelector("#btn-play"),
    pause: document.querySelector("#btn-pause")
  }
};

ui.buttons.play.addEventListener("click", () => {
  if (!state.currentSong) return;
  state.currentSong.audio.play();
  ui.buttons.play.classList.add("hidden");
  ui.buttons.pause.classList.remove("hidden");
});

ui.buttons.pause.addEventListener("click", () => {
  if (!state.currentSong) return;
  state.currentSong.audio.pause();
  ui.buttons.pause.classList.add("hidden");
  ui.buttons.play.classList.remove("hidden");
});

ui.songInput.addEventListener("change", e => {
  const { files } = e.target;
  if (!files.length) return;

  const tmp = [];
  let errcount = 0;

  for (const f of files) {
    const song = {
      id: uid++,
      name: f.name,
      audio: new Audio(URL.createObjectURL(f))
    };

    song.audio.addEventListener("canplaythrough", () => {
      tmp.push(song);

      // add songs when all of them are loaded
      if (tmp.length === files.length - errcount) {
        state.songs.push(...tmp);

        if (!state.currentSong && state.songs.length) {
          state.currentSong = state.songs[0];
        }

        makeSongList();
        e.target.value = "";
      }
    });

    song.audio.addEventListener("error", () => {
      // @TODO(art): show error to user
      console.error(song.audio.error);
      URL.revokeObjectURL(song.audio.src);
      errcount++;
    });
  }
});

function makeSongList() {
  clearChildren(ui.songList);

  const lis = [];
  for (const s of state.songs) {
    const li = document.createElement("li");

    li.classList.add("song-list__item");
    if (state.currentSong.id === s.id) {
      li.classList.add("song-list__item--selected");
    }

    li.textContent = s.name;

    li.addEventListener("click", () => {
      state.currentSong = s;
      for (const it of lis) {
        it.classList.remove("song-list__item--selected");
      }
      li.classList.add("song-list__item--selected");
    });

    lis.push(li);
  }

  ui.songList.append(...lis);
}

function clearChildren(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
