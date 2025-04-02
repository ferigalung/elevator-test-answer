const canvas = document.getElementById('elevatorCanvas');
const ctx = canvas.getContext('2d');


class ElevatorAnimator {
  constructor(elevatorCount) {
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

      ctx.beginPath();
      ctx.moveTo(110, y)
      ctx.lineTo(110, y+canvas.height)
      ctx.stroke();
    }

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

// Socket communication
const socket = io();
const animators = new ElevatorAnimator(3);
animators.draw();

socket.on('elevatorMove', ({ id, from, to, isPickup }) => {
  animators.elevators[id].currentFloor = from - 1;
  animators.elevators[id].isPickup = isPickup;
  animators.elevators[id].targetFloor = to - 1;
  animators.animate(id);
});

socket.on('elevatorArrived', ({ id, floor, isPickup }) => {
  animators.elevators[id].isPickup = isPickup;
  animators.elevators[id].currentFloor = floor - 1;
  animators.draw();
});

// Generate 100 people (Requirement 5)
// function generatePeople(count) {
//   return Array.from({ length: count }, () => {
//     let from, to;
//     do {
//       from = Math.floor(Math.random() * 50) + 1;
//       to = Math.floor(Math.random() * 50) + 1;
//     } while (from === to);
//     return { from, to };
//   });
// }

const peopleQueue = mans;
peopleQueue.forEach(person => {
  socket.emit('requestFloor', person.from, person.to)
});