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
   

    let currentInfowindow = null;
    let input = document.getElementById("pac-input");
    let searchBox = new google.maps.places.SearchBox(input);
    let weatherBox = document.getElementById("weatherbox");
    let settingsCog = document.getElementById("settingsWheel");
    let slider = document.getElementById("myRange");
    let clock = document.getElementById("section");
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(weatherBox); // weatherBox is used before it's defined
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(slider);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(settingsCog);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(clock);
    slider.addEventListener('input', function() {
        const newLat = parseFloat(this.value)/10000000000;
        const currentLng = map.getCenter().lng();
        const currentlat = map.getCenter().lat(); 
        const newCenter = { lat: newLat+currentlat, lng: currentLng };
        map.setCenter(newCenter);
    });
    fetch(`/weather`)
    .then(response => response.json()) 
    .then(data => {
        // Correctly accessing nested attributes
       
        let contentWeather = `
       
            <h3>Weather Info</h3>
            <p>Temperature: ${data[0]['temp']}</p>
            <p>Weather description: ${data[0]['weather_desc']}</p>
            
        
    `;  
       document.getElementById('weatherInfo').innerHTML = contentWeather;
       let daylight=true;
       let containers=document.getElementById('weatherbox');
       let temp=(Math.round(data[0]['temp']-273.15)).toString()+"&deg;C";
       document.getElementById('temperature').innerHTML=temp;
       let currentWeather=data[0]['weatherid'];
       if (data[0]['sunset']<=data[0]['time']||data[0]['sunrise']>=data[0]['time']){
        daylight=false;
        containers.style.backgroundColor='navy';
       }else{
        daylight=true;
       }

       const image=document.getElementById('weatherimg')
       if (currentWeather>=800){
        if(currentWeather==800){
            if (daylight==true){
                image.src="weathericons/Sunny.png";
            }else{
                image.src="weathericons/clearnight.png";
            }
        }else if (currentWeather==801){
            if (daylight==true){
                image.src="weathericons/few_clouds.png";
            }else{
                image.src="weathericons/few_clouds_night.png";
            }
        }else if(currentWeather==802){
            image.src="weathericons/scattered_clouds.png";
        }else if(currentWeather==803 || currentWeather==804){
            image.src="weathericons/broken_clouds.png";
        }
    }else if(currentWeather>=700){
        if(currentWeather<=761||currentWeather==771){
            image.src="weathericons/mist.png";
        }else if(currentWeather==762){
            image.src="weathericons/ash.png";
        }else{
            image.src="weathericons/tornado.png";
        }
    }else if(currentWeather>=600){
        image.src="weathericons/snow.png";
    }else if(currentWeather>=500){
        if(currentWeather<=506){
            if (daylight==true){
                image.src="weathericons/rain.png";
            }else{
                image.src="weathericons/rain_night.png";
            } 
        }else if(currentWeather==511){
            image.src="weathericons/snow.png";
        }else{
            image.src="weathericons/shower_rain.png";
        }
    }else if(currentWeather>=300){
        image.src="weathericons/shower_rain.png";
    }else if(currentWeather>=200){
        image.src="weathericons/thunderstorm.png";
    }
}
);
    
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
        targets: ['#pac-input','#settingsWheel'],
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
        // weatherBox.addEventListener('click',function(){
        //     weatherInfo =  document.getElementById('weatherInfo')
            
        //     if (weatherInfo.style.display=='block'){
        //         weatherInfo.style.display = 'None';
        //         console.log("hello5");
        //     }else{
        //         weatherInfo.style.display = 'block';
        //         console.log("hello1");
        //     }
        // })
        settingsCog.addEventListener('click',function(){
            console.log("hello")
            anime( {
                targets:"#settingsWheel",
                rotate:{
                value: '+=2turn', // 0 + 2 = '2turn'
                duration: 1800,
                easing: 'easeInOutSine'}
              })})
        closeButton = document.getElementById("close");
        closeButton.addEventListener('click',function(){
            anime({
                targets: '#sidebar',
                translateX: [0, -500], 
                easing: 'easeOutQuad', 
                duration: 500 ,
                complete: function(anim) {
            // Once the sidebar animation is complete, apply display: none to the sidebar
            document.querySelector('#sidebar').style.display = 'none';}
            });
            anime({
                targets: '#pac-input',
                translateX: [300, 20], 
                easing: 'easeOutQuad', 
                duration: 500 
            });
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
