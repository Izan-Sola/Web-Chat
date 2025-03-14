const jsdom = require('jsdom')
const dom = new jsdom.JSDOM("")
const $ = require('jquery')(dom.window)
const mysql = require('mysql2/promise');
const bodyParser = require("body-parser");
const path = require("path");
const express = require('express');
const cors = require('cors');
const { NOTFOUND } = require('dns');
const app = express();
const server = require('http').Server(app);
const WebSocketServer = require("websocket").server;
const port = 3000;
app.set('port', 3000);
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));
const crypto = require('crypto');
const { connection } = require('websocket');

const webSocketServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false 
});

const connectionsListM = new Map();
globalMSGsList = []


webSocketServer.on("request", function (req) {
    if (req.origin === 'https://monthly-devoted-pug.ngrok-free.app') {
        const connection = req.accept(null, req.origin);
       // console.log('Connection accepted from:', req.origin);

        const request = JSON.stringify({type: 'retrievekey'})
        connection.sendUTF(request)

        connection.on("message", function (msg) {
            const message = JSON.parse(msg.utf8Data)
          
            switch (message.type) {
                case 'globalmsg':         

                        for (let [user, conn] of connectionsListM) {
                        //     if(conn.connected) {
                        //           messagedata = JSON.stringify({type: 'globalmsg', message: message.msg})
                        //           conn.sendUTF(messagedata);  
                        // }
                        if(conn[0].connected) {
                            messagedata = JSON.stringify({type: 'globalmsg', message: message.msg})
                            conn[0].sendUTF(messagedata);  
                  }
                    }
                     
                if((globalMSGsList.length - 1) > 15) {
                    globalMSGsList = []
                    
                }
                globalMSGsList.push(message.msg)
                
                case 'privatemsg':
                    // console.error("test", message.to)
                    user = message.user.trim()
                    if (connectionsListM.has(user)) {
                        messagedata = JSON.stringify({type: 'privatemsg', message: message.msg, user: user})
                        connectionsListM.get(user)[0].sendUTF(messagedata)
                    }

                break 

                case 'sentkey':
                      //  connectionsListM.set(message.msg, connection)
                        connectionsListM.set(message.user, [ connection, message.msg ])

                break
            }
        });

        connection.on("close", function () {
         // console.log('Connection closed');

           // connectionsListM.delete(connection)
        });
    } else {
        req.reject();
        //console.log('Connection rejected from:', req.origin);
    }
});

server.listen(3000, '172.30.135.220', () => {
    console.log('Server started')
})

async function dataBaseConnection(action, name, password, age, description, friend, clientIP) {
    const con = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "chat"
    });

    try {
        existingUsers = []
        switch (action) {

            case 'newUser':
                const [existingUsers] = await con.query('SELECT * FROM users WHERE username = ?', [name]);
                if (existingUsers.length > 1) {
                    return { error: 'DUPLICATEDUSER' };

                }
                sessionKey = crypto.randomBytes(32).toString('hex')

                const newUser = "INSERT INTO users SET username = ?, password = ?, sessionkey = ?, ip = ?";
                await con.query(newUser, [name, password, sessionKey, clientIP]);

                return { message: 'New user inserted successfully', sessionKey: sessionKey  };

            case 'checkLoginCredentials':

                message = 'LOGIN SUCCESSFUL!'

                const [pass] = await con.query('SELECT password FROM users WHERE username = ?', [name])
                const key = await con.query('SELECT sessionkey FROM users WHERE username = ?', [name])
              
                if (pass.length < 1) {
                    message = 'USER DOESNT EXIST'
                }
                else {
                    pass.forEach(element => {
                        if (element.password != password) {
                            message = 'INCORRECT PASSWORD'
                        }
                    });
                }
                return { message: message, sessionKey: key }

            case 'updateProfile':
                 const newAge = "UPDATE users SET age = ? WHERE sessionkey = ?"
                 await con.query(newAge, [age, name]);

                 const newDescription = "UPDATE users SET description = ? WHERE sessionkey = ?"
                 await con.query(newDescription, [description, name]);

                 message = 'Porfile updated successfully'
                 return { message: message }

            case 'loadProfile':
                const userData = await con.query('SELECT description, age, username FROM users WHERE sessionkey = ?', [name])
                
                return { userData: userData, globalHistory: globalMSGsList}

            case 'loadStrangerProfile':
    
                const strangerData = await con.query('SELECT description, age, username FROM users WHERE username = ?', [name])

                return { strangerData: strangerData }

            case 'sendFriendRequest':        
                const newFriendReq = "INSERT INTO friendrequests SET receiver = ?, sender = ?, content = ?"         
             //   const receiverkey = await con.query('SELECT sessionkey FROM users WHERE username = ?', [friend])
                
                
                await con.query(newFriendReq, [friend, name,  `<li> Friend request from: <b class="friendreq-sender"> ${name} </b> </li>`])
                        

                sendNotification('newFriendReq', `<li> Friend request from: <b class="friendreq-sender"> ${name} </b> </li>`, friend, )
                return { message: 'Friend request successfully sent' }

            case 'loadAllNotifications':
                //!sfs
                //*Atm just load friend req
                const [getFriendReqs] =  await con.query('SELECT * FROM friendrequests WHERE receiver = ?', [name])

               
                return { friendReqNotifications: getFriendReqs }

            case 'loadFriendList':
                friends = []
                const [rows] = await con.query('SELECT * FROM friends WHERE user1 = ? OR user2 = ?', [name, name])
                
                $.each(rows, function (index, friend) { 
                    
                    if (friend.user1 == name) {
                        friends.push(friend.user2)
                    }
                    else if (friend.user2 == name) {
                        friends.push(friend.user1)
                    }
                });

                return { friendlist: friends }

            case 'addFriend':
                const addFriend = await con.query('INSERT INTO friends SET user1 = ?, user2 = ?',  [name, friend.trim()])
                await con.query('DELETE FROM friendrequests WHERE receiver = ?', [name])
            
                return { added: 'holitest' }

            case 'getSessionKey':

            
                break
        }
    } catch (err) {
        console.error('Database operation error:', err);
        return { error: 'ERROR' };
    } finally {
        await con.end();
    }
}
//newFriendReq, newAnnouncement, newDM
function sendNotification(type, notif, friend) {

    switch (type) {
        case 'newFriendReq':
            const notifdata = JSON.stringify({ type: type, notif: notif })
            s = connectionsListM.get(friend)
            console.error(s, s[0])
            s[0].sendUTF(notifdata)
            
           // conn.sendUTF(notifdata)
        break
    }
}

app.post('/databaseupdates', async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { action, name, password, age, description, friend } = req.body;
    const result = await dataBaseConnection(action, name, password, age, description, friend, clientIP);
    res.json(result);
});