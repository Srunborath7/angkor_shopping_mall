import React, {useState} from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import Navbar from "../layout/Navbar";
import "./MainLayout.css";

function MainLayout(){
    const [open,setOpen] = useState(false);
    const logout = ()=>{
        console.log("logout");

    };
    return (
        <div className="layout">
            <Sidebar
                open={open}
                setOpen={setOpen}
            />
            <div className="main-content">
                <Navbar
                    setOpen={setOpen}
                    logout={logout}
                />
                <main className="page-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}

export default MainLayout;