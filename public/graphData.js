ITTS = (tryThis, otherwiseThis) => { return typeof(tryThis) == 'undefined' ? otherwiseThis : tryThis; }
class graphData {
    constructor(canvasId, lines, options={}) {
        this.autoUpdate = ITTS(options.autoUpdate, true);
        this.liveData = ITTS(options.liveData, false);
        this.dataLengthLimit = this.liveData ? 300 : 0;
        this.numOfDataSets = lines.length;
        this.canvas = document.getElementById(canvasId);
        if (options.canvasHeight) this.canvas.height = options.canvasHeight;
        let datasetsDataArr = this.liveData ? new Array(this.dataLengthLimit).fill(undefined) : [];
        let myDatasets = lines.map(lin => {
            return {
                label: lin.label,
                backgroundColor: lin.color,
                borderColor: lin.color,
                pointRadius : 0,
                data: datasetsDataArr,
            }
        });
        this.chart = new Chart(
            this.canvas,
            {
                type: 'line',
                data: {
                    labels: new Array(datasetsDataArr.length).fill(''),
                    datasets: myDatasets
                },
                options: {
                    animation: false,
                    spanGaps: true
                }
            }
        );        
    }
    async addData(...args) {
        if (args.length !== this.numOfDataSets) {
            console.error('Wrong number of arguments. Must provide 1 for each line on the graph. You provided:', args.length, '. Expected:', this.numOfDataSets);
            return;
        }
    
        // Push new data and labels
        this.chart.data.labels.push('');
        for (let i = 0; i < this.numOfDataSets; i++) {
            this.chart.data.datasets[i].data.push(args[i]);
        }
    
        if (this.liveData) {
            // Check if the data length exceeds the limit
            if (this.chart.data.labels.length > this.dataLengthLimit) {
                this.chart.data.labels.shift();
                for (let i = 0; i < this.numOfDataSets; i++) {
                    this.chart.data.datasets[i].data.shift();
                }
            }
        }
    
        // Update the chart
        if (this.autoUpdate) { this.chart.update() }
    }
    async clearData() {
        this.chart.data.labels = new Array(this.dataLengthLimit).fill('');
        for (let i = 0; i < this.numOfDataSets; i++) {
            this.chart.data.datasets[i].data = new Array(this.dataLengthLimit).fill(undefined);
        }
        if (this.autoUpdate) { this.chart.update() }
    }
    async setData(...args) {
        if (args.length !== this.numOfDataSets) {
            console.error('Wrong number of arguments. Must provide 1 for each line on the graph. You provided:', args.length, '. Expected:', this.numOfDataSets);
            return;
        }
        for (let i = 0; i < this.numOfDataSets; i++) {
            this.chart.data.datasets[i].data = args[i];
        }
        if (this.autoUpdate) { this.chart.update() }
    }
    update() {
        this.chart.update();
    }
}