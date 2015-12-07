//Supposed to make LocalStorage Easier
//noinspection JSUnusedGlobalSymbols
Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

//noinspection JSUnusedGlobalSymbols
Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};
$( window ).resize(function() {
	$('.row-offcanvas').removeClass('active');
	$('.overlay').removeClass('active');
	$('body').removeClass('sidebar')
});
// $('#myCarousel').carousel({
//     // interval: 1000
// }); 

// $("#myCarousel").carousel();
