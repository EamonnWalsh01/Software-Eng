let start = {}
let end = {}
let markers = {};
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
    let timeSetting=document.getElementById("timeSet");
    let timeBoc=document.getElementById("timeBox");
    let updateTime = document.getElementById("updateTime");
    let predTime = document.getElementById("predTime")
    let predDate = document.getElementById("predDate")

    //Limit Dates to range of weather predictions
    //Set Minimum Date as today
    var today = new Date();
    var minDate=today.toISOString().split('T')[0];
    document.getElementById("predDate").setAttribute("min", minDate);

    //Set Maximum Date as 5 days in the future(End of weather predictions)
    var enddate = new Date();
    enddate.setDate(enddate.getDate()+5);
    var maxDate = enddate.toISOString().split('T')[0];
    document.getElementById("predDate").setAttribute("max", maxDate);

    
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(openClose);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(weatherBox); // weatherBox is used before it's defined
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(slider);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(settingsCog);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(clock);
    
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
                    number:station.number,
                    icon: {
                        url: pinImageUrl, 
                        scaledSize: new google.maps.Size(150, 150), 
                    },
                    
                } );
                markers[station.number] = marker;
                                

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
       
       
        timeBox.addEventListener('click',function(){
            if (settingFlag == 0){
                settingFlag = 1;
                timeSetting.style.display='block';
            }
            else{
                settingFlag = 0;
                timeSetting.style.display='none'; 
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
        updateTime.addEventListener('click',function(){  // Assuming stationNumbers is an array of station IDs/numbers you want predictions for
            console.log(predTime);
            const stationNumbers = Array.from({length: 117}, (x, i) => i); // Example station numbers, replace with your actual data source
            
            let predTimeValue = predTime.value;
            console.log(predTimeValue);
            let predDateValue = predDate.value;
            const today = predTimeValue;
            const month = today.getMonth() + 1; // JavaScript months are 0-based
            const day = today.getDate();
            const seconds = predTimeValue.getHours() * 3600 + predTimeValue.getMinutes() * 60 + predTimeValue.getSeconds();
            console.log(today,seconds);
            for (let number of stationNumbers) {
                const url = `/data/predictivetime/${number}/${month}/${day}/${seconds}`;
                
                try {
                    const response =  fetch(url);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const predictions = response.json();
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
            }})
            var date = document.getElementById('dateInput').value;
    
            
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
function updateMarker(number, available_bikes, pinImageUrl) {
    if (markers[number]) {
        // Assuming markers[number] is a Google Maps Marker instance
        markers[number].setIcon({
            url: pinImageUrl,
            scaledSize: new google.maps.Size(150, 150) // Adjust size as needed
        });
        // Optional: update title or other marker properties here
    } else {
        // If marker doesn't exist, create it (assuming you have the position)
        markers[number] = new google.maps.Marker({
            position: { /* position */ },
            map: map,
            icon: {
                url: pinImageUrl,
                scaledSize: new google.maps.Size(150, 150) // Adjust size as needed
            }
        });
    }
}
async function recolour() {
    console.log('Starting recolour process...');
    const stationNumbers = Array.from({length: 117}, (_, i) => i); 
    console.log(stationNumbers);
    
    // Example fixed date and time, replace with your actual values
    var predTimeValue = predTime.value;
    var predDateValue = predDate.value;
    var fullDateTime = new Date(predDateValue + 'T' + predTimeValue);
    // Convert fixedDateTime to month, day, and seconds as needed for the URL
    const month = fullDateTime.getMonth()+1; // JavaScript months are 0-based
    const day = fullDateTime.getDate();
    const epochTime = fullDateTime.getTime();
    
    const threeHoursInMilliseconds = 10800000;
    const roundedEpochTime = Math.round(epochTime / threeHoursInMilliseconds) * threeHoursInMilliseconds;
    const fetchPromises = stationNumbers.map(number => {
        const url = `/data/predictive/${number}/${month}/${day}`;
        return fetch(url)
            .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
            .then(data => {
                // Assuming data is an array of predictions
                // Find the prediction closest to the roundedEpochTime
                const closestPrediction = data.reduce((prev, curr) => {
                    return (Math.abs(curr.time * 1000 - roundedEpochTime) < Math.abs(prev.time * 1000 - roundedEpochTime) ? curr : prev);
                });
                return {
                    number,
                    predictions: closestPrediction
                };
            }).catch(error => ({
                number,
                error
            }));
    });

    const results = await Promise.allSettled(fetchPromises);

    results.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error) {
            console.log('success')
            const { number, predictions } = result.value;
            const available_bikes = Math.round(predictions.availability);

            let pinImageUrl = available_bikes === 0 ? "red_bike.png" : available_bikes > 0 && available_bikes <= 5 ? "yellow_bike.png" : "green_bike.png";
            updateMarker(number, available_bikes, pinImageUrl);
        } else {
            console.error(`Failed to fetch prediction for station ${result.value.number}:`, result.value.error);
        }
        console.log('finished function')
    });
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
    const stationData = json_data[0];

    const container = document.getElementById('station-container');
    container.innerHTML = '<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">×</a>'; // Clear the container before adding new content

    // Create station name header
    const nameHeader = document.createElement('h1');
    nameHeader.textContent = stationData.name;
    container.appendChild(nameHeader);

    // Create a wrapper for info containers to align them with address and bike stands
    const infoWrapper = document.createElement('div');
    infoWrapper.classList.add('info-wrapper');

    // Create available bikes container
    const bikeContainer = document.createElement('div');
    bikeContainer.classList.add('info-container');
    bikeContainer.innerHTML = `<img src="bike.png" alt="Bike Icon"> <p>Available Bikes: ${stationData.available_bikes}</p>`;
    infoWrapper.appendChild(bikeContainer);

    // Create banking info container
    const bankingContainer = document.createElement('div');
    bankingContainer.classList.add('info-container');
    const bankingInfo = stationData.banking ? 'Banking Available' : 'No Banking';
    bankingContainer.innerHTML = `<img src="card.png" alt="Card Icon"> <p>${bankingInfo}</p>`;
    infoWrapper.appendChild(bankingContainer);

    // Append the info wrapper to the main container
    container.appendChild(infoWrapper);

    // Create a wrapper for address and bike stands to facilitate side-by-side layout
    const addressStandsWrapper = document.createElement('div');
    addressStandsWrapper.classList.add('address-stands-container');

    // Create address paragraph
    const addressPara = document.createElement('p');
    addressPara.textContent = `Address: ${stationData.address}`;
    addressStandsWrapper.appendChild(addressPara);

    // Create bike stands paragraph
    const standsPara = document.createElement('p');
    standsPara.textContent = `Bike Stands: ${stationData.bike_stands}`;
    addressStandsWrapper.appendChild(standsPara);

    // Append the address and bike stands wrapper to the info wrapper for side-by-side layout
    infoWrapper.appendChild(addressStandsWrapper);



    // Create Historical Data button
    const historicalDataBtn = document.getElementById('historicalDataBtn');
    historicalDataBtn.addEventListener('click', function() {
        //fetchAndPlotHistoricalData(stationNumber);
        document.getElementById('dataContainer').innerHTML = '';
        fetchAndPlotData(stationNumber, 'historical');
        
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
            //fetchAndPlotPredictiveData(number, date);
            fetchAndPlotData(number, 'predictive', date);
        }
    });

    area.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON' && event.target.id === 'submitBtn') {
            event.preventDefault();
            var selectedDateTime = document.getElementById("dateTime").value;
            var number = document.querySelector('input[name="number"]').value;
            
            // Create date objects for the current time, selected time, and 5 days from now
            var currentDate = new Date();
            var selectedDate = new Date(selectedDateTime);
            var fiveDaysFromNow = new Date(currentDate);
            fiveDaysFromNow.setDate(currentDate.getDate() + 5);
            
            // Ensure the selected date is within the next 5 days
            if (selectedDate > currentDate && selectedDate <= fiveDaysFromNow) {
                predictByDateTime(number, selectedDateTime);
            } else {
                alert('Please select a date and time within the next 5 days.');
            }
        }
    });

});
  


async function fetchAndPlotData(stationNumber, type, date) {
    try {
        const graphArea = document.getElementById('dataContainer');
        const canvasElement = document.getElementById('bikeAvailabilityChart');
        if (canvasElement) {
            canvasElement.remove();
        }
        graphArea.innerHTML += '<canvas id="bikeAvailabilityChart"></canvas>';

        let url, label;
        if (type === 'historical') {
            url = `/data/historical/${stationNumber}`;
            label = 'Historical Bike Availability';
        } else if (type === 'predictive') {
            const [year, month, day] = date.split('-');
            url = `/data/predictive/${stationNumber}/${month}/${day}`;
            label = 'Predictive Bike Availability';
        }

        const response = await fetch(url);
        const jsonData = await response.json();

        const canvas = document.getElementById('bikeAvailabilityChart');
        const ctx = canvas.getContext('2d');

        let labels = [];
        let dataPoints = jsonData.map(item => {
            let timeStamp, xValue, yValue;
            if (type === 'historical') {
                timeStamp = new Date(item.last_update);
                xValue = `${timeStamp.getHours()}:${('0'+timeStamp.getMinutes()).slice(-2)}`; // Ensures minutes are two digits
                yValue = item.available_bikes;
            } else {
                timeStamp = new Date(item.time*1000);
                xValue = `${timeStamp.getHours()}:${('0'+timeStamp.getMinutes()).slice(-2)}`; // Ensures minutes are two digits
                yValue = item.availability;
            }
            labels.push(xValue);
            return { x: xValue, y: yValue };
        });

        // Unique labels for historical data to avoid duplicate time labels
        if (type === 'historical') {
            labels = [...new Set(labels)];
        }

        let gradient = ctx.createLinearGradient(0, canvas.clientHeight, 0, 0);
        gradient.addColorStop(0, 'rgb(255, 205, 86)');
        gradient.addColorStop(1, 'rgb(75, 192, 192)');

        const data = {
            labels: labels,
            datasets: [{
                label,
                data: dataPoints,
                borderColor: gradient,
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }]
        };

        const config = {
            type: 'line',
            data,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: label
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: labels,
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Available Bikes'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        };

        new Chart(ctx, config);
    } catch (error) {
        console.error('Failed to fetch and plot data:', error);
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
        document.getElementById('prediction-answer').textContent = `Predicted Availability: ${json_data[0]}`;
    }catch (error) {
        console.error('Failed to predict by date time:', error);
    }
}



