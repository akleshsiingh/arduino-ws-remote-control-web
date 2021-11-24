
var btnConnect = document.querySelector('#connect');
var sendCmd = document.querySelector('#sendCmd');
var cmdInputArea = document.querySelector('#cmdInputArea');
var response = document.querySelector("#response");
var serverAddress = document.getElementById("serverAddress");
var batteryLevel = document.querySelector(".battery-level");
var percentageEl = document.querySelector("#percentage");
var isConnected = false;
var retryCount = 0;
const MAX_RETRY_COUNT = 3;
var isConnectingInProgress = false;
var interval;

var samplePayload = { "sensor": "gps", "time": 1351824120, "data": [48.756080, 2.302038] };
cmdInputArea.value = JSON.stringify(samplePayload);
cmdInputArea.value = JSON.stringify({ ...samplePayload, ...{ "sensor": 'speed', value: 50, data: [0] } });
console.log(window.joyStick);

var serverIp = 'ws://192.168.1.107';
setServerAddress();
let socket;

function connectToServer() {
    isConnectingInProgress = true;
    serverIp = serverAddress.value;
    setServerAddress();
    console.log('connect to server');

    // btnConnect.textContent = "connecting...";
    socket = new WebSocket(serverIp);

    socket.onopen = function (e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        setWebsocketStatus('disconnect', true);
    };

    socket.onmessage = function (event) {
        //console.warn(`[message] Data received from server: ${event.data}`);
        console.log('```````RECIEVED');
        console.log(event.data);
        console.log("````````````````````");
        response.innerHTML = event.data ?? '';

        try {
            const json = JSON.parse(event.data);
            processResponse(json);
        } catch (error) {
            console.error('something went wrong');
        }

    };

    socket.onclose = function (event) {
        console.error(event);

        if (event.wasClean) {
            console.error(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.error('[close] Connection died');
        }
        // isConnected = false;
        // btnConnect.textContent = "connect";
        retryCount++;
        console.log(`retry count ${retryCount}`);
        if (retryCount >= MAX_RETRY_COUNT) {
            isConnectingInProgress = false;
            setWebsocketStatus('connect')
            console.error('Max retry count rached');
            return;
        }
        var count = 0;
        if (interval) {
            clearInterval(interval);
        }
        interval = setInterval(() => {
            count++;
            console.log(count);
            setWebsocketStatus('reconnecting pls wait...');
            if (count == 3) {
                reconnect();
                clearInterval(interval);
            }
        }, 1000);
    };

    socket.onerror = function (error) {
        console.error(`[error] ${error.message}`);
    };
}
function setWebsocketStatus(msg, status = false) {
    isConnected = status;
    btnConnect.textContent = msg;
}
function reconnect() {
    if (!isConnected && serverIp != '') {
        setTimeout(() => connectToServer(), 1000);
    }
}
setWebsocketStatus('connecting pls wait...');
reconnect();

function processResponse(payload) {
    if (!payload) {
        console.log('invalid response')
        return;
    }

    // console.log(payload);
    // console.log(payload.sensor);
    switch (payload.sensor) {
        case 'battery':
            const reading = payload.data[0];
            // batteryVoltageReadList.push(reading);

            // if(batteryVoltageReadList.length >= 10){
            //     const sum  = batteryVoltageReadList.reduce((total, current) => total+current );

            //     batteryPercentage = sum/batteryVoltageReadList.length;
            //     batteryVoltageReadList= [];
            // }
            console.log(reading);
            percentageEl.innerText = reading;
            batteryLevel.style.width = `${Math.floor(reading)}%`;
            break;

        default:
            console.log('sendor type not matched');
            break;
    }

}

function diconnectClient() {
    console.log('disconnecting')
    socket.close(1000, 'user disconnected');
    isConnected = false;
    btnConnect.textContent = "connect";
}

btnConnect.addEventListener('click', () => {
    retryCount = 0;
    if (isConnectingInProgress) {
        console.log('stop reconnecting');
        isConnectingInProgress = false;
        setWebsocketStatus('connect');
        if (interval)
            clearInterval(interval);

        return;
    }
    if (isConnected) {
        // disconnect
        diconnectClient();
    } else {
        connectToServer();
    }
});

sendCmd.addEventListener('click', () => {

    const cmdTxt = cmdInputArea.value;
    sendPayload(cmdTxt);
});

function sendPayload(payload) {
    if (!isConnected) {
        console.error('server not connected');
        return;
    }
    if (typeof payload === 'object')
        socket.send(JSON.stringify(payload));
    else
        socket.send(payload);
}

function setServerAddress() {
    serverAddress.value = serverIp;
}

function debounce(func, timeout = 100) {

    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    }
}

const throttleEl = document.querySelector('#throttle');
const directionControlEl = document.querySelector('#direction-control');
const leftEl = document.querySelector('.left');
const rghtEl = document.querySelector('.right');


throttleEl.max = 200;
throttleEl.value = 100;

directionControlEl.value = 50;
directionControlEl.max = 100;
let direction = 0;
const maxSpeed = 100;
let speed = 0;

function sendThrottle() {
    speed = throttleEl.value - 100;
    var speedObj = { "sensor": "speed", "time": Date.now() / 1000, "data": [speed, direction] };
    sendPayload(speedObj);
}

function sendDirection() {
    direction = directionControlEl.value - 50;
    var speedObj = { "sensor": "speed", "time": Date.now() / 1000, "data": [speed, direction] };
    sendPayload(speedObj);
}

const inputListner = debounce((e) => {
    console.log(e);
    console.log(throttleEl.value);
    sendThrottle();
}, 50);

const directionListner = debounce((e) => {
    console.log(directionControlEl.value);
    sendDirection();
}, 40);

throttleEl.addEventListener('input', inputListner);
throttleEl.addEventListener('mouseleave', () => {
    console.error('focus removed');
    if (speed !== 0) {
        throttleEl.value = 100;
        sendThrottle();
    }
});



directionControlEl.addEventListener('input', directionListner);
directionControlEl.addEventListener('mouseleave', () => {
    console.error('focus removed');
    if (direction !== 0) {
        directionControlEl.value = 50;
        sendDirection();
    }
});