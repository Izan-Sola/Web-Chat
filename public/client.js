

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

function doSend(msg, type, user) {
    const message = JSON.stringify({ msg: msg, type: type, user: user });
    wsocket.send(message);
}

window.addEventListener('load', function () {
    openConnection()
 
})

privateMessagesM = new Map()
tempList = []

function getDMs(user) {

    if (privateMessagesM.has(user)) {
        return privateMessagesM.get(user)
    }
    return 'none'
}

function addDMs(user, DM) {

    if (privateMessagesM.has(user)) {
        tempList = privateMessagesM.get(user)
        tempList.push(DM)
        privateMessagesM.set(user, tempList)
    }
}

function onMessage(msgc){

           msgdata = JSON.parse(msgc.data)
        
            switch (msgdata.type) {
                case 'retrievekey':
                    doSend($.cookie('sessionkey'), 'sentkey', $('#profile-name').text()) 
                break

                case 'globalmsg':
                    $('#globalChat').append(`<p id="chat-user"> ${msgdata.message} </p>`)
                    n = msgdata.message.match(/\[([^\]]+)\]/)

                    if ($('#profile-name').text() == n[1]) {
                        c = $('#globalChat').children()
                        console.log(c[c.length-1])
                    
                    }
                break

                case 'newFriendReq':
                    alert('You have received a friend request')
                    $('#notifications-friendreq').append(`${msgdata.notif}`)
                break

                case 'privatemsg':
                    test = msgdata.message.match(/\[([^\]]+)\]/)

                    if (privateMessagesM.has(test)) {
                        tempList = privateMessagesM.get(test)
                    }
                    if((tempList.length - 1) > 10) {
                        tempList = []
                    }

                    tempList.push(msgdata.message)
                    privateMessagesM.set(test[1], tempList)
                    console.log(privateMessagesM)
            
                    if ($('#privatechat-title').children().text().trim() == test[1]) {
                        $('#privateChat').append(`<p id="chat-user"> ${msgdata.message} </p>`)
                    }
       
                break
            }
}

