// CLEAN UP: do I need terminateCurrTime function? Each time I press play,
// I'm adding a new timer... I think.

// Note to self: timer circle border should be in canvas instead. This'll
// allow me to draw a partial circle animation
// on top of regular canvas. Otherwise, I'd have to sync up CSS styling and
// canvas rules. which is ugh.


const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const ALMOST_ONE_SECOND = 999;
const ONE_SECOND = 1000;
const TENTH_OF_A_SECOND = 100;
const REFRESH_RATE = TENTH_OF_A_SECOND;

const REGULAR = 1;
const WORKOUT = 2;

let currTimer = null;
let currMode = REGULAR;

function toMilliseconds(hours, minutes, seconds) {
    const totalMinutes = (hours * MINUTES_PER_HOUR) + minutes;
    const totalSeconds = (totalMinutes * SECONDS_PER_MINUTE) + seconds;
    return totalSeconds * MILLISECONDS_PER_SECOND;
}

function playNotification() {
    document.getElementById('loop-alarm').play();
}

function stopNotification() {
    document.getElementById('loop-alarm').pause();
}

// question: is this how to set a default parameter?
function padWithZeros(num, width = 2) {
    let result = num.toString();
    while (result.length < width) {
        result = `0${result}`;
    }
    return result;
}

function terminateCurrTimer() {
    currTimer.stop();
    currTimer = null;
}

function showCheckmark() {
    document.querySelector("#checkmark-control").style.display = 'block';
}

function hideCheckmark() {
    document.querySelector("#checkmark-control").style.display = 'none';
}

function showMediaControls() {
    document.querySelector('#media-controls').style.display = 'block';
}

function hideMediaControls() {
    document.querySelector('#media-controls').style.display = 'none';
}

function buildObserver(countdown) {
    return new Observer(countdown);
}

class Observer {
    constructor(countdown) {
        this.countdown = countdown;

        // represents intervals set by displayTime and displayAnimation
        this.presenter = null;
        this.animator = null;
    }

    clear() {
        clearInterval(this.presenter);
        clearInterval(this.animator);
    }

    run() {
        this.presenter = setInterval(displayTime, TENTH_OF_A_SECOND, 
            this.countdown);
        this.animator = setInterval(displayAnimation, TENTH_OF_A_SECOND / 10, 
            this.countdown);
    }
}

/*
note constructor does not start timer, you must explictily call the play method

@param Object Duration - object containing hours, minutes and seconds properties
@param Function whatToDoNext - instructions to execute on hitting zero
@param Function observer - callback to push info to for display purposes
*/
class CountdownTimer {
    constructor(duration, whatToDoNext, buildObserver) {
        this.duration = toMilliseconds(duration.hours,
            duration.minutes,
            duration.seconds);
        this.timeLeft = this.duration;

        // onTimeUp defaults to playNotification
        this.onTimeUp = whatToDoNext || playNotification;
        this.prevTime = Date.now();

        let self = this;
        this.observer = buildObserver(self);
    }

    play() {
        // countdown behavior
        clearInterval(this.tracker);
        this.prevTime = Date.now();
        this.tracker = setInterval(() => this.countdown(), REFRESH_RATE);

        // restart observer
        this.observer.clear();
        this.observer.run();
    }

    pause() {
        clearInterval(this.tracker);
    }

    stop() {
        // countdown behavior
        clearInterval(this.tracker);
        this.timeLeft = this.duration;

        // stop observer
        this.observer.clear();
    }

    // call Date.now() to get millseconds elapsed since startpoint
    countdown() {
        // calculate time elapsed
        const elapsed = Date.now() - this.prevTime;
        this.prevTime = Date.now();
        this.timeLeft -= elapsed;

        // terminate when time runs out
        if (this.timeLeft < 0) {
            this.stop();
            this.onTimeUp();
        }
    }

    getTimeLeft() {
        return this.timeLeft;
    }

    getDuration() {
        return this.duration;
    }
}

class AlternatingIntervals {
    constructor(workout, rest, repetitions, doThisOnSwitch) {
        this.doThisOnSwitch = doThisOnSwitch;
        this.workoutTimer = new CountdownTimer(workout, () => this.switch());
        this.restTimer = new CountdownTimer(rest, () => this.switch());
        this.repetitions = repetitions;

        this.currTimer = this.workoutTimer;
    }

    play() {
        this.currTimer.play();
    }

    pause() {
        this.currTimer.pause();
    }

    stop() {
        this.currTimer.stop();
    }

    switch() {
        if (this.doThisOnSwitch) {
            this.doThisOnSwitch();
        }

        if (this.currTimer === this.workoutTimer) {
            this.restTimer.play();
            this.currTimer = this.restTimer;
        } else if (this.repetitions > 0) {
            this.workoutTimer.play();
            this.currTimer = this.workoutTimer;
            this.repetitions -= 1;
        } else {
            this.stop();
        }
    }
}

// style debug: circular dependency. startNewTimer calls CountdownTimer,
// but CountdownTimer calls startNewTimer
// no-use-before-define
function startNewTimer(mode) {
    let newTimer;

    const hoursWork = document.querySelector('#hours-work').value;
    const minutesWork = document.querySelector('#minutes-work').value;
    const secondsWork = document.querySelector('#seconds-work').value;
    const timeEntry = {
        hours: parseInt(hoursWork, 10) || 0,
        minutes: parseInt(minutesWork, 10) || 0,
        seconds: parseInt(secondsWork, 10) || 0,
    };  

    const hoursBreak = document.querySelector('#hours-break').value;
    const minutesBreak = document.querySelector('#minutes-break').value;
    const secondsBreak = document.querySelector('#seconds-break').value;
    const breakEntry = {
        hours: parseInt(hoursBreak, 10) || 0,
        minutes: parseInt(minutesBreak, 10) || 0,
        seconds: parseInt(secondsBreak, 10) || 0,
    };

    if (mode === REGULAR) {
        newTimer = new CountdownTimer(timeEntry, () => {
            playNotification();
            hideMediaControls();
            showCheckmark();
            terminateCurrTimer();
            notifyMe();
        }, buildObserver);
    } else if (mode === WORKOUT) {
        const repetitions = parseInt(
            document.querySelector('#repetitions-entry').value, 10) || 0;
        newTimer = new AlternatingIntervals(timeEntry, breakEntry, repetitions);
    }
    return newTimer;
}

/*
modifies DOM to reflect time left in current timer

@param Countdown countdown - this observer function pulls info from countdown
*/
function displayTime(countdown) {

    // add one second buffer for display purposes
    let timeLeft = countdown.getTimeLeft();
    timeLeft += ALMOST_ONE_SECOND;

    // convert to hours:minutes:seconds format
    const seconds = Math.floor(timeLeft /
        MILLISECONDS_PER_SECOND) % SECONDS_PER_MINUTE;
    const minutes = Math.floor(timeLeft /
        (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE)) % MINUTES_PER_HOUR;
    const hours = Math.floor(timeLeft /
        (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR));

    // update timer elements
    document.querySelector('#hours').placeholder = padWithZeros(hours, 2);
    document.querySelector('#minutes').placeholder = padWithZeros(minutes, 2);
    document.querySelector('#seconds').placeholder = padWithZeros(seconds, 2);
}

/*
animation is analogous to a second hand going round a clock

@param Countdown countdown - this observer function pulls info from countdown
*/
function displayAnimation(countdown) {

    let timeLeft = countdown.getTimeLeft();
    const seconds = (timeLeft / MILLISECONDS_PER_SECOND) % SECONDS_PER_MINUTE;

    // draws partial circle based on seconds left in current minute 
    const cx = document.querySelector('#circle-overlay').getContext('2d');
    const QUARTER_CIRCLE = Math.PI / 2;
    cx.clearRect(0, 0, 500, 500);
    cx.beginPath();
    cx.arc(250, 250, 240, 0 - QUARTER_CIRCLE, 2 * Math.PI * ((SECONDS_PER_MINUTE - seconds) / SECONDS_PER_MINUTE) - QUARTER_CIRCLE);
    cx.lineWidth = 15;
    cx.strokeStyle = "#27463E";
    cx.stroke();
}

// NOTIFICATION CODE! WOO! 
/// copied and pasted, some customization is in order
function notifyMe() {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.'); 
    return;
  }

  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification('Notification title', {
      icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
      body: "Countdown's Done!",
    });

    notification.onclick = function () {
      $('#reset').click();      
    };

  }

}

// $(document).ready(function() {
$(document).ready(() => {

    // status indicator: blue color means this file compiled.
    // document.querySelector('body').style.backgroundColor = 'blue';

    /*
    // TO ADD LATER: toggle mode
    document.querySelector('#toWorkout').onclick = function () {
        currMode = WORKOUT;

        $('#toRegular').show();
        $('#toWorkout').hide();

        $('#repetitions').show();
        $('#break-entry').show();
    };

    document.querySelector('#toRegular').onclick = function () {
        currMode = REGULAR;

        $('#toWorkout').show();
        $('#toRegular').hide();

        $('#repetitions').hide();
        $('#break-entry').hide();
    };
    // TO ADD LATER: toggle mode
    */

    document.querySelector('#play').onclick = function () {
        const timer = currTimer || startNewTimer(currMode);
        timer.play();
        currTimer = timer;

        $("#countdown-display").show();
        $("#duration-entry").hide();

        $('#play').hide();
        $('#pause').show();
    };
    

    document.querySelector('#pause').onclick = function () {
        if (currTimer) currTimer.pause();

        $('#play').show();
        $('#pause').hide();
    };

    document.querySelector('#reset').onclick = function () {
        // terminates both currTimer and currDisplay
        if (currTimer) terminateCurrTimer();
        stopNotification();

        $('#hours').text('00');
        $('#minutes').text('00');
        $('#seconds').text('00');

        $("#countdown-display").hide();
        $("#duration-entry").show();

        hideCheckmark();
        showMediaControls();
    };

    document.querySelector('#checkmark-control').onclick = function () {
        if (currTimer) terminateCurrTimer();
        document.getElementById('loop-alarm').pause();

        $('#hours').text('00');
        $('#minutes').text('00');
        $('#seconds').text('00');

        $("#countdown-display").hide();
        $("#duration-entry").show();

        hideCheckmark();
        showMediaControls();
        $('#play').show();
        $('#pause').hide();
    };

    document.querySelector('#turn-stealth-on').onclick = function () {
        $('#countdown-display').css("visibility", "hidden");

        $('#turn-stealth-off').show();
        $('#turn-stealth-on').hide();
    };

    document.querySelector('#turn-stealth-off').onclick = function () {
        $('#countdown-display').css("visibility", "visible");
        $('#turn-stealth-on').show();
        $('#turn-stealth-off').hide();
    };

    // DESKTOP NOTIFICATION! WOO!
    document.addEventListener('DOMContentLoaded', function () {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    });
});
