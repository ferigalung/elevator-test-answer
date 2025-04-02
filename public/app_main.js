const canvas = document.getElementById('elevatorCanvas');
const ctx = canvas.getContext('2d');


class ElevatorAnimator {
  constructor(socket, elevatorCount, peopleCount = 100) {
    this.elevators = Array.from({ length: elevatorCount }, (_, id) => ({
      id: id,
      currentFloor: 0, 
      targetFloor: 0,
      isPickup: false,
      moving: false
    }));
    this.totalFloors = 50;
    this.floorHeight = 14;
    this.elevatorWidth = 10;
    this.elevatorHeight = 13;
    this.deliveredCount = 0;
    this.startTime = new Date();
    this.finishTime = null;
    this.socket = socket;
    this.peopleQueue = this.generatePeople(peopleCount);
    console.log(JSON.stringify(this.peopleQueue));
  }

  generatePeople(count) {
    const usedCombinations = new Set();
    const result = [];
    
    while (result.length < count) {
      let from = Math.floor(Math.random() * this.totalFloors) + 1;
      let to = Math.floor(Math.random() * this.totalFloors) + 1;
      
      const combination = `${from}-${to}`;
      
      if (from !== to && !usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        result.push({ from, to });
      }
    }
    
    return result;
  }

  initializeSocketListeners() {
    this.socket.on('elevatorMove', ({ id, from, to, isPickup }) => {
      this.elevators[id].currentFloor = from - 1;
      this.elevators[id].isPickup = isPickup;
      this.elevators[id].targetFloor = to - 1;
      this.animate(id);
    });

    this.socket.on('elevatorArrived', ({ id, floor, isPickup }) => {
      this.elevators[id].isPickup = isPickup;
      this.elevators[id].currentFloor = floor - 1;
      this.draw();

      if (!isPickup) {
        this.updateUI();
      }
    });
  }

  startSimulation() {
    for (let i = 0; i < this.peopleQueue.length; i++) {
      const person = this.peopleQueue[i];
      this.socket.emit('requestFloor', person.from, person.to);
    }
  }

  updateUI(initial = false) {
    if (initial) {
      document.getElementById("startTime").innerHTML = this.startTime.toLocaleString();
      return;
    }
    
    this.deliveredCount += 1;
    
    if (this.deliveredCount === this.peopleQueue.length) {
      this.socket.emit('returnToLobby');

      this.finishTime = new Date();
      document.getElementById("finishTime").innerHTML = this.finishTime.toLocaleString();
      document.getElementById("gapTime").innerHTML = getElapsedTime(this.startTime, this.finishTime);
    }
    
    document.getElementById("counter").innerHTML = this.deliveredCount;
  }

  animate(id) {
    const elevator = this.elevators[id]
    elevator.moving = true
    
    if (Math.abs(elevator.currentFloor - elevator.targetFloor) < 0.1) {
      elevator.currentFloor = elevator.targetFloor;
      this.draw();
      cancelAnimationFrame(elevator.id);
      elevator.moving = false;
      return;
    }

    const direction = Math.sign(elevator.targetFloor - elevator.currentFloor);
    const speed = this.calculateSpeed(elevator);
    
    elevator.currentFloor += direction * speed;
    
    this.draw();
    requestAnimationFrame(() => this.animate(id));
  }

  calculateSpeed(elevator) {
    const distance = Math.abs(elevator.targetFloor - elevator.currentFloor);
    const baseSpeed = 0.1;
    
    if (distance < 1) return baseSpeed * 0.5;
    if (distance < 3) return baseSpeed;
    if (distance < 10) return baseSpeed * 1.5;
    return baseSpeed * 2;
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw floors
    ctx.fillStyle = 'black';
    for (let i = 0; i < this.totalFloors; i++) {
      const y = canvas.height - (i + 1) * this.floorHeight;
      ctx.fillText(`Floor ${i+1}`, 10, y + this.floorHeight - 2);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // draw separator line
    ctx.beginPath();
    ctx.moveTo(110, 0)
    ctx.lineTo(110, canvas.height)
    ctx.stroke();

    // Draw elevator and waiting indicator
    let gapBetween = 0;
    this.elevators.forEach((elevator, id) => {
      if (id > 0) {
        gapBetween = id * 15;
      }
      const xPos = 55 + gapBetween;
      const yPos = canvas.height - (elevator.currentFloor + 1) * this.floorHeight;
      
      ctx.fillStyle = 'red';
      ctx.fillRect(xPos, yPos, this.elevatorWidth, this.elevatorHeight);
      
      // Draw waiting text
      if (elevator.isPickup) {
        ctx.fillText('Waiting', 115, canvas.height - (elevator.targetFloor * this.floorHeight) - 2);
      }
    });
  }
}

// Initialize elevator animator
const socket = io();
const animators = new ElevatorAnimator(socket, 3, 20);
animators.initializeSocketListeners();
animators.draw();
animators.updateUI(true);
animators.startSimulation();