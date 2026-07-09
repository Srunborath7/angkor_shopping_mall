import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../../store/authSlice";

import "./style/Dashboard.css";

function Dashboard() {
  const auth = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = () => {
    dispatch(clearAuth());
    navigate("/");
  };

  return (
    <div className="dashboard">

      {/* Sidebar */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">A</div>
          <div>
            <h3>Admin Panel</h3>
            <span>Management System</span>
          </div>
        </div>

        <ul className="menu">

          <li className="active">
            <i className="bi bi-speedometer2"></i>
            Dashboard
          </li>

          <li>
            <i className="bi bi-box"></i>
            Products
          </li>

          <li>
            <i className="bi bi-grid"></i>
            Categories
          </li>

          <li>
            <i className="bi bi-people"></i>
            Customers
          </li>

          <li>
            <i className="bi bi-cart"></i>
            Orders
          </li>

          <li>
            <i className="bi bi-bar-chart"></i>
            Reports
          </li>

          <li>
            <i className="bi bi-gear"></i>
            Settings
          </li>

        </ul>

      </aside>

      {/* Main */}

      <div className="main">

        {/* Header */}

        <header className="header">

          <div>
            <h2>Dashboard</h2>
            <p>Welcome back 👋</p>
          </div>

          <div className="user-box">

            <div className="avatar">
              {auth.role?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{auth.role}</strong>
              <p>Administrator</p>
            </div>

            <button
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>

          </div>

        </header>

        {/* Cards */}

        <div className="cards">

          <div className="card">
            <h4>Total Products</h4>
            <h1>248</h1>
            <span>+12%</span>
          </div>

          <div className="card">
            <h4>Total Orders</h4>
            <h1>1,540</h1>
            <span>+8%</span>
          </div>

          <div className="card">
            <h4>Total Customers</h4>
            <h1>962</h1>
            <span>+15%</span>
          </div>

          <div className="card">
            <h4>Revenue</h4>
            <h1>$18,250</h1>
            <span>+20%</span>
          </div>

        </div>

        {/* Content */}

        <div className="content">

          <div className="table-box">

            <h3>Recent Orders</h3>

            <table>

              <thead>

                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>

              </thead>

              <tbody>

                <tr>
                  <td>1</td>
                  <td>John Doe</td>
                  <td>
                    <span className="success">Completed</span>
                  </td>
                  <td>$250</td>
                </tr>

                <tr>
                  <td>2</td>
                  <td>David</td>
                  <td>
                    <span className="pending">Pending</span>
                  </td>
                  <td>$140</td>
                </tr>

                <tr>
                  <td>3</td>
                  <td>Smith</td>
                  <td>
                    <span className="cancel">Cancelled</span>
                  </td>
                  <td>$99</td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;