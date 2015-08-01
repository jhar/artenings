// Global variables
var map, infowindow, vm, mapStyle;

function entity(name, lat, lng, pid) {
	this.name = ko.observable(name);
	this.lat = ko.observable(lat);
	this.lng = ko.observable(lng);
	this.pid = ko.observable(pid);
	this.visible = ko.observable(true);

	// Create marker
	this.marker = new google.maps.Marker({
		position: new google.maps.LatLng(lat,lng),
		map: map,
		title: name,
		animation: google.maps.Animation.DROP,
	});

	// Add infowindow to marker when clicked
	google.maps.event.addListener(this.marker, 'click', function openWindow() {

		vm.markerHasBeenClicked(true);

		// Update time stamp
		var timeStamp = Math.floor(Date.now() / 1000);

		// Call view model's function to set content of info-view div
		vm.setInfoViewContent(pid, timeStamp);

		// Make API call for location's FB cover photo
		window.getCoverPhoto(pid, function(response) {

			// Recenter map to clicked marker
			map.setCenter(this.marker.getPosition());

			// Set the content of the infowindow
			infowindow.setContent('<div class="info-window">' +
								  '<h5 class="info-name">' +
								  		name +
								  	'</h5>' +
								  	'<img class="cover-photo" src=\"' +
								  		response +
								  	'\">' +
								  '</div>');

			// Open the infowindow
			infowindow.open(map,this.marker);

		}, this);
	}.bind(this));
}

function ViewModel(fbStatus) {
	var self = this;
	self.neighborhood = ko.observable();
	self.entities = ko.observableArray();
	self.loggedIn = ko.observable();
	self.showList = ko.observable(true);
	self.eventList = ko.observableArray();
	self.futureEvents = ko.observable(false);
	self.markerHasBeenClicked = ko.observable(false);

	// Load JSON location data
	self.loadData = function() {
		$.getJSON("../pasadena.json", function(data) {
			self.neighborhood(data.neighborhood);

			// Clear entities array so that it isn't populated twice
			self.entities.removeAll();

			// Load location data into entities array
			for (i = 0; i < data.locations.length; i++) {
				self.entities.push(new entity(
					data.locations[i].name,
					data.locations[i].lat,
					data.locations[i].lng,
					data.locations[i].pid
				));
			}
		});
	}

	// Clicks markers when list item is clicked
	self.clickedListItem = function() {
		google.maps.event.trigger(this.marker, 'click');
	}

	// Begins Facebook login process
	self.login = function() {
		window.loginFlow();
	}

	// Begins Facebook logout process
	self.logout = function() {
		window.logoutFlow();
	}

	// Live search function
	self.liveSearch = function(model, obj) {
		var pattern = new RegExp(obj.currentTarget.value.toLowerCase());
		for (i = 0; i < self.entities().length; i++) {
			if (pattern.test(self.entities()[i].name().toLowerCase())) {
				self.entities()[i].marker.setVisible(true);
				self.entities()[i].visible(true);
			} else {
				self.entities()[i].marker.setVisible(false);
				self.entities()[i].visible(false);
			}
		}
	}

	// Set content of info-view, this is called by a marker object
	self.setInfoViewContent = function(pid, timeStamp) {
		// Get FB events by pid
		window.getEvents(pid, timeStamp, function(response) {
			console.log(response.data);
			self.eventList(response.data);
		}, this);
	}

}

// Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
// Found at: http://knockoutjs.com/examples/animatedTransitions.html
ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
};

var mapInit = function() {
	// Create Google Map
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 34.150596, lng: -118.137817},
		zoom: 14
		});

	// Style the map
	mapStyle = [
	  {
	    "featureType": "poi",
	    "stylers": [
	      { "visibility": "off" }
	    ]
	  }
	];

	map.setOptions({styles: mapStyle});


	// Create infowindow to attach to markers
	infowindow = new google.maps.InfoWindow({
		content: "No content loaded"
	});
}

var appInit = function() {
	// Create view model object and apply bindings
	vm = new ViewModel();
	ko.applyBindings(vm);

	// Initialize material (should this go here?)
	$.material.init();
}









