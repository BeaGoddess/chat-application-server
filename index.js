const express = require("express")
let app = express();
const port = process.env.PORT || 5000; 
const cors = require('cors')

const http = require('http').createServer(app);

//const httpServer = require("http").createServer();
const { instrument } = require('@socket.io/admin-ui')

const io = require('socket.io')(http, {
  cors: {
    origin: 'https://chat-app-sockets.netlify.app',
    credentials: true,
    methods: ["GET", "POST"]
  }
})

app.use(cors({
  origin: '*'
}))

// Example of Users[0] = { id: "socket.id", name: "User1" }
let Users = []

// Example of Rooms[0] = { room: "Room Name", users: ["socket.id","socket.id2"] }
let Rooms = []

// ------------------------------------------------------------

io.on('connection', socket => {

  console.log("User " + socket.id + " Connected ")

  socket.on('set-user', (name) => {
    Users.push({ id: socket.id, name: name })
    console.log(Users);

    socket.broadcast.emit('send-users', { id: socket.id, name: name }, Users, "2")
    socket.emit('send-users', { id: socket.id, name: name }, Users, "1")

  })

  // Send and Receive Messages
  socket.on('send-message', (send, message, receive) => {
    console.log(send, message, receive);
    socket.broadcast.emit('receive-message', send, message, receive)
    /*
    console.log(userId, message);
    if (room === '') {
      socket.broadcast.emit('receive-message', userId, message)
    } else {
      socket.broadcast.to(room).emit('receive-message', userId, message)
    }
    */
  })

  socket.on('typing-message', (send, receive, value) => {

    socket.broadcast.emit('typing', send, receive, value)
  })

  socket.on('join-room', (room, cb) => {
    socket.join(room)
    cb(`Joined ${room}`)
  })

  function disconnect() {
    let user = Users.find(object => object.id === socket.id) !== undefined ?
      Users.find(object => object.id === socket.id).name : ""

    socket.broadcast.emit('remove-user', user)

    Users = Users.filter(object => {
      return object.id !== socket.id;
    })

    console.log(Users);

    console.log("User " + socket.id + " Disconnected ")

  }

  socket.on('disconnect-user', disconnect)
  socket.on('disconnect', disconnect)

})

instrument(io, { auth: false })

app.get('/', (req, res) => {
  return res.send('Working')
})

http.listen(5000, () => {
  console.log('Port 5000')
})