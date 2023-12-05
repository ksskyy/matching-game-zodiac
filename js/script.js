const startGameBtn = document.getElementById("game-start");
const pauseGameBtn = document.getElementById("pause");
const stopGameBtn = document.getElementById("stop");
const className = "back";
const classNameFront = "front";
const zodiacImgs = "json/images.json";
const cards = document.getElementById("cards-container");
const musicOn = document.getElementById("on");
const musicOff = document.getElementById("off");

let flippedCards = [];
let timer;
let timeLeft = 60;
let flips = 0;
let matches = 0;
let matchCards = 0;
let activeTurn = false;
let animationRunning = false;
let canFlip = true;
let stopDiv = null;
let pauseDiv = null;
let isMusicOn = true;

class gameAudios {
  constructor() {
    this.bgMusic = new Audio("/audio/BGM.mp3");
    this.bgMusic.volume = 0.3;
    this.matchSound = new Audio("/audio/match.wav");
    this.matchSound.volume = 0.6;
    this.noMatchSound = new Audio("/audio/nomatch.mp3");
    this.flipSound = new Audio("/audio/click.wav");
    this.winSound = new Audio("/audio/win.wav");
    this.loseSound = new Audio("/audio/lose.wav");
  }
  start() {
    this.bgMusic.play();
  }
  stop() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }
  pause() {
    this.bgMusic.pause();
  }
  match() {
    this.matchSound.play();
  }
  nomatch() {
    this.noMatchSound.play();
  }
  flip() {
    this.flipSound.play();
  }
  win() {
    this.stop();
    this.winSound.play();
  }
  lose() {
    this.stop();
    this.loseSound.play();
  }
}

const gameMusic = new gameAudios();

startGameBtn.addEventListener("click", function () {
  startGame();
  startGameBtn.style.display = "none";
});

pauseGameBtn.addEventListener("click", function () {
  gameMusic.pause();
  pauseGame();
  pauseGameBtn.classList.toggle("clickBackground");
});

stopGameBtn.addEventListener("click", function () {
  gameMusic.stop();
  stopGame();
  stopGameBtn.classList.toggle("clickBackground");
});

musicOn.addEventListener("click", function () {
  isMusicOn = true;
  gameMusic.start();
  musicOn.classList.toggle("clickBackground");
  musicOff.classList.remove("clickBackground");
});

musicOff.addEventListener("click", function () {
  isMusicOn = false;
  gameMusic.stop();
  musicOff.classList.toggle("clickBackground");
  musicOn.classList.remove("clickBackground");
});

function startGame() {
  cards.innerHTML = "";
  matches = 0;
  flippedCards = [];
  timeLeft = 60;
  flips = 0;
  matchCards = 0;
  isMusicOn = true;

  const timerSpan = document.querySelector(".timer span");
  timerSpan.textContent = timeLeft;

  timer = setInterval(updateTimer, 1000);
  document.getElementById("flips").textContent = "0";

  const matchCardsDisplay = document.getElementById("match-cards");
  matchCardsDisplay.textContent = matchCards;

  gameMusic.start();

  if (isMusicOn) {
    musicOn.classList.add("clickBackground");
    musicOff.classList.remove("clickBackground");
  }

  fetch(zodiacImgs)
    .then(function (res) {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Network response was not ok");
    })
    .then(function (data) {
      // console.log(data);
      // console.log(data.images.frontImage);
      // console.log(data.images.zodiacs);

      const backgroundImgs = data.images.backgroundImage;
      const bGImg = backgroundImgs.map((img) => ({
        src: img.src,
        alt: img.alt,
      }));
      const finalBGImgs = shuffleArray(bGImg);

      const frontImg = data.images.frontImage;
      const duplicatedFrontImages = [...frontImg, ...frontImg, ...frontImg];
      const finalFrontImgs = shuffleArray(duplicatedFrontImages);

      const selectedImages = displayRandomImages(data.images.zodiacs);
      const duplicatedImages = [...selectedImages, ...selectedImages];
      const duplicatedImage = shuffleArray(duplicatedImages);
      const finalImgs = shuffleArray(duplicatedImage);
      // console.log(finalImgs);

      makeCardSet(
        finalBGImgs,
        finalFrontImgs,
        finalImgs,
        cards,
        classNameFront,
        className
      );
    })

    .catch(function (error) {
      cards.innerHTML = `<p>${error}. Please try again.</p>`;
    });
}

function displayRandomImages(arr, num) {
  const shuffledImgs = shuffleArray(arr);
  return shuffledImgs.slice(0, 6);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function makeCardSet(
  backgroundImg,
  frontImgs,
  backImgs,
  container,
  classNameFront,
  className
) {
  document.body.style.backgroundImage = `url(${backgroundImg[0].src})`;

  const shuffledBackImgs = shuffleArray(backImgs);

  for (let i = 0; i < frontImgs.length; i++) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const frontDiv = document.createElement("div");
    frontDiv.className = classNameFront;
    const imgFront = document.createElement("img");
    imgFront.src = frontImgs[i].src;
    imgFront.alt = frontImgs[i].alt;
    frontDiv.appendChild(imgFront);

    const backDiv = document.createElement("div");
    backDiv.className = className;
    const imgBack = document.createElement("img");
    imgBack.src = shuffledBackImgs[i].src;
    imgBack.alt = shuffledBackImgs[i].alt;
    backDiv.appendChild(imgBack);

    cardDiv.appendChild(frontDiv);
    cardDiv.appendChild(backDiv);
    container.appendChild(cardDiv);

    cardDiv.addEventListener("click", () => {
      checkMatch(cardDiv);
    });
  }
}

function checkMatch(cardDiv) {
  if (activeTurn === true) {
    return;
  }

  if (flippedCards.includes(cardDiv) || !canFlip) {
    return;
  }
  if (flippedCards.length < 2 && !cardDiv.classList.contains("animating")) {
    canFlip = false;
    cardDiv.classList.toggle("is-flipped");
    cardDiv.classList.add("animating");
    cardDiv.querySelector(".front").addEventListener(
      "transitionend",
      function () {
        cardDiv.classList.remove("animating");
        canFlip = true;
      },
      { once: true }
    );
    animationRunning = true;
    flippedCards.push(cardDiv);
  }

  if (flippedCards.length === 2) {
    activeTurn = true;
    const firstCard = flippedCards[0];
    const secondCard = flippedCards[1];

    const firstCardSrc = firstCard.querySelector(".back img").src;
    const secondCardSrc = secondCard.querySelector(".back img").src;

    if (firstCardSrc === secondCardSrc) {
      // console.log("firstcard: ", firstCardSrc);
      // console.log("secondcard: ", secondCardSrc);
      gameMusic.match();
      flippedCards.forEach((card) => {
        card.style.pointerEvents = "none";
      });
      flippedCards = [];
      matches++;
      matchCards++;
      document.getElementById("match-cards").textContent = matchCards;
      // console.log("matches:", matches);
      activeTurn = false;

      if (matches === 6) {
        // console.log("Win condition reached: matches === 6");
        clearInterval(timer);
        const winMessage = document.createElement("div");
        const message = document.createElement("h2");
        const playAgainYes = document.createElement("div");
        const playAgainNo = document.createElement("div");

        winMessage.classList.add("game-win");
        message.classList.add("message");
        playAgainYes.classList.add("yes");
        playAgainNo.classList.add("no");

        playAgainYes.textContent = "Yes";
        playAgainNo.textContent = "No";
        message.textContent = "Congratulations!!\nPlay Again?";

        winMessage.appendChild(message);
        winMessage.appendChild(playAgainYes);
        winMessage.appendChild(playAgainNo);
        cards.appendChild(winMessage);

        playAgainYes.addEventListener("click", () => {
          winMessage.style.display = "none";
          gameMusic.stop();
          startGame();
        });
        playAgainNo.addEventListener("click", () => {
          winMessage.style.display = "none";
          startGameBtn.style.display = "flex";
          gameMusic.stop();
        });
        gameMusic.win();
      }
    } else {
      setTimeout(() => {
        firstCard.classList.remove("is-flipped");
        secondCard.classList.remove("is-flipped");

        // Attach the event listener with the 'once' option
        firstCard.querySelector(".front").addEventListener(
          "transitionend",
          function () {
            flippedCards = [];
            activeTurn = false;
          },
          { once: true }
        );
      }, 1000);
      updateTimer();
      gameMusic.nomatch();
    }
  }
  //calculate flips
  flips++;
  gameMusic.flip();
  const moveCount = document.getElementById("flips");
  moveCount.textContent = flips;
}

function updateTimer() {
  timeLeft--;
  const timerSpan = document.querySelector(".countdown");
  timerSpan.textContent = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timer);
    const loseMessage = document.createElement("div");
    const lMessage = document.createElement("h2");
    const playAgainYes = document.createElement("div");
    const playAgainNo = document.createElement("div");

    loseMessage.classList.add("game-lose");
    lMessage.classList.add("message");
    playAgainYes.classList.add("yes");
    playAgainNo.classList.add("no");

    playAgainYes.textContent = "Yes";
    playAgainNo.textContent = "No";
    lMessage.textContent = "Game Over!!!\n Play Again?";

    loseMessage.appendChild(lMessage);
    loseMessage.appendChild(playAgainYes);
    loseMessage.appendChild(playAgainNo);
    cards.appendChild(loseMessage);

    playAgainYes.addEventListener("click", () => {
      loseMessage.style.display = "none";
      clearInterval(timer);
      gameMusic.stop();
      startGame();
    });
    playAgainNo.addEventListener("click", () => {
      loseMessage.style.display = "none";
      startGameBtn.style.display = "flex";
      clearInterval(timer);
      gameMusic.stop();
    });
    gameMusic.lose();
  }
}

function stopGame() {
  const stopDiv = document.createElement("div");
  stopDiv.classList.add("stop-game");
  cards.appendChild(stopDiv);

  const confirmMessage = document.createElement("h2");
  const confirmYes = document.createElement("div");
  const confirmNo = document.createElement("div");

  confirmMessage.classList.add("message");
  confirmYes.classList.add("yes");
  confirmNo.classList.add("no");

  confirmYes.textContent = "Yes";
  confirmNo.textContent = "No";
  confirmMessage.textContent = "Do you want to quit?";

  stopDiv.appendChild(confirmMessage);
  stopDiv.appendChild(confirmYes);
  stopDiv.appendChild(confirmNo);

  confirmYes.addEventListener("click", () => {
    stopDiv.style.display = "none";
    stopGameBtn.classList.remove("clickBackground");
    startGameBtn.style.display = "flex";
  });
  confirmNo.addEventListener("click", () => {
    stopDiv.style.display = "none";
    timer = setInterval(updateTimer, 1000);
    if (isMusicOn) {
      gameMusic.start();
    }
    stopGameBtn.classList.remove("clickBackground");
  });

  clearInterval(timer);
  gameMusic.stop();
}
function pauseGame() {
  const pauseDiv = document.createElement("div");
  pauseDiv.classList.add("pause-game");
  cards.appendChild(pauseDiv);
  const pauseMessage = document.createElement("h2");
  const backToGame = document.createElement("div");

  pauseMessage.classList.add("message");
  backToGame.classList.add("back-game");

  pauseMessage.textContent = "Pause";
  backToGame.textContent = "Back to Game";

  pauseDiv.appendChild(pauseMessage);
  pauseDiv.appendChild(backToGame);

  backToGame.addEventListener("click", () => {
    pauseDiv.style.display = "none";
    if (isMusicOn) {
      gameMusic.start();
    }
    timer = setInterval(updateTimer, 1000);
    pauseGameBtn.classList.remove("clickBackground");
  });

  clearInterval(timer);
  gameMusic.pause();
}
