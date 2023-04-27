

exports.verifyTempLogin = (req, res, next) => {
    if (req.session.tempUser) {
        next();
    } else {
        res.redirect('/');
    }
};