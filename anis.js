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
const toggleSwitch = document.querySelector('#checkbox');
const videoContent = document.getElementById('vid');
const imageContent = document.getElementById('image');

// Function to toggle video and image
function toggleContent(isChecked) {
    if (isChecked) {
      imageContent.style.display = "block"; // Show video for dark mode
        videoContent.style.display = "none"; // Hide image
    } else {
      imageContent.style.display = "none"; // Hide video
      videoContent.style.display = "block"; // Show image for light mode
    }
}

// Check if there's a saved theme preference and set the content accordingly
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    toggleSwitch.checked = currentTheme === 'dark-mode';
    toggleContent(toggleSwitch.checked);
}

// Event listener for the toggle switch
toggleSwitch.addEventListener('change', function() {
    toggleContent(this.checked);
    localStorage.setItem('theme', this.checked ? 'dark-mode' : 'light-mode');
});
