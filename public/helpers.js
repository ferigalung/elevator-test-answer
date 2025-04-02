function getElapsedTime(startTime, finishTime) {
    const diff = finishTime - startTime;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    let result = [];
    
    if (hours > 0) {
      result.push(`${hours} hours`);
    }
    if (remainingMinutes > 0) {
      result.push(`${remainingMinutes} minutes`);
    }
    if (remainingSeconds > 0) {
      result.push(`${remainingSeconds} seconds`);
    }
    
    return result.join(' ') || '0 seconds';
  }
