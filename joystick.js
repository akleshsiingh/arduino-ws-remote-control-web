
const speedControlEl = document.querySelector('.speed');
const leverEl = document.querySelector('.lever');


var joyStick = (function (throttleEl, leftEl, rightEl){
    return {
        test: function (){
            return 'test function called';
        }
    }
})(document.querySelector('#throttle'),document.querySelector('.left'), document.querySelector('.right'));

window.joyStick = joyStick;



