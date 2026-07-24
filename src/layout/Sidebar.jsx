import React from "react";
import {
  FaTachometerAlt,
  FaBox,
  FaTh,
  FaUsers,
  FaShoppingCart,
  FaChartBar,
  FaCog,
  FaTimes,
  FaStore,
  FaBookmark
} from "react-icons/fa";
import logo from "../assets/logo.jpg";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import "./style/Sidebar.css";

function Sidebar({ open, setOpen }) {
  const menus = [

    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/admin/dashboard"
    },

    {
      name: "Products",
      icon: <FaBox />,
      path: "/admin/products"
    },

    {
      name: "Categories",
      icon: <FaTh />,
      path: "/admin/categories"
    },

    {
      name: "Brands",
      icon: <FaBookmark/>,
      path: "/admin/brands"
    },
    {
      name: "Customers",
      icon: <FaUsers />,
      path: "/admin/customers"
    },


    {
      name: "Orders",
      icon: <FaShoppingCart />,
      path: "/admin/orders"
    },


    {
      name: "Reports",
      icon: <FaChartBar />,
      path: "/admin/reports"
    },


    {
      name: "Settings",
      icon: <FaCog />,
      path: "/admin/settings"
    }

  ];

  return (<>
    {
      open &&
      <div
        className="sidebar-overlay"
        onClick={() => setOpen(false)}
      />
    }
    <aside
      className={`sidebar ${open ? "show" : ""}`}
    >
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
             <img src={logo} alt="AngkorMall Logo" />
          </div>
          <div>
            <h2>
              Angkor Shopping Mall
            </h2>
            <span>
              Admin Panel
            </span>
          </div>
        </div>
        <button
          className="close-sidebar"
          onClick={() => setOpen(false)}
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>
      </div>
      <ul className="sidebar-menu">
        {
          menus.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ?
                    "menu-link active"
                    :
                    "menu-link"

                }
              >
                <span className="menu-icon">
                  {item.icon}
                </span>
                <span>
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))
        }
      </ul>
      <div className="sidebar-footer">

        <p>
          © 2026 Angkor Shopping Mall
        </p>

      </div>
    </aside>
  </>

  );

}
export default Sidebar;