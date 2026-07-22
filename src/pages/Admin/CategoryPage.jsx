import React, {useEffect, useState} from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFolder
} from "react-icons/fa";

import Swal from "sweetalert2";

import { 
    categoriesApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi
} from "../../services/categoriesService";
import { useNavigate } from "react-router-dom";
import "./style/CategoryPage.css";


function CategoryPage(){
    const [categories,setCategories] = useState([]);
    const [search,setSearch] = useState("");
    const [loading,setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [name, setName] = useState("");
    const [note, setNote] = useState("");
    const fetchCategories = async()=>{
        try{
            setLoading(true);
            const res = await categoriesApi();
            setCategories(
                res.data || []
            );
        }catch(error){

            Swal.fire(
                "Error",
                error.message,
                "error"
            );

        }
        finally{

            setLoading(false);

        }

    };




    useEffect(()=>{

        fetchCategories();

    },[]);

    const openCreateModal = () => {
        setSelectedCategory(null);
        setName("");
        setNote("");
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedCategory(item);
        setName(item.name || "");
        setNote(item.note || item.description || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (selectedCategory) {
                // Edit mode
                await updateCategoryApi(selectedCategory.id, { name, note });
                Swal.fire("Success", "Category updated successfully", "success");
            } else {
                // Add mode
                await createCategoryApi({ name, note });
                Swal.fire("Success", "Category created successfully", "success");
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            Swal.fire("Error", error.message || "Failed to save category", "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory=(id)=>{


        Swal.fire({

            title:"Delete Category?",

            text:"This action cannot be undone",

            icon:"warning",

            showCancelButton:true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"


        }).then(async (result)=>{


            if(result.isConfirmed){
                try {
                    setLoading(true);
                    await deleteCategoryApi(id);
                    Swal.fire(
                        "Deleted!",
                        "Category removed",
                        "success"
                    );
                    fetchCategories();
                } catch (error) {
                    Swal.fire("Error", error.message || "Failed to delete category", "error");
                } finally {
                    setLoading(false);
                }


            }


        });


    };

    const filtered = categories.filter(item=>

        item.name
        ?.toLowerCase()
        .includes(
            search.toLowerCase()
        )

    );






return (

<div className="category-page">



    <div className="page-header">


        <div>

            <h1>
                Categories
            </h1>


            <p>
                Manage your product categories
            </p>


        </div>




        <button className="add-btn" onClick={openCreateModal}>

            <FaPlus/>

            Add Category

        </button>



    </div>







    <div className="category-card">



        <div className="toolbar">


            <div className="search">


                <FaSearch/>


                <input

                    placeholder="Search category..."

                    value={search}

                    onChange={
                        e=>setSearch(e.target.value)
                    }

                />


            </div>


        </div>







        {
            loading ?

            <div className="loading">

                Loading...

            </div>


            :



            <table>


                <thead>


                    <tr>

                        <th>
                            #
                        </th>


                        <th>
                            Category
                        </th>


                        <th>
                            Description
                        </th>


                        <th>
                            Products
                        </th>


                        <th>
                            Action
                        </th>


                    </tr>


                </thead>




                <tbody>



                {

                filtered.map((item,index)=>(


                    <tr key={item.id}>


                        <td>

                            {index+1}

                        </td>



                        <td>


                            <div className="category-name">


                                <div className="category-icon">

                                    <FaFolder/>

                                </div>



                                {item.name}



                            </div>


                        </td>





                        <td>

                            {
                                item.description || "-"
                            }

                        </td>




                        <td>

                            {item.products || 0}

                        </td>




                        <td>


                            <button className="edit-btn" onClick={() => openEditModal(item)}>

                                <FaEdit/>

                            </button>




                            <button

                                className="delete-btn"

                                onClick={()=>
                                    deleteCategory(item.id)
                                }

                            >

                                <FaTrash/>

                            </button>


                        </td>



                    </tr>


                ))

                }


                </tbody>



            </table>


        }



    </div>

    {isModalOpen && (
        <div className="modal-overlay">
            <div className="modal-container-card">
                <div className="modal-header">
                    <h3>{selectedCategory ? "Edit Category" : "Add Category"}</h3>
                    <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Category Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="Enter category name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Note / Description</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Enter description"
                            rows="4"
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}

</div>

);


}


export default CategoryPage;