document.querySelector("input[type='file']").addEventListener("change", e => {
  const { files } = e.target;

  if (files.length) {
    for (const f of files) {
      console.log(f);
    }

    e.target.value = "";
  }
});
