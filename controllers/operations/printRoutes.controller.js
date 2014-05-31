module.exports = {
    get: {
        json: function (req, res) {
            return res.send(global.app.routes);
        }
    }
};
