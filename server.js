const express = require('express')
const app = express()
const http = require('http')
const cors = require('cors')
const {Server} = require('socket.io')
app.use(cors())

app.get('/',(req,res)=>{
    res.send("Server is working fine..👍")
})
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin:"*",
        methods: ["GET","POST"]
    }
})

const users = []
var Rooms = [];
io.on("connection",socket => {

    socket.on("new-user",(user,room) => {
        socket.join(room)
        users[socket.id] = user
        Rooms [socket.id]= room
        socket.broadcast.to(room).emit("user-joined",user)
    })

    socket.on("send-message",(data,user,room) =>{
        socket.broadcast.to(room).emit("receive-message",data,user)
        socket.join(user)
    })

    socket.on("disconnect",()=>{
        if(users[socket.id] != null)
        {
            socket.broadcast.to(Rooms[socket.id]).emit("user-left",users[socket.id])
        }
        delete(users[socket.id])
        delete(Rooms[socket.id])
        console.log(`user disconnected`)
    })
})

const port = process.env.port || 5000
server.listen(port)