const gendrate = () => {
    var new_generated = Math.floor(1000 + Math.random() * 9000);
    return new_generated
}

module.exports = {
    gendrate
}