/**
 *                SIMON GAME
 *           for freeCodeCamp.com
 *
 *             by yellowflash2041 - 2022
 *
 *       Simple Game using CSS3 & jQuery
 *
 * ----------------------------------------------
 *   !!! It uses the new Web Audio API !!!
 *   You Need an up-to-date browser.
 *   Tested on Firefox, Chrome, Safari
 * ----------------------------------------------
 *  !!! NOW RESPONSIVE !!!
 */

$(document).ready(() => {
  // Checking for Web Audio API on your browser ...
  const AudioContext =
    window.AudioContext || // Default
    window.webkitAudioContext || // Safari and old versions of Chrome
    false;

  if (!AudioContext) {
    // Sorry, but the game won't work for you
    alert(
      "Sorry, but the Web Audio API is not supported by your browser. Please, consider downloading the latest version of Google Chrome or Mozilla Firefox"
    );
  } else {
    // You can play the game !!!!

    // Game Setup
    const audioCtx = new AudioContext();

    const frequencies = [329.63, 261.63, 220, 164.81];

    const errOsc = audioCtx.createOscillator();
    errOsc.type = "triangle";
    errOsc.frequency.value = 110;
    errOsc.start(0.0); //delay optional parameter is mandatory on Safari
    const errNode = audioCtx.createGain();
    errOsc.connect(errNode);
    errNode.gain.value = 0;
    errNode.connect(audioCtx.destination);

    const ramp = 0.1;
    const vol = 0.5;

    const gameStatus = {};

    gameStatus.reset = function () {
      this.init();
      this.strict = false;
    };

    gameStatus.init = function () {
      this.lastPush = $("#0");
      this.sequence = [];
      this.tStepInd = 0;
      this.index = 0;
      this.count = 0;
      this.lock = false;
    };

    // create Oscillators
    const oscillators = frequencies.map(frq => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frq;
      osc.start(0.0); // delay optional parameter is mandatory on Safari
      return osc;
    });

    const gainNodes = oscillators.map(osc => {
      const g = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      g.gain.value = 0;
      return g;
    });

    const playGoodTone = num => {
      gainNodes[num].gain.linearRampToValueAtTime(
        vol,
        audioCtx.currentTime + ramp
      );
      gameStatus.currPush = $("#" + num);
      gameStatus.currPush.addClass("light");
    };

    const stopGoodTones = () => {
      if (gameStatus.currPush) gameStatus.currPush.removeClass("light");

      gainNodes.forEach(g => {
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
      });
      gameStatus.currPush = undefined;
      gameStatus.currOsc = undefined;
    };

    const playErrTone = () => {
      errNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
    };

    const stopErrTone = () => {
      errNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
    };

    const gameStart = () => {
      resetTimers();
      stopGoodTones();
      stopErrTone();
      $(".count").text("--").removeClass("led-off");
      flashMessage("--", 1);
      gameStatus.init();
      addStep();
    };

    const setTimeStep = num => {
      const tSteps = [1250, 1000, 750, 500];
      if (num < 4) {
        return tSteps[0];
      }
      if (num < 8) {
        return tSteps[1];
      }
      if (num < 12) {
        return tSteps[2];
      }
      return tSteps[3];
    };

    const notifyError = pushObj => {
      // Avoid crashing if the user holds the push pad
      stopGoodTones();

      playErrTone();
      if (pushObj) {
        pushObj.addClass("light");
      }
      gameStatus.toHndl = setTimeout(() => {
        stopErrTone();
        if (pushObj) {
          pushObj.removeClass("light");
        }
        gameStatus.toHndlSt = setTimeout(() => {
          if (gameStatus.strict) {
            gameStart();
          } else {
            playSequence();
          }
        }, 1000);
      }, 1000);
      flashMessage("!!", 2);
    };

    const notifyWin = () => {
      const cnt = 0;
      const last = gameStatus.lastPush.attr("id");
      gameStatus.seqHndl = setInterval(() => {
        playGoodTone(last);
        gameStatus.toHndl = setTimeout(stopGoodTones, 80);
        cnt++;
        if (cnt === 8) {
          clearInterval(gameStatus.seqHndl);
        }
      }, 160);
      flashMessage("**", 2);
    };

    const flashMessage = (msg, times) => {
      $(".count").text(msg);
      const lf = () => {
        $(".count").addClass("led-off");
        gameStatus.toHndlFl = setTimeout(() => {
          $(".count").removeClass("led-off");
        }, 250);
      };
      let cnt = 0;
      lf();
      gameStatus.flHndl = setInterval(() => {
        lf();
        cnt++;
        if (cnt === times) {
          clearInterval(gameStatus.flHndl);
        }
      }, 500);
    };

    const displayCount = () => {
      const p = gameStatus.count < 10 ? "0" : "";
      $(".count").text(p + (gameStatus.count + ""));
    };

    const playSequence = () => {
      stopGoodTones();

      let i = 0;
      gameStatus.index = 0;

      // store interval and timeout handlers
      // needed to hard reset / on off
      gameStatus.seqHndl = setInterval(() => {
        $(".push").removeClass("light");
        displayCount();
        gameStatus.lock = true;
        playGoodTone(gameStatus.sequence[i]);
        gameStatus.toHndl = setTimeout(
          stopGoodTones,
          gameStatus.timeStep / 2 - 10
        );
        i++;
        if (i === gameStatus.sequence.length) {
          clearInterval(gameStatus.seqHndl);
          $(".push").removeClass("unclickable").addClass("clickable");
          gameStatus.lock = false;
          gameStatus.toHndl = setTimeout(notifyError, 5 * gameStatus.timeStep);
        }
      }, gameStatus.timeStep);
    };

    const addStep = () => {
      gameStatus.timeStep = setTimeStep(gameStatus.count++);
      gameStatus.sequence.push(Math.floor(Math.random() * 4));
      gameStatus.toHndl = setTimeout(playSequence, 500);
    }

    const resetTimers = () => {
      clearInterval(gameStatus.seqHndl);
      clearInterval(gameStatus.flHndl);
      clearTimeout(gameStatus.toHndl);
      clearTimeout(gameStatus.toHndlFl);
      clearTimeout(gameStatus.toHndlSt);
    }

    const pushColor = pushObj => {
      clearTimeout(gameStatus.toHndl);
      const pushNr = pushObj.attr("id");
      if (
        pushNr == gameStatus.sequence[gameStatus.index] &&
        gameStatus.index < gameStatus.sequence.length
      ) {
        playGoodTone(pushNr);
        gameStatus.lastPush = pushObj;
        gameStatus.index++;
        if (gameStatus.index < gameStatus.sequence.length) {
          gameStatus.toHndl = setTimeout(notifyError, 5 * gameStatus.timeStep);
        } else if (gameStatus.index === 20) {
          $(".push").removeClass("clickable").addClass("unclickable");
          gameStatus.toHndl = setTimeout(notifyWin, gameStatus.timeStep);
        } else {
          $(".push").removeClass("clickable").addClass("unclickable");
          addStep();
        }
      } else {
        $(".push").removeClass("clickable").addClass("unclickable");
        notifyError(pushObj);
      }
    }

    $(".push").mousedown(() => {
      pushColor($(this));
    });

    $("*").mouseup(e => {
      e.stopPropagation();
      if (!gameStatus.lock) {
        stopGoodTones();
      }
    });

    const toggleStrict = () => {
      $("#mode-led").toggleClass("led-on");
      gameStatus.strict = !gameStatus.strict;
    }

    $(".sw-slot").click(() => {
      $("#pwr-sw").toggleClass("sw-on");
      if ($("#pwr-sw").hasClass("sw-on") === false) {
        gameStatus.reset();
        $(".count").text("--");
        $(".count").addClass("led-off");
        $("#mode-led").removeClass("led-on");
        $(".push").removeClass("clickable").addClass("unclickable");
        $("#start").off("click");
        $("#mode").off("click");
        $(".btn").removeClass("unclickable").addClass("clickable");
        resetTimers();
        stopGoodTones();
        stopErrTone();
      } else {
        $(".btn").removeClass("unclickable").addClass("clickable");
        $(".count").removeClass("led-off");
        $("#start").click(gameStart);
        $("#mode").click(toggleStrict);
      }
    });

    gameStatus.reset();
  }
});
