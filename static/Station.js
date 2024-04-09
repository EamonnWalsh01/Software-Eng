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
    let clock = document.getElementById("section");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(openClose);
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
                                    <a href="javascript:void(0)" class="info-link" onclick="openNav(${station.number})">More Info</a>
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
async function openNav(stationNumber) {
    // Use Anime.js to animate opening the sidebar
    anime({
        targets: '#graphArea',
        width: '600px', // Sidebar width when open
        easing: 'easeInOutQuad', // Animation easing function
        duration: 500 // Duration of the animation in milliseconds
    });

    
    const response = await fetch(`/station/${stationNumber}`);
    const json_data = await response.json();
    console.log(json_data);
    // Create Historical Data button
    const historicalDataBtn = document.getElementById('historicalDataBtn');
    historicalDataBtn.addEventListener('click', function() {
        fetchAndPlotHistoricalData(stationNumber);
    });

    // Create Predictive Data button (placeholder for now)
    const predictiveDataBtn = document.getElementById('predictiveDataBtn');
    predictiveDataBtn.addEventListener('click', function() {
        showPredictiveArea(stationNumber);
        console.log('Predictive data function to be implemented');
    });

    
} 
function closeNav() {
    document.getElementById("dataContainer").innerHTML = '';
    anime({
      targets: '#graphArea',
      width: '0px', // Sidebar width when closed
      easing: 'easeInOutQuad',
      duration: 500
    });
  }

  function showPredictiveArea(number) {
    const area = document.getElementById('dataContainer');
    if (area !== null) {
        area.innerHTML = ''; 
    }

    var form = document.createElement("form");
    form.innerHTML = `
        <label for="dateTime">Select Date and Time (within next 5 days):</label>
        <input type="datetime-local" id="dateTime" name="dateTime" required>
        <input type="hidden"  name="number" value=${number}>
        <button type="submit" id="submitBtn">Predict</button>
    `;

    area.appendChild(form);

    var now = new Date();
    var fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    document.getElementById("dateTime").setAttribute("min", now.toISOString().slice(0, -8));
    document.getElementById("dateTime").setAttribute("max", fiveDaysFromNow.toISOString().slice(0, -8));


    area.innerHTML += '<p id="prediction-answer">Available Predictions: </p>'

    // Helper function to create a button
    function createButton(label, date, station) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = 'predictive-btn'; // Add a class to identify buttons
        btn.dataset.date = date; // Store the date in a data attribute
        btn.dataset.station = station; // Store the station number in a data attribute
        return btn;
    }

    // Generate dates for Today, Tomorrow, and the next 3 days
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    // Array of day names to use for button labels
    const dayNames = ["Today", "Tomorrow"];
    for (let i = 2; i < 5; i++) {
        dayNames.push(dates[i].toLocaleDateString('en-US', { weekday: 'long' }));
    }

    // Create and append buttons to the predictive area
    dates.forEach((date, index) => {
        const label = dayNames[index];
        const formattedDate = date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        const button = createButton(label, formattedDate, number);
        area.appendChild(button);
    });

    
}

document.addEventListener('DOMContentLoaded', function() {
    // Add a click event listener to the dataContainer for the day predictioin button.
    const area = document.getElementById('dataContainer');

    area.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON' && event.target.classList.contains('predictive-btn')) {
            const date = event.target.dataset.date;
            const number = event.target.dataset.station;
            document.querySelectorAll('.predictive-btn').forEach(function(button) {
                button.classList.remove('active-btn');
            });
            
            // Add active class to the clicked button
            event.target.classList.add('active-btn');
            fetchAndPlotPredictiveData(number, date);
        }
    });

    area.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON' && event.target.id === 'submitBtn') {
            event.preventDefault();
            var selectedDateTime = document.getElementById("dateTime").value;
            var number = document.querySelector('input[name="number"]').value;
            predictByDateTime(number, selectedDateTime);
            
        }
    });

});
  



  async function fetchAndPlotHistoricalData(stationNumber) {
    try {
        const area = document.getElementById('dataContainer');
        if (area !== null) {
            area.innerHTML = ''; 
        }
        // Fetch the historical data from the Flask backend
        const response = await fetch(`/data/historical/${stationNumber}`);
        const json_data = await response.json();
        
        const dates = json_data.map(item => item.last_update);
        const availability = json_data.map(item => item.available_bikes);

        // Ensure the graphArea is clear before plotting a new graph
        const graphArea = document.getElementById('dataContainer');
        graphArea.innerHTML += '<canvas id="bikeAvailabilityChart"></canvas>';
        console.log(dates);
        console.log(availability);

        // ... inside your fetchAndPlotHistoricalData function ...

        const labels = dates.map(date => {
            // Create a date object from the date string
            const dateObj = new Date(date);
            // Get hours in 24-hour format
            let hours = dateObj.getHours();
            // Convert to 12-hour format with AM/PM
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours} ${ampm}`;
        });

        const data = {
            labels: labels,
            datasets: [{
                label: 'Bike Station Availability',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: availability,
                fill: false,
                pointRadius: 0 // Set the point radius to 0 to remove the markers
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                title: {
                    display: true,
                    text: 'Bike Availability in the Last 24 Hours'
                },
                animation: {
                    onComplete: () => {
                        anime({
                            targets: '#bikeAvailabilityChart',
                            keyframes: [
                                {scale: 0.9},
                                {scale: 1.0},
                            ],
                            duration: 500,
                            easing: 'easeOutElastic(1, .8)'
                        });
                    }
                },
                // Additional options for scales might be required depending on your exact needs
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Hour of the Day'
                        },
                        ticks: {
                            // Prevent compression of labels by setting autoSkip to false
                            autoSkip: false
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Available Bikes'
                        }
                    }]
                },
                // Disable interaction points (tooltips)
                tooltips: {
                    enabled: false
                }
            }
        };

        // Make sure you are getting the correct canvas element by its id
        const availabilityGraph = new Chart(
            document.getElementById('bikeAvailabilityChart'),
            config
        );

        
    } catch (error) {
        console.error('Failed to fetch and plot historical data:', error);
    }
}


async function fetchAndPlotPredictiveData(stationNumber, date) {
    
        // Fetch the historical data from the Flask backend
        console.log(date);
        

    try {
        // Fetch the historical data from the Flask backend
        var month = date.split('-')[1];
        var day = date.split('-')[2];
        const response = await fetch(`/data/predictive/${stationNumber}/${month}/${day}`);
        const json_data = await response.json();
        
        const dates = json_data.map(item => item.time);
        
        const availability = json_data.map(item => item.availability);

        // Ensure the graphArea is clear before plotting a new graph
        const graphArea = document.getElementById('dataContainer');
        graphArea.innerHTML += '<canvas id="bikeAvailabilityChart"></canvas>';
        
        console.log(availability);


        const labels = dates.map(date => {
            
            const dateObj = new Date(date*1000);
            // Get hours in 24-hour format
            let hours = dateObj.getHours();
            // Convert to 12-hour format with AM/PM
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours} ${ampm}`;
        });

        const data = {
            labels: labels,
            datasets: [{
                label: 'Bike Station Availability',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: availability,
                fill: false,
                pointRadius: 0 // Set the point radius to 0 to remove the markers
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                title: {
                    display: true,
                    text: 'Bike Availability in the Last 24 Hours'
                },
                animation: {
                    onComplete: () => {
                        anime({
                            targets: '#bikeAvailabilityChart',
                            keyframes: [
                                {scale: 0.9},
                                {scale: 1.0},
                            ],
                            duration: 500,
                            easing: 'easeOutElastic(1, .8)'
                        });
                    }
                },
                // Additional options for scales might be required depending on your exact needs
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Hour of the Day'
                        },
                        ticks: {
                            // Prevent compression of labels by setting autoSkip to false
                            autoSkip: false
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Available Bikes'
                        }
                    }]
                },
                // Disable interaction points (tooltips)
                tooltips: {
                    enabled: false
                }
            }
        };

        // Make sure you are getting the correct canvas element by its id
        const availabilityGraph = new Chart(
            document.getElementById('bikeAvailabilityChart'),
            config
        );

        
    } catch (error) {
        console.error('Failed to fetch and plot historical data:', error);
    }
    
}


async function predictByDateTime(stationNumber, dateTime) {
    console.log(stationNumber);
    console.log(dateTime);
    try{
        
        dateTime = new Date(dateTime);

        var month = dateTime.getMonth() + 1; // Months are zero-based, so add 1
        var date = dateTime.getDate();
        var epochTimeInSeconds = Math.floor(dateTime.getTime() / 1000);
        const response = await fetch(`/data/predictivetime/${stationNumber}/${month}/${date}/${epochTimeInSeconds}`);
        const json_data = await response.json();
        console.log(json_data);
        document.getElementById('prediction-answer').textContent = `Available Predictions: ${json_data[0]}`;
    }catch (error) {
        console.error('Failed to predict by date time:', error);
    }
}
function fetchNearestStationsPredictive(lat,long,dateTime){
    fetch(`/nearest-stations?lat=${lat}&lng=${lng}`)
        .then(response => response.json())
        .then(stationsPredict => {
            const sidebar = document.getElementById("sidebar");
            
            var month = dateTime.getMonth() + 1; // Months are zero-based, so add 1
            var date = dateTime.getDate();
            var epochTimeInSeconds = Math.floor(dateTime.getTime() / 1000);
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
                bikesElement.textContent = `Bikes Available: ${predictByDateTime(stationNumber, dateTime)}`;
                const infoElement = document.createElement("div");
                infoElement.className = 'sidebarInfoWindow';
                element.appendChild(bikesElement);
                element.appendChild(infoElement);
                sidebar.appendChild(element);
                
                element.addEventListener('click', function() {
                    fetch(`/data/predictive/${number}/${month}/${day}`)
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
function recolour(){
    async function recolour() {
        // Assuming stationNumbers is an array of station IDs/numbers you want predictions for
        const stationNumbers = [1, 2, 3, 4]; // Example station numbers, replace with your actual data source
    
        const today = new Date();
        const month = today.getMonth() + 1; // JavaScript months are 0-based
        const day = today.getDate();
        const seconds = today.getHours() * 3600 + today.getMinutes() * 60 + today.getSeconds();
    
        for (let number of stationNumbers) {
            const url = `/data/predictivetime/${number}/${month}/${day}/${seconds}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const predictions = await response.json();
                // Assuming predictions is an array with a single item for the predicted number of bikes
                const available_bikes = predictions[0];
    
                let pinImageUrl;
                if (available_bikes === 0) {
                    pinImageUrl = "red_bike.png";
                } else if (available_bikes > 0 && available_bikes <= 5) {
                    pinImageUrl = "yellow_bike.png";
                } else {
                    pinImageUrl = "green_bike.png";
                }
    
                // Assuming you have a function to update or create a marker for a station
                updateMarker(number, available_bikes, pinImageUrl);
            } catch (error) {
                console.error('Failed to fetch prediction:', error);
            }
        }
    }
}