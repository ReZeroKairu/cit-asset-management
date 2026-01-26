import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", { email, password });
      login(res.data.token, res.data.user); // Save to Context
    } catch (err: any) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-page bg-body-secondary d-flex justify-content-center align-items-center min-vh-100">
      <div className="login-box" style={{ width: "360px" }}>
        <div className="card card-outline card-primary">
          <div className="card-header text-center">
            <h1 className="mb-0">
              <b>CIT</b> Asset Mgr
            </h1>
          </div>
          <div className="card-body login-card-body">
            <p className="login-box-msg">Sign in to start your session</p>

            {error && <div className="alert alert-danger text-sm">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="input-group-text">
                  <span className="bi bi-envelope"></span>
                </div>
              </div>
              <div className="input-group mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="input-group-text">
                  <span className="bi bi-lock-fill"></span>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    Sign In
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
