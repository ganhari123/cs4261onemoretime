$(document).ready(function(){

	console.log('Hello');

	$.fn.sendIngrediantsToCart = function(msg) {
		
    };

});

function getRecipe(msg) {
	var str = msg.split('/');
	console.log("/getRecipeDetails/".concat(str[str.length - 1]));
	window.location.href = "/getRecipeDetails/".concat(str[str.length - 1]);
}