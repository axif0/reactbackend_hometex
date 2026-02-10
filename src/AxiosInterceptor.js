import axios from "axios";
import GlobalFunction from './assets/GlobalFunction'


axios.interceptors.request.use(function (config) {
    if (localStorage.token !== undefined) {
        config.headers['Authorization'] = `Bearer ${localStorage.token}`
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});


axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (error.response?.status === 401) {
        GlobalFunction.logOut()
    }
    // Don't redirect on 500 - let the component handle it
    return Promise.reject(error);
});