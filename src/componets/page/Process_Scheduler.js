class ProcessScheduler {
    constructor() {
        this.processes = [];
        this.readyQueue = [];
        this.finishedProcesses = [];
        this.currentProcess = null;
        this.currentTime = 0;
        this.algorithm = 'fcfs';
        this.intervalId = null;
        this.simulationSpeed = 1000; // 1 segundo por unidad de tiempo
        this.isRunning = false;
        this.history = [];
        this.quantumCounter = 0;
        this.nextPid = 1;
    }

    addProcess(name, cpuTime, arrivalTime, quantum) {
        const process = new Process(this.nextPid++, name, cpuTime, arrivalTime, quantum);
        this.processes.push(process);
        this.logHistory(`Proceso creado: ${process.name} (PID: ${process.pid})`);
        return process;
    }

    generateRandomProcesses(count) {
        const processNames = ['Browser', 'TextEditor', 'MediaPlayer', 'Antivirus', 'Compiler', 'FileManager', 'Game', 'Calculator', 'EmailClient', 'VideoEditor'];

        for (let i = 0; i < count; i++) {
            const name = processNames[Math.floor(Math.random() * processNames.length)] + (i + 1);
            const cpuTime = Math.floor(Math.random() * 10) + 1;
            const arrivalTime = Math.floor(Math.random() * 5);
            const quantum = Math.floor(Math.random() * 3) + 1;

            this.addProcess(name, cpuTime, arrivalTime, quantum);
        }

        this.logHistory(`${count} procesos aleatorios generados`);
    }

    removeProcess(pid) {
        const index = this.processes.findIndex(p => p.pid === pid);
        if (index !== -1) {
            const process = this.processes[index];
            this.processes.splice(index, 1);
            this.logHistory(`Proceso eliminado: ${process.name} (PID: ${process.pid})`);
            return true;
        }
        return false;
    }

    startSimulation(algorithm) {
        if (this.processes.length === 0) {
            alert('No hay procesos para simular');
            return;
        }

        if (this.isRunning) {
            this.stopSimulation();
        }

        this.algorithm = algorithm;
        this.isRunning = true;
        this.currentTime = 0;
        this.readyQueue = [];
        this.finishedProcesses = [];
        this.currentProcess = null;
        this.history = [];
        this.quantumCounter = 0;

        // Ordenar procesos por tiempo de llegada
        this.processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

        this.logHistory(`Simulación iniciada con algoritmo: ${this.getAlgorithmName()}`);
        this.runSimulation();
    }

    runSimulation() {
        this.intervalId = setInterval(() => {
            this.currentTime++;
            this.updateProcessQueues();
            this.executeCPU();
            this.updateDisplay();

            // Verificar si todos los procesos han terminado
            if (this.finishedProcesses.length === this.processes.length) {
                this.stopSimulation();
                this.calculateStatistics();
            }
        }, this.simulationSpeed);
    }

    stopSimulation() {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.logHistory('Simulación finalizada');
    }

    pauseSimulation() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            this.logHistory('Simulación pausada');
        }
    }

    resumeSimulation() {
        if (!this.isRunning && this.finishedProcesses.length < this.processes.length) {
            this.isRunning = true;
            this.runSimulation();
            this.logHistory('Simulación reanudada');
        }
    }

    resetSimulation() {
        this.stopSimulation();
        this.processes.forEach(process => {
            process.remainingTime = process.cpuTime;
            process.status = 'new';
            process.startTime = null;
            process.endTime = null;
            process.waitingTime = 0;
            process.responseTime = null;
        });
        this.readyQueue = [];
        this.finishedProcesses = [];
        this.currentProcess = null;
        this.currentTime = 0;
        this.history = [];
        this.quantumCounter = 0;

        // Limpiar el grid del historial en la UI
        this.clearHistoryGrid();

        this.logHistory('Simulación reiniciada');
        this.updateDisplay();
    }

    clearHistoryGrid() {
        const historyLog = document.getElementById('historyLog');
        if (historyLog) {
            historyLog.innerHTML = ''; // Limpiar todo el contenido
        }
    }

    updateProcessQueues() {
        // Agregar procesos que han llegado a la cola de listos
        this.processes.forEach(process => {
            if (process.status === 'new' && process.arrivalTime <= this.currentTime) {
                process.status = 'ready';
                this.readyQueue.push(process);
                this.logHistory(`Proceso ${process.name} llegó al sistema y está en cola de listos`);
            }
        });
    }

    sortReadyQueue() {
        switch (this.algorithm) {
            case 'fcfs':
                // First-Come, First-Served: ya está ordenado por tiempo de llegada
                break;

            case 'sjf':
                // SJF: ordenar por tiempo de CPU, y por tiempo de llegada como desempate
                this.readyQueue.sort((a, b) => {
                    if (a.cpuTime !== b.cpuTime) {
                        return a.cpuTime - b.cpuTime;
                    }
                    if (a.arrivalTime !== b.arrivalTime) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return a.pid - b.pid;
                });
                break;

            case 'srtf':
                // Shortest Remaining Time First: ordenar por tiempo restante
                this.readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);

                // Si hay un proceso en ejecución con más tiempo restante que otro en la cola, hacer preemption
                if (this.currentProcess && this.readyQueue.length > 0) {
                    const shortestProcess = this.readyQueue[0];
                    if (shortestProcess.remainingTime < this.currentProcess.remainingTime) {
                        this.logHistory(`Preemption: ${this.currentProcess.name} es reemplazado por ${shortestProcess.name}`);
                        this.currentProcess.status = 'ready';
                        this.readyQueue.push(this.currentProcess);
                        this.readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
                        this.currentProcess = null;
                    }
                }
                break;

            case 'rr':
                // Round Robin: ordenar por tiempo de llegada (FCFS)
                this.readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime);
                break;
        }
    }

    executeCPU() {
        // Si no hay proceso en ejecución, tomar uno de la cola de listos
        if (!this.currentProcess && this.readyQueue.length > 0) {
            // PARA SJF: Asegurar que la cola esté ordenada antes de tomar una decisión
            if (this.algorithm === 'sjf') {
                this.sortReadyQueue();
            }

            this.currentProcess = this.readyQueue.shift();
            this.currentProcess.status = 'running';

            if (this.currentProcess.startTime === null) {
                this.currentProcess.startTime = this.currentTime;
                this.currentProcess.responseTime = this.currentTime - this.currentProcess.arrivalTime;
            }

            this.quantumCounter = 0;
            this.logHistory(`CPU comenzó a ejecutar: ${this.currentProcess.name}`);
        }

        // Ejecutar el proceso actual
        if (this.currentProcess) {
            this.currentProcess.remainingTime--;
            this.quantumCounter++;
            this.logHistory(`CPU ejecutando: ${this.currentProcess.name} (Tiempo restante: ${this.currentProcess.remainingTime})`);

            // Verificar si el proceso ha terminado
            if (this.currentProcess.remainingTime === 0) {
                this.currentProcess.status = 'terminated';
                this.currentProcess.endTime = this.currentTime;
                this.finishedProcesses.push(this.currentProcess);
                this.logHistory(`Proceso completado: ${this.currentProcess.name}`);
                this.currentProcess = null;
                this.quantumCounter = 0;
                return;
            }

            // Verificar condiciones de interrupción según el algoritmo
            if (this.algorithm === 'rr' && this.quantumCounter >= this.currentProcess.quantum) {
                this.logHistory(`Quantum agotado para: ${this.currentProcess.name}`);
                this.currentProcess.status = 'ready';
                this.readyQueue.push(this.currentProcess);
                this.currentProcess = null;
                this.quantumCounter = 0;
            }
        }

        // Incrementar tiempo de espera para procesos en cola de listos
        this.readyQueue.forEach(process => {
            process.waitingTime++;
        });
    }

    calculateStatistics() {
        let totalWaitTime = 0;
        let totalResponseTime = 0;
        let totalTurnaroundTime = 0;

        this.finishedProcesses.forEach(process => {
            totalWaitTime += process.waitingTime;
            totalResponseTime += process.responseTime;
            totalTurnaroundTime += (process.endTime - process.arrivalTime);
        });

        const avgWaitTime = totalWaitTime / this.finishedProcesses.length;
        const avgResponseTime = totalResponseTime / this.finishedProcesses.length;
        const avgTurnaroundTime = totalTurnaroundTime / this.finishedProcesses.length;

        this.logHistory('=== ESTADÍSTICAS FINALES ===');
        this.logHistory(`Tiempo promedio de espera: ${avgWaitTime.toFixed(2)} unidades`);
        this.logHistory(`Tiempo promedio de respuesta: ${avgResponseTime.toFixed(2)} unidades`);
        this.logHistory(`Tiempo promedio de retorno: ${avgTurnaroundTime.toFixed(2)} unidades`);
    }

    logHistory(message) {
        const entry = `[T${this.currentTime}] ${message}`;
        this.history.push(entry);

        // Actualizar visualización del historial
        const historyLog = document.getElementById('historyLog');
        if (historyLog) {
            const entryElement = document.createElement('div');
            entryElement.className = 'history-entry';
            entryElement.textContent = entry;
            historyLog.appendChild(entryElement);
            historyLog.scrollTop = historyLog.scrollHeight;
        }

        console.log(entry);
    }

    getAlgorithmName() {
        switch (this.algorithm) {
            case 'fcfs': return 'FCFS (First-Come, First-Served)';
            case 'sjf': return 'SJF (Shortest Job First)';
            case 'srtf': return 'SRTF (Shortest Remaining Time First)';
            case 'rr': return 'Round Robin';
            default: return 'Desconocido';
        }
    }

    updateDisplay() {
        // Actualizar tiempo actual
        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            currentTimeElement.textContent = `Tiempo actual: ${this.currentTime} unidades`;
        }

        // Actualizar proceso en CPU
        const cpuProcessElement = document.getElementById('cpuProcess');
        if (cpuProcessElement) {
            if (this.currentProcess) {
                cpuProcessElement.textContent = `${this.currentProcess.name} (PID: ${this.currentProcess.pid}) - Tiempo restante: ${this.currentProcess.remainingTime}`;
                cpuProcessElement.className = 'executing';
            } else {
                cpuProcessElement.textContent = 'Ningún proceso en ejecución';
                cpuProcessElement.className = '';
            }
        }

        // Actualizar cola de listos
        const readyQueueElement = document.getElementById('readyQueue');
        if (readyQueueElement) {
            readyQueueElement.innerHTML = '';
            this.readyQueue.forEach(process => {
                const processElement = document.createElement('div');
                processElement.className = 'process-item';
                processElement.innerHTML = `
                    <strong>${process.name}</strong> (PID: ${process.pid})<br>
                    Tiempo restante: ${process.remainingTime}<br>
                    Tiempo de espera: ${process.waitingTime}
                `;
                readyQueueElement.appendChild(processElement);
            });

            if (this.readyQueue.length === 0) {
                readyQueueElement.innerHTML = '<div class="process-item">No hay procesos en cola de listos</div>';
            }
        }

        // Actualizar procesos finalizados
        const finishedQueueElement = document.getElementById('finishedQueue');
        if (finishedQueueElement) {
            finishedQueueElement.innerHTML = '';
            this.finishedProcesses.forEach(process => {
                const processElement = document.createElement('div');
                processElement.className = 'process-item finished';
                processElement.innerHTML = `
                    <strong>${process.name}</strong> (PID: ${process.pid})<br>
                    Tiempo de finalización: ${process.endTime}
                `;
                finishedQueueElement.appendChild(processElement);
            });

            if (this.finishedProcesses.length === 0) {
                finishedQueueElement.innerHTML = '<div class="process-item">No hay procesos finalizados</div>';
            }
        }
    }
}


// Inicializar el planificador
const scheduler = new ProcessScheduler();

// Configurar event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const addProcessBtn = document.getElementById('addProcess');
    const generateRandomBtn = document.getElementById('generateRandom');
    const startSimulationBtn = document.getElementById('startSimulation');
    const resetSimulationBtn = document.getElementById('resetSimulation');
    const pauseSimulationBtn = document.getElementById('pauseSimulation');
    const resumeSimulationBtn = document.getElementById('resumeSimulation');
    const algorithmSelect = document.getElementById('algorithm');
    const processTableBody = document.getElementById('processTableBody');

    // Función para actualizar la tabla de procesos
    function updateProcessTable() {
        processTableBody.innerHTML = '';
        scheduler.processes.forEach(process => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td>${process.cpuTime}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.quantum}</td>
                <td><button class="delete-btn" data-pid="${process.pid}">Eliminar</button></td>
            `;
            processTableBody.appendChild(row);
        });

        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const pid = parseInt(this.getAttribute('data-pid'));
                scheduler.removeProcess(pid);
                updateProcessTable();
            });
        });
    }

    // Event listener para agregar proceso
    addProcessBtn.addEventListener('click', function () {
        const name = document.getElementById('processName').value || `Proceso ${scheduler.nextPid}`;
        const cpuTime = document.getElementById('cpuTime').value;
        const arrivalTime = document.getElementById('arrivalTime').value;
        const quantum = document.getElementById('quantumTime').value;

        if (cpuTime && arrivalTime >= 0 && quantum) {
            scheduler.addProcess(name, cpuTime, arrivalTime, quantum);
            updateProcessTable();

            // Limpiar campos
            document.getElementById('processName').value = '';
            document.getElementById('cpuTime').value = '3';
            document.getElementById('arrivalTime').value = '0';
        } else {
            alert('Por favor, complete todos los campos correctamente.');
        }
    });

    // Event listener para generar procesos aleatorios
    generateRandomBtn.addEventListener('click', function () {
        scheduler.generateRandomProcesses(5);
        updateProcessTable();
    });

    // Event listener para iniciar simulación
    startSimulationBtn.addEventListener('click', function () {
        const algorithm = algorithmSelect.value;
        scheduler.startSimulation(algorithm);

        // Habilitar/deshabilitar botones
        pauseSimulationBtn.disabled = false;
        resumeSimulationBtn.disabled = true;
        startSimulationBtn.disabled = true;
        resetSimulationBtn.disabled = false;
    });

    // Event listener para pausar simulación
    pauseSimulationBtn.addEventListener('click', function () {
        scheduler.pauseSimulation();
        pauseSimulationBtn.disabled = true;
        resumeSimulationBtn.disabled = false;
    });

    // Event listener para reanudar simulación
    resumeSimulationBtn.addEventListener('click', function () {
        scheduler.resumeSimulation();
        pauseSimulationBtn.disabled = false;
        resumeSimulationBtn.disabled = true;
    });

    // Event listener para reiniciar simulación
    resetSimulationBtn.addEventListener('click', function () {
        scheduler.resetSimulation();
        updateProcessTable();

        // Habilitar/deshabilitar botones
        pauseSimulationBtn.disabled = true;
        resumeSimulationBtn.disabled = true;
        startSimulationBtn.disabled = false;
        resetSimulationBtn.disabled = false;
    });

    // Inicializar la tabla de procesos
    updateProcessTable();
});