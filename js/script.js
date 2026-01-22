console.log('Lets start bro');

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`)
    let response = await a.text()

    // div
    let div = document.createElement("div");
    div.innerHTML = response;

    // a's
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i]; // *
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1].replaceAll("%20", " ")); // split will divide two array from songs 
            // ...and we are taking the array which is second one i.e. arr[1] .. for more see the video from 49
        }
    }
    // listing the songs in library
    // let songUL = document.querySelector(".songList ul").getElementsByTagName("ul");// simpler alternative

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) { // why for of ...as we are talking about arrrays

        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="music.svg" alt="">
            <div class="info">
                <small>${song.replace("(DjPunjab.Com)", "")}</small>
            </div>
            <div class="playNow">
                <small>Play Now</small>
                <img width="25" class="invert" src="play.svg" alt="">
            </div> </li>`;
    }

    // for playing song
    (document.querySelectorAll(".songList ul li")).forEach(e => {
        e.addEventListener("click", () => {
            // console.log(e.querySelector(".info small").innerHTML);
            playSong(e.querySelector(".info small").innerHTML);
        })
    });
}
let currentSong = new Audio();
let songs;
let currFolder;

// const playSong = (track, pause = false) => {
//     // let audio = new Audio("/songs/" + track);
//     currentSong.src = `/${currFolder}/` + track;
//     if (!pause) {
//         currentSong.play();
//         play.src = "pause.svg";
//     }
//     document.querySelector(".songInfo").innerHTML = track;
//     document.querySelector(".songTime").innerHTML = "00:00 / 00:00";

// }
const playSong = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        const playBtnImg = document.getElementById("play");   // <-- always get the img
        if (playBtnImg) playBtnImg.src = "pause.svg";
    }
    document.querySelector(".songInfo").innerHTML = track;
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
};

let currentSongIndex = 0; // *

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`)
    let response = await a.text();

    // div
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer")
    // Array.from(anchors).forEach(async e => {// as we are using async funciton thats why its running in the backgorund and when we click on any card...it doesnt show any list of songs on left
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/")[4];
            // Get the metadata of the folder
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();
            // console.log(response);
            cardContainer.innerHTML += `<div data-folder="${folder}" class="card rounded">
            <div class="play">
                <svg width="35" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="green" />
                    <polygon points="40,30 70,50 40,70" fill="black" />
                </svg>
                </div>
            <img src="/songs/${folder}/cover.jpeg" alt="Karan Aujla Ikky">
            <h4>${response.title}</h4>
            <small>${response.description}</small>
            </div>`
        }
    }
    // loading the playlist whereever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => { // why arr.form ...as this will give me the collection of cards ...and why forEach? ...see above line 
        // console.log(e);
        e.addEventListener("click", async item => { // async - because of await in getSongs
            // console.log(item, item.currentTarget.dataset.folder);
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
        });
    });
    // console.log(div);
    // console.log(anchors);
}

async function main() {
    // list of all songs
    await getSongs("songs/cs");
    playSong(songs[0], true);

    displayAlbums();

    // adding event listener to play, previous, next
    // we can access id easily
    let play = document.getElementById("play");
    console.log("Play Button is : ", play);
    play.addEventListener("click", () => {
        console.log('inside the play event');
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {   // Detects Spacebar key
            e.preventDefault();     // Prevents page from scrolling when pressing space

            if (currentSong.paused) {
                currentSong.play();
                play.src = "pause.svg";
            } else {
                currentSong.pause();
                play.src = "play.svg";
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
    hamburger.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });

    const sidebar = document.querySelector(".left");

    // Close sidebar if clicked outside
    document.addEventListener("click", (event) => {
        // Check if the click target is outside the sidebar and hamburger
        if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
            sidebar.style.left = "-100%"; // or whatever closes it
        }
    });

    const close = document.querySelector(".spotify_logo > img");
    close.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // previous button
    let previous = document.getElementById("previous")
    previous.addEventListener("click", () => {
        console.log('Previous clicked');
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        // console.log(index);
        if ((index - 1) >= 0) {
            playSong(songs[index - 1]);
        }
    });

    // next button
    const next = document.getElementById("next");
    next.addEventListener("click", () => {
        // console.log("Next clicked");

        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        if ((index + 1) < songs.length) {
            playSong(songs[index + 1])
        }
    });



    //                                                  ChatGpt
    // Next song
    // next.addEventListener("click", () => {
    //     currentSongIndex = (currentSongIndex + 1) % songs.length;
    //     playSong(songs[currentSongIndex]);
    // });

    // // Previous song
    // previous.addEventListener("click", () => {
    //     currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    //     playSong(songs[currentSongIndex]);
    // });


    // let volumeControl = document.getElementById("volumeControl");
    // let vol = document.getElementById('vol');

    // volumeControl.addEventListener("input", () => {
    //     currentSong.volume = volumeControl.value; // Value between 0.0 and 1.0
    // });
    // const volumeIcon = document.querySelector(".volume img");
    // let lastVolume = 1;

    // volumeIcon.addEventListener("click", () => {
    //     console.log('clocke');
    //     if (currentSong.volume > 0) {
    //         lastVolume = currentSong.volume; // save current volume
    //         currentSong.volume = 0;
    //         volumeControl.value = 0;
    //         vol.src = "volume_mute.svg"
    //     } else {
    //         currentSong.volume = lastVolume; // restore last volume
    //         volumeControl.value = lastVolume;
    //         vol.src = "volume.svg"
    //     }
    // });
    let volumeControl = document.getElementById("volumeControl");
    let vol = document.getElementById("vol"); // grab the img by ID
    let lastVolume = 1;

    volumeControl.addEventListener("input", () => {
        currentSong.volume = volumeControl.value; // Value between 0.0 and 1.0
    });

    vol.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            lastVolume = currentSong.volume; // save current volume
            currentSong.volume = 0;
            volumeControl.value = 0;
            vol.src = "volume_mute.svg";
        } else {
            currentSong.volume = lastVolume; // restore last volume
            volumeControl.value = lastVolume;
            vol.src = "volume.svg";
        }
    });


    // for playing song
    (document.querySelectorAll(".songList ul li")).forEach(e => {
        e.addEventListener("click", () => {
            // console.log(e.querySelector(".info small").innerHTML);
            playSong(e.querySelector(".info small").innerHTML);
        })
    });
    currentSong.addEventListener("error", (e) => {
        console.error("Audio error:", e, "src was:", currentSong.src);
    });

    console.log("Trying to play:", currentSong.src);
}
main();
// document.addEventListener("DOMContentLoaded", main);


// .target - gives that elem that we have clicked
// currentTarget - this gives the main elem ...
// ex - in card ..target case - if we click on image it will give the image pic
// ...if we click on para tag then it wll give me that elem but in another case
// where ever you click on main elem ..it will give the card only ...
// nor image nor <p>..jsut the main elem