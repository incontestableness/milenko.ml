// How often to request data from the GLaDOS API (data is cached for five seconds)
var update_frequency = 5;
// Maximum hours of data to display before pruning old data
var hours = 2;

// Graph color settings
var total_color = "#A0A0A0"; // Gray
var human_color = "#00FF6D"; // Green
var malicious_color = "#CA7000"; // Orange
var diff_color = "#E0E000"; // Yellow

// Line thickness
Chart.defaults.elements.line.borderWidth = 1;
// Point size
var pointSize = 2;

// All of our scales are y-axes
Chart.defaults.scales.linear.axis = "y";
// Start y-axes at zero
Chart.defaults.scales.linear.min = 0;
// Don't include weird max values in the y-axes
Chart.defaults.scales.linear.ticks.includeBounds = false;

// Graph title display settings
Chart.defaults.plugins.title.color = "#E00050";
Chart.defaults.plugins.title.padding = 0;
fetch("https://milenko.ml/api/debug")
	.then(response => response.json())
	.then(json => {
			Chart.defaults.plugins.title.text = "GLaDOS API v" + json["response"]["debug_info"]["version"] + " Live Statistics";
		}
	);

// Create graph
var canvas = document.getElementById("graph").getContext("2d");
var graph = new Chart(canvas, {
	type: "line",
	data: {
		datasets: [
			{
				label: "Total casual players in-game",
				borderColor: total_color,
				pointBackgroundColor: total_color,
				pointBorderColor: total_color,
				pointRadius: pointSize,
				yAxisID: "all_players",
			},
			{
				label: "Total human players in-game",
				borderColor: human_color,
				pointBackgroundColor: human_color,
				pointBorderColor: human_color,
				pointRadius: pointSize,
				yAxisID: "all_players",
			},
			{
				label: "Total malicious bots in-game",
				borderColor: malicious_color,
				pointBackgroundColor: malicious_color,
				pointBorderColor: malicious_color,
				pointRadius: pointSize,
				yAxisID: "malicious_bots"
			},
			{
				label: "Bot percentage",
				borderColor: diff_color,
				pointBackgroundColor: diff_color,
				pointBorderColor: diff_color,
				pointRadius: pointSize,
				yAxisID: "difficulty"
			}
		]
	},
	options: {
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
			}
		},
		scales: {
			all_players: {
				position: "left",
				ticks: {
					// Don't display tick values as e.g. 7,000.0000000000010
					callback: function(value, index, values) {
						// Strip decimal, convert str to int, convert int to comma string
						return parseInt(value.toFixed(0)).toLocaleString();
					},
					color: human_color,
					stepSize: 250
				},
				// Give the graph some headroom
				suggestedMax: 10000
			},
			malicious_bots: {
				position: "right",
				ticks: {
					color: malicious_color,
					stepSize: 25
				},
				suggestedMax: 1000
			},
			difficulty: {
				position: "right",
				ticks: {
					// Pad the percentages to two decimal places and add a percent sign
					callback: function(value, index, values) {
						return value.toFixed(2) + "%";
					},
					color: diff_color,
					stepSize: 0.25
				},
				suggestedMax: 10
			}
		}
	}
});

// Deletes the oldest data points from the graph
function prune() {
	graph.data.labels.shift();
	graph.data.datasets.forEach(
		(dataset) => {
			dataset.data.shift();
		}
	);
	graph.update();
	counter -= 1;
}

// Get data from API and insert into graph
var counter = 0;
function updateGraph() {
	var time = new Date().toTimeString().split(" ")[0];
	fetch("https://milenko.ml/api/stats")
		.then(response => response.json())
		.then(json => {
			var ingame = json["response"]["casual_in_game"];
			var all_players = ingame["totals"]["all_players"]
			var malicious_bots = ingame["totals"]["malicious_bots"]
			graph.data.datasets[0].data[counter] = all_players;
			graph.data.datasets[1].data[counter] = all_players - malicious_bots;
			graph.data.datasets[2].data[counter] = malicious_bots;
			graph.data.datasets[3].data[counter] = (malicious_bots / all_players) * 100 || 0;
			graph.data.labels[counter] = time;

			// The maximum number of datapoints to display
			var data_limit = (hours * 60 * 60) / update_frequency;
			// Prune excess data
			while (graph.data.datasets[0].data.length > data_limit) {
				prune();
			}

			graph.update();
		});
	counter += 1;
}

alert("This graph will update every 5 seconds with live data from the GLaDOS API.\nYou can change which lines are shown on the graph by clicking the labels at the top of the page.\nThe y-axes may automatically increase based on the current datasets, so do pay them some mind.\nBy default, old data will start getting pruned after two hours. You can change this behavior via window.hours in the console.");

updateGraph();
setInterval(updateGraph, update_frequency * 1000);
