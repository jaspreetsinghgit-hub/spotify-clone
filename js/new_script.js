console.log('Lets start bro');

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentSongIndex = 0;

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`)
    let response = await a.text()

    // div
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const href = as[i].href;
        if (href.endsWith(".mp3")) {
            // decode and keep the real filename (unmodified)
            let filename = decodeURIComponent(href.replaceAll("%5C", "/").split("/")[6]);
            songs.push(filename);
        }
    }
    // listing the songs in library
    // let songUL = document.querySelector(".songList ul").getElementsByTagName("ul");// simpler alternative

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) { // why for of ...as we are talking about arrrays

        const li = document.createElement("li");
        li.dataset.file = song; // store real filename
        let displayName = song.replace("(DjPunjab.Com)", "").trim();
        li.innerHTML = `<img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <small>${displayName}</small>
            </div>
            <div class="playNow">
                <small>Play Now</small>
                <img width="25" class="invert" src="img/play.svg" alt="">
            </div>`;

        // adding click feature to all 'li'
        li.addEventListener("click", () => {
            playSong(li.dataset.file);
        });
        songUL.appendChild(li);
        // we can also do by sir method
    }

    return songs; // <--- IMPORTANT: return the array so callers can await it
}

const playSong = (track, pause = false) => {
    if (!track) {
        console.log("No Song to play"); return;
    }

    // we have not chnged the filename ..so now we are encoding it so spaced + special chars work in URL
    let encodedTrack = encodeURIComponent(track);
    currentSong.src = `/${currFolder}/` + encodedTrack;
    // currentSong.load();

    // setting index safely
    currentSongIndex = songs.indexOf(track);

    // songInfo
    let displayName = track.replace("(DjPunjab.Com)", "").trim();
    document.querySelector(".songInfo").textContent = displayName;

    // songTime
    document.querySelector(".songTime").textContent = "00:00 / 00:00";

    if (!pause) {
        currentSong.play().then(() => {
            let playBtnImg = document.getElementById("play");
            playBtnImg.src = "img/pause.svg";
        }).catch(err => {
            console.error("Play attempt failed : ", err);
        });
    }
}

async function displayAlbums() {
    // fetch the directory HTML (same var name 'a' you used)
    const a = await fetch('http://127.0.0.1:3000/songs/');
    const response = await a.text(); // response is the page HTML text

    // parse HTML into a temporary div (same var 'div')
    const div = document.createElement('div');
    div.innerHTML = response;

    const anchors = div.getElementsByTagName('a');
    const cardContainer = document.querySelector('.cardContainer');

    cardContainer.innerHTML = ''; // clear old cards

    const array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        // IMPORTANT: read the raw href attribute (not e.href which gives absolute URL)
        let rawHref = e.getAttribute('href');
        if (!rawHref) continue;

        // decode percent-encoding then normalize backslashes to forward slashes
        rawHref = decodeURIComponent(rawHref);        // "%5Csongs%5CAmmy%20Songs/" -> "\songs\Ammy Songs/"
        let normalized = rawHref.replace(/\\/g, '/'); // "\ -> /"
        normalized = normalized.replace(/\/+/g, '/'); // collapse multiple slashes
        normalized = normalized.replace(/^(\.\.\/|\.\/)+/, ''); // remove leading ../ or ./
        normalized = normalized.replace(/^\/+/, ''); // remove leading slashes

        // split into parts and require the first part to be 'songs'
        const parts = normalized.split('/').filter(Boolean);
        // why this ? 
        //     But if normalized = "../"
        // then parts = []
        // parts[0] !== 'songs' ❌
        // → so it will continue (skip this link).
        if (parts[0] !== 'songs' || !parts[1]) continue;


        const folder = parts[1]; // folder name (keeps spaces)

        // fetch info.json (use encodeURIComponent for spaces and special chars)
        try {
            const a2 = await fetch(`http://127.0.0.1:3000/songs/${encodeURIComponent(folder)}/info.json`);
            if (!a2.ok) {
                console.warn('info.json not found for', folder, a2.status);
                continue;
            }
            const response2 = await a2.json(); // I used response2 so we don't redeclare `response`

            // build a card element and append (avoid innerHTML += which can clobber listeners)
            const card = document.createElement('div');
            card.className = 'card rounded';
            card.dataset.folder = folder;
            card.innerHTML = `
        <div class="cover">
          <img src="/songs/${encodeURIComponent(folder)}/cover.jpeg" alt="${response2.title || ''}">
          <div class="play">
            <svg width="35" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="green" />
              <polygon points="40,30 70,50 40,70" fill="black" />
            </svg>
          </div>
        </div>
        <h4>${response2.title || ''}</h4>
        <small>${response2.description || ''}</small>
      `;
            cardContainer.appendChild(card);

        } catch (err) {
            console.warn('Error loading info for', folder, err);
        }
    }

    // attach click listeners to cards (safe after cards are created)
    const cards = Array.from(document.getElementsByClassName('card'));
    cards.forEach(c => {
        // attach once
        if (c._listenerAttached) return;
        c.addEventListener('click', async item => {
            // use same style as your code: call getSongs then playSong
            await getSongs(`songs/${encodeURIComponent(item.currentTarget.dataset.folder)}`);
            if (Array.isArray(songs) && songs[0]) playSong(songs[0]);
        });
        c._listenerAttached = true;
    });
}
async function main() {
    // list of all songs
    await getSongs("songs/Bass")
    playSong(songs[0], true);

    let playBtn = document.getElementById("play");
    console.log("Play Button is : ", playBtn);
    if (playBtn) { // to check whether the play id is there in HTML
        playBtn.addEventListener("click", () => {
            console.log('inside the play event');
            if (currentSong.paused) {
                currentSong.play().catch(err => console.error('Play error : ', err));
                playBtn.src = "img/pause.svg";
            }
            else {
                currentSong.pause();
                playBtn.src = "img/play.svg";
            }
        });
    } else {
        console.log(`No play id in HTML`);
    }
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.key === "MediaTrackPause") {   // Detects Spacebar key
            e.preventDefault();     // Prevents page from scrolling when pressing space

            if (currentSong.paused) {
                currentSong.play().catch(err => console.error("Play error", err));
                if (playBtn) playBtn.src = "img/pause.svg";
            } else {
                currentSong.pause();
                if (playBtn) playBtn.src = "img/play.svg";
            }
        }
    });


    // time update
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = Math.floor(currentSong.currentTime);
        const duration = Math.floor(currentSong.duration);

        document.querySelector(".songTime").innerHTML = `${formatTime(currentTime)} : ${formatTime(duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // seek bar
    document.querySelector(".seekBar").addEventListener("click", e => {
        const seekBar = document.querySelector(".seekBar");
        const rect = seekBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;   // gives the differnce 
        const width = rect.width;               // gives complte length of song
        const clickPercent = clickX / width;   // same logic like in curenttime nd duration is done 

        currentSong.currentTime = clickPercent * currentSong.duration;

        // Move the circle to the clicked position
        document.querySelector(".circle").style.left = (clickPercent * 100) + "%";
    });


    const hamburger = document.getElementById("hamburger");
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            document.querySelector(".left").style.left = "0%";
        });
    }

    const sidebar = document.querySelector(".left");

    // Close sidebar if clicked outside
    if (hamburger && sidebar) {
        document.addEventListener("click", (event) => {
            // Check if the click target is outside the sidebar and hamburger
            if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                sidebar.style.left = "-100%"; // or whatever closes it
            }
        });
    }

    // cancel btn on hamburger
    const close = document.querySelector(".spotify_logo > img");
    if (close) {
        close.addEventListener("click", () => {
            document.querySelector(".left").style.left = "-100%";
        });
    }

    // previous button
    let previous = document.getElementById("previous")
    if (previous) {
        previous.addEventListener("click", () => {
            console.log('Previous clicked');
            if (!songs || songs.length === 0) return;
            if (currentSongIndex > 0) {
                currentSongIndex = Math.max(0, currentSongIndex - 1);
                playSong(songs[currentSongIndex]);
            }
        });
    }
    document.addEventListener("keydown", e => {
        if (e.key === "p" || e.key === "MediaTrackPrevious") {
            if (!songs || songs.length === 0) return;
            if (currentSongIndex > 0) {
                currentSongIndex = Math.max(0, currentSongIndex - 1);
                playSong(songs[currentSongIndex]);
            }
        }
    });

    // next button
    const next = document.getElementById("next");
    if (next) {
        next.addEventListener("click", () => {
            // console.log("Next clicked");

            if (!songs || songs.length === 0) return;
            if (currentSongIndex < songs.length - 1) {
                currentSongIndex = Math.min(songs.length - 1, currentSongIndex + 1);
                playSong(songs[currentSongIndex]);
            }
        });
    }

    document.addEventListener("keydown", e => {
        console.log(e);
        if (e.key === "n" || e.key === "MediaTrackNext") {
            if (!songs || songs.length === 0) return;
            if (currentSongIndex < songs.length - 1) {
                currentSongIndex = Math.min(songs.length - 1, currentSongIndex + 1);
                playSong(songs[currentSongIndex]);
            }
        }
    });
    // volume controls
    const volumeControl = document.getElementById("volumeControl");
    const volImg = document.getElementById("vol"); // grab the img by ID
    let lastVolume = 1;

    if (volumeControl) {
        volumeControl.addEventListener("input", () => {
            currentSong.volume = volumeControl.value; // Value between 0.0 and 1.0
            if (currentSong.volume > 0) {volImg.src = "img/volume.svg";}
            if (currentSong.volume == 0) {volImg.src = "img/volume_mute.svg";}
        });
    }

    if (volImg) {   
        volImg.addEventListener("click", () => {
            if (currentSong.volume > 0) {
                lastVolume = currentSong.volume; // save current volume
                currentSong.volume = 0;
                volumeControl.value = 0;
                volImg.src = "img/volume_mute.svg";
            } else {
                currentSong.volume = lastVolume; // restore last volume
                volumeControl.value = lastVolume;
                volImg.src = "img/volume.svg";
            }
        });
    }

    document.addEventListener("keydown", e => {
        if (e.key === "m") {
            if (currentSong.volume > 0) {
                lastVolume = currentSong.volume; // save current volume
                currentSong.volume = 0;
                volumeControl.value = 0;
                volImg.src = "img/volume_mute.svg";
            } else {
                currentSong.volume = lastVolume; // restore last volume
                volumeControl.value = lastVolume;
                volImg.src = "img/volume.svg";
            }
        }
    })

    // audio error logging to help debug missing files / 404s
    currentSong.addEventListener("error", (e) => {
        console.error("Audio error:", e, "src was:", currentSong.src);
    });

    // in the end as ...first making everything ready 
    displayAlbums();
    console.log("currentSong\n");
    console.log(currentSong);
}
main();
// document.addEventListener("DOMContentLoaded", main);


// .target - gives that elem that we have clicked
// currentTarget - this gives the main elem ...
// ex - in card ..target case - if we click on image it will give the image pic
// ...if we click on para tag then it wll give me that elem but in another case
// where ever you click on main elem ..it will give the card only ...
// nor image nor <p>..jsut the main elem