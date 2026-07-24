import axios from "axios";
import { config } from "./request";
import { store } from "../store/store";

export const api = async (
    url,
    method = "GET",
    data = null
) => {
    const token = store.getState()?.auth?.token;

    const headers = {
        Accept: "application/json",
    };

    if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const axiosConfig = {
            baseURL: config.base_url,
            url,
            method,
            headers,
        };

        if (data !== null && data !== undefined) {
            axiosConfig.data = data;
        }

        const response = await axios(axiosConfig);

        return response.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};