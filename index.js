const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const crypto = require("crypto");

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketio(server);

/**********
    DATABASE
**********/
// in-memory store of all the sessions
// the keys are the session IDs (strings)
// the values have the form: {
//   id: '84dba68dcea2952c',             // 8 random octets
//   lastActivity: new Date(),           // used to find old sessions to vacuum
//   lastKnownTime: 123,                 // milliseconds from the start of the video
//   lastKnownTimeUpdatedAt: new Date(), // when we last received a time update
//   state: 'playing' | 'paused',        // whether the video is playing or paused
//   videoId: 123                        //  id the video
// }
var sessionDB = {}

// in-memory store of all the users
// the keys are the user IDs (strings)
// the values have the form: {
//   id: '3d16d961f67e9792',        // 8 random octets
//   sessionId: 'cba82ca5f59a35e6', // id of the session, if one is joined
//   socket: <websocket>,           // the websocket
//   typing: false                  // whether the user is typing or not
// }
var userDB = {}


/****************
    EXPRESS
****************/
app.get('/', (request, response) =>{
    console.log("GET REQUEST RECEIVED");
    response.status(200).end();
});

server.listen(3000, () => {
    console.log("LISTENING ON PORT 3000!");
});

/****************
    SOCKET.IO
****************/

// TODO: santitize input
io.on("connect", (socket) => {
    console.log("A USER HAS CONNECTED TO SOCKET");
    //create new user object
    let newUserId = uniqueId();
    let newUserObj = {
        "userId": newUserId,
        "sessionId": null,
        "socket": socket
    }
    // add new user to userDB
    userDB[newUserId] = newUserObj;
    
    //return user Id 
    socket.emit("newUser", newUserId);

    // Create new session and return session id.
    socket.on('createSession', (data) => {
        let id = uniqueId();
        let newSession = {
            "sessionId": id,
            "lastActivity": utcSeconds(),
            "lastVideoPos": data["lastVideoPos"],
            "state": data["state"],
            "videoId": data["videoId"],
            "users": [data["user"]]
        };
        sessionDB[id] = newSession;
        console.log("NEW SESSION CREATED!");
        console.log(sessionDB);
        socket.emit('newSession', id);
    });

    // Update all fields from data
    socket.on('updateSession', (data) => {
        let sessionId = data["sessionId"];
        let userId = data["userId"];
        //if session exists
        if(sessionDB[sessionId]){
            //update all values except the session id
            Object.keys(data).forEach((key, index) => {
                if(key === "sessionId" || key === "userId"){
                    return;
                }
                else{
                    sessionDB[sessionId][key] = data[key];
                }
            });

            // Propogate updates to all users except sending user
            sessionDB[sessionId]["users"].forEach((element, index) => {
                if(element === userId) {
                    console.log("Fake continue");
                }
                else {
                    let tempSocket = userDB[element]["socket"];
                    tempSocket.emit("videoUpdate", data)
                }
            });
            console.log("SESSION UPDATED");
            console.log(sessionDB);
        }
        else{
            console.log(`Session ${sessionId} does not exist.`);
        }
    });

    // Emit specific session meta-data
    socket.on('getSession', (data) => {
        socket.emit('returnSession', sessionDB[data]);
    });

    socket.on('disconnect', () =>{
        console.log("USER HAS DISCONNECTED");
    });
});

///////////////////////
//   HELPER METHODS  //
///////////////////////

// Create a random 8-byte string
function uniqueId() {
    return crypto.randomBytes(8).toString('hex');
}

// return UTC time in seconds
function utcSeconds() {
    let d = new Date();
    return (d.getTime() + d.getTimezoneOffset()*60*1000)/1000;
}