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
let sessionDB = {}


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

io.on("connect", (socket) => {
    console.log("A USER HAS CONNECTED TO SOCKET");
    
    //TODO: santitize input
    // Create new session and emit respective session id.
    socket.on('createSession', (data) => {
        let newId = uniqueId();
        newSession = {};
        newSession["sessionId"] = newId;
        newSession["lastActivity"] = data["lastActivity"];
        newSession["lastKnownTime"] = data["lastKnownTime"];
        newSession["state"] = data["state"];
        newSession["videoid"] = data["videoid"];
        sessionDB[newId] = newSession;
        console.log("NEW SESSION CREATED!");
        console.log(sessionDB);
        socket.emit('newSession', newId);
    });

    // Update all fields from data
    socket.on('updateSession', (data) => {
        let updateSession = data["sessionId"];
        if(sessionDB[updateSession]){
            Object.keys(data).forEach((key, index) => {
                if(key == "sessionId"){
                    return;
                }
                else{
                    sessionDB[updateSession][key] = data[key];
                }
            });
            console.log("SESSION UPDATED");
            console.log(sessionDB);
        }
        else{
            console.log(`Session ${updateSession} does not exist.`);
        }
    });

    // Emit specific session meta-data
    socket.on('getSession', (data) => {
        socket.emit('returnSession', sessionDB[data]);
    });
});

/********************
    Helper Methods
********************/

// Create a random 8-byte string
function uniqueId() {
    return crypto.randomBytes(8).toString('hex');
}