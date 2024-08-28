const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const trimRange = document.getElementById('trim-range');
const downloadButton = document.getElementById('download-button');

// Set this constant to the desired output length of the array
const OUTPUT_LENGTH = 60; // You can change this value as needed

let filesData = {};
let currentFile = null;
let currentData = [];

let datasets = [
    {label: 'X', color: 'red'},
    {label: 'Y', color: 'green'},
    {label: 'Z', color: 'blue'}
];
let options = {
    autoUpdate: false,
    canvasHeight: ((window.innerHeight - 100) / 2)
}
const gyroChart = new graphData('GyroChart', datasets, options);
const acelChart = new graphData('AcelChart', datasets, options);


fileInput.addEventListener('change', handleFiles);
fileList.addEventListener('click', handleFileSelection);
trimRange.addEventListener('input', updateTrimmedData);
downloadButton.addEventListener('click', downloadTrimmedFile);
document.addEventListener('keydown', handleArrowKeys);

function handleFiles(event) {
    const files = event.target.files;
    fileList.innerHTML = ''; // Clear previous files
    filesData = {}; // Reset data

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                filesData[file.name] = data;
                const li = document.createElement('li');
                li.textContent = file.name;
                fileList.appendChild(li);
                console.log('data-length:', data.length);
            } catch (err) {
                console.error("Error parsing JSON:", err);
            }
        };
        reader.readAsText(file);
    });
}

function handleFileSelection(event) {
    const fileName = event.target.textContent;
    if (filesData[fileName]) {
        currentFile = fileName;
        currentData = filesData[fileName];

        // Highlight selected file
        Array.from(fileList.children).forEach(li => li.classList.remove('selected'));
        event.target.classList.add('selected');

        // Adjust the slider's max value based on the possible trim start positions
        trimRange.max = Math.max(0, currentData.length - OUTPUT_LENGTH);
        trimRange.value = 0; // Reset slider
        trimRange.focus();

        // Update the graph with the initial trimmed data
        updateTrimmedData();
    }
}

function updateTrimmedData() {
    if (!currentData.length) return;

    const startIndex = parseInt(trimRange.value);
    const trimmedData = currentData.slice(startIndex, startIndex + OUTPUT_LENGTH);

    // Call the graphData function with the trimmed data
    graphArr(trimmedData);
}

function downloadTrimmedFile() {
    if (!currentData.length) return;

    const startIndex = parseInt(trimRange.value);
    const trimmedData = currentData.slice(startIndex, startIndex + OUTPUT_LENGTH);

    const blob = new Blob([JSON.stringify(trimmedData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile.replace(/\.[^/.]+$/, "")}-trimmed.json`;
    a.click();
    URL.revokeObjectURL(url); // Clean up

    // Automatically select the next file after download
    selectNextFile();
}
function selectPreviousFile() {
    const selectedLi = document.querySelector('#file-list li.selected');
    if (selectedLi && selectedLi.previousElementSibling) {
        selectedLi.previousElementSibling.click();
        trimRange.focus();
    }
}
function selectNextFile() {
    const selectedLi = document.querySelector('#file-list li.selected');
    if (selectedLi && selectedLi.nextElementSibling) {
        selectedLi.nextElementSibling.click();
        trimRange.focus();
    }
}
function handleArrowKeys(event) {
    if (event.key === 'ArrowDown') {
        selectNextFile();
    } else if (event.key === 'ArrowUp') {
        selectPreviousFile();
    }
}


async function graphArr(arr) {
    gyroChart.clearData();
    acelChart.clearData();
    for (const el of arr) {
        await gyroChart.addData(el.gyro.x, el.gyro.y, el.gyro.z);
        await acelChart.addData(el.acel.x, el.acel.y, el.acel.z);
    }
    gyroChart.update();
    acelChart.update();
}