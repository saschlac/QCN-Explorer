/*
 * QCN Explorer
 *
 * This file is part of the QCN Web Simulator, which is based on EmBOINC
 *
 * Copyright (C) 2013 University of Delaware
 *
 * QCN Explorer is licensed under the Creative Commons Attribution-NonCommercial
 * 3.0 Unported License. To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/3.0/ or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 *
 * QCN Web Simulator is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * Filename: editor.js
 * Author: Sam Schlachter
 * Description: 
 *
 */

// Load Libraries
google.load("maps", "3",  {other_params:"sensor=true"});

//--- Global Values ---//
var currentSimID = 0;
var map;
var currentSensorType = -1;
var totalSensorTypes = 0;
var currentUserID = 0;
var sim_params;
var tutorial = false;



//Tables
var markerTable;
var quakeTable;
var buttonTable;

//Color Table
var COLORS = [["black","#000000"],["red", "#ff0000"], ["blue", "#0000ff"], ["purple", "#ff00ff"], ["orange", "#ff8800"], ["green","#00ff00"], ["gray","#888888"], ["yellow","#ffff00"],  ["brown","#888800"]];
var icons = ["icon/Bmd.png","icon/Bsu.png","icon/Bmu.png","icon/button_quake_down.png","icon/Bpd.png","icon/button_quake_up.png","icon/Bpu.png","icon/close.png","icon/q_icon.png","icon/Bsd.png","icon/vertex.png"];

//--------- Page Initialization  --------------//
initialize = function() {

	// --- Default Values --- //
	var CENTER_LAT = 33.312266545904116;
	var CENTER_LNG = -116.75886962890625;
	var latlng = new google.maps.LatLng(CENTER_LAT, CENTER_LNG);
	
	var MAP_TYPE = google.maps.MapTypeId.TERRAIN;
	var ZOOM_LEVEL = 6;
	
	google.maps.visualRefresh = true;
	
	// If ClientLocation was filled in by the loader, use that info instead of the default
    if (google.loader.ClientLocation) {
      latlng = new google.maps.LatLng(google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude);
    }
    else{	    
		var data = $.ajax(siteURL + "getCoordsFromIP.php",{
			async: false
		}).responseText;
		
		var parsedData = jQuery.parseJSON(data);
		
		if(parsedData.success == "true"){
			latlng = new google.maps.LatLng(parsedData.lat, parsedData.lng);
		}
    }
	
	var myStyles =[
	    {
	        featureType: "poi",
	        elementType: "labels",
	        stylers: [
	              { visibility: "off" }
	        ]
	    }
    ];
	
	var myOptions = {
			zoom: ZOOM_LEVEL,
			center: latlng,
			streetViewControl: false,
			mapTypeId: MAP_TYPE,
			styles: myStyles
	};
					 
	map = new google.maps.Map(document.getElementById("map_canvas"),myOptions);
	
	preloadIcons(icons);
	
	//If we're loading a previous sim, do it, otherwise get the page ready 
	if(loadSimID > 0){
	    loadSim(loadSimID);
    }
    else{
		SensorType.addNew();   
    }
    
	select(0);
	
	//Add advanced menu
	$("#advancedBtn").qtip({ // Grab some elements to apply the tooltip to
	    content: {
            text: $("#advancedMenu"), // Use the "div" element next to this for the content
            title: {
	            text: 'Advanced Menu',
	            button : 'close'
	        }
	    },
	    style: {
	        classes: 'qtip-light qtip-rounded'
        },
        position: {
        	my: 'middle left',  // Position my top left...
        	at: 'middle right', // at the bottom right of...
        	target: $('#advancedBtn') // my target
        },
        show: {
        	event: 'click',
        	solo: true
        },
        hide: {
        	target: $("#advancedBtn"),
        	event: 'click'
        }
    });
   
   if(tutorial){
	   loadTut(0);
   }
   
   showTutorialPopup();
   
}

preloadIcons = function(array) {
    $(array).each(function(){
        $('<img/>')[0].src = siteURL + this;
    });
}

showTutorialPopup = function(){
	if( getCookie("visited") == null ){
		setCookie("visited",1,10000);
		
		$("#tutBtn").qtip({ // Grab some elements to apply the tooltip to
		    content: {
	            text: "<h3>First time here? Take a look at the tutorial for some tips on how to use the simulator!</h3>", // Use the "div" element next to this for the content
	            title: {
		            button : 'close'
		        }
		    },
		    style: {
		        classes: 'qtip-blue qtip-rounded'
	        },
	        position: {
	        	my: 'top middle',  // Position my top left...
	        	at: 'bottom middle', // at the bottom right of...
	        	target: $('#tutBtn') // my target
	        },
	        show: {
		        ready: true
		    },
		    hide: {
			    delay: 10000
		    }
        });
	}
}

select = function(sensorType,shapeType){
	google.maps.event.clearListeners(map,'click');
	
	$(".sel").toggleClass('usel sel');

	currentSensorType = sensorType;

	if(sensorType!=0){
		if(shapeType =='sensor'){
			$("#m"+sensorType).toggleClass('usel sel');
			setUpListeners();
		}
		else if(shapeType=='quake'){
			$(".quake").toggleClass('usel sel');
			setUpListeners();
		}
		else if (shapeType =='area'){
			$("#a"+sensorType).toggleClass('usel sel');
			Area.place();
		}
	}
	else{
		$(".hand").toggleClass('usel sel');
		if(tutorial && tutStep == 10){
			loadTut(11);
		}
	}
}

setUpListeners = function(){
	if( $(".quake").hasClass("sel") ){
		google.maps.event.addListener(map, 'click', function(event) {
			Quake.place(event.latLng);
			if(tutorial && tutStep == 2){
				loadTut(3);
			}
		});
	}
	else if( $("#m"+currentSensorType).hasClass("sel") ){
		google.maps.event.addListener(map, 'click', function(event) {
			Marker.place(event.latLng);
			if(tutorial && tutStep == 7){
				loadTut(8);
			}
		});
	}
	else if( $("#a"+currentSensorType).hasClass("sel") ){
		console.log("area");
	}

}

//---- Save Simulation -----//

saveSim = function(){
	var error = false;
	
	//Check to see if the sim has a name
	if($("#sim_name").val()== ""){
		var message = "Please give your simulation a name."
		Quake.makeError("#sim_name", message);		
		error = true;
	}
	
	//Check to see that there is at least one marker
	if(markerArray.length == 0 && areaArray.length == 0){
		// Throw Error
		var message = "Please place at least one Sensor or Area."
		Quake.makeError("#m1", message);		
		error = true;
	}
		
	//Check to see if there's at least one Quake
	if(quakeArray.length == 0){
		// Throw Error
		var message = "Please place at least one Earthquake."
		Quake.makeError("#quakeTool", message);		
		error = true;
	}
	
	if(error)
		return;	

	// If there aren't any errors we can proceed

	$("#loadMsgText").html("Saving Simulation...");
	$("#loadMsg").css({ "display" : "block" });
	$("#loadBG").css({ "display" : "block" });
	
	var JSONdata = simToJSON();
	
	$.ajax({
			url: siteURL + "save.php",
			contentType:"application/json",
			dataType:"html",
			type: "POST",
			data: JSONdata,
			success: function(data){
				runSim(data);
			},
			error: function(){
				$("#loadMsg").css({ "display" : "none" });
				$("#loadBG").css({ "display" : "none" });
				Quake.makeError("#runBtn", "Request Error. Try again?");
			}
		});

}

runSim = function(data){
	try{
		data = jQuery.parseJSON(data);
	}
	catch(err){
		$("#loadMsg").css({ "display" : "none" });
		$("#loadBG").css({ "display" : "none" });
		Quake.makeError("#runBtn", "Something went wrong saving your simulation. Try again?");
		return;
	}
	
	
	//check to make sure the simulation was successful!
	if(data.savedID == null){
		$("#loadMsg").css({ "display" : "none" });
		$("#loadBG").css({ "display" : "none" });
		Quake.makeError("#runBtn", "Something went wrong with your simulation. Try again?");	
		return;
	}
	
	//Save simID to cookie
	addIDtoCookie(data.savedID);
	console.log("saving id: ",data.savedID);
	
	//If there aren't any errors we can proceed
	$("#loadMsgText").html("Running Simulation...");
	
	console.log("url: ","run.php?ID="+data.savedID);
	
	$.ajax({
		url: siteURL + "run.php?ID="+data.savedID,
		contentType:"application/json",
		dataType:"html",
		type: "POST",
		success: function(data){
			redirectToResults(data);
		},
		error: function(){
			$("#loadMsg").css({ "display" : "none" });
			$("#loadBG").css({ "display" : "none" });
			Quake.makeError("#runBtn", "Request Error. Try again?");
		}
	});
}

redirectToResults = function(data){
	console.log(data);

	data = jQuery.parseJSON(data);
	
	if(data.success == "true"){
		window.location.href = siteURL + 'results/'+data.simID;
	}
	else{
		$("#loadMsg").css({ "display" : "none" });
		$("#loadBG").css({ "display" : "none" });
		Quake.makeError("#runBtn", "Something went wrong with running your simulation. Try again?");
	}
	
}

addIDtoCookie = function(simID){
	var cookieName = "QCNexpSave";
	
	var preVal = getCookie(cookieName);
	
	if(preVal==null){
		var newVal = simID;
	}
	else{
		var newVal = preVal + "|" + simID;
	}

	console.log(newVal);

	setCookie(cookieName,newVal,10000,"/");

	
}

loadSim = function(loadID){
	var JSON = $.ajax({
		url: siteURL + "load.php?ID="+loadID,
		type: 'GET',
		dataType:"html",
		async: false
		}).responseText;
	
	//var simobj = eval('('+JSON+')');
	var simobj = jQuery.parseJSON( JSON );
	
	if(simobj==null){
		window.location.href = siteURL + 'editor/'
	}
	
	simobj = simobj.simulation;
	
	saveParam(simobj.parameters);
	SensorType.addLoaded(simobj.SensorTypes);	
	Marker.addLoaded(simobj.markers);	
	Area.addLoaded(simobj.areas);
	Quake.addLoaded(simobj.earthquakes);
		
}

clearSimEnviorment = function(){
	SensorType.removeAll();
	Marker.removeAll();
	Quake.removeAll();
	Area.removeAll();
}

saveParam = function(params){
	currentSimID = params.ID;
	$("#sim_name").val(params.sim_name);
	$("#sim_desc").val(params.sim_desc); 
	$("#sim_conn").val(params.sim_conn); 
	$("#cuttime").val(params.cuttime);
	$("#start_time").val(params.start_time); 
	$("#debug").val(params.debug);
	$("#sim_seed").val(params.sim_seed);
	$("#perfect").val(params.perfect);
	
	map.setCenter( new google.maps.LatLng(params.map.location.lat,params.map.location.lng) );
	map.setZoom( parseInt(params.map.zoom) );
	map.setMapTypeId( params.map.mapType );
}

// ---- Cookie Handlers ---- \\
getCookie = function(c_name){
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1){
		c_start = c_value.indexOf(c_name + "=");
	}
	
	if (c_start == -1){
		c_value = null;
	}
	else{
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1){
			c_end = c_value.length;
			}
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	
	return c_value;
}

setCookie = function(c_name,value,exdays,path){
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((path) ? ";path="+path:"") + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

beautifyNum = function(inNum){

	var str='';
	inNum=Math.floor(inNum);
	inNum=(inNum+'').split('').reverse();
	for (var i in inNum)
	{
		if (i%3==0 && i>0) str=','+str;
		str=inNum[i]+str;
	}
	
	return str;
}