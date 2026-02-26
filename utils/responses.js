function messageResponse(message) {
    return {
        success: true,
        message
    }
}

function dataResponse(message, data) {
    return {
        success: true,
        message,
        data
    }
}

function errorResponse(error) {
    let errorBody = {
        success: false,
        message: error.message || error,
        navigateTo: error.navigateTo || false,
        allowSignNow: error.allowSignNow || false
    }
    return errorBody
}


module.exports = { messageResponse, dataResponse, errorResponse }