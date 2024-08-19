class graphData {
    constructor(canvasId, lines) {
        this.dataLengthLimit = 300;
        this.dumOfDataSets = lines.length;
        this.canvas = document.getElementById(canvasId);
        this.canvas.height = 75;
        let myDatasets = lines.map(lin => {
            return {
                label: lin.label,
                backgroundColor: lin.color,
                borderColor: lin.color,
                pointRadius : 0,
                data: new Array(dataLengthLimit).fill(undefined),
            }
        });
        this.chart = new Chart(
            this.canvas,
            {
                type: 'line',
                data: {
                    labels: new Array(dataLengthLimit).fill(''),
                    datasets: myDatasets
                },
                options: { animation: {duration: 0} }
            }
        );        
    }
    addData() {
        if (arguments.length != this.numOfDataSets) {
            console.error('Wrong number of arguments. Must provide 1 for each line on the graph.');
        }
        this.chart.data.labels.push('');
        arguments.forEach((arg, i) => {
            this.chart.data.datasets[i].data.push(arg);
        });
        this.chart.update();
        if (this.chart.data.labels.length > dataLengthLimit) {
            this.chart.data.labels.splice(0, 1);
            arguments.forEach((arg, i) => {
                this.chart.data.datasets[i].data.splice(0, 1);
            });
        }
    }
}