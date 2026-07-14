import { api } from "../api/api";

export const categoriesApi = (data) => {
    return api(
        "/api/categories",
        "get",
        data
    );
};
// export const UpdateCategoriesAPI = (data) => {
//     return api(
//         `/api/categories/{:id}`
//     )
// }