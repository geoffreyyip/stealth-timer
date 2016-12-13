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
let currDisplay = null;
let currMode = REGULAR;

function toMilliseconds(hours, minutes, seconds) {
    const totalMinutes = (hours * MINUTES_PER_HOUR) + minutes;
    const totalSeconds = (totalMinutes * SECONDS_PER_MINUTE) + seconds;
    return totalSeconds * MILLISECONDS_PER_SECOND;
}

function playNotification() {
    document.getElementById('loop-alarm').play();
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

function terminateCurrDisplay() {
    currDisplay.stop();
    currDisplay = null;
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
        this.animator = setInterval(displayAnimation, TENTH_OF_A_SECOND, 
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
    if (mode === REGULAR) {
        const timeEntry = {
            hours: parseInt($('#hours-work').val(), 10) || 0,
            minutes: parseInt($('#minutes-work').val(), 10) || 0,
            seconds: parseInt($('#seconds-work').val(), 10) || 0,
        };
        newTimer = new CountdownTimer(timeEntry, () => {
            playNotification();
            terminateCurrTimer();
        }, buildObserver);
    } else if (mode === WORKOUT) {
        const timeEntry = {
            hours: parseInt($('#hours-work').val(), 10) || 0,
            minutes: parseInt($('#minutes-work').val(), 10) || 0,
            seconds: parseInt($('#seconds-work').val(), 10) || 0,
        };
        const breakEntry = {
            hours: parseInt($('#hours-break').val(), 10) || 0,
            minutes: parseInt($('#minutes-break').val(), 10) || 0,
            seconds: parseInt($('#seconds-break').val(), 10) || 0,
        };

        const repetitions = parseInt($('#repetitions-entry').val(), 10);
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
    $('#hours').text(padWithZeros(hours, 2));
    $('#minutes').text(padWithZeros(minutes, 2));
    $('#seconds').text(padWithZeros(seconds, 2));   
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
    cx.clearRect(0, 0, 500, 500);
    cx.beginPath();
    cx.arc(250, 250, 250, 0, 2 * Math.PI * seconds / SECONDS_PER_MINUTE);
    cx.lineWidth = 6;
    cx.stroke();
}

// $(document).ready(function() {
$(document).ready(() => {

    // status indicator: blue color means this file compiled.
    $('body').css({ 'background-color': 'blue' });

    // toggle mode
    $('#toWorkout').on('click', () => {
        currMode = WORKOUT;

        $('#toRegular').show();
        $('#toWorkout').hide();

        $('#repetitions').show();
        $('#break-entry').show();
    });

    $('#toRegular').on('click', () => {
        currMode = REGULAR;

        $('#toWorkout').show();
        $('#toRegular').hide();

        $('#repetitions').hide();
        $('#break-entry').hide();
    });

    // UI consideration: I can make play button invisible when timer is up
    // this prevents countdown interval from being reactivated when timer hits zero
    // this also prevents display of negative times.

    // it may still be useful to defensively set display object to show zero time when
    // countdown is zero
    $('#play').on('click', () => {
        const timer = currTimer || startNewTimer(currMode);
        timer.play();
        currTimer = timer;
    });

    $('#pause').on('click', () => {
        if (currTimer) currTimer.pause();
    });

    $('#stop').on('click', () => {
        // terminates both currTimer and currDisplay
        if (currTimer) terminateCurrTimer();
        if (currDisplay) terminateCurrDisplay();
        document.getElementById('loop-alarm').pause();

        $('#hours').text('00');
        $('#minutes').text('00');
        $('#seconds').text('00');
    });

    $('#hide').on('click', () => {
        $('#countdown-display').hide();

        $('#show').show();
        $('#hide').hide();
    });

    $('#show').on('click', () => {
        $('#countdown-display').show();

        $('#hide').show();
        $('#show').hide();
    });
});
