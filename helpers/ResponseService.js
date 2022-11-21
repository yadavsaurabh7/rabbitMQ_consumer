module.exports = {
  json: function(message, data,status) {
    const response = {
      message: message,
      data: {},
      status:status
    };
    if (typeof data !== 'undefined') {
      response.data = data;
    }

    return JSON.stringify(response);
    // return response;
  }
};
