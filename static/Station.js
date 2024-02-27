function initMap() {
    createDateDropdown();
            createTimeDropdown();
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 53.3498, lng: -6.2603 },
        zoom: 13,
        styles: [
      {
        featureType: "all",
        elementType: "all",
        stylers: [
          { saturation: -100 },
          { lightness: 50 }
        ]
      }
    ],
    
    streetViewControl: false,
    zoomControl: false,
    mapTypeControl: false,
    fullscreenControl: false
    });
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); 

   
    // const start = { lat: 53.3498, lng: -6.2603 }; // Example starting point
    // const end = { lat: 53.342886, lng: -6.256853 }; // Example ending point
   

    let currentInfowindow = null;
    let input = document.getElementById("pac-input");
    let searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", function() {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener("places_changed", function() {
        const places = searchBox.getPlaces();
        const place = places[0];
        if (!place.geometry) return;
        start = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        calculateAndDisplayRoute(directionsService, directionsRenderer, start, end);
        if (places.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        places.forEach(place => {
            if (!place.geometry) return;
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            
           
            fetchNearestStations(place.geometry.location.lat(), place.geometry.location.lng());
        });
        
        map.fitBounds(bounds);
        sidebar.style.display = 'block';
        anime({
        targets: '#sidebar',
        translateX: [-300, 20], 
        easing: 'easeOutQuad', 
        duration: 500 
    });
    anime({
        targets: '#pac-input',
        translateX: [350], 
        easing: 'easeOutQuad', 
        duration: 500 
    })
    });

    fetch('/stations')
        .then(response => response.json())
        .then(data => {
            data.forEach(station => {

                let color;
                if (station.available_bikes === 0) {
                    color = "red";
                } else if (station.available_bikes > 0 && station.available_bikes <= 5) {
                    color = "yellow";
                } else {
                    color = "green";
                }

                // Creating a colored pin
                let pinColor = color;
                let pinImage = new google.maps.MarkerImage("http://maps.google.com/mapfiles/ms/icons/" + pinColor + "-dot.png");

                let marker = new google.maps.Marker({
                    position: { lat: station.position_lat, lng: station.position_lng },
                    map: map,
                    icon: pinImage,
                    title: station.name
                });
                

                // Add click listener to each marker
                marker.addListener('click', function() {
                    fetch(`/availability/${station.number}`)
                        .then(response => response.json())
                        .then(availability => {
                            let content = `
                                <div>
                                    <h3>${station.name}</h3>
                                    <p>Available Bikes: ${availability.available_bikes}</p>
                                    <p>Available Stands: ${availability.available_bike_stands}</p>
                                    <p>Status: ${availability.status}</p>
                                    <p>Last Update: ${new Date(availability.last_update).toLocaleString()}</p>
                                </div>
                            `;
                           if (currentInfowindow) {
                                console.log("hello");
                                currentInfowindow.close();
                            }
                            let infowindow = new google.maps.InfoWindow({
                                content: content
                            });
                            
                            infowindow.open(map, marker);
                            currentInfowindow = infowindow;
                             end = { lat: station.position_lat, lng:station.position_lng };
                            calculateAndDisplayRoute(directionsService, directionsRenderer, start, end);
                        });
                });
                
            });
        });
}


function fetchNearestStations(lat, lng) {
    fetch(`/nearest-stations?lat=${lat}&lng=${lng}`)
        .then(response => response.json())
        .then(stations => {
            const sidebar = document.getElementById("sidebar");
            
            
            stations.forEach(station => {
                const element = document.createElement("div");
                element.className = 'station-info';

                const nameElement = document.createElement("div");
                nameElement.className = 'station-name';
                nameElement.textContent = `Name: ${station.name}`;
                element.appendChild(nameElement);

                const bikesElement = document.createElement("div");
                bikesElement.className = 'available-bikes';
                bikesElement.textContent = `Bikes Available: ${station.available_bikes}`;
                const infoElement = document.createElement("div");
                infoElement.className = 'sidebarInfoWindow';
                element.appendChild(bikesElement);
                element.appendChild(infoElement);
                sidebar.appendChild(element);
                
                element.addEventListener('click', function() {
                    fetch(`/availability/${station.number}`)
                        .then(response => response.json())
                        .then(availability => {
                            let content = `
                                
                                    
                                    Available Stands: ${availability.available_bike_stands}
                                    Status: ${availability.status}
                                    Last Update: ${new Date(availability.last_update).toLocaleString()}
                                
                            `;
                            
                            infoElement.textContent = content;
                            
                            infoElement.style.display = 'block';
                        });
                });
            })
            });
        ;
}
function createDateDropdown() {
    const select = document.createElement('select');
    select.id = 'dateDropdown';
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        select.appendChild(option);
    }
    document.getElementById('Dropdowns').appendChild(select);
}


function createTimeDropdown() {
    const select = document.createElement('select');
    select.id = 'timeDropdown';
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) { 
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            select.appendChild(option);
        }
    }
    document.getElementById('Dropdowns').appendChild(select);
}
function calculateAndDisplayRoute(directionsService, directionsRenderer, start, end) {
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.WALKING 
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        }
    );
}