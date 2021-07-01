// Graph color settings
var total_color = "#A0A0A0"; // Gray
var human_color = "#00FF6D"; // Green
var malicious_color = "#CA7000"; // Orange
var diff_color = "#E0E000"; // Yellow

// Graph context settings
// Basically the "range" of the y-axis
var all_context = 500;
var bot_context = 50;
var diff_context = 5;

// How often to request data from the GLaDOS API (data is cached for five seconds)
var update_frequency = 5;
// Maximum hours of data to display before pruning old data
var hours = 1;

// Set chart display defaults
Chart.defaults.elements.line.borderWidth = 1;

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
				yAxisID: "all_players",
			},
			{
				label: "Total human players in-game",
				borderColor: human_color,
				pointBackgroundColor: human_color,
				pointBorderColor: human_color,
				yAxisID: "humans",
			},
			{
				label: "Total malicious bots in-game",
				borderColor: malicious_color,
				pointBackgroundColor: malicious_color,
				pointBorderColor: malicious_color,
				yAxisID: "malicious_bots"
			},
			{
				label: "Bot percentage",
				borderColor: diff_color,
				pointBackgroundColor: diff_color,
				pointBorderColor: diff_color,
				yAxisID: "difficulty"
			}
		]
	},
	options: {
		maintainAspectRatio: false,
		scales: {
			all_players: {
				axis: "y",
				position: "left",
				ticks: {
					display: false,
					includeBounds: false
				}
			},
			humans: {
				axis: "y",
				position: "left",
				ticks: {
					color: human_color,
					includeBounds: false
				}
			},
			malicious_bots: {
				axis: "y",
				position: "right",
				ticks: {
					color: malicious_color,
					includeBounds: false
				}
			},
			difficulty: {
				axis: "y",
				position: "right",
				ticks: {
					callback: function(value, index, values) {
						return value.toFixed(2) + "%";
					},
					color: diff_color,
					includeBounds: false
				}
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

			// Try to give meaningful numerical context to the y-axes
			// This code is cursed
			var all_max = Math.max.apply(Math, graph.data.datasets[0].data.slice(1));
			var all_min = Math.max(Math.min.apply(Math, graph.data.datasets[1].data.slice(1)), 0);
			var all_ctx = (all_context - (all_max - all_min) / 2);
			// If the difference between the maximum and minimum value is less than the scale,
			// _ctx should just be set to _context / 2
			if (all_max - all_min < all_context) {
				all_ctx = all_context / 2
			}
			var new_max = Math.max(all_max, all_max + all_ctx);
			var new_min = Math.min(all_min, all_min - all_ctx);
			//console.log("all: " + (new_max - new_min));
			graph.options.scales.all_players.max = new_max;
			graph.options.scales.all_players.min = new_min;
			graph.options.scales.humans.max = new_max;
			graph.options.scales.humans.min = new_min;

			var bot_max = Math.max.apply(Math, graph.data.datasets[2].data.slice(1));
			var bot_min = Math.max(Math.min.apply(Math, graph.data.datasets[2].data.slice(1)), 0);
			var bot_ctx = (bot_context - (bot_max - bot_min) / 2);
			// If the difference between the maximum and minimum value is less than the scale,
			// _ctx should just be set to _context / 2
			if (bot_max - bot_min < bot_context) {
				bot_ctx = bot_context / 2
			}
			var new_max = Math.max(bot_max, bot_max + bot_ctx);
			var new_min = Math.min(bot_min, bot_min - bot_ctx);
			//console.log("bot: " + (new_max - new_min));
			graph.options.scales.malicious_bots.max = new_max;
			graph.options.scales.malicious_bots.min = new_min;

			var diff_max = Math.max.apply(Math, graph.data.datasets[3].data.slice(1));
			var diff_min = Math.max(Math.min.apply(Math, graph.data.datasets[3].data.slice(1)), 0);
			var diff_ctx = (diff_context - (diff_max - diff_min) / 2);
			// If the difference between the maximum and minimum value is less than the scale,
			// _ctx should just be set to _context / 2
			if (diff_max - diff_min < diff_context) {
				diff_ctx = diff_context / 2
			}
			var new_max = Math.max(diff_max, diff_max + diff_ctx);
			var new_min = Math.min(diff_min, diff_min - diff_ctx);
			//console.log("diff: " + (new_max - new_min));
			graph.options.scales.difficulty.max = new_max;
			graph.options.scales.difficulty.min = new_min;

			graph.update();
		});
	counter += 1;
}

alert("This graph will update every 5 seconds with live data from the GLaDOS API.\nYou can change which lines are shown on the graph by clicking each label at the top of the page.\nEach line's y-axis will automatically scale based on its min/max values, so do pay attention to them!\nBy default, old data will start getting pruned after an hour.");

updateGraph();
setInterval(updateGraph, update_frequency * 1000);
