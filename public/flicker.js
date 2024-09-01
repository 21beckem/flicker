ITTS = (tryThis, otherwiseThis) => { return typeof(tryThis) == 'undefined' ? otherwiseThis : tryThis; }
class FlickerMate {
    constructor(config) {
        this.config = {
            statusElm: ITTS(config.statusElm, null),
            wakeLock: ITTS(config.wakeLock, true),
            sensorReadFreq: ITTS(config.sensorReadFreq, 60),
            onNewGyroData: ITTS(config.onNewGyroData, function(data){}),
            onNewAcelData: ITTS(config.onNewAcelData, function(data){})
        }
        this.gyroData = {};
        this.acelData = {};
        this.gyroCount = 0;
        this.acelCount = 0;

        this.init();
    }
    init() {
        // get wakelock done first
        if (this.config.wakeLock) {
            setInterval(this.turnOnWakeLock.bind(this), 1000);
        }

        // socket
        this.setStatusElm('<i class="fa-solid fa-link-slash"></i>');
        this.socket = io();
        this.browId = localStorage.getItem('browId') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('browId', this.browId);
        this.socket.on("connect", () => {
            this.setStatusElm('<i class="fa-solid fa-link"></i>');
            this.socket.emit('set-brow-id', this.browId);
        });

        this.socket.on("disconnect", () => {
            this.setStatusElm('<i class="fa-solid fa-link-slash"></i>');
        });

        // start up the sensors
        this.startSensors();

    }
    startSensors() {
        this.gyro = new Gyroscope({ frequency: this.config.sensorReadFreq });
        gyro.addEventListener("reading", (e) => {
            this.gyroData = {x: this.gyro.x, y: this.gyro.y, z: this.gyro.z};
            this.gyroCount++;
            this.config.onNewGyroData(this.gyroData);
        });
        this.gyro.start();

        this.acel = new Accelerometer({ frequency: this.config.sensorReadFreq });
        acel.addEventListener("reading", () => {
            this.acelData = {x: this.acel.x, y: this.acel.y, z: this.acel.z};
            this.acelCount++;
            this.config.onNewAcelData(this.acelData);
        });
        this.acel.start();
    }
    async turnOnWakeLock() {
        try{
            await navigator.wakeLock.request("screen");
            if (!window.globalThis.alreadyAlertedAboutWakeLock) {
                alert('Wake Lock enabled');
                window.globalThis.alreadyAlertedAboutWakeLock = true;
            }
        }catch(err){
            alert('Wake Lock not supported');
        }
    }
    setStatusElm(status) {
        if (!this.config.statusElm) return;
        this.config.statusElm.innerHTML = status;
    }

    async loadModel(modelNam) {
        ml5.setBackend("webgl");
        classifier = ml5.neuralNetwork({
            task: "classification"
        });

        // load model
        this.isModelLoaded = false;
        this.classifier.load({
            model: `models/${modelNam}/model.json`,
            metadata: `models/${modelNam}/model_meta.json`,
            weights: `models/${modelNam}/model.weights.bin`
        }, () => {
            this.isModelLoaded = true;
        });
    }
}