

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

function doSend(msg, type, to) {
    const message = JSON.stringify({ msg: msg, type: type, to: to });
    wsocket.send(message);
}

window.addEventListener('load', function () {
    openConnection()
})


function onMessage(msgc){

           msgdata = JSON.parse(msgc.data)
        
            switch (msgdata.type) {
                case 'retrievekey':
                    doSend($.cookie('sessionkey'), 'sentkey') 
                break

                case 'globalmsg':
                    $('#globalChat').append(`<p id="chat-user"> ${msgdata.message} </p>`)
                break

                case 'newFriendReq':
                    alert('TEST: FRIEND REQUEST RECEIVED!!')
                    $('#notifications-friendreq').append(`${msgdata.notif}`)
                break

                case 'privatemsg':
                    alert('testing dms')
                    $('#privateChat').append(`${msgdata.message}`)

                break
            }
}

