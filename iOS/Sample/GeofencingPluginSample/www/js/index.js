/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // `load`, `deviceready`, `offline`, and `online`.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
	    document.addEventListener('region-update', function(event) {
			var fid = event.regionupdate.fid;
			var status = event.regionupdate.status;
			var regions = Region.all().filter("fid", '=', fid);
			regions.list(null, function (results) {
		        $(results).each(function(index, item){
		            if (fid == item.fid) {
		                if(status == "enter") {
							item.currentlyHere = "yes";
						} else {
							alert("no");
							item.currentlyHere = "no";
						}
					}
		        });
			});
			persistence.flush(function() {
				var regions = Region.all(); // Returns QueryCollection of all Projects in Database
				regions.list(null, function (results) {
					var list = $( "#mainPage" ).find( ".lstMyRegions" );
					//Empty current list
			        list.empty();
					//Use template to create items & add to list
					$( "#regionItem" ).tmpl( results ).appendTo( list );
					//Call the listview jQuery UI Widget after adding 
					//items to the list allowing correct rendering
					list.listview( "refresh" );
				});	
			});
	    });
    },
    // deviceready Event Handler
    //
    // The scope of `this` is the event. In order to call the `receivedEvent`
    // function, we must explicity call `app.receivedEvent(...);`
    onDeviceReady: function() {
		var exec = cordova.require('cordova/exec');
	    exec.setJsToNativeBridgeMode(exec.jsToNativeModes.IFRAME_NAV);
        fsclient = new FourSquareClient(fsAPI_KEY, fsAPI_SECRET, "", true);
    }
};

// Global Variables
var root = this;
var fsclient
var currentLocation;
var currentLandL;
var nearbyLocations;

// Set this to your FourSquare API Key and Secret
var fsAPI_KEY = "1OYPMZW55HEI5CHOJ0AH4EGJATOF0TQD3Z03PRNAJZIKWTPM";
var fsAPI_SECRET = "HG4IHVAI4E01RFR135PLJ5TERNKYTDAGQWG0VUSRWEGIKLIG";

function retrieveLocations() {
	$.mobile.showPageLoadingMsg();
	navigator.geolocation.getCurrentPosition(onRetrieveLocationSuccess, onRetrieveLocationError);
}
function onRetrieveLocationSuccess(position){
	
	//DGGeofencing.regionMonitorUpdate({"status":"left","fid":"31.896099425829057,35.01764486981446"});
	
	currentLandL = position.coords.latitude+","+position.coords.longitude;
	console.log(currentLandL);
	// var params = {"fid": currentLandL, "radius": 15, "latitude": position.coords.latitude, "longitude": position.coords.longitude, "accuracy": ""};
	// 	console.log(params);
	// 	DGGeofencing.addRegion(
	// 		params,
	// 		function(result) { 
	// 			console.log("add success");
	// 			var region = new Region();
	// 			region.fid = params.fid;
	// 			region.name = currentLandL;
	// 			region.accuracy = 0;
	// 			region.radius = 15;
	// 			region.address = currentLandL;
	// 			region.latitude = position.coords.latitude;
	// 			region.longitude = position.coords.longitude;
	// 			region.currentlyHere = "yes";
	// 		    persistence.add(region); 
	// 		    persistence.flush(function() {
	// 				var regions = Region.all(); // Returns QueryCollection of all Projects in Database
	// 				regions.list(null, function (results) {
	// 					var list = $( "#mainPage" ).find( ".lstMyRegions" );
	// 					//Empty current list
	// 			        list.empty();
	// 					//Use template to create items & add to list
	// 					$( "#regionItem" ).tmpl( results ).appendTo( list );
	// 					//Call the listview jQuery UI Widget after adding 
	// 					//items to the list allowing correct rendering
	// 					list.listview( "refresh" );
	// 				});	
	// 				$.mobile.hidePageLoadingMsg();
	// 			});   
	//       	},
	//       	function(error) {   
	// 	  		alert("failed to add region");
	//       	}
	// 	);
	// 	
	// 	
	// 	return;
	
	var parameters = {
		ll: currentLandL, 
		limit: '10', 
		radius: '550'
	};
	fsclient.venuesClient.search(parameters, {
		onSuccess: function(data) {
			nearbyLocations = data.response.venues;
			$.mobile.changePage("#selectlocation");
			clearNearbyLocations();
			$.mobile.hidePageLoadingMsg();
            var list = $("#selectlocation .locationlist");
			//Use template to create items & add to list
			$( "#locationItem" ).tmpl( nearbyLocations ).appendTo( list );
			//Call the listview jQuery UI Widget after adding 
			//items to the list allowing correct rendering
			list.listview( "refresh" ); 
		},
		onFailure: function(data) {
			alert('Failed to retrieve locations. Please Try again. : ' + data.response);
			$.mobile.hidePageLoadingMsg();
		}
	});
}
function onRetrieveLocationError(){
	$.mobile.hidePageLoadingMsg();
	//alert('code: '    + error.code    + '\n' +
	//	  'message: ' + error.message + '\n');
	alert("Please enable location services for Region Tracker in your Settings App and then try again.");
} 
function clearNearbyLocations() {
	var list = $( "#selectlocation .locationlist" );
    //Empty current list
    list.empty();
	//Call the listview jQuery UI Widget after adding 
	//items to the list allowing correct rendering
	list.listview( "refresh" );
} 

function doSelectLocation(id) {
	// Check if project already exists
	var regions = Region.all(); // Returns QueryCollection of all Regions in Database
	var boolRegionExists = false;
	regions.list(null, function (results) {
        $(results).each(function(index, item){
            if (id == item.fid) {
                $.mobile.changePage("#mainPage");
                boolRegionExists = true;
            }
        });
		if(!boolRegionExists) {
            $(nearbyLocations).each(function(index, item){
				if( id == item.id) {
					currentLocation = item;
                	doAddLocation(item);
					return;
				}
			});	
		}
	});
}

function doAddLocation(location) {
	$.mobile.showPageLoadingMsg();

	console.log("add");
	// Send Add to Native Code for Region Monitoring
	var params = {"fid": location.id, "radius": 15, "latitude": location.location.lat, "longitude": location.location.lng, "accuracy": ""};
	console.log(params);
	DGGeofencing.addRegion(
		params,
		function(result) { 
			console.log("add success");
			var region = new Region();
			region.fid = currentLocation.id;
			region.name = currentLocation.name;
			region.accuracy = 0;
			region.radius = 15;
			region.address = currentLocation.location.address;
			region.latitude = currentLocation.location.lat;
			region.longitude = currentLocation.location.lng;
			region.currentlyHere = "yes";
		    persistence.add(region); 
		    persistence.flush(function() {
				console.log("persistence flush success");
			  	$.mobile.changePage("#mainPage");	
				$.mobile.hidePageLoadingMsg();
			});   
      	},
      	function(error) {   
	  		alert("failed to add region");
      	}
	);
}

function deleteRegion(id) {
	$.mobile.showPageLoadingMsg();
	var regions = Region.all().filter("fid", '=', id);
	regions.list(null, function (results) {
        $(results).each(function(index, item){
            if (id == item.fid) {
                var params = {"fid": item.fid, "latitude": item.latitude, "longitude": item.longitude, };
				DGGeofencing.removeRegion(
					params,
					function(result) { 
						persistence.remove(item);
						persistence.flush(function() {
                            var regions = Region.all(); // Returns QueryCollection of all Projects in Database
							regions.list(null, function (results) {
								var list = $( "#mainPage" ).find( ".lstMyRegions" );
								//Empty current list
						        list.empty();
								//Use template to create items & add to list
								$( "#regionItem" ).tmpl( results ).appendTo( list );
								//Call the listview jQuery UI Widget after adding 
								//items to the list allowing correct rendering
								list.listview( "refresh" );
							});
							$.mobile.hidePageLoadingMsg();
						});    
			      	},
			      	function(error) {  
						alert("delete error")
						$.mobile.hidePageLoadingMsg();    
			      	}
				);
			}
        });
	});
	$.mobile.hidePageLoadingMsg();
}
    
function showMapForLocation(id) {
        $(nearbyLocations).each(function(index, item){
			if( id == item.id) {
				currentLocation = item;
				$.mobile.changePage("#map_page");
				return;
			}
		});
}