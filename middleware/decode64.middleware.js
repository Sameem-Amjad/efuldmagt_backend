
function decode64FilesMiddleware(keysList) {
    return (req, res, next) => {
        for (let i = 0; i < keysList.length; i++) {
            if (req.body[keysList[i]]) {

                // console.log(req.body);
                const base64Data = req.body[keysList[i]].replace(/^data:image\/png;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                // console.log("base64", base64Data);
                delete req.body[keysList[i]];
                req.files = {
                    ...req.files,
                    [keysList[i]]: [{ buffer, originalname: keysList[i] + '.png', mimetype: 'image/png' }]
                };
            }
        }
        next();
    }
}

function decode64FileMiddleware(key) {
    return (req, res, next) => {
        if (req.body[key]) {
            const base64Data = req.body[key].replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            delete req.body[key];
            req.file = { buffer, originalname: key + '.png', mimetype: 'image/png' }
        }
        next();
    }
}

module.exports = { decode64FilesMiddleware, decode64FileMiddleware };