function getLocation(msg) {
    var replaced = msg.split(' ').join('+');
    window.location.href = "/getLocation/".concat(replaced);
}

