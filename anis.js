document.addEventListener('DOMContentLoaded', function() {
  var slider = document.getElementById("myRange");
  // Get both elements by their IDs
  var bikeImage = document.getElementById("bikeimg");
  var mapperImage = document.getElementById("mapper");
  const myButton = document.getElementById('randomiser');
  myButton.addEventListener('click', function() {
    // Define what happens when the button is clicked.
    
    const randomNumber = Math.floor(Math.random() * (360 + 1));
    bikeImage.style.transform = 'rotate(' + randomNumber + 'deg)';
      mapperImage.style.transform = 'rotate(' + randomNumber + 'deg)';
});
  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
      var rotation = this.value;
      // Apply rotation to both elements
      bikeImage.style.transform = 'rotate(' + rotation + 'deg)';
      mapperImage.style.transform = 'rotate(' + rotation + 'deg)';
  }
});

function initMap() {
  var map = new google.maps.Map(document.getElementById('DEMO_MAP_ID'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8,
    // Apply grayscale style
    styles: [
      {
        featureType: "all",
        elementType: "all",
        stylers: [
          { saturation: -100 },
          { lightness: 50 }
        ]
      }
    ]
  });
}
function initMap() {
  var map = new google.maps.Map(document.getElementById('DEMO_MAP_ID'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8,
    styles: [
      {
        featureType: "all",
        elementType: "all",
        stylers: [
          { saturation: -100 },
          { lightness: 50 }
        ]
      }
    ]
  });
}
