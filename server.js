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

webSocketServer.on("request", function (req) {
    if (req.origin === 'https://monthly-devoted-pug.ngrok-free.app') {
        const connection = req.accept(null, req.origin);
        console.log('Connection accepted from:', req.origin);

        const request = JSON.stringify({type: 'retrievekey'})
        connection.sendUTF(request)
   

        connection.on("message", function (msg) {
            const message = JSON.parse(msg.utf8Data)
          
            switch (message.type) {
                case 'globalmsg':         
                        for (let [user, conn] of connectionsListM) 
                            if(conn.connected) {
                                  messagedata = JSON.stringify({type: 'globalmsg', message: message.msg})
                                  conn.sendUTF(messagedata);  
                        }
                break

                case 'sentkey':
                        connectionsListM.set(message.msg, connection)
                break
            }
        });

        connection.on("close", function () {
            console.log('Connection closed');

            connectionsListM.delete(connection)
        });
    } else {
        req.reject();
        console.log('Connection rejected from:', req.origin);
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
                const userDesc =  await con.query('SELECT description FROM users WHERE sessionkey = ?', [name])
                const userAge =  await con.query('SELECT age FROM users WHERE sessionkey = ?', [name])
                const userName =  await con.query('SELECT username FROM users WHERE sessionkey = ?', [name])

        

                return { userAge: userAge, userDesc: userDesc, userName: userName }

            case 'loadStrangerProfile':
                const strangerDesc =  await con.query('SELECT description FROM users WHERE username = ?', [name])
                const strangerAge =  await con.query('SELECT age FROM users WHERE username = ?', [name])
                const strangerName =  await con.query('SELECT username FROM users WHERE username = ?', [name])

                return { strangerAge: strangerAge, strangerDesc: strangerDesc, strangerName: strangerName }
        
            case 'sendFriendRequest':        
                const newFriendReq = "INSERT INTO friendrequests SET receiver = ?, sender = ?, content = ?"         
                const receiverkey = await con.query('SELECT sessionkey FROM users WHERE username = ?', [friend])
                
                
                await con.query(newFriendReq, [friend, name,  `<li> Friend request from: <b class="friendreq-sender"> ${name} </b> </li>`])
                        

                sendNotification('newFriendReq', `<li> Friend request from: <b class="friendreq-sender"> ${name} </b> </li>`, receiverkey, )
                return { message: 'Friend request successfully sent' }

            case 'loadAllNotifications':
                //!sfs
                //*Atm just load friend req
                const [getFriendReqs] =  await con.query('SELECT * FROM friendrequests WHERE receiver = ?', [name])

               
                return { friendReqNotifications: getFriendReqs }

            case 'loadFriendList':

                break

            case 'addFriend':
                const addFriend = await con.query('INSERT INTO friends SET user1 = ?, user2 = ?',  [name, friend])
            
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
function sendNotification(type, notif, receiverkey) {

   

    switch (type) {
        case 'newFriendReq':
            const notifdata = JSON.stringify({ type: type, notif: notif })
            s = connectionsListM.get(receiverkey[0][0].sessionkey)
            s.sendUTF(notifdata)
            
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