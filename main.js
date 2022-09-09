class SongList {
  constructor() {
    this.container = document.querySelector("#song-list");
    console.assert(this.container != null);
    this.items = [];
    this.songs = [];
    this.currSong = null;
  }

  addSongs(sx) {
    if (!sx.length) return;

    this.songs.push(...sx);

    if (this.currSong == null) {
      this.currSong = 0;
      setProgress(this.getCurrSong().audio);
    }
  }

  getCurrSong() {
    console.assert(this.currSong != null);
    return this.songs[this.currSong];
  }

  draw() {
    this.clearItems();
    for (let i = 0; i < this.songs.length; i++) {
      this.items[i]= this.createItem(i);
    }
    this.container.append(...this.items);
  }

  createItem(idx) {
    const li = document.createElement("li");
    li.classList.add("song-list__item");

    console.assert(this.currSong != null);
    if (this.currSong === idx) {
      li.classList.add("song-list__item--selected");
    }

    li.textContent = this.songs[idx].name;

    li.addEventListener("click", () => {
      console.assert(this.currSong != null);
      this.items[this.currSong].classList.remove("song-list__item--selected");

      li.classList.add("song-list__item--selected");
      setProgress(this.songs[idx].audio);

      this.currSong = idx;
    });

    return li;
  }

  clearItems() {
    for (const it of this.items) {
      it.remove();
    }
    this.items = [];
  }
}

const songList = new SongList();

const progress = {
  div: document.querySelector("#progress"),
  start: document.querySelector("#progress-start"),
  end: document.querySelector("#progress-end"),
  indicator: document.querySelector("#progress-indicator"),
  bar: document.querySelector("#progress-bar"),
  circle: document.querySelector("#progress-circle")
};

//mousedown
//mouseup
//
//mouseenter
//mouseleave
//
//mousemove
//mouseout
//
//mouseover

let dragging = false;
progress.circle.addEventListener("mousedown", e => {
  if (!dragging) dragging = true;
});

progress.div.addEventListener("mouseup", e => {
  if (dragging) dragging = false;
});

progress.div.addEventListener("mouseleave", e => {
  if (dragging) dragging = false;
});

const brect = progress.indicator.getBoundingClientRect();
progress.div.addEventListener("mousemove", e => {
  if (dragging) {
    const { clientX } = e;
    const { x, right } = brect;
    if (clientX <= x) {
      progress.bar.style.width = "0%";
    } else if (clientX >= right) {
      progress.bar.style.width = "100%";
    } else {
      let s = right - x;
      let t = clientX - x - 10;
      progress.bar.style.width = Math.floor(t / s * 100).toString() + "%";
    }
  }
});

function setProgress(audio) {
  const ct = audio.currentTime;
  let min = Math.floor(ct / 60).toString().padStart(2, "0");
  let sec = Math.floor(ct % 60).toString().padStart(2, "0");
  progress.start.textContent = `${min}:${sec}`;

  const d = audio.duration;
  min = Math.floor(d / 60).toString().padStart(2, "0");
  sec = Math.floor(d % 60).toString().padStart(2, "0");
  progress.end.textContent = `${min}:${sec}`;

  progress.bar.style.width = Math.floor((ct / d) * 100).toString() + "%";
}

document.querySelector("input[type='file']").addEventListener("change", e => {
  const { files } = e.target;
  if (!files.length) return;

  const tmp = [];
  let errcount = 0;

  for (const f of files) {
    const song = {
      name: f.name,
      audio: new Audio(URL.createObjectURL(f))
    };

    song.audio.addEventListener("canplaythrough", () => {
      tmp.push(song);

      // add songs when all of them are loaded
      if (tmp.length === files.length - errcount) {
        e.target.value = "";
        songList.addSongs(tmp);
        songList.draw();
      }
    });

    song.audio.addEventListener("error", () => {
      // @TODO(art): show error to user
      console.error(song.audio.error);
      URL.revokeObjectURL(song.audio.src);
      errcount++;
    });

    song.audio.addEventListener("timeupdate", () => {
      setProgress(song.audio);
    });
  }
});

const controls = {
  play: document.querySelector("#btn-play"),
  pause: document.querySelector("#btn-pause")
};

controls.play.addEventListener("click", () => {
  if (songList.currSong == null) return;
  songList.getCurrSong().audio.play();
  controls.play.classList.add("hidden");
  controls.pause.classList.remove("hidden");
});

controls.pause.addEventListener("click", () => {
  if (songList.currSong == null) return;
  songList.getCurrSong().audio.pause();
  controls.pause.classList.add("hidden");
  controls.play.classList.remove("hidden");
});

