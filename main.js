//const btnPrefix = "btn";
//const btns = ["play"];
//
//const buttons = {};
//
//for (const btn of btns) {
//  const id = `#${btnPrefix}-${btn}`;
//  const elem = document.querySelector(id);
//  if (!elem) {
//    throw new Error("button not found in DOM: " + id);
//  }
//  buttons[btn] = elem;
//}

let uid = 0;

let songs = [];
const songList = document.querySelector("#song-list");

document.querySelector("input[type='file'").addEventListener("change", e => {
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

      if (tmp.length === files.length - errcount) {
        songs.push(...tmp);
        makeSongList();
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
  clearChildren(songList);

  const lis = [];
  for (const s of songs) {
    const li = document.createElement("li");
    li.textContent = `${s.name} ${s.audio.duration}`;

    li.addEventListener("click", () => {
      URL.revokeObjectURL(s.audio.src);
      songs = songs.filter(item => item.id !== s.id);
      li.remove();
    });

    lis.push(li);
  }
  songList.append(...lis);
}

function clearChildren(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
