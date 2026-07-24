import { api } from "../api/api";

export const CustomersApi = (data)=>{

    return api(
        "/api/users/customers",
        "get",
        data
    );

};

export const createCutomersApi=(data)=>{

    return api(
        "/api/users",
        "post",
        data
    );

};

export const updateCustomersApi=(id,data)=>{

    return api(
        `/api/users/${id}`,
        "put",
        data
    );

};

export const deleteCustomersApi=(id)=>{

    return api(
        `/api/users/${id}`,
        "delete"
    );

};