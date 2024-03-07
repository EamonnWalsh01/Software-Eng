let start = {}
let end = {}
function initMap() {
   
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
    fullscreenControl: false,
    ClickableIcons:false,
    });
    
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); 

   
    // const start = { lat: 53.3498, lng: -6.2603 }; // Example starting point
    // const end = { lat: 53.342886, lng: -6.256853 }; // Example ending point
    let settingFlag = 0;
    let opencloseFlag = 0;
    let currentInfowindow = null;
    let settingBox = document.getElementById('settingBox');
    let openClose = document.getElementById("openClose");
    let input = document.getElementById("pac-input");
    let settingsIMG = document.getElementById("settingIMG");
    let searchBox = new google.maps.places.SearchBox(input);
    let weatherBox = document.getElementById("weatherbox");
    let settingsCog = document.getElementById("settingsWheel");
    let slider = document.getElementById("myRange");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(openClose);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(weatherBox); // weatherBox is used before it's defined
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(slider);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(settingsCog);
    slider.addEventListener('input', function() {
        const newLat = parseFloat(this.value)/10000000000;
        const currentLng = map.getCenter().lng();
        const currentlat = map.getCenter().lat(); 
        const newCenter = { lat: newLat+currentlat, lng: currentLng };
        map.setCenter(newCenter);
    });
    fetch(`/weather?lat=53.3498&lng=-6.2603`)
    .then(response => response.json()) 
    .then(data => {
        // Correctly accessing nested attributes
       
        let contentWeather = `
       
            <h3>Weather Info</h3>
            <p>Temperature: ${data[0]['temp']}</p>
            <p>Weather description: ${data[0]['weather_desc']}</p>
            
        
    `;  
       document.getElementById('weatherInfo').innerHTML = contentWeather

    

    });
    
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
        targets: ['#pac-input','#settingsWheel','#openClose'],
        translateX: [350], 
        easing: 'easeOutQuad', 
        duration: 500 
    });opencloseFlag = 1;
    });

    fetch('/stations')
        .then(response => response.json())
        
        .then(data => {
            data.forEach(station => {

                let color;
                if (station.available_bikes === 0) {
                    color = "red";
                    pinImageUrl = "red_bike.png"
                } else if (station.available_bikes > 0 && station.available_bikes <= 5) {
                    color = "yellow";
                    pinImageUrl = "yellow_bike.png"
                } else {
                    color = "green";
                    pinImageUrl = "green_bike.png"
                }

                // Creating a colored pin
                let pinColor = color;
                let pinImage = new google.maps.MarkerImage("http://maps.google.com/mapfiles/ms/icons/" + pinColor + "-dot.png");

                
                const marker = new google.maps.Marker({
                    position: { lat: station.position_lat, lng: station.position_lng },
                    map: map,
                    title: station.name, 
                    icon: {
                        url: pinImageUrl, 
                        scaledSize: new google.maps.Size(150, 150), 
                    },
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
        weatherBox.addEventListener('click',function(){
            weatherInfo =  document.getElementById('weatherInfo')
            
            if (weatherInfo.style.display=='block'){
                weatherInfo.style.display = 'None';
                console.log("hello5");
            }else{
                weatherInfo.style.display = 'block';
                console.log("hello1");
            }
        })
        settingsIMG.addEventListener('click',function(){
            if (settingFlag == 0){
                settingFlag = 1;
            anime( {
                targets:"#settingIMG",
                rotate:{
                value: '+=2turn', // 0 + 2 = '2turn'
                duration: 1800,
                easing: 'easeInOutSine'}
              })
              anime({
                targets: '#settingBox',
                translateY: [-500, 0], 
                easing: 'easeOutQuad', 
                duration: 1000 ,
                })
              settingBox.style.display = 'block';
            }
            else{
                settingFlag = 0;
                anime( {
                    targets:"#settingIMG",
                    rotate:{
                    value: '+=2turn', // 0 + 2 = '2turn'
                    duration: 1800,
                    easing: 'easeInOutSine'}
                  })
                  anime({
                    targets: '#settingBox',
                    translateY: [0, -500], 
                    easing: 'easeInQuad', 
                    duration: 1000 ,
                    complete: function(anim) {
                        // Once the sidebar animation is complete, apply display: none to the sidebar
                        document.querySelector('#settingBox').style.display = 'none';}
                        
                    })
                  
                }
        })
            
        closeButton = document.getElementById("close");
        closeButton.addEventListener('click',function(){
            opencloseFlag = 0;
            anime({
                targets: '#sidebar',
                translateX: [0, -500], 
                easing: 'easeInQuad', 
                duration: 500 ,
                complete: function(anim) {
            // Once the sidebar animation is complete, apply display: none to the sidebar
            document.querySelector('#sidebar').style.display = 'none';}
            });
            anime({
                targets:  ['#pac-input','#settingsWheel','#openClose'],
                translateX: [300, 20], 
                easing: 'easeInQuad', 
                duration: 500 
            });
                })
        openClose.addEventListener('click',function(){
            
            if (opencloseFlag == 0 ){anime({
                targets: '#sidebar',
                translateX: [-300, 20], 
                easing: 'easeOutQuad', 
                duration: 500 
            });
            anime({
                targets:  ['#pac-input','#settingsWheel','#openClose'],
                translateX: [350], 
                easing: 'easeOutQuad', 
                duration: 500 

            })
            sidebar.style.display = 'block'
            opencloseFlag = 1}
            else{
                opencloseFlag = 0
                anime({
                    targets: '#sidebar',
                    translateX: [0, -500], 
                    easing: 'easeInQuad', 
                    duration: 500 ,
                    complete: function(anim) {
                // Once the sidebar animation is complete, apply display: none to the sidebar
                document.querySelector('#sidebar').style.display = 'none';}
                });
                anime({
                    targets: ['#pac-input','#settingsWheel','#openClose'],
                    translateX: [300, 20], 
                    easing: 'easeInQuad', 
                    duration: 500 
                });
            }
        })
            
}


function fetchNearestStations(lat, lng) {
    fetch(`/nearest-stations?lat=${lat}&lng=${lng}`)
        .then(response => response.json())
        .then(stations => {
            const sidebar = document.getElementById("sidebar");
            
            
            stations.forEach(station => {
                const element = document.createElement("div");
                element.className = 'station-info';
                console.log(station)
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
                           
       
                            <h3>Additioinal Info</h3>
                            <p>Availible Stands: ${availability.available_bike_stands}</p>
                            <p>Status: ${availability.status}</p>
                            <p>Last Update: ${new Date(availability.last_update).toLocaleString()}</p>
                        
                    

                            `;
                            infoElement.innerHTML = content;
                            if (infoElement.style.display=='block'){
                                infoElement.style.display = 'None';
                                console.log("hello5");
                            }else{
                                infoElement.style.display = 'block';
                                console.log("hello1");
                            }
                            

                            
                        });
                });
            })
            });
        ;
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
