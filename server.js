const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class Elevator {
  constructor(io) {
    this.currentFloor = 0;
    this.requests = [];
    this.moving = false;
    this.io = io;
  }

  requestFloor(floor) {
    this.requests.push(floor);
    if (!this.moving) {
      this.processRequests();
    }
  }

  async processRequests() {
    this.moving = true;
    while (this.requests.length > 0) {
      const nextFloor = this.requests.shift();
      await this.moveToFloor(nextFloor);
    }
    this.moving = false;
  }

  async moveToFloor(floor) {
    const travelTime = Math.abs(this.currentFloor - floor) * 10; // 1 second per floor
    console.log(`Moving from floor ${this.currentFloor} to floor ${floor}`);
    this.io.emit('moving', { from: this.currentFloor, to: floor });
    await new Promise(resolve => setTimeout(resolve, travelTime));
    this.currentFloor = floor;
    console.log(`Arrived at floor ${floor}`);
    this.io.emit('arrived', { floor: this.currentFloor });
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const elevator = new Elevator(io);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('requestFloor', (floor) => {
    elevator.requestFloor(floor);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
