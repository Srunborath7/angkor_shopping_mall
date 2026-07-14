import React from "react";
import {
    FaDollarSign,
    FaShoppingCart,
    FaUsers,
    FaBox,
    FaChartLine,
    FaArrowUp,
    FaCheckCircle,
    FaClock
} from "react-icons/fa";

import "./style/Dashboard.css";


function Dashboard() {


    const cards = [

        {
            title:"Total Revenue",
            value:"$125,850",
            percent:"+12%",
            icon:<FaDollarSign/>
        },

        {
            title:"Total Orders",
            value:"2,450",
            percent:"+8%",
            icon:<FaShoppingCart/>
        },

        {
            title:"Customers",
            value:"8,540",
            percent:"+15%",
            icon:<FaUsers/>
        },

        {
            title:"Products",
            value:"560",
            percent:"+20%",
            icon:<FaBox/>
        }

    ];



    const products = [

        {
            icon:"📱",
            name:"iPhone 15 Pro",
            sales:"120 sales"
        },

        {
            icon:"💻",
            name:"ASUS Laptop",
            sales:"95 sales"
        },

        {
            icon:"🎧",
            name:"AirPods",
            sales:"80 sales"
        }

    ];



    const orders = [

        {
            id:1,
            customer:"Dara Srun",
            product:"iPhone 15 Pro",
            price:"$1200",
            status:"Completed"
        },


        {
            id:2,
            customer:"Sokha",
            product:"ASUS Laptop",
            price:"$850",
            status:"Pending"
        },


        {
            id:3,
            customer:"John",
            product:"AirPods",
            price:"$250",
            status:"Completed"
        }


    ];



    return (

        <div className="dashboard-layout">


            <main className="dashboard-main">


                {/* Header */}

                <section className="dashboard-header">

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Welcome back 👋 Manage your store here
                    </p>

                </section>



                {/* Cards */}

                <div className="stats-grid">


                    {
                        cards.map((item,index)=>(

                            <div
                                className="stat-card"
                                key={index}
                            >


                                <div className="stat-icon">

                                    {item.icon}

                                </div>



                                <div>


                                    <h4>
                                        {item.title}
                                    </h4>


                                    <h2>
                                        {item.value}
                                    </h2>


                                    <span>

                                        <FaArrowUp/>

                                        {item.percent}

                                    </span>


                                </div>


                            </div>

                        ))
                    }


                </div>




                {/* Chart + Products */}


                <div className="dashboard-grid">



                    <div className="panel">


                        <div className="panel-header">

                            <h3>
                                Sales Overview
                            </h3>


                            <FaChartLine/>

                        </div>



                        <div className="chart">


                            <div className="bar bar1"></div>

                            <div className="bar bar2"></div>

                            <div className="bar bar3"></div>

                            <div className="bar bar4"></div>

                            <div className="bar bar5"></div>

                            <div className="bar bar6"></div>


                        </div>



                    </div>






                    <div className="panel">


                        <h3>
                            Top Products
                        </h3>



                        {
                            products.map((product,index)=>(


                                <div 
                                    className="product-item"
                                    key={index}
                                >


                                    <div className="product-image">

                                        {product.icon}

                                    </div>



                                    <div>


                                        <strong>
                                            {product.name}
                                        </strong>


                                        <p>
                                            {product.sales}
                                        </p>


                                    </div>


                                </div>



                            ))
                        }



                    </div>




                </div>






                {/* Orders */}



                <div className="panel">


                    <h3>
                        Recent Orders
                    </h3>



                    <div className="order-panel">


                        <table>


                            <thead>

                                <tr>

                                    <th>
                                        Customer
                                    </th>


                                    <th>
                                        Product
                                    </th>


                                    <th>
                                        Price
                                    </th>


                                    <th>
                                        Status
                                    </th>


                                </tr>

                            </thead>




                            <tbody>


                            {
                                orders.map(order=>(


                                    <tr key={order.id}>


                                        <td>
                                            {order.customer}
                                        </td>


                                        <td>
                                            {order.product}
                                        </td>


                                        <td>
                                            {order.price}
                                        </td>


                                        <td>


                                            {
                                                order.status==="Completed"?


                                                <span className="completed">

                                                    <FaCheckCircle/>

                                                    Completed

                                                </span>


                                                :


                                                <span className="pending">

                                                    <FaClock/>

                                                    Pending

                                                </span>

                                            }


                                        </td>


                                    </tr>


                                ))
                            }


                            </tbody>


                        </table>


                    </div>


                </div>




            </main>


        </div>

    );

}


export default Dashboard;