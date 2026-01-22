console.log('Lets start bro');

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

let currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentSongIndex = 0;

// ---------------------------
// getSongs: fetches folder listing & returns the songs array
// ---------------------------
async function getSongs(folder) {
    currFolder = folder;
    const a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    const response = await a.text();

    // parse returned HTML
    const div = document.createElement("div");
    div.innerHTML = response;
    const as = div.getElementsByTagName("a");

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const href = as[i].href;
        if (href.endsWith(".mp3")) {
            // decode and keep the real filename (unmodified)
            const filename = decodeURIComponent(href.split(`/${folder}/`)[1]);
            songs.push(filename);
        }
    }

    // build list in DOM
    const songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        const li = document.createElement("li");
        li.dataset.file = song; // store real filename
        const displayName = song.replace("(DjPunjab.Com)", "").trim();
        li.innerHTML = `
            <img class="invert" src="music.svg" alt="">
            <div class="info"><small>${displayName}</small></div>
            <div class="playNow"><small>Play Now</small>
              <img width="25" class="invert" src="play.svg" alt="">
            </div>
        `;

        // ✅ add click event for each li
        li.addEventListener("click", () => {
            playSong(li.dataset.file);
        });

        // ✅ append li inside the loop
        songUL.appendChild(li);
    }

    return songs; // <--- return so main() can await it
}

// ---------------------------
// playSong: loads a track (encoded) and optionally auto-plays
// ---------------------------
const playSong = (track, pause = false) => {
    if (!track) {
        console.warn("playSong called with empty track");
        return;
    }

    // encode the filename so spaces + special chars work in URL
    const encodedTrack = encodeURIComponent(track);
    currentSong.src = `/${currFolder}/` + encodedTrack;
    currentSong.load();

    // set index safely
    currentSongIndex = songs.indexOf(track);
    if (currentSongIndex === -1) {
        // fallback: try to find case-insensitively or partial match
        const found = songs.findIndex(s => s.toLowerCase().includes(track.toLowerCase()));
        if (found >= 0) currentSongIndex = found;
    }

    // update UI text
    const displayName = track.replace("(DjPunjab.Com)", "").trim();
    const infoEl = document.querySelector(".songInfo");
    if (infoEl) infoEl.textContent = displayName;

    const timeEl = document.querySelector(".songTime");
    if (timeEl) timeEl.textContent = "00:00 / 00:00";

    if (!pause) {
        currentSong.play().then(() => {
            const playBtnImg = document.getElementById("play");
            if (playBtnImg) playBtnImg.src = "pause.svg";
        }).catch(err => {
            console.error("Play attempt failed:", err, "src:", currentSong.src);
        });
    } else {
        // keep paused but update icon to 'play' so user knows it's not playing
        const playBtnImg = document.getElementById("play");
        if (playBtnImg) playBtnImg.src = "play.svg";
    }

    console.log("Loaded track:", track, " index:", currentSongIndex, " src:", currentSong.src);
};

// ---------------------------
// displayAlbums (slightly hardened)
// ---------------------------
async function displayAlbums() {
    const a = await fetch(`http://127.0.0.1:3000/songs/`);
    const response = await a.text();
    const div = document.createElement("div");
    div.innerHTML = response;
    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");

    // build cards programmatically (avoid innerHTML concatenation pitfalls)
    const array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/")[4];
            try {
                let a2 = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
                let meta = await a2.json();
                const card = document.createElement("div");
                card.className = "card rounded";
                card.dataset.folder = folder;
                card.innerHTML = `
          <div class="play">
            <svg width="35" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="green" />
              <polygon points="40,30 70,50 40,70" fill="black" />
            </svg>
          </div>
          <img src="/songs/${folder}/cover.jpeg" alt="${meta.title}">
          <h4>${meta.title}</h4>
          <small>${meta.description}</small>
        `;
                cardContainer.appendChild(card);
            } catch (err) {
                console.warn("Could not fetch info.json for folder", folder, err);
            }
        }
    }

    // attach click listeners to cards (delegate would be nicer, but keep it simple)
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            // load the playlist for clicked card (getSongs returns songs and also sets global songs)
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            // optionally, load first track but don't autoplay:
            playSong(songs[0], true);
        });
    });
}

// ---------------------------
// main: wire all controls (with guards + logging)
// ---------------------------
async function main() {
    // load initial folder (no autoplay) - you can change to auto-load by removing comment
    await getSongs("songs/ncs");
    playSong(songs[0], true);

    // play button
    const playBtn = document.getElementById("play");
    console.log("Play Button is : ", playBtn);
    if (playBtn) {
        play.addEventListener("click", () => {
            // console.log('inside the play event - src:', currentSong.src);
            // if no track loaded yet, load first song
            if (!currentSong.src || currentSong.src === "") {
                if (songs && songs.length) {
                    playSong(songs[0]);
                    return;
                } else {
                    console.warn("No songs available to play.");
                    return;
                }
            }

            if (currentSong.paused) {
                currentSong.play().catch(err => console.error("Play error:", err));
                playBtn.src = "pause.svg";
            } else {
                currentSong.pause();
                playBtn.src = "play.svg";
            }
        });
    } else {
        console.warn("#play element not found");
    }

    // spacebar toggles playback
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            if (!currentSong.src || currentSong.src === "") return;
            if (currentSong.paused) {
                currentSong.play().catch(err => console.error("Play error:", err));
                if (playBtn) playBtn.src = "pause.svg";
            } else {
                currentSong.pause();
                playBtn.src = "play.svg";
            }
        }
    });

    // timeupdate (safe guards)
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = Math.floor(currentSong.currentTime || 0);
        const duration = Math.floor(currentSong.duration || 0);
        const timeEl = document.querySelector(".songTime");
        if (timeEl) {
            timeEl.innerHTML = `${formatTime(currentTime)} : ${isFinite(duration) && duration > 0 ? formatTime(duration) : "00:00"}`;
        }

        if (isFinite(currentSong.duration) && currentSong.duration > 0) {
            const percent = (currentSong.currentTime / currentSong.duration) * 100;
            const circle = document.querySelector(".circle");
            if (circle) circle.style.left = percent + "%";
        }
    });

    // seekbar click
    const seekBar = document.querySelector(".seekBar");
    if (seekBar) {
        seekBar.addEventListener("click", e => {
            if (!isFinite(currentSong.duration) || currentSong.duration === 0) return;
            const rect = seekBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const clickPercent = clickX / width;
            currentSong.currentTime = clickPercent * currentSong.duration;
            const circle = document.querySelector(".circle");
            if (circle) circle.style.left = (clickPercent * 100) + "%";
        });
    }

    // hamburger / sidebar behaviour (unchanged logic but keep it guarded)
    const hamburger = document.getElementById("hamburger");
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            const left = document.querySelector(".left");
            if (left) left.style.left = "0%";
        });
    }
    const sidebar = document.querySelector(".left");
    if (sidebar && hamburger) {
        document.addEventListener("click", (event) => {
            if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                sidebar.style.left = "-100%";
            }
        });
    }
    const close = document.querySelector(".spotify_logo > img");
    if (close) close.addEventListener("click", () => {
        const left = document.querySelector(".left");
        if (left) left.style.left = "-100%";
    });

    // previous / next using currentSongIndex (safer)
    const previous = document.getElementById("previous");
    if (previous) {
        previous.addEventListener("click", () => {
            console.log('Previous clicked, current index:', currentSongIndex);
            if (!songs || songs.length === 0) return;
            if (currentSongIndex > 0) {
                currentSongIndex = Math.max(0, currentSongIndex - 1);
                playSong(songs[currentSongIndex]);
            } else {
                console.log("Already at first song");
            }
        });
    }

    const next = document.getElementById("next");
    if (next) {
        next.addEventListener("click", () => {
            console.log('Next clicked, current index:', currentSongIndex);
            if (!songs || songs.length === 0) return;
            if (currentSongIndex < songs.length - 1) {
                currentSongIndex = Math.min(songs.length - 1, currentSongIndex + 1);
                playSong(songs[currentSongIndex]);
            } else {
                console.log("Already at last song");
            }
        });
    }

    // volume controls
    const volumeControl = document.getElementById("volumeControl");
    const volImg = document.getElementById("vol");
    let lastVolume = 1;
    if (volumeControl) {
        if (!volumeControl.value) volumeControl.value = 1;
        currentSong.volume = Number(volumeControl.value);
        volumeControl.addEventListener("input", () => {
            currentSong.volume = Number(volumeControl.value);
        });
    }
    if (volImg) {
        volImg.addEventListener("click", () => {
            const curVol = Number(currentSong.volume || 0);
            if (curVol > 0) {
                lastVolume = curVol;
                currentSong.volume = 0;
                if (volumeControl) volumeControl.value = 0;
                volImg.src = "volume_mute.svg";
            } else {
                currentSong.volume = lastVolume || 1;
                if (volumeControl) volumeControl.value = lastVolume || 1;
                volImg.src = "volume.svg";
            }
        });
    }

    // audio error logging to help debug missing files / 404s
    currentSong.addEventListener("error", (e) => {
        console.error("Audio error:", e, "src was:", currentSong.src);
    });

    // loadedmetadata to update duration display when available
    currentSong.addEventListener("loadedmetadata", () => {
        const duration = Math.floor(currentSong.duration || 0);
        const timeEl = document.querySelector(".songTime");
        if (timeEl) {
            const cur = Math.floor(currentSong.currentTime || 0);
            timeEl.textContent = `${formatTime(cur)} : ${formatTime(duration)}`;
        }
    });

    // done
    displayAlbums();
}

main();
