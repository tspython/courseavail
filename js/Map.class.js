
var scuTilebounds = {
	14: [[2642, 2642], [6357, 6357]],
	15: [[5284, 5285], [12713, 12715]],
	16: [[10568, 10571], [25427, 25429]],
	17: [[21136, 21142], [50855, 50860]],
	18: [[42273, 42286], [101711, 101721]],
	19: [[84548, 84572], [203423, 203439]]
 };

function GoogleMap (container) {
	if ( container instanceof jQuery) {
		domElmt = container[0];
	} else {
		domElmt = document.getElementById(container);

	}
	this.map = new google.maps.Map(domElmt, {
		zoom: 16,
		maxZoom: 19,
		center: {lat: 37.349452, lng: -121.937642},
		streetViewControl:false
	});
	var scuOver = new google.maps.ImageMapType({
		getTileUrl: function(coord, zoom) {
		  if (zoom < 14 || zoom > 19 ||
			  scuTilebounds[zoom][0][0] > coord.x || coord.x > scuTilebounds[zoom][0][1] ||
			  scuTilebounds[zoom][1][0] > coord.y || coord.y > scuTilebounds[zoom][1][1]) {
			return null;
		  }
			return  '/apps/map/images/tiles/std/img_' +coord.x+'_'+coord.y+'.png';	
		},
		tileSize: new google.maps.Size(256, 256)
	});
	this.map.overlayMapTypes.push(scuOver);
	this.pins = [];

	this.bounds = new google.maps.LatLngBounds();
}

 
GoogleMap.prototype.addPin = function(pinUid,lat,longt,pincolor,pinlabel,labeltxt) {
	pincolor = def(pincolor,'9a9cff');
	pinlabel = def(pinlabel,'%E2%80%A2');
	labeltxt = def(labeltxt,'');
	var ll = new google.maps.LatLng(lat, longt);
	var pinShadow = new google.maps.MarkerImage("https://chart.googleapis.com/chart?chst=d_map_pin_shadow",new google.maps.Size(40, 37),new google.maps.Point(0, 0),new google.maps.Point(12, 35));
	var pinImage = new google.maps.MarkerImage("https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld="+pinlabel+"|" + pincolor, new google.maps.Size(21, 34),  new google.maps.Point(0,0),  new google.maps.Point(10, 34));
	var marker = new google.maps.Marker({
		position: ll, 
		map: this.map,
		icon: pinImage,
		shadow: pinShadow,
		zIndex: 500 
	});

	if ( labeltxt != '' ) {

	/*	var infowindow = new google.maps.InfoWindow({
			content: labeltxt, zIndex: 500 
		});
		marker.addListener('click', function() {
		  infowindow.open(this.map, marker);
		});*/
		console.log(labeltxt+'...');

		overlapped = null;
		for ( var k = 0; k < this.pins.length; k++ ) {
			if (this.pins[k][2] == lat && this.pins[k][3] == longt ) {
				overlapped = this.pins[k][4];
				break;
			}
		}
		if (overlapped == null ) {
			var infowindow = new google.maps.InfoWindow({
				content: labeltxt, zIndex: 500 
			});
			marker.addListener('click', function() {
			  infowindow.open(this.map, marker);
			});
			
			this.pins.push([pinUid,marker,lat,longt,infowindow]);
		} else {
			useText = labeltxt+ ',<br>'+overlapped.content;
		   	overlapped.setContent(useText);
			overlapped.addListener('click', function() {
			  infowindow.open(this.map, marker);
			});
			
		}
	} else {
		this.pins.push([pinUid,marker,lat,longt,null]);
	}

	this.bounds.extend(marker.getPosition());
	if ( this.pins.length == 1 ) {
		this.map.setCenter(new google.maps.LatLng(lat, longt));
		this.map.setZoom(17);
	} else {
		this.map.fitBounds(this.bounds);
	}
};


GoogleMap.prototype.clearPins = function( ) {
	for (var i = 0; i < this.pins.length; i++) {
	  this.pins[i][1].setMap(null);
	}
	this.pins = [];
}



GoogleMap.prototype.removePin = function(pinUid ) {
	for (var i = 0; i < this.pins.length; i++) {
		if (this.pins[i][0] == pinUid ) {
	  		this.pins[i][1].setMap(null);
			this.pins.splice(i,1);
		}
	}
}



GoogleMap.prototype.zoomTo = function(level ) {
	this.map.setZoom(level);
}


 
