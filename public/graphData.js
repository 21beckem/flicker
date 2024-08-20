class graphData {
    constructor(canvasId, lines) {
        this.dataLengthLimit = 300;
        this.numOfDataSets = lines.length;
        this.canvas = document.getElementById(canvasId);
        this.canvas.height = 75;
        let myDatasets = lines.map(lin => {
            return {
                label: lin.label,
                backgroundColor: lin.color,
                borderColor: lin.color,
                pointRadius : 0,
                data: new Array(this.dataLengthLimit).fill(undefined),
            }
        });
        this.chart = new Chart(
            this.canvas,
            {
                type: 'line',
                data: {
                    labels: new Array(this.dataLengthLimit).fill(''),
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
    
        // Check if the data length exceeds the limit
        if (this.chart.data.labels.length > this.dataLengthLimit) {
            this.chart.data.labels.shift();
            for (let i = 0; i < this.numOfDataSets; i++) {
                this.chart.data.datasets[i].data.shift();
            }
        }
    
        // Update the chart
        this.chart.update();
    }
}