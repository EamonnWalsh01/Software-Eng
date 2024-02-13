document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById("myRange");
    var image = document.getElementById("bikeimg");

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        var rotation = this.value;
        image.style.transform = 'rotate(' + rotation +  'deg)';
    }
    
});