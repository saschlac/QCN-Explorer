// QCN Web Simulator
// This file is part of the QCN Web Simulator, which is based on EmBOINC
// 
// Copyright (C) 2013 University of Delaware
//
// QCN Web Simulator is free software; you can redistribute it and/or modify it
// under the terms of the GNU Lesser General Public License
// as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// QCN Web Simulator is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with QCN Web Simulator.  If not, see <http://www.gnu.org/licenses/>.
//
// Filename: animation.js
// Author: Sam Schlachter
// Description: This file 

// Load the Visualization API and the piechart package.
google.load('visualization', '1', {'packages':['corechart']});
    
// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(getResultsData);

var map = null;
var num_tabs = 5;
var results = [];

//TODO: Replace colors
var COLORS = [	["ffffff"],
				["bfccff"],
				["a0e6ff"],
				["80ffff"],
				["7aff93"],
				["ffff00"],
				["ffc800"],
				["ff9100"],
				["ff0000"],
				["c80000"]];

var markers = new Array();

var sensors;
var quake;

var start_time = 0;
var end_time = 35;
var current_time = 0;
var timer = null;

function getResultsData(){
	$.ajax({
		url: siteURL + "get_animation_data.php?&id="+sim_id,
		dataType:"json",
		success: function(data){
			$("#rawData").val(JSON.stringify(data));
			
			if(location.hash == "#data"){
				show_table(5);
			}
			else if(location.hash == "#chart1"){
				show_table(2);
			}
			else if(location.hash == "#chart2"){
				show_table(3);
			}
			else if(location.hash == "#chart3"){
				show_table(4);
			}
			else{
				location.hash = "animation";
			}
			
			initAnimation(data);
			initCharts(data);
		}
	});
}

//--------- Animation  --------------//

function initAnimation(json) {
	
	sensors = json.sensors;
	quakes = json.quakes;
	map = json.map;
	
	// Init map
	var latlng = new google.maps.LatLng(map.location.lat, map.location.lng);
	var myStyles =[
	    {
	        featureType: "poi",
	        elementType: "labels",
	        stylers: [
	              { visibility: "off" }
	        ]
	    }
    ];
	var myOptions = {zoom: parseInt(map.zoom),
					 center: latlng,
					 streetViewControl: false,
					 mapTypeId: map.mapType,
					 styles: myStyles};
	map = new google.maps.Map(document.getElementById("map_canvas"),myOptions);
	
	// Init quakes
	quakes.forEach(function(element, index, array){
		var quakeLoc = new google.maps.LatLng(element.location.lat, element.location.lng);
		var image = siteURL + "icon/q_icon.png";
		element.marker = new google.maps.Marker({position: quakeLoc, map: map, icon: image, visible: false});
	});
		
	findMaxTrigger();	
	
	//Set up markers
	initMarkers();
	
	google.maps.event.addListenerOnce(map, 'idle', function(){
    	//start playing the animation
    	play_pause();
    	google.maps.event.clearListeners(map, 'idle');
    });

}

function show_table(button_num){
    for(i =0;i<num_tabs;i++){
		$("#results_div_"+i).hide();
    }
	$("#results_div_"+button_num).show();
	
	switch(button_num){
	case 1: 
		google.maps.event.trigger(map, 'resize');
		location.hash = "animation";
	break;
	case 2: location.hash = "chart1"; break;
	case 3: location.hash = "chart2"; break;
	case 4: location.hash = "chart3"; break;
	case 5: location.hash = "data"; break;
	}
}

function findMaxTrigger(){
	
	sensors.forEach(function(element, index, array){
		element.triggers.forEach(function(element,index,array){
			if(element.time > end_time){			
				end_time = Math.round(element.time);
			}
			
		});
	});
}

function initMarkers(){
	sensors.forEach(function(element, index, array){
		var color = COLORS[0];
		var image = siteURL + 'icon/animation_markers/qa_'+ color + '.png';
		var location   = new google.maps.LatLng(element.location.lat, element.location.lng);
		
		element.marker = new google.maps.Marker({position: location, map: map, icon: image});
		element.lastColor = color;
	});
}

function updateMap(){
	//resetMap();
	current_time++;
		
	//if the animation is over restart it
	if(current_time > end_time){
		//resetMap();
		current_time = start_time;
	}
	
	quakes.forEach(function(element, index, array){
		//set the quakes visible if appropriate
		if(current_time >= element.time){
			element.marker.setVisible(true);
		}else{
			element.marker.setVisible(false);
		}		
	});

	
	//update the displayed time
	$("#timeVal").html(current_time);
	
	
	//go through all of the sensors and draw markers for them if triggers have occured
	sensors.forEach(function(element, index, array){
		var max_mag = 0;
		//Set color to white
		color = COLORS[0];
		
		element.triggers.forEach(function(element,index,array){
			if(element.time <= current_time){
				if(element.mag > max_mag){
					color = get_color(element.mag);
					max_mag = element.mag;
				}
			}
		});
		
		if(color != element.lastColor){
			var image = siteURL + 'icon/animation_markers/qa_'+ color + '.png';
			element.marker.setIcon(image);
			element.lastColor = color;
		}
		
		
		//markers.push(new google.maps.Marker({position: location, map: map, icon: image}));
	});
	
}

/*
	255,255,255 white
	191,204,255 light blue
	160,230,255 sky blue
	128,255,255 turquoise 
	122,255,147 sea foam green
	255,255,000 yellow
	255,200,000 yellow-orange
	255,145,000 orange
	255,000,000 bright red
	200,000,000 dark red
*/

function get_color(magnitude){

	if (magnitude < 0.001){
        return COLORS[0];
        }
    if (magnitude < 0.010){
        return COLORS[1];
        }
    if (magnitude < 0.070){
        return COLORS[2];
        }
    if (magnitude < 0.150){
        return COLORS[3];
        }
    if (magnitude < 0.400){
        return COLORS[4];
        }
    if (magnitude <  1.00){
        return COLORS[5];
        }
    if (magnitude <  3.60){
        return COLORS[6];
        }
    if (magnitude <  6.00){
        return COLORS[7];
        }
    if (magnitude <  9.00){
        return COLORS[8];
        }
    if (magnitude < 12.00){
        return COLORS[9];
        }	
}

function play_pause(){
	if(timer == null){
		play();
	}
	else{
		stop();	
	}

}

function play(){
	timer = window.setInterval(updateMap,350);
}

function stop(){
	window.clearInterval(timer);
	timer = null;	
}

function rewind(){
	current_time -= 2;
	update_map();
}

function reset_animation(){
	stop();
	current_time = end_time;
	updateMap();
}

//--------- Animation  --------------//
function initCharts(data){

	//Prepare data
	var histData = new Array();
	var chart1Data = new Array();
	var chart2Data = new Array();
	
	for(i = 0; i <= end_time; i++){
		histData.push([i,0]);
	}
	
	for(i in data.sensors){
		for(j in data.sensors[i].triggers){
			histData[Math.floor(data.sensors[i].triggers[j].time)][1]++;
			chart1Data.push([data.sensors[i].triggers[j].time,data.sensors[i].triggers[j].distance]);
			chart2Data.push([data.sensors[i].triggers[j].time,data.sensors[i].triggers[j].mag]);
		}
	}
	
	// Histogram
	var chart = new google.visualization.ColumnChart(document.getElementById('results_div_2'));
	chart.draw(
		google.visualization.arrayToDataTable(histData),
		{
			width: 811, height: 637,
			chartArea:{left:100,top:50,width:"85%",height:"75%"},
			hAxis: {title: 'Time (s)'},
			vAxis: {title: 'Number of Triggers'},
			legend: 'none'
		}
	);
	
	//Chart 1
	var chart = new google.visualization.ScatterChart(document.getElementById('results_div_3'));
	chart.draw(
		google.visualization.arrayToDataTable(chart1Data),
		{
			width: 811, height: 637,
			hAxis: {title: 'Time (s)', minValue: 0, maxValue: end_time},
			vAxis: {title: 'Hypocentral Distance (km)', minValue: 0, maxValue: 15},
			chartArea:{left:100,top:50,width:"85%",height:"75%"},
			legend: 'none',
			pointSize: 3
		}
	);
	
	//Chart 2
	var chart = new google.visualization.ScatterChart(document.getElementById('results_div_4'));
	chart.draw(
		google.visualization.arrayToDataTable(chart2Data),
		{
			width: 811, height: 637,
			hAxis: {title: 'Time (s)', minValue: 0, maxValue: end_time},
			vAxis: {title: 'Wave Amplitude (m/s/s)', minValue: 0, maxValue: 2},
			chartArea:{left:100,top:50,width:"85%",height:"75%"},
			legend: 'none',
			pointSize: 3
		}
	);
	
}