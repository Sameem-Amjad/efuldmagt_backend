const jwt = require('jsonwebtoken');

const authorization  = {
    encryptUser(user, role, key){
        const token = jwt.sign(
            {...user, role: role},
            key || process.env.TOKEN_SECRET || USER_KEY
        );
        return token;
    },
    
    decryptUser(token){
        
    },

    isUserAuthorized(user, feature){
        let allowed = false;
        
        user.access.forEach((item)=>{
            if(item == feature)
                allowed = true;
        })

        return allowed;
    }
}

module.exports = authorization;