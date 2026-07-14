import React, {useEffect, useState} from "react";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaFolder
} from "react-icons/fa";

import Swal from "sweetalert2";

import { categoriesApi } from "../../services/categoriesService";
import { useNavigate } from "react-router-dom";
import "./style/CategoryPage.css";


function CategoryPage(){


    const [categories,setCategories] = useState([]);

    const [search,setSearch] = useState("");

    const [loading,setLoading] = useState(false);



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

    const deleteCategory=(id)=>{


        Swal.fire({

            title:"Delete Category?",

            text:"This action cannot be undone",

            icon:"warning",

            showCancelButton:true,


        }).then((result)=>{


            if(result.isConfirmed){


                Swal.fire(
                    "Deleted!",
                    "Category removed",
                    "success"
                );


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




        <button className="add-btn">

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


                            <button className="edit-btn">

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



</div>

);


}


export default CategoryPage;