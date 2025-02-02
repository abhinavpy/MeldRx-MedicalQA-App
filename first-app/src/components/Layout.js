import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout = () => (
  <div className="layout">
    <Navigation />
    <main className="content">
      <Outlet />
    </main>
  </div>
);

export default Layout;