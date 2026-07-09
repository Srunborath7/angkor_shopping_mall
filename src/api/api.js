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
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await axios({
            baseURL: config.base_url,
            url,
            method,
            data,
            headers,
        });

        return response.data;
    } catch (err) {
        throw err.response?.data || err;
    }
};