class Process {
    constructor(pid, name, cpuTime, arrivalTime, quantum) {
        this.pid = pid;
        this.name = name;
        this.cpuTime = parseInt(cpuTime);
        this.remainingTime = parseInt(cpuTime);
        this.arrivalTime = parseInt(arrivalTime);
        this.quantum = parseInt(quantum);
        this.status = 'new'; // new, ready, running, waiting, terminated
        this.startTime = null;
        this.endTime = null;
        this.waitingTime = 0;
        this.responseTime = null;
    }
}