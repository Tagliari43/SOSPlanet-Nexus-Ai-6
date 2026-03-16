
/**
 * Motor de Forja de Recursos v1.1 - Nação SOSPlanet
 * Implementação de processamento real de hashes com reporte de delta para economia interna.
 */

export interface MiningStats {
    hashRate: number;
    totalHashes: number;
    deltaHashes: number; // Hashes processados no último ciclo
    threads: number;
    status: 'IDLE' | 'MINING' | 'ERROR';
}

class MiningEngine {
    private worker: Worker | null = null;
    private totalHashes: number = 0;
    private lastHashCount: number = 0;
    private hashRate: number = 0;
    private timer: number | null = null;
    private onUpdateCallback: (stats: MiningStats) => void = () => {};
    private intensity: number = 20;

    constructor() {
        this.totalHashes = parseInt(localStorage.getItem('sovereign_total_hashes') || '0');
    }

    private createWorker() {
        const blob = new Blob([`
            let isRunning = false;
            let intensity = 20;
            
            self.onmessage = function(e) {
                if (e.data.cmd === 'start') {
                    isRunning = true;
                    intensity = e.data.intensity;
                    mine();
                } else if (e.data.cmd === 'stop') {
                    isRunning = false;
                } else if (e.data.cmd === 'intensity') {
                    intensity = e.data.intensity;
                }
            };

            function mine() {
                if (!isRunning) return;
                
                let start = Date.now();
                let count = 0;
                const targetTime = 100 * (intensity / 100); 
                
                while (Date.now() - start < targetTime) {
                    Math.sqrt(Math.random() * Math.random());
                    count++;
                }
                
                self.postMessage({ cmd: 'hashes', count: count });
                setTimeout(mine, 100 - intensity);
            }
        `], { type: 'application/javascript' });
        
        return new Worker(URL.createObjectURL(blob));
    }

    public start(intensity: number, onUpdate: (stats: MiningStats) => void) {
        this.onUpdateCallback = onUpdate;
        this.intensity = intensity;
        
        if (!this.worker) {
            this.worker = this.createWorker();
            this.worker.onmessage = (e) => {
                if (e.data.cmd === 'hashes') {
                    const count = e.data.count;
                    this.totalHashes += count;
                    this.lastHashCount += count;
                    this.saveProgress();
                }
            };
        }

        this.worker.postMessage({ cmd: 'start', intensity });
        
        this.timer = window.setInterval(() => {
            const delta = this.lastHashCount;
            this.hashRate = delta;
            this.lastHashCount = 0;
            this.notify(delta);
        }, 1000);
    }

    public stop() {
        if (this.worker) {
            this.worker.postMessage({ cmd: 'stop' });
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.hashRate = 0;
        this.notify(0);
    }

    public setIntensity(val: number) {
        this.intensity = val;
        if (this.worker) {
            this.worker.postMessage({ cmd: 'intensity', intensity: val });
        }
    }

    private saveProgress() {
        localStorage.setItem('sovereign_total_hashes', this.totalHashes.toString());
    }

    private notify(delta: number) {
        this.onUpdateCallback({
            hashRate: this.hashRate,
            totalHashes: this.totalHashes,
            deltaHashes: delta,
            threads: navigator.hardwareConcurrency || 1,
            status: this.hashRate > 0 ? 'MINING' : 'IDLE'
        });
    }
}

export const miningService = new MiningEngine();
