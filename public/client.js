function openConnection() {
    wsocket = new WebSocket('wss://monthly-devoted-pug.ngrok-free.app')
    wsocket.onopen = function (event) {
        onOpen(event)
    }; wsocket.onclose = function (event) {
        onClose(event)
    }; wsocket.onmessage = function (event) {
        onMessage(event)
    }; wsocket.onerror = function (event) {
        onError(event)
    };

}

function onOpen() {

}
function onClose(reason) {
    console.log('Connection closed' + reason)
}

function onError(error) {
    console.log('Error: ' + error.data)
}

function doSend(msg) {
    console.log('Sent message: ' + msg)
    wsocket.send(msg)
}

window.addEventListener('load', function () {
    openConnection()
})


function onMessage(msgc, type){
    $('#globalChat').append(`<p id="chat-user"> ${msgc.data} </p>`)
}

